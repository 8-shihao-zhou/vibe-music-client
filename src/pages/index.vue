<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import {
  getAllSongs,
  getRecommendedPlaylists,
  getRecommendedSongs,
  getStyleList,
} from '@/api/system'
import type { Song } from '@/api/interface'
import { formatMillisecondsToTime } from '@/utils'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { UserStore } from '@/stores/modules/user'
import { AudioStore } from '@/stores/modules/audio'
import defaultAlbum from '@/assets/default_album.jpg'
import coverImg from '@/assets/cover.png'

interface PlaylistPreview {
  id: number
  title: string
  coverUrl: string
}

interface GenrePreview {
  styleId: number
  name: string
  songCount: number
}

//初始化实例
const router = useRouter()
const userStore = UserStore()
const audioStore = AudioStore()
const { loadTrack, play } = useAudioPlayer()

//响应式数据
const loading = ref(false)
const highlightSongs = ref<Song[]>([])
const latestSongs = ref<Song[]>([])
const playlists = ref<PlaylistPreview[]>([])
const genres = ref<GenrePreview[]>([])

//快捷入口配置
const quickEntries = [
  {
    title: '每日推荐',
    desc: '看看今天适合循环播放的歌曲',
    icon: 'ri:calendar-2-line',
    route: '/daily',
  },
  {
    title: '曲风探索',
    desc: '按氛围和风格找到想听的歌',
    icon: 'ri:price-tag-3-line',
    route: '/genre',
  },
  {
    title: '精选歌单',
    desc: '快速进入不同主题歌单',
    icon: 'ri:album-line',
    route: '/playlist',
  },
  {
    title: '音乐社区',
    desc: '看看大家最近在聊什么',
    icon: 'ri:discuss-line',
    route: '/community',
  },
]

//根据登录状态自动切换欢迎语
const welcomeText = computed(() =>
  userStore.isLoggedIn
    ? '回来继续听你喜欢的内容吧。'
    : '在这里发现歌曲、歌单和你感兴趣的音乐内容。'
)

//首页顶部统计卡片数据
const summaryCards = computed(() => [
  {
    label: '首页精选',
    value: highlightSongs.value.length,
    tip: '适合直接开听',
  },
  {
    label: '推荐歌单',
    value: playlists.value.length,
    tip: '快速进入主题场景',
  },
  {
    label: '热门曲风',
    value: genres.value.length,
    tip: '按风格继续逛',
  },
])

//打乱数组后再截取，避免首页每次都是固定内容
const pickRandomItems = <T,>(items: T[], count: number) => {
  //复制原数组，不修改原来的数据
  const copied = [...items]

  //循环：从后往前打乱数组
  for (let i = copied.length - 1; i > 0; i -= 1) {
    //生成一个随机位置
    const randomIndex = Math.floor(Math.random() * (i + 1))

    //交换位置：打乱
    ;[copied[i], copied[randomIndex]] = [copied[randomIndex], copied[i]]
  }

  //截取前 count 个返回
  return copied.slice(0, count)
}

//让首页展示数量在可控范围内随机，避免内容过少单调或过多撑高页面
const getRandomCount = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

//页面加载时请求所有首页数据
const fetchHomeData = async () => {
  loading.value = true
  try {
    //随机展示数量（每次打开首页不一样，更自然）
    const songDisplayCount = getRandomCount(4, 7)
    const playlistDisplayCount = getRandomCount(3, 5)
    const genreDisplayCount = getRandomCount(6, 9)

    //同时请求 4 个接口（推荐歌曲、最新歌曲、歌单、曲风）
    const [recommendSongsRes, latestSongsRes, playlistsRes, stylesRes] =
      await Promise.allSettled([
        getRecommendedSongs(),
        getAllSongs({
          pageNum: 1,
          pageSize: 24,
          songName: '',
          artistName: '',
          album: '',
        }),
        getRecommendedPlaylists(),
        getStyleList(),
      ])

    //处理推荐歌曲
    if (
      recommendSongsRes.status === 'fulfilled' &&
      recommendSongsRes.value.code === 0
    ) {
      highlightSongs.value = pickRandomItems(
        (recommendSongsRes.value.data as Song[]) || [],
        songDisplayCount
      )
    }

    //处理最新歌曲
    if (
      latestSongsRes.status === 'fulfilled' &&
      latestSongsRes.value.code === 0
    ) {
      latestSongs.value = pickRandomItems(
        latestSongsRes.value.data?.items || [],
        songDisplayCount
      )
    }

    //处理推荐歌单
    if (playlistsRes.status === 'fulfilled' && playlistsRes.value.code === 0) {
      const playlistSource = ((playlistsRes.value.data as any[]) || []).map(
        (item) => ({
          id: item.playlistId,
          title: item.title,
          coverUrl: item.coverUrl || coverImg,
        })
      )
      playlists.value = pickRandomItems(playlistSource, playlistDisplayCount)
    }

    //处理曲风列表
    if (stylesRes.status === 'fulfilled' && stylesRes.value.code === 0) {
      const genreSource = ((stylesRes.value.data as any[]) || []).map(
        (item) => ({
          styleId: item.styleId,
          name: item.name,
          songCount: Number(item.songCount || 0),
        })
      )
      genres.value = pickRandomItems(genreSource, genreDisplayCount)
    }

    //如果没有精选歌曲，就用最新歌曲兜底
    if (!highlightSongs.value.length) {
      highlightSongs.value = latestSongs.value
    }
  } finally {
    loading.value = false
  }
}

