/**
 * 路由鉴权中间件：保护需要登录的页面
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const token = localStorage.getItem('accessToken')
  if (!token) {
    return navigateTo('/auth/login', { replace: true })
  }
})
