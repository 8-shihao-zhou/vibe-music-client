<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoriteStore } from '@/stores/modules/favorite'
import { UserStore } from '@/stores/modules/user'
import coverImg from '@/assets/cover.png'

const router = useRouter()
const favoriteStore = useFavoriteStore()
const user = UserStore()

// 便于页面顶部展示收藏数量
const favoriteCount = computed(() => favoriteStore.favoritePlaylists.length)
</script>

<template>
  <div class="favorite-playlists-page">
    <section class="favorite-hero">
      <div class="hero-copy">
        <p class="hero-kicker">Favorite Playlists</p>
        <h1 class="hero-title">收藏歌单</h1>
        <p class="hero-subtitle">
          把你想反复回访的歌单都整理在这里，切换心情时可以更快找到合适的音乐集合。
        </p>

        <div class="hero-stats">
          <div class="stat-card">
            <span class="stat-label">已收藏歌单</span>
            <strong>{{ favoriteCount }}</strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">当前状态</span>
            <strong>{{ user.isLoggedIn ? '已登录' : '未登录' }}</strong>
          </div>
        </div>
      </div>

      <div class="hero-preview">
        <div class="preview-stack preview-a" />
        <div class="preview-stack preview-b" />
        <div class="preview-main">
          <img
            :src="favoriteStore.favoritePlaylists[0]?.coverImgUrl || coverImg"
            alt="收藏歌单封面"
          />
        </div>
      </div>

      <div class="hero-glow hero-glow-a" />
      <div class="hero-glow hero-glow-b" />
    </section>

    <section class="playlist-panel">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">Library</p>
          <h2 class="panel-title">我的收藏歌单</h2>
        </div>
        <span class="panel-tip">点击卡片可进入歌单详情</span>
      </div>

      <div v-if="!user.isLoggedIn" class="state-card">
        <i class="i-carbon-user-avatar state-icon" />
        <h3>登录后查看收藏歌单</h3>
        <p>当前页面已保留样式与入口，登录后即可展示你的歌单内容。</p>
      </div>

      <div v-else-if="favoriteStore.loading" class="skeleton-grid">
        <div
          v-for="item in 6"
          :key="item"
          class="skeleton-card"
        >
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="image" class="skeleton-cover" />
              <div class="skeleton-text-wrap">
                <el-skeleton-item variant="text" style="width: 72%" />
                <el-skeleton-item variant="text" style="width: 52%" />
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>

      <div
        v-else-if="favoriteStore.favoritePlaylists.length === 0"
        class="state-card"
      >
        <i class="i-carbon-star state-icon" />
        <h3>还没有收藏歌单</h3>
        <p>看到喜欢的歌单后点一下收藏，这里就会自动帮你整理好。</p>
      </div>

      <div v-else class="playlist-grid">
        <div
          v-for="item in favoriteStore.favoritePlaylists"
          :key="item.id"
          class="playlist-card"
          @click="router.push(`/playlist/${item.id}`)"
        >
          <div class="playlist-cover-wrap">
            <img
              :src="item.coverImgUrl || coverImg"
              :alt="item.name"
              class="playlist-cover"
            />
            <div class="playlist-overlay">
              <span class="playlist-enter">查看歌单</span>
            </div>
          </div>

          <div class="playlist-body">
            <p class="playlist-name">{{ item.name }}</p>
            <p class="playlist-desc">已加入你的常用收藏列表</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.favorite-playlists-page {
  min-height: 100%;
  padding: 20px;
  background:
    radial-gradient(circle at top left, rgba(117, 139, 255, 0.12), transparent 30%),
    radial-gradient(circle at top right, rgba(255, 194, 210, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(247, 249, 255, 0.95), rgba(252, 252, 255, 0.98));
}

.favorite-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 320px;
  gap: 28px;
  padding: 28px;
  overflow: hidden;
  border: 1px solid rgba(140, 168, 230, 0.16);
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 245, 255, 0.92)),
    #fff;
  box-shadow: 0 22px 52px rgba(91, 118, 179, 0.13);
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.hero-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6e7ee0;
}

.hero-title {
  margin: 0;
  font-size: 40px;
  line-height: 1.12;
  color: #223350;
}

.hero-subtitle {
  max-width: 720px;
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.8;
  color: #687891;
}

