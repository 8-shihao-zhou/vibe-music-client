<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getFollowingList, followUser, unfollowUser, getUserStats } from '@/api/community'
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

// 页面主人的主题
const pageOwnerTheme = ref<string | null>(null)

const themeConfig: Record<string, { primary: string; secondary: string; accent: string; bg: string }> = {
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)': { primary: '#4fc3f7', secondary: '#1e88e5', accent: '#e94560', bg: 'linear-gradient(160deg, #0d47a1 0%, #1565c0 25%, #0a3d7a 50%, #1a237e 75%, #0d47a1 100%)' },
  'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #fda085 100%)': { primary: '#f5576c', secondary: '#f093fb', accent: '#fda085', bg: 'linear-gradient(160deg, #fff3e0 0%, #ffe0b2 20%, #ffd7cc 40%, #fce4ec 70%, #fff8e1 100%)' },
  'linear-gradient(135deg, #134e5e 0%, #71b280 100%)': { primary: '#2e7d32', secondary: '#66bb6a', accent: '#a5d6a7', bg: 'linear-gradient(160deg, #e8f5e9 0%, #c8e6c9 25%, #b2dfdb 50%, #dcedc8 75%, #f1f8e9 100%)' },
  'linear-gradient(135deg, #00c3ff 0%, #ffff1c 50%, #ff00c8 100%)': { primary: '#00bcd4', secondary: '#7c4dff', accent: '#e040fb', bg: 'linear-gradient(160deg, #e0f7fa 0%, #e8eaf6 25%, #f3e5f5 50%, #fce4ec 75%, #e0f2f1 100%)' },
}

const THEME_KEYS: Record<string, string> = {
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)': 'ocean',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #fda085 100%)': 'sunset',
  'linear-gradient(135deg, #134e5e 0%, #71b280 100%)': 'forest',
  'linear-gradient(135deg, #00c3ff 0%, #ffff1c 50%, #ff00c8 100%)': 'aurora',
}
const themeKey = computed(() => pageOwnerTheme.value ? (THEME_KEYS[pageOwnerTheme.value] || '') : '')
const themeVars = computed(() => pageOwnerTheme.value ? (themeConfig[pageOwnerTheme.value] || null) : null)

const fetchFollowingList = async () => {
  if (!userId.value) return
  loading.value = true
  try {
    const [res, statsRes] = await Promise.all([
      getFollowingList(userId.value, currentPage.value, pageSize.value),
      getUserStats(userId.value),
    ])
    if (res.code === 0 && res.data) {
      followingList.value = (res.data as any).records || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取关注列表失败')
    }
    if (statsRes.code === 0) {
      pageOwnerTheme.value = statsRes.data?.profileTheme || null
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

const handleFollow = async (user: any) => {
  if (!userStore.userInfo?.userId) { ElMessage.warning('请先登录'); return }
  try {
    if (user.isFollowing) {
      const res = await unfollowUser(user.userId)
      if (res.code === 0) { ElMessage.success('取消关注成功'); user.isFollowing = false; user.followerCount = Math.max(0, user.followerCount - 1) }
    } else {
      const res = await followUser(user.userId)
      if (res.code === 0) { ElMessage.success('关注成功'); user.isFollowing = true; user.followerCount = user.followerCount + 1 }
    }
  } catch (error) { ElMessage.error('操作失败') }
}

const goToUserProfile = (targetUserId: number) => router.push(`/community/user/${targetUserId}`)
const goBack = () => router.back()

watch(userId, (newId, oldId) => {
  if (newId && newId !== oldId) { currentPage.value = 1; fetchFollowingList() }
})
onMounted(fetchFollowingList)
</script>

<template>
  <div
    class="following-page"
    :class="{ 'has-theme': !!pageOwnerTheme, [`theme-${themeKey}`]: !!themeKey }"
    :style="themeVars ? {
      '--theme-gradient': pageOwnerTheme,
      '--theme-primary': themeVars.primary,
      '--theme-secondary': themeVars.secondary,
      '--theme-accent': themeVars.accent,
      '--theme-bg': themeVars.bg,
    } : {}"
  >
    <!-- 背景装饰 -->
    <div v-if="pageOwnerTheme" class="theme-bg-layer">
      <div class="theme-orb orb-1"></div>
      <div class="theme-orb orb-2"></div>
    </div>

    <div class="page-container">
      <!-- 页头 -->
      <div class="page-header">
        <el-button class="back-btn" @click="goBack">
          <i class="i-carbon-arrow-left mr-1" />返回
        </el-button>
        <div class="header-title-row">
          <h1 class="page-title">
            <i class="i-carbon-user-follow mr-2" />关注列表
          </h1>
          <span class="count-badge">{{ total }} 人</span>
        </div>
      </div>

      <div v-loading="loading" class="user-grid">
        <div
          v-for="user in followingList"
          :key="user.userId"
          class="user-card"
          :class="{ 'card-themed': !!user.profileTheme }"
        >
          <!-- 卡片顶部主题横幅 -->
          <div
            class="card-banner"
            :style="user.profileTheme ? { background: user.profileTheme } : {}"
            @click="goToUserProfile(user.userId)"
          >
            <div class="banner-avatar-wrap">
              <img :src="user.userAvatar || '/src/assets/user.jpg'" class="user-avatar" />
              <div v-if="user.profileTheme" class="avatar-glow"></div>
            </div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-body">
            <div class="user-info" @click="goToUserProfile(user.userId)">
              <div class="user-details">
                <h3 class="username">{{ user.username }}</h3>
                <div class="user-stats">
                  <span class="stat">{{ user.followerCount || 0 }} 粉丝</span>
                  <span class="divider">·</span>
                  <span class="stat">{{ user.followingCount || 0 }} 关注</span>
                </div>
              </div>
            </div>
            <el-button
              v-if="user.userId !== userStore.userInfo?.userId"
              :type="user.isFollowing ? 'default' : 'primary'"
              size="small"
              class="follow-btn"
              @click="handleFollow(user)"
            >
              {{ user.isFollowing ? '已关注' : '关注' }}
            </el-button>
          </div>
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
  background: var(--el-bg-color-page, var(--el-fill-color-light));
  padding: 24px;
  position: relative;
  transition: background 0.5s ease;

  &.has-theme {
    background: var(--theme-bg, var(--el-bg-color-page)) !important;
  }
}

.theme-bg-layer {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 0; overflow: hidden;

  .theme-orb {
    position: absolute; border-radius: 50%;
    filter: blur(80px); opacity: 0.1;
    animation: orbFloat 8s ease-in-out infinite;

    &.orb-1 {
      width: 500px; height: 500px;
      background: var(--theme-primary);
      top: -100px; right: -100px;
      animation-delay: 0s;
    }
    &.orb-2 {
      width: 350px; height: 350px;
      background: var(--theme-secondary);
      bottom: 5%; left: -60px;
      animation-delay: -4s;
    }
  }
}

@keyframes orbFloat {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-25px) scale(1.04); }
}

