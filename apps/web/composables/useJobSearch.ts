import type { Job, JobQueryParams, PaginatedResponse, ApiResponse } from '@job-radar/shared'

/** 职位搜索 composable */
export function useJobSearch() {
  const apiBase = useApiBase()

  const jobs = ref<Job[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(20)

  /** 搜索岗位列表 */
  async function search(params: JobQueryParams = {}) {
    loading.value = true
    try {
      const query = {
        page: params.page || currentPage.value,
        pageSize: params.pageSize || pageSize.value,
        ...params,
      }

      const res = await $fetch<ApiResponse<PaginatedResponse<Job>>>(`${apiBase}/jobs`, {
        params: query,
      })

      jobs.value = res.data.items
      total.value = res.data.total
      currentPage.value = res.data.page
    } catch (error) {
      console.error('搜索岗位失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /** 获取岗位详情 */
  async function getJobDetail(id: string): Promise<Job> {
    const res = await $fetch<ApiResponse<Job>>(`${apiBase}/jobs/${id}`)
    return res.data
  }

  return {
    jobs,
    total,
    loading,
    currentPage,
    pageSize,
    search,
    getJobDetail,
  }
}
