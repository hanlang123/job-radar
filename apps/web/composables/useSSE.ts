import type { SSEChunk, AgentStatus, AgentStatusStep } from '@job-radar/shared'

interface UseSSEOptions {
  /** 请求的 URL */
  url: string
  /** 请求体 */
  body: Record<string, unknown>
  /** 恢复模式：将新内容追加到此前缀后 */
  resumePrefix?: string
  /** 收到新文本块时的回调 */
  onMessage?: (content: string) => void
  /** 流结束的回调 */
  onDone?: (conversationId: string) => void
  /** 发生错误时的回调 */
  onError?: (error: Error) => void
  /** Agent 状态变更回调 */
  onStatusChange?: (status: AgentStatus, step: AgentStatusStep) => void
}

/**
 * SSE 流式消费 composable（支持中断与恢复）
 * 通过 fetch + ReadableStream 消费 POST SSE 端点
 * 使用 requestAnimationFrame 节流回调，确保流畅的打字机效果
 */
export function useSSE() {
  const content = ref('')
  const isStreaming = ref(false)
  const conversationId = ref('')
  /** 当前 Agent 执行状态 */
  const agentStatus = ref<AgentStatus>('thinking')
  /** Agent 状态步骤历史 */
  const statusSteps = ref<AgentStatusStep[]>([])
  /** 是否被用户主动中断 */
  const isInterrupted = ref(false)
  /** 流开始时间戳（用于计算 duration） */
  let streamStartTime = 0
  let abortController: AbortController | null = null

  /** 记录一个状态步骤 */
  function pushStatus(status: AgentStatus, label: string) {
    agentStatus.value = status
    statusSteps.value.push({
      status,
      label,
      timestamp: new Date().toISOString(),
      duration: streamStartTime ? Date.now() - streamStartTime : 0,
    })
  }

  /** 开始流式请求 */
  async function start(options: UseSSEOptions) {
    const { url, body, resumePrefix, onMessage, onDone, onError, onStatusChange } = options

    // 取消之前的请求
    abort()

    content.value = resumePrefix || ''
    conversationId.value = ''
    isStreaming.value = true
    isInterrupted.value = false
    streamStartTime = Date.now()
    abortController = new AbortController()

    // 重置或保留已有步骤（恢复模式保留历史步骤）
    if (!resumePrefix) {
      statusSteps.value = []
    }
    pushStatus('thinking', '思考中...')
    onStatusChange?.('thinking', statusSteps.value[statusSteps.value.length - 1])

    // RAF 节流
    let rafId = 0
    let needsFlush = false

    function scheduleFlush() {
      if (!needsFlush) {
        needsFlush = true
        rafId = requestAnimationFrame(() => {
          needsFlush = false
          onMessage?.(content.value)
        })
      }
    }

    async function doFetch(token: string | null) {
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: abortController!.signal,
      })
    }

    try {
      let token = localStorage.getItem('accessToken')
      let response = await doFetch(token)

      if (response.status === 401) {
        const { refreshTokens } = useAuth()
        await refreshTokens()
        token = localStorage.getItem('accessToken')
        if (!token) {
          navigateTo('/auth/login')
          throw new Error('登录已过期，请重新登录')
        }
        response = await doFetch(token)
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let firstChunkReceived = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = ''

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (line === '') continue

          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            try {
              const parsed: SSEChunk = JSON.parse(data)

              if (parsed.event === 'agent_status') {
                const statusLabels: Record<AgentStatus, string> = {
                  thinking: '思考中...',
                  streaming: '生成中...',
                  interrupted: '已中断',
                  failed: '执行失败',
                  completed: '完成',
                }
                pushStatus(parsed.status, statusLabels[parsed.status])
                onStatusChange?.(parsed.status, statusSteps.value[statusSteps.value.length - 1])
              } else if (parsed.event === 'message') {
                // 第一个内容 chunk → 切换到 streaming 状态
                if (!firstChunkReceived) {
                  firstChunkReceived = true
                  pushStatus('streaming', '生成中...')
                  onStatusChange?.('streaming', statusSteps.value[statusSteps.value.length - 1])
                }
                content.value += parsed.answer
                if (parsed.conversation_id) {
                  conversationId.value = parsed.conversation_id
                }
                scheduleFlush()
              } else if (parsed.event === 'message_end') {
                if (rafId) {
                  cancelAnimationFrame(rafId)
                  rafId = 0
                  needsFlush = false
                }
                isStreaming.value = false
                pushStatus('completed', '完成')
                onStatusChange?.('completed', statusSteps.value[statusSteps.value.length - 1])
                onMessage?.(content.value)
                onDone?.(parsed.conversation_id)
                return
              } else if (parsed.event === 'error') {
                throw new Error(parsed.message || '服务器错误')
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                buffer = lines.slice(i).join('\n')
                break
              }
              throw e
            }
          }
        }
      }

      // 流自然结束（未收到 message_end）
      if (rafId) cancelAnimationFrame(rafId)
      isStreaming.value = false
      pushStatus('completed', '完成')
      onStatusChange?.('completed', statusSteps.value[statusSteps.value.length - 1])
      onMessage?.(content.value)
      onDone?.(conversationId.value)
    } catch (error) {
      if (rafId) cancelAnimationFrame(rafId)
      isStreaming.value = false

      if ((error as Error).name === 'AbortError') {
        // 用户主动中断
        isInterrupted.value = true
        pushStatus('interrupted', '已中断')
        onStatusChange?.('interrupted', statusSteps.value[statusSteps.value.length - 1])
        return
      }

      pushStatus('failed', `失败: ${(error as Error).message}`)
      onStatusChange?.('failed', statusSteps.value[statusSteps.value.length - 1])
      onError?.(error as Error)
    }
  }

  /** 取消当前流式请求（标记为中断） */
  function abort() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isStreaming.value = false
  }

  return {
    content,
    isStreaming,
    conversationId,
    agentStatus,
    statusSteps,
    isInterrupted,
    start,
    abort,
  }
}
