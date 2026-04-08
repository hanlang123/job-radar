<script setup lang="ts">
/**
 * Agent 执行状态 Timeline 组件
 * 显示 AI 执行过程：思考中 → 生成中 → 完成/中断/失败
 */
import type { AgentStatus, AgentStatusStep } from '@job-radar/shared'

defineProps<{
  steps: AgentStatusStep[]
  currentStatus: AgentStatus
}>()

/** 状态图标映射 */
const statusConfig: Record<AgentStatus, { icon: string; color: string; label: string }> = {
  thinking: { icon: '🧠', color: '#a78bfa', label: '思考中' },
  streaming: { icon: '✍️', color: '#00e0ff', label: '生成中' },
  interrupted: { icon: '⏸️', color: '#f59e0b', label: '已中断' },
  failed: { icon: '❌', color: '#ef4444', label: '执行失败' },
  completed: { icon: '✅', color: '#22c55e', label: '完成' },
}

function formatDuration(ms?: number): string {
  if (!ms) return ''
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
</script>

<template>
  <div class="agent-timeline" :class="`status-${currentStatus}`">
    <div class="timeline-track">
      <div
        v-for="(step, idx) in steps"
        :key="idx"
        class="timeline-step"
        :class="[
          `step-${step.status}`,
          { 'is-current': idx === steps.length - 1 },
        ]"
      >
        <!-- 连接线 -->
        <div v-if="idx > 0" class="step-connector">
          <div class="connector-line" :class="{ active: true }" />
        </div>

        <!-- 节点 -->
        <div class="step-node">
          <div class="node-dot" :style="{ borderColor: statusConfig[step.status].color }">
            <!-- 当前进行中的闪烁效果 -->
            <div
              v-if="idx === steps.length - 1 && (step.status === 'thinking' || step.status === 'streaming')"
              class="node-pulse"
              :style="{ background: statusConfig[step.status].color }"
            />
            <div
              v-else
              class="node-fill"
              :style="{ background: statusConfig[step.status].color }"
            />
          </div>
        </div>

        <!-- 标签 -->
        <div class="step-info">
          <span class="step-icon">{{ statusConfig[step.status].icon }}</span>
          <span class="step-label" :style="{ color: statusConfig[step.status].color }">
            {{ step.label }}
          </span>
          <span v-if="step.duration" class="step-duration">
            {{ formatDuration(step.duration) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.agent-timeline {
  display: flex;
  align-items: center;
  padding: 6px 0;
  user-select: none;
}

.timeline-track {
  display: flex;
  align-items: center;
  gap: 0;
}

.timeline-step {
  display: flex;
  align-items: center;
  gap: 0;
}

/* 连接线 */
.step-connector {
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.connector-line {
  width: 100%;
  height: 1.5px;
  background: rgba(255, 255, 255, 0.1);
  transition: background 0.3s ease;

  &.active {
    background: rgba(255, 255, 255, 0.2);
  }
}

/* 节点 */
.step-node {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.node-fill {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.node-pulse {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.6); }
}

/* 步骤信息 */
.step-info {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
  white-space: nowrap;
}

.step-icon {
  font-size: 12px;
  line-height: 1;
}

.step-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.step-duration {
  font-size: 10px;
  color: var(--text-secondary);
  opacity: 0.6;
  margin-left: 2px;
}

/* 当前步骤高亮 */
.is-current {
  .step-label {
    font-weight: 600;
  }
}

/* 中断时的特殊样式 */
.status-interrupted {
  .timeline-track {
    opacity: 0.85;
  }
}
</style>
