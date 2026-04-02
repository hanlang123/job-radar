import { MarkdownRenderer } from '@krishanjinbo/vue-markdown-stream'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('MarkdownRenderer', MarkdownRenderer)
})
