<script setup lang="ts">
import type { ChatScene } from '@job-radar/shared'
/**
 * AI 助手页面
 * 包含历史会话侧边栏 + 聊天主区域
 */
import type { ChatSessionListItem } from '@job-radar/shared'
import ChatContainer from '~/components/chat/ChatContainer.vue'
import ChatHistory from '~/components/chat/ChatHistory.vue'
import { useChatHistory } from '~/composables/useChatHistory'

useHead({ title: 'AI 助手 - JobRadar' })
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const scene = (route.query.scene as ChatScene) || undefined
const jobId = (route.query.jobId as string) || undefined

const chatContainerRef = ref<InstanceType<typeof ChatContainer> | null>(null)
const chatHistoryRef = ref<InstanceType<typeof ChatHistory> | null>(null)
const activeSessionId = ref<string>()
const { fetchSessionDetail } = useChatHistory()

/** 侧边栏展开状态（移动端可折叠） */
const sidebarVisible = ref(true)

/** 选中历史会话：加载消息到 ChatContainer */
async function handleSelectSession(session: ChatSessionListItem) {
  if (activeSessionId.value === session.id) return
  const detail = await fetchSessionDetail(session.id)
  if (detail && chatContainerRef.value) {
    activeSessionId.value = session.id
    chatContainerRef.value.loadSession(detail)
  }
}

/** 新建会话 */
function handleNewChat() {
  activeSessionId.value = undefined
  chatContainerRef.value?.newSession()
}

/** 会话变更后刷新侧边栏列表 */
function handleSessionChange(newSessionId: string | undefined) {
  activeSessionId.value = newSessionId
  if (newSessionId) {
    chatHistoryRef.value?.refresh()
  }
}

/** 切换侧边栏显示 */
function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}
</script>

<template>
  <ClientOnly>
    <div class="chat-page">
      <!-- 移动端侧边栏切换按钮 -->
      <button class="sidebar-toggle" :class="{ collapsed: !sidebarVisible }" @click="toggleSidebar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <template v-if="sidebarVisible">
            <polyline points="11 17 6 12 11 7" />
          </template>
          <template v-else>
            <polyline points="9 7 14 12 9 17" />
          </template>
        </svg>
      </button>

      <!-- 历史会话侧边栏 -->
      <aside class="chat-sidebar" :class="{ hidden: !sidebarVisible }">
        <ChatHistory
          ref="chatHistoryRef"
          :active-session-id="activeSessionId"
          @select="handleSelectSession"
          @new-chat="handleNewChat"
        />
      </aside>

      <!-- 聊天主区域 -->
      <main class="chat-main-area">
        <ChatContainer
          ref="chatContainerRef"
          :scene="scene"
          :job-id="jobId"
          @session-change="handleSessionChange"
        />
      </main>
    </div>

    <template #fallback>
      <div class="chat-loading">
        <el-skeleton :rows="10" animated />
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped lang="scss">
.chat-page {
  display: flex;
  height: calc(100vh - 60px);
  position: relative;
}

.chat-sidebar {
  width: 280px;
  flex-shrink: 0;
  transition: width 0.25s ease, opacity 0.25s ease;
  overflow: hidden;

  &.hidden {
    width: 0;
    opacity: 0;
    pointer-events: none;
  }
}

.chat-main-area {
  flex: 1;
  min-width: 0;
}

.sidebar-toggle {
  position: absolute;
  top: 16px;
  left: 280px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0 6px 6px 0;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-regular);
  }

  &.collapsed {
    left: 0;
    border-radius: 0 6px 6px 0;
  }
}

.chat-loading {
  padding: 40px;
}

@media (max-width: 768px) {
  .chat-sidebar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 20;
    width: 260px;
    background: var(--bg-color);

    &.hidden {
      width: 0;
    }
  }

  .sidebar-toggle {
    left: 260px;
    top: 8px;

    &.collapsed {
      left: 0;
    }
  }
}
</style>

