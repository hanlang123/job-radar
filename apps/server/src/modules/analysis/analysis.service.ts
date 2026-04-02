import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JobEntity } from '../job/entities/job.entity'
import { SkillCooccurrenceEntity } from '../job/entities/skill-cooccurrence.entity'
import type { GraphData, GraphNode, GraphLink, MarketOverview } from '@job-radar/shared'

/** 技能分类映射 */
const SKILL_CATEGORIES: Record<string, string> = {
  'Vue': '前端框架', 'React': '前端框架', 'Angular': '前端框架',
  'Next.js': '前端框架', 'Nuxt': '前端框架', 'Svelte': '前端框架',
  'TypeScript': '语言', 'JavaScript': '语言', 'Python': '语言',
  'Java': '语言', 'Go': '语言', 'Rust': '语言', 'C++': '语言',
  'C#': '语言', 'PHP': '语言', 'Ruby': '语言', 'Kotlin': '语言', 'Swift': '语言',
  'Node.js': '后端', 'NestJS': '后端', 'Express': '后端', 'Spring': '后端',
  'Django': '后端', 'Flask': '后端', 'FastAPI': '后端',
  'MySQL': '数据库', 'PostgreSQL': '数据库', 'MongoDB': '数据库',
  'Redis': '数据库', 'Elasticsearch': '数据库',
  'Docker': 'DevOps', 'Kubernetes': 'DevOps', 'CI/CD': 'DevOps',
  'Git': '工具链', 'Webpack': '工具链', 'Vite': '工具链',
  'AWS': '云服务', 'Azure': '云服务', 'GCP': '云服务',
  'GraphQL': '后端', 'REST': '后端', 'Microservices': '后端',
  'Linux': 'DevOps', 'Nginx': 'DevOps',
  'HTML/CSS': '前端基础', 'CSS': '前端基础', 'Tailwind': '前端框架',
  'Element Plus': '前端框架', 'Ant Design': '前端框架',
  'D3.js': '可视化', 'ECharts': '可视化',
  'RabbitMQ': '中间件', 'Kafka': '中间件', 'gRPC': '中间件',
}

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobRepo: Repository<JobEntity>,
    @InjectRepository(SkillCooccurrenceEntity)
    private readonly coRepo: Repository<SkillCooccurrenceEntity>,
  ) {}

  /**
   * 获取技能图谱数据
   * @param city 可选城市筛选
   * @param topN 返回 Top N 个技能节点（默认 50）
   */
  async getSkillGraph(city?: string, topN: number = 50): Promise<GraphData> {
    // 1. 统计技能出现频次（使用原生 SQL，因为 TypeORM 不支持 unnest JOIN）
    let skillSql = `
      SELECT s AS skill, COUNT(*) AS count
      FROM jobs, unnest(jobs.skills) AS s
    `
    const params: any[] = []
    if (city) {
      params.push(city)
      skillSql += ` WHERE jobs.city = $${params.length}`
    }
    skillSql += ` GROUP BY s ORDER BY count DESC LIMIT $${params.length + 1}`
    params.push(topN)

    const skillStats: { skill: string; count: string }[] =
      await this.jobRepo.query(skillSql, params)

    const topSkills = new Set(skillStats.map((s) => s.skill))

    // 2. 构建节点
    const nodes: GraphNode[] = skillStats.map((s) => ({
      id: s.skill,
      label: s.skill,
      type: 'skill' as const,
      frequency: parseInt(s.count, 10),
      category: SKILL_CATEGORIES[s.skill] || '其他',
    }))

    // 3. 查询共现关系（只保留 Top N 中的技能对）
    const allCooccurrences = await this.coRepo.find({
      order: { count: 'DESC' },
    })

    const links: GraphLink[] = []
    for (const co of allCooccurrences) {
      if (topSkills.has(co.skillA) && topSkills.has(co.skillB)) {
        links.push({
          source: co.skillA,
          target: co.skillB,
          weight: co.count,
          avgSalary: co.avgSalary ? parseFloat(String(co.avgSalary)) : undefined,
        })
      }
    }

    return { nodes, links }
  }

  /**
   * 获取市场概览数据
   * @param city 可选城市筛选
   */
  async getMarketOverview(city?: string): Promise<MarketOverview> {
    const baseQb = this.jobRepo.createQueryBuilder('job')
    if (city) {
      baseQb.where('job.city = :city', { city })
    }

    // 总岗位数
    const totalJobs = await baseQb.getCount()

    // 平均薪资
    const salaryQb = this.jobRepo.createQueryBuilder('job')
      .select('AVG((job.salary_min + job.salary_max) / 2.0)', 'avg')
      .where('job.salary_min IS NOT NULL AND job.salary_max IS NOT NULL')
    if (city) {
      salaryQb.andWhere('job.city = :city', { city })
    }
    const salaryResult = await salaryQb.getRawOne()
    const avgSalary = salaryResult?.avg ? Math.round(parseFloat(salaryResult.avg) * 100) / 100 : 0

    // Top 技能榜（使用原生 SQL）
    let skillSql2 = `
      SELECT s AS skill, COUNT(*) AS count
      FROM jobs, unnest(jobs.skills) AS s
    `
    const skillParams: any[] = []
    if (city) {
      skillParams.push(city)
      skillSql2 += ` WHERE jobs.city = $${skillParams.length}`
    }
    skillSql2 += ` GROUP BY s ORDER BY count DESC LIMIT 20`

    const topSkills: { skill: string; count: string }[] =
      await this.jobRepo.query(skillSql2, skillParams)

    // 城市分布
    const cityDistribution: { city: string; count: string }[] = await this.jobRepo
      .createQueryBuilder('job')
      .select('job.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .where('job.city IS NOT NULL')
      .groupBy('job.city')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()

    // 薪资分布
    const salaryRanges = [
      { label: '0-10K', min: 0, max: 10 },
      { label: '10-20K', min: 10, max: 20 },
      { label: '20-30K', min: 20, max: 30 },
      { label: '30-50K', min: 30, max: 50 },
      { label: '50K+', min: 50, max: 999 },
    ]

    const salaryDistribution: { range: string; count: number }[] = []
    for (const range of salaryRanges) {
      const qb = this.jobRepo
        .createQueryBuilder('job')
        .where('job.salary_min IS NOT NULL')
        .andWhere(
          '((job.salary_min + job.salary_max) / 2.0) >= :min AND ((job.salary_min + job.salary_max) / 2.0) < :max',
          { min: range.min, max: range.max },
        )
      if (city) {
        qb.andWhere('job.city = :city', { city })
      }
      const count = await qb.getCount()
      salaryDistribution.push({ range: range.label, count })
    }

    return {
      totalJobs,
      avgSalary,
      topSkills: topSkills.map((s) => ({ skill: s.skill, count: parseInt(s.count, 10) })),
      cityDistribution: cityDistribution.map((c) => ({ city: c.city, count: parseInt(c.count, 10) })),
      salaryDistribution,
    }
  }
}
