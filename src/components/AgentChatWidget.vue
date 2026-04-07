<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendAgentChat, type AgentAction } from '@/api/agent'
import {
  executeAgentActions,
  getAgentActionPendingMessages,
} from '@/utils/agentActionExecutor'
import { UserStore } from '@/stores/modules/user'
import { AudioStore } from '@/stores/modules/audio'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
type ChatRole = 'user' | 'assistant'
type ChatKind = 'normal' | 'status' | 'error'
type DragHandle = 'panel' | 'fab'
type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  kind?: ChatKind
}
type PersistedChatState = {
  sessionId: string
  messages: ChatMessage[]
}
const router = useRouter()
const userStore = UserStore()
const audioStore = AudioStore()
const { loadTrack, play } = useAudioPlayer()
const DEFAULT_GREETING = '你好，我可以帮你播放歌曲、打开常用页面，也可以查询通知和积分信息。'
const AGENT_STORAGE_PREFIX = 'vibe_music_agent_chat'
const MAX_HISTORY = 30
const isOpen = ref(false)
const inputMessage = ref('')
const sending = ref(false)
const requestErrorMessage = ref('')
const sessionId = ref('agent-session-' + Date.now())
const messages = ref<ChatMessage[]>([
  {
    id: 'assistant-' + Date.now(),
    role: 'assistant',
    content: DEFAULT_GREETING,
    kind: 'normal',
  },
])
const messageListRef = ref<HTMLElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)
const position = ref({ x: 0, y: 0 })
const positionReady = ref(false)
const isDragging = ref(false)
const dragMoved = ref(false)
const activeHandle = ref<DragHandle | null>(null)
const dragState = {
  pointerId: -1,
  offsetX: 0,
  offsetY: 0,
}
const isLoggedIn = computed(() =>
  Boolean(userStore.userInfo?.token && userStore.userInfo?.userId),
)
// 快捷标签改成“怎么说”的格式说明
const quickActions = computed<string[]>(() => {
  if (!isLoggedIn.value) {
    return ['播放歌曲 XXX', '搜索歌手 XXX', '打开页面 XXX']
  }
  return ['播放歌曲 XXX', '搜索歌单 XXX', '打开页面 XXX', '查询积分/通知']
})
const createMessage = (
  role: ChatRole,
  content: string,
  kind: ChatKind = 'normal',
): ChatMessage => ({
  id: role + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
  role,
  content,
  kind,
})
const getStorageKey = () => {
  const userId = userStore.userInfo?.userId ?? 'guest'
  return AGENT_STORAGE_PREFIX + '_' + userId
}
// 将聊天记录持久化到本地，避免刷新后丢失
const persistChatState = () => {
  try {
    const payload: PersistedChatState = {
      sessionId: sessionId.value,
      messages: messages.value.slice(-MAX_HISTORY),
    }
    localStorage.setItem(getStorageKey(), JSON.stringify(payload))
  } catch {
    // 本地存储失败时不影响主流程
  }
}
// 恢复本地聊天记录
const restoreChatState = () => {
  try {
    const raw = localStorage.getItem(getStorageKey())
    if (!raw) return
    const parsed = JSON.parse(raw) as PersistedChatState
    if (parsed.sessionId) {
      sessionId.value = parsed.sessionId
    }
    if (Array.isArray(parsed.messages) && parsed.messages.length) {
      messages.value = parsed.messages.slice(-MAX_HISTORY)
    }
  } catch {
    // 历史记录损坏时直接忽略
  }
}
// 滚动到底部，保证最新消息可见
const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}
// 计算面板尺寸，确保展开时不会超出视口
const getPanelSize = () => {
  return {
    width: Math.min(420, window.innerWidth - 24),
    height: Math.min(720, window.innerHeight - 24),
  }
}
// 限制组件位置，避免拖出屏幕
const clampPosition = (x: number, y: number) => {
  const margin = 12
  const fabWidth = 156
  const fabHeight = 92
  const panelSize = getPanelSize()
  const minX = isOpen.value
    ? Math.max(margin, panelSize.width + margin - fabWidth)
    : margin
  const minY = isOpen.value ? panelSize.height + 24 : margin
  const maxX = Math.max(margin, window.innerWidth - fabWidth - margin)
  const maxY = Math.max(margin, window.innerHeight - fabHeight - margin)
  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  }
}
// 初始化默认位置，保持在右下角附近
const setDefaultPosition = () => {
  const fabWidth = 156
  const fabHeight = 92
  const marginRight = 24
  const marginBottom = 112
  position.value = clampPosition(
    window.innerWidth - fabWidth - marginRight,
    window.innerHeight - fabHeight - marginBottom,
  )
  positionReady.value = true
}
// 窗口变化后修正位置
const refreshPosition = () => {
  if (!positionReady.value) {
    setDefaultPosition()
    return
  }
  position.value = clampPosition(position.value.x, position.value.y)
}
// 开始拖拽，让组件跟随鼠标移动
const startDrag = (event: PointerEvent, handle: DragHandle) => {
  if (event.button !== 0) return
  const currentTarget = event.currentTarget as HTMLElement | null
  const root = rootRef.value
  if (!currentTarget || !root) return
  const rootRect = root.getBoundingClientRect()
  isDragging.value = true
  dragMoved.value = false
  activeHandle.value = handle
  dragState.pointerId = event.pointerId
  dragState.offsetX = event.clientX - rootRect.left
  dragState.offsetY = event.clientY - rootRect.top
  currentTarget.setPointerCapture(event.pointerId)
  window.addEventListener('pointermove', onDragging)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}
