<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import { http } from '@/utils/http'
import { UserStore } from '@/stores/modules/user'

const router = useRouter()
const route = useRoute()
const userStore = UserStore()
const loading = ref(false)
const notification = ref<any>(null)

// 加载通知详情
const loadNotificationDetail = async () => {
  try {
    loading.value = true
    const id = route.params.id
    const response: any = await http('get', `/notification/user/detail/${id}`)
    // 后端返回的code: 0表示成功，1表示失败
    if (response.code === 0) {
      notification.value = response.data
    } else {
      ElMessage.error(response.message || '加载通知详情失败')
      router.back()
    }
  } catch (error: any) {
    console.error('加载通知详情失败:', error)
    ElMessage.error(error.message || '加载通知详情失败')
    router.back()
  } finally {
    loading.value = false
  }
}

// 返回列表
const goBack = () => {
  router.push('/notification')
}

onMounted(() => {
  loadNotificationDetail()
})

// 监听用户变化，自动返回列表页
watch(
  () => userStore.userInfo.userId,
  (newUserId, oldUserId) => {
    // 当用户切换时，返回通知列表页
    if (newUserId !== oldUserId && oldUserId !== undefined) {
      console.log('用户切换，返回通知列表')
      router.push('/notification')
    }
  }
)
</script>

<template>
  <div class="notification-detail-container">
    <div class="header">
      <el-button link type="primary" @click="goBack">
        <icon-ep:arrow-left class="mr-1" />
        返回列表
      </el-button>
    </div>

    <div v-loading="loading" class="notification-detail">
      <div v-if="notification" class="content">
        <!-- 标题 -->
        <h1 class="title">{{ notification.title }}</h1>

        <!-- 元信息 -->
        <div class="meta">
          <div class="meta-item">
            <icon-ep:clock class="mr-1" />
            <span>发送时间: {{ notification.createTime }}</span>
          </div>
          <div v-if="notification.readTime" class="meta-item read">
            <icon-ep:check class="mr-1" />
            <span>已读于: {{ notification.readTime }}</span>
          </div>
          <div v-else class="meta-item unread">
            <icon-ep:warning class="mr-1" />
            <span>未读</span>
          </div>
        </div>

        <!-- 内容 -->
        <div class="notification-content">
          {{ notification.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-detail-container {
  max-width: 900px;
  margin: 30px auto;
  padding: 30px 40px;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-height: 500px;
}

.header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.notification-detail {
  min-height: 400px;
}

.content {
  padding: 20px 0;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.meta {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.meta-item.read {
  color: var(--el-color-success);
}

.meta-item.unread {
  color: var(--el-color-warning);
}

.notification-content {
  font-size: 16px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
