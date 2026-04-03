<script setup lang="ts">
/**
 * 聊天容器组件
 * 管理聊天消息列表、场景切换、SSE 流式通信
 * UI 风格参考 claude.ai：简洁、无气泡、居中布局
 */
import type { ChatMessage, ChatScene, ChatSessionDetail } from '@job-radar/shared'

const props = defineProps<{
  /** 预设场景 */
  scene?: ChatScene
  /** 关联的职位 ID */
  jobId?: string
}>()

const emit = defineEmits<{
  /** 会话变更（新建或切换后），通知外部更新 */
  sessionChange: [sessionId: string | undefined]
}>()

const config = useRuntimeConfig()
const { isLoggedIn } = useAuth()
const { content, isStreaming, conversationId, start, abort } = useSSE()

const messages = ref<(ChatMessage & { isStreaming?: boolean })[]>([])
const currentScene = ref<ChatScene>(props.scene || 'general')
const sessionId = ref<string>()
const messagesContainer = ref<HTMLElement>()

const scenes: { value: ChatScene; label: string; icon: string }[] = [
  { value: 'general', label: '通用对话', icon: '💬' },
  { value: 'jd-analysis', label: 'JD 分析', icon: '📋' },
  { value: 'skill-match', label: '技能匹配', icon: '🎯' },
  { value: 'interview-mock', label: '模拟面试', icon: '🎤' },
]

/** 滚动到底部 */
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

/** 发送消息 */
async function handleSend(text: string) {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录后再使用 AI 助手')
    navigateTo('/auth/login')
    return
  }

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: text,
    timestamp: new Date().toISOString(),
  })
  scrollToBottom()

  // 添加空的 AI 消息占位
  const aiMessageIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: '',
    timestamp: new Date().toISOString(),
    isStreaming: true,
  })

  // 开始 SSE 流式请求
  await start({
    url: `${config.public.apiBase}/chat/stream`,
    body: {
      message: text,
      scene: currentScene.value,
      sessionId: sessionId.value,
      jobId: props.jobId,
    },
    onMessage() {
      messages.value[aiMessageIndex].content = content.value
      scrollToBottom()
    },
    onDone() {
      messages.value[aiMessageIndex].isStreaming = false
      messages.value[aiMessageIndex].content = content.value
      if (conversationId.value) {
        sessionId.value = conversationId.value
        emit('sessionChange', conversationId.value)
      }
    },
    onError(error) {
      messages.value[aiMessageIndex].isStreaming = false
      messages.value[aiMessageIndex].content = `请求失败: ${error.message}`
      ElMessage.error(`AI 请求失败: ${error.message}`)
    },
  })
}

/** 取消流式输出 */
function handleAbort() {
  abort()
  const lastMsg = messages.value[messages.value.length - 1]
  if (lastMsg?.role === 'assistant') {
    lastMsg.isStreaming = false
  }
}

/** 切换场景时清空对话 */
function handleSceneChange(scene: ChatScene) {
  currentScene.value = scene
  messages.value = []
  sessionId.value = undefined
  emit('sessionChange', undefined)
}

/** 加载历史会话 */
function loadSession(detail: ChatSessionDetail) {
  sessionId.value = detail.id
  currentScene.value = (detail.scene as ChatScene) || 'general'
  messages.value = (detail.messages || []).map(msg => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  }))
  scrollToBottom()
}

/** 开始新会话（清空当前对话） */
function newSession() {
  messages.value = []
  sessionId.value = undefined
  emit('sessionChange', undefined)
}

defineExpose({ loadSession, newSession, sessionId })
</script>

<template>
  <div class="chat-container">
    <!-- 场景选择标签栏 -->
    <div class="chat-topbar">
      <div class="scene-tabs">
        <button
          v-for="s in scenes"
          :key="s.value"
          class="scene-tab"
          :class="{ active: currentScene === s.value }"
          @click="handleSceneChange(s.value)"
        >
          <span class="scene-icon">{{ s.icon }}</span>
          <span class="scene-label">{{ s.label }}</span>
        </button>
      </div>
    </div>

    <!-- 对话主区域 -->
    <div class="chat-main">
      <!-- 消息列表 -->
      <div ref="messagesContainer" class="messages-container">
        <div class="messages-inner">
          <!-- 空状态 -->
          <div v-if="messages.length === 0" class="empty-state">
            <div class="empty-logo">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="rgba(255,255,255,0.06)" />
                <path d="M16 20h16M16 28h10" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" />
                <circle cx="36" cy="28" r="3" fill="#00e0ff" opacity="0.6" />
              </svg>
            </div>
            <h2 class="empty-title">{{ scenes.find(s => s.value === currentScene)?.label }}</h2>
            <p class="empty-desc">
              <template v-if="currentScene === 'jd-analysis'">
                发送一个职位的 JD 描述，我来帮你深入分析
              </template>
              <template v-else-if="currentScene === 'skill-match'">
                告诉我你掌握的技能，我来分析市场匹配度
              </template>
              <template v-else-if="currentScene === 'interview-mock'">
                选择一个目标岗位，我来当你的面试官
              </template>
              <template v-else>
                有任何关于求职的问题，尽管问我
              </template>
            </p>
          </div>

          <!-- 消息列表 -->
          <ChatMessage
            v-for="(msg, idx) in messages"
            :key="idx"
            :message="msg"
            :is-streaming="msg.isStreaming"
          />
        </div>
      </div>

      <!-- 输入框 -->
      <ChatInput
        :is-streaming="isStreaming"
        @send="handleSend"
        @abort="handleAbort"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  background: transparent;
}

/* 顶部场景标签栏 */
.chat-topbar {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 12px 24px 0;
}

.scene-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.scene-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: var(--text-regular);
    background: rgba(255, 255, 255, 0.04);
  }

  &.active {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.08);
  }

  .scene-icon {
    font-size: 15px;
  }

  .scene-label {
    font-weight: 500;
  }
}

/* 主区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px;
}

.messages-inner {
  max-width: 768px;
  margin: 0 auto;
  padding: 24px 0 16px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;

  .empty-logo {
    margin-bottom: 20px;
    opacity: 0.8;
  }

  .empty-title {
    font-size: 22px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .empty-desc {
    font-size: 14px;
    color: var(--text-secondary);
    max-width: 360px;
    text-align: center;
    line-height: 1.6;
  }
}

@media (max-width: 768px) {
  .chat-container {
    height: calc(100vh - 60px);
  }

  .chat-topbar {
    padding: 8px 12px 0;
  }

  .scene-tabs {
    overflow-x: auto;
    gap: 2px;
    padding: 3px;
  }

  .scene-tab {
    padding: 6px 10px;
    font-size: 12px;

    .scene-icon {
      font-size: 14px;
    }
  }

  .messages-container {
    padding: 0 12px;
  }
}
</style>
