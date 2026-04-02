# JobRadar 线上环境修复指南

## 问题诊断

### 问题现象
访问 `http://113.31.116.251/chat` 时，AI 对话功能报错 "请求失败: Failed to fetch"

### 根本原因
1. 前端浏览器请求 API 地址配置为 `http://113.31.116.251/api`
2. **缺少 Nginx 反向代理**，导致浏览器请求 `/api/*` 无法转发到后端服务（3001 端口）
3. 浏览器直接请求 80 端口的 `/api` 路径返回 404，导致 SSE 流式请求失败

---

## 解决方案

已创建 Nginx 反向代理配置，架构如下：

```
浏览器
  ↓ http://113.31.116.251/ (80端口)
Nginx
  ↓ / → web:3000 (前端)
  ↓ /api → server:3001 (后端 API)
```

### 修改文件

1. **新增：** `docker/nginx.conf` - Nginx 配置文件
   - 监听 80 端口
   - `/api/*` 代理到 `server:3001/api/*`
   - `/*` 代理到 `web:3000/*`
   - SSE 必需配置（关闭缓冲、长连接超时）

2. **修改：** `docker/docker-compose.prod.yml`
   - 新增 `nginx` 服务
   - `server` 和 `web` 改为 `expose`（不直接暴露端口）
   - `NUXT_PUBLIC_API_BASE` 改为相对路径 `/api`

---

## 部署步骤

### 1. 停止当前服务

```bash
cd /path/to/jobRadar/docker
docker-compose -f docker-compose.prod.yml down
```

### 2. 拉取最新代码

```bash
cd /path/to/jobRadar
git pull origin main  # 或你的分支名
```

确保以下文件已更新：
- `docker/nginx.conf`（新文件）
- `docker/docker-compose.prod.yml`（已修改）

### 3. 重新构建并启动

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d --build
```

### 4. 验证服务状态

检查所有容器是否运行：
```bash
docker ps
```

应该看到以下容器：
- `jobRadar-nginx` (80 → nginx:80)
- `jobRadar-web` (expose 3000, internal only)
- `jobRadar-server` (expose 3001, internal only)

### 5. 查看日志

```bash
# Nginx 日志
docker logs -f jobRadar-nginx

# 后端日志
docker logs -f jobRadar-server

# 前端日志
docker logs -f jobRadar-web
```

### 6. 测试 API 连通性

```bash
# 测试前端首页
curl http://113.31.116.251/

# 测试 API 端点（需要登录，应返回 401 而非 404）
curl http://113.31.116.251/api/chat/sessions
```

### 7. 浏览器验证

访问 `http://113.31.116.251/chat`，测试：
1. 页面能否正常加载
2. 发送一条消息，观察是否能收到 AI 回复

---

## 常见问题排查

### ❌ Nginx 启动失败
```bash
docker logs jobRadar-nginx
```
检查 `nginx.conf` 语法错误

### ❌ API 请求仍然 404
1. 检查 Nginx 配置是否正确挂载：
   ```bash
   docker exec jobRadar-nginx cat /etc/nginx/conf.d/default.conf
   ```

2. 确认 server 容器名称：
   ```bash
   docker network inspect docker_default | grep -A 5 jobRadar-server
   ```

### ❌ SSE 流式请求超时
检查 Nginx 配置中是否包含：
```nginx
proxy_buffering off;
proxy_cache off;
proxy_read_timeout 300s;
```

### ❌ CORS 跨域错误
后端 NestJS 已启用 CORS (`main.ts:32`)，如仍有问题，检查 Nginx 是否正确转发 `Origin` 头：
```nginx
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

---

## 网络架构图

### 修复前（有问题）
```
浏览器 → http://113.31.116.251:80/chat (web:3000)
       → http://113.31.116.251/api ❌ 404
```

### 修复后（正常）
```
浏览器 → http://113.31.116.251/ (nginx:80)
          ↓
        nginx → /      → web:3000
              → /api/* → server:3001
```

---

## 端口使用规划

| 服务 | 容器内端口 | 宿主机暴露端口 | 访问方式 |
|------|-----------|---------------|---------|
| Nginx | 80 | **80** | 公网 |
| Web (Nuxt) | 3000 | - | 仅内部网络 |
| Server (NestJS) | 3001 | - | 仅内部网络 |

---

## 安全建议

1. **移除敏感信息**：
   - `docker-compose.prod.yml` 中的 API Key 应使用环境变量
   - 建议创建 `.env.prod` 文件，通过 `env_file` 加载

2. **HTTPS 配置**（可选）：
   - 使用 Let's Encrypt + Certbot 配置 SSL
   - 修改 Nginx 监听 443 端口

3. **限流保护**：
   - 在 Nginx 中添加 `limit_req_zone` 限制 API 请求频率

---

## 回滚方案

如果出现问题需要回滚：

```bash
cd /path/to/jobRadar/docker

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 回退代码到上一个版本
git reset --hard HEAD~1

# 重新启动（旧版本，直接暴露端口）
docker-compose -f docker-compose.prod.yml up -d
```

此时需要手动访问：
- 前端：`http://113.31.116.251:3000`
- 后端：`http://113.31.116.251:3001/api`

---

## 联系支持

如有问题，请提供：
1. `docker ps` 输出
2. `docker logs jobRadar-nginx` 日志
3. 浏览器 Network 面板截图
