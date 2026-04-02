/** 用户角色 */
export type UserRole = 'user' | 'admin'

/** 用户类型 */
export interface User {
  id: string
  email: string
  nickname?: string
  skills: string[]
  targetCity?: string
  targetSalary?: number
  role: UserRole
  createdAt: string
}

/** 登录请求 */
export interface LoginRequest {
  email: string
  password: string
}

/** 注册请求 */
export interface RegisterRequest {
  email: string
  password: string
  nickname?: string
}

/** 认证响应 */
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

/** 通用 API 响应 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}
