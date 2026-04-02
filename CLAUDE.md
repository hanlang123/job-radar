# JobRadar 项目实施指令

## 你的角色

你是一位全栈高级工程师，正在帮我从零构建 **JobRadar** —— 一个基于真实爬取数据的职位情报分析平台。你需要严格按照以下技术方案逐步实施，每完成一个阶段主动汇报并等待我确认后再继续。

## 技术栈（不可更改）

| 层级 | 技术 |
|------|------|
| 前端 | Nuxt 3 + Vue 3 + TypeScript + Element Plus |
| AI 渲染 | @krishanjinbo/vue-markdown-stream（自研库，npm 已发布） |
| 可视化 | D3.js v7 |
| 后端 | NestJS + TypeORM + PostgreSQL + Redis |
| AI 对接 | OpenAI 兼容 API（通过 openai SDK） |
| 鉴权 | JWT Access Token (15min) + Refresh Token (7d, Redis 存储) |
| 部署 | Docker Compose 一键启动 |

## 项目结构（严格遵循）

```
jobRadar/
├── pnpm-workspace.yaml          # pnpm monorepo
├── package.json
├── .env.example
├── README.md
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.web
│   └── Dockerfile.server
├── scripts/
│   ├── seed.ts                  # 导入岗位数据
│   └── build-cooccurrence.ts    # 计算技能共现矩阵
├── packages/
│   └── shared/                  # 共享 TypeScript 类型
│       ├── package.json
│       └── src/
│           ├── index.ts
│           ├── job.ts           # Job, Company 类型
│           ├── graph.ts         # GraphNode, GraphLink, GraphData 类型
│           ├── chat.ts          # ChatMessage, ChatScene 类型
│           └── user.ts          # User 类型
├── apps/
│   ├── web/                     # Nuxt 3 前端
│   │   ├── nuxt.config.ts
│   │   ├── app.vue
│   │   ├── pages/
│   │   │   ├── index.vue                 # SSR 首页市场大盘
│   │   │   ├── jobs/
│   │   │   │   ├── index.vue             # SSR 岗位列表+筛选
│   │   │   │   └── [id].vue              # SSR 岗位详情
│   │   │   ├── graph/
│   │   │   │   └── index.vue             # CSR 技术图谱
│   │   │   ├── chat/
│   │   │   │   └── index.vue             # CSR AI 对话
│   │   │   ├── dashboard/
│   │   │   │   └── index.vue             # CSR 个人仪表盘
│   │   │   └── auth/
│   │   │       ├── login.vue             # SSR 登录
│   │   │       └── register.vue          # SSR 注册
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatContainer.vue
│   │   │   │   ├── ChatInput.vue
│   │   │   │   ├── ChatMessage.vue
│   │   │   │   ├── StreamRenderer.vue    # vue-markdown-stream 封装
│   │   │   │   └── blocks/               # AI 输出的自定义组件块
│   │   │   │       ├── JobCardBlock.vue
│   │   │   │       ├── SkillRadarBlock.vue
│   │   │   │       ├── SalaryBarBlock.vue
│   │   │   │       ├── CompareTableBlock.vue
│   │   │   │       └── AlertBlock.vue
│   │   │   ├── graph/
│   │   │   │   ├── ForceGraph.vue        # D3 力导向图
│   │   │   │   ├── GraphControls.vue
│   │   │   │   ├── NodeTooltip.vue
│   │   │   │   └── GraphLegend.vue
│   │   │   ├── job/
│   │   │   │   ├── JobCard.vue
│   │   │   │   ├── JobFilter.vue
│   │   │   │   ├── SalaryRange.vue
│   │   │   │   └── SkillTags.vue
│   │   │   ├── dashboard/
│   │   │   │   ├── MarketOverview.vue
│   │   │   │   ├── TrendChart.vue
│   │   │   │   └── SkillRadar.vue
│   │   │   └── common/
│   │   │       ├── AppHeader.vue
│   │   │       ├── AppFooter.vue
│   │   │       └── LoadingSkeleton.vue
│   │   ├── composables/
│   │   │   ├── useSSE.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── useJobSearch.ts
│   │   │   └── useGraph.ts
│   │   ├── plugins/
│   │   │   ├── markdown-stream.client.ts
│   │   │   └── auth.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   └── assets/styles/
│   └── server/                  # NestJS 后端
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── strategies/jwt.strategy.ts
│       │   │   │   ├── strategies/jwt-refresh.strategy.ts
│       │   │   │   ├── guards/jwt-auth.guard.ts
│       │   │   │   └── dto/
│       │   │   ├── job/
│       │   │   │   ├── job.module.ts
│       │   │   │   ├── job.controller.ts
│       │   │   │   ├── job.service.ts
│       │   │   │   ├── entities/job.entity.ts
│       │   │   │   └── dto/
│       │   │   ├── ai/
│       │   │   │   ├── ai.module.ts
│       │   │   │   ├── ai.controller.ts    # SSE 流式端点
│       │   │   │   ├── ai.service.ts       # 大模型调用
│       │   │   │   └── prompt/             # prompt 模板
│       │   │   │       ├── base.prompt.ts
│       │   │   │       ├── jd-analysis.prompt.ts
│       │   │   │       ├── skill-match.prompt.ts
│       │   │   │       └── interview-mock.prompt.ts
│       │   │   ├── analysis/
│       │   │   │   ├── analysis.module.ts
│       │   │   │   ├── analysis.controller.ts
│       │   │   │   └── analysis.service.ts  # 图谱数据聚合
│       │   │   └── user/
│       │   │       ├── user.module.ts
│       │   │       ├── user.service.ts
│       │   │       └── entities/user.entity.ts
│       │   ├── common/
│       │   │   ├── decorators/current-user.decorator.ts
│       │   │   ├── filters/http-exception.filter.ts
│       │   │   ├── interceptors/transform.interceptor.ts
│       │   │   └── pipes/validation.pipe.ts
│       │   └── config/
│       └── test/
```

