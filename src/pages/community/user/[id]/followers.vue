<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getFollowerList, followUser, unfollowUser } from '@/api/community'
import { UserStore } from '@/stores/modules/user'

const route = useRoute()
const router = useRouter()
const userStore = UserStore()
const userId = computed(() => Number(route.params.id) || 0)
const loading = ref(false)
const followerList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const fetchFollowerList = async () => {
  if (!userId.value) return
  loading.value = true
  try {
    const res = await getFollowerList(userId.value, currentPage.value, pageSize.value)
    if (res.code === 0 && res.data) {
      followerList.value = (res.data as any).records || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取粉丝列表失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

const handleFollow = async (user: any) => {
  if (!userStore.userInfo?.userId) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    if (user.isFollowing) {
      const res = await unfollowUser(user.userId)
      if (res.code === 0) {
        ElMessage.success('取消关注成功')
        user.isFollowing = false
        user.followerCount = Math.max(0, user.followerCount - 1)
      }
    } else {
      const res = await followUser(user.userId)
      if (res.code === 0) {
        ElMessage.success('关注成功')
        user.isFollowing = true
        user.followerCount = user.followerCount + 1
      }
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const goToUserProfile = (targetUserId: number) => {
  router.push(`/community/user/${targetUserId}`)
}

const goBack = () => router.back()

watch(userId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    currentPage.value = 1
    fetchFollowerList()
  }
})

onMounted(fetchFollowerList)
</script>

<template>
  <div class="followers-page">
    <div class="page-container">
      <div class="page-header">
        <el-button class="back-btn" @click="goBack">
          <i class="i-carbon-arrow-left mr-1" />
          返回
        </el-button>
        <h1 class="page-title">
          <i class="i-carbon-user-multiple mr-2" />
          粉丝列表
        </h1>
        <p class="page-subtitle">共 {{ total }} 人</p>
      </div>

      <div v-loading="loading" class="user-grid">
        <div v-for="user in followerList" :key="user.userId" class="user-card">
          <div class="user-info" @click="goToUserProfile(user.userId)">
            <img :src="user.userAvatar || '/src/assets/user.jpg'" class="user-avatar" />
            <div class="user-details">
              <h3 class="username">{{ user.username }}</h3>
              <div class="user-stats">
                <span class="stat">{{ user.followerCount || 0 }} 粉丝</span>
                <span class="stat">{{ user.followingCount || 0 }} 关注</span>
              </div>
            </div>
          </div>
          <el-button
            v-if="user.userId !== userStore.userInfo?.userId"
            :type="user.isFollowing ? 'default' : 'primary'"
            size="small"
            @click="handleFollow(user)"
          >
            {{ user.isFollowing ? '已关注' : '关注' }}
          </el-button>
        </div>
        <el-empty v-if="!loading && followerList.length === 0" description="暂无粉丝" />
      </div>

      <div v-if="total > pageSize" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchFollowerList"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.followers-page {
  min-height: 100vh;
  background: var(--el-bg-color-page, var(--el-fill-color-light));
  padding: 24px;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;

  .back-btn {
    margin-bottom: 16px;
    border-radius: 8px;
  }

  .page-title {
    font-size: 32px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;

    i {
      font-size: 36px;
    }
  }

  .page-subtitle {
    font-size: 14px;
    color: var(--el-text-color-placeholder);
    margin: 0;
  }
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  min-height: 400px;

  .user-card {
    background: var(--el-bg-color);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      flex: 1;

      .user-avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid var(--el-border-color-lighter);
      }

      .user-details {
        .username {
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 0 0 8px 0;
        }

        .user-stats {
          display: flex;
          gap: 16px;

          .stat {
            font-size: 13px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }

    .el-button {
      border-radius: 8px;
      padding: 8px 20px;
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>