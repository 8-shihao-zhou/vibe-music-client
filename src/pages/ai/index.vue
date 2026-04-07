<template>
  <div class="ai-page-container">
    <section class="ai-hero">
      <div class="ai-hero-copy">
        <p class="ai-hero-kicker">AI Musicadmin Studio</p>
        <h2>AI 音乐视频创作</h2>
        <p class="subtitle">
          仅支持从曲库选择站内歌曲发起 MV 生成任务。任务提交后会在后台异步执行，刷新页面或切换界面也不会丢失状态。
        </p>
      </div>

      <div class="ai-hero-stats">
        <div class="hero-stat-card">
          <span class="hero-stat-label">作品总数</span>
          <strong>{{ historyList.length }}</strong>
        </div>
        <div class="hero-stat-card">
          <span class="hero-stat-label">进行中任务</span>
          <strong>{{ activeTaskCount }}</strong>
        </div>
        <div class="hero-stat-card">
          <span class="hero-stat-label">任务总数</span>
          <strong>{{ taskList.length }}</strong>
        </div>
      </div>

      <div class="ai-hero-glow ai-hero-glow-a" />
      <div class="ai-hero-glow ai-hero-glow-b" />
    </section>

    <div class="content-wrapper">
      <div class="left-panel">
        <el-card class="vibe-card create-card" shadow="hover">
          <template #header>
            <div class="card-header card-header-rich">
              <div>
                <p class="card-kicker">Create</p>
                <span class="card-title">发起新的 MV 任务</span>
              </div>
              <span class="card-tip">仅可从曲库进入</span>
            </div>
          </template>

          <div class="create-panel-body">
            <div v-if="!isLoggedIn" class="state-panel">
              <el-empty description="登录后即可创建 AI MV 任务">
                <el-button type="primary" @click="handleLogin">立即登录</el-button>
              </el-empty>
            </div>

            <template v-else>
              <div v-if="selectedSongInfo" class="selected-song-card">
                <div class="selected-song-head">
                  <div class="selected-song-icon">
                    <el-icon><Headset /></el-icon>
                  </div>
                  <div class="selected-song-meta">
                    <p class="selected-song-label">当前已选歌曲</p>
                    <h3>{{ selectedSongInfo }}</h3>
                    <span>将基于该歌曲音频异步生成 MV，可提交后离开当前页面。</span>
                  </div>
                </div>

                <div class="style-panel">
                  <div class="style-panel-header">
                    <p class="style-panel-label">生成风格</p>
                    <span class="style-panel-tip">当前选择：{{ selectedStyleLabel }}</span>
                  </div>
                  <div class="style-chip-list">
                    <button
                      v-for="style in styleOptions"
                      :key="style.code"
                      type="button"
                      class="style-chip"
                      :class="{ active: selectedStyleCode === style.code }"
                      @click="selectedStyleCode = style.code"
                    >
                      <strong>{{ style.label }}</strong>
                      <span>{{ style.description }}</span>
                    </button>
                  </div>
                </div>

                <div class="selected-song-actions">
                  <el-button
                    type="primary"
                    size="large"
                    :loading="submitting"
                    class="generate-btn"
                    @click="handleCreateTask"
                  >
                    <icon-ri:magic-line class="mr-2" />
                    提交生成任务
                  </el-button>
                  <el-button size="large" class="cancel-btn" @click="clearSelection">
                    清空选择
                  </el-button>
                </div>
              </div>

              <div v-else class="state-panel select-tip-panel">
                <div class="tip-badge">
                  <el-icon><Opportunity /></el-icon>
                  <span>创作方式已收紧</span>
                </div>
                <h3>请从曲库页面选择歌曲后再进入此处</h3>
                <p>
                  为了保证平台音频版权合规，AI 创作页不再支持本地上传或拖拽音频，只允许通过曲库歌曲的“创作 MV”入口发起任务。
                </p>
                <el-button type="primary" plain @click="router.push('/library')">
                  前往曲库
                </el-button>
              </div>

              <div class="task-section">
                <div class="task-header">
                  <div>
                    <p class="card-kicker">Tasks</p>
                    <h3>任务状态</h3>
                  </div>
                  <el-button link type="primary" :icon="Refresh" @click="fetchTaskList">
                    刷新任务
                  </el-button>
                </div>

                <div v-if="taskList.length === 0" class="task-empty">
                  <el-empty description="还没有提交过 AI MV 任务" />
                </div>

                <div v-else class="task-list">
                  <div
                    v-for="task in taskList"
                    :key="task.id"
                    class="task-card"
                    :class="`status-${(task.status || '').toLowerCase()}`"
                  >
                    <div class="task-main">
                      <div class="task-title-row">
                        <div class="task-title-info">
                          <h4>{{ task.songName }}<span v-if="task.artistName"> · {{ task.artistName }}</span></h4>
                          <p>{{ task.statusText || getStatusLabel(task.status) }}</p>
                        </div>
                        <span class="status-badge" :class="`badge-${(task.status || '').toLowerCase()}`">
                          {{ getStatusLabel(task.status) }}
                        </span>
                      </div>

                      <div class="task-meta">
                        <span>提交时间：{{ task.createTime || '--' }}</span>
                        <span v-if="task.finishTime">完成时间：{{ task.finishTime }}</span>
                      </div>

                      <div v-if="task.status === 'FAILED' && task.errorMessage" class="task-error">
                        {{ task.errorMessage }}
                      </div>
                    </div>

                    <div class="task-side">
                      <div class="task-actions">
                        <span class="task-side-tip">
                          {{ getTaskSideTip(task.status) }}
                        </span>
                        <el-button
                          circle
                          plain
                          class="task-delete-btn"
                          :icon="Delete"
                          title="????"
                          @click="handleDeleteTask(task)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </el-card>
      </div>

      <div class="right-panel">
        <el-card class="vibe-card history-card" shadow="hover">
          <template #header>
            <div class="card-header card-header-rich">
              <div>
                <p class="card-kicker">Library</p>
                <span class="card-title">我的作品库</span>
              </div>
              <el-button
                v-if="isLoggedIn"
                link
                type="primary"
                :icon="Refresh"
                @click="fetchHistory"
              >
                刷新作品
              </el-button>
            </div>
          </template>

          <div class="history-list">
            <el-empty
              v-if="!isLoggedIn"
              description="请先登录后查看你的作品"
            >
              <el-button type="primary" @click="handleLogin">立即登录</el-button>
            </el-empty>

            <el-empty
              v-else-if="historyList.length === 0"
              description="暂时还没有生成完成的 MV 作品"
            />

            <div
              v-else
              v-for="(item, index) in historyList"
              :key="index"
              class="history-item"
              @click="playVideo(item)"
            >
              <div class="item-icon">
                <el-icon><VideoPlay /></el-icon>
              </div>
              <div class="item-info">
                <div class="item-name">{{ item.mvName || item.fileName }}</div>
                <div class="item-meta">{{ item.createTime }} · {{ item.size }}</div>
              </div>
              <div class="item-actions">
                <el-button
                  circle
                  :icon="Edit"
                  @click.stop="openEditDialog(item)"
                  title="编辑名称"
                />
                <el-button
                  circle
                  :icon="Download"
                  @click.stop="downloadVideo(item)"
                  title="下载作品"
                />
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="作品预览"
      width="800px"
      align-center
      destroy-on-close
    >
      <video
        v-if="currentVideoUrl"
        :src="currentVideoUrl"
        controls
        autoplay
        width="100%"
        style="border-radius: 8px; background: #000; max-height: 60vh"
      />
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑 MV 名称"
      width="500px"
      align-center
    >
      <el-form label-width="80px">
        <el-form-item label="MV名称">
          <el-input
            v-model="newMvName"
            placeholder="请输入 MV 名称，不需要手动输入 .mp4"
            maxlength="100"
            show-word-limit
            @keyup.enter="saveMvName"
          />
          <div class="rename-tip">系统会自动保留视频文件后缀，你只需要填写展示名称即可。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMvName">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Delete,
  Download,
  Edit,
  Headset,
  Opportunity,
  Refresh,
  VideoPlay,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  type AiHistoryItem,
  type AiVideoTaskItem,
  createVideoTaskApi,
  deleteVideoTaskApi,
  getHistoryApi,
  getVideoTaskListApi,
  renameMvFileApi,
} from '@/api/ai'
import { UserStore } from '@/stores/modules/user'

