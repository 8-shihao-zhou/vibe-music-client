<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPostList } from '@/api/community'
import { UserStore } from '@/stores/modules/user'

const userStore = UserStore()
const route = useRoute()
const router = useRouter()

// 分类选项
const categories = [
  { label: '全部', value: '' },
  { label: '创作分享', value: 'SHARE' },
  { label: '技术交流', value: 'TECH' },
  { label: '问答互助', value: 'QA' },
  { label: '灌水闲聊', value: 'CHAT' },
]

// 排序选项
const sortOptions = [
  { label: '最新', value: 'latest' },
  { label: '最热', value: 'hot' },
  { label: '浏览最多', value: 'view' },
]

// 状态
const loading = ref(false)
const postList = ref<any[]>([])
const currentCategory = ref('')
const currentSort = ref('latest')
const keyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取帖子列表
const fetchPosts = async () => {
  console.log('>>> [列表页] 开始获取帖子列表')
  loading.value = true
  try {
    const res = await getPostList({
      category: currentCategory.value,
      keyword: keyword.value,
      sortBy: currentSort.value,
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    })

    console.log('>>> [列表页] 帖子列表响应:', res)

    if (res.code === 0 && res.data) {
      // MyBatis-Plus的IPage返回的是records，不是items
      postList.value = res.data.records || []
      total.value = res.data.total || 0
      console.log('>>> [列表页] 帖子数量:', postList.value.length)
    } else if (res.code !== 0) {
      // 只在后端返回错误码时显示错误
      console.error('>>> [列表页] 获取帖子列表失败:', res.msg)
      ElMessage.error(res.msg || '获取帖子列表失败')
    }
  } catch (error) {
    // 网络错误或其他异常
    console.error('>>> [列表页] 获取帖子列表异常:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 切换分类
const handleCategoryChange = (category: string) => {
  currentCategory.value = category
  currentPage.value = 1
  fetchPosts()
}

// 切换排序
const handleSortChange = (sort: string) => {
  currentSort.value = sort
  currentPage.value = 1
  fetchPosts()
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchPosts()
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchPosts()
}

// 跳转到帖子详情
const goToDetail = (postId: number) => {
  console.log('>>> [列表页] 点击帖子，跳转到详情页, postId:', postId)
  router.push(`/community/${postId}`)
}

// 跳转到发布页面
const goToCreate = () => {
  if (!userStore.userInfo?.userId) {
    ElMessage.warning('请先登录')
    return
  }
  router.push('/community/create')
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

// 监听路由变化，从其他页面返回时刷新
watch(
  () => route.path,
  (newPath, oldPath) => {
    console.log('>>> [列表页路由监听] 路径变化:', oldPath, '->', newPath)
    // 当路由变为 /community 时刷新（从详情页或发布页返回）
    if (newPath === '/community' && oldPath && oldPath !== '/community') {
      console.log('>>> [列表页路由监听] 触发刷新')
      fetchPosts()
    }
  }
)

// 监听路由的完整路径（包括参数），用于检测从详情页返回
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    // 当从详情页 (/community/123) 返回到列表页 (/community) 时刷新
    if (
      newPath === '/community' &&
      oldPath &&
      oldPath.match(/^\/community\/\d+$/)
    ) {
      console.log('>>> [列表页] 从详情页返回，刷新列表')
      fetchPosts()
    }
  }
)

// 监听用户信息变化（切换账号时刷新）
watch(
  () => userStore.userInfo?.userId,
  (newUserId, oldUserId) => {
    if (newUserId !== oldUserId) {
      console.log('>>> [列表页用户监听] 用户切换:', oldUserId, '->', newUserId)
      fetchPosts()
    }
  }
)

// 初始化
onMounted(() => {
  fetchPosts()
})
</script>

<template>
  <div class="community-container">
    <!-- 头部 -->
    <div class="community-header">
      <div class="header-left">
        <h1 class="title">社区</h1>
        <p class="subtitle">分享你的创作，交流你的想法</p>
      </div>
      <div class="header-actions">
        <el-button
          class="drafts-btn"
          @click="router.push('/community/favorite')"
        >
          <i class="i-carbon-star mr-1" />
          我的收藏
        </el-button>
        <el-button class="drafts-btn" @click="router.push('/community/drafts')">
          <i class="i-carbon-document mr-1" />
          草稿箱
        </el-button>
        <el-button type="primary" class="create-btn" @click="goToCreate">
          <i class="i-carbon-add mr-1" />
          发布帖子
        </el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <!-- 分类 -->
      <div class="category-tabs">
        <div
          v-for="cat in categories"
          :key="cat.value"
          class="category-tab"
          :class="{ active: currentCategory === cat.value }"
          @click="handleCategoryChange(cat.value)"
        >
          {{ cat.label }}
        </div>
      </div>

      <!-- 搜索和排序 -->
      <div class="search-sort">
        <el-input
          v-model="keyword"
          placeholder="搜索帖子..."
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <i class="i-carbon-search" />
          </template>
        </el-input>

        <el-select
          v-model="currentSort"
          class="sort-select"
          @change="handleSortChange"
        >
          <el-option
            v-for="option in sortOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </div>
    </div>

    <!-- 帖子列表 -->
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
          <!-- 标题和标签 -->
          <div class="post-header">
            <div class="post-title-row">
              <span v-if="post.isTop" class="tag-top">置顶</span>
              <span v-if="post.isHot" class="tag-hot">热门</span>
              <h3 class="post-title">{{ post.title }}</h3>
            </div>
            <p class="post-excerpt">{{ post.content.substring(0, 150) }}...</p>
          </div>

          <!-- 底部信息 -->
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
                <span class="stat-label">浏览</span>
                {{ post.viewCount }}
              </span>
              <span class="stat-item">
                <i class="i-carbon-thumbs-up" />
                <span class="stat-label">点赞</span>
                {{ post.likeCount }}
              </span>
              <span class="stat-item">
                <i class="i-carbon-chat" />
                <span class="stat-label">评论</span>
                {{ post.commentCount }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && postList.length === 0"
        description="暂无帖子"
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
.community-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.community-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;

  .header-left {
    .title {
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 8px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;

    .drafts-btn {
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .create-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
      }
    }
  }
}

.filter-bar {
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  .category-tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;

    .category-tab {
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: var(--el-fill-color-light);
      color: var(--el-text-color-regular);

      &:hover {
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
      }

      &.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
    }
  }

  .search-sort {
    display: flex;
    gap: 12px;

    .search-input {
      flex: 1;
      max-width: 400px;
    }

    .sort-select {
      width: 120px;
    }
  }
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

        .author-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          border-radius: 8px;

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

            .stat-label {
              font-size: 13px;
              color: var(--el-text-color-regular);
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
