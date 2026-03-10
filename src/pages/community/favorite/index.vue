<script setup lang="ts">
import { ref, onMounted, watch, onActivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserFavorites } from '@/api/community'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const favoriteList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取收藏列表
const fetchFavorites = async () => {
  console.log('>>> [收藏列表] 开始获取收藏列表')
  loading.value = true
  try {
    const res = await getUserFavorites(currentPage.value, pageSize.value)
    console.log('>>> [收藏列表] API响应:', res)
    if (res.code === 0 && res.data) {
      favoriteList.value = res.data.records || []
      total.value = res.data.total || 0
      console.log('>>> [收藏列表] 收藏数量:', favoriteList.value.length)
    } else {
      ElMessage.error(res.msg || '获取收藏列表失败')
    }
  } catch (error) {
    console.error('>>> [收藏列表] 获取收藏列表失败:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchFavorites()
}

// 跳转到帖子详情
const goToDetail = (postId: number) => {
  console.log('>>> [收藏列表] 跳转到帖子详情, postId:', postId)
  router.push(`/community/${postId}`)
}

// 返回社区首页
const goBack = () => {
  router.push('/community')
}

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 监听路由变化，从详情页返回时刷新
watch(
  () => route.path,
  (newPath, oldPath) => {
    console.log('>>> [收藏列表路由监听] 路径变化:', oldPath, '->', newPath)
    // 当路由变为 /community/favorite 时刷新
    if (
      newPath === '/community/favorite' &&
      oldPath &&
      oldPath !== '/community/favorite'
    ) {
      console.log('>>> [收藏列表路由监听] 触发刷新')
      fetchFavorites()
    }
  }
)

// 组件激活时刷新（用于keep-alive缓存的组件）
onActivated(() => {
  console.log('>>> [收藏列表] 组件激活，刷新数据')
  fetchFavorites()
})

onMounted(() => {
  console.log('>>> [收藏列表] 组件挂载')
  fetchFavorites()
})
</script>

<template>
  <div class="favorites-container">
    <!-- 头部 -->
    <div class="favorites-header">
      <el-button class="back-btn" @click="goBack">
        <i class="i-carbon-arrow-left mr-1" />
        返回
      </el-button>
      <h1 class="title">我的收藏</h1>
    </div>

    <!-- 收藏列表 -->
    <div v-loading="loading" class="favorites-list">
      <div
        v-for="post in favoriteList"
        :key="post.id"
        class="post-card"
        @click="goToDetail(post.id)"
      >
        <!-- 封面图 -->
        <div v-if="post.coverUrl" class="post-cover">
          <img :src="post.coverUrl" alt="封面" />
        </div>

        <!-- 内容 -->
        <div class="post-content">
          <div class="post-header">
            <div class="post-title-row">
              <span v-if="post.isTop" class="tag-top">置顶</span>
              <span v-if="post.isHot" class="tag-hot">热门</span>
              <h3 class="post-title">{{ post.title }}</h3>
            </div>
            <p class="post-excerpt">{{ post.content.substring(0, 150) }}...</p>
          </div>

          <div class="post-footer">
            <div class="author-info">
              <img
                :src="post.userAvatar || '/src/assets/user.jpg'"
                class="avatar"
              />
              <span class="username">{{ post.username }}</span>
              <span class="time">{{ formatTime(post.createTime) }}</span>
            </div>

            <div class="post-stats">
              <span class="stat-item">
                <i class="i-carbon-view" />
                {{ post.viewCount }}
              </span>
              <span class="stat-item">
                <i class="i-carbon-thumbs-up" />
                {{ post.likeCount }}
              </span>
              <span class="stat-item">
                <i class="i-carbon-chat" />
                {{ post.commentCount }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && favoriteList.length === 0"
        description="暂无收藏"
      />
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.favorites-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.favorites-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;

  .back-btn {
    padding: 8px 16px;
    border-radius: 8px;
  }

  .title {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.favorites-list {
  min-height: 400px;

  .post-card {
    background: var(--el-bg-color);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    display: flex;
    gap: 20px;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
    }

    .post-cover {
      width: 200px;
      height: 150px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .post-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .post-header {
        .post-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;

          .tag-top,
          .tag-hot {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }

          .tag-top {
            background: #f56c6c;
            color: white;
          }

          .tag-hot {
            background: #e6a23c;
            color: white;
          }

          .post-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            color: var(--el-text-color-primary);
          }
        }

        .post-excerpt {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          line-height: 1.6;
          margin: 0;
        }
      }

      .post-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;

        .author-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
          }

          .username {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-primary);
          }

          .time {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }

        .post-stats {
          display: flex;
          gap: 16px;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            color: var(--el-text-color-secondary);

            i {
              font-size: 16px;
            }
          }
        }
      }
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>