const route = useRoute()
const router = useRouter()
const userStore = UserStore()

const submitting = ref(false)
const historyList = ref<AiHistoryItem[]>([])
const taskList = ref<AiVideoTaskItem[]>([])
const dialogVisible = ref(false)
const currentVideoUrl = ref('')
const selectedSongInfo = ref('')
const selectedSongName = ref('')
const selectedArtistName = ref('')
const selectedAudioUrl = ref('')
const selectedStyleCode = ref('healing')
const editDialogVisible = ref(false)
const editingMv = ref<AiHistoryItem | null>(null)
const newMvName = ref('')

const styleOptions = [
  { code: 'healing', label: '梦幻治愈', description: '柔和光影、轻盈氛围' },
  { code: 'cyberpunk', label: '赛博霓虹', description: '霓虹夜景、未来感画面' },
  { code: 'ink', label: '国风水墨', description: '山水留白、东方意境' },
  { code: 'campus', label: '清新校园', description: '明亮自然、青春氛围' },
  { code: 'cinematic', label: '电影氛围', description: '强叙事感、镜头氛围' },
  { code: 'stage', label: '舞台热力', description: '灯光节奏、现场能量' },
] as const

let pollTimer: number | null = null
const taskStatusCache = new Map<number, string>()

const isLoggedIn = computed(() => userStore.isLoggedIn && !!userStore.userInfo?.token)
const activeTaskCount = computed(() =>
  taskList.value.filter(task => task.status === 'QUEUED' || task.status === 'PROCESSING').length,
)
const selectedStyleLabel = computed(
  () => styleOptions.find(item => item.code === selectedStyleCode.value)?.label || '梦幻治愈',
)

