<script setup lang="ts">
/**
 * 技术图谱页面 (CSR)
 * D3 力导向图展示技能共现关系
 */
import type { GraphNode } from '@job-radar/shared'

useHead({ title: '技术图谱 - JobRadar' })

const { graphData, loading, fetchGraph, fetchMarketOverview } = useGraph()
const { user } = useAuth()

const tooltipNode = ref<GraphNode | null>(null)
const tooltipX = ref(0)
const tooltipY = ref(0)
const selectedNode = ref<GraphNode | null>(null)

/** 可用城市列表 */
const cities = ref<string[]>([])

onMounted(async () => {
  await Promise.all([
    fetchGraph(),
    loadCities(),
  ])
})

/** 加载城市列表 */
async function loadCities() {
  try {
    const overview = await fetchMarketOverview()
    if (overview) {
      cities.value = overview.cityDistribution.map((c) => c.city)
    }
  } catch {
    // 忽略
  }
}

/** 筛选 */
async function handleFilter(city: string, topN: number) {
  await fetchGraph(city || undefined, topN)
}

/** 重置 */
async function handleReset() {
  await fetchGraph()
}

/** hover 节点 */
function handleNodeHover(node: GraphNode | null, event: MouseEvent | null) {
  tooltipNode.value = node
  if (event) {
    tooltipX.value = event.clientX
    tooltipY.value = event.clientY
  }
}

/** 点击节点 */
function handleNodeClick(node: GraphNode) {
  selectedNode.value = selectedNode.value?.id === node.id ? null : node
}

/** 双击节点：跳转到岗位列表 */
function handleNodeDblClick(node: GraphNode) {
  if (node.type === 'skill') {
    navigateTo({ path: '/jobs', query: { skills: node.id } })
  }
}
</script>

<template>
  <ClientOnly>
    <div class="graph-page">
      <GraphControls
        :loading="loading"
        :cities="cities"
        @filter="handleFilter"
        @reset="handleReset"
      />

      <div class="graph-main">
        <div v-if="loading" class="graph-loading">
          <el-skeleton :rows="8" animated />
        </div>
        <template v-else-if="graphData">
          <GraphForceGraph
            :nodes="graphData.nodes"
            :links="graphData.links"
            :user-skills="user?.skills"
            @node-hover="handleNodeHover"
            @node-click="handleNodeClick"
            @node-dbl-click="handleNodeDblClick"
          />
          <GraphLegend />
        </template>
        <div v-else class="graph-empty">
          <el-empty description="暂无图谱数据" />
        </div>
      </div>

      <!-- Tooltip -->
      <GraphNodeTooltip
        :node="tooltipNode"
        :x="tooltipX"
        :y="tooltipY"
      />

      <!-- 选中节点详情面板 -->
      <Transition name="slide">
        <div v-if="selectedNode" class="node-detail-panel">
          <div class="panel-header">
            <h4>{{ selectedNode.label }}</h4>
            <el-button text circle size="small" @click="selectedNode = null">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div class="panel-body">
            <p><strong>分类:</strong> {{ selectedNode.category || '其他' }}</p>
            <p><strong>出现频次:</strong> {{ selectedNode.frequency || 0 }} 次</p>
            <el-button
              type="primary"
              size="small"
              @click="navigateTo({ path: '/jobs', query: { skills: selectedNode.id } })"
            >
              查看相关岗位
            </el-button>
            <el-button
              size="small"
              @click="navigateTo({ path: '/chat', query: { scene: 'skill-match' } })"
            >
              AI 分析此技能
            </el-button>
          </div>
        </div>
      </Transition>
    </div>
    <template #fallback>
      <div style="padding: 40px">
        <el-skeleton :rows="10" animated />
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped lang="scss">
.graph-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--glass-border);
}

.graph-main {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.graph-loading {
  padding: 40px;
}

.graph-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.node-detail-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 240px;
  background: rgba(10, 14, 26, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 224, 255, 0.15);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 0 0 12px rgba(0, 224, 255, 0.08);
  z-index: 10;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  h4 {
    margin: 0;
    font-size: 16px;
    color: var(--primary-color);
  }
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  color: var(--text-regular);

  p {
    margin: 0;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@media (max-width: 768px) {
  .graph-page {
    height: calc(100vh - 100px);
  }

  .node-detail-panel {
    top: auto;
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    border-radius: 12px 12px 0 0;
  }
}
</style>
