<script setup lang="ts">
/**
 * 薪资对比条组件块
 * 在 AI 输出中通过 :::salary-bar {...} ::: 语法触发
 */
const props = defineProps<{
  min: number
  max: number
  median: number
  yourExpect?: number
}>()

/** 计算百分比位置 */
function getPercent(value: number): number {
  const range = props.max - props.min
  if (range <= 0) return 50
  // 给两侧留 5% padding
  const padding = range * 0.2
  const fullMin = props.min - padding
  const fullMax = props.max + padding
  return Math.max(0, Math.min(100, ((value - fullMin) / (fullMax - fullMin)) * 100))
}
</script>

<template>
  <div class="salary-bar-block">
    <div class="salary-header">
      <span class="salary-label">薪资范围 (K/月)</span>
      <span class="salary-range">{{ min }}K - {{ max }}K</span>
    </div>
    <div class="bar-container">
      <!-- 薪资范围条 -->
      <div
        class="salary-range-bar"
        :style="{
          left: getPercent(min) + '%',
          width: (getPercent(max) - getPercent(min)) + '%',
        }"
      />
      <!-- 中位数标记 -->
      <div class="marker median-marker" :style="{ left: getPercent(median) + '%' }">
        <div class="marker-line" />
        <div class="marker-label">中位 {{ median }}K</div>
      </div>
      <!-- 你的期望标记 -->
      <div
        v-if="yourExpect"
        class="marker expect-marker"
        :style="{ left: getPercent(yourExpect) + '%' }"
      >
        <div class="marker-line" />
        <div class="marker-label">你 {{ yourExpect }}K</div>
      </div>
    </div>
    <div class="bar-scale">
      <span>{{ Math.floor(min * 0.8) }}K</span>
      <span>{{ Math.ceil(max * 1.2) }}K</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.salary-bar-block {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 16px 20px;
  margin: 12px 0;
}

.salary-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.salary-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
}

.salary-range {
  font-size: 14px;
  font-weight: 600;
  color: #00ffaa;
  font-family: 'JetBrains Mono', monospace;
}

.bar-container {
  position: relative;
  height: 40px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  margin-bottom: 8px;
}

.salary-range-bar {
  position: absolute;
  top: 8px;
  height: 24px;
  background: linear-gradient(90deg, #00e0ff, #7b61ff);
  border-radius: 6px;
  opacity: 0.6;
}

.marker {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-line {
  width: 2px;
  height: 40px;
  border-radius: 1px;
}

.marker-label {
  font-size: 11px;
  white-space: nowrap;
  margin-top: 4px;
  font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
}

.median-marker {
  .marker-line { background: #00e0ff; }
  .marker-label { color: #00e0ff; }
}

.expect-marker {
  .marker-line { background: #ffaa00; }
  .marker-label { color: #ffaa00; }
}

.bar-scale {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
}
</style>