const onDragging = (event: PointerEvent) => {
  if (!isDragging.value || event.pointerId !== dragState.pointerId) return
  dragMoved.value = true
  position.value = clampPosition(
    event.clientX - dragState.offsetX,
    event.clientY - dragState.offsetY,
  )
}
const stopDrag = (event: PointerEvent) => {
  if (event.pointerId !== dragState.pointerId) return
  isDragging.value = false
  dragState.pointerId = -1
  window.removeEventListener('pointermove', onDragging)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
  window.setTimeout(() => {
    dragMoved.value = false
    activeHandle.value = null
  }, 0)
}
const togglePanel = async () => {
  if (dragMoved.value) return
  isOpen.value = !isOpen.value
  await nextTick()
  refreshPosition()
  if (isOpen.value) {
    await scrollToBottom()
  }
}
const closePanel = async () => {
  isOpen.value = false
  await nextTick()
  refreshPosition()
}
// 追加消息并滚动到底部
const appendMessage = async (
  role: ChatRole,
  content: string,
  kind: ChatKind = 'normal',
) => {
  messages.value.push(createMessage(role, content, kind))
  persistChatState()
  await scrollToBottom()
}
// 展示动作执行前的状态提示
const appendPendingMessages = async (actions: AgentAction[] = []) => {
  const pendingMessages = getAgentActionPendingMessages(actions)
  for (const message of pendingMessages) {
    await appendMessage('assistant', message, 'status')
  }
}
const sendMessage = async () => {
  const content = inputMessage.value.trim()
  if (!content || sending.value) return
  requestErrorMessage.value = ''
  if (!isLoggedIn.value) {
    requestErrorMessage.value =
      '当前账号尚未登录，登录后才可以使用播放、跳转和查询等智能操作。'
    ElMessage.warning('请先登录后再使用智能助手')
    return
  }
  await appendMessage('user', content)
  inputMessage.value = ''
  try {
    sending.value = true
    const res = await sendAgentChat({
      message: content,
      sessionId: sessionId.value,
      userId: userStore.userInfo?.userId,
    })
    if (res.code !== 0 || !res.data) {
      throw new Error(res.message || '智能助手暂时不可用')
    }
    await appendMessage('assistant', res.data.reply || '好的')
    const actions = res.data.actions || []
    await appendPendingMessages(actions)
    const feedbackMessages = await executeAgentActions(actions, {
      router,
      audioStore,
      loadTrack,
      play,
    })
    for (const feedback of feedbackMessages) {
      await appendMessage(
        'assistant',
        feedback.message,
        feedback.status === 'error' ? 'error' : 'status',
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '当前请求失败了，请稍后再试。'
    requestErrorMessage.value = message
    await appendMessage('assistant', message, 'error')
  } finally {
    sending.value = false
  }
}
// 点击快捷标签后，直接把示例文本发给助手
const handleQuickAction = async (text: string) => {
  inputMessage.value = text
  await sendMessage()
}
const clearErrorState = () => {
  requestErrorMessage.value = ''
}
// 清空聊天记录，但保留欢迎语
const clearHistory = async () => {
  sessionId.value = 'agent-session-' + Date.now()
  requestErrorMessage.value = ''
  messages.value = [createMessage('assistant', DEFAULT_GREETING)]
  persistChatState()
  await scrollToBottom()
}
watch(
  () => messages.value,
  () => {
    persistChatState()
  },
  { deep: true },
)
watch(
  () => userStore.userInfo?.userId,
  () => {
    messages.value = [createMessage('assistant', DEFAULT_GREETING)]
    sessionId.value = 'agent-session-' + Date.now()
    requestErrorMessage.value = ''
    restoreChatState()
  },
)
onMounted(async () => {
  setDefaultPosition()
  restoreChatState()
  window.addEventListener('resize', refreshPosition)
  await nextTick()
  await scrollToBottom()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', refreshPosition)
  window.removeEventListener('pointermove', onDragging)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
})
</script>

<template>
  <div
    v-show="positionReady"
    ref="rootRef"
    class="agent-chat-root"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
    }"
  >
    <transition name="agent-fade">
      <div v-if="isOpen" class="agent-panel">
        <div class="agent-panel-header">
          <div
            class="agent-panel-title-wrap agent-drag-handle"
            :class="{ 'is-dragging': isDragging && activeHandle === 'panel' }"
            @pointerdown="startDrag($event, 'panel')"
          >
            <div class="agent-drag-indicator">
              <span />
              <span />
              <span />
            </div>
            <div>
              <p class="agent-panel-kicker">AI Music Assistant</p>
              <h3>智能助手</h3>
              <p class="agent-panel-desc">帮你播放歌曲、打开页面，也能快速处理常用操作。</p>
            </div>
          </div>
          <div class="agent-panel-actions">
            <el-button text class="agent-header-btn" @click.stop="clearHistory">
              清空记录
            </el-button>
            <el-button text class="agent-close-btn" @click.stop="closePanel">
              收起
            </el-button>
          </div>
        </div>

        <div v-if="!isLoggedIn" class="agent-state-card is-warning">
          <p class="agent-state-title">登录后可使用完整智能操作</p>
          <p class="agent-state-desc">
            当前可以先看看对话格式说明。登录后，助手才能真正帮你播放歌曲、打开页面和查询个人信息。
          </p>
        </div>

        <div v-else-if="requestErrorMessage" class="agent-state-card is-error">
          <div class="agent-state-row">
            <div>
              <p class="agent-state-title">这次请求没有成功</p>
              <p class="agent-state-desc">{{ requestErrorMessage }}</p>
            </div>
            <button class="agent-state-action" @click="clearErrorState">知道了</button>
          </div>
        </div>

        <div ref="messageListRef" class="agent-message-list">
          <div
            v-for="item in messages"
            :key="item.id"
            :class="[
              'agent-message-item',
              item.role === 'user' ? 'is-user' : 'is-assistant',
            ]"
          >
            <div
              :class="[
                'agent-message-bubble',
                item.kind === 'status' ? 'is-status' : '',
                item.kind === 'error' ? 'is-error' : '',
              ]"
            >
              {{ item.content }}
            </div>
          </div>

          <div v-if="sending" class="agent-message-item is-assistant">
            <div class="agent-message-bubble is-status is-thinking">
              <span class="agent-thinking-dot" />
              <span class="agent-thinking-dot" />
              <span class="agent-thinking-dot" />
              <span>正在理解你的需求...</span>
            </div>
          </div>
        </div>

        <div class="agent-bottom-area">
          <div class="agent-quick-actions">
            <button
              v-for="item in quickActions"
              :key="item"
              class="agent-quick-btn"
              :disabled="sending"
              @click="handleQuickAction(item)"
            >
              {{ item }}
            </button>
          </div>

          <div class="agent-input-area">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="3"
              resize="none"
              :disabled="sending"
              placeholder="例如：播放歌曲 晴天，搜索歌手 周杰伦，或打开页面 积分中心"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <div class="agent-input-footer">
              <span class="agent-input-tip">按 Enter 发送，Shift + Enter 换行</span>
              <el-button
                type="primary"
                :loading="sending"
                class="agent-send-btn"
                @click="sendMessage"
              >
                发送
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <button
      class="agent-fab"
      @pointerdown="startDrag($event, 'fab')"
      @click="togglePanel"
    >
      <span class="agent-fab-icon">AI</span>
      <div class="agent-fab-content">
        <span class="agent-fab-title">AI 助手</span>
        <span class="agent-fab-subtitle">
          {{ isOpen ? '点击收起，按住可拖动' : '点击展开，按住可拖动' }}
        </span>
      </div>
    </button>
  </div>
