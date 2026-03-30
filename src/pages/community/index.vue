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

// 跳转到标签广场
const goToTagsPage = () => {
  router.push('/community/tags')
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
  // 从URL参数获取标签筛选
  const tagParam = route.query.tag as string
  if (tagParam) {
    selectedTag.value = tagParam
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
          <el-button text size="small" @click="goToTagsPage">
            查看更多
            <i class="i-carbon-arrow-right ml-1" />
          </el-button>
        </div>
        <div class="hot-tags">
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
        v-for="post in postList"
        :key="post.id"
        class="post-card"
        :class="[
          post.isHighlight ? 'post-highlight' : '',
          post.postTheme ? `post-theme-${post.postTheme}` : '',
        ]"
        @click="goToDetail(post.id)"
      >
        <!-- 帖子装扮动态背景 -->
        <div v-if="post.postTheme" class="post-theme-deco" :class="`deco-${post.postTheme}`">
          <template v-if="post.postTheme === 'starry'">
            <div class="pt-star" v-for="i in 16" :key="i" :class="`pts${i}`"></div>
            <div class="pt-meteor" v-for="i in 3" :key="i" :class="`ptm${i}`"></div>
          </template>
          <template v-else-if="post.postTheme === 'sakura'">
            <div class="pt-petal" v-for="i in 10" :key="i" :class="`ptp${i}`"></div>
          </template>
          <template v-else-if="post.postTheme === 'neon'">
            <div class="pt-neon-line" v-for="i in 5" :key="i" :class="`ptn${i}`"></div>
            <div class="pt-neon-glow"></div>
          </template>
          <template v-else-if="post.postTheme === 'lava'">
            <div class="pt-spark" v-for="i in 8" :key="i" :class="`ptl${i}`"></div>
            <div class="pt-lava-glow"></div>
          </template>
        </div>
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

/* ===== 帖子装扮 ===== */
.post-card {
  position: relative;
  overflow: hidden;
}

.post-theme-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  border-radius: 16px;
  overflow: hidden;
}

/* 确保内容在装饰层上方 */
.post-card .post-cover,
.post-card .post-content {
  position: relative;
  z-index: 1;
}

