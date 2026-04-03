<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getUserStats,
  getPostList,
  getFollowStats,
  followUser,
  unfollowUser,
} from '@/api/community'
import { UserStore } from '@/stores/modules/user'

const route = useRoute()
const router = useRouter()
const userStore = UserStore()
const userId = computed(() => Number(route.params.id) || 0)
const currentUserId = computed(() => userStore.userInfo?.userId || 0)
const isOwnProfile = computed(() => currentUserId.value === userId.value)
const loading = ref(false)
const userStats = ref<any>({})
const followStats = ref<any>({})
const postList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isFollowing = ref(false)
const followLoading = ref(false)

const THEMES: Record<
  string,
  {
    primary: string
    secondary: string
    accent: string
    pageBg: string
    themeKey: string
  }
> = {
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)': {
    primary: '#4fc3f7',
    secondary: '#1e88e5',
    accent: '#e94560',
    // 深海：明亮的深蓝色，区别于暗色模式的纯黑
    pageBg:
      'linear-gradient(160deg, #0d47a1 0%, #1565c0 25%, #0a3d7a 50%, #1a237e 75%, #0d47a1 100%)',
    themeKey: 'ocean',
  },
  'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #fda085 100%)': {
    primary: '#f5576c',
    secondary: '#f093fb',
    accent: '#fda085',
    pageBg:
      'linear-gradient(160deg, #fff3e0 0%, #ffe0b2 20%, #ffd7cc 40%, #fce4ec 70%, #fff8e1 100%)',
    themeKey: 'sunset',
  },
  'linear-gradient(135deg, #134e5e 0%, #71b280 100%)': {
    primary: '#2e7d32',
    secondary: '#66bb6a',
    accent: '#a5d6a7',
    pageBg:
      'linear-gradient(160deg, #e8f5e9 0%, #c8e6c9 25%, #b2dfdb 50%, #dcedc8 75%, #f1f8e9 100%)',
    themeKey: 'forest',
  },
  'linear-gradient(135deg, #00c3ff 0%, #ffff1c 50%, #ff00c8 100%)': {
    primary: '#00bcd4',
    secondary: '#7c4dff',
    accent: '#e040fb',
    pageBg:
      'linear-gradient(160deg, #e0f7fa 0%, #e8eaf6 25%, #f3e5f5 50%, #fce4ec 75%, #e0f2f1 100%)',
    themeKey: 'aurora',
  },
}

const activeTheme = computed(() => userStats.value?.profileTheme || null)
const themeVars = computed(() =>
  activeTheme.value ? THEMES[activeTheme.value] || null : null
)

