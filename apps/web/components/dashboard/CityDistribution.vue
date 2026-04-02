<script setup lang="ts">
defineProps<{
  data: { city: string; count: number }[]
}>()
</script>

<template>
  <div class="city-dist">
    <div class="city-list">
      <div
        v-for="item in data"
        :key="item.city"
        class="city-item"
      >
        <span class="city-name">{{ item.city }}</span>
        <div class="city-bar-wrap">
          <div
            class="city-bar"
            :style="{ width: `${(item.count / data[0].count) * 100}%` }"
          />
        </div>
        <span class="city-count">{{ item.count }} 岗位</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.city-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  &:last-child {
    border-bottom: none;
  }
}

.city-name {
  font-size: 14px;
  min-width: 60px;
  color: var(--text-primary);
  font-weight: 500;
}

.city-bar-wrap {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  overflow: hidden;
}

.city-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-green), var(--primary-color));
  border-radius: 4px;
  transition: width 0.6s ease;
  box-shadow: 0 0 6px rgba(0, 255, 170, 0.3);
}

.city-count {
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  min-width: 60px;
  text-align: right;
  white-space: nowrap;
}
</style>
