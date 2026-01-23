/* eslint-disable */
<template>
  <div class="ai-page-container">
    <div class="page-header">
      <h2>✨ AI 音乐视频创作</h2>
      <p class="subtitle">
        上传您喜欢的音乐，AI 将为您生成专属 MV，您的所有创作都在右侧列表
      </p>
    </div>

    <div class="content-wrapper">
      <!-- 左侧：上传区 -->
      <div class="left-panel">
        <el-card class="vibe-card upload-card" shadow="hover">
          <div class="upload-container">
            <el-upload
              class="upload-area"
              drag
              action="#"
              :http-request="handleUpload"
              :show-file-list="false"
              accept=".mp3"
              :disabled="loading"
            >
              <div v-if="!loading" class="upload-placeholder">
                <el-icon class="upload-icon"><Headset /></el-icon>
                <div class="text">点击或拖拽 MP3 到此处</div>
                <div class="sub-text">支持 15-60秒 音频</div>
              </div>
              <div v-else class="loading-placeholder">
                <el-progress type="dashboard" :percentage="progress" />
                <p class="loading-tips">AI 正在渲染中，请稍候...</p>
              </div>
            </el-upload>
          </div>
        </el-card>
      </div>

      <!-- 右侧：MV 历史列表 (这里就是你要找的列表！) -->
      <div class="right-panel">
        <el-card class="vibe-card history-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>💿 我的作品库</span>
              <el-button
                link
                type="primary"
                :icon="Refresh"
                @click="fetchHistory"
                >刷新</el-button
              >
            </div>
          </template>

          <div class="history-list">
            <el-empty v-if="historyList.length === 0" description="暂无作品" />
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
                <div class="item-meta">
                  {{ item.createTime }} · {{ item.size }}
                </div>
              </div>
              <div class="item-action">
                <el-button
                  circle
                  :icon="Download"
                  @click.stop="downloadVideo(item)"
                />
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 弹窗播放 -->
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
      ></video>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Headset, VideoPlay, Download, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { generateVideoApi, getHistoryApi } from '@/api/ai'

const loading = ref(false)
const progress = ref(0)
const historyList = ref<any[]>([])
const dialogVisible = ref(false)
const currentVideoUrl = ref('')
let timer: any = null

onMounted(() => {
  fetchHistory()
})

const fetchHistory = async () => {
  try {
    const res = await getHistoryApi()
    const data = res.data || res
    if (data.code === 0 || data.code === 200) {
      historyList.value = data.data
    }
  } catch (error) {
    console.error(error)
  }
}

const handleUpload = async (options: any) => {
  loading.value = true
  startFakeProgress()
  const formData = new FormData()
  formData.append('file', options.file)

  try {
    const res = await generateVideoApi(formData)
    const data = res.data || res
    if (data.code === 0 || data.code === 200) {
      progress.value = 100
      ElMessage.success('生成成功！')
      await fetchHistory() // 刷新列表
    } else {
      ElMessage.error(data.message || '失败')
    }
  } catch (error) {
    ElMessage.error('超时或错误', error)
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
  padding: 32px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 浅色模式 */
html.light .ai-page-container {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
}

/* 暗色模式 */
html.dark .ai-page-container {
  background: linear-gradient(
    135deg,
    rgba(26, 26, 46, 0.5) 0%,
    rgba(15, 52, 96, 0.5) 100%
  );
}

.ai-page-container::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(102, 126, 234, 0.1) 0%,
    transparent 70%
  );
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(-20px, 20px) rotate(180deg);
  }
}

.page-header {
  margin-bottom: 32px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.page-header h2 {
  font-size: 42px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
  filter: drop-shadow(0 2px 8px rgba(102, 126, 234, 0.3));
}

.subtitle {
  font-size: 16px;
  font-weight: 300;
  letter-spacing: 0.5px;
}

html.light .subtitle {
  color: rgba(0, 0, 0, 0.65);
}

html.dark .subtitle {
  color: rgba(255, 255, 255, 0.75);
}

.content-wrapper {
  display: flex;
  gap: 28px;
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
}

.left-panel,
.right-panel {
  flex: 1;
  height: 100%;
  min-width: 0;
}

.vibe-card {
  height: 100%;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

html.light .vibe-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(102, 126, 234, 0.2);
}

html.dark .vibe-card {
  background: rgba(30, 30, 46, 0.95);
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.vibe-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(102, 126, 234, 0.2);
}

:deep(.el-card__header) {
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  padding: 20px 24px;
}

html.light :deep(.el-card__header) {
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
}

html.dark :deep(.el-card__header) {
  background: linear-gradient(
    135deg,
    rgba(40, 40, 60, 0.8) 0%,
    rgba(30, 30, 46, 0.8) 100%
  );
}

:deep(.el-card__body) {
  flex: 1;
  padding: 0;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.upload-container {
  flex: 1;
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  height: 360px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  border: 2px dashed rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

html.light .upload-area :deep(.el-upload-dragger) {
  background: linear-gradient(135deg, #f5f7ff 0%, #fef5ff 100%);
}

html.dark .upload-area :deep(.el-upload-dragger) {
  background: linear-gradient(
    135deg,
    rgba(40, 40, 60, 0.5) 0%,
    rgba(50, 40, 70, 0.5) 100%
  );
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: #667eea;
  transform: scale(1.02);
}

html.light .upload-area :deep(.el-upload-dragger:hover) {
  background: linear-gradient(135deg, #eef1ff 0%, #fdeeff 100%);
}

html.dark .upload-area :deep(.el-upload-dragger:hover) {
  background: linear-gradient(
    135deg,
    rgba(50, 50, 70, 0.6) 0%,
    rgba(60, 50, 80, 0.6) 100%
  );
}

.upload-icon {
  font-size: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 24px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.text {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

html.light .text {
  color: #303133;
}

html.dark .text {
  color: #e0e0e0;
}

.sub-text {
  font-size: 14px;
}

html.light .sub-text {
  color: #909399;
}

html.dark .sub-text {
  color: #a0a0a0;
}

.loading-placeholder {
  text-align: center;
}

.loading-tips {
  margin-top: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 16px;
  font-weight: 600;
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* 列表样式 */
.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 12px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

html.light .history-item {
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

html.dark .history-item {
  background: linear-gradient(
    135deg,
    rgba(40, 40, 60, 0.6) 0%,
    rgba(30, 30, 46, 0.6) 100%
  );
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.history-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.history-item:hover::before {
  transform: scaleY(1);
}

.history-item:hover {
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.4);
  transform: translateX(8px);
}

html.light .history-item:hover {
  background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
}

html.dark .history-item:hover {
  background: linear-gradient(
    135deg,
    rgba(50, 50, 70, 0.7) 0%,
    rgba(40, 40, 60, 0.7) 100%
  );
}

.item-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.history-item:hover .item-icon {
  transform: rotate(360deg) scale(1.1);
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
}

html.light .item-meta {
  color: #909399;
}

html.dark .item-meta {
  color: #a0a0a0;
}

.dot {
  margin: 0 8px;
}

.item-action :deep(.el-button) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
  transition: all 0.3s ease;
}

.item-action :deep(.el-button:hover) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

html.light .card-header {
  color: #303133;
}

html.dark .card-header {
  color: #e0e0e0;
}

:deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 20px;
}

:deep(.el-dialog__title) {
  color: #fff;
  font-weight: 600;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-progress__text) {
  font-weight: 600;
}
</style>
