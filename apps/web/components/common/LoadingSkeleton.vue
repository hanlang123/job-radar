<script setup lang="ts">
defineProps<{
  rows?: number
  animated?: boolean
}>()
</script>

<template>
  <div class="loading-skeleton">
    <el-skeleton :rows="rows || 5" :animated="animated !== false" />
  </div>
</template>

<style scoped>
.loading-skeleton {
  padding: 20px;
}
</style>
