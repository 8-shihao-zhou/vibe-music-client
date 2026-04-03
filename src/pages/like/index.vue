<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getFavoriteSongs } from '@/api/system'
import type { Song } from '@/api/interface'
import coverImg from '@/assets/cover.png'
import { AudioStore } from '@/stores/modules/audio'
import { useRoute } from 'vue-router'

const route = useRoute()
const audui = AudioStore()
const { loadTrack, play } = useAudioPlayer()

const songs = ref<Song[]>([])
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const playlist = ref({
  name: '我喜欢的音乐',
  coverImgUrl: coverImg,
  trackCount: 0,
  tags: ['私人收藏', '循环回放', '随时开听'],
})

interface PageResult {
  items: Song[]
  total: number
}

// 当前封面地址，兜底默认封面
const playlistCover = computed(() => {
  return playlist.value.coverImgUrl
    ? `${playlist.value.coverImgUrl}?param=500y500`
    : coverImg
})

// 获取我喜欢的歌曲列表
const getSongs = async () => {
  loading.value = true
  try {
    const res = await getFavoriteSongs({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      songName: searchKeyword.value,
      artistName: '',
      album: '',
    })

    if (res.code === 0 && res.data) {
      const pageData = res.data as PageResult
      songs.value = pageData.items
      playlist.value.trackCount = pageData.total

      // 使用第一首歌封面作为页面主封面，没有则使用默认图
      if (pageData.items.length > 0) {
        playlist.value.coverImgUrl = pageData.items[0].coverUrl || coverImg
      } else {
        playlist.value.coverImgUrl = coverImg
      }
    }
  } finally {
    loading.value = false
  }
}

// 搜索喜欢的歌曲
const handleSearch = () => {
  currentPage.value = 1
  getSongs()
}

// 一键播放当前页全部歌曲
const handlePlayAll = async () => {
  audui.setAudioStore('trackList', [])

  if (!songs.value.length) return

  const result = songs.value.map(song => ({
    id: song.songId.toString(),
    title: song.songName,
    artist: song.artistName,
    album: song.album,
    cover: song.coverUrl || coverImg,
    url: song.audioUrl,
    duration: parseFloat(song.duration) * 1000,
    likeStatus: song.likeStatus,
  }))

  audui.setAudioStore('trackList', result)
  audui.setAudioStore('currentSongIndex', 0)
  await loadTrack()
  play()
}

// 统计当前页歌曲总时长，仅做展示
const totalDurationText = computed(() => {
  const totalSeconds = songs.value.reduce((sum, song) => {
    return sum + Number.parseFloat(song.duration || '0')
  }, 0)

  if (!totalSeconds) return '0 分钟'

  const minutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60

  if (hours > 0) {
    return `${hours} 小时 ${remainMinutes} 分钟`
  }

  return `${minutes} 分钟`
})

// 监听播放器中的歌曲状态，若取消喜欢则自动刷新列表
watch(
  () => audui.currentPageSongs,
  newSongs => {
    if (newSongs && newSongs.length > 0) {
      const hasUnlikedSong = newSongs.some(song => song.likeStatus === 0)
      if (hasUnlikedSong) {
        getSongs()
      }
    }
  },
  { deep: true },
)

// 重新进入当前页面时刷新数据
watch(
  () => route.path,
  newPath => {
    if (newPath === '/like') {
      getSongs()
    }
  },
)

onMounted(() => {
  getSongs()
})
</script>

<template>
  <div class="like-page">
    <section class="like-hero">
      <div class="hero-cover-wrap">
        <div class="hero-cover-shadow" />
        <img
          :alt="playlist.name"
          class="hero-cover"
          :src="playlistCover"
        />
      </div>

      <div class="hero-main">
        <p class="hero-kicker">My Favorites</p>
        <h1 class="hero-title">{{ playlist.name }}</h1>
        <p class="hero-subtitle">
          把你反复点开的歌集中放在这里，想听的时候一键继续，不用重新翻找。
        </p>

        <div class="hero-meta">
          <div class="meta-card">
            <span class="meta-label">收藏歌曲</span>
            <strong>{{ playlist.trackCount }}</strong>
          </div>
          <div class="meta-card">
            <span class="meta-label">本页时长</span>
            <strong>{{ totalDurationText }}</strong>
          </div>
        </div>

        <div v-if="playlist.tags?.length" class="hero-tags">
          <el-tag
            v-for="tag in playlist.tags"
            :key="tag"
            class="hero-tag"
            effect="plain"
          >
            {{ tag }}
          </el-tag>
        </div>

        <div class="hero-actions">
          <button
            class="play-all-btn"
            :disabled="!songs.length"
            @click="handlePlayAll"
          >
            <icon-solar:play-line-duotone />
            播放全部
          </button>

          <div class="search-box">
            <icon-akar-icons:search class="search-icon" />
            <input
              v-model="searchKeyword"
              class="search-input"
              placeholder="搜索喜欢的歌曲"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>
      </div>

      <div class="hero-glow hero-glow-a" />
      <div class="hero-glow hero-glow-b" />
    </section>

    <section class="like-table-card">
      <div class="section-header">
        <div>
          <p class="section-kicker">Library</p>
          <h2 class="section-title">喜欢列表</h2>
        </div>
        <span class="section-count">当前共 {{ playlist.trackCount }} 首</span>
      </div>

      <div class="table-shell" v-loading="loading">
        <Table :data="songs" class="music-table" />
      </div>

      <nav class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="playlist.trackCount"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getSongs"
          @current-change="getSongs"
        />
      </nav>
    </section>
  </div>
