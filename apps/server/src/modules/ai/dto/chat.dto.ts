import { IsString, IsOptional, IsIn, IsUUID } from 'class-validator'
import type { ChatScene } from '@job-radar/shared'

/** 聊天请求 DTO */
export class ChatDto {
  @IsString()
  message!: string

  @IsIn(['jd-analysis', 'skill-match', 'interview-mock', 'general'])
  scene!: ChatScene

  @IsOptional()
  @IsUUID()
  sessionId?: string

  @IsOptional()
  @IsUUID()
  jobId?: string
}
