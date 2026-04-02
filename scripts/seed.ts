/**
 * seed.ts - 导入岗位数据到 PostgreSQL
 *
 * 支持数据源：
 * 1. CSV 文件（Boss 直聘格式）
 * 2. JSON / JSONL 文件
 * 3. 无参数时：自动查找项目根目录的 boss_jobs_*.csv
 *
 * 用法：
 *   npx ts-node -P tsconfig.scripts.json scripts/seed.ts                  # 自动查找 CSV
 *   npx ts-node -P tsconfig.scripts.json scripts/seed.ts data.csv         # 指定 CSV 文件
 *   npx ts-node -P tsconfig.scripts.json scripts/seed.ts data.json        # 指定 JSON 文件
 */
import { DataSource } from 'typeorm'
import * as fs from 'fs'
import * as path from 'path'

// 直接引用实体，避免路径映射问题
import { JobEntity } from '../apps/server/src/modules/job/entities/job.entity'
import { SkillCooccurrenceEntity } from '../apps/server/src/modules/job/entities/skill-cooccurrence.entity'
import { UserEntity } from '../apps/server/src/modules/user/entities/user.entity'
import { ChatSessionEntity } from '../apps/server/src/modules/ai/entities/chat-session.entity'

/** 从环境变量或默认值获取数据库配置 */
function getDbConfig() {
  // 尝试加载 .env
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

/**
 * 从 JD 描述和技能标签中提取技能
 * 匹配常见前端/后端/DevOps 技术关键词
 */
function extractSkills(text: string): string[] {
  if (!text) return []

  const skillPatterns: Record<string, RegExp> = {
    // 前端框架
    'Vue': /\bvue(\.?js)?[23]?\b/i,
    'React': /\breact(\.?js)?\b/i,
    'Angular': /\bangular(\.?js)?\b/i,
    'Next.js': /\bnext\.?js\b/i,
    'Nuxt': /\bnuxt(\.?js)?\b/i,
    'Svelte': /\bsvelte\b/i,
    'Three.js': /\bthree\.?js\b/i,
    'Electron': /\belectron\b/i,
    'React Native': /\breact\s*native\b/i,
    'Flutter': /\bflutter\b/i,
    'uni-app': /\buni-?app\b/i,
    'Taro': /\btaro\b/i,
    'WeChat Mini': /\b(小程序|miniprogram|微信开发)\b/i,

    // 语言
    'TypeScript': /\btypescript\b|\bts\b/i,
    'JavaScript': /\bjavascript\b|\bjs\b/i,
    'Python': /\bpython\b/i,
    'Java': /\bjava\b(?!script)/i,
    'Go': /\bgolang\b|\bgo\s*语言\b|\bgo\s*开发/i,
    'Rust': /\brust\b/i,
    'C++': /\bc\+\+\b|\bcpp\b/i,
    'C#': /\bc#\b|\.net\b/i,
    'PHP': /\bphp\b/i,
    'Ruby': /\bruby\b/i,
    'Kotlin': /\bkotlin\b/i,
    'Swift': /\bswift\b/i,
    'Dart': /\bdart\b/i,
    'Scala': /\bscala\b/i,

    // 后端框架
    'Node.js': /\bnode\.?js\b/i,
    'NestJS': /\bnest\.?js\b/i,
    'Express': /\bexpress(\.?js)?\b/i,
    'Spring': /\bspring\s*(boot|cloud|mvc)?\b/i,
    'Django': /\bdjango\b/i,
    'Flask': /\bflask\b/i,
    'FastAPI': /\bfastapi\b/i,
    'Gin': /\bgin\b/i,
    'Laravel': /\blaravel\b/i,

    // 数据库
    'MySQL': /\bmysql\b/i,
    'PostgreSQL': /\bpostgre(sql)?\b/i,
    'MongoDB': /\bmongodb\b|\bmongo\b/i,
    'Redis': /\bredis\b/i,
    'Elasticsearch': /\belasticsearch\b|\belastic\b/i,
    'Oracle': /\boracle\b/i,
    'SQLite': /\bsqlite\b/i,
    'SQL Server': /\bsql\s*server\b|\bmssql\b/i,

    // 工具链/DevOps
    'Docker': /\bdocker\b/i,
    'Kubernetes': /\bkubernetes\b|\bk8s\b/i,
    'CI/CD': /\bci\/?cd\b/i,
    'Git': /\bgit\b(?!hub)/i,
    'Webpack': /\bwebpack\b/i,
    'Vite': /\bvite\b/i,
    'Jenkins': /\bjenkins\b/i,
    'Prometheus': /\bprometheus\b/i,

    // 云服务
    'AWS': /\baws\b/i,
    'Azure': /\bazure\b/i,
    'GCP': /\bgcp\b|\bgoogle\s*cloud\b/i,
    '阿里云': /\b阿里云\b/i,
    '腾讯云': /\b腾讯云\b/i,

    // 其他
    'GraphQL': /\bgraphql\b/i,
    'REST': /\brest(ful)?\s*(api)?\b/i,
    'Microservices': /\b微服务\b|\bmicroservice/i,
    'Linux': /\blinux\b/i,
    'Nginx': /\bnginx\b/i,
    'HTML/CSS': /\bhtml5?\b/i,
    'CSS': /\bcss3?\b|\bless\b|\bsass\b|\bscss\b/i,
    'Tailwind': /\btailwind\b/i,
    'Element Plus': /\belement\s*(plus|ui)\b/i,
    'Ant Design': /\bant\s*design\b|\bantd\b/i,
    'D3.js': /\bd3(\.js)?\b/i,
    'ECharts': /\becharts\b/i,
    'Canvas': /\bcanvas\b/i,
    'WebGL': /\bwebgl\b|\bwebgpu\b/i,
    'WebSocket': /\bwebsocket\b/i,
    'SSE': /\bsse\b/i,
    'RabbitMQ': /\brabbitmq\b/i,
    'Kafka': /\bkafka\b/i,
    'gRPC': /\bgrpc\b/i,
    'AI/ML': /\b(机器学习|深度学习|AI|大模型|LLM|NLP|GPT|AIGC)\b/i,
    'Agile': /\b(敏捷|scrum|kanban)\b/i,
  }

  const found = new Set<string>()
  for (const [skill, pattern] of Object.entries(skillPatterns)) {
    if (pattern.test(text)) {
      found.add(skill)
    }
  }
  return Array.from(found)
}

// ============================================================
// CSV 解析器（处理带引号、换行的字段）
// ============================================================

/**
 * 解析 CSV 内容（支持引号内的逗号和换行符）
 */
function parseCSV(content: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  let i = 0

  while (i < content.length) {
    const ch = content[i]

    if (inQuotes) {
      if (ch === '"') {
        // 双引号转义
        if (i + 1 < content.length && content[i + 1] === '"') {
          currentField += '"'
          i += 2
        } else {
          inQuotes = false
          i++
        }
      } else {
        currentField += ch
        i++
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
      } else if (ch === ',') {
        currentRow.push(currentField)
        currentField = ''
        i++
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentField)
        currentField = ''
        if (ch === '\r' && i + 1 < content.length && content[i + 1] === '\n') {
          i += 2
        } else {
          i++
        }
        if (currentRow.length > 1 || currentRow.some(f => f.trim())) {
          rows.push(currentRow)
        }
        currentRow = []
      } else {
        currentField += ch
        i++
      }
    }
  }

  // 最后一行
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField)
    if (currentRow.length > 1 || currentRow.some(f => f.trim())) {
      rows.push(currentRow)
    }
  }

  return rows
}

