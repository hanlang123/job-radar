<script setup lang="ts">
defineProps<{
  data: { range: string; count: number }[]
}>()

function getBarHeight(count: number, max: number) {
  return Math.max(4, (count / max) * 180)
}
</script>

<template>
  <div class="salary-chart">
    <div class="bar-group">
      <div
        v-for="item in data"
        :key="item.range"
        class="bar-item"
      >
        <div class="bar-value">{{ item.count }}</div>
        <div
          class="bar"
          :style="{ height: getBarHeight(item.count, Math.max(...data.map(d => d.count))) + 'px' }"
        />
        <div class="bar-label">{{ item.range }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bar-group {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding-top: 24px;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-value {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.bar {
  width: 100%;
  max-width: 60px;
  background: linear-gradient(180deg, var(--primary-color), var(--accent-purple));
  border-radius: 4px 4px 0 0;
  transition: height 0.6s ease;
  box-shadow: 0 0 8px rgba(0, 224, 255, 0.2);
}

.bar-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 6px;
  text-align: center;
  white-space: nowrap;
}
</style>
