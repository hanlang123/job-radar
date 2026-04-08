import { IsString, IsOptional, IsIn, IsUUID, IsBoolean } from 'class-validator'
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

  /** 是否为恢复中断的请求 */
  @IsOptional()
  @IsBoolean()
  resume?: boolean

  /** 中断时的部分 AI 输出内容（恢复用） */
  @IsOptional()
  @IsString()
  partialContent?: string
}