/**
 * 解析 Boss 直聘的薪资字符串
 * 格式示例："35-50K·13薪", "13-14K", "25-50K·15薪", "200-300元/天"
 * 返回 [minK, maxK]（单位：千/月）
 */
function parseSalary(salary: string): { min: number | undefined; max: number | undefined } {
  if (!salary) return { min: undefined, max: undefined }

  // 日薪格式 "200-300元/天"
  const dayMatch = salary.match(/(\d+)-(\d+)元\/天/)
  if (dayMatch) {
    const dayMin = parseInt(dayMatch[1], 10)
    const dayMax = parseInt(dayMatch[2], 10)
    // 转换为月薪（22个工作日），单位千
    return {
      min: Math.round((dayMin * 22) / 1000),
      max: Math.round((dayMax * 22) / 1000),
    }
  }

  // 标准月薪格式 "15-25K·13薪"
  const match = salary.match(/(\d+)-(\d+)K/)
  if (!match) return { min: undefined, max: undefined }

  let min = parseInt(match[1], 10)
  let max = parseInt(match[2], 10)

  // 处理多少薪
  const monthsMatch = salary.match(/(\d+)薪/)
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1], 10)
    // 年薪均摊到12个月
    min = Math.round((min * months) / 12)
    max = Math.round((max * months) / 12)
  }

  return { min, max }
}

/**
 * 从工作地点解析城市和区域
 * 格式："上海-浦东新区-陆家嘴" 或 "上海" 或 "北京-朝阳区"
 */
