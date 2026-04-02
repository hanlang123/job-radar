<script setup lang="ts">
useHead({ title: 'AI 助手 - JobRadar' })
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const scene = (route.query.scene as string) || undefined
const jobId = (route.query.jobId as string) || undefined
</script>

<template>
  <ClientOnly>
    <ChatContainer :scene="scene" :job-id="jobId" />
    <template #fallback>
      <div class="chat-loading">
        <el-skeleton :rows="10" animated />
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped lang="scss">
.chat-loading {
  padding: 40px;
}
</style>
