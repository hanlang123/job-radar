<script setup lang="ts">
/**
 * 对比表格组件块
 * 在 AI 输出中通过 :::compare ... ::: 语法触发
 * 内部 Markdown 表格由 vue-markdown-stream 渲染
 */
defineProps<{
  /** 内部 Markdown 内容（表格） */
  content?: string
}>()
</script>

<template>
  <div class="compare-table-block">
    <div class="compare-header">
      <el-icon><DataAnalysis /></el-icon>
      <span>岗位对比</span>
    </div>
    <div class="compare-body">
      <!-- 内部内容由 MarkdownRenderer 渲染 -->
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.compare-table-block {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  margin: 12px 0;
}

.compare-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.04);
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.compare-body {
  padding: 4px;

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 0;

    th, td {
      border: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding: 10px 14px;
      font-size: 13px;
    }

    th {
      background: rgba(255, 255, 255, 0.03);
      font-weight: 600;
      color: rgba(255, 255, 255, 0.75);
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background: rgba(0, 224, 255, 0.03);
    }
  }
}
</style>
