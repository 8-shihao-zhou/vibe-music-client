<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPostList, getHotTags } from '@/api/community'
import { getBanner } from '@/api/system'
import { UserStore } from '@/stores/modules/user'

const userStore = UserStore()
const route = useRoute()
const router = useRouter()

// 轮播图
const banners = ref<any[]>([])
const loadingBanners = ref(false)

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
const hotPosts = ref<any[]>([])
const currentCategory = ref('')
const currentSort = ref('latest')
const keyword = ref('')
const selectedTag = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const hotTags = ref<any[]>([])

// 获取轮播图
const fetchBanners = async () => {
  loadingBanners.value = true
  try {
    const res = await getBanner()
    console.log('>>> [轮播图] 获取轮播图响应:', res)
    if (res.code === 0 && res.data) {
      // 直接使用所有轮播图数据，不过滤status（因为后端返回的数据已经是启用的）
      banners.value = res.data as any[]
      console.log('>>> [轮播图] 轮播图数量:', banners.value.length)
    }
  } catch (error) {
    console.error('获取轮播图失败:', error)
  } finally {
    loadingBanners.value = false
  }
}

// 获取热门推荐帖子
const fetchHotPosts = async () => {
  try {
    const res = await getPostList({
      sortBy: 'hot',
      pageNum: 1,
      pageSize: 3, // 只显示前3名
    })
    if (res.code === 0 && res.data) {
      hotPosts.value = res.data.records || []
    }
  } catch (error) {
    console.error('获取热门帖子失败:', error)
  }
}

