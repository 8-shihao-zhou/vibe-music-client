/* eslint-disable */
<template>
  <div class="ai-page-container">
    <section class="ai-hero">
      <div class="ai-hero-copy">
        <p class="ai-hero-kicker">AI Music Video Studio</p>
        <h2>AI 音乐视频创作</h2>
        <p class="subtitle">
          上传音频或从曲库带入歌曲，快速生成专属 MV。创作区与作品库分栏展示，操作路径更清晰。
        </p>
      </div>

      <div class="ai-hero-stats">
        <div class="hero-stat-card">
          <span class="hero-stat-label">当前作品</span>
          <strong>{{ historyList.length }}</strong>
        </div>
        <div class="hero-stat-card">
          <span class="hero-stat-label">创作状态</span>
          <strong>{{ loading ? '生成中' : '可开始' }}</strong>
        </div>
      </div>

      <div class="ai-hero-glow ai-hero-glow-a" />
      <div class="ai-hero-glow ai-hero-glow-b" />
    </section>

    <div class="content-wrapper">
      <div class="left-panel">
        <el-card class="vibe-card upload-card" shadow="hover">
          <template #header>
            <div class="card-header card-header-rich">
              <div>
                <p class="card-kicker">Create</p>
                <span class="card-title">开始新的 MV 创作</span>
              </div>
              <span class="card-tip">支持 MP3 音频上传</span>
            </div>
          </template>

          <div class="upload-container">
            <el-upload
              class="upload-area"
              drag
              action="#"
              :http-request="handleUpload"
              :show-file-list="false"
              accept=".mp3"
              :disabled="loading || !!selectedSongInfo"
            >
              <div v-if="!loading && !selectedSongInfo" class="upload-placeholder">
                <el-icon class="upload-icon"><Headset /></el-icon>
                <div class="text">点击或拖拽 MP3 到这里</div>
                <div class="sub-text">支持 15-60 秒音频，上传后可直接开始生成</div>
              </div>

              <div v-else-if="!loading && selectedSongInfo" class="selected-song-info">
                <el-icon class="selected-icon"><Headset /></el-icon>
                <div class="selected-text">已选择歌曲</div>
                <div class="selected-name">{{ selectedSongInfo }}</div>
                <div class="selected-actions">
                  <el-button
                    type="primary"
                    size="large"
                    @click.stop="handleGenerateFromUrl"
                    class="generate-btn"
                  >
                    <icon-ri:magic-line class="mr-2" />
                    开始生成 MV
                  </el-button>
                  <el-button
                    size="large"
                    @click.stop="selectedSongInfo = ''; selectedAudioUrl = ''"
                    class="cancel-btn"
                  >
                    取消选择
                  </el-button>
                </div>
              </div>

              <div v-else class="loading-placeholder">
                <el-progress type="dashboard" :percentage="progress" />
                <p class="loading-tips">AI 正在渲染中，请稍候...</p>
              </div>
            </el-upload>
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
                刷新
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
              description="暂时还没有作品"
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
                <div class="item-name">{{ item.fileName }}</div>
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
                  title="下载"
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
            placeholder="请输入 MV 名称，不需要手动添加 .mp4"
            maxlength="100"
            show-word-limit
            @keyup.enter="saveMvName"
          />
          <div class="rename-tip">
            提示：只需要输入名称本体，系统会自动保留视频文件扩展名。
          </div>
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Headset, VideoPlay, Download, Refresh, Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { generateVideoApi, getHistoryApi, renameMvFileApi } from '@/api/ai'
import { UserStore } from '@/stores/modules/user'

const route = useRoute()
const router = useRouter()
const userStore = UserStore()
const loading = ref(false)
const progress = ref(0)
const historyList = ref<any[]>([])
const dialogVisible = ref(false)
const currentVideoUrl = ref('')
const selectedSongInfo = ref<string>('')
const selectedAudioUrl = ref<string>('')
const editDialogVisible = ref(false)
const editingMv = ref<any>(null)
const newMvName = ref('')
let timer: any = null

// 检查登录状态，使用 Pinia store
const isLoggedIn = computed(() => {
  return userStore.isLoggedIn && !!userStore.userInfo?.token
})

// 处理登录按钮点击
const handleLogin = () => {
  ElMessage.info('请点击右上角登录按钮进行登录')
}

// 处理从曲库跳转过来的歌曲选择
const handleSongSelection = () => {
  if (route.query.audioUrl) {
    const audioUrl = route.query.audioUrl as string
    const songName = (route.query.songName as string) || '未知歌曲'
    const artistName = (route.query.artistName as string) || '未知歌手'

    selectedSongInfo.value = `${songName} - ${artistName}`
    selectedAudioUrl.value = audioUrl

    ElMessage.success(`已选择：${selectedSongInfo.value}`)
  }
}

watch(
  () => route.query,
  () => {
    handleSongSelection()
  },
  { immediate: true },
)

watch(
  () => userStore.userInfo?.userId,
  (newUserId, oldUserId) => {
    if (newUserId !== oldUserId) {
      historyList.value = []
      if (isLoggedIn.value) {
        fetchHistory()
      }
    }
  },
)

onMounted(() => {
  if (isLoggedIn.value) {
    fetchHistory()
  }
})

