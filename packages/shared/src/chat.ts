/** 聊天消息角色 */
export type ChatRole = 'user' | 'assistant' | 'system'

/** Agent 执行状态 */
export type AgentStatus = 'thinking' | 'streaming' | 'interrupted' | 'failed' | 'completed'

/** Agent 状态步骤（用于 timeline 可视化） */
export interface AgentStatusStep {
  status: AgentStatus
  label: string
  timestamp: string
  /** 距离开始的耗时（ms） */
  duration?: number
}

/** 聊天消息 */
export interface ChatMessage {
  role: ChatRole
  content: string
  timestamp?: string
  /** Agent 执行状态（仅 assistant 消息） */
  agentStatus?: AgentStatus
  /** Agent 执行步骤历史（仅 assistant 消息） */
  statusSteps?: AgentStatusStep[]
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
  /** 是否为恢复中断的请求 */
  resume?: boolean
  /** 中断时的部分 AI 输出内容（恢复用） */
  partialContent?: string
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

/** SSE Agent 状态事件 */
export interface SSEStatusEvent {
  event: 'agent_status'
  status: AgentStatus
  conversation_id: string
  created_at: number
}

/** SSE 数据块（联合类型） */
export type SSEChunk = SSEMessageEvent | SSEMessageEndEvent | SSEErrorEvent | SSEStatusEvent

/** 聊天会话列表项（不含完整消息） */
export interface ChatSessionListItem {
  id: string
  title: string
  scene: ChatScene
  jobId?: string
  createdAt: string
  updatedAt: string
}

/** 聊天会话详情（含完整消息） */
export interface ChatSessionDetail {
  id: string
  title: string
  scene: ChatScene
  jobId?: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}