.page-container {
  max-width: 1200px; margin: 0 auto;
  position: relative; z-index: 1;
}

.page-header {
  margin-bottom: 28px;

  .back-btn { margin-bottom: 16px; border-radius: 8px; }

  .header-title-row {
    display: flex; align-items: center; gap: 12px;
  }

  .page-title {
    font-size: 28px; font-weight: 700;
    color: var(--el-text-color-primary);
    margin: 0;
    display: flex; align-items: center;
    i { font-size: 32px; }
  }

  .count-badge {
    background: var(--theme-primary, #667eea);
    color: white;
    padding: 4px 14px;
    border-radius: 20px;
    font-size: 13px; font-weight: 600;
  }
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  min-height: 300px;
}

.user-card {
  background: var(--el-bg-color);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.12);
  }

  &.card-themed {
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }

  .card-banner {
    height: 80px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: flex-end;
    padding: 0 20px;

    .banner-avatar-wrap {
      position: relative;
      margin-bottom: -28px;

      .user-avatar {
        width: 56px; height: 56px;
        border-radius: 50%;
        border: 3px solid white;
        object-fit: cover;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        position: relative; z-index: 1;
      }

      .avatar-glow {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        background: var(--theme-gradient, linear-gradient(135deg, #667eea, #764ba2));
        opacity: 0.5;
        filter: blur(6px);
        z-index: 0;
        animation: glowPulse 2s ease-in-out infinite;
      }
    }
  }

  .card-body {
    padding: 36px 20px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    .user-info {
      cursor: pointer; flex: 1; min-width: 0;

      .username {
        font-size: 16px; font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0 0 6px 0;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }

      .user-stats {
        display: flex; align-items: center; gap: 6px;
        .stat { font-size: 12px; color: var(--el-text-color-secondary); }
        .divider { color: var(--el-border-color); font-size: 12px; }
      }
    }

    .follow-btn {
      border-radius: 20px;
      flex-shrink: 0;
    }
  }
}

.pagination {
  display: flex; justify-content: center; margin-top: 32px;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

/* 深海主题下卡片适配 */
.following-page.theme-ocean {
  .page-title { color: #e3f2fd; }
  .user-card {
    background: rgba(13, 71, 161, 0.55);
    backdrop-filter: blur(8px);
    .username { color: #e3f2fd; }
    .stat { color: rgba(227, 242, 253, 0.7); }
  }
}
</style>