//点击歌曲播放
const playSong = async (song: Song) => {
  //优先用精选歌曲作为播放列表
  const sourceSongs = highlightSongs.value.length
    ? highlightSongs.value
    : latestSongs.value

  //过滤掉没有播放地址的歌曲，避免报错
  const trackList = sourceSongs
    .filter((item) => item.audioUrl)
    .map((item) => ({
      id: String(item.songId),
      title: item.songName,
      artist: item.artistName,
      album: item.album,
      cover: item.coverUrl || defaultAlbum,
      url: item.audioUrl,
      duration: Number(item.duration) || 0,
      likeStatus: Number(item.likeStatus) === 1 ? 1 : 0,
    }))

  //找到当前点击的歌曲在列表中的位置
  const targetIndex = trackList.findIndex(
    (item) => Number(item.id) === song.songId
  )
  if (targetIndex < 0) return

  //更新全局播放状态（所有页面同步）
  audioStore.setAudioStore('trackList', trackList)
  audioStore.setAudioStore('currentSongIndex', targetIndex)

  //加载并播放
  await loadTrack()
  play()
}

onMounted(fetchHomeData)
</script>

<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="hero-copy">
        <p class="hero-kicker">AI Music Home</p>
        <h1>今天想听什么？从这里快速开始。</h1>
        <p class="hero-desc">
          {{ welcomeText }}
          你可以在这里快速播放推荐内容，也可以进入曲库、歌单、曲风和社区继续探索。
        </p>

        <div class="hero-actions">
          <button class="primary-action" @click="router.push('/daily')">
            去看今日推荐
          </button>
          <button class="secondary-action" @click="router.push('/library')">
            打开完整曲库
          </button>
        </div>
      </div>

      <div class="hero-summary">
        <div
          v-for="item in summaryCards"
          :key="item.label"
          class="summary-card"
        >
          <span class="summary-label">{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <span class="summary-tip">{{ item.tip }}</span>
        </div>
      </div>

      <div class="hero-glow hero-glow-a"></div>
      <div class="hero-glow hero-glow-b"></div>
    </section>

    <section class="quick-grid">
      <button
        v-for="item in quickEntries"
        :key="item.route"
        class="quick-card"
        @click="router.push(item.route)"
      >
        <div class="quick-icon">
          <Icon :icon="item.icon" />
        </div>
        <div class="quick-main">
          <div class="quick-title">{{ item.title }}</div>
          <div class="quick-desc">{{ item.desc }}</div>
        </div>
        <icon-ri:arrow-right-up-line class="quick-arrow" />
      </button>
    </section>

    <section class="content-grid">
      <div class="panel songs-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">Quick Play</p>
            <h2>首页精选歌曲</h2>
          </div>
          <el-button text @click="router.push('/library')">查看全部</el-button>
        </div>

        <div v-if="loading" class="panel-state">
          <icon-ri:loader-4-line class="animate-spin text-xl" />
          <span>正在加载首页内容...</span>
        </div>

        <div v-else-if="highlightSongs.length === 0" class="panel-state">
          <icon-ri:music-2-line class="text-xl" />
          <span>暂时还没有可展示的歌曲</span>
        </div>

        <div v-else class="song-list">
          <div
            v-for="song in highlightSongs"
            :key="song.songId"
            class="song-card"
            @click="playSong(song)"
          >
            <el-image
              :src="song.coverUrl || defaultAlbum"
              :alt="song.songName"
              fit="cover"
              lazy
              class="song-cover"
            />
            <div class="song-main">
              <div class="song-name">{{ song.songName }}</div>
              <div class="song-meta">
                <span>{{ song.artistName }}</span>
                <span>·</span>
                <span>{{
                  formatMillisecondsToTime(Number(song.duration) * 1000)
                }}</span>
              </div>
            </div>
            <button class="song-play">
              <icon-tabler:player-play-filled />
            </button>
          </div>
        </div>
      </div>

      <div class="side-panels">
        <div class="panel">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">Playlists</p>
              <h2>推荐歌单</h2>
            </div>
            <el-button text @click="router.push('/playlist')"
              >查看更多</el-button
            >
          </div>

          <div v-if="playlists.length === 0" class="panel-state small">
            <span>暂无歌单推荐</span>
          </div>

          <div v-else class="playlist-list">
            <div
              v-for="playlist in playlists"
              :key="playlist.id"
              class="playlist-card"
              @click="router.push(`/playlist/${playlist.id}`)"
            >
              <el-image
                :src="playlist.coverUrl"
                :alt="playlist.title"
                fit="cover"
                lazy
                class="playlist-cover"
              />
              <div class="playlist-name">{{ playlist.title }}</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head">
            <div>
              <p class="panel-kicker">Genres</p>
              <h2>热门曲风</h2>
            </div>
            <el-button text @click="router.push('/genre')">去逛曲风</el-button>
          </div>

          <div class="genre-list">
            <button
              v-for="genre in genres"
              :key="genre.styleId"
              class="genre-chip"
              @click="
                router.push(
                  `/genre/${genre.styleId}?name=${encodeURIComponent(genre.name)}`
                )
              "
            >
              <span>{{ genre.name }}</span>
              <small>{{ genre.songCount }} 首</small>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.hero-section {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.9fr);
  gap: 20px;
  padding: 28px;
  border-radius: 30px;
  min-height: 280px;
}