// 获取帖子列表
const fetchPosts = async () => {
  console.log('>>> [列表页] 开始获取帖子列表')
  loading.value = true
  try {
    const res = await getPostList({
      category: currentCategory.value,
      keyword: keyword.value,
      tag: selectedTag.value,
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

// 获取热门标签
const fetchHotTags = async () => {
  try {
    const res = await getHotTags(10)
    if (res.code === 0 && res.data) {
      hotTags.value = res.data as any[]
    }
  } catch (error) {
    console.error('获取热门标签失败:', error)
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

// 选择标签
const handleTagSelect = (tagName: string) => {
  selectedTag.value = tagName
  currentPage.value = 1
  fetchPosts()
}

// 清除标签筛选
const clearTagFilter = () => {
  selectedTag.value = ''
  currentPage.value = 1
  fetchPosts()
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  router.push({
    path: '/community',
    query: {
      ...(selectedTag.value ? { tag: selectedTag.value } : {}),
      ...(keyword.value ? { query: keyword.value } : {}),
    },
  })
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

watch(
  () => route.query.tag,
  (newTag) => {
    selectedTag.value = typeof newTag === 'string' ? newTag : ''
    currentPage.value = 1
    fetchPosts()
  }
)

watch(
  () => route.query.query,
  (newQuery) => {
    keyword.value = typeof newQuery === 'string' ? newQuery : ''
    currentPage.value = 1
    fetchPosts()
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
  // 从URL参数获取标签筛选
  const tagParam = route.query.tag as string
  const queryParam = route.query.query as string
  if (tagParam) {
    selectedTag.value = tagParam
  }
  if (queryParam) {
    keyword.value = queryParam
  }
  fetchBanners()
  fetchPosts()
  fetchHotPosts()
  fetchHotTags()
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

    <!-- 轮播图和热门推荐区域 -->
    <div class="banner-hot-section">
      <!-- 轮播图 -->
      <div class="banner-container">
        <el-carousel v-if="banners.length > 0" height="300px" :interval="5000">
          <el-carousel-item v-for="banner in banners" :key="banner.bannerId">
            <div
              class="banner-item"
              @click="banner.linkUrl && window.open(banner.linkUrl)"
            >
              <img :src="banner.bannerUrl" :alt="banner.title || '轮播图'" />
              <div
                v-if="banner.title || banner.description"
                class="banner-overlay"
              >
                <h3 v-if="banner.title" class="banner-title">
                  {{ banner.title }}
                </h3>
                <p v-if="banner.description" class="banner-desc">
                  {{ banner.description }}
                </p>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
        <div v-else class="banner-placeholder">
          <i class="i-carbon-image" />
          <p>暂无轮播图</p>
        </div>
      </div>

      <!-- 热门推荐 -->
      <div class="hot-recommend">
        <div class="hot-header">
          <i class="i-carbon-fire" />
          <span>热门推荐</span>
        </div>
        <div v-if="hotPosts.length > 0" class="hot-list">
          <div
            v-for="(post, index) in hotPosts"
            :key="post.id"
            class="hot-item"
            @click="goToDetail(post.id)"
          >
            <span class="hot-rank" :class="`rank-${index + 1}`">{{
              index + 1
            }}</span>
            <div class="hot-content">
              <h4 class="hot-title">{{ post.title }}</h4>
              <div class="hot-stats">
                <span
                  ><i class="i-carbon-view" /> 浏览 {{ post.viewCount }}</span
                >
                <span
                  ><i class="i-carbon-thumbs-up" /> 点赞
                  {{ post.likeCount }}</span
                >
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无热门帖子" :image-size="80" />
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

      <!-- 热门标签 -->
      <div v-if="hotTags.length > 0" class="hot-tags-section">
        <div class="section-header">
          <span class="section-title">
            <i class="i-carbon-tag mr-1" />
            热门标签
          </span>
          <div v-if="selectedTag" class="tag-filter-status">
            <span class="status-label">当前筛选</span>
            <strong># {{ selectedTag }}</strong>
          </div>
        </div>
        <div class="hot-tags">
          <div
            class="tag-item tag-item-all"
            :class="{ active: !selectedTag }"
            @click="clearTagFilter"
          >
            <i class="i-carbon-grid mr-1" />
            全部
          </div>
          <div
            v-for="tag in hotTags"
            :key="tag.tagName"
            class="tag-item"
            :class="{ active: selectedTag === tag.tagName }"
            @click="handleTagSelect(tag.tagName)"
          >
            # {{ tag.tagName }}
            <span class="tag-count">{{ tag.postCount }}</span>
          </div>
          <div
            v-if="selectedTag"
            class="tag-item clear-tag"
            @click="clearTagFilter"
          >
            <i class="i-carbon-close" />
            清除筛选
          </div>
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
        v-for="(post, index) in postList"
        :key="post.id"
        class="post-card"
        :class="[
          'post-enter',
          { 'post-highlight': post.isHighlight },
          post.postTheme ? `post-theme-${post.postTheme}` : '',
        ]"
        :style="{ '--enter-delay': `${Math.min(index, 10) * 70}ms` }"
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
              <span v-if="post.isHot" class="tag-hot">热门</span>
              <h3 class="post-title">{{ post.title }}</h3>
              <div
                class="right-badges"
                style="
                  display: flex;
                  gap: 8px;
                  margin-left: auto;
                  align-items: center;
                "
              >
                <!-- 等级标签 -->
                <span
                  v-if="post.levelName"
                  :class="['level-tag-badge', 'level-' + (post.level || 1)]"
                >
                  Lv.{{ post.level || 1 }} {{ post.levelName }}
                </span>
                <span v-if="post.isTop" class="tag-top-badge">
                  <i class="i-carbon-up-to-top" />
                  置顶
                </span>
                <span v-if="post.isHighlight" class="tag-highlight">
                  <i class="i-carbon-star-filled" />
                  高亮
                </span>
              </div>
            </div>
            <p class="post-excerpt">
              {{ (post.content || '').substring(0, 150)
              }}{{ (post.content || '').length > 150 ? '...' : '' }}
            </p>
            <!-- 帖子标签 -->
            <div v-if="post.tags" class="post-tags">
              <span
                v-for="(tag, index) in JSON.parse(post.tags || '[]')"
                :key="index"
                class="post-tag"
                @click.stop="handleTagSelect(tag)"
              >
                # {{ tag }}
              </span>
            </div>
          </div>

          <!-- 底部信息 -->
          <div class="post-footer">
            <div class="author-info">
              <div
                :class="[
                  'avatar-container',
                  post.avatarFrame ? `frame-${post.avatarFrame}` : '',
                ]"
              >
                <img
                  :src="post.userAvatar || '/src/assets/user.jpg'"
                  class="avatar"
                />
              </div>
              <span
                class="username"
                :style="
                  post.nicknameColor && post.nicknameColor !== 'default'
                    ? {
                        background: post.nicknameColor.startsWith('linear')
                          ? post.nicknameColor
                          : 'none',
                        color: post.nicknameColor.startsWith('linear')
                          ? 'transparent'
                          : post.nicknameColor,
                        WebkitBackgroundClip: post.nicknameColor.startsWith(
                          'linear'
                        )
                          ? 'text'
                          : 'border-box',
                      }
                    : {}
                "
                >{{ post.username }}</span
              >
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

  .hot-tags-section {
    margin-bottom: 16px;
    padding: 16px;
    background: rgba(102, 126, 234, 0.05);
    border-radius: 12px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .section-copy {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        display: flex;
        align-items: center;

        i {
          color: #667eea;
        }
      }

      .section-subtitle {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        line-height: 1.6;
      }

      .tag-filter-status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(102, 126, 234, 0.1);
        color: #4f5fcf;
        font-size: 12px;
        font-weight: 600;
      }
    }

    .hot-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .tag-item {
        padding: 6px 14px;
        border-radius: 16px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: white;
        color: var(--el-text-color-regular);
        border: 1px solid var(--el-border-color);
        display: flex;
        align-items: center;
        gap: 6px;

        &:hover {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
        }

        &.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        &.clear-tag {
          background: #f56c6c;
          color: white;
          border-color: transparent;

          &:hover {
            background: #f78989;
          }
        }

        &.tag-item-all {
          font-weight: 600;
        }

        .tag-count {
          font-size: 12px;
          opacity: 0.8;
        }
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
    position: relative;
    overflow: hidden;
    isolation: isolate;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
    }

    &.post-highlight {
      border: 2px solid #f6c90e;
      box-shadow:
        0 0 12px rgba(246, 201, 14, 0.4),
        0 4px 20px rgba(246, 201, 14, 0.2);

      &:hover {
        box-shadow:
          0 0 20px rgba(246, 201, 14, 0.6),
          0 8px 32px rgba(246, 201, 14, 0.3);
      }
    }

    &.post-theme-starry {
      background: radial-gradient(
          circle at 15% 20%,
          rgba(120, 232, 255, 0.35),
          transparent 28%
        ),
        radial-gradient(
          circle at 80% 25%,
          rgba(255, 120, 240, 0.32),
          transparent 30%
        ),
        radial-gradient(
          circle at 55% 80%,
          rgba(120, 160, 255, 0.35),
          transparent 32%
        ),
        radial-gradient(
          circle at 35% 55%,
          rgba(255, 200, 110, 0.2),
          transparent 26%
        ),
        linear-gradient(
          130deg,
          #090b1f 0%,
          #161235 30%,
          #312060 62%,
          #12284c 100%
        );
      background-size:
        220% 220%,
        200% 200%,
        210% 210%,
        180% 180%,
        260% 260%;
      animation: postStarNebulaShift 5.2s ease-in-out infinite;
      border: 1px solid rgba(125, 188, 255, 0.4);
      box-shadow:
        inset 0 0 0 1px rgba(190, 235, 255, 0.12),
        0 0 22px rgba(92, 148, 255, 0.25);
      color: #eef3ff;
      &::before {
        content: '';
        position: absolute;
        inset: -40%;
        background: radial-gradient(
            circle at 8% 14%,
            rgba(255, 255, 255, 0.95) 0 2px,
            transparent 3px
          ),
          radial-gradient(
            circle at 20% 70%,
            rgba(180, 220, 255, 0.85) 0 1.8px,
            transparent 2.8px
          ),
          radial-gradient(
            circle at 33% 28%,
            rgba(255, 255, 255, 0.95) 0 1.6px,
            transparent 2.6px
          ),
          radial-gradient(
            circle at 46% 86%,
            rgba(255, 220, 255, 0.8) 0 2px,
            transparent 3px
          ),
          radial-gradient(
            circle at 62% 18%,
            rgba(255, 255, 255, 0.9) 0 1.7px,
            transparent 2.7px
          ),
          radial-gradient(
            circle at 75% 52%,
            rgba(170, 255, 240, 0.86) 0 2px,
            transparent 3px
          ),
          radial-gradient(
            circle at 88% 78%,
            rgba(255, 255, 255, 0.92) 0 1.8px,
            transparent 2.8px
          );
        background-size: 100% 100%;
        animation: postStarFieldMove 4.2s linear infinite;
        opacity: 1;
        z-index: 0;
      }
      &::after {
        content: '';
        position: absolute;
        inset: -15% -20%;
        background: linear-gradient(
            115deg,
            transparent 20%,
            rgba(255, 255, 255, 0.85) 22%,
            rgba(130, 220, 255, 0.7) 24%,
            transparent 27%
          ),
          linear-gradient(
            116deg,
            transparent 48%,
            rgba(255, 180, 255, 0.82) 50%,
            rgba(255, 255, 255, 0.9) 52%,
            transparent 54%
          ),
          linear-gradient(
            116deg,
            transparent 70%,
            rgba(140, 170, 255, 0.85) 72%,
            rgba(255, 255, 255, 0.95) 74%,
            transparent 76%
          );
        animation:
          postMeteorRain 2.1s linear infinite,
          postLightSweep 2s ease-in-out infinite;
        z-index: 0;
      }
      .post-title {
        color: #eef3ff !important;
      }
      .post-excerpt,
      .time,
      .stat-item,
      .stat-label {
        color: rgba(238, 243, 255, 0.78) !important;
      }
      .post-cover::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 12px;
        border: 1px solid rgba(177, 232, 255, 0.44);
        box-shadow: inset 0 0 20px rgba(126, 196, 255, 0.24);
        animation: postEnergyPulse 1.6s ease-in-out infinite;
      }
      &:hover {
        box-shadow:
          inset 0 0 0 1px rgba(220, 245, 255, 0.24),
          0 0 40px rgba(116, 177, 255, 0.4),
          0 0 80px rgba(130, 90, 255, 0.25);
        filter: saturate(1.18);
      }
    }

    &.post-theme-sakura {
      background: linear-gradient(
          125deg,
          rgba(255, 255, 255, 0.38),
          rgba(255, 255, 255, 0.12)
        ),
        conic-gradient(
          from 45deg at 20% 22%,
          rgba(255, 150, 210, 0.28),
          rgba(255, 215, 240, 0.2),
          rgba(255, 130, 195, 0.34),
          rgba(255, 150, 210, 0.28)
        ),
        radial-gradient(
          circle at 20% 20%,
          rgba(255, 158, 211, 0.42),
          transparent 35%
        ),
        radial-gradient(
          circle at 85% 75%,
          rgba(255, 220, 180, 0.38),
          transparent 36%
        ),
        linear-gradient(
          130deg,
          #ffb6da 0%,
          #ffa7cf 25%,
          #ffbfdf 52%,
          #ffd7ec 75%,
          #ffe4f5 100%
        );
      background-size:
        210% 210%,
        220% 220%,
        180% 180%,
        170% 170%,
        230% 230%;
      animation:
        postSakuraBloom 3.2s ease-in-out infinite,
        postSakuraDrift 6.5s linear infinite;
      border: 1px solid rgba(255, 145, 210, 0.45);
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.2),
        0 0 24px rgba(255, 140, 210, 0.28);
      &::before {
        content: '';
        position: absolute;
        inset: -20%;
        background: radial-gradient(
            ellipse 18px 11px at 8% 18%,
            rgba(255, 255, 255, 0.65),
            transparent 68%
          ),
          radial-gradient(
            ellipse 16px 10px at 18% 62%,
            rgba(255, 185, 222, 0.68),
            transparent 68%
          ),
          radial-gradient(
            ellipse 14px 9px at 30% 35%,
            rgba(255, 214, 236, 0.66),
            transparent 68%
          ),
          radial-gradient(
            ellipse 18px 12px at 43% 80%,
            rgba(255, 166, 212, 0.72),
            transparent 68%
          ),
          radial-gradient(
            ellipse 15px 10px at 58% 20%,
            rgba(255, 255, 255, 0.62),
            transparent 68%
          ),
          radial-gradient(
            ellipse 20px 12px at 72% 56%,
            rgba(255, 175, 216, 0.72),
            transparent 68%
          ),
          radial-gradient(
            ellipse 15px 9px at 84% 32%,
            rgba(255, 230, 242, 0.66),
            transparent 68%
          ),
          radial-gradient(
            ellipse 18px 11px at 95% 74%,
            rgba(255, 158, 205, 0.72),
            transparent 68%
          ),
          radial-gradient(
            ellipse 22px 13px at 12% 88%,
            rgba(255, 190, 230, 0.72),
            transparent 68%
          ),
          radial-gradient(
            ellipse 14px 8px at 65% 8%,
            rgba(255, 235, 246, 0.7),
            transparent 68%
          );
        animation:
          postPetalFloat 2.3s ease-in-out infinite,
          postPetalStorm 1.45s linear infinite,
          postPetalTwirl 1.9s ease-in-out infinite;
        opacity: 1;
        z-index: 0;
      }
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(
            circle at 78% 15%,
            rgba(255, 255, 255, 0.7),
            transparent 42%
          ),
          radial-gradient(
            circle at 20% 85%,
            rgba(255, 190, 225, 0.55),
            transparent 45%
          ),
          linear-gradient(
            135deg,
            transparent 20%,
            rgba(255, 255, 255, 0.25) 50%,
            transparent 80%
          ),
          repeating-linear-gradient(
            145deg,
            rgba(255, 170, 220, 0.24) 0 8px,
            rgba(255, 255, 255, 0) 8px 22px
          );
        animation:
          postGlowPulse 1s ease-in-out infinite,
          postSakuraColorShift 1.8s linear infinite,
          postSakuraRibbon 2s linear infinite;
        z-index: 0;
      }
      .post-cover::after {
        content: '';
        position: absolute;
        inset: 6px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.45);
        box-shadow: inset 0 0 12px rgba(255, 166, 212, 0.25);
      }
      .post-title {
        color: #7b2b60 !important;
      }
      .post-excerpt,
      .time,
      .stat-item,
      .stat-label {
        color: rgba(118, 44, 94, 0.78) !important;
      }
      .post-cover::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 12px;
        border: 1px solid rgba(255, 190, 226, 0.6);
        box-shadow: inset 0 0 20px rgba(255, 145, 210, 0.3);
        animation: postEnergyPulse 1.4s ease-in-out infinite;
      }
      &:hover {
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.38),
          0 0 34px rgba(255, 150, 210, 0.45),
          0 0 64px rgba(255, 190, 232, 0.3);
        filter: saturate(1.26);
      }
    }

    &.post-theme-neon {
      background: linear-gradient(
        135deg,
        #0b1020 0%,
        #1a0e2a 28%,
        #132d4f 55%,
        #2d0f45 100%
      );
      border: 1px solid rgba(0, 245, 255, 0.55);
      box-shadow:
        inset 0 0 0 1px rgba(255, 0, 255, 0.3),
        0 0 24px rgba(0, 245, 255, 0.28);
      background-size: 180% 180%;
      color: #ddf8ff;
      animation:
        postNeonPulse 1.2s ease-in-out infinite,
        postNeonHueRotate 3.5s linear infinite,
        postNeonBgShift 2.3s ease-in-out infinite;
      .post-cover::after {
        content: '';
        position: absolute;
        inset: 4px;
        border-radius: 10px;
        border: 1px solid rgba(0, 245, 255, 0.52);
        box-shadow:
          inset 0 0 12px rgba(0, 245, 255, 0.25),
          0 0 16px rgba(255, 0, 255, 0.24);
      }
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          130deg,
          rgba(0, 245, 255, 0.08) 0 10px,
          rgba(255, 0, 255, 0.08) 10px 20px
        );
        mix-blend-mode: screen;
        animation: postNeonShift 2s linear infinite;
        z-index: 0;
      }
      &::after {
        content: '';
        position: absolute;
        inset: -35% 0;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(0, 245, 255, 0.26) 35%,
          rgba(255, 0, 255, 0.2) 55%,
          transparent 100%
        );
        animation: postLaserScan 1.35s linear infinite;
        z-index: 0;
      }
      .post-title {
        color: #ddf8ff !important;
      }
      .post-excerpt,
      .time,
      .stat-item,
      .stat-label {
        color: rgba(221, 248, 255, 0.8) !important;
      }
      .post-cover::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 12px;
        border: 1px solid rgba(0, 245, 255, 0.65);
        box-shadow:
          inset 0 0 18px rgba(0, 245, 255, 0.3),
          0 0 14px rgba(255, 0, 255, 0.2);
        animation: postEnergyRotate 2.2s linear infinite;
      }
      &:hover {
        box-shadow:
          inset 0 0 0 1px rgba(255, 0, 255, 0.42),
          0 0 44px rgba(0, 245, 255, 0.45),
          0 0 82px rgba(255, 0, 255, 0.3);
      }
    }

    &.post-theme-lava {
      background: linear-gradient(
        135deg,
        #2a0d08 0%,
        #5e1a0f 30%,
        #a33816 58%,
        #ff7b1a 78%,
        #6b1f12 100%
      );
      border: 1px solid rgba(255, 160, 0, 0.5);
      box-shadow: 0 0 20px rgba(255, 94, 0, 0.2);
      background-size: 200% 200%;
      color: #ffe9d9;
      animation:
        postLavaPulse 1.15s ease-in-out infinite,
        postLavaBgShift 1.9s ease-in-out infinite,
        postLavaShake 0.95s ease-in-out infinite;
      &::before {
        content: '';
        position: absolute;
        inset: -30% -10%;
        background: radial-gradient(
            circle at 20% 30%,
            rgba(255, 180, 70, 0.32),
            transparent 40%
          ),
          radial-gradient(
            circle at 70% 70%,
            rgba(255, 90, 20, 0.34),
            transparent 45%
          ),
          radial-gradient(
            circle at 50% 45%,
            rgba(255, 230, 120, 0.2),
            transparent 40%
          ),
          radial-gradient(
            circle at 85% 18%,
            rgba(255, 140, 30, 0.4),
            transparent 34%
          ),
          radial-gradient(
            circle at 14% 78%,
            rgba(255, 210, 90, 0.36),
            transparent 36%
          );
        animation:
          postLavaFlow 1.5s ease-in-out infinite,
          postLavaBurst 1.3s ease-in-out infinite;
        z-index: 0;
      }
      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
            110deg,
            transparent 0%,
            rgba(255, 200, 80, 0.16) 48%,
            transparent 100%
          ),
          repeating-linear-gradient(
            165deg,
            rgba(255, 120, 20, 0.22) 0 4px,
            rgba(255, 60, 0, 0) 4px 16px
          );
        transform: translateX(-110%);
        animation:
          postLightSweep 1.2s ease-in-out infinite,
          postLavaCrackFlicker 0.75s linear infinite;
        z-index: 0;
      }
      .post-cover::after {
        content: '';
        position: absolute;
        inset: 5px;
        border-radius: 10px;
        border: 1px solid rgba(255, 196, 120, 0.55);
        box-shadow:
          inset 0 0 16px rgba(255, 120, 10, 0.35),
          0 0 20px rgba(255, 90, 0, 0.26);
      }
      .post-title {
        color: #ffe9d9 !important;
      }
      .post-excerpt,
      .time,
      .stat-item,
      .stat-label {
        color: rgba(255, 233, 217, 0.78) !important;
      }
      .post-cover::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 12px;
        border: 1px solid rgba(255, 183, 110, 0.72);
        box-shadow:
          inset 0 0 24px rgba(255, 134, 24, 0.36),
          0 0 16px rgba(255, 98, 0, 0.28);
        animation: postEnergyPulse 0.95s ease-in-out infinite;
      }
      &:hover {
        box-shadow:
          inset 0 0 0 1px rgba(255, 210, 140, 0.35),
          0 0 44px rgba(255, 122, 25, 0.52),
          0 0 90px rgba(255, 72, 0, 0.32);
        filter: saturate(1.32);
      }
    }

    .post-cover,
    .post-content {
      position: relative;
      z-index: 1;
    }

    &.post-enter {
      .post-cover {
        animation: postEnterCover 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
        animation-delay: var(--enter-delay, 0ms);
      }
      .post-content {
        animation: postEnterContent 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
        animation-delay: calc(var(--enter-delay, 0ms) + 70ms);
      }
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

          .tag-hot {
            flex-shrink: 0;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }

          .tag-hot {
            background: #e6a23c;
            color: white;
          }

          .post-title {
            flex: 1;
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            color: var(--el-text-color-primary);
          }

          .tag-top-badge {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            background: linear-gradient(135deg, #ff758c, #ff7eb3);
            color: white;
            box-shadow: 0 2px 8px rgba(255, 117, 140, 0.4);
            letter-spacing: 0.5px;
          }

          .level-tag-badge {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            font-style: italic;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

            &.level-1 {
              background: #f4f4f5;
              color: #909399;
              border: 1px solid #e9e9eb;
            }
            &.level-2 {
              background: #e1f3d8;
              color: #67c23a;
              border: 1px solid #e1f3d8;
            }
            &.level-3 {
              background: #d9ecff;
              color: #409eff;
              border: 1px solid #d9ecff;
            }
            &.level-4 {
              background: #faecd8;
              color: #e6a23c;
              border: 1px solid #faecd8;
            }
            &.level-5 {
              background: linear-gradient(45deg, #f56c6c, #e6a23c);
              color: white;
              border: none;
              box-shadow: 0 2px 8px rgba(245, 108, 108, 0.4);
            }
          }

          .tag-highlight {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            background: linear-gradient(135deg, #f6c90e, #ff9a3c);
            color: white;
            box-shadow: 0 2px 8px rgba(246, 201, 14, 0.4);
            letter-spacing: 0.5px;
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

          .avatar-container {
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;

            &.frame-gold {
              &::after {
                content: '';
                position: absolute;
                top: -4px;
                left: -4px;
                right: -4px;
                bottom: -4px;
                border: 2px solid #ffd700;
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
              }
            }

            &.frame-rainbow {
              &::after {
                content: '';
                position: absolute;
                top: -4px;
                left: -4px;
                right: -4px;
                bottom: -4px;
                border-radius: 50%;
                background: linear-gradient(
                  45deg,
                  #ff0000,
                  #ff7f00,
                  #ffff00,
                  #00ff00,
                  #0000ff,
                  #4b0082,
                  #8b00ff
                );
                -webkit-mask:
                  linear-gradient(#fff 0 0) content-box,
                  linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor;
                mask-composite: exclude;
                padding: 2px;
                animation: rotate 4s linear infinite;
              }
            }
          }

          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            z-index: 1;
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

@keyframes postStarFieldMove {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(-14px, -18px, 0) scale(1.03);
  }
  100% {
    transform: translate3d(-28px, -36px, 0) scale(1.06);
  }
}

@keyframes postStarNebulaShift {
  0%,
  100% {
    background-position:
      0% 0%,
      100% 0%,
      40% 100%,
      0% 50%,
      20% 80%;
  }
  50% {
    background-position:
      100% 100%,
      0% 100%,
      100% 0%,
      100% 50%,
      90% 10%;
  }
}

@keyframes postMeteorRain {
  0% {
    transform: translate3d(-16%, -14%, 0) scale(1);
    opacity: 0.45;
  }
  50% {
    transform: translate3d(8%, 8%, 0) scale(1.05);
    opacity: 1;
  }
  100% {
    transform: translate3d(20%, 18%, 0) scale(1.1);
    opacity: 0.5;
  }
}

@keyframes postLightSweep {
  0% {
    transform: translateX(-120%);
    opacity: 0;
  }
  22% {
    opacity: 0.7;
  }
  45% {
    opacity: 0.35;
  }
  100% {
    transform: translateX(120%);
    opacity: 0;
  }
}

@keyframes postPetalFloat {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  33% {
    transform: translate3d(-8px, -10px, 0) rotate(2deg);
  }
  66% {
    transform: translate3d(8px, 6px, 0) rotate(-2deg);
  }
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
}

@keyframes postPetalStorm {
  0% {
    transform: translate3d(-8px, -8px, 0) rotate(0deg);
  }
  50% {
    transform: translate3d(8px, 10px, 0) rotate(3deg);
  }
  100% {
    transform: translate3d(-8px, -8px, 0) rotate(0deg);
  }
}

@keyframes postPetalTwirl {
  0%,
  100% {
    filter: blur(0) saturate(1);
    transform: rotate(0deg) scale(1);
  }
  50% {
    filter: blur(0.2px) saturate(1.25);
    transform: rotate(2.4deg) scale(1.05);
  }
}

@keyframes postSakuraBloom {
  0%,
  100% {
    background-position:
      0% 20%,
      10% 15%,
      0% 50%,
      30% 30%,
      0% 50%;
    box-shadow: 0 2px 14px rgba(255, 160, 205, 0.26);
  }
  50% {
    background-position:
      100% 80%,
      95% 80%,
      100% 50%,
      80% 70%,
      100% 50%;
    box-shadow:
      0 8px 28px rgba(255, 120, 190, 0.35),
      0 0 40px rgba(255, 180, 220, 0.28);
  }
}

@keyframes postSakuraColorShift {
  0% {
    filter: hue-rotate(0deg) saturate(1);
  }
  50% {
    filter: hue-rotate(18deg) saturate(1.22);
  }
  100% {
    filter: hue-rotate(0deg) saturate(1);
  }
}

@keyframes postSakuraDrift {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  25% {
    transform: translate3d(-3px, -2px, 0);
  }
  50% {
    transform: translate3d(3px, 2px, 0);
  }
  75% {
    transform: translate3d(-2px, 3px, 0);
  }
}

@keyframes postSakuraRibbon {
  0% {
    background-position:
      0% 0%,
      0% 0%,
      0% 0%,
      0% 0%;
  }
  100% {
    background-position:
      0% 0%,
      0% 0%,
      0% 0%,
      140% 0%;
  }
}

@keyframes postHudFlicker {
  0%,
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
  22% {
    opacity: 0.6;
    transform: translate3d(0.6px, -0.4px, 0);
  }
  44% {
    opacity: 0.95;
    transform: translate3d(-0.8px, 0.5px, 0);
  }
  66% {
    opacity: 0.55;
    transform: translate3d(0.4px, 0.3px, 0);
  }
}

@keyframes postBadgeGlitch {
  0%,
  100% {
    transform: skewX(0deg);
    opacity: 0.95;
  }
  30% {
    transform: skewX(4deg);
    opacity: 0.7;
  }
  31% {
    transform: skewX(-4deg);
    opacity: 0.95;
  }
  55% {
    transform: skewX(0deg);
    opacity: 1;
  }
}

@keyframes postBadgeFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes postSakuraPetalFlash {
  0%,
  100% {
    box-shadow: 0 0 14px rgba(255, 150, 210, 0.42);
  }
  50% {
    box-shadow:
      0 0 24px rgba(255, 120, 198, 0.62),
      0 0 38px rgba(255, 180, 226, 0.34);
  }
}

@keyframes postEnergyRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes postEnergyPulse {
  0%,
  100% {
    opacity: 0.78;
  }
  50% {
    opacity: 1;
  }
}

@keyframes postEnterCover {
  0% {
    opacity: 0;
    transform: translate3d(-16px, 10px, 0) scale(0.94);
    filter: blur(6px);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    filter: blur(0);
  }
}

@keyframes postEnterContent {
  0% {
    opacity: 0;
    transform: translate3d(12px, 8px, 0);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    filter: blur(0);
  }
}

@keyframes postGlowPulse {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 0.85;
  }
}

@keyframes postNeonPulse {
  0%,
  100% {
    box-shadow:
      inset 0 0 0 1px rgba(255, 0, 255, 0.15),
      0 0 18px rgba(0, 245, 255, 0.18);
  }
  50% {
    box-shadow:
      inset 0 0 0 1px rgba(255, 0, 255, 0.3),
      0 0 26px rgba(0, 245, 255, 0.35),
      0 0 42px rgba(255, 0, 255, 0.22);
  }
}

@keyframes postNeonHueRotate {
  0% {
    filter: hue-rotate(0deg) saturate(1.05);
  }
  50% {
    filter: hue-rotate(22deg) saturate(1.35);
  }
  100% {
    filter: hue-rotate(0deg) saturate(1.05);
  }
}

@keyframes postNeonBgShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes postNeonShift {
  0% {
    transform: translateX(-6%);
  }
  50% {
    transform: translateX(6%);
  }
  100% {
    transform: translateX(-6%);
  }
}

@keyframes postLaserScan {
  0% {
    transform: translateX(-130%);
  }
  100% {
    transform: translateX(130%);
  }
}

@keyframes postLavaFlow {
  0% {
    transform: scale(1) translate3d(0, 0, 0);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.08) translate3d(8px, -4px, 0);
    opacity: 1;
  }
  100% {
    transform: scale(1) translate3d(0, 0, 0);
    opacity: 0.8;
  }
}

@keyframes postLavaBurst {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.75;
  }
  50% {
    transform: translate3d(6px, -6px, 0) scale(1.12);
    opacity: 1;
  }
}

@keyframes postLavaPulse {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(255, 94, 0, 0.22),
      inset 0 0 12px rgba(255, 180, 60, 0.1);
    filter: saturate(1);
  }
  50% {
    box-shadow:
      0 0 36px rgba(255, 90, 0, 0.45),
      0 0 54px rgba(255, 180, 20, 0.2),
      inset 0 0 24px rgba(255, 210, 90, 0.2);
    filter: saturate(1.22);
  }
}

@keyframes postLavaBgShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes postLavaCrackFlicker {
  0%,
  100% {
    opacity: 0.38;
  }
  50% {
    opacity: 0.85;
  }
}

@keyframes postLavaShake {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  25% {
    transform: translate3d(0.8px, -0.6px, 0);
  }
  50% {
    transform: translate3d(-0.9px, 0.7px, 0);
  }
  75% {
    transform: translate3d(0.6px, 0.4px, 0);
  }
}

@keyframes postLavaSpark {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translate3d(0, -2px, 0) scale(1.15);
    opacity: 1;
  }
}

