<script setup lang="ts">
import type { ApiResponse } from '@job-radar/shared'

interface Filters {
  city: string
  experience: string
  education: string
  skills: string[]
  salaryMin: number | undefined
  salaryMax: number | undefined
  keyword: string
}

const model = defineModel<Filters>({ required: true })
const emit = defineEmits<{ search: [] }>()

const config = useRuntimeConfig()
const apiBase = config.public.apiBase

interface FilterOptions {
  cities: string[]
  skills: string[]
  experienceLevels: string[]
  educationLevels: string[]
}

const { data: filterOptions } = await useFetch<ApiResponse<FilterOptions>>(
  `${apiBase}/jobs/filters`,
)

const options = computed(() => filterOptions.value?.data)

function handleReset() {
  model.value = {
    city: '',
    experience: '',
    education: '',
    skills: [],
    salaryMin: undefined,
    salaryMax: undefined,
    keyword: '',
  }
  emit('search')
}
</script>

<template>
  <div class="job-filter">
    <div class="filter-row">
      <el-input
        v-model="model.keyword"
        placeholder="搜索职位名称、公司、技能..."
        clearable
        size="large"
        class="search-input"
        @keyup.enter="emit('search')"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" size="large" @click="emit('search')">搜索</el-button>
    </div>

    <div v-if="options" class="filter-row filter-options">
      <el-select
        v-model="model.city"
        placeholder="城市"
        clearable
        size="default"
        @change="emit('search')"
      >
        <el-option
          v-for="c in options.cities"
          :key="c"
          :label="c"
          :value="c"
        />
      </el-select>

      <el-select
        v-model="model.experience"
        placeholder="经验"
        clearable
        size="default"
        @change="emit('search')"
      >
        <el-option
          v-for="e in options.experienceLevels"
          :key="e"
          :label="e"
          :value="e"
        />
      </el-select>

      <el-select
        v-model="model.education"
        placeholder="学历"
        clearable
        size="default"
        @change="emit('search')"
      >
        <el-option
          v-for="e in options.educationLevels"
          :key="e"
          :label="e"
          :value="e"
        />
      </el-select>

      <el-select
        v-model="model.skills"
        placeholder="技能"
        clearable
        multiple
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="2"
        size="default"
        @change="emit('search')"
      >
        <el-option
          v-for="s in options.skills"
          :key="s"
          :label="s"
          :value="s"
        />
      </el-select>

      <div class="salary-range">
        <el-input-number
          v-model="model.salaryMin"
          placeholder="最低薪资"
          :min="0"
          :step="5"
          controls-position="right"
          size="default"
          @change="emit('search')"
        />
        <span class="range-sep">-</span>
        <el-input-number
          v-model="model.salaryMax"
          placeholder="最高薪资"
          :min="0"
          :step="5"
          controls-position="right"
          size="default"
          @change="emit('search')"
        />
        <span class="range-unit">K</span>
      </div>

      <el-button text @click="handleReset">重置</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.job-filter {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-radius: var(--radius-md);
  padding: 20px 24px;
  border: 1px solid var(--glass-border);
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
}

.filter-options {
  margin-top: 16px;
  flex-wrap: wrap;

  .el-select {
    width: 130px;
  }
}

.salary-range {
  display: flex;
  align-items: center;
  gap: 4px;

  .el-input-number {
    width: 110px;
  }
}

.range-sep {
  color: var(--text-secondary);
}

.range-unit {
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
