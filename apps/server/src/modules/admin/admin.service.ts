import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { JobEntity } from '../job/entities/job.entity'

/** CSV 导入结果 */
export interface ImportResult {
  total: number
  success: number
  failed: number
  errors: string[]
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name)

  constructor(
    @InjectRepository(JobEntity)
    private readonly jobRepo: Repository<JobEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 从 CSV Buffer 导入职位数据
   * @param csvBuffer CSV 文件内容
   * @param mode append=追加, replace=先清空再导入
   */
  async importJobsFromCSV(csvBuffer: Buffer, mode: 'append' | 'replace' = 'append'): Promise<ImportResult> {
    const content = csvBuffer.toString('utf-8')
    const rows = this.parseCSV(content)

    if (rows.length < 2) {
      return { total: 0, success: 0, failed: 0, errors: ['CSV 文件为空或只有表头'] }
    }

    const header = rows[0]
    this.logger.log(`CSV 表头: ${header.join(', ')}`)
    this.logger.log(`数据行数: ${rows.length - 1}`)

    // 解析数据行
    const jobs: Partial<JobEntity>[] = []
    const errors: string[] = []

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (row.length < 15) {
        errors.push(`第 ${i + 1} 行: 列数不足 (${row.length}/15)`)
        continue
      }

      try {
        const job = this.parseJobRow(row, i)
        if (job) jobs.push(job)
      } catch (err: any) {
        errors.push(`第 ${i + 1} 行: ${err.message}`)
      }
    }

    if (jobs.length === 0) {
      return { total: rows.length - 1, success: 0, failed: errors.length, errors }
    }

    // 清空旧数据（replace 模式）
    if (mode === 'replace') {
      await this.dataSource.query('TRUNCATE TABLE jobs CASCADE')
      this.logger.log('已清空旧数据')
    }

    // 分批插入
    let success = 0
    const batchSize = 50

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize)

      for (const jobData of batch) {
        try {
          await this.jobRepo
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
          success++
        } catch (err: any) {
          if (!jobData.sourceId) {
            try {
              await this.jobRepo.save(this.jobRepo.create(jobData))
              success++
            } catch (innerErr: any) {
              errors.push(`导入失败: ${jobData.title} - ${innerErr.message}`)
            }
          } else {
            errors.push(`导入失败: ${jobData.title} - ${err.message}`)
          }
        }
      }
    }

    return {
      total: rows.length - 1,
      success,
      failed: errors.length,
      errors: errors.slice(0, 20), // 最多返回前 20 条错误
    }
  }

  /**
   * 解析单行 CSV 数据为 JobEntity
   * 字段顺序：职位名称,薪资,公司,行业,公司规模,融资阶段,工作地点,详细地址,经验要求,学历要求,技能标签,福利待遇,HR,HR职位,岗位描述,链接,采集时间
   */
  private parseJobRow(row: string[], rowIndex: number): Partial<JobEntity> | null {
    const title = row[0]?.trim()
    if (!title) return null

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

    const { min: salaryMin, max: salaryMax } = this.parseSalary(salaryStr)
    const { city, district } = this.parseLocation(locationStr)
    const sourceId = this.extractSourceId(link)

    // 合并技能提取
    const allText = [description, skillTags].filter(Boolean).join(' ')
    const skills = this.extractSkills(allText)

    // 从技能标签字段补充
    if (skillTags) {
      const tagSkills = skillTags.split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean)
      for (const tag of tagSkills) {
        if (tag.length <= 20 && !skills.includes(tag) &&
            !/不接受|接受|居家|远程|保险|专业/.test(tag)) {
          const normalized = tag.toLowerCase()
          const existing = skills.find(s => s.toLowerCase() === normalized)
          if (!existing) {
            skills.push(tag)
          }
        }
      }
    }

    const rawData = {
      title, salary: salaryStr, company, industry, companySize,
      financingStage, location: locationStr, address, experience,
      education, skillTags, benefits, hrName, hrTitle,
      description, link, crawlTime,
    }

    return {
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
      sourceId: sourceId || `boss-csv-${rowIndex}`,
      rawData,
    }
  }

  // ============================================================
  // CSV 解析工具方法（从 seed.ts 提取）
  // ============================================================

  /** 解析 CSV 内容（支持引号内的逗号和换行符） */
  private parseCSV(content: string): string[][] {
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentField = ''
    let inQuotes = false
    let i = 0

    while (i < content.length) {
      const ch = content[i]

      if (inQuotes) {
        if (ch === '"') {
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

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField)
      if (currentRow.length > 1 || currentRow.some(f => f.trim())) {
        rows.push(currentRow)
      }
    }

    return rows
  }

  /** 解析薪资字符串 */
  private parseSalary(salary: string): { min: number | undefined; max: number | undefined } {
    if (!salary) return { min: undefined, max: undefined }

    const dayMatch = salary.match(/(\d+)-(\d+)元\/天/)
    if (dayMatch) {
      const dayMin = parseInt(dayMatch[1], 10)
      const dayMax = parseInt(dayMatch[2], 10)
      return {
        min: Math.round((dayMin * 22) / 1000),
        max: Math.round((dayMax * 22) / 1000),
      }
    }

    const match = salary.match(/(\d+)-(\d+)K/)
    if (!match) return { min: undefined, max: undefined }

    let min = parseInt(match[1], 10)
    let max = parseInt(match[2], 10)

    const monthsMatch = salary.match(/(\d+)薪/)
    if (monthsMatch) {
      const months = parseInt(monthsMatch[1], 10)
      min = Math.round((min * months) / 12)
      max = Math.round((max * months) / 12)
    }

    return { min, max }
  }

  /** 解析工作地点 */
  private parseLocation(location: string): { city: string; district: string } {
    if (!location) return { city: '', district: '' }
    const parts = location.split('-').map(p => p.trim())
    return {
      city: parts[0] || '',
      district: parts.slice(1).join('-') || '',
    }
  }

  /** 从链接提取 sourceId */
  private extractSourceId(url: string): string {
    if (!url) return ''
    const match = url.match(/job_detail\/([^.?]+)/)
    return match ? match[1] : url
  }

  /** 从文本中提取技能关键词 */
  private extractSkills(text: string): string[] {
    if (!text) return []

    const skillPatterns: Record<string, RegExp> = {
      'Vue': /\bvue(\.?js)?[23]?\b/i,
      'React': /\breact(\.?js)?\b/i,
      'Angular': /\bangular(\.?js)?\b/i,
      'Next.js': /\bnext\.?js\b/i,
      'Nuxt': /\bnuxt(\.?js)?\b/i,
      'TypeScript': /\btypescript\b|\bts\b/i,
      'JavaScript': /\bjavascript\b|\bjs\b/i,
      'Python': /\bpython\b/i,
      'Java': /\bjava\b(?!script)/i,
      'Go': /\bgolang\b|\bgo\s*语言\b|\bgo\s*开发/i,
      'Rust': /\brust\b/i,
      'C++': /\bc\+\+\b|\bcpp\b/i,
      'C#': /\bc#\b|\.net\b/i,
      'PHP': /\bphp\b/i,
      'Node.js': /\bnode\.?js\b/i,
      'NestJS': /\bnest\.?js\b/i,
      'Express': /\bexpress(\.?js)?\b/i,
      'Spring': /\bspring\s*(boot|cloud|mvc)?\b/i,
      'Django': /\bdjango\b/i,
      'Flask': /\bflask\b/i,
      'FastAPI': /\bfastapi\b/i,
      'MySQL': /\bmysql\b/i,
      'PostgreSQL': /\bpostgre(sql)?\b/i,
      'MongoDB': /\bmongodb\b|\bmongo\b/i,
      'Redis': /\bredis\b/i,
      'Elasticsearch': /\belasticsearch\b|\belastic\b/i,
      'Docker': /\bdocker\b/i,
      'Kubernetes': /\bkubernetes\b|\bk8s\b/i,
      'CI/CD': /\bci\/?cd\b/i,
      'Git': /\bgit\b(?!hub)/i,
      'Webpack': /\bwebpack\b/i,
      'Vite': /\bvite\b/i,
      'AWS': /\baws\b/i,
      'GraphQL': /\bgraphql\b/i,
      'Linux': /\blinux\b/i,
      'Nginx': /\bnginx\b/i,
      'HTML/CSS': /\bhtml5?\b/i,
      'CSS': /\bcss3?\b|\bless\b|\bsass\b|\bscss\b/i,
      'Tailwind': /\btailwind\b/i,
      'D3.js': /\bd3(\.js)?\b/i,
      'ECharts': /\becharts\b/i,
      'WebSocket': /\bwebsocket\b/i,
      'RabbitMQ': /\brabbitmq\b/i,
      'Kafka': /\bkafka\b/i,
      'AI/ML': /\b(机器学习|深度学习|AI|大模型|LLM|NLP|GPT|AIGC)\b/i,
      'Electron': /\belectron\b/i,
      'React Native': /\breact\s*native\b/i,
      'Flutter': /\bflutter\b/i,
      'uni-app': /\buni-?app\b/i,
      'Three.js': /\bthree\.?js\b/i,
      'Svelte': /\bsvelte\b/i,
      'Kotlin': /\bkotlin\b/i,
      'Swift': /\bswift\b/i,
    }

    const found = new Set<string>()
    for (const [skill, pattern] of Object.entries(skillPatterns)) {
      if (pattern.test(text)) {
        found.add(skill)
      }
    }
    return Array.from(found)
  }
}
