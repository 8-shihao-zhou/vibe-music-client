<script setup lang="ts">
import { categories } from '@/utils/enum'
import { getAllArtists } from '@/api/system'
import { ElNotification } from 'element-plus'

const router = useRouter()
const artistList = ref([])

const selectedGender = ref('-1')
const selectedArea = ref('-1')

const route = useRoute()
const isArtistPage = computed(() => route.path === '/artist')

const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

const gridCols = computed(() => 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4')
const gridGap = computed(() =>
  pageSize.value === 24 ? 'gap-5 lg:gap-6' : 'gap-6 lg:gap-7'
)

const state = reactive({
  size: 'default',
  disabled: false,
  background: false,
  layout: 'total, sizes, prev, pager, next, jumper',
  total: 0,
  pageSizes: [12, 24],
})

const searchKeyword = ref('')

const fetchArtistList = () => {
  if (!isArtistPage.value) return

  const params = {
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    artistName: searchKeyword.value || null,
    gender:
      selectedGender.value === '-1'
        ? null
        : categories.value[0].subCategories.find(
            (item) => item.id === selectedGender.value
          )?.value,
    area:
      selectedArea.value === '-1'
        ? null
        : categories.value[1].subCategories.find(
            (item) => item.id === selectedArea.value
          )?.value,
  }

  getAllArtists(params).then((res) => {
    if (res.code === 0 && res.data) {
      artistList.value = res.data.items.map((item) => ({
        artistId: item.artistId,
        name: item.artistName,
        picUrl: item.avatar,
        alias: [],
      }))
      total.value = res.data.total
      state.total = res.data.total
    } else {
      ElNotification({
        type: 'error',
        message: '获取歌手列表失败',
        duration: 2000,
      })
    }
  })
}

const toggleMenu = (index: number) => {
  categories.value[index].isOpen = !categories.value[index].isOpen
}

const handleSizeChange = () => {
  currentPage.value = 1
  fetchArtistList()
}

const handleCurrentChange = () => {
  fetchArtistList()
}

const handleSubCategoryClick = (id: string, index: number) => {
  if (index === 0) {
    selectedGender.value = id
  } else {
    selectedArea.value = id
  }
  currentPage.value = 1
  fetchArtistList()
}

const handleGetArtistList = () => {
  fetchArtistList()
}

const handleSearch = () => {
  fetchArtistList()
}

const handleRouteSearch = () => {
  currentPage.value = 1
  router.push({
    path: '/artist',
    query: searchKeyword.value ? { query: searchKeyword.value } : {},
  })
}

const handleRouteReset = () => {
  searchKeyword.value = ''
  selectedGender.value = '-1'
  selectedArea.value = '-1'
  currentPage.value = 1
  router.push({ path: '/artist' })
}

const handleReset = () => {
  searchKeyword.value = ''
  selectedGender.value = '-1'
  selectedArea.value = '-1'
  currentPage.value = 1
  handleGetArtistList()
}

watch(
  () => route.query.query,
  (newQuery) => {
    searchKeyword.value = typeof newQuery === 'string' ? newQuery : ''
    currentPage.value = 1
    fetchArtistList()
  },
  { immediate: true }
)

onMounted(() => {
  if (!isArtistPage.value) return
  searchKeyword.value =
    typeof route.query.query === 'string' ? route.query.query : ''
  handleGetArtistList()
})

onActivated(() => {
  if (!isArtistPage.value) return
  searchKeyword.value =
    typeof route.query.query === 'string' ? route.query.query : ''
  fetchArtistList()
})
</script>

<template>
  <div class="artist-page">
    <aside class="artist-sidebar">
      <div class="sidebar-card">
        <div class="sidebar-header">
          <div>
            <p class="sidebar-kicker">Artist Filter</p>
            <h2 class="sidebar-title">歌手筛选</h2>
          </div>
          <button class="reset-button" @click="handleRouteReset">
            <icon-bx:reset class="h-4 w-4" />
            重置
          </button>
        </div>

        <div class="search-box">
          <icon-akar-icons:search class="search-icon" />
          <input
            v-model="searchKeyword"
            @keyup.enter="handleRouteSearch"
            class="search-input"
            placeholder="搜索歌手"
          />
        </div>

        <div class="filter-section">
          <button class="filter-trigger" @click="toggleMenu(0)">
            <span>{{ categories[0].name }}</span>
            <icon-tabler:chevron-right
              :style="{ transform: categories[0].isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }"
            />
          </button>
          <div v-show="categories[0].isOpen" class="filter-list">
            <button
              v-for="(subCategory, subIndex) in categories[0].subCategories"
              :key="subIndex"
              class="filter-chip"
              :class="{ active: selectedGender === subCategory.id }"
              @click="handleSubCategoryClick(subCategory.id, 0)"
            >
              {{ subCategory.label }}
            </button>
          </div>
        </div>

        <div class="filter-section">
          <button class="filter-trigger" @click="toggleMenu(1)">
            <span>{{ categories[1].name }}</span>
            <icon-tabler:chevron-right
              :style="{ transform: categories[1].isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }"
            />
          </button>
          <div v-show="categories[1].isOpen" class="filter-list">
            <button
              v-for="(subCategory, subIndex) in categories[1].subCategories"
              :key="subIndex"
              class="filter-chip"
              :class="{ active: selectedArea === subCategory.id }"
              @click="handleSubCategoryClick(subCategory.id, 1)"
            >
              {{ subCategory.label }}
            </button>
          </div>
        </div>

        <div class="sidebar-summary">
          <div class="summary-card">
            <span class="summary-label">当前页</span>
            <strong>{{ currentPage }}</strong>
          </div>
          <div class="summary-card">
            <span class="summary-label">歌手数量</span>
            <strong>{{ total }}</strong>
          </div>
        </div>
      </div>
    </aside>

    <main class="artist-main">
      <section class="artist-hero">
        <div class="hero-copy">
          <p class="hero-kicker">Artists</p>
          <h1 class="hero-title">歌手</h1>
          <p class="hero-subtitle">
            按地区、性别或关键词快速查找想听的歌手，进入详情页继续浏览作品。
          </p>
        </div>
        <div class="hero-note">
          <div class="hero-note-chip">Discovery</div>
          <div class="hero-note-title">从筛选到浏览更自然</div>
          <p class="hero-note-text">
            左侧筛选保持原逻辑不变，右侧改成更清晰的头像卡片布局。
          </p>
        </div>
      </section>

      <section class="artist-grid-panel">
        <div class="panel-header">
          <div>
            <p class="panel-kicker">Artist List</p>
            <h2 class="panel-title">全部歌手</h2>
          </div>
          <span class="panel-tip">点击头像卡片即可进入歌手详情</span>
        </div>

        <div :class="['artist-grid', 'grid', gridCols, gridGap]">
          <div
            v-for="artist in artistList"
            :key="artist.artistId"
            class="artist-card"
          >
            <button
              class="artist-button"
              @click="router.push(`/artist/${artist.artistId}`)"
            >
              <div class="artist-image-wrap">
                <el-image
                  lazy
                  :alt="artist.name"
                  class="artist-image"
                  :src="artist.picUrl + '?param=230y230'"
                />
                <div class="artist-overlay"></div>
              </div>
              <div class="artist-info">
                <h3 class="artist-name">{{ artist.name }}</h3>
                <p v-if="artist.alias && artist.alias.length > 0" class="artist-alias">
                  {{ artist.alias.join(' / ') }}
                </p>
                <span v-else class="artist-alias artist-alias-empty">进入主页查看歌曲与资料</span>
              </div>
            </button>
          </div>
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
    </main>
  </div>
</template>

<style scoped>
.artist-page { display:grid; grid-template-columns:280px minmax(0,1fr); gap:20px; min-height:100%; padding:20px; background:radial-gradient(circle at top left, rgba(118,163,255,.12), transparent 26%), radial-gradient(circle at top right, rgba(255,194,210,.12), transparent 22%), linear-gradient(180deg, rgba(246,249,255,.96), rgba(252,252,255,.98)); }
.artist-sidebar,.artist-main{min-width:0}
.sidebar-card,.artist-hero,.artist-grid-panel{border:1px solid rgba(140,168,230,.16);background:linear-gradient(180deg, rgba(255,255,255,.96), rgba(247,250,255,.94)),#fff;box-shadow:0 18px 38px rgba(87,111,167,.1)}
.sidebar-card{position:sticky;top:20px;padding:22px;border-radius:28px}
.sidebar-header,.panel-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.sidebar-kicker,.panel-kicker,.hero-kicker{margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6f7ee2}
.sidebar-title,.panel-title{margin:0;font-size:24px;color:#233451}
.reset-button{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border:1px solid rgba(143,168,215,.2);border-radius:12px;background:rgba(255,255,255,.88);color:#4f6280;font-size:13px;font-weight:600;transition:all .25s ease}
.reset-button:hover{border-color:rgba(102,126,234,.28);color:#5974d5;box-shadow:0 10px 20px rgba(103,126,214,.12)}
.search-box{position:relative;margin-top:18px}
.search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#8793aa;font-size:16px}
.search-input{width:100%;min-height:46px;padding:0 14px 0 42px;border:1px solid rgba(143,168,215,.2);border-radius:16px;background:rgba(255,255,255,.92);color:#2a3a56;font-size:14px;transition:all .25s ease;box-shadow:0 10px 20px rgba(108,131,177,.08)}
.search-input:focus{outline:none;border-color:rgba(93,119,215,.36);box-shadow:0 12px 22px rgba(97,123,182,.14)}
.filter-section{margin-top:18px}
.filter-trigger{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:42px;padding:0 14px;border:1px solid rgba(144,171,222,.14);border-radius:14px;background:rgba(245,248,255,.84);color:#3d5174;font-size:14px;font-weight:700;transition:all .25s ease}
.filter-list{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.filter-chip{min-height:34px;padding:0 12px;border:1px solid rgba(143,168,215,.18);border-radius:999px;background:rgba(255,255,255,.94);color:#5a6b87;font-size:13px;transition:all .25s ease}
.filter-chip:hover{border-color:rgba(102,126,234,.28);color:#5974d5}
.filter-chip.active{border-color:transparent;background:linear-gradient(135deg,#5f87e6 0%,#7d7fe8 58%,#eb8fa8 100%);color:#fff;box-shadow:0 10px 20px rgba(103,126,214,.2)}
.sidebar-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:22px}
.summary-card{padding:14px;border:1px solid rgba(145,172,228,.14);border-radius:18px;background:rgba(255,255,255,.82)}
.summary-label{display:block;font-size:12px;color:#7a88a1}
.summary-card strong{display:block;margin-top:8px;font-size:20px;color:#233451}
.artist-main{display:flex;flex-direction:column;gap:20px}
.artist-hero{display:grid;grid-template-columns:minmax(0,1.4fr) 320px;gap:22px;padding:28px;border-radius:30px}
.hero-title{margin:0;font-size:40px;line-height:1.12;color:#223350}
.hero-subtitle{max-width:720px;margin:14px 0 0;font-size:15px;line-height:1.85;color:#687891}
.hero-note{padding:22px;border:1px solid rgba(142,170,228,.15);border-radius:24px;background:linear-gradient(180deg, rgba(255,255,255,.92), rgba(246,250,255,.9)),#fff;box-shadow:0 16px 32px rgba(89,116,172,.1)}
.hero-note-chip{display:inline-flex;align-items:center;height:28px;padding:0 10px;border-radius:999px;background:rgba(99,125,214,.12);color:#5671cf;font-size:12px;font-weight:700}
.hero-note-title{margin-top:16px;font-size:20px;font-weight:700;line-height:1.4;color:#233451}
.hero-note-text{margin:10px 0 0;font-size:14px;line-height:1.8;color:#6f809a}
.artist-grid-panel{padding:22px;border-radius:28px}
.panel-tip{font-size:13px;color:#7b88a4}
.artist-card{border-radius:28px;background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,251,255,.94)),#fff;border:1px solid rgba(144,170,223,.14);box-shadow:0 14px 28px rgba(91,116,172,.1);overflow:hidden;transition:transform .28s ease, box-shadow .28s ease, border-color .28s ease}
.artist-card:hover{transform:translateY(-6px);border-color:rgba(109,142,218,.24);box-shadow:0 18px 34px rgba(91,116,172,.15)}
.artist-button{width:100%;padding:18px;text-align:left}
.artist-image-wrap{position:relative;aspect-ratio:1/1;overflow:hidden;border-radius:999px}
.artist-image{width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
.artist-card:hover .artist-image{transform:scale(1.06)}
.artist-overlay{position:absolute;inset:0;border-radius:999px;box-shadow:inset 0 -24px 44px rgba(20,33,61,.18);pointer-events:none}
.artist-info{padding:16px 6px 4px;text-align:center}
.artist-name{margin:0;font-size:18px;font-weight:700;color:#243653}
.artist-alias{margin:8px 0 0;font-size:13px;line-height:1.7;color:#73829d}
.artist-alias-empty{color:#8490a6}
.pagination-wrap{display:flex;justify-content:center;margin-top:22px}
:deep(.custom-pagination .el-pagination__total),:deep(.custom-pagination .el-pagination__jump){color:#687892;font-weight:500}
:deep(.custom-pagination .el-pagination__sizes){min-width:120px}
:deep(.custom-pagination .el-select),:deep(.custom-pagination .el-input__wrapper){width:120px}
:deep(.custom-pagination .el-pager li){border-radius:10px;margin:0 4px;transition:all .25s ease}
:deep(.custom-pagination .el-pager li:hover){background:rgba(102,126,234,.12);color:#5d76d7}
:deep(.custom-pagination .el-pager li.is-active){background:linear-gradient(135deg,#5f87e6 0%,#7d7fe8 58%,#eb8fa8 100%);color:#fff;box-shadow:0 10px 20px rgba(103,126,214,.22)}
:deep(.custom-pagination .btn-prev),:deep(.custom-pagination .btn-next){border-radius:10px;transition:all .25s ease}
:deep(.custom-pagination .btn-prev:hover),:deep(.custom-pagination .btn-next:hover){background:rgba(102,126,234,.12);color:#5d76d7}
@media (max-width:1200px){.artist-page{grid-template-columns:1fr}.sidebar-card{position:static}}
@media (max-width:900px){.artist-hero{grid-template-columns:1fr}}
@media (max-width:768px){.artist-page{padding:14px}.sidebar-card,.artist-hero,.artist-grid-panel{padding:18px 16px;border-radius:22px}.hero-title{font-size:30px}.panel-header{flex-direction:column;align-items:flex-start}}

html.dark .artist-page{background:radial-gradient(circle at top left, rgba(79,112,196,.22), transparent 28%),radial-gradient(circle at top right, rgba(171,92,144,.18), transparent 24%),linear-gradient(180deg, rgba(17,23,38,.98), rgba(10,15,28,1))}
html.dark .sidebar-card,html.dark .artist-hero,html.dark .artist-grid-panel,html.dark .hero-note,html.dark .artist-card{border-color:rgba(117,138,196,.18);background:linear-gradient(180deg, rgba(26,34,54,.94), rgba(20,27,44,.96)),#182133;box-shadow:0 18px 40px rgba(0,0,0,.26)}
html.dark .reset-button,html.dark .summary-card,html.dark .filter-trigger,html.dark .filter-chip{border-color:rgba(142,163,224,.16);background:rgba(255,255,255,.06);color:#c6d2ee}
html.dark .search-input{border-color:rgba(142,163,224,.16);background:rgba(255,255,255,.06);box-shadow:none;color:#e9efff}
html.dark .sidebar-title,html.dark .panel-title,html.dark .hero-title,html.dark .hero-note-title,html.dark .artist-name,html.dark .summary-card strong{color:#eef3ff}
html.dark .hero-subtitle,html.dark .hero-note-text,html.dark .panel-tip,html.dark .artist-alias,html.dark .artist-alias-empty,html.dark .summary-label,html.dark :deep(.custom-pagination .el-pagination__total),html.dark :deep(.custom-pagination .el-pagination__jump){color:#aab7d6}
html.dark :deep(.custom-pagination .btn-prev),html.dark :deep(.custom-pagination .btn-next),html.dark :deep(.custom-pagination .el-pager li){background:rgba(255,255,255,.04);color:#c8d3ef}
html.dark :deep(.custom-pagination .btn-prev:hover),html.dark :deep(.custom-pagination .btn-next:hover),html.dark :deep(.custom-pagination .el-pager li:hover){background:rgba(103,126,214,.18);color:#dfe7ff}
</style>