function parseLocation(location: string): { city: string; district: string } {
  if (!location) return { city: '', district: '' }

  const parts = location.split('-').map(p => p.trim())
  return {
    city: parts[0] || '',
    district: parts.slice(1).join('-') || '',
  }
}

/**
 * 从 Boss 直聘链接中提取 sourceId
 * 格式："https://www.zhipin.com/job_detail/xxx.html"
 */
function extractSourceId(url: string): string {
  if (!url) return ''
  const match = url.match(/job_detail\/([^.?]+)/)
  return match ? match[1] : url
}

/**
 * 从 CSV 文件加载 Boss 直聘数据
 * 字段顺序：职位名称,薪资,公司,行业,公司规模,融资阶段,工作地点,详细地址,经验要求,学历要求,技能标签,福利待遇,HR,HR职位,岗位描述,链接,采集时间
 */
function loadFromCSV(filePath: string): Partial<JobEntity>[] {
  const absolutePath = path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`文件不存在: ${absolutePath}`)
  }

  const content = fs.readFileSync(absolutePath, 'utf-8')
  const rows = parseCSV(content)

  if (rows.length < 2) {
    throw new Error('CSV 文件为空或只有表头')
  }

  // 第一行为表头
  const header = rows[0]
  console.log(`📋 CSV 表头: ${header.join(', ')}`)
  console.log(`📊 数据行数: ${rows.length - 1}`)

  const jobs: Partial<JobEntity>[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 15) continue // 跳过不完整的行

    const title = row[0]?.trim()
    const salaryStr = row[1]?.trim()
    const company = row[2]?.trim()
    const industry = row[3]?.trim()
    const companySize = row[4]?.trim()
    const financingStage = row[5]?.trim()
    const locationStr = row[6]?.trim()
    const address = row[7]?.trim()
    const experience = row[8]?.trim()
    const education = row[9]?.trim() || ''
    const skillTags = row[10]?.trim()
    const benefits = row[11]?.trim()
    const hrName = row[12]?.trim()
    const hrTitle = row[13]?.trim()
    const description = row[14]?.trim()
    const link = row[15]?.trim()
    const crawlTime = row[16]?.trim()

    if (!title) continue

    const { min: salaryMin, max: salaryMax } = parseSalary(salaryStr)
    const { city, district } = parseLocation(locationStr)
    const sourceId = extractSourceId(link)

    // 合并技能标签和 JD 描述的技能提取
    const allText = [description, skillTags].filter(Boolean).join(' ')
    let skills = extractSkills(allText)

    // 额外从技能标签字段按 " | " 分割提取
    if (skillTags) {
      const tagSkills = skillTags.split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean)
      for (const tag of tagSkills) {
        // 只添加看起来像技能的标签（过滤掉地区、学历等无关标签）
        if (tag.length <= 20 && !skills.includes(tag) &&
            !/不接受|接受|居家|远程|保险|专业/.test(tag)) {
          // 检查是否已存在相似技能
          const normalized = tag.toLowerCase()
          const existing = skills.find(s => s.toLowerCase() === normalized)
          if (!existing) {
            skills.push(tag)
          }
        }
      }
    }

    // 原始数据保存完整行
    const rawData = {
      title, salary: salaryStr, company, industry, companySize,
      financingStage, location: locationStr, address, experience,
      education, skillTags, benefits, hrName, hrTitle,
      description, link, crawlTime,
    }

    jobs.push({
      title,
      company,
      city,
      district,
      salaryMin,
      salaryMax,
      experience,
      education,
      description,
      skills,
      source: 'boss',
      sourceId: sourceId || `boss-csv-${i}`,
      rawData,
    })
  }

  return jobs
}

/** 从 JSON 文件加载数据 */
function loadFromJSON(filePath: string): Partial<JobEntity>[] {
  const absolutePath = path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`文件不存在: ${absolutePath}`)
  }

  const content = fs.readFileSync(absolutePath, 'utf-8')
  let rawData: unknown[]

  try {
    rawData = JSON.parse(content)
    if (!Array.isArray(rawData)) {
      rawData = [rawData]
    }
  } catch {
    rawData = content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line))
  }

  return rawData.map((item: any, idx: number) => {
    const skills =
      item.skills && item.skills.length > 0
        ? item.skills
        : extractSkills(item.description || '')

    return {
      title: item.title || item.job_name || '',
      company: item.company || item.company_name || '',
      city: item.city || item.area_district || '',
      district: item.district || item.business_district || '',
      salaryMin: item.salaryMin ?? item.salary_min ?? undefined,
      salaryMax: item.salaryMax ?? item.salary_max ?? undefined,
      experience: item.experience || item.job_experience || '',
      education: item.education || item.job_degree || '',
      description: item.description || item.job_detail || '',
      skills,
      source: item.source || 'boss',
      sourceId: item.sourceId || item.source_id || item.encrypt_id || `json-${idx}`,
      rawData: item,
    }
  })
}