## 渲染策略（严格遵循）

- SSR 页面：`/`、`/jobs`、`/jobs/:id`、`/auth/login`、`/auth/register`
- CSR 页面（`<ClientOnly>`）：`/graph`、`/chat`、`/dashboard`
- 在 `nuxt.config.ts` 的 `routeRules` 中配置

## 数据库 Schema

```sql
CREATE TABLE jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(200) NOT NULL,
  company       VARCHAR(200) NOT NULL,
  city          VARCHAR(50),
  district      VARCHAR(50),
  salary_min    INTEGER,
  salary_max    INTEGER,
  experience    VARCHAR(50),
  education     VARCHAR(50),
  description   TEXT,
  skills        TEXT[],
  source        VARCHAR(50) DEFAULT 'boss',
  source_id     VARCHAR(100),
  raw_data      JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills);
CREATE INDEX idx_jobs_city ON jobs(city);
CREATE INDEX idx_jobs_salary ON jobs(salary_min, salary_max);
CREATE UNIQUE INDEX idx_jobs_source ON jobs(source, source_id);

CREATE TABLE skill_cooccurrence (
  skill_a       VARCHAR(50) NOT NULL,
  skill_b       VARCHAR(50) NOT NULL,
  count         INTEGER DEFAULT 1,
  avg_salary    NUMERIC(8,2),
  PRIMARY KEY (skill_a, skill_b)
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  nickname      VARCHAR(50),
  skills        TEXT[],
  target_city   VARCHAR(50),
  target_salary INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  scene         VARCHAR(50),
  job_id        UUID REFERENCES jobs(id),
  messages      JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

## 三大核心亮点实现要求

### 亮点 1：vue-markdown-stream + 自定义组件块

这是我的自研库（npm 包名 `@krishanjinbo/vue-markdown-stream`），支持在流式 Markdown 中嵌入 Vue 组件块。

**安装：**
```bash
npm install @krishanjinbo/vue-markdown-stream markdown-it markdown-it-container
```

**在 Nuxt 中注册（仅客户端）：**

```typescript
// plugins/markdown-stream.client.ts
import { MarkdownRenderer } from '@krishanjinbo/vue-markdown-stream'
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('MarkdownRenderer', MarkdownRenderer)
})
```

**封装 StreamRenderer：**

```vue
<!-- components/chat/StreamRenderer.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { MarkdownRenderer, useStreamingText } from '@krishanjinbo/vue-markdown-stream'
const props = defineProps<{ content: string; isStreaming: boolean }>()
const display = computed(() => props.isStreaming ? props.content + '▍' : props.content)
</script>
<template>
  <MarkdownRenderer :content="display" class="chat-markdown" />