const fetchHistory = async () => {
  if (!isLoggedIn.value) {
    historyList.value = []
    return
  }

  try {
    const res = await getHistoryApi()
    if (res.code === 0 || res.code === 200) {
      historyList.value = res.data
    }
  } catch (error) {
    console.error('获取历史失败', error)
  }
}

const handleUpload = async (options: any) => {
  loading.value = true
  startFakeProgress()
  const formData = new FormData()
  formData.append('file', options.file)

  if (selectedSongInfo.value) {
    formData.append('songName', selectedSongInfo.value)
  }

  try {
    const res = await generateVideoApi(formData)
    if (res.code === 0 || res.code === 200) {
      progress.value = 100
      ElMessage.success('生成成功')
      await fetchHistory()
      selectedSongInfo.value = ''
      selectedAudioUrl.value = ''
    } else {
      ElMessage.error(res.message || '失败')
    }
  } catch (error) {
    ElMessage.error('超时或错误')
  } finally {
    loading.value = false
    stopFakeProgress()
  }
}

// 手动触发从 URL 生成 MV
const handleGenerateFromUrl = async () => {
  if (!selectedAudioUrl.value) {
    ElMessage.warning('请先选择一首歌曲')
    return
  }

  try {
    ElMessage.info('正在准备音频文件...')
    loading.value = true
    startFakeProgress()

    const response = await fetch(selectedAudioUrl.value)
    if (!response.ok) {
      throw new Error('下载音频文件失败')
    }

    const blob = await response.blob()
    const fileName = selectedSongInfo.value ? `${selectedSongInfo.value}.mp3` : 'audio.mp3'
    const file = new File([blob], fileName, { type: 'audio/mpeg' })

    const formData = new FormData()
    formData.append('file', file)
    if (selectedSongInfo.value) {
      formData.append('songName', selectedSongInfo.value)
    }

    const res = await generateVideoApi(formData)
    if (res.code === 0 || res.code === 200) {
      progress.value = 100
      ElMessage.success('AI 正在为您生成 MV')
      await fetchHistory()
      selectedSongInfo.value = ''
      selectedAudioUrl.value = ''
    } else {
      ElMessage.error(res.message || '生成失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '处理音频文件失败')
  } finally {
    loading.value = false
    stopFakeProgress()
  }
}

const playVideo = (item: any) => {
  currentVideoUrl.value = item.url
  dialogVisible.value = true
}

const downloadVideo = (item: any) => {
  const link = document.createElement('a')
  link.href = item.url
  link.setAttribute('download', item.fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const openEditDialog = (item: any) => {
  editingMv.value = item
  let name = item.fileName
  if (name.toLowerCase().endsWith('.mp4')) {
    name = name.substring(0, name.length - 4)
  }
  newMvName.value = name
  editDialogVisible.value = true
}

const saveMvName = async () => {
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
    console.error('重命名 MV 失败:', error)
    ElMessage.error('重命名失败')
  }
}

const startFakeProgress = () => {
  progress.value = 0
  timer = setInterval(() => {
    if (progress.value < 95) progress.value += 1
  }, 1000)
}

const stopFakeProgress = () => {
  if (timer) clearInterval(timer)
}

onUnmounted(() => stopFakeProgress())
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
  max-width: 620px;
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
  min-height: 560px;
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
  height: 100%;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(20px);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.upload-card,
.history-card {
  height: clamp(560px, calc(100vh - 240px), 760px);
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

.upload-container {
  flex: 1;
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  height: 360px;
  border-radius: 22px;
  border: 2px dashed rgba(102, 126, 234, 0.26);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.28s ease;
}

html.light .upload-area :deep(.el-upload-dragger) {
  background: linear-gradient(135deg, rgba(242, 245, 255, 0.96) 0%, rgba(252, 245, 255, 0.92) 100%);
}

html.dark .upload-area :deep(.el-upload-dragger) {
  background: linear-gradient(135deg, rgba(35, 41, 64, 0.9) 0%, rgba(45, 37, 67, 0.88) 100%);
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #667eea;
  transform: translateY(-2px);
}

.upload-placeholder,
.selected-song-info,
.loading-placeholder {
  width: 100%;
  text-align: center;
}

.upload-icon,
.selected-icon {
  font-size: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 22px;
}

.text,
.selected-text {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

html.light .text,
html.light .selected-name {
  color: #303133;
}

html.dark .text,
html.dark .selected-name {
  color: #e0e0e0;
}

.sub-text {
  font-size: 14px;
  color: #909399;
}

.selected-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 24px;
}

.selected-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  margin-top: 24px;
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

.loading-tips {
  margin-top: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #6d7bd8;
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
  overflow: hidden;
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

@media (max-width: 1024px) {
  .ai-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .ai-hero-stats {
    width: 100%;
  }

  .hero-stat-card {
    flex: 1;
    min-width: 0;
  }

  .content-wrapper {
    flex-direction: column;
    min-height: auto;
  }

  .left-panel,
  .right-panel {
    min-height: 420px;
  }

  .upload-card,
  .history-card {
    height: auto;
    min-height: 420px;
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

  .ai-hero-stats {
    flex-direction: column;
  }

  .upload-container {
    padding: 20px;
  }

  .upload-area :deep(.el-upload-dragger) {
    height: 300px;
  }

  .selected-actions {
    flex-direction: column;
  }
}
</style>