</template>

<style scoped>
.agent-chat-root {
  position: fixed;
  z-index: 1200;
  width: 156px;
}

.agent-panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 12px);
  width: min(420px, calc(100vw - 24px));
  max-height: min(78vh, 720px);
  display: flex;
  flex-direction: column;
  border-radius: 26px;
  overflow: hidden;
  border: 1px solid rgba(121, 139, 255, 0.18);
  box-shadow: 0 22px 60px rgba(72, 84, 150, 0.16);
  min-height: 0;
}

html.light .agent-panel {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 255, 0.97) 100%);
  backdrop-filter: blur(24px);
}

html.dark .agent-panel {
  background:
    linear-gradient(180deg, rgba(29, 35, 55, 0.98) 0%, rgba(34, 40, 63, 0.98) 100%);
  backdrop-filter: blur(24px);
}

.agent-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(121, 139, 255, 0.12);
  user-select: none;
}

.agent-panel-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.agent-panel-title-wrap {
  display: flex;
  gap: 12px;
}

.agent-drag-handle {
  cursor: default;
  user-select: none;
  touch-action: none;
}

.agent-drag-indicator {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 6px;
}

.agent-drag-indicator span {
  width: 18px;
  height: 3px;
  border-radius: 999px;
  background: rgba(110, 125, 220, 0.42);
}

