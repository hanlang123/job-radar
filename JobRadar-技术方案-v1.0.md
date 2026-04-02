# JobRadar — 职位情报分析平台 技术方案 v1.0

## 1. 项目概述

### 1.1 定位

JobRadar 是一个面向前端求职者的数据驱动型职位分析平台，核心价值是将 Boss 直聘等渠道的岗位数据转化为可交互的洞察。项目同时作为个人求职作品，用于展示 SSR、流式 AI 交互、D3 可视化等全栈工程能力。

### 1.2 核心卖点

- **AI 智能分析**：基于 SSE 流式架构 + vue-markdown-stream 自研库，AI 输出的不是纯文本，而是实时渲染的 Vue 组件（职位卡片、技能雷达图、薪资对比条等）
- **技术图谱**：D3 力导向图展示技术栈关联关系、公司-岗位-技能三层图谱
- **SSR 首屏**：Nuxt 3 混合渲染，公开页面 SSR 保证 SEO 与首屏速度，交互页面 CSR 保证体验

### 1.3 技术栈总览

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 前端框架 | Nuxt 3 | SSR 开箱即用，支持混合渲染模式（SSR / CSR / ISR） |
| UI 组件库 | Element Plus + 自定义组件 | 后台管理场景成熟方案 |
| AI 渲染层 | @krishanjinbo/vue-markdown-stream（自研） | 流式 Markdown + Vue 组件块渲染 |
| 可视化 | D3.js v7 | 力导向图、雷达图、桑基图等定制化图表 |
| 后端框架 | NestJS | 模块化架构，原生支持 SSE、装饰器路由、TypeORM 集成 |
| 数据库 | PostgreSQL + Redis | PG 存储结构化岗位数据，Redis 缓存热点查询与会话 |
| AI 服务 | OpenAI / Claude 官方 API | 直接对接，无中间代理层 |
| 鉴权 | JWT Access + Refresh Token | 双令牌机制，Redis 存储 Refresh Token |
| 部署 | Docker Compose | 前后端 + DB + Redis 一键启动 |

---

## 2. 系统架构

### 2.1 整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  Nuxt 3 SSR │  │  D3 图谱模块  │  │ vue-markdown-stream │ │
│  │  Pages/      │  │  (CSR Only)  │  │ + SSE 消费          │ │
│  │  Components  │  │              │  │ + 自定义组件块       │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘ │
│         │                 │                      │            │
│         └─────────────────┼──────────────────────┘            │
│                           │ HTTP / SSE                        │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                     NestJS Backend                            │
│                                                              │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌────────────────┐  │
│  │ Auth    │  │ Job      │  │ AI     │  │ Analysis       │  │
│  │ Module  │  │ Module   │  │ Module │  │ Module         │  │
│  │ JWT/    │  │ CRUD/    │  │ SSE/   │  │ 图谱数据/      │  │
│  │ Guard   │  │ Search   │  │ Stream │  │ 统计聚合       │  │
│  └────┬────┘  └────┬─────┘  └────┬───┘  └────────┬───────┘  │
│       │            │             │                │           │
│       └────────────┴─────────────┴────────────────┘           │
│                           │                                   │
│              ┌────────────┼────────────┐                      │
│              │            │            │                       │
│         ┌────▼───┐  ┌────▼───┐  ┌────▼──────────┐           │
│         │ PgSQL  │  │ Redis  │  │ OpenAI/Claude │           │
│         │ 岗位数据│  │ 缓存/  │  │ API           │           │
│         │ 用户数据│  │ Session│  │               │           │
│         └────────┘  └────────┘  └───────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 渲染策略

| 页面 | 渲染模式 | 理由 |
|------|---------|------|
| 首页（市场概览） | SSR | SEO、首屏速度 |
| 职位列表/详情 | SSR | 可被搜索引擎索引 |
| 技术图谱 | CSR（`<ClientOnly>`） | D3 强依赖 DOM，SSR 无意义 |
| AI 对话 | CSR | SSE 交互，纯客户端行为 |
| 个人仪表盘 | CSR | 私有数据，不需要 SEO |
| 登录/注册 | SSR | 简单表单页，SSR 加速首屏 |

---

## 3. 前端模块设计

### 3.1 Nuxt 3 目录结构