const handleLogin = () => {
  ElMessage.info('请点击右上角登录后再使用 AI 创作功能')
}

// 从曲库跳转时读取歌曲信息
const syncSongSelectionFromRoute = () => {
  const audioUrl = typeof route.query.audioUrl === 'string' ? route.query.audioUrl : ''
  const songName = typeof route.query.songName === 'string' ? route.query.songName : ''
  const artistName = typeof route.query.artistName === 'string' ? route.query.artistName : ''

  if (!audioUrl || !songName) {
    return
  }

  const nextInfo = artistName ? `${songName} - ${artistName}` : songName
  const hasChanged =
    selectedAudioUrl.value !== audioUrl ||
    selectedSongName.value !== songName ||
    selectedArtistName.value !== artistName

  selectedAudioUrl.value = audioUrl
  selectedSongName.value = songName
  selectedArtistName.value = artistName
  selectedSongInfo.value = nextInfo

  if (hasChanged) {
    ElMessage.success(`已选择歌曲：${nextInfo}`)
  }
}

const clearSelection = () => {
  selectedSongInfo.value = ''
  selectedSongName.value = ''
  selectedArtistName.value = ''
  selectedAudioUrl.value = ''
}

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'QUEUED':
      return '排队中'
    case 'PROCESSING':
      return '生成中'
    case 'SUCCESS':
      return '已完成'
    case 'FAILED':
      return '失败'
    default:
      return '未知'
  }
}

const getTaskSideTip = (status?: string) => {
  if (status === 'PROCESSING') {
    return '后台生成中'
  }
  if (status === 'QUEUED') {
    return '等待执行'
  }
  if (status === 'SUCCESS') {
    return '请到作品库查看成片'
  }
  return '请稍后重试'
}

const fetchHistory = async () => {
  if (!isLoggedIn.value) {
    historyList.value = []
    return
  }

  try {
    const res = await getHistoryApi()
    if (res.code === 0) {
      historyList.value = res.data || []
    }
  } catch (error) {
    console.error('获取作品库失败', error)
  }
}

const notifyTaskStatusChange = (task: AiVideoTaskItem) => {
  const previousStatus = taskStatusCache.get(task.id)
  taskStatusCache.set(task.id, task.status)

  if (!previousStatus || previousStatus === task.status) {
    return
  }

  if (task.status === 'SUCCESS') {
    ElMessage.success(`${task.songName} 的 MV 已生成完成`)
  } else if (task.status === 'FAILED') {
    ElMessage.error(`${task.songName} 的 MV 生成失败`)
  }
}

const fetchTaskList = async () => {
  if (!isLoggedIn.value) {
    taskList.value = []
    stopTaskPolling()
    return
  }

  try {
    const res = await getVideoTaskListApi()
    if (res.code === 0) {
      taskList.value = res.data || []
      taskList.value.forEach(notifyTaskStatusChange)

      const shouldPolling = taskList.value.some(
        task => task.status === 'QUEUED' || task.status === 'PROCESSING',
      )

      if (shouldPolling) {
        startTaskPolling()
      } else {
        stopTaskPolling()
      }
    }
  } catch (error) {
    console.error('获取任务列表失败', error)
  }
}

const fetchAiData = async () => {
  await Promise.all([fetchTaskList(), fetchHistory()])
}