@keyframes postLavaCoreFlash {
  0%,
  100% {
    box-shadow:
      0 0 14px rgba(255, 120, 0, 0.52),
      inset 0 0 10px rgba(255, 200, 100, 0.2);
  }
  50% {
    box-shadow:
      0 0 26px rgba(255, 90, 0, 0.72),
      0 0 42px rgba(255, 170, 65, 0.35),
      inset 0 0 18px rgba(255, 210, 120, 0.3);
  }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.banner-hot-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;

  .banner-container {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0.05)
    );

    .banner-item {
      position: relative;
      width: 100%;
      height: 300px;
      cursor: pointer;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      &:hover img {
        transform: scale(1.05);
      }

      .banner-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 24px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
        color: white;

        .banner-title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .banner-desc {
          font-size: 14px;
          margin: 0;
          opacity: 0.9;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
      }
    }

    .banner-placeholder {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--el-fill-color-light);
      border-radius: 16px;

      i {
        font-size: 64px;
        color: var(--el-text-color-placeholder);
        margin-bottom: 12px;
      }

      p {
        color: var(--el-text-color-secondary);
        margin: 0;
      }
    }
  }

  .hot-recommend {
    background: var(--el-bg-color);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

    .hot-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      color: var(--el-text-color-primary);

      i {
        font-size: 24px;
        color: #ff6b6b;
      }
    }

    .hot-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .hot-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: var(--el-fill-color-light);

        &:hover {
          background: rgba(102, 126, 234, 0.1);
          transform: translateX(4px);
        }

        .hot-rank {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 700;
          background: var(--el-fill-color);
          color: var(--el-text-color-secondary);

          &.rank-1 {
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #fff;
          }

          &.rank-2 {
            background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
            color: #fff;
          }

          &.rank-3 {
            background: linear-gradient(135deg, #cd7f32, #e8a87c);
            color: #fff;
          }
        }

        .hot-content {
          flex: 1;
          min-width: 0;

          .hot-title {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: var(--el-text-color-primary);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .hot-stats {
            display: flex;
            gap: 12px;
            font-size: 12px;
            color: var(--el-text-color-secondary);

            span {
              display: flex;
              align-items: center;
              gap: 4px;

              i {
                font-size: 14px;
              }
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .banner-hot-section {
    grid-template-columns: 1fr;

    .hot-recommend {
      .hot-list {
        flex-direction: row;
        overflow-x: auto;

        .hot-item {
          min-width: 250px;
        }
      }
    }
  }
}
</style>

<style scoped lang="scss">
.post-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;

  .post-tag {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(102, 126, 234, 0.2);
      transform: translateY(-1px);
    }
  }
}
</style>

<style scoped lang="scss">
.community-container {
  padding: 24px 24px 40px;
  background:
    radial-gradient(circle at top left, rgba(120, 196, 255, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(255, 196, 214, 0.14), transparent 24%);
}

.community-header {
  position: relative;
  padding: 28px 30px;
  margin-bottom: 28px;
  border: 1px solid rgba(138, 170, 255, 0.18);
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(248, 251, 255, 0.96), rgba(255, 248, 251, 0.94)),
    #fff;
  box-shadow:
    0 22px 48px rgba(82, 117, 184, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 999px;
    pointer-events: none;
  }

  &::before {
    top: -92px;
    right: -32px;
    width: 230px;
    height: 230px;
    background: radial-gradient(circle, rgba(134, 180, 255, 0.22), transparent 68%);
  }

  &::after {
    bottom: -100px;
    left: -24px;
    width: 240px;
    height: 240px;
    background: radial-gradient(circle, rgba(255, 183, 205, 0.2), transparent 70%);
  }

  .header-left,
  .header-actions {
    position: relative;
    z-index: 1;
  }

  .header-left {
    position: relative;
    max-width: 620px;

    &::before {
      content: 'Community Square';
      display: block;
      margin-bottom: 10px;
      font-size: 12px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #6f7fd6;
    }

    .title {
      font-size: 36px;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #2d5bba 0%, #5f84df 45%, #ee7f9d 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 15px;
      color: #66758f;
      line-height: 1.75;
      max-width: 560px;
      margin-bottom: 0;
    }

    &::after {
      content: '帖子总量 ' attr(data-total);
      display: none;
    }

    .title + .subtitle {
      position: relative;
      padding-bottom: 18px;
      margin-bottom: 18px;
    }

    .title + .subtitle::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 88px;
      height: 4px;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(95, 132, 223, 0.95), rgba(240, 142, 166, 0.9));
    }
  }

  .header-actions {
    gap: 14px;
    flex-wrap: wrap;

    .drafts-btn,
    .create-btn {
      min-height: 42px;
      padding: 0 18px;
      border-radius: 14px;
      font-weight: 600;
      border: 1px solid transparent;
    }

    .drafts-btn {
      color: #355486;
      border-color: rgba(121, 150, 209, 0.2);
      background: rgba(255, 255, 255, 0.88);
      box-shadow: 0 10px 22px rgba(130, 153, 193, 0.14);

      &:hover {
        color: #23457a;
        border-color: rgba(108, 146, 223, 0.34);
        background: #fff;
        box-shadow: 0 14px 26px rgba(98, 126, 178, 0.2);
      }
    }

    .create-btn {
      background: linear-gradient(135deg, #4f80e1 0%, #7e7ce8 55%, #f08ea6 100%);
      box-shadow: 0 16px 30px rgba(102, 125, 214, 0.28);

      &:hover {
        box-shadow: 0 18px 32px rgba(102, 125, 214, 0.34);
      }
    }
  }
}

.banner-hot-section {
  gap: 22px;
  margin-bottom: 28px;

  .banner-container,
  .hot-recommend {
    border: 1px solid rgba(145, 174, 232, 0.18);
    border-radius: 26px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 251, 255, 0.92)),
      #fff;
    box-shadow: 0 18px 40px rgba(81, 110, 170, 0.12);
  }

  .banner-container {
    padding: 12px;

    .banner-item,
    .banner-placeholder {
      border-radius: 20px;
    }

    .banner-overlay {
      padding: 28px;
      background: linear-gradient(to top, rgba(24, 35, 67, 0.84), rgba(24, 35, 67, 0.08));
    }
  }

  .hot-recommend {
    padding: 22px;

    .hot-header {
      margin-bottom: 18px;
      color: #243653;

      i {
        color: #ff8f63;
      }
    }

    .hot-list {
      gap: 14px;
    }

    .hot-item {
      padding: 14px;
      border: 1px solid rgba(142, 167, 218, 0.14);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(247, 250, 255, 0.96), rgba(255, 255, 255, 0.9));

      &:hover {
        background: linear-gradient(180deg, rgba(237, 244, 255, 0.96), rgba(249, 251, 255, 0.92));
        box-shadow: 0 12px 24px rgba(100, 128, 189, 0.14);
      }
    }
  }
}

