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

const fetchFavorites = async () => {
  loading.value = true
  try {
    const res = await getUserFavorites(currentPage.value, pageSize.value)
    if (res.code === 0 && res.data) {
      favoriteList.value = (res.data as any).records || res.data.items || []
      total.value = res.data.total || 0
    } else if (res.code !== 0) {
      ElMessage.error(res.message || '获取收藏列表失败')
    }
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchFavorites()
}

const goToDetail = (postId: number) => {
  router.push(`/community/${postId}`)
}

const goBack = () => {
  router.push('/community')
}

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)}天前`
  return date.toLocaleDateString()
}

watch(
  () => route.path,
  (newPath, oldPath) => {
    if (
      newPath === '/community/favorite' &&
      oldPath &&
      oldPath !== '/community/favorite'
    ) {
      fetchFavorites()
    }
  }
)

onActivated(() => {
  fetchFavorites()
})

onMounted(() => {
  fetchFavorites()
})
</script>

<template>
  <div class="favorites-container">
    <section class="favorites-hero">
      <div class="hero-copy">
        <el-button class="back-btn" @click="goBack">
          <i class="i-carbon-arrow-left mr-1" />
          返回社区
        </el-button>
        <p class="hero-kicker">Community Archive</p>
        <h1 class="title">我的收藏</h1>
        <p class="hero-desc">
          把真正想反复回看的帖子整理到这里，灵感、经验和喜欢的表达都能更快找回。
        </p>
        <div class="hero-stats">
          <div class="stat-card">
            <span class="stat-label">当前页收藏</span>
            <strong>{{ favoriteList.length }}</strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">累计收藏</span>
            <strong>{{ total }}</strong>
          </div>
        </div>
      </div>

      <div class="hero-panel">
        <div class="panel-badge">精选回看</div>
        <div class="panel-title">
          {{ favoriteList[0]?.title || '把喜欢的内容沉淀成自己的灵感库' }}
        </div>
        <p class="panel-text">
          {{
            favoriteList[0]?.content?.substring(0, 90) ||
            '看到值得保存的帖子时点一下收藏，这里会帮你安静地整理好。'
          }}
        </p>
      </div>
    </section>

    <section v-loading="loading" class="favorites-list">
      <div
        v-for="post in favoriteList"
        :key="post.id"
        class="post-card"
        @click="goToDetail(post.id)"
      >
        <div v-if="post.coverUrl" class="post-cover">
          <img :src="post.coverUrl" alt="封面" />
        </div>

        <div class="post-content">
          <div class="post-header">
            <div class="post-title-row">
              <span v-if="post.isTop" class="tag-top">置顶</span>
              <span v-if="post.isHot" class="tag-hot">热门</span>
              <h3 class="post-title">{{ post.title }}</h3>
            </div>
            <p class="post-excerpt">
              {{ (post.content || '').substring(0, 150)
              }}{{ (post.content || '').length > 150 ? '...' : '' }}
            </p>
          </div>

          <div class="post-footer">
            <div class="author-info">
              <img :src="post.userAvatar || '/src/assets/user.jpg'" class="avatar" />
              <span class="username">{{ post.username }}</span>
              <span class="time">{{ formatTime(post.createTime) }}</span>
            </div>

            <div class="post-stats">
              <span class="stat-item">
                <i class="i-carbon-view" />
                <span class="stat-label">浏览</span>
                <span class="stat-value">{{ post.viewCount }}</span>
              </span>
              <span class="stat-item">
                <i class="i-carbon-thumbs-up" />
                <span class="stat-label">点赞</span>
                <span class="stat-value">{{ post.likeCount }}</span>
              </span>
              <span class="stat-item">
                <i class="i-carbon-chat" />
                <span class="stat-label">评论</span>
                <span class="stat-value">{{ post.commentCount }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <el-empty
        v-if="!loading && favoriteList.length === 0"
        description="还没有收藏帖子"
      >
        <el-button type="primary" @click="goBack">去社区看看</el-button>
      </el-empty>
    </section>

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

.favorites-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 360px);
  gap: 24px;
  margin-bottom: 28px;
  padding: 28px;
  border-radius: 30px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 40%),
    linear-gradient(135deg, rgba(255, 236, 238, 0.96), rgba(236, 245, 255, 0.92));
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 22px 50px rgba(209, 92, 97, 0.12);
}

.favorites-hero::after {
  content: '';
  position: absolute;
  right: -70px;
  top: -70px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(229, 107, 111, 0.18), transparent 70%);
}

.hero-copy,
.hero-panel {
  position: relative;
  z-index: 1;
}

.back-btn {
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(217, 92, 97, 0.18);
  background: rgba(255, 255, 255, 0.8);
  color: #9e5258;
}

.hero-kicker {
  margin: 14px 0 10px;
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #b85d62;
}

.title {
  margin: 0;
  font-size: 34px;
  font-weight: 700;
  color: #2f3447;
}

.hero-desc {
  max-width: 620px;
  margin: 12px 0 18px;
  font-size: 15px;
  line-height: 1.8;
  color: #6a7287;
}

.hero-stats {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.stat-card {
  min-width: 140px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 10px 20px rgba(47, 52, 71, 0.06);
}

.stat-label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #7b8399;
}

.stat-card strong {
  font-size: 28px;
  color: #2f3447;
}

.hero-panel {
  align-self: stretch;
  padding: 22px;
  border-radius: 24px;
  background: linear-gradient(160deg, rgba(229, 107, 111, 0.92), rgba(244, 138, 122, 0.88));
  color: #fff;
  box-shadow: 0 18px 36px rgba(229, 107, 111, 0.24);
}

.panel-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.panel-title {
  margin: 18px 0 12px;
  font-size: 22px;
  line-height: 1.5;
  font-weight: 700;
}

.panel-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.88);
}

.favorites-list {
  min-height: 400px;
  padding: 8px 0;
}

.post-card {
  display: flex;
  gap: 20px;
  padding: 22px;
  margin-bottom: 16px;
  border-radius: 24px;
  border: 1px solid rgba(233, 236, 245, 0.9);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(250, 251, 255, 0.94));
  box-shadow: 0 14px 32px rgba(31, 41, 55, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 38px rgba(217, 92, 97, 0.14);
  border-color: rgba(217, 92, 97, 0.18);
}

.post-cover {
  width: 200px;
  height: 150px;
  border-radius: 18px;
  overflow: hidden;
  flex-shrink: 0;
}

.post-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.post-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tag-top,
.tag-hot {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.tag-top {
  background: #f56c6c;
}

.tag-hot {
  background: #e6a23c;
}

.post-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2f3447;
}

.post-excerpt {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #6b7280;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #2f3447;
}

.time {
  font-size: 12px;
  color: #8a93a8;
}

.post-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.stat-item {
  display: inline-grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  align-items: center;
  justify-content: center;
  column-gap: 6px;
  padding: 0 14px;
  min-width: 112px;
  height: 42px;
  border-radius: 999px;
  font-size: 13px;
  color: #5f6d86;
  background: rgba(247, 249, 253, 0.98);
  border: 1px solid rgba(220, 227, 240, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  text-align: center;
  line-height: 1;
  vertical-align: middle;
  white-space: nowrap;
}

.stat-item i {
  font-size: 16px;
  color: #d95c61;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  line-height: 1;
}

.stat-item .stat-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  min-width: 30px;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #6a7892;
  line-height: 1;
}

.stat-item .stat-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  min-width: 18px;
  margin: 0;
  font-size: 13px;
  line-height: 1;
  font-weight: 600;
  color: #4b5a76;
  font-variant-numeric: tabular-nums;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

@media (max-width: 900px) {
  .favorites-hero {
    grid-template-columns: 1fr;
    padding: 22px;
  }

  .post-card {
    flex-direction: column;
  }

  .post-cover {
    width: 100%;
    height: 210px;
  }

  .post-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