const fetchData = async () => {
  if (!userId.value) return
  loading.value = true
  try {
    const [statsRes, followRes] = await Promise.all([
      getUserStats(userId.value),
      getFollowStats(userId.value),
    ])
    if (statsRes.code === 0) {
      userStats.value = statsRes.data
      isFollowing.value = (statsRes.data as any)?.isFollowing || false
    }
    if (followRes.code === 0) followStats.value = followRes.data
    // 帖子单独请求，失败时静默处理（退出登录后不报错）
    try {
      const postsRes = await getPostList({
        userId: userId.value,
        pageNum: currentPage.value,
        pageSize: pageSize.value,
      })
      if (postsRes.code === 0) {
        postList.value = (postsRes.data as any).records || []
        total.value = postsRes.data.total || 0
      }
    } catch {
      postList.value = []
      total.value = 0
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleFollow = async () => {
  if (!currentUserId.value) {
    ElMessage.warning('请先登录')
    return
  }
  if (isOwnProfile.value) {
    ElMessage.warning('不能关注自己')
    return
  }
  followLoading.value = true
  try {
    if (isFollowing.value) {
      const res = await unfollowUser(userId.value)
      if (res.code === 0) {
        isFollowing.value = false
        ElMessage.success('取消关注成功')
        if (followStats.value.followerCount > 0)
          followStats.value.followerCount--
      } else ElMessage.error(res.message || '取消关注失败')
    } else {
      const res = await followUser(userId.value)
      if (res.code === 0) {
        isFollowing.value = true
        ElMessage.success('关注成功')
        followStats.value.followerCount =
          (followStats.value.followerCount || 0) + 1
      } else ElMessage.error(res.message || '关注失败')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    followLoading.value = false
  }
}

const goToDetail = (id: number) => router.push(`/community/${id}`)
const goBack = () => router.back()
const goToFollowing = () =>
  router.push(`/community/user/${userId.value}/following`)
const goToFollowers = () =>
  router.push(`/community/user/${userId.value}/followers`)

const formatTime = (time: string) => {
  const date = new Date(time),
    now = new Date(),
    diff = now.getTime() - date.getTime()
  const m = 60000,
    h = 3600000,
    d = 86400000
  if (diff < m) return '刚刚'
  if (diff < h) return `${Math.floor(diff / m)}分钟前`
  if (diff < d) return `${Math.floor(diff / h)}小时前`
  if (diff < 7 * d) return `${Math.floor(diff / d)}天前`
  return date.toLocaleDateString()
}

// 退出登录时重置状态并跳走
watch(
  () => userStore.userInfo?.userId,
  (uid) => {
    if (!uid) {
      isFollowing.value = false
      // 退出登录后跳回首页，避免停留在个人中心
      router.push('/')
    }
  }
)

watch(userId, (n, o) => {
  if (n && n !== o) {
    currentPage.value = 1
    fetchData()
  }
})
onMounted(fetchData)
</script>

<template>
  <div
    class="user-profile-page"
    :class="[themeVars ? `theme-${themeVars.themeKey}` : '']"
    :style="
      themeVars
        ? {
            '--theme-gradient': activeTheme,
            '--theme-primary': themeVars.primary,
            '--theme-secondary': themeVars.secondary,
            '--theme-accent': themeVars.accent,
            '--page-bg': themeVars.pageBg,
          }
        : {}
    "
  >
    <!-- 主题专属背景装饰 -->
    <div
      v-if="themeVars"
      class="theme-deco"
      :class="`deco-${themeVars.themeKey}`"
    >
      <template v-if="themeVars.themeKey === 'ocean'">
        <div class="bubble" v-for="i in 12" :key="i" :class="`b${i}`"></div>
      </template>
      <template v-else-if="themeVars.themeKey === 'sunset'">
        <div class="sun-system">
          <div class="sun"><div class="sun-inner"></div></div>
          <div class="sun-ray" v-for="i in 12" :key="i" :class="`r${i}`"></div>
        </div>
        <div class="sun-halo"></div>
        <div class="horizon"></div>
        <div class="horizon-ring hr1"></div>
        <div class="horizon-ring hr2"></div>
        <div class="horizon-ring hr3"></div>
        <div class="cloud c1">
          <div class="cloud-puff p1"></div>
          <div class="cloud-puff p2"></div>
          <div class="cloud-puff p3"></div>
        </div>
        <div class="cloud c2">
          <div class="cloud-puff p1"></div>
          <div class="cloud-puff p2"></div>
        </div>
        <div class="cloud c3">
          <div class="cloud-puff p1"></div>
          <div class="cloud-puff p2"></div>
          <div class="cloud-puff p3"></div>
        </div>
        <div class="bird" v-for="i in 5" :key="i" :class="`bird${i}`"></div>
        <div class="spark" v-for="i in 8" :key="i" :class="`sp${i}`"></div>
      </template>
      <template v-else-if="themeVars.themeKey === 'forest'">
        <div class="tree" v-for="i in 6" :key="i" :class="`t${i}`">
          <div class="tree-top"></div>
          <div class="tree-trunk"></div>
        </div>
        <div class="leaf" v-for="i in 8" :key="i" :class="`l${i}`"></div>
      </template>
      <template v-else-if="themeVars.themeKey === 'aurora'">
        <div
          class="aurora-curtain"
          v-for="i in 6"
          :key="i"
          :class="`ac${i}`"
        ></div>
        <div
          class="aurora-wave"
          v-for="i in 4"
          :key="i"
          :class="`aw${i}`"
        ></div>
        <div
          class="aurora-shimmer"
          v-for="i in 3"
          :key="i"
          :class="`as${i}`"
        ></div>
        <div class="meteor" v-for="i in 4" :key="i" :class="`m${i}`"></div>
        <div class="star" v-for="i in 20" :key="i" :class="`s${i}`"></div>
      </template>
    </div>

    <div class="profile-container">
      <el-button class="back-btn" @click="goBack"
        ><i class="i-carbon-arrow-left mr-1" />返回</el-button
      >

      <div
        class="user-header-card"
        :style="activeTheme ? { background: activeTheme } : {}"
      >
        <div class="cover-bg">
          <div v-if="activeTheme" class="cover-particles">
            <span v-for="i in 8" :key="i" class="particle"></span>
          </div>
        </div>
        <div class="user-info-section">
          <div class="avatar-wrapper">
            <div v-if="activeTheme" class="avatar-ring"></div>
            <img
              :src="userStats.userAvatar || '/src/assets/user.jpg'"
              class="user-avatar"
            />
          </div>
          <div class="user-details">
            <h1 class="username">{{ userStats.username }}</h1>
            <p class="user-id">
              <span class="id-badge">ID: {{ userStats.userId }}</span>
              <span v-if="activeTheme" class="theme-badge">✨ 已装扮</span>
            </p>
          </div>
          <el-button
            v-if="!isOwnProfile && currentUserId"
            :type="isFollowing ? 'default' : 'primary'"
            :loading="followLoading"
            class="follow-btn"
            @click="handleFollow"
          >
            <i
              :class="
                isFollowing ? 'i-carbon-user-follow' : 'i-carbon-user-plus'
              "
              class="mr-1"
            />
            {{ isFollowing ? '已关注' : '关注' }}
          </el-button>
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
          <i class="i-carbon-document mr-2" />TA的帖子
        </h2>
        <div v-loading="loading" class="posts-list">
          <div
            v-for="(post, index) in postList"
            :key="post.id"
            class="post-item"
            :class="[
              'post-enter',
              post.postTheme ? `post-theme-${post.postTheme}` : '',
            ]"
            :style="{ '--enter-delay': `${Math.min(index, 10) * 70}ms` }"
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
                    ><i class="i-carbon-view" />浏览
                    {{ post.viewCount || 0 }}</span
                  >
                  <span class="stat"
                    ><i class="i-carbon-thumbs-up" />点赞
                    {{ post.likeCount || 0 }}</span
                  >
                  <span class="stat"
                    ><i class="i-carbon-chat" />评论
                    {{ post.commentCount || 0 }}</span
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
  background: var(--el-bg-color-page, var(--el-fill-color-light));
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: background 0.6s ease;
  &[class*='theme-'] {
    background: var(--page-bg) !important;
  }
}

.theme-deco {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

/* 深海气泡 */
.deco-ocean .bubble {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(79, 195, 247, 0.4);
  background: rgba(79, 195, 247, 0.06);
  animation: bubbleRise linear infinite;
}
.deco-ocean .b1 {
  width: 20px;
  height: 20px;
  left: 5%;
  bottom: -30px;
  animation-duration: 6s;
  animation-delay: 0s;
}
.deco-ocean .b2 {
  width: 35px;
  height: 35px;
  left: 12%;
  bottom: -50px;
  animation-duration: 8s;
  animation-delay: 1s;
}
.deco-ocean .b3 {
  width: 14px;
  height: 14px;
  left: 22%;
  bottom: -20px;
  animation-duration: 5s;
  animation-delay: 2s;
}
.deco-ocean .b4 {
  width: 50px;
  height: 50px;
  left: 35%;
  bottom: -70px;
  animation-duration: 10s;
  animation-delay: 0.5s;
}
.deco-ocean .b5 {
  width: 22px;
  height: 22px;
  left: 48%;
  bottom: -30px;
  animation-duration: 7s;
  animation-delay: 3s;
}
.deco-ocean .b6 {
  width: 40px;
  height: 40px;
  left: 58%;
  bottom: -60px;
  animation-duration: 9s;
  animation-delay: 1.5s;
}
.deco-ocean .b7 {
  width: 16px;
  height: 16px;
  left: 68%;
  bottom: -25px;
  animation-duration: 6s;
  animation-delay: 4s;
}
.deco-ocean .b8 {
  width: 60px;
  height: 60px;
  left: 75%;
  bottom: -80px;
  animation-duration: 12s;
  animation-delay: 0s;
}
.deco-ocean .b9 {
  width: 25px;
  height: 25px;
  left: 82%;
  bottom: -35px;
  animation-duration: 7s;
  animation-delay: 2.5s;
}
.deco-ocean .b10 {
  width: 18px;
  height: 18px;
  left: 88%;
  bottom: -25px;
  animation-duration: 5s;
  animation-delay: 1s;
}
.deco-ocean .b11 {
  width: 45px;
  height: 45px;
  left: 92%;
  bottom: -65px;
  animation-duration: 11s;
  animation-delay: 3.5s;
}
.deco-ocean .b12 {
  width: 30px;
  height: 30px;
  left: 97%;
  bottom: -45px;
  animation-duration: 8s;
  animation-delay: 0.8s;
}
@keyframes bubbleRise {
  0% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-110vh) translateX(20px) scale(1.1);
    opacity: 0;
  }
}

/* 落日 */
/* 太阳容器：整体旋转，光线跟着转 */
.deco-sunset .sun-system {
  position: absolute;
  width: 130px;
  height: 130px;
  top: 50px;
  right: 140px;
  z-index: 2;
  animation: sunSystemRotate 25s linear infinite;
}
.deco-sunset .sun {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    #fffde7 0%,
    #fff176 20%,
    #ffb300 55%,
    #ff6f00 100%
  );
  box-shadow:
    0 0 60px 20px rgba(255, 179, 0, 0.4),
    0 0 120px 40px rgba(255, 120, 0, 0.2);
  animation: sunPulse 4s ease-in-out infinite;
  .sun-inner {
    position: absolute;
    inset: 15px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.8) 0%,
      transparent 70%
    );
    animation: sunInnerPulse 2s ease-in-out infinite;
  }
}
.deco-sunset .sun-ray {
  position: absolute;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(to top, rgba(255, 200, 0, 0.7), transparent);
  transform-origin: bottom center;
  /* 以太阳中心为原点 */
  left: calc(50% - 1.5px);
  bottom: 50%;
}
.deco-sunset .r1 {
  height: 90px;
  transform: rotate(0deg) translateY(-65px);
}
.deco-sunset .r2 {
  height: 75px;
  transform: rotate(30deg) translateY(-65px);
}
.deco-sunset .r3 {
  height: 90px;
  transform: rotate(60deg) translateY(-65px);
}
.deco-sunset .r4 {
  height: 75px;
  transform: rotate(90deg) translateY(-65px);
}
.deco-sunset .r5 {
  height: 90px;
  transform: rotate(120deg) translateY(-65px);
}
.deco-sunset .r6 {
  height: 75px;
  transform: rotate(150deg) translateY(-65px);
}
.deco-sunset .r7 {
  height: 90px;
  transform: rotate(180deg) translateY(-65px);
}
.deco-sunset .r8 {
  height: 75px;
  transform: rotate(210deg) translateY(-65px);
}
.deco-sunset .r9 {
  height: 90px;
  transform: rotate(240deg) translateY(-65px);
}
.deco-sunset .r10 {
  height: 75px;
  transform: rotate(270deg) translateY(-65px);
}
.deco-sunset .r11 {
  height: 90px;
  transform: rotate(300deg) translateY(-65px);
}
.deco-sunset .r12 {
  height: 75px;
  transform: rotate(330deg) translateY(-65px);
}
.deco-sunset .sun-halo {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 2px solid rgba(255, 179, 0, 0.25);
  top: 15px;
  right: 105px;
  z-index: 1;
  animation: haloExpand 4s ease-in-out infinite;
}
/* 地平线光晕波纹 */
.deco-sunset .horizon {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: linear-gradient(
    to top,
    rgba(255, 120, 0, 0.25) 0%,
    rgba(255, 179, 0, 0.1) 40%,
    transparent 100%
  );
  animation: horizonGlow 5s ease-in-out infinite;
}
.deco-sunset .horizon-ring {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  border: 2px solid rgba(255, 150, 0, 0.3);
  animation: horizonRingExpand 4s ease-out infinite;
}
.deco-sunset .hr1 {
  width: 300px;
  height: 80px;
  animation-delay: 0s;
}
.deco-sunset .hr2 {
  width: 500px;
  height: 120px;
  animation-delay: 1.3s;
}
.deco-sunset .hr3 {
  width: 700px;
  height: 160px;
  animation-delay: 2.6s;
}
.deco-sunset .cloud {
  position: absolute;
  animation: cloudDrift linear infinite;
}
.deco-sunset .cloud-puff {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
}
.deco-sunset .c1 {
  top: 160px;
  left: -260px;
  animation-duration: 28s;
  animation-delay: 0s;
  .p1 {
    width: 80px;
    height: 55px;
    left: 0;
    top: 10px;
  }
  .p2 {
    width: 100px;
    height: 65px;
    left: 50px;
    top: 0;
  }
  .p3 {
    width: 70px;
    height: 50px;
    left: 130px;
    top: 12px;
  }
}
.deco-sunset .c2 {
  top: 230px;
  left: -180px;
  animation-duration: 20s;
  animation-delay: -10s;
  .p1 {
    width: 60px;
    height: 40px;
    left: 0;
    top: 8px;
  }
  .p2 {
    width: 80px;
    height: 50px;
    left: 40px;
    top: 0;
  }
}
.deco-sunset .c3 {
  top: 100px;
  left: -320px;
  animation-duration: 35s;
  animation-delay: -5s;
  .p1 {
    width: 70px;
    height: 45px;
    left: 0;
    top: 10px;
  }
  .p2 {
    width: 90px;
    height: 55px;
    left: 45px;
    top: 0;
  }
  .p3 {
    width: 60px;
    height: 40px;
    left: 115px;
    top: 10px;
  }
}
.deco-sunset .bird {
  position: absolute;
  width: 20px;
  height: 6px;
  border-top: 3px solid rgba(80, 40, 0, 0.5);
  border-radius: 50% 50% 0 0 / 6px 6px 0 0;
  animation: birdFly linear infinite;
  &::before {
    content: '';
    position: absolute;
    width: 10px;
    height: 6px;
    right: -10px;
    top: -3px;
    border-top: 3px solid rgba(80, 40, 0, 0.5);
    border-radius: 50% 50% 0 0 / 6px 6px 0 0;
  }
}
.deco-sunset .bird1 {
  top: 80px;
  left: -30px;
  animation-duration: 14s;
  animation-delay: 0s;
}
.deco-sunset .bird2 {
  top: 100px;
  left: -60px;
  animation-duration: 16s;
  animation-delay: -3s;
}
.deco-sunset .bird3 {
  top: 70px;
  left: -90px;
  animation-duration: 18s;
  animation-delay: -6s;
}
.deco-sunset .bird4 {
  top: 120px;
  left: -40px;
  animation-duration: 13s;
  animation-delay: -9s;
}
.deco-sunset .bird5 {
  top: 90px;
  left: -70px;
  animation-duration: 15s;
  animation-delay: -12s;
}
.deco-sunset .spark {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 200, 50, 0.6);
  animation: sparkFloat ease-in-out infinite;
}
.deco-sunset .sp1 {
  width: 6px;
  height: 6px;
  top: 20%;
  left: 20%;
  animation-duration: 5s;
  animation-delay: 0s;
}
.deco-sunset .sp2 {
  width: 4px;
  height: 4px;
  top: 35%;
  left: 40%;
  animation-duration: 7s;
  animation-delay: 1s;
}
.deco-sunset .sp3 {
  width: 8px;
  height: 8px;
  top: 15%;
  left: 60%;
  animation-duration: 6s;
  animation-delay: 2s;
}
.deco-sunset .sp4 {
  width: 5px;
  height: 5px;
  top: 45%;
  left: 75%;
  animation-duration: 8s;
  animation-delay: 0.5s;
}
.deco-sunset .sp5 {
  width: 4px;
  height: 4px;
  top: 25%;
  left: 85%;
  animation-duration: 5s;
  animation-delay: 3s;
}
.deco-sunset .sp6 {
  width: 7px;
  height: 7px;
  top: 55%;
  left: 30%;
  animation-duration: 9s;
  animation-delay: 1.5s;
}
.deco-sunset .sp7 {
  width: 5px;
  height: 5px;
  top: 40%;
  left: 55%;
  animation-duration: 6s;
  animation-delay: 2.5s;
}
.deco-sunset .sp8 {
  width: 6px;
  height: 6px;
  top: 30%;
  left: 10%;
  animation-duration: 7s;
  animation-delay: 4s;
}
@keyframes sunSystemRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes sunPulse {
  0%,
  100% {
    box-shadow:
      0 0 60px 20px rgba(255, 179, 0, 0.4),
      0 0 120px 40px rgba(255, 120, 0, 0.2);
  }
  50% {
    box-shadow:
      0 0 90px 35px rgba(255, 179, 0, 0.55),
      0 0 160px 60px rgba(255, 120, 0, 0.3);
  }
}
@keyframes sunInnerPulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}
@keyframes haloExpand {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.6;
  }
}
@keyframes horizonGlow {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}
@keyframes horizonRingExpand {
  0% {
    transform: translateX(-50%) scaleX(0.3);
    opacity: 0.8;
  }
  100% {
    transform: translateX(-50%) scaleX(1.5);
    opacity: 0;
  }
}
@keyframes cloudDrift {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(130vw);
  }
}
@keyframes birdFly {
  0% {
    transform: translateX(0) translateY(0);
  }
  25% {
    transform: translateX(25vw) translateY(-15px);
  }
  50% {
    transform: translateX(50vw) translateY(5px);
  }
  75% {
    transform: translateX(75vw) translateY(-10px);
  }
  100% {
    transform: translateX(110vw) translateY(0);
  }
}
@keyframes sparkFloat {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-18px) scale(1.3);
    opacity: 1;
  }
}

