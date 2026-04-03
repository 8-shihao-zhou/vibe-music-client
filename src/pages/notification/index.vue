<script setup lang="ts">
import { ref, onMounted, computed, watch, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { http } from '@/utils/http'
import { UserStore } from '@/stores/modules/user'

const router = useRouter()
const userStore = UserStore()
const loading = ref(false)
const notifications = ref<any[]>([])
const selectedIds = ref<number[]>([])

const filterForm = ref({
  type: '',
  priority: '',
  isRead: null as number | null,
  keyword: '',
})

const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '系统通知', value: 'SYSTEM' },
  { label: '活动通知', value: 'ACTIVITY' },
  { label: '个人消息', value: 'PERSONAL' },
]

const priorityOptions = [
  { label: '全部优先级', value: '' },
  { label: '普通', value: 'NORMAL' },
  { label: '重要', value: 'IMPORTANT' },
  { label: '紧急', value: 'URGENT' },
]

const readOptions = [
  { label: '全部状态', value: null },
  { label: '未读', value: 0 },
  { label: '已读', value: 1 },
]

const loadNotifications = async () => {
  try {
    loading.value = true
    const response: any = await http('get', '/notification/user/list')
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

const filterNotifications = async () => {
  try {
    loading.value = true
    const params = new URLSearchParams()
    if (filterForm.value.type) params.append('type', filterForm.value.type)
    if (filterForm.value.priority) {
      params.append('priority', filterForm.value.priority)
    }
    if (filterForm.value.isRead !== null) {
      params.append('isRead', String(filterForm.value.isRead))
    }
    if (filterForm.value.keyword) {
      params.append('keyword', filterForm.value.keyword)
    }

    const response: any = await http(
      'get',
      `/notification/user/filter?${params.toString()}`
    )
    if (response.code === 0) {
      notifications.value = response.data || []
    } else {
      ElMessage.error(response.message || '筛选失败')
    }
  } catch (error: any) {
    console.error('筛选失败', error)
    ElMessage.error(error.message || '筛选失败')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.value = {
    type: '',
    priority: '',
    isRead: null,
    keyword: '',
  }
  loadNotifications()
}

const goToDetail = (id: number) => {
  router.push(`/notification/${id}`)
}

const markAsRead = async (id: number, event: Event) => {
  event.stopPropagation()
  try {
    const response: any = await http('put', `/notification/user/read/${id}`)
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

const markAsUnread = async (id: number, event: Event) => {
  event.stopPropagation()
  try {
    const response: any = await http('put', `/notification/user/unread/${id}`)
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

const batchMarkAsRead = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择通知')
    return
  }

  try {
    const response: any = await http('put', '/notification/user/batch-read', {
      data: { ids: selectedIds.value },
    })
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

const markAllAsRead = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要将所有通知标记为已读吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'notification-confirm-box',
      }
    )

    const response: any = await http('put', '/notification/user/read-all')
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
        customClass: 'notification-confirm-box',
      }
    )

    const response: any = await http('delete', '/notification/user/batch-delete', {
      data: { ids: selectedIds.value },
    })
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

const toggleSelection = (id: number) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (selectedIds.value.length === notifications.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = notifications.value.map((n) => n.id)
  }
}

const unreadCount = computed(() => {
  return notifications.value.filter((n) => n.isRead === 0).length
})

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

const goBack = () => {
  router.push('/user')
}

onMounted(() => {
  loadNotifications()
})

onActivated(() => {
  console.log('通知页面激活，重新加载通知')
  loadNotifications()
})

watch(
  () => userStore.userInfo.userId,
  (newUserId, oldUserId) => {
    if (newUserId !== oldUserId) {
      console.log('用户切换，重新加载通知列表')
      filterForm.value = {
        type: '',
        priority: '',
        isRead: null,
        keyword: '',
      }
      selectedIds.value = []
      loadNotifications()
    }
  }
)
</script>

<template>
  <div class="notification-container">
    <div class="page-hero">
      <div class="hero-backdrop"></div>
      <div class="header">
        <div class="header-left">
          <el-button class="back-btn" @click="goBack">
            <icon-ep:arrow-left class="mr-1" />
            返回
          </el-button>
          <div>
            <p class="eyebrow">Message Center</p>
            <h2 class="title">我的通知</h2>
            <p class="subtitle">
              集中查看系统提醒、活动消息和个人通知，处理起来会更清晰。
            </p>
          </div>
        </div>
        <div class="stats">
          <div class="stat-card stat-card-primary">
            <span class="stat-label">未读通知</span>
            <strong class="stat-value">{{ unreadCount }}</strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">通知总数</span>
            <strong class="stat-value">{{ notifications.length }}</strong>
          </div>
        </div>
      </div>
    </div>

    <el-card class="filter-card" shadow="never">
      <template #header>
        <div class="card-heading">
          <div>
            <p class="card-kicker">快速筛选</p>
            <h3>按类型、优先级或关键词查找通知</h3>
          </div>
        </div>
      </template>
      <el-form :model="filterForm" inline class="filter-form">
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
          <el-button type="primary" class="action-btn" @click="filterNotifications">
            筛选通知
          </el-button>
          <el-button class="secondary-btn" @click="resetFilter">重置条件</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="batch-actions">
      <div class="batch-meta">
        <el-checkbox
          :indeterminate="
            selectedIds.length > 0 && selectedIds.length < notifications.length
          "
          :model-value="
            selectedIds.length > 0 && selectedIds.length === notifications.length
          "
          @change="toggleSelectAll"
        >
          全选
        </el-checkbox>
        <span class="selected-count">已选择 {{ selectedIds.length }} 项</span>
      </div>
      <div class="batch-button-group">
        <el-button
          type="primary"
          size="small"
          class="action-btn"
          :disabled="selectedIds.length === 0"
          @click="batchMarkAsRead"
        >
          批量标记已读
        </el-button>
        <el-button type="success" size="small" class="success-btn" @click="markAllAsRead">
          全部标记已读
        </el-button>
        <el-button
          type="danger"
          size="small"
          class="danger-btn"
          :disabled="selectedIds.length === 0"
          @click="batchDelete"
        >
          批量删除
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="notification-list">
      <el-empty
        v-if="!loading && notifications.length === 0"
        class="empty-state"
        description="暂时还没有通知"
      />

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

        <div
          class="notification-content-wrapper"
          @click="goToDetail(notification.id)"
        >
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
                class="inline-link"
                @click="markAsRead(notification.id, $event)"
              >
                标记已读
              </el-button>
              <el-button
                v-else
                link
                type="info"
                size="small"
                class="inline-link inline-link-muted"
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
  --page-bg: linear-gradient(180deg, rgba(248, 249, 255, 0.96) 0%, rgba(239, 244, 255, 0.92) 100%);
  --card-bg: rgba(255, 255, 255, 0.88);
  --card-border: rgba(128, 146, 255, 0.16);
  --card-shadow: 0 18px 48px rgba(76, 94, 170, 0.12);
  --soft-shadow: 0 12px 30px rgba(93, 110, 182, 0.12);
  max-width: 1240px;
  margin: 24px auto 36px;
  padding: 26px;
  min-height: 500px;
  border: 1px solid var(--card-border);
  border-radius: 28px;
  background: var(--page-bg);
  box-shadow: var(--card-shadow);
  position: relative;
  overflow: hidden;
}

.notification-container::before {
  content: '';
  position: absolute;
  top: -120px;
  right: -90px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(128, 146, 255, 0.22) 0%, rgba(128, 146, 255, 0) 70%);
  pointer-events: none;
}

