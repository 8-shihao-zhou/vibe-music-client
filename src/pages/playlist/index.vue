<script setup lang="ts">
import { getAllPlaylists, getFavoritePlaylists } from '@/api/system'
import coverImg from '@/assets/cover.png'
import { ElNotification } from 'element-plus'

const router = useRouter()
const playlists = ref([])
const selected = ref('all')
const searchKeyword = ref('')

const route = useRoute()
const isPlaylistPage = computed(() => route.path === '/playlist')

const playlistsList = [
  { name: '精选歌单', value: 'all' },
  { name: '我的收藏', value: 'favorite' },
]
const playTags = ref<{ name: string }[]>([])
const selectedTag = ref('全部')

const currentPage = ref(1)
const pageSize = ref(12)
const state = reactive({
  size: 'default',
  disabled: false,
  background: false,
  layout: 'total, sizes, prev, pager, next, jumper',
  total: 0,
  pageSizes: [12, 24, 36, 48],
})

const handleSizeChange = () => {
  getPlaylists()
}

const handleCurrentChange = () => {
  getPlaylists()
}

const getPlaylists = async () => {
  if (!isPlaylistPage.value) return

  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      title: searchKeyword.value || null,
      style: selectedTag.value === '全部' ? null : selectedTag.value,
    }

    let res
    if (selected.value === 'favorite') {
      res = await getFavoritePlaylists(params)
    } else {
      res = await getAllPlaylists(params)
    }

    if (res.code === 0 && res.data && Array.isArray(res.data.items)) {
      playlists.value = res.data.items.map((item) => ({
        id: item.playlistId,
        name: item.title,
        coverImgUrl: item.coverUrl ?? coverImg,
        creator: {
          nickname: selected.value === 'favorite' ? 'AI Music' : 'AI Music',
          avatarUrl: coverImg,
        },
        playCount: 0,
        subscribedCount: 0,
      }))
      state.total = res.data.total
    } else if (res.code === 0 && res.data) {
      // 无结果时后端也会返回成功，这里按空列表处理
      playlists.value = []
      state.total = res.data.total || 0
    } else {
      ElNotification({
        type: 'error',
        message: '获取歌单列表失败',
        duration: 2000,
      })
    }
  } catch (error) {
    ElNotification({
      type: 'error',
      message: '获取歌单列表失败',
      duration: 2000,
    })
  }
}

const selectPlaylist = (playlist: string) => {
  selected.value = playlist
  currentPage.value = 1
  getPlaylists()
}

const selectTag = (tagName: string) => {
  selectedTag.value = tagName
  currentPage.value = 1
  getPlaylists()
}

const handleSearch = () => {
  currentPage.value = 1
  router.push({
    path: '/playlist',
    query: searchKeyword.value ? { query: searchKeyword.value } : {},
  })
}

watch(
  () => route.query.query,
  (newQuery) => {
    if (!isPlaylistPage.value) return
    searchKeyword.value = typeof newQuery === 'string' ? newQuery : ''
    currentPage.value = 1
    getPlaylists()
  },
  { immediate: true }
)

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleSearch()
  }
}

onMounted(() => {
  if (!isPlaylistPage.value) return
  playTags.value = [
    { name: '全部' },
    { name: '节奏布鲁斯' },
    { name: '欧美流行' },
    { name: '华语流行' },
    { name: '粤语流行' },
    { name: '国风流行' },
    { name: '韩语流行' },
    { name: '日本流行' },
    { name: '嘻哈说唱' },
    { name: '非洲节拍' },
    { name: '原声带' },
    { name: '轻音乐' },
    { name: '摇滚' },
    { name: '朋克' },
    { name: '电子' },
    { name: '国风' },
    { name: '乡村' },
    { name: '古典' },
  ]
})

onActivated(() => {
  if (!isPlaylistPage.value) return
  searchKeyword.value =
    typeof route.query.query === 'string' ? route.query.query : ''
  getPlaylists()
})
</script>