.filter-bar {
  padding: 22px;
  margin-bottom: 28px;
  border: 1px solid rgba(142, 171, 228, 0.16);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 249, 255, 0.94)),
    #fff;
  box-shadow: 0 16px 34px rgba(89, 116, 172, 0.1);

  &::before {
    content: '内容筛选';
    display: block;
    margin-bottom: 6px;
    font-size: 18px;
    font-weight: 700;
    color: #273856;
  }

  &::after {
    content: '先按分类和标签缩小范围，再用搜索和排序快速定位感兴趣的帖子。';
    display: block;
    margin-bottom: 18px;
    font-size: 13px;
    line-height: 1.7;
    color: #73819a;
  }

  .category-tabs {
    gap: 10px;
    margin-bottom: 18px;
  }

  .category-tab {
    padding: 10px 18px;
    border: 1px solid transparent;
    border-radius: 999px;
    font-weight: 600;
    background: rgba(241, 246, 255, 0.95);
    color: #4e607f;

    &:hover {
      border-color: rgba(104, 138, 213, 0.26);
      background: rgba(232, 240, 255, 0.96);
      color: #3766c1;
    }

    &.active {
      background: linear-gradient(135deg, #5f87e6 0%, #7d7fe8 60%, #eb8fa8 100%);
      box-shadow: 0 12px 24px rgba(105, 126, 209, 0.24);
    }
  }

  .hot-tags-section {
    padding: 16px 18px;
    border: 1px solid rgba(143, 173, 228, 0.16);
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(242, 247, 255, 0.84), rgba(255, 249, 252, 0.84));

    .section-subtitle {
      color: #70819d;
    }

    .tag-filter-status {
      border: 1px solid rgba(113, 140, 208, 0.18);
      box-shadow: 0 8px 18px rgba(108, 131, 177, 0.08);
    }

    .section-title {
      color: #33455f;
    }

    .tag-item {
      background: rgba(255, 255, 255, 0.94);
      border-color: rgba(143, 168, 215, 0.2);
      box-shadow: 0 8px 18px rgba(111, 134, 180, 0.08);

      &:hover {
        box-shadow: 0 12px 22px rgba(111, 134, 180, 0.12);
      }
    }

    .clear-tag {
      box-shadow: none;
    }
  }

  .search-sort {
    gap: 14px;
    align-items: stretch;
  }

  :deep(.search-input .el-input__wrapper),
  :deep(.sort-select .el-select__wrapper) {
    min-height: 46px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow:
      0 0 0 1px rgba(143, 167, 213, 0.18),
      0 10px 20px rgba(108, 131, 177, 0.08);
  }

  :deep(.search-input .el-input__wrapper.is-focus),
  :deep(.sort-select .el-select__wrapper.is-focused) {
    box-shadow:
      0 0 0 1px rgba(87, 124, 206, 0.4),
      0 12px 22px rgba(97, 123, 182, 0.12);
  }
}