const startTaskPolling = () => {
  if (pollTimer) {
    return
  }

  pollTimer = window.setInterval(async () => {
    await Promise.all([fetchTaskList(), fetchHistory()])
  }, 8000)
}

const stopTaskPolling = () => {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

const handleDeleteTask = async (task: AiVideoTaskItem) => {
  try {
    await ElMessageBox.confirm(
      `确定删除任务“${task.songName}${task.artistName ? ` - ${task.artistName}` : ''}”吗？`,
      '删除任务',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    const res = await deleteVideoTaskApi(task.id)
    if (res.code === 0) {
      taskStatusCache.delete(task.id)
      ElMessage.success('任务已删除')
      await fetchTaskList()
      return
    }

    ElMessage.error(res.message || '删除任务失败')
  } catch (error: any) {
    if (error === 'cancel' || error === 'close' || error?.message === 'cancel') {
      return
    }
    console.error('删除任务失败', error)
    ElMessage.error('删除任务失败')
  }
}

const handleCreateTask = async () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录')
    return
  }

  if (!selectedAudioUrl.value || !selectedSongName.value) {
    ElMessage.warning('请先从曲库选择歌曲')
    return
  }

  submitting.value = true
  try {
    const res = await createVideoTaskApi({
      songName: selectedSongName.value,
      artistName: selectedArtistName.value,
      audioUrl: selectedAudioUrl.value,
      styleCode: selectedStyleCode.value,
      styleLabel: selectedStyleLabel.value,
    })

    if (res.code === 0) {
      ElMessage.success('任务已提交，后台开始生成，你可以先去处理其他事情')
      clearSelection()
      await fetchTaskList()
    } else {
      ElMessage.error(res.message || '任务提交失败')
    }
  } catch (error) {
    console.error('创建任务失败', error)
    ElMessage.error('任务提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

const playVideo = (item: AiHistoryItem) => {
  currentVideoUrl.value = item.url
  dialogVisible.value = true
}

const previewTaskVideo = (task: AiVideoTaskItem) => {
  if (!task.mvUrl) {
    return
  }
  currentVideoUrl.value = task.mvUrl
  dialogVisible.value = true
}

const downloadVideo = (item: AiHistoryItem) => {
  const link = document.createElement('a')
  link.href = item.url
  link.setAttribute('download', item.fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const openEditDialog = (item: AiHistoryItem) => {
  editingMv.value = item
  let name = item.mvName || item.fileName
  if (name.toLowerCase().endsWith('.mp4')) {
    name = name.substring(0, name.length - 4)
  }
  newMvName.value = name
  editDialogVisible.value = true
}

const saveMvName = async () => {
  if (!editingMv.value) {
    return
  }
  if (!newMvName.value.trim()) {
    ElMessage.warning('MV 名称不能为空')
    return
  }

  try {
    const res = await renameMvFileApi(editingMv.value.fileName, newMvName.value.trim())
    if (res.code === 0) {
      ElMessage.success('重命名成功')
      editDialogVisible.value = false
      await fetchHistory()
    } else {
      ElMessage.error(res.message || '重命名失败')
    }
  } catch (error) {
    console.error('重命名作品失败', error)
    ElMessage.error('重命名失败')
  }
}

watch(
  () => route.query,
  () => {
    syncSongSelectionFromRoute()
  },
  { immediate: true },
)

watch(
  () => userStore.userInfo?.userId,
  async (newUserId, oldUserId) => {
    if (newUserId === oldUserId) {
      return
    }

    historyList.value = []
    taskList.value = []
    taskStatusCache.clear()

    if (isLoggedIn.value) {
      await fetchAiData()
    } else {
      stopTaskPolling()
    }
  },
)

onMounted(async () => {
  if (isLoggedIn.value) {
    await fetchAiData()
  }
})

onUnmounted(() => {
  stopTaskPolling()
})
</script>

<style scoped>
.ai-page-container {
  min-height: 100%;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow-y: auto;
}

html.light .ai-page-container {
  background:
    radial-gradient(circle at top left, rgba(99, 120, 255, 0.12) 0%, transparent 34%),
    linear-gradient(180deg, rgba(245, 247, 255, 0.96) 0%, rgba(250, 251, 255, 0.94) 100%);
}

html.dark .ai-page-container {
  background:
    radial-gradient(circle at top left, rgba(99, 120, 255, 0.14) 0%, transparent 34%),
    linear-gradient(180deg, rgba(20, 24, 38, 0.96) 0%, rgba(24, 30, 48, 0.94) 100%);
}

.ai-hero {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  padding: 28px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  min-height: 220px;
}

html.light .ai-hero {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 36%),
    linear-gradient(135deg, rgba(73, 95, 244, 0.96) 0%, rgba(118, 75, 162, 0.92) 54%, rgba(10, 157, 140, 0.88) 100%);
  box-shadow: 0 24px 60px rgba(80, 89, 160, 0.16);
}

html.dark .ai-hero {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 36%),
    linear-gradient(135deg, rgba(53, 72, 184, 0.96) 0%, rgba(87, 60, 146, 0.94) 54%, rgba(9, 98, 109, 0.9) 100%);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.ai-hero-copy,
.ai-hero-stats {
  position: relative;
  z-index: 1;
}

.ai-hero-copy {
  max-width: 680px;
}

.ai-hero-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.78);
}

.ai-hero h2 {
  margin: 0 0 12px;
  font-size: clamp(30px, 4vw, 42px);
  font-weight: 700;
  color: #fff;
}

.subtitle {
  margin: 0;
  font-size: 16px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.82);
}

.ai-hero-stats {
  display: flex;
  gap: 12px;
}

.hero-stat-card {
  min-width: 128px;
  padding: 16px 18px;
  border-radius: 20px;
  backdrop-filter: blur(18px);
}

html.light .hero-stat-card {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

html.dark .hero-stat-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-stat-label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.74);
}

