<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserStats, getPostList } from '@/api/community'

const route = useRoute()
const router = useRouter()

const userId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) ? 0 : id
})

const loading = ref(false)
const userStats = ref<any>({})
const postList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const userNotFound = ref(false) // 用户不存在标志

// 获取用户统计信息
const fetchUserStats = async () => {
  if (!userId.value) return

  try {
    const res = await getUserStats(userId.value)
    if (res.code === 0) {
      userStats.value = res.data
      userNotFound.value = false
    } else {
      // 用户不存在，设置标志但不显示错误消息
      userNotFound.value = true
      console.warn('用户不存在:', userId.value)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    userNotFound.value = true
  }
}

// 获取用户帖子列表
const fetchUserPosts = async () => {
  if (!userId.value) return

  loading.value = true
  try {
    const res = await getPostList({
      userId: userId.value,
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    })

    if (res.code === 0 && res.data) {
      postList.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      console.warn('获取帖子列表失败:', res.message)
    }
  } catch (error) {
    console.error('获取帖子列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 跳转到帖子详情
const goToDetail = (postId: number) => {
  router.push(`/community/${postId}`)
}

// 返回社区（使用浏览器历史记录返回）
const goBack = () => {
  router.back()
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

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchUserPosts()
}

// 监听路由参数变化
watch(userId, (newId) => {
  if (newId) {
    currentPage.value = 1
    fetchUserStats()
    fetchUserPosts()
  }
})

// 监听路由的完整路径，用于检测从详情页返回
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    // 当从详情页 (/community/123) 返回到用户主页 (/community/user/456) 时刷新
    if (
      newPath.match(/^\/community\/user\/\d+$/) &&
      oldPath &&
      oldPath.match(/^\/community\/\d+$/)
    ) {
      console.log('>>> [用户主页] 从详情页返回，刷新列表')
      fetchUserPosts()
    }
  }
)

onMounted(() => {
  if (userId.value) {
    fetchUserStats()
    fetchUserPosts()
  }
})
</script>

<template>
  <div class="user-profile-container">
    <div class="profile-content">
      <!-- 返回按钮 -->
      <el-button class="back-btn" @click="goBack">
        <i class="i-carbon-arrow-left mr-1" />
        返回
      </el-button>

      <!-- 用户不存在提示 -->
      <el-empty
        v-if="userNotFound"
        description="用户不存在或已被删除"
        :image-size="200"
      >
        <el-button type="primary" @click="goBack">返回</el-button>
      </el-empty>

      <!-- 用户信息和帖子列表 -->
      <div v-else>
        <!-- 用户信息卡片 -->
        <div class="user-card">
          <div class="user-header">
            <img
              :src="userStats.userAvatar || '/src/assets/user.jpg'"
              class="user-avatar"
            />
            <div class="user-info">
              <h1 class="username">{{ userStats.username }}</h1>
              <p class="user-id">ID: {{ userStats.userId }}</p>
            </div>
          </div>

          <div class="user-stats">
            <div class="stat-item">
              <div class="stat-value">{{ userStats.postCount || 0 }}</div>
              <div class="stat-label">帖子</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value">{{ userStats.totalLikes || 0 }}</div>
              <div class="stat-label">获赞</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value">{{ userStats.commentCount || 0 }}</div>
              <div class="stat-label">评论</div>
            </div>
          </div>
        </div>

        <!-- 帖子列表 -->
        <div class="posts-section">
          <h2 class="section-title">TA的帖子</h2>

          <div v-loading="loading" class="post-list">
            <div
              v-for="post in postList"
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
                  <p class="post-excerpt">
                    {{ post.content.substring(0, 150) }}...
                  </p>
                </div>

                <div class="post-footer">
                  <span class="post-time">{{
                    formatTime(post.createTime)
                  }}</span>
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

            <el-empty
              v-if="!loading && postList.length === 0"
              description="暂无帖子"
            />
          </div>

          <!-- 分页 -->
          <div v-if="total > pageSize" class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              layout="total, prev, pager, next"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.profile-content {
  .back-btn {
    margin-bottom: 24px;
  }
}

.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 32px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);

  .user-header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 32px;

    .user-avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 4px solid rgba(255, 255, 255, 0.3);
      object-fit: cover;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .user-info {
      flex: 1;

      .username {
        font-size: 32px;
        font-weight: 700;
        color: white;
        margin: 0 0 8px 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .user-id {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
      }
    }
  }

  .user-stats {
    display: flex;
    justify-content: space-around;
    align-items: center;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 24px;

    .stat-item {
      text-align: center;

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: white;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
      }
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.posts-section {
  .section-title {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 24px 0;
    color: var(--el-text-color-primary);
  }

  .post-list {
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

          .post-time {
            font-size: 13px;
            color: var(--el-text-color-secondary);
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
}
</style>