.agent-panel-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6d7bd8;
  font-weight: 700;
}

.agent-panel-header h3 {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  color: #26314e;
}

.agent-panel-desc {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #7f8daf;
}

.agent-close-btn {
  color: #6b7899;
}

.agent-header-btn {
  color: #7b88ad;
}

.agent-state-card {
  margin: 14px 16px 0;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(121, 139, 255, 0.12);
}

.agent-state-card.is-warning {
  background: rgba(255, 247, 231, 0.88);
  border-color: rgba(255, 193, 93, 0.28);
}

.agent-state-card.is-error {
  background: rgba(255, 242, 244, 0.92);
  border-color: rgba(244, 120, 135, 0.22);
}

.agent-state-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.agent-state-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #31405f;
}

.agent-state-desc {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #6e7c9d;
}

.agent-state-action {
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: #6273e6;
  font-size: 12px;
}

.agent-message-list {
  flex: 1;
   min-height: 0;
  min-height: 180px;
  overflow-y: auto;
  padding: 16px 16px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.agent-bottom-area {
  flex-shrink: 0;
  padding-top: 10px;
  border-top: 1px solid rgba(121, 139, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(247, 249, 255, 0.96));
  backdrop-filter: blur(18px);
}

.agent-message-item {
  display: flex;
}

.agent-message-item.is-user {
  justify-content: flex-end;
}

.agent-message-item.is-assistant {
  justify-content: flex-start;
}

.agent-message-bubble {
  max-width: 82%;
  padding: 12px 14px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

html.light .agent-message-item.is-user .agent-message-bubble {
  background: linear-gradient(135deg, #5c70f2 0%, #8a63f8 100%);
  color: #fff;
  box-shadow: 0 12px 28px rgba(92, 112, 242, 0.2);
}

html.light .agent-message-item.is-assistant .agent-message-bubble {
  background: rgba(242, 245, 255, 0.96);
  color: #34415f;
}

.agent-message-bubble.is-status {
  background: rgba(239, 244, 255, 0.98) !important;
  color: #5370d8 !important;
  border: 1px solid rgba(112, 132, 231, 0.14);
}

.agent-message-bubble.is-error {
  background: rgba(255, 242, 244, 0.95) !important;
  color: #c44a61 !important;
  border: 1px solid rgba(244, 120, 135, 0.18);
}

.agent-message-bubble.is-thinking {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.agent-thinking-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.35;
  animation: agent-dot-pulse 1.2s infinite ease-in-out;
}

.agent-thinking-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.agent-thinking-dot:nth-child(3) {
  animation-delay: 0.3s;
}

html.dark .agent-message-item.is-user .agent-message-bubble {
  background: linear-gradient(135deg, #5c70f2 0%, #8a63f8 100%);
  color: #fff;
  box-shadow: 0 12px 28px rgba(92, 112, 242, 0.18);
}

html.dark .agent-message-item.is-assistant .agent-message-bubble {
  background: rgba(39, 46, 72, 0.96);
  color: #d8e1fb;
}

.agent-quick-actions {
  padding: 0 16px 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.agent-quick-btn {
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(121, 139, 255, 0.14);
  font-size: 12px;
  line-height: 1.4;
  background: rgba(241, 244, 255, 0.95);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.agent-quick-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(92, 112, 242, 0.28);
  box-shadow: 0 10px 20px rgba(92, 112, 242, 0.12);
}

.agent-quick-btn:disabled {
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.agent-input-area {
  padding: 0 16px 16px;
}

:deep(.agent-input-area .el-textarea__inner) {
  border-radius: 20px;
  padding: 16px 18px;
  min-height: 112px;
  box-shadow: none;
}

html.light :deep(.agent-input-area .el-textarea__inner) {
  background: rgba(255, 255, 255, 0.98);
  border-color: rgba(125, 140, 220, 0.22);
}

html.dark :deep(.agent-input-area .el-textarea__inner) {
  background: rgba(26, 31, 49, 0.95);
  border-color: rgba(140, 157, 236, 0.18);
  color: #eef2ff;
}

.agent-input-footer {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.agent-input-tip {
  font-size: 12px;
  color: #8090b3;
}

.agent-send-btn {
  min-width: 96px;
  height: 44px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #5c70f2 0%, #8a63f8 100%);
  box-shadow: 0 12px 26px rgba(92, 112, 242, 0.24);
}

.agent-fab {
  width: 156px;
  min-height: 92px;
  margin-left: auto;
  padding: 14px 16px;
  border-radius: 24px;
  border: 1px solid rgba(121, 139, 255, 0.16);
  background: linear-gradient(135deg, #5c70f2 0%, #8a63f8 100%);
  color: #fff;
  box-shadow: 0 18px 38px rgba(92, 112, 242, 0.28);
  text-align: left;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: default;
  user-select: none;
  touch-action: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.agent-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 44px rgba(92, 112, 242, 0.32);
}

.agent-fab-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  color: #fefeff;
  background: rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.agent-fab-content {
  flex: 1;
}

.agent-fab-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}

.agent-fab-subtitle {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.45;
  opacity: 0.94;
}

.agent-fade-enter-active,
.agent-fade-leave-active {
  transition: all 0.22s ease;
}

.agent-fade-enter-from,
.agent-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

html.dark .agent-panel-header h3 {
  color: #eef2ff;
}

html.dark .agent-panel-desc,
html.dark .agent-input-tip,
html.dark .agent-header-btn,
html.dark .agent-close-btn,
html.dark .agent-state-desc {
  color: #a8b5d8;
}

html.dark .agent-state-title {
  color: #eef2ff;
}

html.dark .agent-state-card.is-warning {
  background: rgba(67, 52, 22, 0.56);
}

html.dark .agent-state-card.is-error {
  background: rgba(78, 35, 45, 0.62);
}

html.dark .agent-quick-btn {
  background: rgba(39, 46, 72, 0.96);
  box-shadow: none;
  color: #cbd6ff;
}

html.dark .agent-bottom-area {
  background:
    linear-gradient(180deg, rgba(28, 34, 53, 0.82), rgba(29, 35, 55, 0.96));
  border-top-color: rgba(140, 157, 236, 0.14);
}

@keyframes agent-dot-pulse {
  0%,
  80%,
  100% {
    transform: scale(0.7);
    opacity: 0.3;
  }

  40% {
    transform: scale(1);
    opacity: 0.95;
  }
}

@media (max-width: 768px) {
  .agent-chat-root {
    width: 146px;
  }

  .agent-message-list {
    min-height: 160px;
    padding-bottom: 18px;
  }

  .agent-panel {
    width: min(360px, calc(100vw - 20px));
    max-height: min(76vh, 640px);
  }

  .agent-fab {
    width: 146px;
    min-height: 86px;
  }
}
</style>