.page-hero {
  position: relative;
  margin-bottom: 22px;
  padding: 28px 30px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(246, 248, 255, 0.9) 100%);
  border: 1px solid rgba(126, 145, 255, 0.16);
  box-shadow: var(--soft-shadow);
  overflow: hidden;
}

.hero-backdrop {
  position: absolute;
  inset: auto -40px -80px auto;
  width: 260px;
  height: 260px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(122, 139, 255, 0.18) 0%, rgba(122, 139, 255, 0) 72%);
  pointer-events: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  flex: 1;
}

.back-btn {
  min-width: 96px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(116, 136, 255, 0.18);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(99, 116, 194, 0.12);
}

.eyebrow {
  margin: 2px 0 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #6f7ed9;
  font-weight: 700;
}

.title {
  margin: 0 0 8px;
  font-size: 30px;
  line-height: 1.2;
  color: #25304d;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  max-width: 620px;
  font-size: 14px;
  line-height: 1.7;
  color: #62708f;
}

.stats {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.stat-card {
  min-width: 132px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(130, 148, 255, 0.16);
  box-shadow: 0 12px 30px rgba(99, 116, 194, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card-primary {
  background: linear-gradient(135deg, rgba(108, 123, 255, 0.12) 0%, rgba(138, 125, 255, 0.16) 100%);
}

.stat-label {
  font-size: 12px;
  color: #7280a0;
}

.stat-value {
  font-size: 24px;
  color: #243050;
  line-height: 1;
}

.filter-card {
  margin-bottom: 18px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: var(--soft-shadow);
  backdrop-filter: blur(18px);
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  color: #6d7bd8;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 700;
}

.card-heading h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #26314e;
}

.filter-form {
  row-gap: 6px;
}

.action-btn,
.secondary-btn,
.success-btn,
.danger-btn {
  min-width: 110px;
  height: 36px;
  border-radius: 12px;
}

.batch-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(129, 146, 255, 0.14);
  border-radius: 20px;
  margin-bottom: 16px;
  box-shadow: 0 12px 30px rgba(99, 116, 194, 0.08);
}

.batch-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.batch-button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.selected-count {
  font-size: 14px;
  color: #6c7897;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty-state {
  padding: 36px 0;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px dashed rgba(131, 149, 255, 0.2);
}

.notification-item {
  display: flex;
  gap: 14px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(129, 146, 255, 0.12);
  border-radius: 22px;
  transition: all 0.28s ease;
  box-shadow: 0 12px 30px rgba(92, 109, 179, 0.08);
  backdrop-filter: blur(16px);
}

.notification-item:hover {
  transform: translateY(-2px);
  border-color: rgba(108, 123, 255, 0.24);
  box-shadow: 0 18px 40px rgba(92, 109, 179, 0.12);
}

.notification-item.unread {
  background: linear-gradient(135deg, rgba(240, 244, 255, 0.98) 0%, rgba(249, 246, 255, 0.96) 100%);
  border-color: rgba(108, 123, 255, 0.2);
}

.notification-checkbox {
  display: flex;
  align-items: flex-start;
  padding-top: 8px;
}

.notification-content-wrapper {
  flex: 1;
  cursor: pointer;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 10px;
}

.notification-title {
  font-size: 16px;
  font-weight: 600;
  color: #25304d;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 8px;
}

.notification-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.notification-content {
  font-size: 14px;
  color: #5f6d8f;
  line-height: 1.8;
  margin-bottom: 14px;
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
  gap: 12px;
  font-size: 12px;
  color: #7a86a3;
  flex-wrap: wrap;
}

.notification-time {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(113, 132, 255, 0.08);
}

.read-time {
  color: #2d966b;
  font-weight: 600;
}

.inline-link {
  padding: 0;
  font-weight: 600;
}

.inline-link-muted {
  color: #7885a4;
}

:deep(.notification-confirm-box .el-message-box__btns) {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

:deep(.notification-confirm-box .el-message-box__btns .el-button) {
  margin-left: 0 !important;
}

:deep(.filter-card .el-card__header) {
  padding: 22px 24px 8px;
  border-bottom: none;
  background: transparent;
}

:deep(.filter-card .el-card__body) {
  padding: 8px 24px 24px;
}

:deep(.filter-form .el-form-item) {
  margin-right: 14px;
  margin-bottom: 14px;
}

:deep(.notification-item .el-tag) {
  border-radius: 999px;
  border: none;
  padding: 0 10px;
}

:deep(.batch-actions .el-checkbox__label) {
  color: #33415f;
  font-weight: 600;
}

html.dark .notification-container {
  --page-bg: linear-gradient(180deg, rgba(31, 37, 58, 0.98) 0%, rgba(36, 43, 70, 0.96) 100%);
  --card-bg: rgba(34, 40, 64, 0.9);
  --card-border: rgba(125, 144, 255, 0.2);
  --card-shadow: 0 20px 52px rgba(0, 0, 0, 0.24);
  --soft-shadow: 0 16px 36px rgba(0, 0, 0, 0.2);
}

html.dark .page-hero,
html.dark .batch-actions,
html.dark .notification-item,
html.dark .empty-state {
  background: rgba(32, 39, 62, 0.88);
}

html.dark .title,
html.dark .card-heading h3,
html.dark .stat-value,
html.dark .notification-title {
  color: #eef2ff;
}

html.dark .subtitle,
html.dark .selected-count,
html.dark .notification-content,
html.dark .notification-footer,
html.dark .stat-label {
  color: #b4bed9;
}

html.dark .notification-time {
  background: rgba(120, 139, 255, 0.16);
  color: #c7d2ff;
}

@media (max-width: 900px) {
  .notification-container {
    margin: 16px;
    padding: 18px;
    border-radius: 24px;
  }

  .page-hero {
    padding: 22px 18px;
  }

  .header,
  .batch-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .stats {
    width: 100%;
  }

  .stat-card {
    flex: 1;
  }

  .notification-header {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .header-left {
    flex-direction: column;
  }

  .title {
    font-size: 24px;
  }

  :deep(.filter-card .el-card__header),
  :deep(.filter-card .el-card__body) {
    padding-left: 16px;
    padding-right: 16px;
  }

  :deep(.filter-form .el-form-item) {
    margin-right: 0;
    width: 100%;
  }

  :deep(.filter-form .el-select),
  :deep(.filter-form .el-input) {
    width: 100% !important;
  }
}
</style>

/* eslint-disable */
