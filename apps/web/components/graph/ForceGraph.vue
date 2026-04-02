<script setup lang="ts">
/**
 * D3 力导向图组件
 * 展示技能之间的共现关系
 */
import * as d3 from 'd3'
import type { GraphNode, GraphLink } from '@job-radar/shared'

const props = defineProps<{
  nodes: GraphNode[]
  links: GraphLink[]
  /** 用户已有技能列表，绿色描边高亮 */
  userSkills?: string[]
}>()

const emit = defineEmits<{
  nodeClick: [node: GraphNode]
  nodeDblClick: [node: GraphNode]
  nodeHover: [node: GraphNode | null, event: MouseEvent | null]
}>()

const svgRef = ref<SVGSVGElement>()
const containerRef = ref<HTMLElement>()

/** 技能分类颜色映射 */
const categoryColors: Record<string, string> = {
  '前端框架': '#00e0ff',
  '语言': '#00ffaa',
  '后端': '#ffaa00',
  '数据库': '#ff3366',
  'DevOps': '#7b61ff',
  '工具链': '#b37feb',
  '云服务': '#36cfc9',
  '前端基础': '#ff85c0',
  '可视化': '#ffc53d',
  '中间件': '#597ef7',
  '其他': 'rgba(255, 255, 255, 0.3)',
}

let simulation: d3.Simulation<GraphNode, GraphLink> | null = null

onMounted(() => {
  drawGraph()
})

watch(() => [props.nodes, props.links], () => {
  drawGraph()
}, { deep: true })

onUnmounted(() => {
  simulation?.stop()
})

function drawGraph() {
  if (!svgRef.value || !containerRef.value || !props.nodes.length) return

  // 清除旧内容
  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()
  simulation?.stop()

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight || 600

  svg.attr('width', width).attr('height', height)

  // 创建缩放容器
  const g = svg.append('g')
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.3, 5])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })
  svg.call(zoom)

  // 深拷贝数据避免 D3 修改原始 props
  const nodes: GraphNode[] = props.nodes.map((n) => ({ ...n }))
  const links: GraphLink[] = props.links.map((l) => ({ ...l }))

  // 节点大小比例尺
  const maxFreq = d3.max(nodes, (d) => d.frequency) || 1
  const radiusScale = d3.scaleSqrt().domain([1, maxFreq]).range([6, 28])

  // 连线粗细比例尺
  const maxWeight = d3.max(links, (d) => d.weight) || 1
  const widthScale = d3.scaleLinear().domain([1, maxWeight]).range([0.5, 4])

  // 力仿真
  simulation = d3.forceSimulation<GraphNode>(nodes)
    .force('link', d3.forceLink<GraphNode, GraphLink>(links)
      .id((d) => d.id)
      .distance(80)
      .strength(0.3))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide<GraphNode>()
      .radius((d) => radiusScale(d.frequency || 1) + 4))

  // 绘制连线
  const link = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', 'rgba(255, 255, 255, 0.12)')
    .attr('stroke-opacity', 0.5)
    .attr('stroke-width', (d) => widthScale(d.weight))

  // 绘制节点组
  const node = g.append('g')
    .attr('class', 'nodes')
    .selectAll<SVGGElement, GraphNode>('g')
    .data(nodes)
    .join('g')
    .attr('cursor', 'pointer')
    .call(d3.drag<SVGGElement, GraphNode>()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded))

  // 节点圆形
  node.append('circle')
    .attr('r', (d) => radiusScale(d.frequency || 1))
    .attr('fill', (d) => categoryColors[d.category || '其他'] || categoryColors['其他'])
    .attr('fill-opacity', 0.8)
    .attr('stroke', (d) => {
      if (props.userSkills?.includes(d.id)) return '#00ffaa'
      return 'rgba(255, 255, 255, 0.3)'
    })
    .attr('stroke-width', (d) => props.userSkills?.includes(d.id) ? 3 : 1.5)

  // 节点文字
  node.append('text')
    .text((d) => d.label)
    .attr('text-anchor', 'middle')
    .attr('dy', (d) => radiusScale(d.frequency || 1) + 14)
    .attr('font-size', 11)
    .attr('fill', 'rgba(255, 255, 255, 0.65)')
    .attr('pointer-events', 'none')

  // 交互事件
  node.on('mouseover', (event: MouseEvent, d: GraphNode) => {
    // 高亮关联节点和连线
    const connectedIds = new Set<string>()
    links.forEach((l) => {
      const sourceId = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id
      const targetId = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id
      if (sourceId === d.id) connectedIds.add(targetId)
      if (targetId === d.id) connectedIds.add(sourceId)
    })
    connectedIds.add(d.id)

    node.select('circle')
      .attr('fill-opacity', (n: any) => connectedIds.has(n.id) ? 1 : 0.2)
    node.select('text')
      .attr('fill-opacity', (n: any) => connectedIds.has(n.id) ? 1 : 0.2)
    link
      .attr('stroke-opacity', (l: any) => {
        const sid = typeof l.source === 'string' ? l.source : l.source.id
        const tid = typeof l.target === 'string' ? l.target : l.target.id
        return sid === d.id || tid === d.id ? 0.8 : 0.05
      })

    emit('nodeHover', d, event)
  })

  node.on('mouseout', () => {
    node.select('circle').attr('fill-opacity', 0.8)
    node.select('text').attr('fill-opacity', 1)
    link.attr('stroke-opacity', 0.5)
    emit('nodeHover', null, null)
  })

  node.on('click', (_event: MouseEvent, d: GraphNode) => {
    emit('nodeClick', d)
  })

  node.on('dblclick', (_event: MouseEvent, d: GraphNode) => {
    emit('nodeDblClick', d)
  })

  // 仿真更新
  simulation.on('tick', () => {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    node.attr('transform', (d) => `translate(${d.x},${d.y})`)
  })

  // 拖拽回调
  function dragStarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
    if (!event.active) simulation?.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  function dragEnded(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
    if (!event.active) simulation?.alphaTarget(0)
    event.subject.fx = null
    event.subject.fy = null
  }
}

/** 暴露重新渲染方法 */
defineExpose({ redraw: drawGraph })
</script>

<template>
  <div ref="containerRef" class="force-graph-container">
    <svg ref="svgRef" />
  </div>
</template>

<style scoped lang="scss">
.force-graph-container {
  width: 100%;
  height: 100%;
  overflow: hidden;

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>
