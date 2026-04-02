/**
 * auth 插件：在应用初始化时从 localStorage 恢复用户登录状态
 */
export default defineNuxtPlugin(() => {
  // auth 状态通过 useAuth composable 管理
  // 此插件保证客户端初始化时 composable 可用
})