/**
 * 自动查找项目根目录的 boss_jobs_*.csv 文件
 */
function findDefaultCSV(): string | null {
  const rootDir = path.resolve(__dirname, '..')
  const files = fs.readdirSync(rootDir)
  const csvFiles = files
    .filter(f => f.startsWith('boss_jobs_') && f.endsWith('.csv'))
    .sort()
    .reverse() // 最新的排前面

  return csvFiles.length > 0 ? path.join(rootDir, csvFiles[0]) : null
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

  // 手动创建 GIN 索引（TypeORM 不支持 GIN 索引自动创建）
  try {
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs USING GIN(skills)`,
    )
    console.log('✅ GIN 索引创建完成')
  } catch (err) {
    console.log('⚠️ GIN 索引已存在或创建失败，跳过')
  }

  const jobRepo = dataSource.getRepository(JobEntity)

  // 判断数据来源
  const filePath = process.argv[2]
  let jobsData: Partial<JobEntity>[]

  if (filePath) {
    if (filePath.endsWith('.csv')) {
      console.log(`📂 从 CSV 文件导入: ${filePath}`)
      jobsData = loadFromCSV(filePath)
    } else {
      console.log(`📂 从 JSON 文件导入: ${filePath}`)
      jobsData = loadFromJSON(filePath)
    }
  } else {
    // 自动查找 boss_jobs_*.csv
    const defaultCSV = findDefaultCSV()
    if (defaultCSV) {
      console.log(`📂 自动发现 CSV 文件: ${path.basename(defaultCSV)}`)
      jobsData = loadFromCSV(defaultCSV)
    } else {
      console.error('❌ 未找到 CSV 数据文件，请提供文件路径作为参数')
      await dataSource.destroy()
      process.exit(1)
    }
  }

  console.log(`📊 共 ${jobsData.length} 条数据待导入`)

  // 清空旧数据（CASCADE 处理外键约束）
  const oldCount = await jobRepo.count()
  if (oldCount > 0) {
    await dataSource.query('TRUNCATE TABLE jobs CASCADE')
    console.log(`🗑️ 已清空旧数据 ${oldCount} 条`)
  }

  // 分批插入，使用 upsert 避免重复
  const batchSize = 50
  let inserted = 0
  let updated = 0

  for (let i = 0; i < jobsData.length; i += batchSize) {
    const batch = jobsData.slice(i, i + batchSize)

    for (const jobData of batch) {
      try {
        // 使用 source + sourceId 作为唯一标识，冲突时更新
        await jobRepo
          .createQueryBuilder()
          .insert()
          .into(JobEntity)
          .values(jobData as any)
          .orUpdate(
            ['title', 'company', 'city', 'district', 'salary_min', 'salary_max',
             'experience', 'education', 'description', 'skills', 'raw_data', 'updated_at'],
            ['source', 'source_id'],
          )
          .execute()
        inserted++
      } catch (err: any) {
        // 如果没有 sourceId，直接插入
        if (!jobData.sourceId) {
          await jobRepo.save(jobRepo.create(jobData))
          inserted++
        } else {
          console.error(`❌ 导入失败: ${jobData.title} - ${err.message}`)
        }
      }
    }

    console.log(`  进度: ${Math.min(i + batchSize, jobsData.length)}/${jobsData.length}`)
  }

  console.log(`\n✅ 导入完成: 成功 ${inserted} 条`)

  // 统计信息
  const totalCount = await jobRepo.count()
  const skillStats = await jobRepo.query(`
    SELECT skill, COUNT(*) as count
    FROM jobs, unnest(skills) AS skill
    GROUP BY skill
    ORDER BY count DESC
    LIMIT 20
  `)
  console.log(`\n📈 数据库中共 ${totalCount} 条职位数据`)
  console.log('📊 Top 20 技能分布:')
  for (const row of skillStats) {
    console.log(`  ${row.skill}: ${row.count}`)
  }

  await dataSource.destroy()
  console.log('\n✅ 数据库连接已关闭')
}

main().catch((err) => {
  console.error('❌ 执行失败:', err)
  process.exit(1)
})
