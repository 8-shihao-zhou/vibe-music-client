<script setup lang="ts">
import { getAllArtists, getAllPlaylists, getAllSongs } from '@/api/system'
import coverImg from '@/assets/cover.png'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const activeTab = ref('songs')
const keyword = ref('')

const songResult = reactive({
  total: 0,
  items: [] as any[],
})

const artistResult = reactive({
  total: 0,
  items: [] as any[],
})

const playlistResult = reactive({
  total: 0,
  items: [] as any[],
})

const tabOptions = computed(() => [
  { label: '歌曲', value: 'songs', count: songResult.total },
  { label: '歌手', value: 'artists', count: artistResult.total },
  { label: '歌单', value: 'playlists', count: playlistResult.total },
])

const hasAnyResult = computed(() => {
  return (
    songResult.total > 0 ||
    artistResult.total > 0 ||
    playlistResult.total > 0
  )
})

// 统一加载综合搜索结果，这里只保留歌曲、歌手、歌单三类
const loadSearchResults = async () => {
  const q = keyword.value.trim()

  songResult.total = 0
  songResult.items = []
  artistResult.total = 0
  artistResult.items = []
  playlistResult.total = 0
  playlistResult.items = []

  if (!q) return

  loading.value = true
  try {
    const [songRes, artistRes, playlistRes] = await Promise.all([
      getAllSongs({
        pageNum: 1,
        pageSize: 8,
        songName: q,
        artistName: '',
        album: '',
      }),
      getAllArtists({
        pageNum: 1,
        pageSize: 8,
        artistName: q,
        gender: null,
        area: null,
      }),
      getAllPlaylists({
        pageNum: 1,
        pageSize: 8,
        title: q,
        style: null,
      }),
    ])

    if (songRes.code === 0 && songRes.data) {
      songResult.total = songRes.data.total || 0
      songResult.items = songRes.data.items || []
    }

    if (artistRes.code === 0 && artistRes.data) {
      artistResult.total = artistRes.data.total || 0
      artistResult.items = artistRes.data.items || []
    }

    if (playlistRes.code === 0 && playlistRes.data) {
      playlistResult.total = playlistRes.data.total || 0
      playlistResult.items = playlistRes.data.items || []
    }

    const firstAvailableTab = tabOptions.value.find(item => item.count > 0)
    activeTab.value = firstAvailableTab?.value || 'songs'
  } catch (error) {
    ElMessage.error('综合搜索失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  router.push({
    path: '/search',
    query: keyword.value.trim() ? { query: keyword.value.trim() } : {},
  })
}

const goSongLibrary = () => {
  router.push({
    path: '/library',
    query: keyword.value.trim() ? { query: keyword.value.trim() } : {},
  })
}

const goArtistPage = () => {
  router.push({
    path: '/artist',
    query: keyword.value.trim() ? { query: keyword.value.trim() } : {},
  })
}

const goPlaylistPage = () => {
  router.push({
    path: '/playlist',
    query: keyword.value.trim() ? { query: keyword.value.trim() } : {},
  })
}

watch(
  () => route.query.query,
  newQuery => {
    keyword.value = typeof newQuery === 'string' ? newQuery : ''
    loadSearchResults()
  },
  { immediate: true },
)
</script>