```
apps/web/
├── nuxt.config.ts
├── app.vue
├── pages/
│   ├── index.vue                    # 首页（SSR）市场数据概览
│   ├── jobs/
│   │   ├── index.vue                # 职位列表（SSR）
│   │   └── [id].vue                 # 职位详情（SSR）
│   ├── graph/
│   │   └── index.vue                # 技术图谱（CSR）
│   ├── chat/
│   │   └── index.vue                # AI 对话（CSR）
│   ├── dashboard/
│   │   └── index.vue                # 个人仪表盘（CSR）
│   └── auth/
│       ├── login.vue                # 登录（SSR）
│       └── register.vue             # 注册（SSR）
├── components/
│   ├── chat/
│   │   ├── ChatContainer.vue        # 对话容器
│   │   ├── ChatInput.vue            # 输入框 + 预设问题
│   │   ├── ChatMessage.vue          # 单条消息
│   │   └── StreamRenderer.vue       # vue-markdown-stream 封装层
│   ├── graph/
│   │   ├── ForceGraph.vue           # D3 力导向图主组件
│   │   ├── GraphControls.vue        # 图谱交互控制面板
│   │   ├── NodeTooltip.vue          # 节点悬浮详情
│   │   └── GraphLegend.vue          # 图例
│   ├── job/
│   │   ├── JobCard.vue              # 职位卡片
│   │   ├── JobFilter.vue            # 筛选面板
│   │   ├── SalaryRange.vue          # 薪资范围可视化
│   │   └── SkillTags.vue            # 技能标签云
│   ├── dashboard/
│   │   ├── MarketOverview.vue       # 市场总览卡片
│   │   ├── TrendChart.vue           # 趋势折线图
│   │   └── SkillRadar.vue           # 个人技能雷达图
│   └── common/
│       ├── AppHeader.vue
│       ├── AppFooter.vue
│       └── LoadingSkeleton.vue
├── composables/
│   ├── useSSE.ts                    # SSE 连接管理
│   ├── useAuth.ts                   # 鉴权状态
│   ├── useJobSearch.ts              # 职位搜索
│   └── useGraph.ts                  # 图谱数据处理
├── plugins/
│   ├── markdown-stream.client.ts    # vue-markdown-stream 注册（仅客户端）
│   └── auth.ts                      # 鉴权初始化
├── middleware/
│   └── auth.ts                      # 路由鉴权守卫
├── server/
│   └── api/                         # Nuxt Server Routes（BFF 层，可选）
└── assets/
    └── styles/
```

### 3.2 vue-markdown-stream 集成方案（核心亮点 ⭐）

#### 3.2.1 自定义组件块注册

在 `plugins/markdown-stream.client.ts` 中注册项目专用组件块：

```typescript
// plugins/markdown-stream.client.ts
import { defineNuxtPlugin } from '#app'
import { MarkdownRenderer } from '@krishanjinbo/vue-markdown-stream'

// 自定义组件块
import JobCard from '~/components/chat/blocks/JobCardBlock.vue'
import SkillRadar from '~/components/chat/blocks/SkillRadarBlock.vue'
import SalaryBar from '~/components/chat/blocks/SalaryBarBlock.vue'
import CompareTable from '~/components/chat/blocks/CompareTableBlock.vue'
import AlertBlock from '~/components/chat/blocks/AlertBlock.vue'

export default defineNuxtPlugin((nuxtApp) => {
  // 注册 MarkdownRenderer 为全局组件
  nuxtApp.vueApp.component('MarkdownRenderer', MarkdownRenderer)

  // 注册自定义组件块映射（供 markdown-it-container 解析）
  nuxtApp.provide('markdownBlocks', {
    'job-card': JobCard,       // :::job-card {...props}
    'skill-radar': SkillRadar, // :::skill-radar {...data}
    'salary-bar': SalaryBar,   // :::salary-bar {...range}
    'compare': CompareTable,   // :::compare
    'alert': AlertBlock,       // :::alert warning/info/success
  })
})
```

#### 3.2.2 AI 输出的 Markdown 协议

后端 prompt 工程中约定 AI 使用以下 Markdown 语法，前端 vue-markdown-stream 自动渲染为对应 Vue 组件：

```markdown
## 分析结果

根据你的技能栈，该岗位匹配度为 **78%**。

::: alert info
该岗位要求 3 年以上 Vue 经验，你的开源项目 vue-markdown-stream 是很好的加分项。
:::

::: job-card {"title":"高级前端工程师","company":"字节跳动","salary":"30-50K","city":"北京","tags":["Vue3","TypeScript","SSR"]}
:::

::: skill-radar {"labels":["Vue3","React","Node","TypeScript","D3"],"you":[95,50,80,90,70],"required":[90,30,60,85,40]}
:::

::: salary-bar {"min":30,"max":50,"median":38,"yourExpect":35}
:::

### 建议

1. 重点突出你的 **SSR** 和 **流式渲染** 经验
2. D3 可视化能力是差异化优势
```

#### 3.2.3 StreamRenderer 封装层

