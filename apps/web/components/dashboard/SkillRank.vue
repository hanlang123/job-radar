<script setup lang="ts">
defineProps<{
  data: { skill: string; count: number }[]
  maxItems?: number
}>()
</script>

<template>
  <div class="skill-rank">
    <div
      v-for="(item, index) in data.slice(0, maxItems || 15)"
      :key="item.skill"
      class="rank-item"
    >
      <div class="rank-left">
        <span class="rank-num" :class="{ top3: index < 3 }">{{ index + 1 }}</span>
        <span class="rank-name">{{ item.skill }}</span>
      </div>
      <div class="rank-right">
        <div class="rank-bar-wrap">
          <div
            class="rank-bar"
            :style="{ width: `${(item.count / data[0].count) * 100}%` }"
          />
        </div>
        <span class="rank-count">{{ item.count }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.rank-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  &:last-child {
    border-bottom: none;
  }
}

.rank-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 120px;
}

.rank-num {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-mono);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);

  &.top3 {
    background: linear-gradient(135deg, var(--primary-color), var(--accent-purple));
    color: #0a0e1a;
    box-shadow: 0 0 8px rgba(0, 224, 255, 0.3);
  }
}

.rank-name {
  font-size: 14px;
  color: var(--text-primary);
}

.rank-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  margin-left: 16px;
}

.rank-bar-wrap {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  overflow: hidden;
}

.rank-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-purple));
  border-radius: 4px;
  transition: width 0.6s ease;
  box-shadow: 0 0 6px rgba(0, 224, 255, 0.3);
}

.rank-count {
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  min-width: 36px;
  text-align: right;
}
</style>
