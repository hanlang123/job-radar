<script setup lang="ts">
import type { MarketOverview } from '@job-radar/shared'

defineProps<{
  data: MarketOverview
}>()
</script>

<template>
  <div class="market-overview">
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value">{{ data.totalJobs.toLocaleString() }}</div>
        <div class="stat-label">在招岗位总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value salary-text">{{ data.avgSalary.toFixed(1) }}K</div>
        <div class="stat-label">平均月薪</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ data.topSkills[0]?.skill || '-' }}</div>
        <div class="stat-label">最热门技能（{{ data.topSkills[0]?.count || 0 }} 岗位）</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ data.cityDistribution.length }}</div>
        <div class="stat-label">覆盖城市数</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
