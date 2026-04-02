<script setup lang="ts">
/**
 * 节点 Tooltip 浮窗
 */
import type { GraphNode } from '@job-radar/shared'

const props = defineProps<{
  node: GraphNode | null
  x: number
  y: number
}>()
</script>

<template>
  <Transition name="fade">
    <div
      v-if="node"
      class="node-tooltip"
      :style="{ left: x + 16 + 'px', top: y - 10 + 'px' }"
    >
      <div class="tooltip-title">{{ node.label }}</div>
      <div v-if="node.type === 'skill'" class="tooltip-info">
        <span>分类: {{ node.category || '其他' }}</span>
        <span>出现次数: {{ node.frequency || 0 }}</span>
      </div>
      <div v-if="node.type === 'company'" class="tooltip-info">
        <span>在招岗位: {{ node.jobCount || 0 }}</span>
        <span v-if="node.avgSalary">平均薪资: {{ node.avgSalary }}K</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.node-tooltip {
  position: fixed;
  z-index: 1000;
  background: rgba(10, 14, 26, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: var(--text-primary);
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  pointer-events: none;
  border: 1px solid rgba(0, 224, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 10px rgba(0, 224, 255, 0.1);
  max-width: 220px;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--primary-color);
}

.tooltip-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--text-secondary);
  font-size: 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