/* 森林 */
.deco-forest .tree {
  position: absolute;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: treeSway 4s ease-in-out infinite;
}
.deco-forest .tree-top {
  width: 0;
  height: 0;
  border-left: solid transparent;
  border-right: solid transparent;
  border-bottom: solid;
}
.deco-forest .tree-trunk {
  background: #5d4037;
  border-radius: 2px;
}
.deco-forest .t1 {
  left: 3%;
  .tree-top {
    border-left-width: 30px;
    border-right-width: 30px;
    border-bottom-width: 70px;
    border-bottom-color: #2e7d32;
  }
  .tree-trunk {
    width: 12px;
    height: 30px;
  }
  animation-delay: 0s;
}
.deco-forest .t2 {
  left: 10%;
  .tree-top {
    border-left-width: 45px;
    border-right-width: 45px;
    border-bottom-width: 110px;
    border-bottom-color: #388e3c;
  }
  .tree-trunk {
    width: 18px;
    height: 45px;
  }
  animation-delay: 0.5s;
}
.deco-forest .t3 {
  left: 18%;
  .tree-top {
    border-left-width: 35px;
    border-right-width: 35px;
    border-bottom-width: 85px;
    border-bottom-color: #1b5e20;
  }
  .tree-trunk {
    width: 14px;
    height: 35px;
  }
  animation-delay: 1s;
}
.deco-forest .t4 {
  right: 5%;
  .tree-top {
    border-left-width: 40px;
    border-right-width: 40px;
    border-bottom-width: 95px;
    border-bottom-color: #43a047;
  }
  .tree-trunk {
    width: 16px;
    height: 40px;
  }
  animation-delay: 0.3s;
}
.deco-forest .t5 {
  right: 13%;
  .tree-top {
    border-left-width: 50px;
    border-right-width: 50px;
    border-bottom-width: 120px;
    border-bottom-color: #2e7d32;
  }
  .tree-trunk {
    width: 20px;
    height: 50px;
  }
  animation-delay: 0.8s;
}
.deco-forest .t6 {
  right: 22%;
  .tree-top {
    border-left-width: 28px;
    border-right-width: 28px;
    border-bottom-width: 65px;
    border-bottom-color: #66bb6a;
  }
  .tree-trunk {
    width: 11px;
    height: 28px;
  }
  animation-delay: 1.3s;
}
.deco-forest .leaf {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #66bb6a;
  border-radius: 50% 0;
  animation: leafFall linear infinite;
  opacity: 0.7;
}
.deco-forest .l1 {
  left: 25%;
  top: -20px;
  animation-duration: 6s;
  animation-delay: 0s;
}
.deco-forest .l2 {
  left: 40%;
  top: -20px;
  animation-duration: 8s;
  animation-delay: 1s;
}
.deco-forest .l3 {
  left: 55%;
  top: -20px;
  animation-duration: 5s;
  animation-delay: 2s;
}
.deco-forest .l4 {
  left: 65%;
  top: -20px;
  animation-duration: 7s;
  animation-delay: 0.5s;
}
.deco-forest .l5 {
  left: 30%;
  top: -20px;
  animation-duration: 9s;
  animation-delay: 3s;
}
.deco-forest .l6 {
  left: 70%;
  top: -20px;
  animation-duration: 6s;
  animation-delay: 1.5s;
}
.deco-forest .l7 {
  left: 45%;
  top: -20px;
  animation-duration: 8s;
  animation-delay: 4s;
}
.deco-forest .l8 {
  left: 80%;
  top: -20px;
  animation-duration: 5s;
  animation-delay: 2.5s;
}
@keyframes treeSway {
  0%,
  100% {
    transform: rotate(0deg);
    transform-origin: bottom center;
  }
  25% {
    transform: rotate(1.5deg);
    transform-origin: bottom center;
  }
  75% {
    transform: rotate(-1.5deg);
    transform-origin: bottom center;
  }
}
@keyframes leafFall {
  0% {
    transform: translateY(0) rotate(0deg) translateX(0);
    opacity: 0.7;
  }
  100% {
    transform: translateY(110vh) rotate(720deg) translateX(60px);
    opacity: 0;
  }
}

