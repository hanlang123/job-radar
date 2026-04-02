<script setup lang="ts">
/**
 * 图谱控制面板
 * 城市筛选 + 节点数量 + 操作按钮
 */

const emit = defineEmits<{
  filter: [city: string, topN: number]
  reset: []
}>()

const props = defineProps<{
  loading?: boolean
  cities?: string[]
}>()

const selectedCity = ref('')
const topN = ref(50)

function handleFilter() {
  emit('filter', selectedCity.value, topN.value)
}

function handleReset() {
  selectedCity.value = ''
  topN.value = 50
  emit('reset')
}
</script>

<template>
  <div class="graph-controls">
    <ClientOnly>
      <el-select
        v-model="selectedCity"
        placeholder="全部城市"
        clearable
        size="small"
        style="width: 120px"
        @change="handleFilter"
      >
        <el-option
          v-for="city in cities"
          :key="city"
          :label="city"
          :value="city"
        />
      </el-select>

      <el-input-number
        v-model="topN"
        :min="10"
        :max="100"
        :step="10"
        size="small"
        style="width: 130px"
        controls-position="right"
        @change="handleFilter"
      />

      <el-button size="small" @click="handleReset" :loading="loading">
        重置
      </el-button>
    </ClientOnly>
  </div>
</template>

<style scoped lang="scss">
.graph-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
</style>
