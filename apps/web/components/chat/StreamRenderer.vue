<script setup lang="ts">
/**
 * 流式 Markdown 渲染器
 *
 * 基于 @krishanjinbo/vue-markdown-stream v2+ 的开箱即用 API：
 *  - 直接使用 `<MarkdownRenderer>`，通过 `blocks` prop 注册自定义容器块
 *  - `streaming` prop 开启流式解析（rAF 节流 + 末尾光标）
 *  - `cursor` prop 自定义光标字符
 *
 * 上层 props 保持不变（content / isStreaming），对外 API 零侵入。
 */
import { MarkdownRenderer, defineBlock } from '@krishanjinbo/vue-markdown-stream'
import JobCardBlock from './blocks/JobCardBlock.vue'
import SkillRadarBlock from './blocks/SkillRadarBlock.vue'
import SalaryBarBlock from './blocks/SalaryBarBlock.vue'
import CompareTableBlock from './blocks/CompareTableBlock.vue'
import AlertBlock from './blocks/AlertBlock.vue'

defineProps<{
  /** Markdown 文本内容 */
  content: string
  /** 是否正在流式输出 */
  isStreaming: boolean
}>()

/**
 * 自定义块注册表
 *
 * - job-card / skill-radar / salary-bar：info-string 为 JSON，使用 `parseInfo: 'json'`
 *   语法示例：`:::job-card {"title":"...","company":"..."}`
 * - compare：无 info 参数，内部是 Markdown 表格，由渲染器递归解析 slot 内容
 * - alert：info-string 为 `info | warning | success`，需自定义解析成 `{ type }`
 *   使用 `override: true` 覆盖内置 alert 块，以启用项目自有的暗色主题 AlertBlock
 */
const blocks = [
  defineBlock({
    name: 'job-card',
    component: JobCardBlock,
    componentName: 'JobCardBlock',
    parseInfo: 'json',
  }),
  defineBlock({
    name: 'skill-radar',
    component: SkillRadarBlock,
    componentName: 'SkillRadarBlock',
    parseInfo: 'json',
  }),
  defineBlock({
    name: 'salary-bar',
    component: SalaryBarBlock,
    componentName: 'SalaryBarBlock',
    parseInfo: 'json',
  }),
  defineBlock({
    name: 'compare',
    component: CompareTableBlock,
    componentName: 'CompareTableBlock',
  }),
  defineBlock({
    name: 'alert',
    component: AlertBlock,
    componentName: 'AlertBlock',
    override: true,
    parseInfo: (rest: string) => {
      const type = rest.trim().split(/\s+/)[0]
      return { type: type === 'warning' || type === 'success' ? type : 'info' }
    },
  }),
]
</script>

<template>
  <MarkdownRenderer
    class="chat-markdown"
    :content="content"
    :blocks="blocks"
    :streaming="isStreaming"
    cursor="▍"
  />
</template>

<style scoped lang="scss">
.chat-markdown {
  line-height: 1.8;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);

  :deep(h1, h2, h3) {
    margin: 16px 0 8px;
    color: rgba(255, 255, 255, 0.9);
  }

  :deep(p) {
    margin: 8px 0;
  }

  :deep(code) {
    background: rgba(0, 224, 255, 0.08);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: #00e0ff;
    font-family: 'JetBrains Mono', monospace;
  }

  :deep(pre) {
    background: rgba(0, 0, 0, 0.4);
    color: #d4d4d4;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    overflow-x: auto;
    margin: 12px 0;

    code {
      background: none;
      padding: 0;
      color: inherit;
    }
  }

  :deep(ul, ol) {
    padding-left: 20px;
    margin: 8px 0;
  }

  :deep(blockquote) {
    border-left: 3px solid #00e0ff;
    padding-left: 12px;
    margin: 12px 0;
    color: rgba(255, 255, 255, 0.55);
  }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;

    th, td {
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background: rgba(255, 255, 255, 0.04);
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
    }
  }
}
</style>
