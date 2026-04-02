import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JobEntity } from '../job/entities/job.entity'
import { SkillCooccurrenceEntity } from '../job/entities/skill-cooccurrence.entity'
import { AnalysisController } from './analysis.controller'
import { AnalysisService } from './analysis.service'

@Module({
  imports: [TypeOrmModule.forFeature([JobEntity, SkillCooccurrenceEntity])],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
