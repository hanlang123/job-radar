<script setup lang="ts">
/**
 * 个人技能雷达图（D3 实现）
 * 展示用户技能在市场中的热度
 */
import * as d3 from 'd3'

const props = defineProps<{
  /** 技能名称列表 */
  labels: string[]
  /** 用户技能熟练度 (0-100) */
  values: number[]
  /** 市场需求度 (0-100) */
  marketValues?: number[]
}>()

const svgRef = ref<SVGSVGElement>()
const size = 320
const center = size / 2
const maxRadius = 110

onMounted(() => drawRadar())
watch(() => [props.labels, props.values, props.marketValues], () => drawRadar(), { deep: true })

function drawRadar() {
  if (!svgRef.value || !props.labels.length) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const g = svg.append('g').attr('transform', `translate(${center}, ${center})`)
  const n = props.labels.length
  const angleStep = (2 * Math.PI) / n

  // 背景网格
  const levels = [20, 40, 60, 80, 100]
  levels.forEach((level) => {
    const points = Array.from({ length: n }, (_, i) => {
      const angle = angleStep * i - Math.PI / 2
      const r = (level / 100) * maxRadius
      return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number]
    })
    g.append('polygon')
      .attr('points', points.map((p) => p.join(',')).join(' '))
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.08)')
      .attr('stroke-width', 0.5)

    // 刻度值
    g.append('text')
      .attr('x', 4)
      .attr('y', -(level / 100) * maxRadius)
      .attr('font-size', 9)
      .attr('fill', 'rgba(255, 255, 255, 0.2)')
      .text(level.toString())
  })

  // 轴线和标签
  props.labels.forEach((label, i) => {
    const angle = angleStep * i - Math.PI / 2
    const x = maxRadius * Math.cos(angle)
    const y = maxRadius * Math.sin(angle)

    g.append('line')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', x).attr('y2', y)
      .attr('stroke', 'rgba(255, 255, 255, 0.08)')
      .attr('stroke-width', 0.5)

    const labelX = (maxRadius + 20) * Math.cos(angle)
    const labelY = (maxRadius + 20) * Math.sin(angle)

    g.append('text')
      .attr('x', labelX).attr('y', labelY)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 12)
      .attr('fill', 'rgba(255, 255, 255, 0.75)')
      .attr('font-weight', '500')
      .text(label)
  })

  // 市场需求区域
  if (props.marketValues?.length) {
    const marketPoints = props.marketValues.map((v, i) => {
      const angle = angleStep * i - Math.PI / 2
      const r = (v / 100) * maxRadius
      return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number]
    })
    g.append('polygon')
      .attr('points', marketPoints.map((p) => p.join(',')).join(' '))
      .attr('fill', 'rgba(255, 170, 0, 0.08)')
      .attr('stroke', '#ffaa00')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
  }

  // 用户技能区域
  const userPoints = props.values.map((v, i) => {
    const angle = angleStep * i - Math.PI / 2
    const r = (v / 100) * maxRadius
    return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number]
  })
  g.append('polygon')
    .attr('points', userPoints.map((p) => p.join(',')).join(' '))
    .attr('fill', 'rgba(0, 224, 255, 0.12)')
    .attr('stroke', '#00e0ff')
    .attr('stroke-width', 2)

  // 数据点
  userPoints.forEach(([x, y]) => {
    g.append('circle')
      .attr('cx', x).attr('cy', y)
      .attr('r', 4)
      .attr('fill', '#00e0ff')
      .attr('stroke', 'rgba(0, 224, 255, 0.4)')
      .attr('stroke-width', 1.5)
  })
}
</script>

<template>
  <div class="dashboard-skill-radar">
    <svg ref="svgRef" :width="size" :height="size" />
    <div v-if="marketValues?.length" class="radar-legend">
      <span class="legend-item">
        <span class="legend-line user-line" /> 我的技能
      </span>
      <span class="legend-item">
        <span class="legend-line market-line" /> 市场需求
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-skill-radar {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.radar-legend {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-line {
  width: 20px;
  height: 2px;

  &.user-line {
    background: #00e0ff;
  }

  &.market-line {
    background: #ffaa00;
    border-top: 1px dashed #ffaa00;
  }
}
</style>
