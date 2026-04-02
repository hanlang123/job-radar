import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { ChatSessionEntity } from './entities/chat-session.entity'
import { JobEntity } from '../job/entities/job.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ChatSessionEntity, JobEntity])],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