/* 极光 - 垂直光幕，更高亮度 */
.deco-aurora .aurora-curtain {
  position: absolute;
  top: -10%;
  width: 100px;
  height: 130%;
  border-radius: 50px;
  filter: blur(20px);
  animation: curtainDance ease-in-out infinite;
}
.deco-aurora .ac1 {
  left: 3%;
  background: linear-gradient(
    180deg,
    transparent 5%,
    rgba(0, 230, 118, 0.7),
    rgba(0, 188, 212, 0.6),
    transparent 95%
  );
  animation-duration: 7s;
  animation-delay: 0s;
}
.deco-aurora .ac2 {
  left: 16%;
  background: linear-gradient(
    180deg,
    transparent 5%,
    rgba(124, 77, 255, 0.7),
    rgba(0, 230, 118, 0.5),
    transparent 95%
  );
  animation-duration: 9s;
  animation-delay: -2s;
}
.deco-aurora .ac3 {
  left: 32%;
  background: linear-gradient(
    180deg,
    transparent 5%,
    rgba(0, 188, 212, 0.65),
    rgba(224, 64, 251, 0.55),
    transparent 95%
  );
  animation-duration: 11s;
  animation-delay: -4s;
}
.deco-aurora .ac4 {
  left: 50%;
  background: linear-gradient(
    180deg,
    transparent 5%,
    rgba(0, 230, 118, 0.6),
    rgba(124, 77, 255, 0.65),
    transparent 95%
  );
  animation-duration: 8s;
  animation-delay: -1s;
}
.deco-aurora .ac5 {
  left: 66%;
  background: linear-gradient(
    180deg,
    transparent 5%,
    rgba(224, 64, 251, 0.6),
    rgba(0, 188, 212, 0.55),
    transparent 95%
  );
  animation-duration: 10s;
  animation-delay: -3s;
}
.deco-aurora .ac6 {
  left: 82%;
  background: linear-gradient(
    180deg,
    transparent 5%,
    rgba(0, 188, 212, 0.7),
    rgba(0, 230, 118, 0.6),
    transparent 95%
  );
  animation-duration: 12s;
  animation-delay: -5s;
}
/* 波浪流动光带 */
.deco-aurora .aurora-wave {
  position: absolute;
  left: -5%;
  width: 110%;
  height: 40px;
  border-radius: 50%;
  filter: blur(15px);
  animation: waveFlow ease-in-out infinite;
}
.deco-aurora .aw1 {
  top: 12%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 230, 118, 0.5),
    rgba(0, 188, 212, 0.6),
    rgba(124, 77, 255, 0.4),
    transparent
  );
  animation-duration: 5s;
  animation-delay: 0s;
}
.deco-aurora .aw2 {
  top: 22%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(124, 77, 255, 0.4),
    rgba(224, 64, 251, 0.5),
    rgba(0, 230, 118, 0.4),
    transparent
  );
  animation-duration: 7s;
  animation-delay: -2s;
}
.deco-aurora .aw3 {
  top: 32%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 188, 212, 0.45),
    rgba(0, 230, 118, 0.5),
    rgba(224, 64, 251, 0.35),
    transparent
  );
  animation-duration: 9s;
  animation-delay: -4s;
}
.deco-aurora .aw4 {
  top: 8%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(224, 64, 251, 0.35),
    rgba(0, 188, 212, 0.45),
    transparent
  );
  animation-duration: 6s;
  animation-delay: -1s;
}
.deco-aurora .aurora-shimmer {
  position: absolute;
  left: -5%;
  width: 110%;
  border-radius: 50%;
  filter: blur(40px);
  animation: shimmerPulse ease-in-out infinite;
}
.deco-aurora .as1 {
  height: 60px;
  top: 8%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 230, 118, 0.3),
    rgba(0, 188, 212, 0.35),
    transparent
  );
  animation-duration: 6s;
  animation-delay: 0s;
}
.deco-aurora .as2 {
  height: 80px;
  top: 18%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(124, 77, 255, 0.25),
    rgba(224, 64, 251, 0.3),
    transparent
  );
  animation-duration: 8s;
  animation-delay: -3s;
}
.deco-aurora .as3 {
  height: 50px;
  top: 28%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 188, 212, 0.25),
    rgba(0, 230, 118, 0.25),
    transparent
  );
  animation-duration: 10s;
  animation-delay: -6s;
}
.deco-aurora .meteor {
  position: absolute;
  width: 2px;
  height: 80px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), transparent);
  border-radius: 2px;
  animation: meteorFall linear infinite;
  opacity: 0;
}
.deco-aurora .m1 {
  top: -100px;
  left: 15%;
  animation-duration: 3s;
  animation-delay: 0s;
}
.deco-aurora .m2 {
  top: -100px;
  left: 45%;
  animation-duration: 4s;
  animation-delay: -1.5s;
}
.deco-aurora .m3 {
  top: -100px;
  left: 70%;
  animation-duration: 3.5s;
  animation-delay: -2.5s;
}
.deco-aurora .m4 {
  top: -100px;
  left: 88%;
  animation-duration: 5s;
  animation-delay: -0.8s;
}
.deco-aurora .star {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: starTwinkle ease-in-out infinite;
}
.deco-aurora .s1 {
  width: 2px;
  height: 2px;
  top: 2%;
  left: 5%;
  animation-duration: 2s;
  animation-delay: 0s;
}
.deco-aurora .s2 {
  width: 3px;
  height: 3px;
  top: 5%;
  left: 15%;
  animation-duration: 3s;
  animation-delay: 0.5s;
}
.deco-aurora .s3 {
  width: 2px;
  height: 2px;
  top: 3%;
  left: 25%;
  animation-duration: 2.5s;
  animation-delay: 1s;
}
.deco-aurora .s4 {
  width: 4px;
  height: 4px;
  top: 8%;
  left: 35%;
  animation-duration: 4s;
  animation-delay: 0.3s;
}
.deco-aurora .s5 {
  width: 2px;
  height: 2px;
  top: 1%;
  left: 45%;
  animation-duration: 2s;
  animation-delay: 1.5s;
}
.deco-aurora .s6 {
  width: 3px;
  height: 3px;
  top: 6%;
  left: 55%;
  animation-duration: 3.5s;
  animation-delay: 0.8s;
}
.deco-aurora .s7 {
  width: 2px;
  height: 2px;
  top: 4%;
  left: 65%;
  animation-duration: 2s;
  animation-delay: 2s;
}
.deco-aurora .s8 {
  width: 3px;
  height: 3px;
  top: 9%;
  left: 72%;
  animation-duration: 3s;
  animation-delay: 0.2s;
}
.deco-aurora .s9 {
  width: 2px;
  height: 2px;
  top: 2%;
  left: 80%;
  animation-duration: 2.5s;
  animation-delay: 1.2s;
}
.deco-aurora .s10 {
  width: 4px;
  height: 4px;
  top: 7%;
  left: 88%;
  animation-duration: 4s;
  animation-delay: 0.6s;
}
.deco-aurora .s11 {
  width: 2px;
  height: 2px;
  top: 12%;
  left: 8%;
  animation-duration: 2s;
  animation-delay: 1.8s;
}
.deco-aurora .s12 {
  width: 3px;
  height: 3px;
  top: 15%;
  left: 20%;
  animation-duration: 3s;
  animation-delay: 0.4s;
}
.deco-aurora .s13 {
  width: 2px;
  height: 2px;
  top: 10%;
  left: 30%;
  animation-duration: 2.5s;
  animation-delay: 2.2s;
}
.deco-aurora .s14 {
  width: 3px;
  height: 3px;
  top: 18%;
  left: 42%;
  animation-duration: 3.5s;
  animation-delay: 0.9s;
}
.deco-aurora .s15 {
  width: 2px;
  height: 2px;
  top: 13%;
  left: 52%;
  animation-duration: 2s;
  animation-delay: 1.6s;
}
.deco-aurora .s16 {
  width: 4px;
  height: 4px;
  top: 16%;
  left: 62%;
  animation-duration: 4s;
  animation-delay: 0.1s;
}
.deco-aurora .s17 {
  width: 2px;
  height: 2px;
  top: 11%;
  left: 70%;
  animation-duration: 2.5s;
  animation-delay: 2.8s;
}
.deco-aurora .s18 {
  width: 3px;
  height: 3px;
  top: 19%;
  left: 78%;
  animation-duration: 3s;
  animation-delay: 1.1s;
}
.deco-aurora .s19 {
  width: 2px;
  height: 2px;
  top: 14%;
  left: 85%;
  animation-duration: 2s;
  animation-delay: 0.7s;
}
.deco-aurora .s20 {
  width: 3px;
  height: 3px;
  top: 17%;
  left: 93%;
  animation-duration: 3.5s;
  animation-delay: 1.9s;
}
@keyframes curtainDance {
  0% {
    transform: translateX(-15px) scaleX(0.85);
    opacity: 0.5;
  }
  25% {
    opacity: 0.95;
  }
  50% {
    transform: translateX(15px) scaleX(1.2);
    opacity: 0.8;
  }
  75% {
    opacity: 0.95;
  }
  100% {
    transform: translateX(-15px) scaleX(0.85);
    opacity: 0.5;
  }
}
@keyframes waveFlow {
  0% {
    transform: translateX(-8%) scaleY(0.8);
    opacity: 0.5;
  }
  50% {
    transform: translateX(8%) scaleY(1.3);
    opacity: 1;
  }
  100% {
    transform: translateX(-8%) scaleY(0.8);
    opacity: 0.5;
  }
}
@keyframes shimmerPulse {
  0%,
  100% {
    transform: scaleY(1) translateX(0);
    opacity: 0.6;
  }
  50% {
    transform: scaleY(1.4) translateX(3%);
    opacity: 1;
  }
}
@keyframes meteorFall {
  0% {
    transform: translateY(0) translateX(0) rotate(30deg);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  60% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(110vh) translateX(60px) rotate(30deg);
    opacity: 0;
  }
}
@keyframes starTwinkle {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

/* 极光主题专属头像框：闪烁极光边框，与彩虹旋转环完全不同 */
.theme-aurora .avatar-ring {
  background: none !important;
  animation: none !important;
  inset: -5px !important;
  border-radius: 50%;
  overflow: hidden;
  z-index: 0 !important;
  &::before {
    content: '';
    position: absolute;
    inset: -50%;
    background: conic-gradient(
      rgba(0, 230, 118, 0) 0deg,
      rgba(0, 230, 118, 0.9) 60deg,
      rgba(0, 188, 212, 0.9) 120deg,
      rgba(124, 77, 255, 0.9) 180deg,
      rgba(224, 64, 251, 0.9) 240deg,
      rgba(0, 230, 118, 0) 300deg
    );
    animation: auroraBeamSpin 4s linear infinite;
    border-radius: 50%;
  }
  &::after {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background: transparent;
    z-index: 2;
  }
}
@keyframes auroraBeamSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 内容层 */
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}
.back-btn {
  margin-bottom: 20px;
  border-radius: 8px;
}

