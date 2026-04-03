import type { ChatSessionListItem, ChatSessionDetail, ChatScene, ChatMessage, ApiResponse } from '@job-radar/shared'

/**
 * 聊天历史会话管理 composable
 * 提供会话列表获取、会话详情加载、删除、重命名等功能
 */
export function useChatHistory() {
  const config = useRuntimeConfig()
  const { getToken, refreshTokens } = useAuth()

  const sessions = ref<ChatSessionListItem[]>([])
  const loading = ref(false)

  /** 带 token 的 fetch 封装，支持 401 自动刷新重试 */
  async function authFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    let token = getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    let res = await fetch(url, { ...options, headers })

    // 401 时自动刷新 token 并重试一次
    if (res.status === 401) {
      await refreshTokens()
      token = getToken()
      if (!token) {
        navigateTo('/auth/login')
        throw new Error('登录已过期，请重新登录')
      }
      headers.Authorization = `Bearer ${token}`
      res = await fetch(url, { ...options, headers })
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `HTTP ${res.status}`)
    }

    return res.json()
  }

  /** 获取会话列表 */
  async function fetchSessions(scene?: ChatScene) {
    loading.value = true
    try {
      const params = scene ? `?scene=${scene}` : ''
      const res = await authFetch<ApiResponse<ChatSessionListItem[]>>(
        `${config.public.apiBase}/chat/sessions${params}`,
      )
      sessions.value = res.data
    } catch (error) {
      console.error('获取会话列表失败:', error)
      sessions.value = []
    } finally {
      loading.value = false
    }
  }

  /** 获取单个会话详情（含完整消息） */
  async function fetchSessionDetail(id: string): Promise<ChatSessionDetail | null> {
    try {
      const res = await authFetch<ApiResponse<ChatSessionDetail>>(
        `${config.public.apiBase}/chat/sessions/${id}`,
      )
      return res.data
    } catch (error) {
      console.error('获取会话详情失败:', error)
      return null
    }
  }

  /** 删除会话 */
  async function deleteSession(id: string): Promise<boolean> {
    try {
      await authFetch<ApiResponse<{ success: boolean }>>(
        `${config.public.apiBase}/chat/sessions/${id}`,
        { method: 'DELETE' },
      )
      sessions.value = sessions.value.filter(s => s.id !== id)
      return true
    } catch (error) {
      console.error('删除会话失败:', error)
      return false
    }
  }

  /** 重命名会话 */
  async function renameSession(id: string, title: string): Promise<boolean> {
    try {
      await authFetch<ApiResponse<ChatSessionDetail>>(
        `${config.public.apiBase}/chat/sessions/${id}`,
        { method: 'PATCH', body: JSON.stringify({ title }) },
      )
      const session = sessions.value.find(s => s.id === id)
      if (session) {
        session.title = title
      }
      return true
    } catch (error) {
      console.error('重命名会话失败:', error)
      return false
    }
  }

  return {
    sessions,
    loading,
    fetchSessions,
    fetchSessionDetail,
    deleteSession,
    renameSession,
  }
}
