<script setup lang="ts">
/**
 * 流式 Markdown 渲染器
 * 使用 @krishanjinbo/vue-markdown-stream 的底层工具 + 自定义容器块
 * 修复：使用 props 缓存 + 稳定渲染函数，防止流式输出时组件块抖动
 */
import { computed, h, defineComponent, type Component, type VNode } from 'vue'
import MarkdownIt from 'markdown-it'
import container from 'markdown-it-container'
import { autoCloseContainers, htmlToVnodes, type ComponentMap } from '@krishanjinbo/vue-markdown-stream'
import JobCardBlock from './blocks/JobCardBlock.vue'
import SkillRadarBlock from './blocks/SkillRadarBlock.vue'
import SalaryBarBlock from './blocks/SalaryBarBlock.vue'
import CompareTableBlock from './blocks/CompareTableBlock.vue'
import AlertBlock from './blocks/AlertBlock.vue'

const props = defineProps<{
  /** Markdown 文本内容 */
  content: string
  /** 是否正在流式输出 */
  isStreaming: boolean
}>()

/** 自定义组件映射 */
const componentMap: ComponentMap = {
  JobCardBlock: JobCardBlock as unknown as Component,
  SkillRadarBlock: SkillRadarBlock as unknown as Component,
  SalaryBarBlock: SalaryBarBlock as unknown as Component,
  CompareTableBlock: CompareTableBlock as unknown as Component,
  AlertBlock: AlertBlock as unknown as Component,
}

/**
 * Props 缓存：相同 JSON 字符串返回相同对象引用
 * 避免流式更新时未变更的组件块被重复渲染
 */
const propsCache = new Map<string, Record<string, unknown>>()

function getCachedProps(rawJsonStr: string): Record<string, unknown> | null {
  const existing = propsCache.get(rawJsonStr)
  if (existing) return existing
  try {
    const parsed = JSON.parse(decodeURIComponent(rawJsonStr))
    propsCache.set(rawJsonStr, parsed)
    return parsed
  } catch {
    return null
  }
}

/** 创建自定义 markdown-it 实例，注册所有容器块 */
const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

// :::job-card {"title":"...","company":"...",...}
md.use(container, 'job-card', {
  validate: (params: string) => /^job-card/.test(params.trim()),
  render(tokens: any[], idx: number) {
    const token = tokens[idx]
    if (token.nesting === 1) {
      const jsonStr = token.info.trim().replace(/^job-card\s*/, '')
      return `<vue-block data-component="JobCardBlock" data-props="${encodeURIComponent(jsonStr)}">\n`
    }
    return '</vue-block>\n'
  },
})

// :::skill-radar {"labels":[...],"you":[...],"required":[...]}
md.use(container, 'skill-radar', {
  validate: (params: string) => /^skill-radar/.test(params.trim()),
  render(tokens: any[], idx: number) {
    const token = tokens[idx]
    if (token.nesting === 1) {
      const jsonStr = token.info.trim().replace(/^skill-radar\s*/, '')
      return `<vue-block data-component="SkillRadarBlock" data-props="${encodeURIComponent(jsonStr)}">\n`
    }
    return '</vue-block>\n'
  },
})

// :::salary-bar {"min":N,"max":N,"median":N,"yourExpect":N}
md.use(container, 'salary-bar', {
  validate: (params: string) => /^salary-bar/.test(params.trim()),
  render(tokens: any[], idx: number) {
    const token = tokens[idx]
    if (token.nesting === 1) {
      const jsonStr = token.info.trim().replace(/^salary-bar\s*/, '')
      return `<vue-block data-component="SalaryBarBlock" data-props="${encodeURIComponent(jsonStr)}">\n`
    }
    return '</vue-block>\n'
  },
})

// :::compare （内部是 Markdown 表格）
md.use(container, 'compare', {
  validate: (params: string) => /^compare/.test(params.trim()),
  render(tokens: any[], idx: number) {
    const token = tokens[idx]
    if (token.nesting === 1) {
      return '<vue-block data-component="CompareTableBlock">\n'
    }
    return '</vue-block>\n'
  },
})

