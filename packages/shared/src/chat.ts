/** 聊天消息角色 */
export type ChatRole = 'user' | 'assistant' | 'system'

/** 聊天消息 */
export interface ChatMessage {
  role: ChatRole
  content: string
  timestamp?: string
}

/** 聊天场景类型 */
export type ChatScene = 'jd-analysis' | 'skill-match' | 'interview-mock' | 'general'

/** 聊天请求 DTO */
export interface ChatRequest {
  message: string
  scene: ChatScene
  sessionId?: string
  /** 关联的职位 ID（JD 分析场景用） */
  jobId?: string
}

/** SSE 消息事件（Dify 简化版格式） */
export interface SSEMessageEvent {
  event: 'message'
  answer: string
  conversation_id: string
  created_at: number
}

/** SSE 流结束事件 */
export interface SSEMessageEndEvent {
  event: 'message_end'
  conversation_id: string
}

/** SSE 错误事件 */
export interface SSEErrorEvent {
  event: 'error'
  code: string
  message: string
  status: number
}

/** SSE 数据块（联合类型） */
export type SSEChunk = SSEMessageEvent | SSEMessageEndEvent | SSEErrorEvent