```typescript
// components/chat/StreamRenderer.vue
<script setup lang="ts">
import { computed } from 'vue'
import { MarkdownRenderer, useStreamingText } from '@krishanjinbo/vue-markdown-stream'

const props = defineProps<{
  content: string
  isStreaming: boolean
}>()

const display = computed(() =>
  props.isStreaming ? props.content + '▍' : props.content
)
</script>

<template>
  <MarkdownRenderer
    :content="display"
    class="chat-markdown"
  />
</template>
```

### 3.3 SSE 消费层

```typescript
// composables/useSSE.ts
export function useSSE() {
  const content = ref('')
  const isStreaming = ref(false)
  const error = ref<Error | null>(null)
  const abortController = ref<AbortController | null>(null)

  async function sendMessage(
    message: string,
    options?: { jobId?: string; context?: string }
  ) {
    content.value = ''
    isStreaming.value = true
    error.value = null
    abortController.value = new AbortController()

    const token = useAuth().accessToken.value

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message, ...options }),
        signal: abortController.value.signal,
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        // 解析 SSE 格式
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              content.value += parsed.content ?? ''
            } catch {
              // 非 JSON 数据，直接追加
              content.value += data
            }
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') error.value = e
    } finally {
      isStreaming.value = false
    }
  }

  function abort() {
    abortController.value?.abort()
    isStreaming.value = false
  }

  return { content, isStreaming, error, sendMessage, abort }
}
```

### 3.4 D3 技术图谱模块（核心亮点 ⭐）

#### 3.4.1 数据模型

```typescript
// types/graph.ts

/** 图谱节点 */
interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  type: 'skill' | 'company' | 'job'
  // skill 节点
  frequency?: number    // 该技能在所有 JD 中的出现频率
  category?: string     // 前端框架 / 语言 / 工具链 / 后端 / DevOps
  // company 节点
  jobCount?: number     // 在招岗位数
  avgSalary?: number    // 平均薪资
  // job 节点
  salary?: [number, number]
  city?: string
}

/** 图谱连线 */
interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string
  target: string
  weight: number        // 关联强度（共现次数）
  type: 'skill-skill' | 'company-skill' | 'job-skill'
}

/** 图谱数据 */
interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}
```

#### 3.4.2 图谱类型与交互

**图谱 A：技术栈关联图（力导向图）**
- 从所有 JD 中提取技术关键词，统计两两共现频率
- 节点大小 = 该技术出现频率，连线粗细 = 共现次数
- 节点颜色按 category 分组（前端/后端/DevOps/工具链）
- 交互：hover 显示详细数据，点击高亮关联节点，双击筛选该技术的岗位
- 缩放、拖拽、搜索定位

**图谱 B：公司-技术矩阵（桑基图 / 弦图）**
- 左侧 = 公司，右侧 = 技术栈，连线宽度 = 该公司对该技术的需求量
- 点击公司节点 → 右侧面板展示该公司所有在招岗位

**图谱 C：个人技能匹配图（雷达图叠加）**
- 市场需求雷达 + 个人技能雷达叠加展示
- 差值区域高亮为"技能缺口"
- 可选择不同目标岗位切换雷达

#### 3.4.3 ForceGraph 核心组件结构