// :::alert info/warning/success
md.use(container, 'alert', {
  validate: (params: string) => /^alert(\s+(info|warning|success))?/.test(params.trim()),
  render(tokens: any[], idx: number) {
    const token = tokens[idx]
    if (token.nesting === 1) {
      const type = token.info.trim().match(/^alert\s*(\S*)/)?.[1] || 'info'
      return `<vue-block data-component="AlertBlock" data-type="${type}">\n`
    }
    return '</vue-block>\n'
  },
})

/** 渲染 Markdown 为 HTML（带自动关闭未结束的容器块） */
function renderMarkdown(raw: string): string {
  const closed = autoCloseContainers(raw)
  return md.render(closed)
}

/** 自定义 htmlToVnodes 包装：解析 data-props 属性 */
function customHtmlToVnodes(html: string): (VNode | string)[] {
  if (!html) return []

  const div = document.createElement('div')
  div.innerHTML = html

  return processNodes(div.childNodes)
}

/** 用于给 vue-block 分配稳定 key 的计数器 */
let blockKeyCounter = 0

/** 递归处理 DOM 节点 */
function processNodes(nodes: NodeListOf<ChildNode>): (VNode | string)[] {
  const result: (VNode | string)[] = []
  for (const node of Array.from(nodes)) {
    const vnode = processNode(node)
    if (vnode !== null) result.push(vnode)
  }
  return result
}

function processNode(node: ChildNode): VNode | string | null {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
  if (node.nodeType === Node.COMMENT_NODE) return null

  const el = node as Element
  const tagName = el.tagName?.toLowerCase()

  if (tagName === 'vue-block') {
    const compName = el.getAttribute('data-component')
    if (!compName || !componentMap[compName]) {
      return h('div', { innerHTML: el.innerHTML })
    }

    const comp = componentMap[compName]
    let compProps: Record<string, unknown> = {}

    // 使用缓存解析 data-props，相同 JSON 返回相同引用
    const propsStr = el.getAttribute('data-props')
    if (propsStr) {
      const cached = getCachedProps(propsStr)
      if (cached) compProps = cached
    }

    // 其他 data- 属性（如 data-type）
    for (const attr of Array.from(el.attributes)) {
      if (attr.name !== 'data-component' && attr.name !== 'data-props' && attr.name.startsWith('data-')) {
        // 只有当 compProps 是缓存对象时，避免污染缓存，用扩展
        if (propsStr && compProps === propsCache.get(propsStr)) {
          compProps = { ...compProps, [attr.name.slice(5)]: attr.value }
        } else {
          compProps[attr.name.slice(5)] = attr.value
        }
      }
    }

    // 使用 compName + propsStr 作为稳定 key，防止 Vue diff 时错位
    const stableKey = `${compName}:${propsStr || blockKeyCounter++}`

    const children = processNodes(el.childNodes)
    return h(comp, { ...compProps, key: stableKey }, { default: () => children })
  }

  const children = processNodes(el.childNodes)
  const attrs: Record<string, string> = {}
  for (const attr of Array.from(el.attributes)) {
    attrs[attr.name] = attr.value
  }
  return h(tagName, attrs, children)
}

/** 流式输出时末尾追加光标 */
const display = computed(() =>
  props.isStreaming ? props.content + '▍' : props.content,
)

/** 渲染函数 */
const vnodes = computed(() => {
  const html = renderMarkdown(display.value)
  blockKeyCounter = 0 // 每次重渲染重置计数器，保证位置一致
  return customHtmlToVnodes(html)
})

/**
 * 稳定的渲染组件：使用 defineComponent 保证组件引用不变
 * 避免 `<component :is="() => vnodes" />` 每次创建新函数导致全量卸载/重建
 */
const VNodeRenderer = defineComponent({
  name: 'VNodeRenderer',
  setup() {
    return () => vnodes.value
  },
})
</script>

<template>
  <div class="chat-markdown">
    <VNodeRenderer />
  </div>
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
