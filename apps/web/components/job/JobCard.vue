<script setup lang="ts">
import type { Job } from '@job-radar/shared'

defineProps<{
  job: Job
}>()

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return '薪资面议'
  if (min && max) return `${min}-${max}K`
  if (min) return `${min}K+`
  return `${max}K以内`
}
</script>

<template>
  <NuxtLink :to="`/jobs/${job.id}`" class="job-card">
    <div class="card-header">
      <h3 class="job-title">{{ job.title }}</h3>
      <span class="salary salary-text">{{ formatSalary(job.salaryMin, job.salaryMax) }}</span>
    </div>

    <div class="card-meta">
      <span class="company">{{ job.company }}</span>
      <span v-if="job.city" class="divider">·</span>
      <span v-if="job.city" class="location">{{ job.city }}<template v-if="job.district">-{{ job.district }}</template></span>
      <span v-if="job.experience" class="divider">·</span>
      <span v-if="job.experience" class="exp">{{ job.experience }}</span>
      <span v-if="job.education" class="divider">·</span>
      <span v-if="job.education" class="edu">{{ job.education }}</span>
    </div>

    <div v-if="job.skills?.length" class="card-skills">
      <span v-for="skill in job.skills.slice(0, 6)" :key="skill" class="skill-tag">
        {{ skill }}
      </span>
      <span v-if="job.skills.length > 6" class="skill-more">+{{ job.skills.length - 6 }}</span>
    </div>
  </NuxtLink>
</template>

<style scoped lang="scss">
.job-card {
  display: block;
  padding: 20px 24px;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, var(--primary-color), var(--accent-purple));
    opacity: 0;
    transition: opacity 0.3s;
    border-radius: 2px 0 0 2px;
  }

  &:hover {
    border-color: var(--border-glow);
    box-shadow: var(--shadow-glow);
    background: var(--bg-card-hover);

    &::before {
      opacity: 1;
    }
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.job-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.salary {
  font-size: 16px;
  white-space: nowrap;
  flex-shrink: 0;
  font-family: var(--font-mono);
}

.card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.company {
  color: var(--text-regular);
  font-weight: 500;
}

.divider {
  color: rgba(255, 255, 255, 0.15);
}

.card-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.skill-more {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 2px 6px;
}
</style>
