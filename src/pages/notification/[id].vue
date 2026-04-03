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

const loadNotificationDetail = async () => {
  try {
    loading.value = true
    const id = route.params.id
    const response: any = await http('get', `/notification/user/detail/${id}`)
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

const goBack = () => {
  router.push('/notification')
}

onMounted(() => {
  loadNotificationDetail()
})

watch(
  () => userStore.userInfo.userId,
  (newUserId, oldUserId) => {
    if (newUserId !== oldUserId && oldUserId !== undefined) {
      console.log('用户切换，返回通知列表')
      router.push('/notification')
    }
  }
)
</script>

<template>
  <div class="notification-detail-container">
    <div class="detail-shell">
      <div class="header">
        <el-button class="back-btn" @click="goBack">
          <icon-ep:arrow-left class="mr-1" />
          返回列表
        </el-button>
      </div>

      <div v-loading="loading" class="notification-detail">
        <div v-if="notification" class="content">
          <div class="detail-hero">
            <p class="eyebrow">Notice Detail</p>
            <h1 class="title">{{ notification.title }}</h1>

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
                <span>未读通知</span>
              </div>
            </div>
          </div>

          <div class="notification-content">
            {{ notification.content }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-detail-container {
  max-width: 980px;
  margin: 24px auto 36px;
  padding: 0 16px;
}

.detail-shell {
  padding: 26px;
  border-radius: 30px;
  background: linear-gradient(180deg, rgba(248, 249, 255, 0.96) 0%, rgba(239, 244, 255, 0.92) 100%);
  border: 1px solid rgba(128, 146, 255, 0.16);
  box-shadow: 0 20px 48px rgba(76, 94, 170, 0.12);
}

.header {
  margin-bottom: 18px;
}

.back-btn {
  min-width: 104px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(116, 136, 255, 0.18);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(99, 116, 194, 0.12);
}

.notification-detail {
  min-height: 400px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-hero {
  padding: 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(246, 248, 255, 0.9) 100%);
  border: 1px solid rgba(126, 145, 255, 0.14);
  box-shadow: 0 14px 34px rgba(93, 110, 182, 0.1);
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #6f7ed9;
  font-weight: 700;
}

.title {
  font-size: 30px;
  font-weight: 700;
  color: #25304d;
  margin: 0 0 20px;
  line-height: 1.35;
}

.meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  color: #6b7898;
  background: rgba(113, 132, 255, 0.08);
}

.meta-item.read {
  color: #2d966b;
  background: rgba(45, 150, 107, 0.12);
}

.meta-item.unread {
  color: #d08a19;
  background: rgba(238, 178, 54, 0.14);
}

.notification-content {
  padding: 28px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(129, 146, 255, 0.12);
  box-shadow: 0 14px 34px rgba(93, 110, 182, 0.08);
  font-size: 16px;
  line-height: 1.9;
  color: #51607f;
  white-space: pre-wrap;
  word-wrap: break-word;
}

html.dark .detail-shell {
  background: linear-gradient(180deg, rgba(31, 37, 58, 0.98) 0%, rgba(36, 43, 70, 0.96) 100%);
  border-color: rgba(125, 144, 255, 0.2);
  box-shadow: 0 20px 52px rgba(0, 0, 0, 0.24);
}

html.dark .detail-hero,
html.dark .notification-content {
  background: rgba(32, 39, 62, 0.88);
}

html.dark .title {
  color: #eef2ff;
}

html.dark .notification-content {
  color: #c1cae2;
}

html.dark .meta-item {
  color: #c7d2ff;
  background: rgba(120, 139, 255, 0.16);
}

@media (max-width: 640px) {
  .notification-detail-container {
    padding: 0 12px;
  }

  .detail-shell {
    padding: 18px;
    border-radius: 24px;
  }

  .detail-hero,
  .notification-content {
    padding: 20px;
    border-radius: 20px;
  }

  .title {
    font-size: 24px;
  }
}
</style>