</template>

<style scoped lang="scss">
.like-page {
  min-height: 100%;
  padding: 20px;
  background:
    radial-gradient(circle at top left, rgba(118, 141, 255, 0.12), transparent 30%),
    radial-gradient(circle at top right, rgba(255, 179, 199, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(247, 249, 255, 0.95), rgba(252, 252, 255, 0.98));
}

.like-hero {
  position: relative;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 28px;
  padding: 28px;
  border: 1px solid rgba(133, 165, 235, 0.16);
  border-radius: 30px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(249, 244, 255, 0.92)),
    #fff;
  box-shadow: 0 22px 54px rgba(92, 118, 180, 0.14);
}

.hero-cover-wrap {
  position: relative;
  width: 260px;
  height: 260px;
}

.hero-cover-shadow {
  position: absolute;
  inset: 16px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(103, 126, 234, 0.42), rgba(243, 135, 173, 0.28));
  filter: blur(26px);
}

.hero-cover {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 28px;
  box-shadow: 0 22px 42px rgba(86, 112, 172, 0.24);
}

.hero-main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  color: #677790;
}

.hero-meta {
  display: flex;
  gap: 14px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.meta-card {
  min-width: 140px;
  padding: 14px 16px;
  border: 1px solid rgba(146, 173, 226, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 10px 24px rgba(95, 119, 173, 0.1);
}

.meta-label {
  display: block;
  font-size: 12px;
  color: #7c89a4;
}

.meta-card strong {
  display: block;
  margin-top: 8px;
  font-size: 22px;
  color: #253754;
}

.hero-tags {
  display: flex;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}

.hero-tag {
  border-radius: 999px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.play-all-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 136px;
  height: 46px;
  padding: 0 22px;
  border: none;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #5e84e7 0%, #7b7be8 55%, #ee90a6 100%);
  box-shadow: 0 16px 28px rgba(103, 126, 214, 0.24);
  transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 32px rgba(103, 126, 214, 0.32);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    box-shadow: none;
  }
}

.search-box {
  position: relative;
  width: min(320px, 100%);
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  font-size: 16px;
  color: #8390ab;
  transform: translateY(-50%);
}

.search-input {
  width: 100%;
  height: 46px;
  padding: 0 16px 0 42px;
  border: 1px solid rgba(144, 171, 222, 0.18);
  border-radius: 16px;
  outline: none;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 10px 20px rgba(103, 125, 173, 0.08);
  transition: border-color 0.25s ease, box-shadow 0.25s ease;

  &:focus {
    border-color: rgba(101, 135, 219, 0.42);
    box-shadow: 0 12px 24px rgba(103, 125, 173, 0.14);
  }
}

.hero-glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.hero-glow-a {
  top: -60px;
  right: 140px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(137, 173, 255, 0.26), transparent 70%);
}

.hero-glow-b {
  right: -26px;
  bottom: -44px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(255, 188, 204, 0.24), transparent 70%);
}

.like-table-card {
  margin-top: 24px;
  padding: 22px 22px 18px;
  border: 1px solid rgba(138, 167, 228, 0.14);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 255, 0.94)),
    #fff;
  box-shadow: 0 18px 38px rgba(87, 111, 167, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6f7ee2;
}

.section-title {
  margin: 0;
  font-size: 24px;
  color: #233451;
}

.section-count {
  font-size: 13px;
  color: #7b89a4;
}

.table-shell {
  min-height: 320px;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
}

.music-table {
  min-height: 320px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}

@media (max-width: 1024px) {
  .like-hero {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .hero-cover-wrap {
    width: 220px;
    height: 220px;
  }

  .hero-title {
    font-size: 34px;
  }
}

@media (max-width: 768px) {
  .like-page {
    padding: 14px;
  }

  .like-hero {
    grid-template-columns: 1fr;
    padding: 22px 18px;
    border-radius: 24px;
  }

  .hero-cover-wrap {
    width: 180px;
    height: 180px;
  }

  .hero-title {
    font-size: 30px;
  }

  .hero-actions,
  .section-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .like-table-card {
    padding: 18px 16px 16px;
    border-radius: 22px;
  }
}
</style>
