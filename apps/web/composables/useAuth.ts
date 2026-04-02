import type { User, AuthResponse, ApiResponse } from '@job-radar/shared'

/** 用户登录状态管理 */
export function useAuth() {
  const apiBase = useApiBase()

  const user = useState<User | null>('auth-user', () => null)
  const isLoggedIn = computed(() => !!user.value)

  /** 初始化：从 localStorage 恢复状态 */
  function init() {
    if (import.meta.server) return

    const token = localStorage.getItem('accessToken')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        clearStorage()
      }
    }
  }

  /** 登录 */
  async function login(email: string, password: string) {
    const res = await $fetch<ApiResponse<AuthResponse>>(`${apiBase}/auth/login`, {
      method: 'POST',
      body: { email, password },
    })
    saveAuth(res.data)
    return res.data
  }

  /** 注册 */
  async function register(email: string, password: string, nickname?: string) {
    const res = await $fetch<ApiResponse<AuthResponse>>(`${apiBase}/auth/register`, {
      method: 'POST',
      body: { email, password, nickname },
    })
    saveAuth(res.data)
    return res.data
  }

  /** 刷新令牌 */
  async function refreshTokens() {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      logout()
      return
    }

    try {
      const res = await $fetch<ApiResponse<AuthResponse>>(`${apiBase}/auth/refresh`, {
        method: 'POST',
        body: { refreshToken },
      })
      saveAuth(res.data)
    } catch {
      logout()
    }
  }

  /** 登出 */
  async function logout() {
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        await $fetch(`${apiBase}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // 登出失败也清除本地状态
      }
    }
    clearStorage()
    user.value = null
    navigateTo('/auth/login')
  }

  /** 获取 access token */
  function getToken(): string | null {
    if (import.meta.server) return null
    return localStorage.getItem('accessToken')
  }

  function saveAuth(data: AuthResponse) {
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    user.value = data.user
  }

  function clearStorage() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  // 客户端初始化
  if (import.meta.client) {
    init()
  }

  return {
    user,
    isLoggedIn,
    login,
    register,
    logout,
    refreshTokens,
    getToken,
  }
}
