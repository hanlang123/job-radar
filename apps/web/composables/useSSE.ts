import type { SSEChunk } from '@job-radar/shared'

interface UseSSEOptions {
  /** 请求的 URL */
  url: string
  /** 请求体 */
  body: Record<string, unknown>
  /** 收到新文本块时的回调 */
  onMessage?: (content: string) => void
  /** 流结束的回调 */
  onDone?: (conversationId: string) => void
  /** 发生错误时的回调 */
  onError?: (error: Error) => void
}

/**
 * SSE 流式消费 composable（Dify 简化版格式）
 * 通过 fetch + ReadableStream 消费 POST SSE 端点
 * 使用 requestAnimationFrame 节流回调，确保流畅的打字机效果
 */
export function useSSE() {
  const content = ref('')
  const isStreaming = ref(false)
  const conversationId = ref('')
  let abortController: AbortController | null = null

  /** 开始流式请求 */
  async function start(options: UseSSEOptions) {
    const { url, body, onMessage, onDone, onError } = options

    // 取消之前的请求
    abort()

    content.value = ''
    conversationId.value = ''
    isStreaming.value = true
    abortController = new AbortController()

    // RAF 节流：累积 chunk 到 content.value，但 onMessage 回调每帧最多触发一次
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

    /** 发起 SSE 请求，支持传入 token */
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

      // 401 时自动刷新 token 并重试一次
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

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // 解析 SSE 格式：data: {...}\n\n
        const lines = buffer.split('\n')
        buffer = ''

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()

          if (line === '') continue

          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            try {
              const parsed: SSEChunk = JSON.parse(data)

              if (parsed.event === 'message') {
                content.value += parsed.answer
                if (parsed.conversation_id) {
                  conversationId.value = parsed.conversation_id
                }
                scheduleFlush()
              } else if (parsed.event === 'message_end') {
                // 取消待执行的 RAF，立即做最终刷新
                if (rafId) {
                  cancelAnimationFrame(rafId)
                  rafId = 0
                  needsFlush = false
                }
                isStreaming.value = false
                onMessage?.(content.value)
                onDone?.(parsed.conversation_id)
                return
              } else if (parsed.event === 'error') {
                throw new Error(parsed.message || '服务器错误')
              }
            } catch (e) {
              // JSON 解析失败，可能是不完整数据，放回 buffer
              if (e instanceof SyntaxError) {
                buffer = lines.slice(i).join('\n')
                break
              }
              // 其他错误（包括从 error 事件抛出的）直接抛
              throw e
            }
          }
        }
      }

      // 流自然结束（未收到 message_end）
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      isStreaming.value = false
      onMessage?.(content.value)
      onDone?.(conversationId.value)
    } catch (error) {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      isStreaming.value = false
      if ((error as Error).name === 'AbortError') return
      onError?.(error as Error)
    }
  }

  /** 取消当前流式请求 */
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
    start,
    abort,
  }
}
