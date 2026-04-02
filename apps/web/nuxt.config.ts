// https://nuxt.com/docs/api/configuration/nuxt-config
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const vmsDir = dirname(require.resolve('@krishanjinbo/vue-markdown-stream'))
const vmsCss = join(vmsDir, 'vue-markdown-stream.css')

export default defineNuxtConfig({
  devtools: { enabled: true },

  typescript: {
    strict: true,
  },

  css: [
    'element-plus/dist/index.css',
    '~/assets/styles/global.scss',
    vmsCss,
  ],

  // Element Plus 自动导入
  modules: ['@element-plus/nuxt'],

  elementPlus: {
    importStyle: false,
    icon: 'ElIcon',
  },

  // SSR / CSR 路由规则
  routeRules: {
    '/': { ssr: true },
    '/jobs': { ssr: true },
    '/jobs/**': { ssr: true },
    '/auth/**': { ssr: true },
    '/graph': { ssr: false },
    '/chat': { ssr: false },
    '/dashboard': { ssr: false },
    '/admin': { ssr: false },
  },

  // Element Plus SSR 兼容: 将 ES 模块内的 window 引用交给 Vite 处理
  build: {
    transpile: ['element-plus/es'],
  },

  // 运行时配置
  runtimeConfig: {
    // 仅服务端可用（SSR 请求，容器内部网络）
    apiBaseServer: '',
    public: {
      apiBase: 'http://localhost:3001/api',
    },
  },

  compatibilityDate: '2025-04-01',
})
