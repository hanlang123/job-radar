<script setup lang="ts">
const { isLoggedIn, user, logout } = useAuth()
const route = useRoute()

const navItems = [
  { label: '首页', to: '/', icon: 'HomeFilled' },
  { label: '岗位', to: '/jobs', icon: 'Briefcase' },
  { label: '技术图谱', to: '/graph', icon: 'Connection' },
  { label: 'AI 助手', to: '/chat', icon: 'ChatDotRound' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <NuxtLink to="/" class="logo">
        <span class="logo-icon">📡</span>
        <span class="logo-text">JobRadar</span>
      </NuxtLink>

      <nav class="nav-menu">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ active: isActive(item.to) }"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="header-actions">
        <ClientOnly>
          <template v-if="isLoggedIn">
            <NuxtLink v-if="user?.role === 'admin'" to="/admin">
              <el-button text type="danger">管理</el-button>
            </NuxtLink>
            <NuxtLink to="/dashboard">
              <el-button text>
                {{ user?.nickname || '仪表盘' }}
              </el-button>
            </NuxtLink>
            <el-button text @click="logout">登出</el-button>
          </template>
          <template v-else>
            <NuxtLink to="/auth/login">
              <el-button text>登录</el-button>
            </NuxtLink>
            <NuxtLink to="/auth/register">
              <el-button type="primary" round size="small">注册</el-button>
            </NuxtLink>
          </template>
        </ClientOnly>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  background: rgba(10, 14, 26, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0 24px;
  height: 60px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
  gap: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.logo-icon {
  font-size: 22px;
  filter: drop-shadow(0 0 6px rgba(0, 224, 255, 0.5));
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #00e0ff, #7b61ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.nav-menu {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--text-regular);
  border-radius: var(--radius-sm);
  transition: all 0.25s ease;
  text-decoration: none;
  position: relative;

  &:hover {
    color: var(--primary-color);
    background: rgba(0, 224, 255, 0.08);
  }

  &.active {
    color: var(--primary-color);
    font-weight: 600;
    background: rgba(0, 224, 255, 0.1);
    box-shadow: inset 0 -2px 0 var(--primary-color);
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .header-content {
    gap: 12px;
  }

  .nav-menu {
    gap: 0;
  }

  .nav-link {
    padding: 6px 8px;
    font-size: 13px;
  }

  .logo-text {
    display: none;
  }
}
</style>
