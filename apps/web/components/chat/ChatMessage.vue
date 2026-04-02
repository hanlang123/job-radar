<script setup lang="ts">
/**
 * 单条聊天消息组件
 * Claude.ai 风格：无气泡、全宽、简洁排版
 */
import type { ChatMessage } from '@job-radar/shared'

const props = defineProps<{
  message: ChatMessage
  isStreaming?: boolean
}>()

const isUser = computed(() => props.message.role === 'user')
</script>

<template>
  <div class="chat-message" :class="{ 'is-user': isUser, 'is-assistant': !isUser }">
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
      <div class="message-content">
        <!-- 用户消息直接渲染文本 -->
        <div v-if="isUser" class="user-text">{{ message.content }}</div>
        <!-- AI 消息走流式 Markdown 渲染 -->
        <template v-else>
          <!-- 思考中指示器 -->
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
