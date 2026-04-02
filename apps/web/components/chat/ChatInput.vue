<script setup lang="ts">
/**
 * 聊天输入框组件
 * Claude.ai 风格：居中浮动卡片、简洁设计
 */

const emit = defineEmits<{
  send: [message: string]
  abort: []
}>()

const props = defineProps<{
  disabled?: boolean
  isStreaming?: boolean
}>()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

/** 发送消息 */
function handleSend() {
  const text = inputText.value.trim()
  if (!text || props.disabled) return
  emit('send', text)
  inputText.value = ''
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  })
}

/** 回车发送，Shift+回车换行 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

/** 自动调节 textarea 高度 */
function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 200) + 'px'
}
</script>

<template>
  <div class="chat-input-wrapper">
    <div class="chat-input">
      <div class="input-card">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          :disabled="disabled"
          placeholder="发送消息..."
          rows="1"
          class="input-textarea"
          @keydown="handleKeydown"
          @input="autoResize"
        />
        <div class="input-footer">
          <span class="input-hint">Enter 发送 · Shift+Enter 换行</span>
          <div class="input-actions">
            <button
              v-if="isStreaming"
              class="btn-stop"
              @click="emit('abort')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              停止
            </button>
            <button
              v-else
              class="btn-send"
              :disabled="!inputText.trim() || disabled"
              @click="handleSend"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-input-wrapper {
  flex-shrink: 0;
  padding: 0 24px 20px;
}

.chat-input {
  max-width: 768px;
  margin: 0 auto;
}

.input-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px 16px 8px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05);
  }
}

.input-textarea {
  width: 100%;
  resize: none;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 14px;
  line-height: 1.6;
  font-family: inherit;
  outline: none;
  max-height: 200px;
  color: var(--text-primary);

  &::placeholder {
    color: var(--text-placeholder);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.input-hint {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.6;
}

.input-actions {
  display: flex;
  gap: 8px;
}

.btn-send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: var(--primary-color);
  color: #0a0e1a;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: scale(1.05);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-secondary);
    cursor: not-allowed;
  }
}

.btn-stop {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-regular);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

@media (max-width: 768px) {
  .chat-input-wrapper {
    padding: 0 12px 12px;
  }

  .input-card {
    border-radius: 12px;
    padding: 10px 12px 6px;
  }

  .input-hint {
    display: none;
  }
}
</style>
