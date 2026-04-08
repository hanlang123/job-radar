<script setup lang="ts">
/**
 * Agent 执行状态标签组件
 * 单个标签在不同状态间平滑切换，附带耗时计数
 */
import type { AgentStatus, AgentStatusStep } from '@job-radar/shared'

const props = defineProps<{
  steps: AgentStatusStep[]
  currentStatus: AgentStatus
}>()

/** 状态配置 */
const statusConfig: Record<AgentStatus, { icon: string; color: string; bg: string; label: string }> = {
  thinking: { icon: '🧠', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)', label: '思考中' },
  streaming: { icon: '✍️', color: '#00e0ff', bg: 'rgba(0, 224, 255, 0.08)', label: '生成中' },
  interrupted: { icon: '⏸️', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: '已中断' },
  failed: { icon: '❌', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: '失败' },
  completed: { icon: '✅', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)', label: '完成' },
}

const current = computed(() => statusConfig[props.currentStatus])
const isActive = computed(() => props.currentStatus === 'thinking' || props.currentStatus === 'streaming')

/** 取最后一个步骤的 duration 作为总耗时 */
const elapsed = computed(() => {
  const last = props.steps[props.steps.length - 1]
  if (!last?.duration) return ''
  return last.duration < 1000 ? `${last.duration}ms` : `${(last.duration / 1000).toFixed(1)}s`
})
</script>

<template>
  <div class="agent-status-tag">
    <Transition name="morph" mode="out-in">
      <span
        :key="currentStatus"
        class="status-chip"
        :class="[`chip-${currentStatus}`, { active: isActive }]"
        :style="{ color: current.color, borderColor: current.color, background: current.bg }"
      >
        <span class="chip-dot" :style="{ background: current.color }" />
        <span class="chip-icon">{{ current.icon }}</span>
        <span class="chip-label">{{ current.label }}</span>
        <span v-if="elapsed" class="chip-time">{{ elapsed }}</span>
      </span>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.agent-status-tag {
  display: inline-flex;
  padding: 4px 0 6px;
  user-select: none;
  min-height: 28px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px 3px 8px;
  border-radius: 20px;
  border: 1px solid;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  transition: all 0.3s ease;
}

/* 状态圆点 */
.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.active .chip-dot {
  animation: dot-pulse 1.5s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.5); }
}

.chip-icon {
  font-size: 11px;
  line-height: 1;
}

.chip-label {
  font-size: 11px;
  letter-spacing: 0.02em;
}

.chip-time {
  font-size: 10px;
  opacity: 0.6;
  font-weight: 400;
  margin-left: 1px;
}

/* 切换动画 */
.morph-enter-active,
.morph-leave-active {
  transition: all 0.25s ease;
}

.morph-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.morph-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.95);
}
</style>