```typescript
// components/graph/ForceGraph.vue — 核心逻辑伪代码
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as d3 from 'd3'
import type { GraphData, GraphNode, GraphLink } from '~/types/graph'

const props = defineProps<{
  data: GraphData
  highlightSkills?: string[]  // 高亮当前用户拥有的技能
}>()

const emit = defineEmits<{
  (e: 'node-click', node: GraphNode): void
  (e: 'node-dblclick', node: GraphNode): void
}>()

const svgRef = ref<SVGSVGElement>()
let simulation: d3.Simulation<GraphNode, GraphLink>

onMounted(() => {
  const svg = d3.select(svgRef.value!)
  const width = svgRef.value!.clientWidth
  const height = svgRef.value!.clientHeight

  // 缩放
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.3, 5])
    .on('zoom', (event) => container.attr('transform', event.transform))
  svg.call(zoom)

  const container = svg.append('g')

  // 力仿真
  simulation = d3.forceSimulation<GraphNode>(props.data.nodes)
    .force('link', d3.forceLink<GraphNode, GraphLink>(props.data.links)
      .id(d => d.id)
      .distance(d => 100 / d.weight)
    )
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 5))

  // 连线
  const links = container.selectAll('.link')
    .data(props.data.links)
    .join('line')
    .attr('class', 'link')
    .attr('stroke-width', d => Math.sqrt(d.weight))

  // 节点
  const nodes = container.selectAll('.node')
    .data(props.data.nodes)
    .join('g')
    .attr('class', 'node')
    .call(drag(simulation))

  // 节点圆
  nodes.append('circle')
    .attr('r', d => getNodeRadius(d))
    .attr('fill', d => getNodeColor(d))
    .attr('stroke', d =>
      props.highlightSkills?.includes(d.id) ? '#10b981' : 'transparent'
    )
    .attr('stroke-width', 3)

  // 节点标签
  nodes.append('text')
    .text(d => d.label)
    .attr('dy', d => getNodeRadius(d) + 14)
    .attr('text-anchor', 'middle')

  // 事件
  nodes.on('click', (event, d) => emit('node-click', d))
  nodes.on('dblclick', (event, d) => emit('node-dblclick', d))

  // Tick
  simulation.on('tick', () => {
    links
      .attr('x1', d => (d.source as GraphNode).x!)
      .attr('y1', d => (d.source as GraphNode).y!)
      .attr('x2', d => (d.target as GraphNode).x!)
      .attr('y2', d => (d.target as GraphNode).y!)
    nodes.attr('transform', d => `translate(${d.x},${d.y})`)
  })
})

function getNodeRadius(node: GraphNode): number {
  if (node.type === 'skill') return Math.max(8, Math.sqrt(node.frequency ?? 1) * 4)
  if (node.type === 'company') return Math.max(12, Math.sqrt(node.jobCount ?? 1) * 5)
  return 6
}

function getNodeColor(node: GraphNode): string {
  const colorMap: Record<string, string> = {
    '前端框架': '#3b82f6',
    '编程语言': '#8b5cf6',
    '工具链':   '#f59e0b',
    '后端':     '#10b981',
    'DevOps':   '#ef4444',
    'company':  '#6366f1',
    'job':      '#64748b',
  }
  if (node.type === 'skill') return colorMap[node.category ?? ''] ?? '#94a3b8'
  return colorMap[node.type] ?? '#94a3b8'
}

function drag(sim: d3.Simulation<GraphNode, GraphLink>) {
  return d3.drag<SVGGElement, GraphNode>()
    .on('start', (event, d) => {
      if (!event.active) sim.alphaTarget(0.3).restart()
      d.fx = d.x; d.fy = d.y
    })
    .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
    .on('end', (event, d) => {
      if (!event.active) sim.alphaTarget(0)
      d.fx = null; d.fy = null
    })
}

onUnmounted(() => simulation?.stop())
</script>

<template>
  <svg ref="svgRef" class="w-full h-full" />
</template>
```

---

## 4. 后端模块设计

### 4.1 NestJS 项目结构

```
apps/server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── job/
│   │   │   ├── job.module.ts
│   │   │   ├── job.controller.ts
│   │   │   ├── job.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── job.entity.ts
│   │   │   │   └── company.entity.ts
│   │   │   └── dto/
│   │   │       ├── search-job.dto.ts
│   │   │       └── job-filter.dto.ts
│   │   ├── ai/
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.controller.ts        # SSE 端点
│   │   │   ├── ai.service.ts           # 大模型调用 + prompt 管理
│   │   │   ├── prompt/
│   │   │   │   ├── jd-analysis.prompt.ts
│   │   │   │   ├── skill-match.prompt.ts
│   │   │   │   ├── interview-mock.prompt.ts
│   │   │   │   └── base.prompt.ts
│   │   │   └── dto/
│   │   │       └── chat.dto.ts
│   │   ├── analysis/
│   │   │   ├── analysis.module.ts
│   │   │   ├── analysis.controller.ts
│   │   │   ├── analysis.service.ts     # 图谱数据聚合
│   │   │   └── dto/
│   │   │       └── graph-query.dto.ts
│   │   └── user/
│   │       ├── user.module.ts
│   │       ├── user.service.ts
│   │       └── entities/
│   │           └── user.entity.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   └── config/
│       ├── database.config.ts
│       ├── redis.config.ts
│       └── ai.config.ts
├── test/
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

### 4.2 NestJS SSE 流式架构（核心亮点 ⭐）

#### 4.2.1 AI Controller — SSE 端点

```typescript
// modules/ai/ai.controller.ts
import { Controller, Post, Body, Sse, UseGuards, Req, Res } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AiService } from './ai.service'
import { ChatDto } from './dto/chat.dto'
import { Response } from 'express'

@Controller('api/chat')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * SSE 流式对话端点
   *
   * 设计要点：
   * 1. 使用 POST 而非 GET，因为需要传递复杂的请求体
   * 2. 手动设置 SSE headers 而非 @Sse() 装饰器，因为 @Sse() 只支持 GET
   * 3. 通过 res.write() 逐 chunk 推送，不缓冲
   * 4. 错误处理：AI 调用失败时推送 error event，前端监听后展示
   */
  @Post('stream')
  async streamChat(
    @Body() dto: ChatDto,
    @CurrentUser() user: { id: string; email: string },
    @Res() res: Response,
  ) {
    // 设置 SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // Nginx 禁用缓冲
    res.flushHeaders()

    try {
      const stream = this.aiService.createChatStream(dto, user)

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
      }

      res.write('data: [DONE]\n\n')
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({
        message: error.message ?? '服务暂时不可用'
      })}\n\n`)
    } finally {
      res.end()
    }
  }
}
```

