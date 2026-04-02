<script setup lang="ts">
import type { MarketOverview, ApiResponse } from '@job-radar/shared'

useHead({ title: 'JobRadar - 职位情报分析平台' })

const apiBase = useApiBase()

const { data: overview, status } = await useFetch<ApiResponse<MarketOverview>>(
  `${apiBase}/analysis/market-overview`,
)

const marketData = computed(() => overview.value?.data)
</script>

<template>
  <div class="home-page">
    <!-- 顶部横幅 -->
    <section class="hero-banner">
      <h1 class="hero-title">职位市场大盘</h1>
      <p class="hero-subtitle">基于真实爬取数据的职位情报分析</p>
    </section>

    <ClientOnly>
      <CommonLoadingSkeleton v-if="status === 'pending'" :rows="8" />
    </ClientOnly>

    <template v-if="marketData">
      <!-- 核心指标 -->
      <section class="section">
        <DashboardMarketOverview :data="marketData" />
      </section>

      <!-- 两列布局 -->
      <div class="two-col">
        <!-- Top 技能榜 -->
        <section class="section card">
          <h2 class="section-title">🔥 热门技能 Top 15</h2>
          <DashboardSkillRank :data="marketData.topSkills" :max-items="15" />
        </section>

        <!-- 右侧 -->
        <div class="right-col">
          <!-- 薪资分布 -->
          <section class="section card">
            <h2 class="section-title">💰 薪资分布</h2>
            <DashboardSalaryChart :data="marketData.salaryDistribution" />
          </section>

          <!-- 城市分布 -->
          <section class="section card">
            <h2 class="section-title">🏙️ 城市分布</h2>
            <DashboardCityDistribution :data="marketData.cityDistribution" />
          </section>
        </div>
      </div>

      <!-- 底部快捷入口 -->
      <section class="quick-links">
        <NuxtLink to="/jobs" class="quick-card">
          <span class="quick-icon">📋</span>
          <span class="quick-text">浏览全部岗位</span>
        </NuxtLink>
        <NuxtLink to="/graph" class="quick-card">
          <span class="quick-icon">🕸️</span>
          <span class="quick-text">技术图谱探索</span>
        </NuxtLink>
        <NuxtLink to="/chat" class="quick-card">
          <span class="quick-icon">🤖</span>
          <span class="quick-text">AI 智能分析</span>
        </NuxtLink>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-banner {
  text-align: center;
  padding: 48px 0 36px;
  position: relative;
}

.hero-title {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #00e0ff, #7b61ff, #00ffaa);
  background-size: 200% 200%;
  animation: glow-shift 4s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;

  @media (max-width: 768px) {
    font-size: 26px;
  }
}

.hero-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
  margin-top: 10px;
  letter-spacing: 0.5px;
}

.section {
  margin-bottom: 24px;
}

.card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-radius: var(--radius-md);
  padding: 24px;
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: var(--shadow-glow);
  }
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.right-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-color), var(--accent-purple));
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    border-color: var(--border-glow);
    box-shadow: var(--shadow-glow);
    transform: translateY(-3px);

    &::before {
      opacity: 1;
    }
  }
}

.quick-icon {
  font-size: 28px;
  filter: drop-shadow(0 0 6px rgba(0, 224, 255, 0.3));
}

.quick-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}
</style>
