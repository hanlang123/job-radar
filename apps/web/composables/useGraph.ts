import type { GraphData, MarketOverview, ApiResponse } from '@job-radar/shared'

/** 技能图谱数据 composable */
export function useGraph() {
  const apiBase = useApiBase()

  const graphData = ref<GraphData | null>(null)
  const marketOverview = ref<MarketOverview | null>(null)
  const loading = ref(false)

  /** 获取技能图谱数据 */
  async function fetchGraph(city?: string, topN = 50) {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<GraphData>>(`${apiBase}/analysis/skill-graph`, {
        params: { city, topN },
      })
      graphData.value = res.data
    } catch (error) {
      console.error('获取图谱数据失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /** 获取市场概览数据 */
  async function fetchMarketOverview(city?: string): Promise<MarketOverview | null> {
    try {
      const res = await $fetch<ApiResponse<MarketOverview>>(`${apiBase}/analysis/market-overview`, {
        params: { city },
      })
      marketOverview.value = res.data
      return res.data
    } catch (error) {
      console.error('获取市场概览失败:', error)
      throw error
    }
  }

  return {
    graphData,
    marketOverview,
    loading,
    fetchGraph,
    fetchMarketOverview,
  }
}
