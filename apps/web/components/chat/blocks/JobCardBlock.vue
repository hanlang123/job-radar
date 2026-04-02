<script setup lang="ts">
/**
 * 职位卡片组件块
 * 在 AI 输出中通过 :::job-card {...} ::: 语法触发
 */
const props = defineProps<{
  title: string
  company: string
  salary?: string
  tags?: string[]
  city?: string
  experience?: string
}>()
</script>

<template>
  <div class="job-card-block">
    <div class="job-card-header">
      <h4 class="job-title">{{ title }}</h4>
      <span v-if="salary" class="job-salary">{{ salary }}</span>
    </div>
    <div class="job-card-meta">
      <span class="job-company">
        <el-icon><OfficeBuilding /></el-icon>
        {{ company }}
      </span>
      <span v-if="city" class="job-city">
        <el-icon><Location /></el-icon>
        {{ city }}
      </span>
      <span v-if="experience" class="job-exp">
        <el-icon><Timer /></el-icon>
        {{ experience }}
      </span>
    </div>
    <div v-if="tags?.length" class="job-card-tags">
      <el-tag v-for="tag in tags" :key="tag" size="small" type="info" effect="plain">
        {{ tag }}
      </el-tag>
    </div>
  </div>
</template>

<style scoped lang="scss">
.job-card-block {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px 20px;
  margin: 12px 0;
  contain: layout style;
}

.job-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.job-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.job-salary {
  font-size: 15px;
  font-weight: 600;
  color: #e8804a;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
}

.job-card-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);

  > span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.job-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 24px;

  :deep(.el-tag) {
    transition: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.7);
  }
}
</style>
