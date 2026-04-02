import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, SelectQueryBuilder } from 'typeorm'
import { JobEntity } from './entities/job.entity'
import { QueryJobDto } from './dto'

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobRepo: Repository<JobEntity>,
  ) {}

  /**
   * 分页查询职位列表，支持多维度筛选
   * @param query 查询参数
   */
  async findAll(query: QueryJobDto) {
    const {
      page = 1,
      pageSize = 20,
      city,
      skills,
      salaryMin,
      salaryMax,
      experience,
      education,
      keyword,
    } = query

    const qb: SelectQueryBuilder<JobEntity> = this.jobRepo
      .createQueryBuilder('job')
      .orderBy('job.createdAt', 'DESC')

    // 城市筛选
    if (city) {
      qb.andWhere('job.city = :city', { city })
    }

    // 技能筛选（数组交集匹配）
    if (skills && skills.length > 0) {
      qb.andWhere('job.skills && :skills', { skills })
    }

    // 薪资范围筛选
    if (salaryMin !== undefined) {
      qb.andWhere('job.salary_max >= :salaryMin', { salaryMin })
    }
    if (salaryMax !== undefined) {
      qb.andWhere('job.salary_min <= :salaryMax', { salaryMax })
    }

    // 经验筛选
    if (experience) {
      qb.andWhere('job.experience = :experience', { experience })
    }

    // 学历筛选
    if (education) {
      qb.andWhere('job.education = :education', { education })
    }

    // 关键词搜索（标题 + 公司名 + JD 描述）
    if (keyword) {
      qb.andWhere(
        '(job.title ILIKE :keyword OR job.company ILIKE :keyword OR job.description ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      )
    }

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount()

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  /** 根据 ID 获取单个职位详情 */
  async findById(id: string): Promise<JobEntity | null> {
    return this.jobRepo.findOne({ where: { id } })
  }

  /** 获取所有不重复的城市列表 */
  async getCities(): Promise<string[]> {
    const result = await this.jobRepo
      .createQueryBuilder('job')
      .select('DISTINCT job.city', 'city')
      .where('job.city IS NOT NULL')
      .orderBy('city', 'ASC')
      .getRawMany()
    return result.map((r) => r.city)
  }

  /** 获取所有不重复的经验要求列表 */
  async getExperienceLevels(): Promise<string[]> {
    const result = await this.jobRepo
      .createQueryBuilder('job')
      .select('DISTINCT job.experience', 'experience')
      .where('job.experience IS NOT NULL')
      .orderBy('experience', 'ASC')
      .getRawMany()
    return result.map((r) => r.experience)
  }

  /** 获取所有不重复的学历要求列表 */
  async getEducationLevels(): Promise<string[]> {
    const result = await this.jobRepo
      .createQueryBuilder('job')
      .select('DISTINCT job.education', 'education')
      .where('job.education IS NOT NULL')
      .orderBy('education', 'ASC')
      .getRawMany()
    return result.map((r) => r.education)
  }

  /** 获取 Top 技能列表（用于筛选面板） */
  async getTopSkills(limit: number = 50): Promise<string[]> {
    const result: { skill: string }[] = await this.jobRepo.query(
      `SELECT s AS skill, COUNT(*) AS cnt
       FROM jobs, unnest(jobs.skills) AS s
       GROUP BY s ORDER BY cnt DESC LIMIT $1`,
      [limit],
    )
    return result.map((r) => r.skill)
  }
}
