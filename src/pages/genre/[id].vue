<script setup lang="ts">
import { getSongsByStyle } from '@/api/system'
import Table from '@/components/Table.vue'
import { Song } from '@/api/interface'

defineOptions({ name: 'GenreDetail' })

const route = useRoute()
const router = useRouter()

const styleId = computed(() => Number(route.params.id))
const styleName = computed(() => (route.query.name as string) || '曲风')

const songs = ref<Song[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)

const fetchSongs = async () => {
  if (!styleId.value || isNaN(styleId.value)) return
  loading.value = true
  try {
    const res = await getSongsByStyle(styleId.value, pageNum.value, pageSize.value)
    if (res.code === 0 && res.data) {
      const d = res.data as any
      songs.value = d.items || []
      total.value = d.total || 0
    }
  } finally {
    loading.value = false
  }
}

watch([styleId, pageNum], fetchSongs, { immediate: true })
</script>

<template>
  <div class="genre-detail-container flex flex-col h-full overflow-hidden">
    <!-- 头部 -->
    <div class="flex items-center gap-3 mb-4 px-1">
      <el-button text circle @click="router.back()">
        <icon-ri:arrow-left-line class="text-lg" />
      </el-button>
      <div class="text-xl font-bold">{{ styleName }}</div>
      <span class="text-sm opacity-50 ml-1">共 {{ total }} 首</span>
    </div>

    <!-- 歌曲列表 -->
    <div class="flex-1 overflow-hidden table-wrap rounded-xl">
      <div v-if="loading" class="flex items-center justify-center h-40 opacity-50">
        <icon-ri:loader-4-line class="text-2xl animate-spin mr-2" />加载中...
      </div>
      <div v-else-if="songs.length === 0" class="flex items-center justify-center h-40 opacity-40">
        该曲风暂无歌曲
      </div>
      <Table v-else :data="songs" class="h-full" />
    </div>

    <!-- 分页 -->
    <nav v-if="total > pageSize" class="flex justify-center mt-3 mb-1">
      <el-pagination
        v-model:current-page="pageNum"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        background
      />
    </nav>
  </div>
</template>

<style scoped>
.genre-detail-container {
  padding: 16px;
  border-radius: 16px;
  backdrop-filter: blur(20px);
}

html.light .genre-detail-container {
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,249,255,0.9) 100%);
}
html.dark .genre-detail-container {
  background: linear-gradient(135deg, rgba(30,30,46,0.6) 0%, rgba(26,26,46,0.6) 100%);
}

.table-wrap {
  padding: 8px;
}
html.light .table-wrap {
  background: rgba(255,255,255,0.95);
  box-shadow: 0 4px 16px rgba(102,126,234,0.1);
}
html.dark .table-wrap {
  background: rgba(40,40,60,0.95);
}
</style>
