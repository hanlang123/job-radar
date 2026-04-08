<script setup lang="ts">
/**
 * 单条聊天消息组件
 * Claude.ai 风格：无气泡、全宽、简洁排版
 * 支持 Agent 状态 timeline 和中断恢复
 */
import type { ChatMessage, AgentStatus, AgentStatusStep } from '@job-radar/shared'

const props = defineProps<{
  message: ChatMessage
  isStreaming?: boolean
  agentStatus?: AgentStatus
  statusSteps?: AgentStatusStep[]
}>()

const emit = defineEmits<{
  resume: []
}>()

const isUser = computed(() => props.message.role === 'user')
const isInterrupted = computed(() => props.message.agentStatus === 'interrupted')
const showTimeline = computed(() =>
  !isUser.value && props.statusSteps && props.statusSteps.length > 0,
)
</script>

<template>
  <div class="chat-message" :class="{ 'is-user': isUser, 'is-assistant': !isUser, 'is-interrupted': isInterrupted }">
    <!-- 小图标 -->
    <div class="message-icon">
      <template v-if="isUser">
        <div class="icon-circle icon-user">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </template>
      <template v-else>
        <div class="icon-circle icon-ai">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      </template>
    </div>

    <!-- 消息内容 -->
    <div class="message-body">
      <div class="message-author">{{ isUser ? '你' : 'JobRadar' }}</div>

      <!-- Agent 状态 Timeline -->
      <ChatAgentStatusTimeline
        v-if="showTimeline"
        :steps="statusSteps!"
        :current-status="agentStatus || 'thinking'"
      />

      <div class="message-content">
        <!-- 用户消息直接渲染文本 -->
        <div v-if="isUser" class="user-text">{{ message.content }}</div>
        <!-- AI 消息走流式 Markdown 渲染 -->
        <template v-else>
          <!-- 思考中指示器（无内容时） -->
          <div v-if="isStreaming && !message.content" class="thinking-indicator">
            <span class="dot" /><span class="dot" /><span class="dot" />
          </div>
          <ChatStreamRenderer
            v-else
            :content="message.content"
            :is-streaming="!!isStreaming"
          />
        </template>
      </div>

      <!-- 中断恢复操作栏 -->
      <div v-if="isInterrupted && !isStreaming" class="interrupted-bar">
        <span class="interrupted-hint">⏸️ 输出已中断</span>
        <button class="btn-resume" @click="emit('resume')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          继续生成
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-message {
  display: flex;
  gap: 12px;
  padding: 20px 0;
  position: relative;

  & + & {
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  &.is-user {
    .message-content {
      color: var(--text-primary);
    }
  }

  &.is-assistant {
    background: rgba(255, 255, 255, 0.02);
    margin: 0 -16px;
    padding-left: 16px;
    padding-right: 16px;
    border-radius: 8px;
  }
}

/* 小图标 */
.message-icon {
  flex-shrink: 0;
  padding-top: 2px;
}

.icon-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-user {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-regular);
}

.icon-ai {
  background: rgba(0, 224, 255, 0.1);
  color: #00e0ff;
}

/* 内容 */
.message-body {
  flex: 1;
  min-width: 0;
}

.message-author {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.message-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-regular);
}

.user-text {
  white-space: pre-wrap;
  word-break: break-word;
}

/* 中断恢复操作栏 */
.interrupted-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 8px;
}

.interrupted-hint {
  font-size: 12px;
  color: #f59e0b;
  opacity: 0.9;
}

.btn-resume {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border: 1px solid rgba(0, 224, 255, 0.3);
  border-radius: 6px;
  background: rgba(0, 224, 255, 0.08);
  color: #00e0ff;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 224, 255, 0.15);
    border-color: rgba(0, 224, 255, 0.5);
  }
}

/* 中断消息的视觉提示 */
.is-interrupted {
  .message-content {
    position: relative;

    &::after {
      content: '';
      display: block;
      height: 2px;
      margin-top: 4px;
      background: linear-gradient(90deg, rgba(245, 158, 11, 0.4), transparent);
      border-radius: 1px;
    }
  }
}

/* 思考中动画 */
.thinking-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-secondary);
  animation: thinking 1.4s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }

  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

@keyframes thinking {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
