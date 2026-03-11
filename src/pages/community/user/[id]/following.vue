<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getFollowingList, followUser, unfollowUser } from '@/api/community'
import { UserStore } from '@/stores/modules/user'

const route = useRoute()
const router = useRouter()
const userStore = UserStore()
const userId = computed(() => Number(route.params.id) || 0)
const loading = ref(false)
const followingList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const fetchFollowingList = async () => {
  if (!userId.value) return
  loading.value = true
  try {
    const res = await getFollowingList(userId.value, currentPage.value, pageSize.value)
    if (res.code === 0 && res.data) {
      followingList.value = (res.data as any).records || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取关注列表失败')
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
    fetchFollowingList()
  }
})

onMounted(fetchFollowingList)
</script>

<template>
  <div class="following-page">
    <div class="page-container">
      <div class="page-header">
        <el-button class="back-btn" @click="goBack">
          <i class="i-carbon-arrow-left mr-1" />
          返回
        </el-button>
        <h1 class="page-title">
          <i class="i-carbon-user-follow mr-2" />
          关注列表
        </h1>
        <p class="page-subtitle">共 {{ total }} 人</p>
      </div>

      <div v-loading="loading" class="user-grid">
        <div v-for="user in followingList" :key="user.userId" class="user-card">
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
        <el-empty v-if="!loading && followingList.length === 0" description="暂无关注" />
      </div>

      <div v-if="total > pageSize" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="fetchFollowingList"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.following-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%);
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
    color: #2c3e50;
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;

    i {
      font-size: 36px;
    }
  }

  .page-subtitle {
    font-size: 14px;
    color: #95a5a6;
    margin: 0;
  }
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  min-height: 400px;

  .user-card {
    background: white;
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
        border: 3px solid #ecf0f1;
      }

      .user-details {
        .username {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
          margin: 0 0 8px 0;
        }

        .user-stats {
          display: flex;
          gap: 16px;

          .stat {
            font-size: 13px;
            color: #7f8c8d;
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