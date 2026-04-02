import { Controller, Get, Query } from '@nestjs/common'
import { AnalysisService } from './analysis.service'

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  /**
   * 获取技能图谱数据
   * GET /api/analysis/skill-graph?city=&topN=50
   */
  @Get('skill-graph')
  async getSkillGraph(
    @Query('city') city?: string,
    @Query('topN') topN?: string,
  ) {
    const n = topN ? parseInt(topN, 10) : 50
    return this.analysisService.getSkillGraph(city || undefined, n)
  }

  /**
   * 获取市场概览数据
   * GET /api/analysis/market-overview?city=
   */
  @Get('market-overview')
  async getMarketOverview(@Query('city') city?: string) {
    return this.analysisService.getMarketOverview(city || undefined)
  }
}