#### 4.2.2 AI Service — 大模型对接 + Prompt 管理

```typescript
// modules/ai/ai.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'
import { ChatDto } from './dto/chat.dto'
import { JdAnalysisPrompt } from './prompt/jd-analysis.prompt'
import { SkillMatchPrompt } from './prompt/skill-match.prompt'
import { InterviewMockPrompt } from './prompt/interview-mock.prompt'
import { JobService } from '../job/job.service'

@Injectable()
export class AiService {
  private client: OpenAI

  constructor(
    private config: ConfigService,
    private jobService: JobService,
  ) {
    this.client = new OpenAI({
      apiKey: this.config.get('AI_API_KEY'),
      baseURL: this.config.get('AI_BASE_URL'), // 支持切换 OpenAI / Claude
    })
  }

  /**
   * 核心流式对话生成器
   *
   * 根据 dto.scene 选择不同的 prompt 模板，
   * 并注入岗位数据作为上下文
   */
  async *createChatStream(
    dto: ChatDto,
    user: { id: string },
  ): AsyncGenerator<string> {
    // 构建上下文
    const context = await this.buildContext(dto)

    // 选择 prompt
    const systemPrompt = this.getSystemPrompt(dto.scene, context)

    // 调用大模型流式 API
    const stream = await this.client.chat.completions.create({
      model: this.config.get('AI_MODEL', 'gpt-4o'),
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...dto.history.map(h => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user', content: dto.message },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) yield content
    }
  }

  private async buildContext(dto: ChatDto): Promise<string> {
    let context = ''

    // 如果指定了岗位 ID，注入岗位详情
    if (dto.jobId) {
      const job = await this.jobService.findById(dto.jobId)
      if (job) {
        context += `\n当前分析的岗位信息：\n`
        context += `职位：${job.title}\n`
        context += `公司：${job.company}\n`
        context += `薪资：${job.salaryMin}-${job.salaryMax}K\n`
        context += `JD：${job.description}\n`
      }
    }

    // 如果有用户技能数据
    if (dto.includeProfile) {
      // TODO: 从用户 profile 中获取技能数据
    }

    return context
  }

  private getSystemPrompt(scene: string, context: string): string {
    const prompts: Record<string, string> = {
      'jd-analysis': JdAnalysisPrompt.build(context),
      'skill-match': SkillMatchPrompt.build(context),
      'interview-mock': InterviewMockPrompt.build(context),
    }

    return prompts[scene] ?? this.getDefaultPrompt(context)
  }

  private getDefaultPrompt(context: string): string {
    return `你是 JobRadar 的 AI 助手，专注于帮助前端开发者求职。

你的回答应使用 Markdown 格式，并充分利用以下自定义组件块来展示结构化数据：

- :::alert info/warning/success — 提示信息
- :::job-card {"title":"...","company":"...","salary":"..."} — 职位卡片
- :::skill-radar {"labels":[...],"you":[...],"required":[...]} — 技能雷达图
- :::salary-bar {"min":N,"max":N,"median":N} — 薪资对比条
- :::compare — 岗位对比表格

当分析岗位时，尽量使用上述组件块来直观展示数据，而不是纯文本。

${context ? `\n相关上下文：\n${context}` : ''}`
  }
}
```

#### 4.2.3 Prompt 模板示例

```typescript
// modules/ai/prompt/jd-analysis.prompt.ts
export class JdAnalysisPrompt {
  static build(context: string): string {
    return `你是一位资深的前端技术面试官和职业顾问。

用户将提供一个职位描述（JD），你需要进行深度分析：

## 分析框架

1. **核心要求提取**：列出硬性要求和加分项
2. **隐含要求识别**：从 JD 措辞中推断未明说的要求
3. **技术栈分析**：使用 :::skill-radar 展示技术要求分布
4. **薪资评估**：使用 :::salary-bar 展示市场参考
5. **匹配建议**：使用 :::alert 标注需要重点准备的方向

## 输出格式要求

- 使用 :::alert warning 标注风险点
- 使用 :::alert info 标注建议
- 使用 :::skill-radar 展示技能匹配度（如有用户技能数据）
- 语言简练，不要废话

${context}`
  }
}
```

### 4.3 JWT 鉴权体系

