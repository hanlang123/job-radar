<script setup lang="ts">
/**
 * 图谱图例组件
 * 展示节点颜色与分类的对应关系
 */

const categories = [
  { label: '前端框架', color: '#00e0ff' },
  { label: '语言', color: '#00ffaa' },
  { label: '后端', color: '#ffaa00' },
  { label: '数据库', color: '#ff3366' },
  { label: 'DevOps', color: '#7b61ff' },
  { label: '工具链', color: '#b37feb' },
  { label: '云服务', color: '#36cfc9' },
  { label: '前端基础', color: '#ff85c0' },
  { label: '可视化', color: '#ffc53d' },
  { label: '中间件', color: '#597ef7' },
  { label: '其他', color: 'rgba(255,255,255,0.3)' },
]
</script>

<template>
  <div class="graph-legend">
    <div class="legend-title">技能分类</div>
    <div class="legend-items">
      <span v-for="cat in categories" :key="cat.label" class="legend-item">
        <span class="legend-dot" :style="{ background: cat.color }" />
        {{ cat.label }}
      </span>
    </div>
    <div class="legend-hint">
      <span class="legend-item">
        <span class="legend-dot user-skill" />
        你的技能
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.graph-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(10, 14, 26, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.legend-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-size: 13px;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 300px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-regular);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 4px currentColor;

  &.user-skill {
    background: transparent;
    border: 2px solid var(--accent-green);
    box-shadow: 0 0 6px rgba(0, 255, 170, 0.4);
  }
}

.legend-hint {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}
</style>
