<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserMvList, syncMvFiles } from '@/api/community'

const props = defineProps<{
  modelValue?: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const syncing = ref(false)
const mvList = ref<any[]>([])
const selectedMvId = ref<number | null>(props.modelValue || null)
const selectedMv = ref<any>(null)

// 获取用户MV列表
const fetchMvList = async () => {
  loading.value = true
  try {
    console.log('>>> [MvSelector] 开始获取MV列表')
    const res = await getUserMvList(undefined, 1)
    console.log('>>> [MvSelector] API响应:', res)
    console.log('>>> [MvSelector] 返回的MV数量:', res.data?.length || 0)
    if (res.code === 0 && res.data) {
      mvList.value = res.data
      console.log('>>> [MvSelector] 设置mvList成功，数量:', mvList.value.length)
    } else {
      ElMessage.error(res.msg || '获取MV列表失败')
    }
  } catch (error) {
    console.error('>>> [MvSelector] 获取MV列表失败:', error)
    ElMessage.error('获取MV列表失败')
  } finally {
    loading.value = false
  }
}

// 打开选择对话框
const openDialog = () => {
  dialogVisible.value = true
  if (mvList.value.length === 0) {
    fetchMvList()
  }
}

// 选择MV
const handleSelect = (mv: any) => {
  selectedMvId.value = mv.id
  selectedMv.value = mv
}

// 确认选择
const handleConfirm = () => {
  emit('update:modelValue', selectedMvId.value)
  dialogVisible.value = false
}

// 取消选择
const handleCancel = () => {
  selectedMvId.value = props.modelValue || null
  dialogVisible.value = false
}

// 清除选择
const handleClear = () => {
  selectedMvId.value = null
  selectedMv.value = null
  emit('update:modelValue', null)
}

// 格式化时长
const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 同步MV文件
const handleSyncMvs = async () => {
  syncing.value = true
  try {
    console.log('>>> [MvSelector] 开始同步MV文件')
    const res = await syncMvFiles()
    console.log('>>> [MvSelector] 同步响应:', res)
    if (res.code === 0) {
      ElMessage.success(res.message || '同步成功')
      // 重新获取MV列表
      await fetchMvList()
    } else {
      ElMessage.error(res.message || '同步失败')
    }
  } catch (error) {
    console.error('>>> [MvSelector] 同步MV失败:', error)
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
  }
}

onMounted(() => {
  // 如果有初始值，获取MV信息
  if (props.modelValue) {
    fetchMvList()
  }
})
</script>

<template>
  <div class="mv-selector">
    <!-- 选择按钮 -->
    <div v-if="!selectedMv" class="select-btn" @click="openDialog">
      <i class="i-carbon-video" />
      <span>选择我的MV作品</span>
    </div>

    <!-- 已选择的MV -->
    <div v-else class="selected-mv">
      <div class="mv-info">
        <i class="i-carbon-video" />
        <div class="mv-details">
          <div class="mv-name">{{ selectedMv.mvName }}</div>
          <div class="mv-meta">
            <span v-if="selectedMv.duration">
              {{ formatDuration(selectedMv.duration) }}
            </span>
            <span v-if="selectedMv.fileSize">
              {{ formatFileSize(selectedMv.fileSize) }}
            </span>
          </div>
        </div>
      </div>
      <div class="mv-actions">
        <el-button size="small" @click="openDialog">更换</el-button>
        <el-button size="small" type="danger" @click="handleClear">
          移除
        </el-button>
      </div>
    </div>

    <!-- MV选择对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="选择MV作品"
      width="900px"
      @close="handleCancel"
    >
      <!-- 同步按钮 -->
      <div class="sync-bar">
        <el-button
          :loading="syncing"
          :icon="syncing ? '' : 'Refresh'"
          @click="handleSyncMvs"
        >
          {{ syncing ? '同步中...' : '同步MV' }}
        </el-button>
        <span class="sync-tip">点击同步按钮，将本地MV文件导入到作品库</span>
      </div>

      <div v-loading="loading" class="mv-list-container">
        <div class="mv-list">
          <div
            v-for="mv in mvList"
            :key="mv.id"
            class="mv-item"
            :class="{ selected: selectedMvId === mv.id }"
            @click="handleSelect(mv)"
          >
            <div class="mv-cover">
              <div class="music-icon"></div>
              <div v-if="selectedMvId === mv.id" class="selected-badge"></div>
            </div>
            <div class="mv-info">
              <div class="mv-name">{{ mv.mvName }}</div>
              <div class="mv-meta">
                <span v-if="mv.duration">
                  <i class="i-carbon-time" />
                  {{ formatDuration(mv.duration) }}
                </span>
                <span v-if="mv.fileSize">
                  {{ formatFileSize(mv.fileSize) }}
                </span>
              </div>
            </div>
          </div>

          <el-empty
            v-if="!loading && mvList.length === 0"
            description="暂无MV作品"
          />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.mv-selector {
  .select-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border: 2px dashed var(--el-border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-fill-color-light);
    }

    i {
      font-size: 20px;
      color: var(--el-text-color-secondary);
    }

    span {
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .selected-mv {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    background: var(--el-fill-color-light);

    .mv-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;

      > i {
        font-size: 24px;
        color: var(--el-color-primary);
      }

      .mv-details {
        flex: 1;

        .mv-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-primary);
          margin-bottom: 4px;
        }

        .mv-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .mv-actions {
      display: flex;
      gap: 8px;
    }
  }
}

.sync-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;

  .sync-tip {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.mv-list-container {
  width: 100%;
  overflow: hidden;
}

.mv-list {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 10px 4px;
  scroll-behavior: smooth;

  /* 美化滚动条 */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-light);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-color-primary);
    border-radius: 4px;

    &:hover {
      background: var(--el-color-primary-light-3);
    }
  }

  .mv-item {
    flex: 0 0 280px;
    border: 2px solid var(--el-border-color);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: var(--el-color-primary);
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    &.selected {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }

    .mv-cover {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;

      .music-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;

        /* 使用CSS绘制音乐符号 */
        &::before {
          content: '♪';
          font-size: 72px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: bold;
        }
      }

      .selected-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--el-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

        /* 使用CSS绘制对勾 */
        &::before {
          content: '✓';
          font-size: 20px;
          color: white;
          font-weight: bold;
        }
      }
    }

    .mv-info {
      padding: 12px;

      .mv-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .mv-meta {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        span {
          display: flex;
          align-items: center;
          gap: 4px;

          i {
            font-size: 14px;
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}
</style>
