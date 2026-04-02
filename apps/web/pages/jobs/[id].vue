<script setup lang="ts">
import type { Job, ApiResponse } from '@job-radar/shared'

const route = useRoute()
const jobId = route.params.id as string

const apiBase = useApiBase()

const { data: jobRes, status, error } = await useFetch<ApiResponse<Job>>(
  `${apiBase}/jobs/${jobId}`,
)

const job = computed(() => jobRes.value?.data)

useHead({
  title: computed(() => job.value ? `${job.value.title} - JobRadar` : '岗位详情 - JobRadar'),
})

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return '薪资面议'
  if (min && max) return `${min}-${max}K`
  if (min) return `${min}K+`
  return `${max}K以内`
}

function goToAiAnalysis() {
  navigateTo(`/chat?jobId=${jobId}&scene=jd-analysis`)
}
</script>

<template>
  <div class="job-detail-page">
    <div v-if="status === 'pending'" class="loading-wrap">
      <ClientOnly>
        <CommonLoadingSkeleton :rows="10" />
      </ClientOnly>
    </div>

    <div v-else-if="error" class="error-wrap">
      <div class="error-message">
        <h2>岗位不存在</h2>
        <p>该岗位可能已被删除</p>
        <NuxtLink to="/jobs" class="back-link">返回岗位列表</NuxtLink>
      </div>
    </div>

    <template v-else-if="job">
      <!-- 返回按钮 -->
      <div class="back-bar">
        <NuxtLink to="/jobs" class="back-link">← 返回列表</NuxtLink>
      </div>

      <!-- 头部信息 -->
      <div class="detail-header">
        <div class="header-left">
          <h1 class="job-title">{{ job.title }}</h1>
          <div class="salary salary-text">{{ formatSalary(job.salaryMin, job.salaryMax) }}</div>
        </div>

        <ClientOnly>
          <el-button type="primary" size="large" @click="goToAiAnalysis">
            🤖 AI 分析此岗位
          </el-button>
        </ClientOnly>
      </div>

      <!-- 基本信息卡片 -->
      <div class="info-cards">
        <div class="info-card">
          <span class="info-icon">🏢</span>
          <div>
            <div class="info-label">公司</div>
            <div class="info-value">{{ job.company }}</div>
          </div>
        </div>
        <div v-if="job.city" class="info-card">
          <span class="info-icon">📍</span>
          <div>
            <div class="info-label">地点</div>
            <div class="info-value">{{ job.city }}<template v-if="job.district">-{{ job.district }}</template></div>
          </div>
        </div>
        <div v-if="job.experience" class="info-card">
          <span class="info-icon">💼</span>
          <div>
            <div class="info-label">经验</div>
            <div class="info-value">{{ job.experience }}</div>
          </div>
        </div>
        <div v-if="job.education" class="info-card">
          <span class="info-icon">🎓</span>
          <div>
            <div class="info-label">学历</div>
            <div class="info-value">{{ job.education }}</div>
          </div>
        </div>
      </div>

      <!-- 技能标签 -->
      <section v-if="job.skills?.length" class="section card">
        <h2 class="section-title">技能要求</h2>
        <div class="skills-wrap">
          <span
            v-for="skill in job.skills"
            :key="skill"
            class="skill-tag"
          >
            {{ skill }}
          </span>
        </div>
      </section>

      <!-- 职位描述 -->
      <section v-if="job.description" class="section card">
        <h2 class="section-title">职位描述</h2>
        <div class="description" v-text="job.description" />
      </section>

      <!-- 底部操作 -->
      <div class="detail-actions">
        <ClientOnly>
          <el-button type="primary" size="large" @click="goToAiAnalysis">
            🤖 AI 分析此岗位
          </el-button>
          <NuxtLink v-if="job.rawData?.link" :to="String(job.rawData.link)" target="_blank" rel="noopener">
            <el-button size="large">查看原始链接</el-button>
          </NuxtLink>
        </ClientOnly>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.job-detail-page {
  max-width: 900px;
  margin: 0 auto;
}

.loading-wrap, .error-wrap {
  padding: 40px 0;
}

.error-message {
  text-align: center;
  padding: 60px 0;

  h2 {
    font-size: 20px;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 24px;
  }

  .back-link {
    color: var(--primary-color);
    font-size: 14px;
  }
}

.back-bar {
  margin-bottom: 20px;
}

.back-link {
  font-size: 14px;
  color: var(--text-secondary);
  transition: color 0.2s;

  &:hover {
    color: var(--primary-color);
  }
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.header-left {
  flex: 1;
}

.job-title {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1.3;
  color: var(--text-primary);
}

.salary {
  font-size: 24px;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: var(--shadow-glow);
  }
}

.info-icon {
  font-size: 24px;
  filter: drop-shadow(0 0 4px rgba(0, 224, 255, 0.3));
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin-top: 2px;
}

.section {
  margin-bottom: 20px;
}

.card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-radius: var(--radius-md);
  padding: 24px;
  border: 1px solid var(--glass-border);
}

.skills-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  display: inline-block;
  padding: 4px 12px;
  font-size: 14px;
  color: var(--primary-color);
  background: var(--primary-light);
  border: 1px solid rgba(0, 224, 255, 0.2);
  border-radius: 20px;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 224, 255, 0.2);
    box-shadow: 0 0 8px rgba(0, 224, 255, 0.2);
  }
}

.description {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-regular);
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-actions {
  display: flex;
  gap: 12px;
  padding: 24px 0 40px;
}

@media (max-width: 768px) {
  .detail-header {
    flex-direction: column;
    gap: 12px;
  }

  .job-title {
    font-size: 20px;
  }

  .salary {
    font-size: 18px;
  }

  .info-cards {
    grid-template-columns: 1fr 1fr;
  }

  .detail-actions {
    flex-direction: column;
  }
}
</style>
