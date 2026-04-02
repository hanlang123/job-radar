import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JobEntity } from './entities/job.entity'
import { SkillCooccurrenceEntity } from './entities/skill-cooccurrence.entity'
import { JobController } from './job.controller'
import { JobService } from './job.service'

@Module({
  imports: [TypeOrmModule.forFeature([JobEntity, SkillCooccurrenceEntity])],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService, TypeOrmModule],
})
export class JobModule {}
