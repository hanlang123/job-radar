/**
 * build-cooccurrence.ts - 计算技能共现矩阵
 *
 * 从 jobs 表中提取每个岗位的技能列表，
 * 计算每对技能在同一 JD 中出现的次数和平均薪资，
 * 写入 skill_cooccurrence 表。
 *
 * 用法：
 *   pnpm --filter @job-radar/server build-cooccurrence
 */
import { DataSource } from 'typeorm'
import * as fs from 'fs'
import * as path from 'path'

import { JobEntity } from '../apps/server/src/modules/job/entities/job.entity'
import { SkillCooccurrenceEntity } from '../apps/server/src/modules/job/entities/skill-cooccurrence.entity'
import { UserEntity } from '../apps/server/src/modules/user/entities/user.entity'
import { ChatSessionEntity } from '../apps/server/src/modules/ai/entities/chat-session.entity'

/** 从环境变量或默认值获取数据库配置 */
function getDbConfig() {
  const envPath = path.resolve(__dirname, '../.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim()
          const val = trimmed.slice(eqIdx + 1).trim()
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  }

  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'jobRadar',
    password: process.env.DATABASE_PASSWORD || 'jobRadar123',
    database: process.env.DATABASE_NAME || 'jobRadar',
  }
}

async function main() {
  const dbConfig = getDbConfig()

  const dataSource = new DataSource({
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [JobEntity, SkillCooccurrenceEntity, UserEntity, ChatSessionEntity],
    synchronize: true,
  })

  await dataSource.initialize()
  console.log('✅ 数据库连接成功')

  const jobRepo = dataSource.getRepository(JobEntity)
  const coRepo = dataSource.getRepository(SkillCooccurrenceEntity)

  // 读取所有岗位的技能和薪资
  const jobs = await jobRepo.find({
    select: ['skills', 'salaryMin', 'salaryMax'],
  })

  console.log(`📊 共 ${jobs.length} 条岗位数据`)

  // 计算共现矩阵
  // key: "skillA|skillB" (alphabetical order), value: { count, totalSalary }
  const cooccurrence = new Map<string, { count: number; totalSalary: number; salaryCount: number }>()

  for (const job of jobs) {
    const skills = job.skills || []
    if (skills.length < 2) continue

    // 计算该岗位的平均薪资
    let avgSalary: number | null = null
    if (job.salaryMin != null && job.salaryMax != null) {
      avgSalary = (job.salaryMin + job.salaryMax) / 2
    }

    // 两两组合
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        const [a, b] = [skills[i], skills[j]].sort()
        const key = `${a}|${b}`

        const existing = cooccurrence.get(key) || { count: 0, totalSalary: 0, salaryCount: 0 }
        existing.count++
        if (avgSalary !== null) {
          existing.totalSalary += avgSalary
          existing.salaryCount++
        }
        cooccurrence.set(key, existing)
      }
    }
  }

  console.log(`📊 共 ${cooccurrence.size} 个技能对`)

  // 清空旧数据
  await coRepo.clear()
  console.log('🗑️ 已清空旧共现数据')

  // 分批写入
  const batchSize = 100
  const entries = Array.from(cooccurrence.entries())

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize).map(([key, value]) => {
      const [skillA, skillB] = key.split('|')
      return {
        skillA,
        skillB,
        count: value.count,
        avgSalary: value.salaryCount > 0
          ? Math.round((value.totalSalary / value.salaryCount) * 100) / 100
          : undefined,
      }
    })

    await coRepo
      .createQueryBuilder()
      .insert()
      .into(SkillCooccurrenceEntity)
      .values(batch)
      .execute()

    console.log(`  进度: ${Math.min(i + batchSize, entries.length)}/${entries.length}`)
  }

  // 输出 Top 20 共现对
  const topPairs = await coRepo.find({
    order: { count: 'DESC' },
    take: 20,
  })

  console.log('\n📊 Top 20 技能共现对:')
  for (const pair of topPairs) {
    console.log(
      `  ${pair.skillA} + ${pair.skillB}: ${pair.count} 次` +
      (pair.avgSalary ? ` (平均薪资: ${pair.avgSalary}K)` : ''),
    )
  }

  await dataSource.destroy()
  console.log('\n✅ 共现矩阵构建完成')
}

main().catch((err) => {
  console.error('❌ 执行失败:', err)
  process.exit(1)
})