html.light .hero-section {
  background: radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.85) 0%,
      rgba(255, 255, 255, 0) 34%
    ),
    linear-gradient(
      135deg,
      rgba(76, 110, 245, 0.96) 0%,
      rgba(124, 77, 255, 0.92) 52%,
      rgba(16, 185, 129, 0.9) 100%
    );
  box-shadow: 0 24px 60px rgba(69, 88, 170, 0.18);
}

html.dark .hero-section {
  background: radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 34%
    ),
    linear-gradient(
      135deg,
      rgba(58, 75, 170, 0.96) 0%,
      rgba(95, 62, 186, 0.94) 52%,
      rgba(6, 108, 97, 0.92) 100%
    );
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.hero-copy,
.hero-summary {
  position: relative;
  z-index: 1;
}

.hero-kicker {
  margin: 0 0 12px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.74);
  font-weight: 700;
}

.hero-copy h1 {
  margin: 0;
  max-width: 720px;
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.15;
  color: #fff;
}

.hero-desc {
  margin: 16px 0 0;
  max-width: 620px;
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.82);
}

.hero-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.primary-action,
.secondary-action {
  height: 44px;
  padding: 0 18px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;
}

.primary-action {
  border: none;
  color: #27324e;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 24px rgba(21, 32, 76, 0.18);
}

.secondary-action {
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.primary-action:hover,
.secondary-action:hover {
  transform: translateY(-2px);
}

.hero-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  align-self: stretch;
}

.summary-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 72px;
  padding: 18px 20px;
  border-radius: 22px;
  backdrop-filter: blur(16px);
}