.post-list {
  .post-card {
    margin-bottom: 18px;
    padding: 22px;
    border: 1px solid rgba(142, 171, 228, 0.14);
    border-radius: 24px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 251, 255, 0.95)),
      #fff;
    box-shadow: 0 14px 32px rgba(87, 114, 168, 0.1);

    &:hover {
      border-color: rgba(103, 140, 219, 0.24);
      box-shadow: 0 20px 36px rgba(88, 118, 180, 0.14);
    }
  }

  .post-cover {
    img {
      border-radius: 18px;
      box-shadow: 0 14px 28px rgba(82, 112, 167, 0.16);
    }
  }

  .post-title {
    color: #243653;
    line-height: 1.35;
  }

  .post-excerpt {
    color: #66758f;
    line-height: 1.78;
  }

  .post-footer {
    padding-top: 14px;
    border-top: 1px solid rgba(145, 173, 228, 0.14);
  }

  .post-stats {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .stat-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 96px;
    min-height: 44px;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(242, 246, 253, 0.94);
    color: #5f6f8c !important;
    text-align: center;
    line-height: 1;
    vertical-align: middle;
  }

  .stat-item i {
    color: #d56c74 !important;
    line-height: 1;
  }

  .stat-item .stat-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    color: #667792 !important;
    line-height: 1;
  }

  .stat-item .stat-value {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    color: #4b5a76 !important;
    font-weight: 600;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
}

