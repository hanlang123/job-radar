<script setup lang="ts">
/**
 * 提示卡片组件块
 * 在 AI 输出中通过 :::alert info/warning/success ::: 语法触发
 */
defineProps<{
  /** 提示类型：info / warning / success */
  type?: 'info' | 'warning' | 'success'
}>()

const typeConfig = {
  info: { icon: 'InfoFilled', color: '#00e0ff', bg: 'rgba(0, 224, 255, 0.06)', border: 'rgba(0, 224, 255, 0.2)' },
  warning: { icon: 'WarningFilled', color: '#ffaa00', bg: 'rgba(255, 170, 0, 0.06)', border: 'rgba(255, 170, 0, 0.2)' },
  success: { icon: 'SuccessFilled', color: '#00ffaa', bg: 'rgba(0, 255, 170, 0.06)', border: 'rgba(0, 255, 170, 0.2)' },
}
</script>

<template>
  <div
    class="alert-block"
    :style="{
      background: typeConfig[type || 'info'].bg,
      borderColor: typeConfig[type || 'info'].border,
      color: typeConfig[type || 'info'].color,
    }"
  >
    <el-icon class="alert-icon" :size="18">
      <InfoFilled v-if="type === 'info' || !type" />
      <WarningFilled v-else-if="type === 'warning'" />
      <SuccessFilled v-else-if="type === 'success'" />
    </el-icon>
    <div class="alert-content">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.alert-block {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid;
  border-radius: 8px;
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.6;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
  color: rgba(255, 255, 255, 0.75);

  :deep(p) {
    margin: 0;
  }
}
</style>