```typescript
// modules/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    @InjectRedis() private redis: Redis,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userService.validateCredentials(dto.email, dto.password)

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' }
    )

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '7d' }
    )

    // Refresh Token 存入 Redis，支持主动失效
    await this.redis.set(
      `refresh:${user.id}`,
      refreshToken,
      'EX',
      7 * 24 * 3600
    )

    return { accessToken, refreshToken, user: { id: user.id, email: user.email } }
  }

  async refresh(oldRefreshToken: string) {
    const payload = this.jwtService.verify(oldRefreshToken, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
    })

    // 校验 Redis 中是否存在（防止已注销的 token 被复用）
    const stored = await this.redis.get(`refresh:${payload.sub}`)
    if (stored !== oldRefreshToken) throw new UnauthorizedException('Token 已失效')

    // 颁发新的双令牌（Refresh Token Rotation）
    return this.login({ email: payload.email, password: undefined })
  }

  async logout(userId: string) {
    await this.redis.del(`refresh:${userId}`)
  }
}
```

### 4.4 数据库设计

```sql
-- 岗位表
CREATE TABLE jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(200) NOT NULL,
  company       VARCHAR(200) NOT NULL,
  city          VARCHAR(50),
  district      VARCHAR(50),
  salary_min    INTEGER,           -- 单位：K
  salary_max    INTEGER,
  experience    VARCHAR(50),       -- 如 "3-5年"
  education     VARCHAR(50),       -- 如 "本科"
  description   TEXT,              -- 原始 JD
  skills        TEXT[],            -- 提取的技能标签数组
  source        VARCHAR(50) DEFAULT 'boss', -- 数据来源
  source_id     VARCHAR(100),      -- 原始平台 ID（去重用）
  raw_data      JSONB,             -- 原始爬取数据
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills);
CREATE INDEX idx_jobs_city ON jobs(city);
CREATE INDEX idx_jobs_salary ON jobs(salary_min, salary_max);
CREATE UNIQUE INDEX idx_jobs_source ON jobs(source, source_id);

-- 技能共现统计表（D3 图谱数据源）
CREATE TABLE skill_cooccurrence (
  skill_a       VARCHAR(50) NOT NULL,
  skill_b       VARCHAR(50) NOT NULL,
  count         INTEGER DEFAULT 1,  -- 共现次数
  avg_salary    NUMERIC(8,2),       -- 同时要求这两个技能的岗位平均薪资
  PRIMARY KEY (skill_a, skill_b)
);

-- 用户表
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  nickname      VARCHAR(50),
  skills        TEXT[],             -- 用户技能标签
  target_city   VARCHAR(50),
  target_salary INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 对话历史表
CREATE TABLE chat_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  scene         VARCHAR(50),        -- jd-analysis / skill-match / interview-mock
  job_id        UUID REFERENCES jobs(id), -- 关联的岗位（可选）
  messages      JSONB DEFAULT '[]', -- [{role, content, timestamp}]
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 图谱数据聚合 API

```typescript
// modules/analysis/analysis.service.ts
@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(Job) private jobRepo: Repository<Job>,
    @InjectRepository(SkillCooccurrence) private coRepo: Repository<SkillCooccurrence>,
  ) {}

  /**
   * 获取技术关联图谱数据
   * 返回 D3 力导向图所需的 nodes + links
   */
  async getSkillGraph(filter?: {
    city?: string
    minFrequency?: number
    topN?: number
  }): Promise<GraphData> {
    const topN = filter?.topN ?? 50

    // 1. 获取技能频率 Top N
    const skillFreq = await this.jobRepo
      .createQueryBuilder('j')
      .select('unnest(j.skills)', 'skill')
      .addSelect('COUNT(*)', 'freq')
      .where(filter?.city ? 'j.city = :city' : '1=1', { city: filter?.city })
      .groupBy('skill')
      .orderBy('freq', 'DESC')
      .limit(topN)
      .getRawMany()

    const skillSet = new Set(skillFreq.map(s => s.skill))

    // 2. 获取这些技能之间的共现关系
    const cooccurrences = await this.coRepo
      .createQueryBuilder('co')
      .where('co.skill_a IN (:...skills) AND co.skill_b IN (:...skills)', {
        skills: [...skillSet],
      })
      .getMany()

    // 3. 组装图谱数据
    const nodes: GraphNode[] = skillFreq.map(s => ({
      id: s.skill,
      label: s.skill,
      type: 'skill' as const,
      frequency: Number(s.freq),
      category: categorizeSkill(s.skill), // Vue→前端框架, Docker→DevOps...
    }))

    const links: GraphLink[] = cooccurrences.map(co => ({
      source: co.skill_a,
      target: co.skill_b,
      weight: co.count,
      type: 'skill-skill' as const,
    }))

    return { nodes, links }
  }

  /**
   * 市场概览统计
   */
  async getMarketOverview(city?: string) {
    const qb = this.jobRepo.createQueryBuilder('j')
    if (city) qb.where('j.city = :city', { city })

    const [totalJobs, avgSalary, topSkills, salaryDistribution] = await Promise.all([
      qb.getCount(),
      qb.select('AVG((j.salary_min + j.salary_max) / 2)', 'avg').getRawOne(),
      this.getTopSkills(city, 20),
      this.getSalaryDistribution(city),
    ])

    return { totalJobs, avgSalary: avgSalary.avg, topSkills, salaryDistribution }
  }
}
```

---

## 5. 功能模块与页面规划

### 5.1 页面清单

| 页面 | 路由 | 核心功能 | 渲染 |
|------|------|---------|------|
| 首页 | `/` | 市场数据大盘（总岗位数、平均薪资、Top 技能榜、薪资趋势） | SSR |
| 岗位列表 | `/jobs` | 筛选（城市/薪资/技能/经验）、排序、分页 | SSR |
| 岗位详情 | `/jobs/:id` | JD 详情 + 技能标签 + 相似岗位推荐 + "AI 分析此岗位"入口 | SSR |
| 技术图谱 | `/graph` | D3 力导向图 + 控制面板 + 节点详情侧栏 | CSR |
| AI 对话 | `/chat` | 多场景 AI 对话（JD 分析/技能匹配/模拟面试）+ 历史记录 | CSR |
| 个人仪表盘 | `/dashboard` | 技能雷达 + 收藏岗位 + 投递状态追踪 | CSR |
| 登录 | `/auth/login` | 表单 + JWT | SSR |
| 注册 | `/auth/register` | 表单 + 技能选择 | SSR |

### 5.2 AI 对话场景

| 场景 | 入口 | AI 行为 |
|------|------|--------|
| JD 深度分析 | 岗位详情页 "AI 分析" 按钮 | 拆解核心要求、隐含要求，输出 :::skill-radar + :::alert |
| 技能匹配诊断 | 仪表盘 "诊断" 按钮 | 对比用户技能 vs 目标岗位，输出差距分析 |
| 模拟面试 | 对话页选择场景 | 根据 JD 生成面试题，评价用户回答 |
| 简历优化 | 对话页选择场景 | 针对目标岗位给出简历修改建议 |
| 自由问答 | 对话页默认 | 通用求职问题咨询 |

---

## 6. 工程化与部署

### 6.1 Monorepo 结构

```
jobRadar/
├── apps/
│   ├── web/                 # Nuxt 3 前端
│   └── server/              # NestJS 后端
├── packages/
│   └── shared/              # 共享类型定义（GraphData, Job, User 等）
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.web
│   └── Dockerfile.server
├── scripts/
│   ├── seed.ts              # 导入爬取的岗位数据
│   └── build-cooccurrence.ts # 计算技能共现矩阵
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

