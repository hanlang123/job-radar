<script setup lang="ts">
/**
 * 技能雷达图组件块
 * 在 AI 输出中通过 :::skill-radar {...} ::: 语法触发
 * 使用 D3.js 绘制雷达图
 */
import * as d3 from 'd3'

const props = defineProps<{
  labels: string[]
  you: number[]
  required: number[]
}>()

const svgRef = ref<SVGSVGElement>()
const size = 280
const center = size / 2
const maxRadius = 100

onMounted(() => drawRadar())
watch(() => [props.labels, props.you, props.required], () => drawRadar(), { deep: true })

function drawRadar() {
  if (!svgRef.value || !props.labels.length) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const g = svg.append('g').attr('transform', `translate(${center}, ${center})`)
  const n = props.labels.length
  const angleStep = (2 * Math.PI) / n

  // 绘制背景网格
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
  })

  // 绘制轴线和标签
  props.labels.forEach((label, i) => {
    const angle = angleStep * i - Math.PI / 2
    const x = maxRadius * Math.cos(angle)
    const y = maxRadius * Math.sin(angle)

    g.append('line')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', x).attr('y2', y)
      .attr('stroke', 'rgba(255, 255, 255, 0.08)')
      .attr('stroke-width', 0.5)

    const labelX = (maxRadius + 18) * Math.cos(angle)
    const labelY = (maxRadius + 18) * Math.sin(angle)

    g.append('text')
      .attr('x', labelX).attr('y', labelY)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', 11)
      .attr('fill', 'rgba(255, 255, 255, 0.65)')
      .text(label)
  })

  // 绘制"岗位要求"区域
  const requiredPoints = props.required.map((v, i) => {
    const angle = angleStep * i - Math.PI / 2
    const r = (v / 100) * maxRadius
    return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number]
  })
  g.append('polygon')
    .attr('points', requiredPoints.map((p) => p.join(',')).join(' '))
    .attr('fill', 'rgba(255, 51, 102, 0.1)')
    .attr('stroke', '#ff3366')
    .attr('stroke-width', 1.5)

  // 绘制"你的技能"区域
  const youPoints = props.you.map((v, i) => {
    const angle = angleStep * i - Math.PI / 2
    const r = (v / 100) * maxRadius
    return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number]
  })
  g.append('polygon')
    .attr('points', youPoints.map((p) => p.join(',')).join(' '))
    .attr('fill', 'rgba(0, 224, 255, 0.1)')
    .attr('stroke', '#00e0ff')
    .attr('stroke-width', 1.5)

  // 绘制数据点
  youPoints.forEach(([x, y]) => {
    g.append('circle').attr('cx', x).attr('cy', y).attr('r', 3).attr('fill', '#00e0ff')
  })
  requiredPoints.forEach(([x, y]) => {
    g.append('circle').attr('cx', x).attr('cy', y).attr('r', 3).attr('fill', '#ff3366')
  })
}
</script>

<template>
  <div class="skill-radar-block">
    <svg ref="svgRef" :width="size" :height="size" />
    <div class="radar-legend">
      <span class="legend-item">
        <span class="legend-dot you" /> 你的技能
      </span>
      <span class="legend-item">
        <span class="legend-dot required" /> 岗位要求
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.skill-radar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  margin: 12px 0;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.radar-legend {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;

  &.you {
    background: rgba(0, 224, 255, 0.6);
    border: 1px solid #00e0ff;
  }

  &.required {
    background: rgba(255, 51, 102, 0.6);
    border: 1px solid #ff3366;
  }
}
</style>