.hero-stats {
  display: flex;
  gap: 14px;
  margin-top: 22px;
  flex-wrap: wrap;
}

.stat-card {
  min-width: 150px;
  padding: 14px 16px;
  border: 1px solid rgba(146, 174, 226, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 10px 22px rgba(98, 123, 178, 0.1);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #7b89a4;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 22px;
  color: #253754;
}

.hero-preview {
  position: relative;
  width: 320px;
  height: 240px;
  justify-self: end;
}

.preview-stack,
.preview-main {
  position: absolute;
  inset: 0;
  border-radius: 28px;
}

.preview-a {
  transform: rotate(-10deg) translate(-8px, 12px);
  background: linear-gradient(135deg, rgba(124, 145, 238, 0.2), rgba(255, 174, 198, 0.12));
}

.preview-b {
  transform: rotate(8deg) translate(10px, -6px);
  background: linear-gradient(135deg, rgba(255, 194, 210, 0.16), rgba(123, 144, 236, 0.14));
}

.preview-main {
  overflow: hidden;
  box-shadow: 0 24px 42px rgba(85, 111, 170, 0.24);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.hero-glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.hero-glow-a {
  top: -70px;
  right: 210px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(134, 172, 255, 0.24), transparent 70%);
}

.hero-glow-b {
  right: -40px;
  bottom: -46px;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(255, 191, 208, 0.24), transparent 70%);
}

.playlist-panel {
  margin-top: 24px;
  padding: 22px;
  border: 1px solid rgba(140, 168, 228, 0.14);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 255, 0.94)),
    #fff;
  box-shadow: 0 18px 38px rgba(86, 111, 168, 0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.panel-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6f7ee2;
}

.panel-title {
  margin: 0;
  font-size: 24px;
  color: #233451;
}

.panel-tip {
  font-size: 13px;
  color: #7b89a4;
}

.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 32px 20px;
  border: 1px dashed rgba(142, 169, 223, 0.26);
  border-radius: 24px;
  text-align: center;
  background: linear-gradient(180deg, rgba(248, 250, 255, 0.92), rgba(255, 255, 255, 0.96));

  h3 {
    margin: 16px 0 10px;
    font-size: 22px;
    color: #263754;
  }

  p {
    margin: 0;
    max-width: 460px;
    line-height: 1.8;
    color: #6f7f98;
  }
}

.state-icon {
  font-size: 44px;
  color: #7686e5;
}

.skeleton-grid,
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 18px;
}

.skeleton-card,
.playlist-card {
  border: 1px solid rgba(144, 170, 223, 0.14);
  border-radius: 22px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.95)),
    #fff;
  box-shadow: 0 14px 28px rgba(91, 116, 172, 0.1);
}

.skeleton-card {
  padding: 12px;
}

.skeleton-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
}

.skeleton-text-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.playlist-card {
  cursor: pointer;
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(109, 142, 218, 0.24);
    box-shadow: 0 18px 34px rgba(91, 116, 172, 0.15);
  }
}

.playlist-cover-wrap {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.playlist-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.32s ease;
}

.playlist-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 14px;
  opacity: 0;
  background: linear-gradient(180deg, rgba(22, 32, 58, 0.02), rgba(22, 32, 58, 0.66));
  transition: opacity 0.28s ease;
}

.playlist-enter {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
}

.playlist-card:hover {
  .playlist-cover {
    transform: scale(1.05);
  }

  .playlist-overlay {
    opacity: 1;
  }
}

.playlist-body {
  padding: 14px 14px 16px;
}

.playlist-name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  color: #223451;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.playlist-desc {
  margin: 8px 0 0;
  font-size: 12px;
  color: #7b89a4;
}

@media (max-width: 1024px) {
  .favorite-hero {
    grid-template-columns: 1fr;
  }

  .hero-preview {
    justify-self: start;
  }
}

@media (max-width: 768px) {
  .favorite-playlists-page {
    padding: 14px;
  }

  .favorite-hero,
  .playlist-panel {
    padding: 18px 16px;
    border-radius: 22px;
  }

  .hero-title {
    font-size: 30px;
  }

  .hero-preview {
    width: 220px;
    height: 170px;
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .skeleton-grid,
  .playlist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
