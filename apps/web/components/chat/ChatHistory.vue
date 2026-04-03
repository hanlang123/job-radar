<script setup lang="ts">
/**
 * 聊天历史侧边栏组件
 * 展示历史会话列表，支持切换、删除、重命名
 */
import type { ChatSessionListItem } from '@job-radar/shared'

const props = defineProps<{
  /** 当前激活的会话 ID */
  activeSessionId?: string
}>()

const emit = defineEmits<{
  /** 选中一个历史会话 */
  select: [session: ChatSessionListItem]
  /** 点击新建会话 */
  newChat: []
}>()

const { sessions, loading, fetchSessions, deleteSession, renameSession } = useChatHistory()

/** 正在编辑标题的会话 ID */
const editingId = ref<string | null>(null)
/** 编辑中的标题 */
const editingTitle = ref('')

/** 加载会话列表 */
onMounted(() => {
  fetchSessions()
})

/** 场景中文标签映射 */
const sceneLabels: Record<string, string> = {
  general: '通用',
  'jd-analysis': 'JD分析',
  'skill-match': '技能匹配',
  'interview-mock': '模拟面试',
}

/** 格式化时间 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 7) return `${diffDay}天前`

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

/** 选中会话 */
function handleSelect(session: ChatSessionListItem) {
  if (editingId.value) return
  emit('select', session)
}

/** 开始编辑标题 */
function startEdit(session: ChatSessionListItem, event: Event) {
  event.stopPropagation()
  editingId.value = session.id
  editingTitle.value = session.title || ''
}

/** 保存标题 */
async function saveEdit() {
  if (!editingId.value) return
  const trimmed = editingTitle.value.trim()
  if (trimmed) {
    await renameSession(editingId.value, trimmed)
  }
  editingId.value = null
  editingTitle.value = ''
}

/** 取消编辑 */
function cancelEdit() {
  editingId.value = null
  editingTitle.value = ''
}

/** 删除会话 */
async function handleDelete(session: ChatSessionListItem, event: Event) {
  event.stopPropagation()
  const confirmed = await ElMessageBox.confirm(
    '确定要删除这个会话吗？删除后无法恢复。',
    '删除会话',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
  ).catch(() => false)

  if (confirmed) {
    const success = await deleteSession(session.id)
    if (success) {
      ElMessage.success('会话已删除')
      // 如果删除的是当前激活的会话，触发新建
      if (props.activeSessionId === session.id) {
        emit('newChat')
      }
    } else {
      ElMessage.error('删除失败，请重试')
    }
  }
}

/** 刷新列表 */
function refresh() {
  fetchSessions()
}

defineExpose({ refresh })
</script>

<template>
  <div class="chat-history">
    <!-- 顶部操作栏 -->
    <div class="history-header">
      <span class="history-title">历史会话</span>
      <button class="btn-new-chat" title="新建会话" @click="emit('newChat')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>

    <!-- 会话列表 -->
    <div class="history-list">
      <div v-if="loading" class="history-loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="sessions.length === 0" class="history-empty">
        <p>暂无历史会话</p>
        <p class="history-empty-hint">开始一段新对话吧</p>
      </div>

      <div
        v-for="session in sessions"
        v-else
        :key="session.id"
        class="session-item"
        :class="{ active: activeSessionId === session.id }"
        @click="handleSelect(session)"
      >
        <!-- 正常显示模式 -->
        <template v-if="editingId !== session.id">
          <div class="session-content">
            <div class="session-title-row">
              <span class="session-title">{{ session.title || '未命名会话' }}</span>
            </div>
            <div class="session-meta">
              <span class="session-scene">{{ sceneLabels[session.scene] || session.scene }}</span>
              <span class="session-time">{{ formatTime(session.updatedAt) }}</span>
            </div>
          </div>
          <div class="session-actions">
            <button class="btn-action" title="重命名" @click="startEdit(session, $event)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button class="btn-action btn-delete" title="删除" @click="handleDelete(session, $event)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </template>

        <!-- 编辑模式 -->
        <template v-else>
          <div class="session-edit">
            <input
              v-model="editingTitle"
              class="edit-input"
              maxlength="100"
              autofocus
              @keydown.enter="saveEdit"
              @keydown.escape="cancelEdit"
              @blur="saveEdit"
              @click.stop
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-history {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(255, 255, 255, 0.02);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-new-chat {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: transparent;
  color: var(--text-regular);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 224, 255, 0.1);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-loading {
  padding: 12px;
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;

  .history-empty-hint {
    margin-top: 4px;
    font-size: 12px;
    opacity: 0.6;
  }
}

.session-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  gap: 8px;
  margin-bottom: 2px;

  &:hover {
    background: rgba(255, 255, 255, 0.06);

    .session-actions {
      opacity: 1;
    }
  }

  &.active {
    background: rgba(0, 224, 255, 0.08);
    border: 1px solid rgba(0, 224, 255, 0.15);

    .session-title {
      color: var(--primary-color);
    }

    .session-actions {
      opacity: 1;
    }
  }

  &:not(.active) {
    border: 1px solid transparent;
  }
}

.session-content {
  flex: 1;
  min-width: 0;
}

.session-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.session-title {
  font-size: 13px;
  color: var(--text-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.session-scene {
  font-size: 11px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 6px;
  border-radius: 4px;
}

.session-time {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.7;
}

.session-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }

  &.btn-delete:hover {
    background: rgba(255, 51, 102, 0.15);
    color: var(--danger-color);
  }
}

.session-edit {
  flex: 1;
}

.edit-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--primary-color);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  outline: none;

  &:focus {
    box-shadow: 0 0 0 1px rgba(0, 224, 255, 0.2);
  }
}

@media (max-width: 768px) {
  .chat-history {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
}
</style>
