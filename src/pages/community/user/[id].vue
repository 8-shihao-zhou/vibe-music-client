<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserStats, getPostList, getFollowStats } from '@/api/community'

const route = useRoute()
const router = useRouter()
const userId = computed(() => Number(route.params.id) || 0)
const loading = ref(false)
const userStats = ref<any>({})
const followStats = ref<any>({})
const postList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchData = async () => {
  if (!userId.value) return
  loading.value = true
  try {
    const [statsRes, followRes, postsRes] = await Promise.all([
      getUserStats(userId.value),
      getFollowStats(userId.value),
      getPostList({
        userId: userId.value,
        pageNum: currentPage.value,
        pageSize: pageSize.value,
      }),
    ])
    if (statsRes.code === 0) userStats.value = statsRes.data
    if (followRes.code === 0) followStats.value = followRes.data
    if (postsRes.code === 0) {
      postList.value = (postsRes.data as any).records || []
      total.value = postsRes.data.total || 0
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const goToDetail = (id: number) => router.push(`/community/${id}`)
const goBack = () => router.back()
const goToFollowing = () =>
  router.push(`/community/user/${userId.value}/following`)
const goToFollowers = () =>
  router.push(`/community/user/${userId.value}/followers`)

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  else if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  else if (diff < day) return `${Math.floor(diff / hour)}小时前`
  else if (diff < 7 * day) return `${Math.floor(diff / day)}天前`
  else return date.toLocaleDateString()
}

watch(userId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    currentPage.value = 1
    fetchData()
  }
})

onMounted(fetchData)
</script>
<template>
  <div class="user-profile-page">
    <div class="profile-container">
      <el-button class="back-btn" @click="goBack">
        <i class="i-carbon-arrow-left mr-1" />
        返回
      </el-button>

      <div class="user-header-card">
        <div class="cover-bg"></div>
        <div class="user-info-section">
          <div class="avatar-wrapper">
            <img
              :src="userStats.userAvatar || '/src/assets/user.jpg'"
              class="user-avatar"
            />
          </div>
          <div class="user-details">
            <h1 class="username">{{ userStats.username }}</h1>
            <p class="user-id">ID: {{ userStats.userId }}</p>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ userStats.postCount || 0 }}</div>
            <div class="stat-label">帖子</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ userStats.totalLikes || 0 }}</div>
            <div class="stat-label">获赞</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ userStats.commentCount || 0 }}</div>
            <div class="stat-label">评论</div>
          </div>
          <div class="stat-card clickable" @click="goToFollowing">
            <div class="stat-value">{{ followStats.followingCount || 0 }}</div>
            <div class="stat-label">关注</div>
          </div>
          <div class="stat-card clickable" @click="goToFollowers">
            <div class="stat-value">{{ followStats.followerCount || 0 }}</div>
            <div class="stat-label">粉丝</div>
          </div>
        </div>
      </div>

      <div class="posts-section">
        <h2 class="section-title">
          <i class="i-carbon-document mr-2" />
          TA的帖子
        </h2>
        <div v-loading="loading" class="posts-list">
          <div
            v-for="post in postList"
            :key="post.id"
            class="post-item"
            @click="goToDetail(post.id)"
          >
            <div v-if="post.coverUrl" class="post-cover">
              <img :src="post.coverUrl" alt="封面" />
            </div>
            <div class="post-content">
              <div class="post-header">
                <div class="post-tags">
                  <span v-if="post.isTop" class="tag tag-top">置顶</span>
                  <span v-if="post.isHot" class="tag tag-hot">热门</span>
                </div>
                <h3 class="post-title">{{ post.title }}</h3>
                <p class="post-excerpt">
                  {{ (post.content || '').substring(0, 150)
                  }}{{ (post.content || '').length > 150 ? '...' : '' }}
                </p>
              </div>
              <div class="post-footer">
                <span class="post-time">{{ formatTime(post.createTime) }}</span>
                <div class="post-stats">
                  <span class="stat"
                    ><i class="i-carbon-view" />浏览 {{ post.viewCount || 0 }}</span
                  >
                  <span class="stat"
                    ><i class="i-carbon-thumbs-up" />点赞 {{
                      post.likeCount || 0
                    }}</span
                  >
                  <span class="stat"
                    ><i class="i-carbon-chat" />评论 {{
                      post.commentCount || 0
                    }}</span
                  >
                </div>
              </div>
            </div>
          </div>
          <el-empty
            v-if="!loading && postList.length === 0"
            description="暂无帖子"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.user-profile-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%);
  padding: 24px;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  margin-bottom: 20px;
  border-radius: 8px;
}

.user-header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;

  .cover-bg {
    height: 180px;
    background: transparent;
    position: relative;
  }

  .user-info-section {
    padding: 0 40px;
    margin-top: -60px;
    display: flex;
    align-items: flex-end;
    gap: 24px;
    margin-bottom: 32px;
    position: relative;
    z-index: 10;

    .avatar-wrapper {
      position: relative;

      .user-avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 5px solid white;
        object-fit: cover;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }

    .user-details {
      flex: 1;
      padding-bottom: 8px;

      .username {
        font-size: 32px;
        font-weight: 700;
        margin: 0 0 8px 0;
        color: white;
      }

      .user-id {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1px;
    background: rgba(255, 255, 255, 0.2);
    border-top: 1px solid rgba(255, 255, 255, 0.2);

    .stat-card {
      background: white;
      padding: 24px;
      text-align: center;
      transition: all 0.3s ease;

      &.clickable {
        cursor: pointer;

        &:hover {
          background: #f8f9fa;
          transform: translateY(-2px);

          .stat-value {
            color: #667eea;
          }
        }
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 8px;
        transition: color 0.3s ease;
      }

      .stat-label {
        font-size: 14px;
        color: #7f8c8d;
      }
    }
  }
}

.posts-section {
  .section-title {
    font-size: 24px;
    font-weight: 700;
    color: #2c3e50;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;

    i {
      font-size: 28px;
    }
  }

  .posts-list {
    min-height: 400px;

    .post-item {
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
          .post-tags {
            margin-bottom: 8px;

            .tag {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
              margin-right: 8px;

              &.tag-top {
                background: #ff6b6b;
                color: white;
              }

              &.tag-hot {
                background: #ffa502;
                color: white;
              }
            }
          }

          .post-title {
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
            margin: 0 0 12px 0;
            line-height: 1.4;
          }

          .post-excerpt {
            font-size: 14px;
            color: #7f8c8d;
            line-height: 1.6;
            margin: 0;
          }
        }

        .post-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #ecf0f1;

          .post-time {
            font-size: 13px;
            color: #95a5a6;
          }

          .post-stats {
            display: flex;
            gap: 20px;

            .stat {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 14px;
              color: #7f8c8d;

              i {
                font-size: 16px;
              }
            }
          }
        }
      }
    }
  }
}
</style>