.pagination {
  margin-top: 36px;
}

@media (max-width: 768px) {
  .community-container {
    padding: 18px 16px 32px;
  }

  .community-header {
    padding: 22px 18px;
    border-radius: 22px;
    align-items: flex-start;

    .header-left .title {
      font-size: 30px;
    }

    .header-actions {
      width: 100%;

      .drafts-btn,
      .create-btn {
        flex: 1;
        min-width: 0;
      }
    }
  }

  .banner-hot-section {
    .banner-container,
    .hot-recommend {
      border-radius: 22px;
    }
  }

  .filter-bar {
    padding: 18px;
    border-radius: 20px;

    .search-sort {
      flex-direction: column;
    }

    .search-input,
    .sort-select {
      max-width: none;
      width: 100%;
    }
  }

  .post-list {
    .post-card {
      padding: 18px;
      border-radius: 20px;
    }
  }
}
</style>

<style scoped lang="scss">
.post-list .post-card .post-footer .post-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.post-list .post-card .post-footer .post-stats .stat-item {
  display: inline-grid !important;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  align-items: center;
  justify-content: center;
  column-gap: 6px;
  min-width: 112px;
  height: 42px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.72) !important;
  background: rgba(255, 255, 255, 0.88) !important;
  box-shadow:
    0 10px 20px rgba(44, 63, 103, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
  color: #485774 !important;
  line-height: 1 !important;
  white-space: nowrap;
  backdrop-filter: blur(10px);
}

