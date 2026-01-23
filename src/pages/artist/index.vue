<script setup lang="ts">
import { categories } from '@/utils/enum'
import { getAllArtists } from '@/api/system'
import { ElNotification } from 'element-plus'

const router = useRouter()
const artistList = ref([])

const selectedGender = ref('-1')
const selectedArea = ref('-1')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 根据每页数量计算列数和间距
const gridCols = computed(() => {
  return 'grid-cols-4' // 统一使用4列布局
})

const gridGap = computed(() => {
  if (pageSize.value === 24) return 'gap-x-12 gap-y-6' // 24条/页使用较小间距
  return 'gap-x-16 gap-y-8' // 12条/页使用较大间距
})

const state = reactive({
  size: 'default',
  disabled: false,
  background: false,
  layout: 'total, sizes, prev, pager, next, jumper',
  total: 0,
  pageSizes: [12, 24],
})

const searchKeyword = ref('')

// 切换菜单显示
const toggleMenu = (index: number) => {
  categories.value[index].isOpen = !categories.value[index].isOpen
}

// 处理分页大小变化
const handleSizeChange = () => {
  currentPage.value = 1
  handleGetArtistList()
}

// 处理页码变化
const handleCurrentChange = () => {
  handleGetArtistList()
}

const handleSubCategoryClick = (id: string, index: number) => {
  if (index === 0) {
    selectedGender.value = id
  } else {
    selectedArea.value = id
  }
  currentPage.value = 1
  handleGetArtistList()
}