.hero-stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
  line-height: 1.1;
  color: #fff;
}

.ai-hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(8px);
}

.ai-hero-glow-a {
  right: 72px;
  top: -28px;
  width: 180px;
  height: 180px;
  background: rgba(255, 255, 255, 0.12);
}

.ai-hero-glow-b {
  right: -16px;
  bottom: -28px;
  width: 220px;
  height: 220px;
  background: rgba(255, 255, 255, 0.08);
}

.content-wrapper {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 700px;
  align-items: stretch;
}

.left-panel,
.right-panel {
  flex: 1;
  flex-basis: 0;
  min-width: 0;
  display: flex;
}

.vibe-card {
  width: 100%;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(20px);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.create-card,
.history-card {
  height: clamp(760px, calc(100vh - 180px), 980px);
}

.vibe-card:hover {
  transform: translateY(-3px);
}

html.light .vibe-card {
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(118, 134, 220, 0.14);
}

html.dark .vibe-card {
  background: rgba(28, 34, 54, 0.88);
  border: 1px solid rgba(118, 134, 220, 0.16);
}

:deep(.el-card__header) {
  border-bottom: 1px solid rgba(102, 126, 234, 0.08);
  padding: 20px 24px;
}

:deep(.el-card__body) {
  flex: 1;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header-rich {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6d7bd8;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
}

.card-tip {
  font-size: 12px;
  color: #8b97b7;
}

.create-panel-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.state-panel,
.selected-song-card,
.task-card {
  border-radius: 22px;
}

html.light .state-panel,
html.light .selected-song-card,
html.light .task-card {
  background: linear-gradient(135deg, rgba(247, 248, 255, 0.98) 0%, rgba(255, 255, 255, 0.96) 100%);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

html.dark .state-panel,
html.dark .selected-song-card,
html.dark .task-card {
  background: linear-gradient(135deg, rgba(39, 46, 72, 0.9) 0%, rgba(31, 37, 58, 0.92) 100%);
  border: 1px solid rgba(102, 126, 234, 0.14);
}

.state-panel {
  min-height: 220px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.select-tip-panel h3 {
  margin: 16px 0 10px;
  font-size: 24px;
}

.select-tip-panel p {
  max-width: 520px;
  line-height: 1.8;
  color: #7b86a8;
  margin: 0 0 20px;
}

.tip-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  color: #5d69d7;
  background: rgba(102, 126, 234, 0.12);
}

.selected-song-card {
  padding: 20px;
  flex-shrink: 0;
}

.selected-song-head {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.selected-song-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 12px 26px rgba(102, 126, 234, 0.24);
}

.selected-song-meta {
  flex: 1;
}

.selected-song-meta h3 {
  margin: 2px 0 6px;
  font-size: 20px;
  line-height: 1.35;
}

.selected-song-meta span,
.selected-song-label {
  color: #8893b5;
}

.selected-song-meta span {
  display: block;
  line-height: 1.6;
}

.selected-song-label {
  margin: 0;
  font-size: 13px;
}

.style-panel {
  margin-top: 16px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(102, 126, 234, 0.07);
  border: 1px solid rgba(102, 126, 234, 0.12);
}

.style-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.style-panel-label {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.style-panel-tip {
  font-size: 12px;
  color: #7f8aac;
}

.style-chip-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.style-chip {
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.14);
  background: rgba(255, 255, 255, 0.72);
  text-align: left;
  transition: all 0.22s ease;
  cursor: pointer;
}

.style-chip strong,
.style-chip span {
  display: block;
}

.style-chip strong {
  font-size: 13px;
  color: #2f3656;
}

.style-chip span {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.45;
  color: #7782a3;
}

.style-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(102, 126, 234, 0.12);
}

.style-chip.active {
  border-color: rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.16) 0%, rgba(118, 75, 162, 0.12) 100%);
  box-shadow: 0 14px 24px rgba(102, 126, 234, 0.14);
}