.user-header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  margin-bottom: 24px;

  .cover-bg {
    height: 180px;
    background: transparent;
    position: relative;
    overflow: hidden;
    .cover-particles {
      position: absolute;
      inset: 0;
      .particle {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        animation: particleFloat 4s ease-in-out infinite;
        &:nth-child(1) {
          left: 12%;
          top: 27%;
          width: 7px;
          height: 7px;
          animation-delay: 0.4s;
          opacity: 0.45;
        }
        &:nth-child(2) {
          left: 24%;
          top: 34%;
          width: 10px;
          height: 10px;
          animation-delay: 0.8s;
          opacity: 0.6;
        }
        &:nth-child(3) {
          left: 36%;
          top: 41%;
          width: 7px;
          height: 7px;
          animation-delay: 1.2s;
          opacity: 0.75;
        }
        &:nth-child(4) {
          left: 48%;
          top: 48%;
          width: 10px;
          height: 10px;
          animation-delay: 1.6s;
          opacity: 0.45;
        }
        &:nth-child(5) {
          left: 60%;
          top: 55%;
          width: 7px;
          height: 7px;
          animation-delay: 2s;
          opacity: 0.6;
        }
        &:nth-child(6) {
          left: 72%;
          top: 62%;
          width: 10px;
          height: 10px;
          animation-delay: 2.4s;
          opacity: 0.75;
        }
        &:nth-child(7) {
          left: 84%;
          top: 69%;
          width: 7px;
          height: 7px;
          animation-delay: 2.8s;
          opacity: 0.45;
        }
        &:nth-child(8) {
          left: 96%;
          top: 76%;
          width: 10px;
          height: 10px;
          animation-delay: 3.2s;
          opacity: 0.6;
        }
      }
    }
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
      .avatar-ring {
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        background: var(
          --theme-gradient,
          linear-gradient(135deg, #667eea, #764ba2)
        );
        animation: ringRotate 3s linear infinite;
        z-index: -1;
      }
      .user-avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 5px solid white;
        object-fit: cover;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        position: relative;
        z-index: 1;
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
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      .user-id {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        .id-badge {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.75);
          background: rgba(255, 255, 255, 0.15);
          padding: 2px 10px;
          border-radius: 20px;
        }
        .theme-badge {
          font-size: 12px;
          color: white;
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 10px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          animation: badgePulse 2s ease-in-out infinite;
        }
      }
    }
    .follow-btn {
      margin-bottom: 8px;
      border-radius: 20px;
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 600;
      transition: all 0.3s ease;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
      background: var(--el-bg-color);
      padding: 24px;
      text-align: center;
      transition: all 0.3s ease;
      &.clickable {
        cursor: pointer;
        &:hover {
          background: var(--el-fill-color-light);
          transform: translateY(-2px);
          .stat-value {
            color: var(--theme-primary, #667eea);
          }
        }
      }
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        margin-bottom: 8px;
        transition: color 0.3s ease;
      }
      .stat-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

.posts-section {
  .section-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--el-text-color-primary);
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
      background: var(--el-bg-color);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      display: flex;
      gap: 20px;
      border-left: 3px solid transparent;
      position: relative;
      overflow: hidden;
      isolation: isolate;
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        border-left-color: var(--theme-primary, #667eea);
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
        animation: profilePostStarNebulaShift 5.2s ease-in-out infinite;
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
          animation: profilePostStarFieldMove 4.2s linear infinite;
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
            profilePostMeteorRain 2.1s linear infinite,
            profilePostLightSweep 2s ease-in-out infinite;
          z-index: 0;
        }
        .post-title {
          color: #eef3ff !important;
        }
        .post-excerpt,
        .post-time,
        .post-stats .stat {
          color: rgba(238, 243, 255, 0.78) !important;
        }
        .post-cover::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          border: 1px solid rgba(177, 232, 255, 0.44);
          box-shadow: inset 0 0 20px rgba(126, 196, 255, 0.24);
          animation: profilePostEnergyPulse 1.6s ease-in-out infinite;
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
          profilePostSakuraBloom 3.2s ease-in-out infinite,
          profilePostSakuraDrift 6.5s linear infinite;
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
            profilePostPetalFloat 2.3s ease-in-out infinite,
            profilePostPetalStorm 1.45s linear infinite,
            profilePostPetalTwirl 1.9s ease-in-out infinite;
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
            profilePostGlowPulse 1s ease-in-out infinite,
            profilePostSakuraColorShift 1.8s linear infinite,
            profilePostSakuraRibbon 2s linear infinite;
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
        .post-time,
        .post-stats .stat {
          color: rgba(118, 44, 94, 0.78) !important;
        }
        .post-cover::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          border: 1px solid rgba(255, 190, 226, 0.6);
          box-shadow: inset 0 0 20px rgba(255, 145, 210, 0.3);
          animation: profilePostEnergyPulse 1.4s ease-in-out infinite;
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
          profilePostNeonPulse 1.2s ease-in-out infinite,
          profilePostNeonHueRotate 3.5s linear infinite,
          profilePostNeonBgShift 2.3s ease-in-out infinite;
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
          animation: profilePostNeonShift 2s linear infinite;
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
          animation: profilePostLaserScan 1.35s linear infinite;
          z-index: 0;
        }
        .post-title {
          color: #ddf8ff !important;
        }
        .post-excerpt,
        .post-time,
        .post-stats .stat {
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
          animation: profilePostEnergyRotate 2.2s linear infinite;
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
          profilePostLavaPulse 1.15s ease-in-out infinite,
          profilePostLavaBgShift 1.9s ease-in-out infinite,
          profilePostLavaShake 0.95s ease-in-out infinite;
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
            profilePostLavaFlow 1.5s ease-in-out infinite,
            profilePostLavaBurst 1.3s ease-in-out infinite;
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
            profilePostLightSweep 1.2s ease-in-out infinite,
            profilePostLavaCrackFlicker 0.75s linear infinite;
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
        .post-time,
        .post-stats .stat {
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
          animation: profilePostEnergyPulse 0.95s ease-in-out infinite;
        }
        &:hover {
          box-shadow:
            inset 0 0 0 1px rgba(255, 210, 140, 0.35),
            0 0 44px rgba(255, 122, 25, 0.52),
            0 0 90px rgba(255, 72, 0, 0.32);
          filter: saturate(1.32);
        }
      }
      .post-cover {
        position: relative;
        z-index: 1;
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
        position: relative;
        z-index: 1;
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
            color: var(--el-text-color-primary);
            margin: 0 0 12px 0;
            line-height: 1.4;
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
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--el-border-color-lighter);
          .post-time {
            font-size: 13px;
            color: var(--el-text-color-placeholder);
          }
          .post-stats {
            display: flex;
            gap: 20px;
            .stat {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 14px;
              color: var(--el-text-color-secondary);
              i {
                font-size: 16px;
              }
            }
          }
        }
      }
      &.post-enter {
        .post-cover {
          animation: profilePostEnterCover 560ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--enter-delay, 0ms);
        }
        .post-content {
          animation: profilePostEnterContent 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: calc(var(--enter-delay, 0ms) + 70ms);
        }
      }
    }
  }
}