const handleGetArtistList = () => {
  const params = {
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    name: null,
    gender: selectedGender.value === '-1' ? null : categories.value[0].subCategories.find(item => item.id === selectedGender.value)?.value,
    area: selectedArea.value === '-1' ? null : categories.value[1].subCategories.find(item => item.id === selectedArea.value)?.value
  }

  getAllArtists(params).then((res) => {
    if (res.code === 0 && res.data) {
      artistList.value = res.data.items.map(item => ({
        artistId: item.artistId,
        name: item.artistName,
        picUrl: item.avatar,
        alias: []
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

const handleSearch = () => {
  const params = {
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    artistName: searchKeyword.value || null,
    gender: selectedGender.value === '-1' ? null : categories.value[0].subCategories.find(item => item.id === selectedGender.value)?.value,
    area: selectedArea.value === '-1' ? null : categories.value[1].subCategories.find(item => item.id === selectedArea.value)?.value
  }

  getAllArtists(params).then((res) => {
    if (res.code === 0 && res.data) {
      artistList.value = res.data.items.map(item => ({
        artistId: item.artistId,
        name: item.artistName,
        picUrl: item.avatar,
        alias: []
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

const handleReset = () => {
  searchKeyword.value = ''
  selectedGender.value = '-1'
  selectedArea.value = '-1'
  currentPage.value = 1
  handleGetArtistList()
}

onMounted(() => {
  handleGetArtistList()
})
</script>
<template>
  <div class="flex h-full artist-page-container">
    <div class="w-64 sidebar-panel p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold page-title">歌手分类</h2>
        <button @click="handleReset"
          class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground reset-btn">
          <icon-bx:reset class="mr-1 h-4 w-4" />
          重置
        </button>
      </div>

      <nav>
        <div class="relative search-container">
          <icon-akar-icons:search
            class="lucide lucide-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input v-model="searchKeyword" @keyup.enter="handleSearch"
            class="search-input flex h-10 rounded-xl border border-input transform duration-300 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 pl-10 w-56"
            placeholder="搜索歌手" />
        </div>

        <div class="mb-2 mt-4">
          <button
            class="category-btn inline-flex items-center justify-between gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
            @click="toggleMenu(0)">
            {{ categories[0].name }}
            <icon-tabler:chevron-right :style="{
              transform: categories[0].isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }" />
          </button>
          <div v-show="categories[0].isOpen" class="ml-4 mt-1 space-y-1">
            <button v-for="(subCategory, subIndex) in categories[0].subCategories" :key="subIndex"
              @click="handleSubCategoryClick(subCategory.id, 0)"
              class="sub-category-btn inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 rounded-lg px-3 w-48 justify-start"
              :class="selectedGender === subCategory.id ? 'bg-activeMenuBg text-accent-foreground' : 'hover:bg-hoverMenuBg text-foreground'">
              {{ subCategory.label }}
            </button>
          </div>
        </div>
        <div class="mb-2">
          <button
            class="category-btn inline-flex items-center justify-between gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
            @click="toggleMenu(1)">
            {{ categories[1].name }}
            <icon-tabler:chevron-right :style="{
              transform: categories[1].isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }" />
          </button>
          <div v-show="categories[1].isOpen" class="ml-4 mt-1 space-y-1">
            <button v-for="(subCategory, subIndex) in categories[1].subCategories" :key="subIndex"
              @click="handleSubCategoryClick(subCategory.id, 1)"
              class="sub-category-btn inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 rounded-lg px-3 w-48 justify-start"
              :class="selectedArea === subCategory.id ? 'bg-activeMenuBg text-accent-foreground' : 'hover:bg-hoverMenuBg text-foreground'">
              {{ subCategory.label }}
            </button>
          </div>
        </div>
      </nav>
    </div>
    <main class="flex-1 main-content overflow-y-auto">
      <div class="p-2 md:p-4 lg:p-6">
        <div class="w-[86%] mx-auto">
          <div :class="['grid', gridCols, gridGap]">
            <div v-for="(artist, index) in artistList" :key="index"
              class="artist-card group relative rounded-full text-card-foreground shadow-md hover:shadow-xl">
              <button @click="router.push(`/artist/${artist.artistId}`)" class="w-full h-full overflow-hidden rounded-full">
                <div class="w-full h-full relative">
                  <el-image lazy :alt="artist.name"
                    class="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                    :src="artist.picUrl + '?param=230y230'" />
                  <div
                    class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  </div>
                  <div
                    class="absolute bottom-0 left-0 right-0 px-4 py-3 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
                    <h2 class="mb-1 text-xl font-semibold">{{ artist.name }}</h2>
                    <p class="mb-2 text-sm" v-if="artist.alias && artist.alias.length > 0">
                      {{ artist.alias.join() }}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- 分页 -->
      <nav class="mx-auto flex w-full justify-center mt-6">
        <el-pagination v-model:page-size="pageSize" v-model:currentPage="currentPage" v-bind="state"
          @size-change="handleSizeChange" @current-change="handleCurrentChange" class="custom-pagination" />
      </nav>
    </main>
  </div>
</template>

<style scoped>
.artist-page-container {
  position: relative;
}

/* 侧边栏 */
.sidebar-panel {
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(102, 126, 234, 0.1);
}

html.light .sidebar-panel {
  background: rgba(255, 255, 255, 0.85);
}

html.dark .sidebar-panel {
  background: rgba(30, 30, 46, 0.85);
}

.page-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.reset-btn {
  transition: all 0.3s ease;
}

.reset-btn:hover {
  transform: scale(1.05);
  color: #667eea;
}

.search-container {
  margin-bottom: 16px;
}

.search-input {
  border: 1px solid rgba(102, 126, 234, 0.2);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

html.light .search-input {
  background: rgba(255, 255, 255, 0.95);
}

html.dark .search-input {
  background: rgba(40, 40, 60, 0.95);
  color: #e0e0e0;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
}

.category-btn {
  transition: all 0.3s ease;
}

html.light .category-btn:hover {
  background: rgba(102, 126, 234, 0.08);
}

html.dark .category-btn:hover {
  background: rgba(102, 126, 234, 0.15);
}

.sub-category-btn {
  transition: all 0.3s ease;
}

.sub-category-btn:hover {
  transform: translateX(4px);
}

/* 主内容区 */
.main-content {
  backdrop-filter: blur(20px);
}

html.light .main-content {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 255, 0.9) 100%);
}

html.dark .main-content {
  background: linear-gradient(135deg, rgba(30, 30, 46, 0.6) 0%, rgba(26, 26, 46, 0.6) 100%);
}

/* 歌手卡片 */
.artist-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
}

.artist-card:hover {
  transform: translateY(-8px);
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.25);
}

/* 分页器 */
:deep(.custom-pagination .el-pagination__total),
:deep(.custom-pagination .el-pagination__jump) {
  color: #667eea;
  font-weight: 500;
}

/* 固定分页大小选择器的宽度，防止跳动 */
:deep(.custom-pagination .el-pagination__sizes) {
  min-width: 120px;
}

:deep(.custom-pagination .el-select) {
  width: 120px;
}

:deep(.custom-pagination .el-input__wrapper) {
  width: 120px;
}

:deep(.custom-pagination .el-pager li) {
  border-radius: 8px;
  margin: 0 4px;
  transition: all 0.3s ease;
}

html.light :deep(.custom-pagination .el-pager li) {
  background: rgba(255, 255, 255, 0.8);
}

html.dark :deep(.custom-pagination .el-pager li) {
  background: rgba(40, 40, 60, 0.8);
}

:deep(.custom-pagination .el-pager li:hover) {
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
}

:deep(.custom-pagination .el-pager li.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

:deep(.custom-pagination .btn-prev),
:deep(.custom-pagination .btn-next) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

html.light :deep(.custom-pagination .btn-prev),
html.light :deep(.custom-pagination .btn-next) {
  background: rgba(255, 255, 255, 0.8);
}

html.dark :deep(.custom-pagination .btn-prev),
html.dark :deep(.custom-pagination .btn-next) {
  background: rgba(40, 40, 60, 0.8);
}

:deep(.custom-pagination .btn-prev:hover),
:deep(.custom-pagination .btn-next:hover) {
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
}
</style>
