/** 图谱节点类型 */
export interface GraphNode {
  id: string
  label: string
  type: 'skill' | 'company' | 'job'
  /** skill: JD 中出现次数 */
  frequency?: number
  /** skill: 前端框架/语言/工具链/后端/DevOps */
  category?: string
  /** company: 在招岗位数 */
  jobCount?: number
  /** company: 平均薪资 */
  avgSalary?: number
  /** d3 仿真坐标 */
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

/** 图谱连线类型 */
export interface GraphLink {
  source: string
  target: string
  /** 共现次数 */
  weight: number
  /** 平均薪资 */
  avgSalary?: number
}

/** 图谱完整数据 */
export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

/** 市场概览数据 */
export interface MarketOverview {
  totalJobs: number
  avgSalary: number
  topSkills: { skill: string; count: number }[]
  cityDistribution: { city: string; count: number }[]
  salaryDistribution: { range: string; count: number }[]
}