@keyframes particleFloat {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 1;
  }
}
@keyframes ringRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes badgePulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes profilePostStarFieldMove {
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
@keyframes profilePostStarNebulaShift {
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
@keyframes profilePostMeteorRain {
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
@keyframes profilePostLightSweep {
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
@keyframes profilePostPetalFloat {
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
@keyframes profilePostPetalStorm {
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
@keyframes profilePostPetalTwirl {
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
@keyframes profilePostSakuraBloom {
  0%,
  100% {
    background-position:
      0% 20%,
      0% 50%,
      10% 15%,
      30% 30%,
      0% 50%;
    box-shadow: 0 2px 14px rgba(255, 160, 205, 0.26);
  }
  50% {
    background-position:
      100% 80%,
      100% 50%,
      95% 80%,
      80% 70%,
      100% 50%;
    box-shadow:
      0 8px 28px rgba(255, 120, 190, 0.35),
      0 0 40px rgba(255, 180, 220, 0.28);
  }
}
@keyframes profilePostSakuraColorShift {
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
@keyframes profilePostSakuraDrift {
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
@keyframes profilePostSakuraRibbon {
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
@keyframes profilePostHudFlicker {
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
@keyframes profilePostBadgeGlitch {
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
@keyframes profilePostBadgeFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}
@keyframes profilePostSakuraPetalFlash {
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
@keyframes profilePostEnergyRotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes profilePostEnergyPulse {
  0%,
  100% {
    opacity: 0.78;
  }
  50% {
    opacity: 1;
  }
}

@keyframes profilePostEnterCover {
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

@keyframes profilePostEnterContent {
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
@keyframes profilePostGlowPulse {
  0%,
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 0.85;
  }
}
@keyframes profilePostNeonPulse {
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
@keyframes profilePostNeonHueRotate {
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
@keyframes profilePostNeonBgShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
@keyframes profilePostNeonShift {
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
@keyframes profilePostLaserScan {
  0% {
    transform: translateX(-130%);
  }
  100% {
    transform: translateX(130%);
  }
}
@keyframes profilePostLavaFlow {
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
@keyframes profilePostLavaBurst {
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
@keyframes profilePostLavaPulse {
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
@keyframes profilePostLavaBgShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
@keyframes profilePostLavaCrackFlicker {
  0%,
  100% {
    opacity: 0.38;
  }
  50% {
    opacity: 0.85;
  }
}
@keyframes profilePostLavaShake {
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
@keyframes profilePostLavaSpark {
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
@keyframes profilePostLavaCoreFlash {
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

/* 深海主题：卡片用半透明深蓝，文字用白色 */
.theme-ocean {
  .stats-grid .stat-card {
    background: rgba(13, 71, 161, 0.6);
    backdrop-filter: blur(10px);
    .stat-value {
      color: #e3f2fd;
    }
    .stat-label {
      color: rgba(227, 242, 253, 0.7);
    }
    &.clickable:hover {
      background: rgba(21, 101, 192, 0.7);
      .stat-value {
        color: #4fc3f7;
      }
    }
  }
  .posts-section .section-title {
    color: #e3f2fd;
  }
  .posts-section .post-item {
    background: rgba(13, 71, 161, 0.5);
    backdrop-filter: blur(8px);
    .post-title {
      color: #e3f2fd;
    }
    .post-excerpt {
      color: rgba(227, 242, 253, 0.7);
    }
    .post-time {
      color: rgba(227, 242, 253, 0.5);
    }
    .post-stats .stat {
      color: rgba(227, 242, 253, 0.7);
    }
    .post-footer {
      border-top-color: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