html.light .summary-card {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

html.dark .summary-card {
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.summary-label,
.summary-tip {
  color: rgba(255, 255, 255, 0.74);
}

.summary-card strong {
  margin: 8px 0 6px;
  font-size: 28px;
  line-height: 1;
  color: #fff;
}

.summary-label {
  font-size: 12px;
}

.summary-tip {
  font-size: 12px;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.hero-glow-a {
  width: 220px;
  height: 220px;
  right: -40px;
  top: -60px;
  background: rgba(255, 255, 255, 0.12);
}

.hero-glow-b {
  width: 260px;
  height: 260px;
  right: 120px;
  bottom: -140px;
  background: rgba(255, 255, 255, 0.08);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid transparent;
  text-align: left;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

html.light .quick-card {
  background: rgba(255, 255, 255, 0.84);
  border-color: rgba(125, 140, 220, 0.12);
  box-shadow: 0 12px 28px rgba(88, 101, 168, 0.08);
}

html.dark .quick-card {
  background: rgba(28, 34, 54, 0.72);
  border-color: rgba(125, 140, 220, 0.1);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.2);
}

.quick-card:hover {
  transform: translateY(-3px);
}

.quick-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  flex-shrink: 0;
  font-size: 22px;
  color: #fff;
  background: linear-gradient(135deg, #4c6ef5 0%, #7c4dff 100%);
}

.quick-main {
  min-width: 0;
  flex: 1;
}

.quick-title {
  font-size: 16px;
  font-weight: 700;
}

.quick-desc {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: #7b88ab;
}

html.dark .quick-title {
  color: #eef2ff;
}

html.dark .quick-desc {
  color: #a8b5d8;
}

.quick-arrow {
  font-size: 18px;
  color: #90a0c6;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
  gap: 18px;
  margin-top: 18px;
  min-height: 0;
}

.side-panels {
  display: grid;
  gap: 18px;
}

.panel {
  border-radius: 28px;
  padding: 22px;
}

html.light .panel {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(125, 140, 220, 0.12);
  box-shadow: 0 16px 42px rgba(88, 101, 168, 0.08);
}

html.dark .panel {
  background: rgba(28, 34, 54, 0.72);
  border: 1px solid rgba(125, 140, 220, 0.1);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6b7adc;
  font-weight: 700;
}

.panel-head h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  color: #27324e;
}

html.dark .panel-head h2 {
  color: #eef2ff;
}

.panel-state {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 22px;
  color: #8190b3;
}

html.light .panel-state {
  background: rgba(245, 247, 255, 0.82);
}

html.dark .panel-state {
  background: rgba(34, 40, 63, 0.82);
  color: #a8b5d8;
}

.panel-state.small {
  min-height: 120px;
}

.song-list {
  display: grid;
  gap: 12px;
}

.song-card {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 12px;
  border-radius: 20px;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

html.light .song-card {
  background: rgba(247, 249, 255, 0.9);
  border: 1px solid rgba(125, 140, 220, 0.1);
}

html.dark .song-card {
  background: rgba(34, 40, 63, 0.82);
  border: 1px solid rgba(125, 140, 220, 0.1);
}

.song-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(88, 101, 168, 0.12);
}

.song-cover {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  overflow: hidden;
}

.song-main {
  min-width: 0;
}

.song-name {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  color: #27324e;
}

html.dark .song-name {
  color: #eef2ff;
}

.song-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 13px;
  color: #7b88ab;
}

html.dark .song-meta {
  color: #a8b5d8;
}

.song-play {
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 16px;
  background: linear-gradient(135deg, #4c6ef5 0%, #7c4dff 100%);
  box-shadow: 0 10px 20px rgba(76, 110, 245, 0.24);
}

.playlist-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.playlist-card {
  cursor: pointer;
}

.playlist-cover {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 20px;
  overflow: hidden;
}

.playlist-name {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: #27324e;
}

html.dark .playlist-name {
  color: #eef2ff;
}

.genre-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.genre-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(102, 126, 234, 0.14);
  color: #425276;
  background: rgba(102, 126, 234, 0.08);
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.genre-chip:hover {
  transform: translateY(-1px);
  background: rgba(102, 126, 234, 0.14);
}

html.dark .genre-chip {
  color: #d8e1ff;
  background: rgba(102, 126, 234, 0.14);
  border-color: rgba(140, 156, 255, 0.16);
}

.genre-chip small {
  opacity: 0.72;
}

@media (max-width: 1100px) {
  .hero-section,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 14px;
  }

  .hero-section {
    padding: 22px 18px;
  }

  .hero-actions {
    flex-direction: column;
  }

  .quick-grid,
  .playlist-list {
    grid-template-columns: 1fr;
  }

  .song-card {
    grid-template-columns: 56px minmax(0, 1fr) auto;
  }

  .song-cover {
    width: 56px;
    height: 56px;
  }
}
</style>