</template>
```

**必须实现的 5 个自定义组件块：**

1. `:::job-card {"title":"...","company":"...","salary":"...","tags":[...]}` → 渲染为职位卡片
2. `:::skill-radar {"labels":[...],"you":[...],"required":[...]}` → D3 雷达图
3. `:::salary-bar {"min":N,"max":N,"median":N,"yourExpect":N}` → 薪资对比条
4. `:::compare` + 内部 Markdown 表格 → 岗位对比视图
5. `:::alert info/warning/success` + 内部文本 → 提示卡片

这些组件块放在 `components/chat/blocks/` 目录，由 AI 在流式输出中使用 `:::` 语法触发。

### 亮点 2：NestJS SSE 流式架构

**核心设计：**
- 使用 `POST /api/chat/stream` 而非 GET（需要传请求体）
- 手动设置 SSE headers，不用 `@Sse()` 装饰器
- AiService 用 `async *createChatStream()` AsyncGenerator 逐 chunk yield
- 通过 OpenAI SDK 的 `stream: true` 模式对接大模型
- 前端 `useSSE` composable 通过 `fetch` + `ReadableStream` 消费

**后端 AI Controller 关键代码：**

```typescript
@Post('stream')
@UseGuards(JwtAuthGuard)
async streamChat(@Body() dto: ChatDto, @CurrentUser() user, @Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
  try {
    const stream = this.aiService.createChatStream(dto, user)
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
    }
    res.write('data: [DONE]\n\n')
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`)
  } finally {
    res.end()
  }
}
```

**后端 AiService Prompt 核心要求：**

system prompt 中必须告诉大模型可以使用 `:::job-card`、`:::skill-radar`、`:::salary-bar`、`:::compare`、`:::alert` 这些 Markdown 组件块语法，并给出每种块的 JSON props 格式示例。这样 AI 输出的 Markdown 才能被 vue-markdown-stream 渲染为真实 Vue 组件。

**前端 useSSE composable 关键逻辑：**

```typescript
// composables/useSSE.ts
// 通过 fetch + ReadableStream 消费 SSE
// 解析 "data: {...}\n\n" 格式
// 累积到 content ref
// 支持 abort 取消
// isStreaming 状态管理
```

### 亮点 3：D3 技术图谱

**后端提供两个 API：**

1. `GET /api/analysis/skill-graph?city=&topN=50` → 返回 `{ nodes: GraphNode[], links: GraphLink[] }`
2. `GET /api/analysis/market-overview?city=` → 返回市场统计数据

**GraphNode 类型：**
```typescript
interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  type: 'skill' | 'company' | 'job'
  frequency?: number      // skill: JD 中出现次数
  category?: string       // skill: 前端框架/语言/工具链/后端/DevOps
  jobCount?: number       // company: 在招岗位数
  avgSalary?: number      // company: 平均薪资
}
```

**ForceGraph.vue 核心要求：**
- D3 力导向图（forceSimulation + forceLink + forceManyBody + forceCenter）
- 节点大小 = frequency，颜色 = category 分组
- 连线粗细 = 共现次数 weight
- 交互：hover tooltip、click 高亮关联节点、双击筛选岗位、缩放拖拽
- 用户已有技能的节点用绿色描边高亮

## 分阶段执行计划

### Phase 1：项目骨架
1. 初始化 pnpm monorepo，配置 `pnpm-workspace.yaml`
2. 创建 `packages/shared` 类型包，定义所有共享类型
3. 初始化 `apps/server` NestJS 项目，配置 TypeORM + PostgreSQL + Redis
4. 实现 auth 模块（JWT 双令牌、注册、登录、刷新、登出）
5. 初始化 `apps/web` Nuxt 3 项目，配置 Element Plus
6. 编写 `docker-compose.yml` 和 Dockerfile，确保一键启动
7. **完成后暂停，汇报进度，等我确认**

### Phase 2：数据层
1. 实现 Job entity + CRUD + 搜索筛选 API（支持城市/薪资范围/技能/经验筛选）
2. 编写 `scripts/seed.ts` 数据导入脚本（含技能提取逻辑）
3. 编写 `scripts/build-cooccurrence.ts` 技能共现矩阵计算
4. 实现 analysis 模块（skill-graph API + market-overview API）
5. **完成后暂停，汇报进度，等我确认**

### Phase 3：前端页面 — SSR 部分
1. 首页 `/`：市场大盘（总岗位数、平均薪资、Top 技能榜、城市分布）
2. 岗位列表 `/jobs`：筛选面板 + 岗位卡片列表 + 分页
3. 岗位详情 `/jobs/:id`：JD 详情 + 技能标签 + "AI 分析此岗位" 按钮
4. 登录/注册页
5. 公共布局（Header + Footer）
6. **完成后暂停，汇报进度，等我确认**

### Phase 4：前端页面 — CSR 核心亮点
1. AI 对话页 `/chat`：ChatContainer + ChatInput + ChatMessage + StreamRenderer
2. 集成 vue-markdown-stream + 注册 5 个自定义组件块
3. 实现 `useSSE` composable，打通 SSE 全链路
4. D3 技术图谱 `/graph`：ForceGraph + GraphControls + NodeTooltip + GraphLegend
5. 个人仪表盘 `/dashboard`：技能雷达 + 收藏岗位
6. **完成后暂停，汇报进度，等我确认**

### Phase 5：收尾
1. AI prompt 优化（确保输出的 Markdown 正确使用组件块语法）
2. 响应式适配
3. 完善 README（项目介绍、架构图、截图、本地运行指南）
4. `.env.example` 完善
5. **完成后汇报**

## 代码规范

- 所有代码使用 TypeScript，严格模式
- Vue 组件使用 `<script setup lang="ts">` + Composition API
- NestJS 使用装饰器风格，DTO 用 class-validator 校验
- 文件命名：组件 PascalCase，其他 kebab-case
- 中文注释，关键函数写 JSDoc
- 每个模块写完后确保可以运行，不要留 TODO 占位
- 不要使用任何 mock 数据硬编码在前端，所有数据都从后端 API 获取
- 错误处理要完整，不要留空 catch

## 重要约束

1. **不要跳过任何阶段**，每个 Phase 结束后等我确认
2. **不要自作主张更换技术栈**，有更好的建议可以提出但要等我同意
3. **vue-markdown-stream 是自研库**，务必正确安装和使用，不要用其他 Markdown 渲染库替代
4. **D3 图谱不要用 ECharts 替代**，必须用 D3 原生 API 实现力导向图
5. **SSE 不要改成 WebSocket**，这是刻意的技术选型
6. 如果遇到不确定的实现细节，**先问我**，不要猜测

## 现在开始

从 Phase 1 第 1 步开始：初始化 pnpm monorepo。在开始之前，先确认你已经理解了整个项目的架构、技术选型和实施计划，如有任何疑问先提出。
