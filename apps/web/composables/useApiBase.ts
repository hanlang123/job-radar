/**
 * 根据运行环境返回正确的 API 基地址
 * SSR 时使用服务端内部地址（Docker 内部网络），客户端使用公网地址
 */
export function useApiBase(): string {
  const config = useRuntimeConfig()
  if (import.meta.server && config.apiBaseServer) {
    return config.apiBaseServer as string
  }
  return config.public.apiBase as string
}