.post-list .post-card .post-footer .post-stats .stat-item i {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 16px;
  color: #d96a72 !important;
  line-height: 1 !important;
}

.post-list .post-card .post-footer .post-stats .stat-item .stat-label,
.post-list .post-card .post-footer .post-stats .stat-item .stat-value {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  height: 18px;
  margin: 0;
  line-height: 1 !important;
}

.post-list .post-card .post-footer .post-stats .stat-item .stat-label {
  min-width: 30px;
  font-size: 13px;
  font-weight: 500;
  color: #5a6985 !important;
}

.post-list .post-card .post-footer .post-stats .stat-item .stat-value {
  min-width: 18px;
  font-size: 13px;
  font-weight: 700;
  color: #23314d !important;
  font-variant-numeric: tabular-nums;
}
</style>

<style scoped lang="scss">
.banner-hot-section {
  align-items: stretch;
  grid-auto-rows: 1fr;
}

.banner-hot-section .banner-container {
  position: relative;
  display: flex;
  align-items: stretch;
  min-height: 340px;
  padding: 12px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top left, rgba(141, 183, 255, 0.2), transparent 30%),
    radial-gradient(circle at bottom right, rgba(255, 174, 196, 0.22), transparent 34%),
    linear-gradient(145deg, rgba(252, 253, 255, 0.98), rgba(243, 248, 255, 0.95));
  box-shadow:
    0 26px 52px rgba(100, 127, 184, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.88);
}

.banner-hot-section .banner-container::before {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  pointer-events: none;
}

.banner-hot-section .banner-container :deep(.el-carousel) {
  flex: 1;
  width: 100%;
  border-radius: 24px;
  overflow: hidden;
}

.banner-hot-section .banner-container :deep(.el-carousel__container) {
  height: 100% !important;
  border-radius: 24px;
}

.banner-hot-section .banner-container :deep(.el-carousel__arrow) {
  width: 44px;
  height: 44px;
  background: rgba(20, 31, 58, 0.34);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
  transition: all 0.25s ease;
}

.banner-hot-section .banner-container :deep(.el-carousel__arrow:hover) {
  background: rgba(20, 31, 58, 0.5);
  transform: scale(1.06);
}

.banner-hot-section .banner-container :deep(.el-carousel__indicators--horizontal) {
  bottom: 16px;
}

.banner-hot-section .banner-container :deep(.el-carousel__button) {
  width: 26px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.48);
}

.banner-hot-section .banner-container .banner-item {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
}

.banner-hot-section .banner-container .banner-item::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(13, 22, 46, 0.72) 0%, rgba(13, 22, 46, 0.12) 44%, rgba(13, 22, 46, 0.24) 100%),
    linear-gradient(180deg, rgba(13, 22, 46, 0.04), rgba(13, 22, 46, 0.26));
  pointer-events: none;
}

.banner-hot-section .banner-container .banner-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.01);
  filter: saturate(1.05) contrast(1.04);
}

.banner-hot-section .banner-container .banner-overlay {
  inset: auto 0 0 0;
  padding: 20px 24px 28px;
  background: linear-gradient(180deg, rgba(8, 16, 38, 0.02), rgba(8, 16, 38, 0.78));
}

.banner-hot-section .banner-container .banner-title {
  max-width: 72%;
  margin: 0 0 10px;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 10px 26px rgba(0, 0, 0, 0.32);
}

.banner-hot-section .banner-container .banner-desc {
  max-width: 58%;
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  color: rgba(241, 246, 255, 0.9);
}

.banner-hot-section .hot-recommend {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 340px;
  max-height: 340px;
  padding: 24px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(255, 188, 166, 0.22), transparent 28%),
    radial-gradient(circle at bottom left, rgba(131, 166, 255, 0.16), transparent 32%),
    linear-gradient(155deg, rgba(255, 255, 255, 0.98), rgba(246, 249, 255, 0.95));
  box-shadow:
    0 24px 50px rgba(99, 124, 179, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.banner-hot-section .hot-recommend::before {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  pointer-events: none;
}

.banner-hot-section .hot-recommend .hot-header,
.banner-hot-section .hot-recommend .hot-list {
  position: relative;
  z-index: 1;
}

.banner-hot-section .hot-recommend .hot-header {
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(145, 172, 228, 0.18);
}

.banner-hot-section .hot-recommend .hot-header i {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 164, 116, 0.22), rgba(255, 117, 130, 0.24));
  color: #ff7b6c;
}

.banner-hot-section .hot-recommend .hot-list {
  flex: 1;
  overflow-y: auto;
  gap: 14px;
  padding-right: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(124, 146, 199, 0.65) rgba(233, 238, 249, 0.72);
}

.banner-hot-section .hot-recommend .hot-list::-webkit-scrollbar {
  width: 8px;
}

.banner-hot-section .hot-recommend .hot-list::-webkit-scrollbar-track {
  border-radius: 999px;
  background: rgba(233, 238, 249, 0.72);
}

.banner-hot-section .hot-recommend .hot-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(118, 145, 221, 0.9), rgba(238, 144, 169, 0.9));
}

.banner-hot-section .hot-recommend .hot-item {
  position: relative;
  align-items: center;
  gap: 14px;
  min-height: 92px;
  padding: 16px 16px 16px 14px;
  border: 1px solid rgba(144, 171, 223, 0.14);
  border-radius: 22px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(243, 247, 255, 0.92));
  box-shadow:
    0 14px 28px rgba(93, 119, 171, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
  overflow: hidden;
}

