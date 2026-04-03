# JobRadar — 职位情报分析平台

> **GitHub 仓库：** [https://github.com/hanlang123/job-radar](https://github.com/hanlang123/job-radar)

基于真实爬取数据的职位市场情报分析平台，集成 AI 智能分析、技能图谱可视化和岗位搜索筛选等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Nuxt 3 + Vue 3 + TypeScript + Element Plus |
| AI 渲染 | @krishanjinbo/vue-markdown-stream（流式 Markdown + 自定义组件块） |
| 可视化 | D3.js v7（力导向图、雷达图） |
| 后端 | NestJS + TypeORM + PostgreSQL + Redis |
| AI 对接 | OpenAI 兼容 API（通过 openai SDK，SSE 流式输出） |
| 鉴权 | JWT Access Token (15min) + Refresh Token (7d, Redis 存储) |
| 部署 | Docker Compose 一键启动 |

## 项目架构

```
jobRadar/
├── apps/
│   ├── web/                  # Nuxt 3 前端
│   │   ├── pages/            # 页面路由
│   │   ├── components/       # Vue 组件（chat/graph/job/dashboard/common）
│   │   ├── composables/      # 组合式函数（useSSE/useAuth/useGraph/useJobSearch）
│   │   └── plugins/          # Nuxt 插件
│   └── server/               # NestJS 后端
│       └── src/modules/      # 业务模块（auth/job/ai/analysis/user）
├── packages/
│   └── shared/               # 共享 TypeScript 类型
├── scripts/                  # 数据导入 & 技能共现矩阵计算
└── docker/                   # Docker 部署配置
```

## 核心功能

### 1. AI 智能对话

- 4 种场景：通用对话、JD 深度分析、技能匹配、模拟面试
- SSE 流式输出，实时渲染
- 5 种自定义 Markdown 组件块：
  - `:::job-card` — 职位卡片
  - `:::skill-radar` — 技能雷达图（D3）
  - `:::salary-bar` — 薪资对比条
  - `:::compare` — 多岗位对比表格
  - `:::alert` — 提示卡片

### 2. 技术图谱

- D3 力导向图展示技能之间的共现关系
- 节点大小 = 出现频次，颜色 = 技能分类
- 连线粗细 = 共现次数
- 支持缩放、拖拽、hover 高亮、点击查看详情

### 3. 岗位搜索与分析

- 多维度筛选：城市、薪资范围、经验、学历、技能
- 全文关键词搜索
- 岗位详情 + AI 分析入口
- 市场大盘概览（首页）

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- PostgreSQL 16+
- Redis 7+

### 本地开发

```bash
# 1. 克隆项目
git clone <repo-url>
cd job-radar

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入数据库、Redis、OpenAI 等配置

# 4. 启动开发服务
pnpm dev
# 前端: http://localhost:3000
# 后端: http://localhost:3001

# 5. 导入数据（可选）
pnpm seed
```

### Docker 一键部署

```bash
# 1. 配置环境变量
cp .env.example .env

# 2. 一键启动所有服务
cd docker
docker compose up -d

# 前端: http://localhost:3000
# 后端 API: http://localhost:3001/api
```

### GitHub Actions 自动部署

项目已配置 CI/CD 工作流，推送到 `main` 分支后自动构建镜像并部署到远程服务器。

#### 工作流说明

| 工作流 | 触发条件 | 说明 |
|--------|----------|------|
| **CI** (`ci.yml`) | PR / push to main | 构建检查（pnpm build + Docker build） |
| **Deploy** (`deploy.yml`) | push to main / 手动触发 | 构建镜像 → 推送 GHCR → SSH 部署到服务器 |

#### 配置步骤

1. **创建 GitHub Environment**

   在仓库 Settings → Environments 中创建名为 `production` 的环境（可选启用审批保护）。

2. **配置 GitHub Secrets**

   在仓库 Settings → Secrets and variables → Actions 中添加以下 Secrets：

   | Secret 名称 | 说明 |
   |-------------|------|
   | `DEPLOY_SERVER` | 部署目标服务器 IP 或域名 |
   | `DEPLOY_USER` | SSH 登录用户名 |
   | `DEPLOY_SSH_KEY` | SSH 私钥（推荐 Ed25519） |
   | `DEPLOY_PASSWORD` | SSH 密码（与 SSH Key 二选一） |
   | `OPENAI_API_KEY` | OpenAI 兼容 API Key |
   | `JWT_SECRET` | JWT 访问令牌密钥 |
   | `JWT_REFRESH_SECRET` | JWT 刷新令牌密钥 |
   | `GHCR_PAT` | GitHub PAT（需 `read:packages` 权限，供服务器拉取镜像） |

3. **服务器准备**

   ```bash
   # 确保服务器已安装 Docker 和 Docker Compose
   docker --version
   docker compose version

   # 创建部署目录
   sudo mkdir -p /opt/jobRadar
   sudo chown $USER:$USER /opt/jobRadar
   ```

4. **触发部署**

   - **自动触发**：将代码合并到 `main` 分支
   - **手动触发**：在 GitHub Actions 页面选择 Deploy 工作流 → Run workflow

#### 部署架构

```
GitHub Actions (CI/CD)
  ↓ Build & Push
GHCR (ghcr.io/hanlang123/job-radar/server:latest)
GHCR (ghcr.io/hanlang123/job-radar/web:latest)
  ↓ SSH Deploy
Remote Server (/opt/jobRadar)
  ├── Nginx (:80) → 反向代理
  ├── Web   (:3000, internal)
  └── Server (:3001, internal)
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_HOST` | PostgreSQL 主机 | localhost |
| `DATABASE_PORT` | PostgreSQL 端口 | 5432 |
| `DATABASE_USER` | 数据库用户名 | jobRadar |
| `DATABASE_PASSWORD` | 数据库密码 | — |
| `DATABASE_NAME` | 数据库名 | jobRadar |
| `REDIS_HOST` | Redis 主机 | localhost |
| `REDIS_PORT` | Redis 端口 | 6379 |
| `JWT_SECRET` | JWT 签名密钥 | — |
| `JWT_REFRESH_SECRET` | Refresh Token 密钥 | — |
| `OPENAI_API_KEY` | OpenAI API Key | — |
| `OPENAI_BASE_URL` | OpenAI API 地址 | https://api.openai.com/v1 |
| `OPENAI_MODEL` | 模型名称 | gpt-4o |

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/refresh` | 刷新 Token |
| POST | `/api/auth/logout` | 退出登录 |
| PATCH | `/api/auth/profile` | 更新个人信息 |
| GET | `/api/jobs` | 岗位列表（支持筛选分页） |
| GET | `/api/jobs/:id` | 岗位详情 |
| POST | `/api/chat/stream` | AI 对话（SSE 流式） |
| GET | `/api/chat/sessions` | 聊天会话列表 |
| GET | `/api/analysis/skill-graph` | 技能共现图谱数据 |
| GET | `/api/analysis/market-overview` | 市场大盘统计 |

## 页面路由

| 路径 | 渲染方式 | 说明 |
|------|----------|------|
| `/` | SSR | 首页市场大盘 |
| `/jobs` | SSR | 岗位列表 + 筛选 |
| `/jobs/:id` | SSR | 岗位详情 |
| `/auth/login` | SSR | 登录 |
| `/auth/register` | SSR | 注册 |
| `/graph` | CSR | 技术图谱（D3 力导向图） |
| `/chat` | CSR | AI 智能对话 |
| `/dashboard` | CSR | 个人仪表盘 |

## 开发命令

```bash
pnpm dev           # 同时启动前后端开发服务
pnpm dev:web       # 仅启动前端 (Nuxt)
pnpm dev:server    # 仅启动后端 (NestJS)
pnpm build         # 构建所有包
pnpm seed          # 导入岗位数据
```

## License

MIT