<template>
  <div class="search-page">
    <section class="search-hero">
      <div class="hero-copy">
        <p class="hero-kicker">Global Search</p>
        <h1>全站综合搜索</h1>
        <p class="hero-desc">
          一次输入，同时查看歌曲、歌手和歌单结果，让搜索入口更集中、更清晰。
        </p>
      </div>

      <div class="hero-search">
        <div class="search-box">
          <i class="i-carbon-search search-box-icon" />
          <input
            v-model="keyword"
            class="search-box-input"
            placeholder="搜索歌曲、歌手或歌单"
            @keyup.enter="handleSearch"
          />
        </div>
      </div>

      <div class="hero-glow hero-glow-a" />
      <div class="hero-glow hero-glow-b" />
    </section>

    <section class="search-panel" v-loading="loading">
      <div class="search-tabs">
        <button
          v-for="item in tabOptions"
          :key="item.value"
          class="search-tab"
          :class="{ active: activeTab === item.value }"
          @click="activeTab = item.value"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.count }}</strong>
        </button>
      </div>

      <div v-if="!keyword.trim()" class="search-empty">
        <i class="i-carbon-search search-empty-icon" />
        <h3>输入关键词开始搜索</h3>
        <p>比如搜索歌手名、歌曲名或歌单主题。</p>
      </div>

      <div v-else-if="!hasAnyResult" class="search-empty">
        <i class="i-carbon-face-dissatisfied search-empty-icon" />
        <h3>没有找到相关结果</h3>
        <p>可以换一个更短的关键词，或尝试使用歌手名、歌曲名重新搜索。</p>
      </div>

      <template v-else>
        <div v-show="activeTab === 'songs'" class="result-section">
          <div class="section-header">
            <div>
              <p class="section-kicker">Songs</p>
              <h2>歌曲结果</h2>
            </div>
            <el-button text @click="goSongLibrary">查看完整歌曲结果</el-button>
          </div>

          <div class="song-list">
            <div
              v-for="item in songResult.items"
              :key="item.songId"
              class="song-item"
              @click="router.push('/library?query=' + keyword)"
            >
              <img
                :src="item.coverUrl || coverImg"
                :alt="item.songName"
                class="song-cover"
              />
              <div class="song-info">
                <p class="song-title">{{ item.songName }}</p>
                <p class="song-meta">{{ item.artistName || '未知歌手' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'artists'" class="result-section">
          <div class="section-header">
            <div>
              <p class="section-kicker">Artists</p>
              <h2>歌手结果</h2>
            </div>
            <el-button text @click="goArtistPage">查看完整歌手结果</el-button>
          </div>

          <div class="card-grid artist-grid">
            <div
              v-for="item in artistResult.items"
              :key="item.artistId"
              class="result-card artist-card"
              @click="router.push('/artist/' + item.artistId)"
            >
              <img
                :src="item.avatar || coverImg"
                :alt="item.artistName"
                class="artist-avatar"
              />
              <p class="card-title">{{ item.artistName }}</p>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'playlists'" class="result-section">
          <div class="section-header">
            <div>
              <p class="section-kicker">Playlists</p>
              <h2>歌单结果</h2>
            </div>
            <el-button text @click="goPlaylistPage">查看完整歌单结果</el-button>
          </div>

          <div class="card-grid">
            <div
              v-for="item in playlistResult.items"
              :key="item.playlistId"
              class="result-card"
              @click="router.push('/playlist/' + item.playlistId)"
            >
              <img
                :src="item.coverUrl || coverImg"
                :alt="item.title"
                class="card-cover"
              />
              <p class="card-title">{{ item.title }}</p>
            </div>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped lang="scss">
.search-page {
  min-height: 100%;
  padding: 20px;
  background:
    radial-gradient(circle at top left, rgba(117, 141, 255, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(255, 188, 209, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(247, 249, 255, 0.96), rgba(252, 252, 255, 0.98));
}

.search-hero,
.search-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(136, 168, 231, 0.16);
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(249, 244, 255, 0.92)),
    #fff;
  box-shadow: 0 22px 52px rgba(90, 118, 179, 0.12);
}

.search-hero {
  padding: 28px;
}

.hero-copy h1 {
  margin: 0;
  font-size: 38px;
  color: #223350;
}

.hero-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6e7ee0;
}

.hero-desc {
  max-width: 720px;
  margin: 14px 0 0;
  line-height: 1.8;
  color: #6b7a94;
}

.hero-search {
  margin-top: 22px;
}

.search-box {
  position: relative;
  width: min(760px, 100%);
}

.search-box-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #7f8db0;
}

.search-box-input {
  width: 100%;
  height: 50px;
  padding: 0 16px 0 46px;
  border: 1px solid rgba(120, 139, 255, 0.16);
  border-radius: 18px;
  outline: none;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 24px rgba(94, 111, 180, 0.08);
}

.search-panel {
  margin-top: 24px;
  padding: 22px;
}

.search-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.search-tab {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 16px;
  border: 1px solid rgba(136, 168, 231, 0.16);
  border-radius: 999px;
  background: rgba(244, 247, 255, 0.9);
  color: #556884;
  transition: all 0.25s ease;

  strong {
    color: #7a88a3;
  }

  &.active {
    color: #fff;
    background: linear-gradient(135deg, #5e84e7 0%, #7b7be8 55%, #ee90a6 100%);
    box-shadow: 0 14px 26px rgba(103, 126, 214, 0.24);

    strong {
      color: #fff;
    }
  }
}

.search-empty {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;

  h3 {
    margin: 14px 0 8px;
    font-size: 24px;
    color: #243654;
  }

  p {
    margin: 0;
    max-width: 520px;
    line-height: 1.8;
    color: #6d7b95;
  }
}

.search-empty-icon {
  font-size: 42px;
  color: #7180e4;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;

  h2 {
    margin: 0;
    font-size: 24px;
    color: #223451;
  }
}

.section-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6f7ee2;
}

.song-list {
  display: grid;
  gap: 14px;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(138, 167, 228, 0.14);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 20px rgba(87, 111, 167, 0.08);
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 26px rgba(87, 111, 167, 0.12);
  }
}

.song-cover {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  object-fit: cover;
}

.song-info {
  min-width: 0;
}

.song-title,
.card-title {
  margin: 0;
  color: #243654;
  font-weight: 600;
}

.song-meta {
  margin: 6px 0 0;
  color: #6d7b95;
  line-height: 1.6;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.result-card {
  padding: 12px;
  border: 1px solid rgba(138, 167, 228, 0.14);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 20px rgba(87, 111, 167, 0.08);
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 26px rgba(87, 111, 167, 0.12);
  }
}

.card-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 16px;
  margin-bottom: 12px;
}

.artist-card {
  text-align: center;
}

.artist-avatar {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
}

.hero-glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.hero-glow-a {
  top: -80px;
  right: 120px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(134, 172, 255, 0.24), transparent 70%);
}

.hero-glow-b {
  right: -40px;
  bottom: -40px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(255, 191, 208, 0.24), transparent 70%);
}

@media (max-width: 768px) {
  .search-page {
    padding: 14px;
  }

  .search-hero,
  .search-panel {
    padding: 18px 16px;
    border-radius: 22px;
  }

  .hero-copy h1 {
    font-size: 30px;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
