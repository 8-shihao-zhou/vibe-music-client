<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { http } from '@/utils/http'
import { UserStore } from '@/stores/modules/user'

const router = useRouter()
const userStore = UserStore()
const loading = ref(false)
const notifications = ref<any[]>([])
const selectedIds = ref<number[]>([])

// 筛选条件
const filterForm = ref({
  type: '',
  priority: '',
  isRead: null as number | null,
  keyword: ''
})

// 通知类型选项
const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '系统通知', value: 'SYSTEM' },
  { label: '活动通知', value: 'ACTIVITY' },
  { label: '个人消息', value: 'PERSONAL' }
]

// 优先级选项
const priorityOptions = [
  { label: '全部优先级', value: '' },
  { label: '普通', value: 'NORMAL' },
  { label: '重要', value: 'IMPORTANT' },
  { label: '紧急', value: 'URGENT' }
]

// 已读状态选项
const readOptions = [
  { label: '全部状态', value: null },
  { label: '未读', value: 0 },
  { label: '已读', value: 1 }
]

// 加载通知列表
const loadNotifications = async () => {
  try {
    loading.value = true
    const response: any = await http('get', '/notification/user/list')
    // 后端返回的code: 0表示成功，1表示失败
    if (response.code === 0) {
      notifications.value = response.data || []
    } else {
      ElMessage.error(response.message || '加载通知失败')
    }
  } catch (error: any) {
    console.error('加载通知失败:', error)
    ElMessage.error(error.message || '加载通知失败')
  } finally {
    loading.value = false
  }
}

// 筛选通知
const filterNotifications = async () => {
  try {
    loading.value = true
    const params = new URLSearchParams()
    if (filterForm.value.type) params.append('type', filterForm.value.type)
    if (filterForm.value.priority)
      params.append('priority', filterForm.value.priority)
    if (filterForm.value.isRead !== null)
      params.append('isRead', String(filterForm.value.isRead))
    if (filterForm.value.keyword)
      params.append('keyword', filterForm.value.keyword)

    const response: any = await http(
      'get',
      `/notification/user/filter?${params.toString()}`
    )
    // 后端返回的code: 0表示成功，1表示失败
    if (response.code === 0) {
      notifications.value = response.data || []
    } else {
      ElMessage.error(response.message || '筛选失败')
    }
  } catch (error: any) {
    console.error('筛选失败:', error)
    ElMessage.error(error.message || '筛选失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选
const resetFilter = () => {
  filterForm.value = {
    type: '',
    priority: '',
    isRead: null,
    keyword: ''
  }
  loadNotifications()
}

// 跳转到详情页
const goToDetail = (id: number) => {
  router.push(`/notification/${id}`)
}

// 标记已读
const markAsRead = async (id: number, event: Event) => {
  event.stopPropagation()
  try {
    const response: any = await http('put', `/notification/user/read/${id}`)
    // 后端返回的code: 0表示成功，1表示失败
    if (response.code === 0) {
      ElMessage.success('已标记为已读')
      loadNotifications()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error: any) {
    console.error('标记已读失败:', error)
    ElMessage.error(error.message || '操作失败')
  }
}

// 标记未读
const markAsUnread = async (id: number, event: Event) => {
  event.stopPropagation()
  try {
    const response: any = await http('put', `/notification/user/unread/${id}`)
    // 后端返回的code: 0表示成功，1表示失败
    if (response.code === 0) {
      ElMessage.success('已标记为未读')
      loadNotifications()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error: any) {
    console.error('标记未读失败:', error)
    ElMessage.error(error.message || '操作失败')
  }
}

// 批量标记已读
const batchMarkAsRead = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择通知')
    return
  }

  try {
    const response: any = await http('put', '/notification/user/batch-read', {
      data: { ids: selectedIds.value }
    })
    // 后端返回的code: 0表示成功，1表示失败
    if (response.code === 0) {
      ElMessage.success('批量标记成功')
      selectedIds.value = []
      loadNotifications()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error: any) {
    console.error('批量标记失败:', error)
    ElMessage.error(error.message || '操作失败')
  }
}

// 全部标记已读
const markAllAsRead = async () => {
  try {
    await ElMessageBox.confirm('确定要将所有通知标记为已读吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'notification-confirm-box'
    })

    const response: any = await http('put', '/notification/user/read-all')
    // 后端返回的code: 0表示成功，1表示失败
    if (response.code === 0) {
      ElMessage.success('全部标记成功')
      loadNotifications()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('全部标记失败:', error)
      ElMessage.error(error.message || '操作失败')
    }
  }
}

// 批量删除
const batchDelete = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择通知')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 条通知吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'notification-confirm-box'
      }
    )

    const response: any = await http('delete', '/notification/user/batch-delete', {
      data: { ids: selectedIds.value }
    })
    // 后端返回的code: 0表示成功，1表示失败
    if (response.code === 0) {
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      loadNotifications()
    } else {
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error(error.message || '操作失败')
    }
  }
}

// 切换选择
const toggleSelection = (id: number) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectedIds.value.length === notifications.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = notifications.value.map((n) => n.id)
  }
}

// 未读通知数量
const unreadCount = computed(() => {
  return notifications.value.filter((n) => n.isRead === 0).length
})

// 获取优先级标签类型
const getPriorityType = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return 'danger'
    case 'IMPORTANT':
      return 'warning'
    case 'NORMAL':
    default:
      return 'info'
  }
}

// 获取优先级文本
const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return '紧急'
    case 'IMPORTANT':
      return '重要'
    case 'NORMAL':
    default:
      return '普通'
  }
}