<template>
  <div class="playlist-page">
    <section class="playlist-hero">
      <div class="hero-copy">
        <div class="hero-badge">
          <div class="hero-icon">
            <icon-ri:album-line class="hero-icon-inner" />
          </div>
          <span>Playlist Library</span>
        </div>
        <h1 class="hero-title">歌单</h1>
        <p class="hero-subtitle">
          用关键词、风格与收藏视角快速筛选歌单，找到适合当前心情的播放集合。
        </p>
        <div class="hero-stats">
          <div class="stat-card">
            <span class="stat-label">展示页码</span>
            <strong>{{ currentPage }}</strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">每页数量</span>
            <strong>{{ pageSize }}</strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">总歌单数</span>
            <strong>{{ state.total }}</strong>
          </div>
        </div>
      </div>

      <div class="hero-note">
        <div class="note-chip">Curated</div>
        <div class="note-title">更清楚地区分精选与收藏</div>
        <p class="note-text">
          保留原有筛选和分页逻辑，只把搜索、标签和卡片展示做得更完整。
        </p>
      </div>
    </section>

    <section class="playlist-panel">
      <div class="control-bar">
        <div class="search-box">
          <icon-mdi:magnify class="search-icon" />
          <input
            v-model="searchKeyword"
            @keydown="handleKeyPress"
            class="search-input"
            placeholder="搜索歌单..."
            type="search"
          />
        </div>

        <el-select
          v-model="selectedTag"
          class="tag-select"
          @change="getPlaylists"
        >
          <el-option
            v-for="item in playTags"
            :key="item.name"
            :label="item.name"
            :value="item.name"
          />
        </el-select>
      </div>

      <div class="tabs-shell">
        <button
          v-for="playlist in playlistsList"
          :key="playlist.value"
          class="tab-button"
          :class="{ active: selected === playlist.value }"
          @click="selectPlaylist(playlist.value)"
        >
          {{ playlist.name }}
        </button>
      </div>

      <div class="tag-strip">
        <button
          v-for="item in playTags"
          :key="item.name"
          class="tag-chip"
          :class="{ active: selectedTag === item.name }"
          @click="selectTag(item.name)"
        >
          {{ item.name }}
        </button>
      </div>

      <div v-if="playlists.length > 0" class="playlist-grid">
        <div
          v-for="playlist in playlists"
          :key="playlist.id"
          class="playlist-card"
          @click="router.push('/playlist/' + playlist.id)"
        >
          <div class="playlist-cover-wrap">
            <el-image
              lazy
              :alt="playlist.name"
              class="playlist-cover"
              :src="playlist.coverImgUrl + '?param=330y330'"
            />
            <button class="play-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="6 3 20 12 6 21 6 3"></polygon>
              </svg>
            </button>
          </div>
          <div class="playlist-body">
            <h3 class="playlist-title">{{ playlist.name }}</h3>
            <div class="playlist-meta">
              <span class="creator-avatar">
                <el-avatar
                  :alt="playlist.creator.nickname"
                  :src="playlist.creator.avatarUrl"
                />
              </span>
              <span class="creator-name">{{ playlist.creator.nickname }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-state-icon">
          <icon-solar:music-library-2-outline />
        </div>
        <h3 class="empty-state-title">当前条件下还没有找到歌单</h3>
        <p class="empty-state-text">
          可以试试切换风格标签、清空搜索词，或者回到“精选歌单”看看其它内容。
        </p>
      </div>

      <nav class="pagination-wrap">
        <el-pagination
          v-model:page-size="pageSize"
          v-model:currentPage="currentPage"
          v-bind="state"
          class="custom-pagination"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </nav>
    </section>
  </div>
</template>

<style scoped>
.playlist-page{min-height:100%;padding:20px;background:radial-gradient(circle at top left, rgba(118,163,255,.12), transparent 26%),radial-gradient(circle at top right, rgba(255,194,210,.12), transparent 22%),linear-gradient(180deg, rgba(246,249,255,.96), rgba(252,252,255,.98))}
.playlist-hero,.playlist-panel{border:1px solid rgba(140,168,230,.16);background:linear-gradient(180deg, rgba(255,255,255,.96), rgba(247,250,255,.94)),#fff;box-shadow:0 18px 38px rgba(87,111,167,.1)}
.playlist-hero{display:grid;grid-template-columns:minmax(0,1.5fr) 320px;gap:24px;padding:28px;border-radius:30px}
.hero-badge{display:inline-flex;align-items:center;gap:12px;padding:10px 14px 10px 10px;border-radius:999px;background:rgba(255,255,255,.8);border:1px solid rgba(138,166,227,.16);color:#687892;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.hero-icon{display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,#4f84e7 0%,#757fe8 58%,#ee91a8 100%);box-shadow:0 10px 22px rgba(103,126,214,.25)}
.hero-icon-inner{font-size:24px;color:#fff}
.hero-title{margin:18px 0 0;font-size:40px;line-height:1.12;color:#223350}
.hero-subtitle{max-width:720px;margin:14px 0 0;font-size:15px;line-height:1.85;color:#687891}
.hero-stats{display:flex;gap:14px;margin-top:22px;flex-wrap:wrap}
.stat-card{min-width:150px;padding:14px 16px;border:1px solid rgba(143,171,228,.16);border-radius:18px;background:rgba(255,255,255,.76);box-shadow:0 10px 22px rgba(95,121,178,.09)}
.stat-label{display:block;font-size:12px;color:#7c89a3}
.stat-card strong{display:block;margin-top:8px;font-size:22px;color:#243653}
.hero-note{padding:22px;border:1px solid rgba(142,170,228,.15);border-radius:24px;background:linear-gradient(180deg, rgba(255,255,255,.92), rgba(246,250,255,.9)),#fff;box-shadow:0 16px 32px rgba(89,116,172,.1)}
.note-chip{display:inline-flex;align-items:center;height:28px;padding:0 10px;border-radius:999px;background:rgba(99,125,214,.12);color:#5671cf;font-size:12px;font-weight:700}
.note-title{margin-top:16px;font-size:20px;font-weight:700;line-height:1.4;color:#233451}
.note-text{margin:10px 0 0;font-size:14px;line-height:1.8;color:#6f809a}
.playlist-panel{margin-top:22px;padding:22px;border-radius:28px}
.control-bar{display:flex;gap:14px;align-items:center}
.search-box{position:relative;flex:1}
.search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#8793aa;font-size:16px;z-index:1}
.search-input{width:100%;min-height:46px;padding:0 14px 0 42px;border:1px solid rgba(143,168,215,.2);border-radius:16px;background:rgba(255,255,255,.92);color:#2a3a56;font-size:14px;transition:all .25s ease;box-shadow:0 10px 20px rgba(108,131,177,.08)}
.search-input:focus{outline:none;border-color:rgba(93,119,215,.36);box-shadow:0 12px 22px rgba(97,123,182,.14)}
:deep(.tag-select .el-input__wrapper){min-height:46px;border-radius:16px;background:rgba(255,255,255,.92);box-shadow:0 0 0 1px rgba(143,167,213,.18),0 10px 20px rgba(108,131,177,.08)}
.tabs-shell{display:inline-flex;gap:10px;margin-top:18px;padding:8px;border:1px solid rgba(145,172,228,.12);border-radius:18px;background:rgba(243,247,255,.82)}
.tab-button{min-height:40px;padding:0 16px;border-radius:12px;color:#5c6d88;font-size:14px;font-weight:700;transition:all .25s ease}
.tab-button:hover{background:rgba(102,126,234,.1)}
.tab-button.active{background:linear-gradient(135deg,#5f87e6 0%,#7d7fe8 58%,#eb8fa8 100%);color:#fff;box-shadow:0 10px 20px rgba(103,126,214,.2)}
.tag-strip{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.tag-chip{min-height:34px;padding:0 12px;border:1px solid rgba(143,168,215,.18);border-radius:999px;background:rgba(255,255,255,.94);color:#5a6b87;font-size:13px;transition:all .25s ease}
.tag-chip:hover{border-color:rgba(102,126,234,.28);color:#5974d5}
.tag-chip.active{border-color:transparent;background:linear-gradient(135deg,#5f87e6 0%,#7d7fe8 58%,#eb8fa8 100%);color:#fff;box-shadow:0 10px 20px rgba(103,126,214,.2)}
.playlist-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;margin-top:22px}
.playlist-card{overflow:hidden;border:1px solid rgba(144,170,223,.14);border-radius:24px;background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,251,255,.95)),#fff;box-shadow:0 14px 28px rgba(91,116,172,.1);cursor:pointer;transition:transform .28s ease, box-shadow .28s ease, border-color .28s ease}
.playlist-card:hover{transform:translateY(-6px);border-color:rgba(109,142,218,.24);box-shadow:0 18px 34px rgba(91,116,172,.15)}
.playlist-cover-wrap{position:relative;aspect-ratio:1/1;overflow:hidden}
.playlist-cover{width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
.playlist-card:hover .playlist-cover{transform:scale(1.06)}
.play-button{position:absolute;right:14px;bottom:14px;display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:999px;background:linear-gradient(135deg,#5f87e6 0%,#7d7fe8 58%,#eb8fa8 100%);color:#fff;box-shadow:0 12px 24px rgba(102,126,234,.28);opacity:0;transform:translateY(10px);transition:all .25s ease}
.playlist-card:hover .play-button{opacity:1;transform:translateY(0)}
.playlist-body{padding:16px}
.playlist-title{margin:0;font-size:16px;font-weight:700;line-height:1.5;color:#243653}
.playlist-meta{display:flex;align-items:center;gap:10px;margin-top:12px;color:#73829d;font-size:13px}
.creator-avatar :deep(.el-avatar){width:28px;height:28px}
.creator-name{transition:color .25s ease}
.playlist-card:hover .creator-name{color:#5974d5}
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;margin-top:22px;padding:48px 24px;border:1px dashed rgba(143,168,215,.32);border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(246,249,255,.94));text-align:center;box-shadow:0 14px 28px rgba(91,116,172,.08)}
.empty-state-icon{display:flex;align-items:center;justify-content:center;width:74px;height:74px;border-radius:24px;background:linear-gradient(135deg,rgba(95,135,230,.14),rgba(235,143,168,.16));color:#5f79d8;font-size:34px;box-shadow:inset 0 1px 0 rgba(255,255,255,.7)}
.empty-state-title{margin:0;font-size:22px;font-weight:700;color:#263755}
.empty-state-text{max-width:460px;margin:0;font-size:14px;line-height:1.85;color:#71819d}
.pagination-wrap{display:flex;justify-content:center;margin-top:24px}
:deep(.custom-pagination .el-pagination__total),:deep(.custom-pagination .el-pagination__jump){color:#687892;font-weight:500}
:deep(.custom-pagination .el-pager li){border-radius:10px;margin:0 4px;transition:all .25s ease}
:deep(.custom-pagination .el-pager li:hover){background:rgba(102,126,234,.12);color:#5d76d7}
:deep(.custom-pagination .el-pager li.is-active){background:linear-gradient(135deg,#5f87e6 0%,#7d7fe8 58%,#eb8fa8 100%);color:#fff;box-shadow:0 10px 20px rgba(103,126,214,.22)}
@media (max-width:980px){.playlist-hero{grid-template-columns:1fr}}
@media (max-width:768px){.playlist-page{padding:14px}.playlist-hero,.playlist-panel{padding:18px 16px;border-radius:22px}.hero-title{font-size:30px}.control-bar{flex-direction:column;align-items:stretch}.tabs-shell{width:100%;overflow-x:auto}.playlist-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}}

html.dark .playlist-page{background:radial-gradient(circle at top left, rgba(79,112,196,.22), transparent 28%),radial-gradient(circle at top right, rgba(171,92,144,.18), transparent 24%),linear-gradient(180deg, rgba(17,23,38,.98), rgba(10,15,28,1))}
html.dark .playlist-hero,html.dark .playlist-panel,html.dark .hero-note,html.dark .playlist-card,html.dark .empty-state{border-color:rgba(117,138,196,.18);background:linear-gradient(180deg, rgba(26,34,54,.94), rgba(20,27,44,.96)),#182133;box-shadow:0 18px 40px rgba(0,0,0,.26)}
html.dark .hero-badge,html.dark .stat-card,html.dark .tabs-shell,html.dark .tag-chip{border-color:rgba(142,163,224,.16);background:rgba(255,255,255,.06);color:#c6d2ee}
html.dark .search-input,html.dark :deep(.tag-select .el-input__wrapper){border-color:rgba(142,163,224,.16)!important;background:rgba(255,255,255,.06)!important;box-shadow:none!important;color:#e9efff}
html.dark .hero-title,html.dark .panel-title,html.dark .note-title,html.dark .playlist-title,html.dark .empty-state-title,html.dark .stat-card strong{color:#eef3ff}
html.dark .hero-subtitle,html.dark .note-text,html.dark .panel-tip,html.dark .playlist-meta,html.dark .empty-state-text,html.dark .stat-label,html.dark :deep(.custom-pagination .el-pagination__total),html.dark :deep(.custom-pagination .el-pagination__jump){color:#aab7d6}
html.dark .empty-state-icon{background:linear-gradient(135deg, rgba(95,135,230,.22), rgba(235,143,168,.18));color:#9db4ff;box-shadow:none}
html.dark :deep(.custom-pagination .btn-prev),html.dark :deep(.custom-pagination .btn-next),html.dark :deep(.custom-pagination .el-pager li){background:rgba(255,255,255,.04);color:#c8d3ef}
html.dark :deep(.custom-pagination .btn-prev:hover),html.dark :deep(.custom-pagination .btn-next:hover),html.dark :deep(.custom-pagination .el-pager li:hover){background:rgba(103,126,214,.18);color:#dfe7ff}
</style>