.selected-song-actions {
  display: flex;
  gap: 14px;
  margin-top: 16px;
}

.generate-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 14px !important;
  padding: 12px 28px !important;
  box-shadow: 0 10px 24px rgba(102, 126, 234, 0.24) !important;
}

.cancel-btn {
  border-radius: 14px !important;
  padding: 12px 28px !important;
}

.task-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-header h3 {
  margin: 0;
  font-size: 22px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 220px;
  max-height: 460px;
  overflow-y: auto;
  padding-right: 4px;
}

.task-card {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.task-main {
  flex: 1;
  min-width: 0;
}

.task-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.task-title-info h4 {
  margin: 0 0 6px;
  font-size: 17px;
  line-height: 1.5;
}

.task-title-info p {
  margin: 0;
  color: #7f8aac;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
  font-size: 13px;
  color: #8f99b5;
}

.task-error {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  color: #d84c5f;
  background: rgba(216, 76, 95, 0.08);
}

.task-side {
  display: flex;
  align-items: center;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-side-tip {
  font-size: 13px;
  color: #8f99b5;
}

.task-delete-btn {
  flex-shrink: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 86px;
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.badge-queued {
  background: rgba(102, 126, 234, 0.12);
  color: #5c6be0;
}

.badge-processing {
  background: rgba(52, 177, 156, 0.14);
  color: #11907b;
}

.badge-success {
  background: rgba(39, 174, 96, 0.14);
  color: #1c8b4c;
}

.badge-failed {
  background: rgba(216, 76, 95, 0.14);
  color: #c54255;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 16px 18px;
  margin-bottom: 12px;
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.28s ease;
}

html.light .history-item {
  background: linear-gradient(135deg, rgba(247, 248, 255, 0.96) 0%, rgba(255, 255, 255, 0.98) 100%);
  border: 1px solid rgba(102, 126, 234, 0.08);
}

html.dark .history-item {
  background: linear-gradient(135deg, rgba(39, 46, 72, 0.9) 0%, rgba(31, 37, 58, 0.92) 100%);
  border: 1px solid rgba(102, 126, 234, 0.16);
}

.history-item:hover {
  transform: translateX(6px);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.14);
}

.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 8px 18px rgba(102, 126, 234, 0.24);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

html.light .item-name {
  color: #303133;
}

html.dark .item-name {
  color: #e0e0e0;
}

.item-meta {
  font-size: 13px;
  color: #909399;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.item-actions :deep(.el-button) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
}

.rename-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-dialog) {
  border-radius: 22px;
  overflow-y: auto;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  padding: 20px !important;
}

:deep(.el-dialog__title) {
  color: #fff !important;
  font-weight: 700 !important;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #fff !important;
}

@media (max-width: 1180px) {
  .content-wrapper {
    flex-direction: column;
    min-height: auto;
  }

  .create-card,
  .history-card {
    height: auto;
    min-height: 560px;
  }
}

@media (max-width: 900px) {
  .ai-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .ai-hero-stats {
    width: 100%;
    flex-wrap: wrap;
  }

  .hero-stat-card {
    flex: 1;
    min-width: 140px;
  }

  .selected-song-head,
  .task-card,
  .task-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .selected-song-actions {
    flex-direction: column;
  }

  .style-chip-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .ai-page-container {
    padding: 14px;
  }

  .ai-hero {
    min-height: auto;
    padding: 22px 18px;
  }

  .create-panel-body {
    padding: 18px;
  }

  .task-list {
    min-height: 0;
    max-height: none;
  }

  .style-chip-list {
    grid-template-columns: 1fr;
  }
}
</style>