### 6.2 Docker Compose

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      - NUXT_PUBLIC_API_BASE=http://server:4000
    depends_on:
      - server

  server:
    build:
      context: ..
      dockerfile: docker/Dockerfile.server
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/jobRadar
      - REDIS_URL=redis://redis:6379
      - AI_API_KEY=${AI_API_KEY}
      - AI_BASE_URL=${AI_BASE_URL}
      - AI_MODEL=${AI_MODEL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=jobRadar
      - POSTGRES_PASSWORD=postgres

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### 6.3 数据导入脚本

```typescript
// scripts/seed.ts
// 将爬取的 Boss 直聘数据导入数据库，并计算技能共现矩阵

import { readFileSync } from 'fs'
import { DataSource } from 'typeorm'

async function seed() {
  const ds = new DataSource({ /* ... */ })
  await ds.initialize()

  // 1. 读取爬取数据
  const rawData = JSON.parse(readFileSync('./data/boss-jobs.json', 'utf-8'))

  // 2. 技能提取 + 标准化
  for (const item of rawData) {
    const skills = extractSkills(item.description) // NLP 关键词提取
    await ds.getRepository(Job).upsert({
      title: item.title,
      company: item.company,
      city: item.city,
      salaryMin: parseSalary(item.salary).min,
      salaryMax: parseSalary(item.salary).max,
      skills,
      sourceId: item.id,
      rawData: item,
    }, ['source', 'sourceId'])
  }

  // 3. 计算技能共现矩阵
  await buildCooccurrenceMatrix(ds)

  console.log(`导入完成：${rawData.length} 条岗位数据`)
  await ds.destroy()
}

function extractSkills(jd: string): string[] {
  // 基于关键词词典的技能提取
  const skillDict = [
    'Vue', 'Vue3', 'React', 'Angular', 'TypeScript', 'JavaScript',
    'Node.js', 'NestJS', 'Express', 'Nuxt', 'Next.js',
    'Webpack', 'Vite', 'Rollup', 'ESBuild',
    'D3', 'ECharts', 'Three.js', 'Canvas', 'WebGL',
    'Tailwind', 'Element Plus', 'Ant Design',
    'Docker', 'K8s', 'CI/CD', 'Nginx',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
    'Git', 'SSR', '微前端', '低代码', 'GraphQL', 'REST',
    // ...
  ]
  const found = new Set<string>()
  const lower = jd.toLowerCase()
  for (const skill of skillDict) {
    if (lower.includes(skill.toLowerCase())) found.add(skill)
  }
  return [...found]
}
```

---

## 7. 实施计划

### Phase 1：基础骨架（3-4 天）

| 任务 | 产出 |
|------|------|
| pnpm monorepo + shared 类型包 | 项目骨架可运行 |
| NestJS 项目初始化 + TypeORM + PgSQL | 数据库可连接 |
| JWT 鉴权模块（注册/登录/刷新/登出） | 鉴权完整可用 |
| Nuxt 3 项目初始化 + Element Plus | 页面壳子可访问 |
| Docker Compose 一键启动 | 任何人可运行 |

### Phase 2：数据层（2-3 天）

| 任务 | 产出 |
|------|------|
| 数据导入脚本（seed.ts） | Boss 数据入库 |
| 技能提取 + 共现矩阵计算 | 图谱数据源就绪 |
| Job CRUD + 搜索/筛选 API | 岗位列表可用 |
| 市场概览统计 API | 首页数据可用 |

### Phase 3：核心亮点页面（5-7 天）

| 任务 | 产出 |
|------|------|
| 首页 SSR + 市场大盘 | 首屏性能展示 |
| 岗位列表 SSR + 筛选交互 | 核心功能可用 |
| D3 技术图谱（力导向图 + 交互） | **最大视觉亮点** |
| AI 对话 + SSE + vue-markdown-stream | **最大技术亮点** |
| 自定义组件块（job-card / skill-radar / alert） | 组件块渲染可演示 |

### Phase 4：完善与打磨（3-4 天）

| 任务 | 产出 |
|------|------|
| 个人仪表盘（技能雷达 + 收藏） | 完整用户旅程 |
| AI 多场景 prompt 优化 | 对话质量提升 |
| 响应式适配 + 暗色模式 | UI 完整度 |
| README + 架构图 + 截图 | 求职展示物料 |
| 部署到云服务器 + 域名 | 在线可访问 |

### 总计约 15-18 天，MVP 可在 10 天内完成（Phase 1-3）

---

## 8. 面试叙事指南

### 8.1 项目一句话介绍

> "我做了一个基于真实爬取数据的职位分析平台，用 Nuxt 3 SSR 做首屏渲染，后端 NestJS 通过 SSE 推送大模型的流式响应，前端用我自研的 vue-markdown-stream 库把 AI 输出实时渲染为 D3 图表、职位卡片等 Vue 组件，而不是纯文本。"

### 8.2 技术深度问题应对

**Q: 为什么选 SSE 而不是 WebSocket？**
A: SSE 是单向推送，天然契合"服务端→客户端"的流式场景，比 WebSocket 轻量（无需心跳、无需处理双向通信），浏览器原生支持 `EventSource` 自动重连。只有在需要双向实时通信（如协同编辑）时才需要 WebSocket。

**Q: vue-markdown-stream 的核心设计思路？**
A: 核心是 `autoCloseContainers()` 自动补全未闭合的 `:::` 块 → `markdown-it` + `container` 插件输出含自定义标签的 HTML → `DOMParser` 解析为 DOM 树 → `h()` 递归构建 VNode，遇到自定义标签时替换为注册的 Vue 组件。不依赖 Vue 的运行时编译器，bundle 增量约 40KB。

**Q: D3 图谱的性能优化？**
A: 节点数量大时用 Canvas 替代 SVG 渲染；力仿真设置 `alphaDecay` 加速收敛；用 `d3-quadtree` 做碰撞检测优化；仅在视口范围内渲染标签文字（`requestAnimationFrame` + viewport culling）。

**Q: SSR 和 CSR 如何混合？**
A: Nuxt 3 的 `routeRules` 按路由配置渲染模式。公开页面（首页/岗位列表）用 SSR，D3 图谱和 AI 对话用 `<ClientOnly>` 包裹走 CSR。SSR 页面通过 `useAsyncData` 在服务端预取数据，客户端 hydration 时直接复用。

**Q: JWT 为什么用双令牌？**
A: Access Token 短时效（15min）减少泄露风险，Refresh Token 长时效（7天）保证用户体验。Refresh Token 存 Redis 支持主动失效（登出/踢下线），每次刷新时 Rotation（旧的作废颁发新的）防止重放攻击。