// 获取类型文本
const getTypeText = (type: string) => {
  switch (type) {
    case 'SYSTEM':
      return '系统通知'
    case 'ACTIVITY':
      return '活动通知'
    case 'PERSONAL':
      return '个人消息'
    default:
      return type
  }
}

// 返回个人中心
const goBack = () => {
  router.push('/user')
}

onMounted(() => {
  loadNotifications()
})

// 监听用户变化，自动刷新通知列表
watch(
  () => userStore.userInfo.userId,
  (newUserId, oldUserId) => {
    // 当用户ID变化时（切换用户或登录/登出），重新加载通知
    if (newUserId !== oldUserId) {
      console.log('用户切换，重新加载通知列表')
      // 重置筛选条件
      filterForm.value = {
        type: '',
        priority: '',
        isRead: null,
        keyword: ''
      }
      // 清空选择
      selectedIds.value = []
      // 重新加载通知
      loadNotifications()
    }
  }
)
</script>

<template>
  <div class="notification-container">
    <div class="header">
      <div class="header-left">
        <el-button class="back-btn" @click="goBack">
          <icon-ep:arrow-left class="mr-1" />
          返回
        </el-button>
        <h2 class="title">我的通知</h2>
      </div>
      <div class="stats">
        <span class="unread-count">未读: {{ unreadCount }}</span>
        <span class="total-count">总计: {{ notifications.length }}</span>
      </div>
    </div>

    <!-- 筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="类型">
          <el-select
            v-model="filterForm.type"
            placeholder="选择类型"
            style="width: 150px"
          >
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-select
            v-model="filterForm.priority"
            placeholder="选择优先级"
            style="width: 150px"
          >
            <el-option
              v-for="item in priorityOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="filterForm.isRead"
            placeholder="选择状态"
            style="width: 150px"
          >
            <el-option
              v-for="item in readOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索标题"
            style="width: 200px"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="filterNotifications" class="mr-2">
            筛选
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作区域 -->
    <div class="batch-actions">
      <el-checkbox
        :indeterminate="
          selectedIds.length > 0 &&
          selectedIds.length < notifications.length
        "
        :model-value="
          selectedIds.length > 0 &&
          selectedIds.length === notifications.length
        "
        @change="toggleSelectAll"
      >
        全选
      </el-checkbox>
      <span class="selected-count">已选择 {{ selectedIds.length }} 项</span>
      <el-button
        type="primary"
        size="small"
        :disabled="selectedIds.length === 0"
        @click="batchMarkAsRead"
      >
        批量标记已读
      </el-button>
      <el-button
        type="success"
        size="small"
        @click="markAllAsRead"
      >
        全部标记已读
      </el-button>
      <el-button
        type="danger"
        size="small"
        :disabled="selectedIds.length === 0"
        @click="batchDelete"
      >
        批量删除
      </el-button>
    </div>

    <div v-loading="loading" class="notification-list">
      <!-- 空状态 -->
      <el-empty
        v-if="!loading && notifications.length === 0"
        description="暂无通知"
      />

      <!-- 通知列表 -->
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification-item', { unread: notification.isRead === 0 }]"
      >
        <div class="notification-checkbox">
          <el-checkbox
            :model-value="selectedIds.includes(notification.id)"
            @change="toggleSelection(notification.id)"
            @click.stop
          />
        </div>

        <div class="notification-content-wrapper" @click="goToDetail(notification.id)">
          <div class="notification-header">
            <div class="notification-title">
              <el-badge v-if="notification.isRead === 0" is-dot class="mr-2" />
              {{ notification.title }}
              <el-tag
                :type="getPriorityType(notification.priority)"
                size="small"
                class="ml-2"
              >
                {{ getPriorityText(notification.priority) }}
              </el-tag>
              <el-tag type="info" size="small" class="ml-2">
                {{ getTypeText(notification.type) }}
              </el-tag>
            </div>
            <div class="notification-actions">
              <el-button
                v-if="notification.isRead === 0"
                link
                type="primary"
                size="small"
                @click="markAsRead(notification.id, $event)"
              >
                标记已读
              </el-button>
              <el-button
                v-else
                link
                type="info"
                size="small"
                @click="markAsUnread(notification.id, $event)"
              >
                标记未读
              </el-button>
            </div>
          </div>

          <div class="notification-content">
            {{ notification.content }}
          </div>

          <div class="notification-footer">
            <span class="notification-time">
              <icon-ep:clock class="mr-1" />
              {{ notification.createTime }}
            </span>
            <span v-if="notification.readTime" class="read-time">
              已读于 {{ notification.readTime }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-container {
  max-width: 1200px;
  margin: 30px auto;
  padding: 30px 40px;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-height: 500px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  border-radius: 8px;
}

.title {
  margin: 0;
  font-size: 20px;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.unread-count {
  color: var(--el-color-primary);
  font-weight: 500;
}

.total-count {
  color: var(--el-text-color-secondary);
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 16px;
}

.selected-count {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-right: auto;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background-color: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: all 0.3s;
}

.notification-item:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-item.unread {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

.notification-checkbox {
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
}

.notification-content-wrapper {
  flex: 1;
  cursor: pointer;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-content {
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.notification-time {
  display: flex;
  align-items: center;
}

.read-time {
  color: var(--el-color-success);
}

/* 确认对话框按钮间距 */
:deep(.notification-confirm-box .el-message-box__btns) {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

:deep(.notification-confirm-box .el-message-box__btns .el-button) {
  margin-left: 0 !important;
}
</style>