/* 星空主题 */
.post-theme-starry {
  background: linear-gradient(135deg, #0d0d2b 0%, #1a1a4e 50%, #0d1b3e 100%) !important;
  border: 1px solid rgba(100, 149, 237, 0.3) !important;
  .post-title { color: #e8f4ff !important; }
  .post-excerpt { color: rgba(200, 220, 255, 0.75) !important; }
  .username { color: #a8d8ff !important; }
  .time { color: rgba(168, 216, 255, 0.6) !important; }
  .stat-item { color: rgba(168, 216, 255, 0.7) !important; }
}
.deco-starry .pt-star {
  position: absolute; border-radius: 50%; background: white;
  animation: ptStarTwinkle ease-in-out infinite;
}
.deco-starry .pts1  { width:2px;height:2px; top:8%;  left:5%;  animation-duration:2s;   animation-delay:0s; }
.deco-starry .pts2  { width:3px;height:3px; top:15%; left:15%; animation-duration:3s;   animation-delay:0.4s; }
.deco-starry .pts3  { width:2px;height:2px; top:5%;  left:28%; animation-duration:2.5s; animation-delay:0.8s; }
.deco-starry .pts4  { width:4px;height:4px; top:20%; left:40%; animation-duration:4s;   animation-delay:0.2s; }
.deco-starry .pts5  { width:2px;height:2px; top:10%; left:55%; animation-duration:2s;   animation-delay:1.2s; }
.deco-starry .pts6  { width:3px;height:3px; top:25%; left:65%; animation-duration:3.5s; animation-delay:0.6s; }
.deco-starry .pts7  { width:2px;height:2px; top:7%;  left:75%; animation-duration:2.5s; animation-delay:1.5s; }
.deco-starry .pts8  { width:3px;height:3px; top:18%; left:85%; animation-duration:3s;   animation-delay:0.3s; }
.deco-starry .pts9  { width:2px;height:2px; top:30%; left:92%; animation-duration:2s;   animation-delay:1.8s; }
.deco-starry .pts10 { width:4px;height:4px; top:40%; left:8%;  animation-duration:4s;   animation-delay:0.9s; }
.deco-starry .pts11 { width:2px;height:2px; top:50%; left:22%; animation-duration:2.5s; animation-delay:2.1s; }
.deco-starry .pts12 { width:3px;height:3px; top:60%; left:35%; animation-duration:3s;   animation-delay:0.5s; }
.deco-starry .pts13 { width:2px;height:2px; top:70%; left:50%; animation-duration:2s;   animation-delay:1.4s; }
.deco-starry .pts14 { width:3px;height:3px; top:55%; left:70%; animation-duration:3.5s; animation-delay:0.7s; }
.deco-starry .pts15 { width:2px;height:2px; top:75%; left:82%; animation-duration:2.5s; animation-delay:2.3s; }
.deco-starry .pts16 { width:4px;height:4px; top:45%; left:95%; animation-duration:4s;   animation-delay:1.1s; }
.deco-starry .pt-meteor {
  position: absolute; width: 1px; height: 60px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.9), transparent);
  animation: ptMeteor linear infinite; opacity: 0;
}
.deco-starry .ptm1 { top: -70px; left: 20%; animation-duration: 4s;   animation-delay: 0s; }
.deco-starry .ptm2 { top: -70px; left: 55%; animation-duration: 5.5s; animation-delay: -2s; }
.deco-starry .ptm3 { top: -70px; left: 80%; animation-duration: 3.5s; animation-delay: -1s; }
@keyframes ptStarTwinkle { 0%,100%{opacity:0.2;transform:scale(1);} 50%{opacity:1;transform:scale(1.5);} }
@keyframes ptMeteor {
  0%  { transform:translateY(0) translateX(0) rotate(25deg); opacity:0; }
  5%  { opacity:1; }
  70% { opacity:0.7; }
  100%{ transform:translateY(200px) translateX(80px) rotate(25deg); opacity:0; }
}

/* 樱花主题 */
.post-theme-sakura {
  background: linear-gradient(135deg, #fff0f5 0%, #ffe4ef 50%, #fff5f8 100%) !important;
  border: 1px solid rgba(255, 150, 180, 0.35) !important;
  .post-title { color: #c2185b !important; }
  .username { color: #e91e8c !important; }
}
.deco-sakura .pt-petal {
  position: absolute;
  width: 10px; height: 10px;
  background: radial-gradient(circle at 30% 30%, #ffb7d5, #ff80ab);
  border-radius: 50% 0 50% 0;
  animation: ptPetalFall linear infinite; opacity: 0.8;
}
.deco-sakura .ptp1  { left:5%;  top:-15px; animation-duration:5s;  animation-delay:0s;    width:8px;  height:8px; }
.deco-sakura .ptp2  { left:15%; top:-15px; animation-duration:7s;  animation-delay:-1s;   width:12px; height:12px; }
.deco-sakura .ptp3  { left:25%; top:-15px; animation-duration:6s;  animation-delay:-2s;   width:9px;  height:9px; }
.deco-sakura .ptp4  { left:38%; top:-15px; animation-duration:8s;  animation-delay:-0.5s; width:11px; height:11px; }
.deco-sakura .ptp5  { left:50%; top:-15px; animation-duration:5.5s;animation-delay:-3s;   width:8px;  height:8px; }
.deco-sakura .ptp6  { left:62%; top:-15px; animation-duration:7.5s;animation-delay:-1.5s; width:13px; height:13px; }
.deco-sakura .ptp7  { left:72%; top:-15px; animation-duration:6.5s;animation-delay:-4s;   width:9px;  height:9px; }
.deco-sakura .ptp8  { left:82%; top:-15px; animation-duration:5s;  animation-delay:-2.5s; width:10px; height:10px; }
.deco-sakura .ptp9  { left:90%; top:-15px; animation-duration:8s;  animation-delay:-0.8s; width:12px; height:12px; }
.deco-sakura .ptp10 { left:45%; top:-15px; animation-duration:6s;  animation-delay:-3.5s; width:8px;  height:8px; }
@keyframes ptPetalFall {
  0%  { transform:translateY(0) rotate(0deg) translateX(0); opacity:0.8; }
  100%{ transform:translateY(120px) rotate(540deg) translateX(40px); opacity:0; }
}

/* 霓虹主题 */
.post-theme-neon {
  background: linear-gradient(135deg, #0a0a1a 0%, #12001f 50%, #001a12 100%) !important;
  border: 1px solid rgba(0, 255, 200, 0.3) !important;
  box-shadow: 0 0 20px rgba(0, 255, 200, 0.1), 0 0 40px rgba(180, 0, 255, 0.08) !important;
  .post-title { color: #00ffe0 !important; text-shadow: 0 0 8px rgba(0,255,224,0.5); }
  .post-excerpt { color: rgba(180, 255, 240, 0.7) !important; }
  .username { color: #bf00ff !important; text-shadow: 0 0 6px rgba(191,0,255,0.5); }
  .time { color: rgba(180, 255, 240, 0.5) !important; }
  .stat-item { color: rgba(0, 255, 200, 0.6) !important; }
}
.deco-neon .pt-neon-glow {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 80% 50%, rgba(0,255,200,0.06) 0%, transparent 60%),
              radial-gradient(ellipse at 20% 50%, rgba(180,0,255,0.06) 0%, transparent 60%);
}
.deco-neon .pt-neon-line {
  position: absolute; height: 1px; left: 0; right: 0;
  animation: ptNeonScan linear infinite;
}
.deco-neon .ptn1 { top:15%; background:linear-gradient(90deg,transparent,rgba(0,255,200,0.6),transparent); animation-duration:3s;  animation-delay:0s; }
.deco-neon .ptn2 { top:35%; background:linear-gradient(90deg,transparent,rgba(180,0,255,0.5),transparent); animation-duration:4s;  animation-delay:-1s; }
.deco-neon .ptn3 { top:55%; background:linear-gradient(90deg,transparent,rgba(0,255,200,0.4),transparent); animation-duration:5s;  animation-delay:-2s; }
.deco-neon .ptn4 { top:70%; background:linear-gradient(90deg,transparent,rgba(255,0,180,0.4),transparent); animation-duration:3.5s;animation-delay:-0.5s; }
.deco-neon .ptn5 { top:85%; background:linear-gradient(90deg,transparent,rgba(0,200,255,0.5),transparent); animation-duration:4.5s;animation-delay:-1.5s; }
@keyframes ptNeonScan {
  0%  { transform:translateX(-100%) scaleX(0.5); opacity:0; }
  20% { opacity:1; }
  80% { opacity:0.8; }
  100%{ transform:translateX(100%) scaleX(1.5); opacity:0; }
}

/* 熔岩主题 */
.post-theme-lava {
  background: linear-gradient(135deg, #1a0500 0%, #2d0a00 40%, #1a0800 100%) !important;
  border: 1px solid rgba(255, 80, 0, 0.35) !important;
  box-shadow: 0 0 20px rgba(255, 80, 0, 0.12) !important;
  .post-title { color: #ff8c42 !important; text-shadow: 0 0 8px rgba(255,100,0,0.4); }
  .post-excerpt { color: rgba(255, 200, 150, 0.75) !important; }
  .username { color: #ff6b35 !important; }
  .time { color: rgba(255, 180, 100, 0.6) !important; }
  .stat-item { color: rgba(255, 160, 80, 0.7) !important; }
}
.deco-lava .pt-lava-glow {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 100%, rgba(255,80,0,0.15) 0%, transparent 60%);
}
.deco-lava .pt-spark {
  position: absolute; width: 3px; height: 3px;
  border-radius: 50%; background: #ff6b00;
  box-shadow: 0 0 4px rgba(255,107,0,0.8);
  animation: ptSparkRise ease-out infinite; opacity: 0;
}
.deco-lava .ptl1 { left:10%; bottom:0; animation-duration:2s;   animation-delay:0s;    background:#ff4500; }
.deco-lava .ptl2 { left:22%; bottom:0; animation-duration:2.5s; animation-delay:0.4s;  background:#ff6b00; width:4px;height:4px; }
.deco-lava .ptl3 { left:35%; bottom:0; animation-duration:1.8s; animation-delay:0.8s;  background:#ff8c00; }
.deco-lava .ptl4 { left:48%; bottom:0; animation-duration:3s;   animation-delay:0.2s;  background:#ff4500; width:5px;height:5px; }
.deco-lava .ptl5 { left:60%; bottom:0; animation-duration:2.2s; animation-delay:1.2s;  background:#ff6b00; }
.deco-lava .ptl6 { left:72%; bottom:0; animation-duration:2.8s; animation-delay:0.6s;  background:#ff8c00; width:4px;height:4px; }
.deco-lava .ptl7 { left:83%; bottom:0; animation-duration:2s;   animation-delay:1.5s;  background:#ff4500; }
.deco-lava .ptl8 { left:93%; bottom:0; animation-duration:2.5s; animation-delay:0.9s;  background:#ff6b00; width:5px;height:5px; }
@keyframes ptSparkRise {
  0%  { transform:translateY(0) translateX(0) scale(1); opacity:0; }
  10% { opacity:1; }
  80% { opacity:0.6; }
  100%{ transform:translateY(-80px) translateX(15px) scale(0.3); opacity:0; }
}
</style>
