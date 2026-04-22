// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  typescript: {
    strict: true,
  },

  css: [
    'element-plus/dist/index.css',
    '~/assets/styles/global.scss',
    // vue-markdown-stream 内置块样式（v2+ 通过 exports 子路径暴露）
    '@krishanjinbo/vue-markdown-stream/style.css',
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
