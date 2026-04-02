<script setup lang="ts">
useHead({ title: '岗位列表 - JobRadar' })

const { jobs, total, loading, currentPage, pageSize, search } = useJobSearch()

const filters = ref({
  city: '',
  experience: '',
  education: '',
  skills: [] as string[],
  salaryMin: undefined as number | undefined,
  salaryMax: undefined as number | undefined,
  keyword: '',
})

function buildParams() {
  const f = filters.value
  return {
    page: currentPage.value,
    pageSize: pageSize.value,
    ...(f.city ? { city: f.city } : {}),
    ...(f.experience ? { experience: f.experience } : {}),
    ...(f.education ? { education: f.education } : {}),
    ...(f.skills.length ? { skills: f.skills } : {}),
    ...(f.salaryMin ? { salaryMin: f.salaryMin } : {}),
    ...(f.salaryMax ? { salaryMax: f.salaryMax } : {}),
    ...(f.keyword ? { keyword: f.keyword } : {}),
  }
}

async function handleSearch() {
  currentPage.value = 1
  await search(buildParams())
}

async function handlePageChange(page: number) {
  currentPage.value = page
  await search(buildParams())
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 首次加载
await search({ page: 1, pageSize: 20 })
</script>

<template>
  <div class="jobs-page">
    <h1 class="page-title">岗位列表</h1>
    <p class="page-desc">共 {{ total }} 个岗位</p>

    <!-- 筛选区域仅客户端渲染（Element Plus 表单组件不兼容 SSR） -->
    <ClientOnly>
      <JobFilter v-model="filters" @search="handleSearch" />
    </ClientOnly>

    <div class="job-list">
      <CommonLoadingSkeleton v-if="loading" :rows="6" />
      <template v-else-if="jobs.length">
        <JobCard v-for="job in jobs" :key="job.id" :job="job" />
      </template>
      <ClientOnly>
        <el-empty v-if="!loading && !jobs.length" description="没有找到相关岗位" />
      </ClientOnly>
    </div>

    <div v-if="total > pageSize" class="pagination">
      <ClientOnly>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, total"
          background
          @current-change="handlePageChange"
        />
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped lang="scss">
.jobs-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #00e0ff, #7b61ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-family: var(--font-mono);
}

.job-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
</style>
