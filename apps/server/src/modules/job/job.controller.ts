import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common'
import { JobService } from './job.service'
import { QueryJobDto } from './dto'

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  /** 分页查询职位列表 */
  @Get()
  async findAll(@Query() query: QueryJobDto) {
    return this.jobService.findAll(query)
  }

  /** 获取筛选选项（城市、经验、学历） */
  @Get('filters')
  async getFilters() {
    const [cities, experienceLevels, educationLevels, skills] = await Promise.all([
      this.jobService.getCities(),
      this.jobService.getExperienceLevels(),
      this.jobService.getEducationLevels(),
      this.jobService.getTopSkills(),
    ])
    return { cities, experienceLevels, educationLevels, skills }
  }

  /** 获取单个职位详情 */
  @Get(':id')
  async findById(@Param('id') id: string) {
    const job = await this.jobService.findById(id)
    if (!job) {
      throw new NotFoundException(`职位 ${id} 不存在`)
    }
    return job
  }
}
