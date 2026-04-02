// 测试 API 端点
async function testAPIs() {
  const BASE = 'http://localhost:3001/api'

  // 1. 测试岗位列表
  console.log('\n=== GET /api/jobs ===')
  const jobsRes = await fetch(`${BASE}/jobs?page=1&pageSize=3`)
  const jobsData = await jobsRes.json()
  console.log('Status:', jobsRes.status)
  console.log('Total:', jobsData.data?.total)
  console.log('Items:', jobsData.data?.items?.length)
  if (jobsData.data?.items?.[0]) {
    const j = jobsData.data.items[0]
    console.log('Sample:', { title: j.title, company: j.company, city: j.city, skills: j.skills?.slice(0, 5) })
  }

  // 2. 测试筛选器选项
  console.log('\n=== GET /api/jobs/filters ===')
  const filtersRes = await fetch(`${BASE}/jobs/filters`)
  const filtersData = await filtersRes.json()
  console.log('Status:', filtersRes.status)
  console.log('Cities:', filtersData.data?.cities?.length)
  console.log('Skills:', filtersData.data?.skills?.length)

  // 3. 测试单个岗位
  if (jobsData.data?.items?.[0]?.id) {
    const id = jobsData.data.items[0].id
    console.log(`\n=== GET /api/jobs/${id} ===`)
    const jobRes = await fetch(`${BASE}/jobs/${id}`)
    const jobData = await jobRes.json()
    console.log('Status:', jobRes.status)
    console.log('Title:', jobData.data?.title)
  }

  // 4. 测试技能图谱
  console.log('\n=== GET /api/analysis/skill-graph ===')
  const graphRes = await fetch(`${BASE}/analysis/skill-graph?topN=10`)
  const graphData = await graphRes.json()
  console.log('Status:', graphRes.status)
  console.log('Nodes:', graphData.data?.nodes?.length)
  console.log('Links:', graphData.data?.links?.length)
  if (graphData.data?.nodes?.[0]) {
    console.log('Sample node:', graphData.data.nodes[0])
  }

  // 5. 测试市场概览
  console.log('\n=== GET /api/analysis/market-overview ===')
  const overviewRes = await fetch(`${BASE}/analysis/market-overview`)
  const overviewData = await overviewRes.json()
  console.log('Status:', overviewRes.status)
  console.log('Data:', JSON.stringify(overviewData.data, null, 2).slice(0, 500))

  console.log('\n✅ API 测试完成！')
}

testAPIs().catch(console.error)
