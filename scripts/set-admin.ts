/**
 * 设置管理员用户
 * 用法: npx ts-node -P tsconfig.scripts.json scripts/set-admin.ts krishanjinbo@gmail.com
 */
import { DataSource } from 'typeorm'
import * as fs from 'fs'
import * as path from 'path'
import { UserEntity } from '../apps/server/src/modules/user/entities/user.entity'

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
  const email = process.argv[2] || 'krishanjinbo@gmail.com'
  const dbConfig = getDbConfig()

  const dataSource = new DataSource({
    type: 'postgres',
    ...dbConfig,
    entities: [UserEntity],
    synchronize: true,
  })

  await dataSource.initialize()
  console.log('✅ 数据库连接成功')

  const userRepo = dataSource.getRepository(UserEntity)
  const user = await userRepo.findOne({ where: { email } })

  if (!user) {
    console.log(`❌ 用户 ${email} 不存在，请先注册`)
    await dataSource.destroy()
    process.exit(1)
  }

  if (user.role === 'admin') {
    console.log(`ℹ️ 用户 ${email} 已经是管理员`)
  } else {
    user.role = 'admin'
    await userRepo.save(user)
    console.log(`✅ 已将 ${email} 设置为管理员`)
  }

  await dataSource.destroy()
}

main().catch((err) => {
  console.error('❌ 执行失败:', err)
  process.exit(1)
})