.banner-hot-section .hot-recommend .hot-item::after {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 4px;
  border-radius: 999px;
  background: linear-gradient(180deg, #6f90ec, #f295aa);
  opacity: 0.85;
}

.banner-hot-section .hot-recommend .hot-item:hover {
  transform: translateX(6px);
  border-color: rgba(119, 151, 220, 0.22);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(239, 245, 255, 0.96));
  box-shadow:
    0 18px 34px rgba(96, 122, 175, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

.banner-hot-section .hot-recommend .hot-rank {
  width: 42px;
  height: 42px;
  border-radius: 16px;
  font-size: 22px;
  font-weight: 800;
  box-shadow: 0 10px 20px rgba(102, 120, 158, 0.14);
}

.banner-hot-section .hot-recommend .hot-rank.rank-1 {
  background: linear-gradient(135deg, #ffd84f, #ffb020);
  color: #fff;
}

.banner-hot-section .hot-recommend .hot-rank.rank-2 {
  background: linear-gradient(135deg, #dbe6f8, #bbc8e3);
  color: #526482;
}

.banner-hot-section .hot-recommend .hot-rank.rank-3 {
  background: linear-gradient(135deg, #efb37d, #d88346);
  color: #fff;
}

.banner-hot-section .hot-recommend .hot-content {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
}

.banner-hot-section .hot-recommend .hot-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #243653;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.banner-hot-section .hot-recommend .hot-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.banner-hot-section .hot-recommend .hot-stats span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(245, 248, 255, 0.96);
  color: #65758f;
  font-size: 13px;
  font-weight: 500;
}

.banner-hot-section .hot-recommend .hot-stats span i {
  font-size: 15px;
  color: #6c84c4;
}

@media (max-width: 768px) {
  .banner-hot-section .banner-container {
    padding: 12px;
    border-radius: 24px;
    min-height: 300px;
  }

  .banner-hot-section .banner-container .banner-overlay {
    padding: 18px 18px 24px;
  }

  .banner-hot-section .banner-container .banner-title,
  .banner-hot-section .banner-container .banner-desc {
    max-width: 100%;
  }

  .banner-hot-section .banner-container .banner-title {
    font-size: 22px;
  }

  .banner-hot-section .hot-recommend {
    padding: 20px;
    border-radius: 24px;
    min-height: unset;
    max-height: unset;
  }

  .banner-hot-section .hot-recommend .hot-item {
    min-height: 84px;
    border-radius: 18px;
  }

  .banner-hot-section .hot-recommend .hot-title {
    font-size: 18px;
  }
}
</style>

<style scoped lang="scss">
.post-list .post-card.post-highlight {
  outline: 2px solid rgba(255, 202, 72, 0.96);
  outline-offset: 3px;
  border-color: rgba(255, 208, 96, 0.92) !important;
  box-shadow:
    0 0 0 4px rgba(255, 240, 180, 0.5),
    0 0 28px rgba(255, 200, 60, 0.32),
    0 20px 42px rgba(255, 184, 71, 0.18),
    inset 0 1px 0 rgba(255, 251, 232, 0.92) !important;
}

.post-list .post-card.post-highlight:hover {
  box-shadow:
    0 0 0 4px rgba(255, 244, 192, 0.56),
    0 0 36px rgba(255, 205, 77, 0.42),
    0 24px 48px rgba(255, 184, 71, 0.24),
    inset 0 1px 0 rgba(255, 251, 232, 0.96) !important;
}

.post-list .post-card.post-highlight .post-cover {
  position: relative;
  border-radius: 18px;
  box-shadow:
    0 0 0 2px rgba(255, 215, 92, 0.7),
    0 16px 30px rgba(255, 184, 71, 0.22);
}

.post-list .post-card.post-highlight .post-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(130deg, rgba(255, 255, 255, 0.34), transparent 32%, transparent 68%, rgba(255, 215, 120, 0.18));
  pointer-events: none;
}

.post-list .post-card.post-highlight .post-header {
  position: relative;
  padding-top: 6px;
}

.post-list .post-card.post-highlight .post-header::before {
  content: '';
  position: absolute;
  left: 0;
  top: -8px;
  width: 168px;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 213, 96, 1), rgba(255, 151, 80, 0.94), rgba(255, 213, 96, 0));
  box-shadow: 0 0 16px rgba(255, 196, 66, 0.45);
}

.post-list .post-card.post-highlight .post-title {
  text-shadow: 0 0 18px rgba(255, 208, 72, 0.18);
}

.post-list .post-card.post-highlight .post-footer {
  position: relative;
}

.post-list .post-card.post-highlight .post-footer::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -2px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 213, 96, 0.75), rgba(255, 255, 255, 0.18), rgba(255, 144, 107, 0.65));
}

.post-list .post-card.post-highlight .tag-highlight {
  position: relative;
  padding: 5px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffe16c 0%, #ffbc3f 45%, #ff8d61 100%) !important;
  color: #fff !important;
  border: 1px solid rgba(255, 247, 214, 0.4);
  box-shadow:
    0 10px 18px rgba(255, 183, 55, 0.28),
    0 0 16px rgba(255, 206, 92, 0.26);
}

.post-list .post-card.post-highlight .tag-highlight i {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.38));
}

.post-list .post-card.post-highlight .tag-top-badge,
.post-list .post-card.post-highlight .level-tag-badge {
  box-shadow: 0 8px 16px rgba(31, 41, 55, 0.14);
}

@media (max-width: 768px) {
  .post-list .post-card.post-highlight {
    outline-offset: 2px;
  }

  .post-list .post-card.post-highlight .post-header::before {
    width: 118px;
    top: -3px;
  }
}

html.dark .community-container {
  background:
    radial-gradient(circle at top left, rgba(79, 112, 196, 0.2), transparent 26%),
    radial-gradient(circle at top right, rgba(171, 92, 144, 0.16), transparent 22%),
    linear-gradient(180deg, rgba(17, 23, 38, 0.98), rgba(10, 15, 28, 1));
  border-radius: 28px;
}

html.dark .community-header .header-left .subtitle,
html.dark .filter-bar .hot-tags-section .section-header .section-subtitle,
html.dark .post-list .post-card .post-excerpt,
html.dark .post-list .post-card .time,
html.dark .post-list .post-card .stat-item,
html.dark .post-list .post-card .stat-label,
html.dark .pagination :deep(.el-pagination__total) {
  color: #aab7d6 !important;
}

html.dark .filter-bar,
html.dark .filter-bar .hot-tags-section,
html.dark .post-list .post-card {
  background: linear-gradient(180deg, rgba(26, 34, 54, 0.94), rgba(20, 27, 44, 0.96));
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
}

html.dark .filter-bar,
html.dark .post-list .post-card,
html.dark .filter-bar .hot-tags-section .hot-tags .tag-item {
  border-color: rgba(117, 138, 196, 0.18) !important;
}

html.dark .filter-bar .category-tabs .category-tab,
html.dark .filter-bar .hot-tags-section .hot-tags .tag-item,
html.dark .filter-bar .hot-tags-section .section-header .tag-filter-status {
  background: rgba(255, 255, 255, 0.06);
  color: #c6d2ee;
}

html.dark .filter-bar .hot-tags-section .section-header .section-title,
html.dark .post-list .post-card .post-title,
html.dark .post-list .post-card .username {
  color: #eef3ff !important;
}

html.dark .filter-bar .search-sort :deep(.el-input__wrapper),
html.dark .filter-bar .search-sort :deep(.el-select__wrapper) {
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 1px rgba(142, 163, 224, 0.16) inset !important;
}

html.dark .pagination :deep(.btn-prev),
html.dark .pagination :deep(.btn-next),
html.dark .pagination :deep(.el-pager li) {
  background: rgba(255, 255, 255, 0.04);
  color: #c8d3ef;
}
</style>
