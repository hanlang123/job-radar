/** 职位实体类型 */
export interface Job {
  id: string
  title: string
  company: string
  city?: string
  district?: string
  salaryMin?: number
  salaryMax?: number
  experience?: string
  education?: string
  description?: string
  skills: string[]
  source: string
  sourceId?: string
  rawData?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/** 职位列表查询参数 */
export interface JobQueryParams {
  page?: number
  pageSize?: number
  city?: string
  skills?: string[]
  salaryMin?: number
  salaryMax?: number
  experience?: string
  education?: string
  keyword?: string
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
