<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getSongsByStyle } from '@/api/system'
import Table from '@/components/Table.vue'
import { Song } from '@/api/interface'

defineOptions({ name: 'GenreDetail' })

const route = useRoute()
const router = useRouter()
const isGenreDetailRoute = computed(() => route.name === 'GenreDetail')

const styleId = computed(() => Number(route.params.id))
const styleName = computed(() => (route.query.name as string) || '曲风')

const songs = ref<Song[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)

const headerDescription = computed(
  () => `这里收录了与“${styleName.value}”风格相关的歌曲，你可以直接浏览、播放或继续切换到其他风格。`,
)

const fetchSongs = async () => {
  if (!isGenreDetailRoute.value) return
  if (!styleId.value || Number.isNaN(styleId.value)) return

  loading.value = true
  try {
    const res = await getSongsByStyle(styleId.value, pageNum.value, pageSize.value)
    if (res.code === 0 && res.data) {
      const data = res.data as any
      songs.value = data.items || []
      total.value = data.total || 0
    } else {
      songs.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
  }
}

watch(
  styleId,
  () => {
    if (!isGenreDetailRoute.value) return
    pageNum.value = 1
  },
  { immediate: false },
)

watch([() => route.name, styleId, pageNum], fetchSongs, { immediate: true })
</script>

<template>
  <div class="genre-detail-page">
    <section class="genre-detail-hero">
      <button class="genre-back-btn" @click="router.back()">
        <icon-ri:arrow-left-line class="text-lg" />
      </button>

      <div class="genre-detail-copy">
        <p class="genre-detail-kicker">Style Detail</p>
        <h1>{{ styleName }}</h1>
        <p class="genre-detail-desc">{{ headerDescription }}</p>
      </div>

      <div class="genre-detail-stat">
        <span class="genre-detail-stat-label">当前收录</span>
        <strong>{{ total }}</strong>
        <span class="genre-detail-stat-unit">首歌曲</span>
      </div>

      <div class="genre-detail-orb genre-detail-orb-a" />
      <div class="genre-detail-orb genre-detail-orb-b" />
    </section>

    <section class="genre-detail-content">
      <div class="genre-detail-toolbar">
        <div>
          <p class="genre-detail-section-kicker">Song List</p>
          <h2>{{ styleName }} 歌曲列表</h2>
        </div>
        <span class="genre-detail-toolbar-tip">支持直接播放、收藏和更多操作</span>
      </div>

      <div class="genre-table-shell">
        <div v-if="loading" class="genre-table-state">
          <icon-ri:loader-4-line class="text-2xl animate-spin" />
          <span>正在加载歌曲列表...</span>
        </div>

        <div v-else-if="songs.length === 0" class="genre-table-state is-empty">
          <icon-ri:music-2-line class="text-2xl" />
          <span>这个曲风下暂时还没有歌曲</span>
        </div>

        <Table v-else :data="songs" class="genre-table" />
      </div>

      <nav v-if="total > pageSize" class="genre-pagination">
        <el-pagination
          v-model:current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          background
        />
      </nav>
    </section>
  </div>
</template>

<style scoped>
.genre-detail-page {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
}

.genre-detail-hero {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  padding: 22px 24px;
  min-height: 190px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  align-items: center;
}

html.light .genre-detail-hero {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.82) 0%, rgba(255, 255, 255, 0) 35%),
    linear-gradient(135deg, rgba(46, 96, 255, 0.95) 0%, rgba(120, 86, 255, 0.92) 55%, rgba(6, 182, 212, 0.9) 100%);
  box-shadow: 0 22px 56px rgba(74, 86, 163, 0.16);
}

html.dark .genre-detail-hero {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 35%),
    linear-gradient(135deg, rgba(52, 79, 194, 0.96) 0%, rgba(98, 64, 182, 0.94) 55%, rgba(5, 112, 130, 0.92) 100%);
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.24);
}

.genre-back-btn,
.genre-detail-copy,
.genre-detail-stat {
  position: relative;
  z-index: 1;
}

.genre-back-btn {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(12px);
}

.genre-detail-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.76);
}

.genre-detail-copy h1 {
  margin: 0;
  font-size: clamp(26px, 4vw, 36px);
  line-height: 1.08;
  color: #fff;
}

.genre-detail-desc {
  margin: 12px 0 0;
  max-width: 620px;
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.84);
}

.genre-detail-stat {
  min-width: 132px;
  padding: 18px 20px;
  border-radius: 22px;
  text-align: center;
  backdrop-filter: blur(16px);
}

html.light .genre-detail-stat {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

html.dark .genre-detail-stat {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.genre-detail-stat-label,
.genre-detail-stat-unit {
  display: block;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.genre-detail-stat strong {
  display: block;
  margin: 8px 0 6px;
  font-size: 34px;
  line-height: 1;
  color: #fff;
}

.genre-detail-orb {
  position: absolute;
  border-radius: 50%;
}

.genre-detail-orb-a {
  width: 180px;
  height: 180px;
  right: 72px;
  top: -36px;
  background: rgba(255, 255, 255, 0.1);
}

.genre-detail-orb-b {
  width: 120px;
  height: 120px;
  right: -12px;
  bottom: -20px;
  background: rgba(255, 255, 255, 0.08);
}

.genre-detail-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 28px;
  padding: 20px;
}

html.light .genre-detail-content {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(125, 140, 220, 0.12);
  box-shadow: 0 16px 42px rgba(88, 101, 168, 0.08);
}

html.dark .genre-detail-content {
  background: rgba(28, 34, 54, 0.76);
  border: 1px solid rgba(125, 140, 220, 0.1);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
}

.genre-detail-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.genre-detail-section-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6b7adc;
  font-weight: 700;
}

.genre-detail-toolbar h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  color: #27324e;
}

.genre-detail-toolbar-tip {
  font-size: 13px;
  color: #8190b3;
}

.genre-table-shell {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: 22px;
  padding: 10px;
}

html.light .genre-table-shell {
  background: rgba(246, 248, 255, 0.92);
}

html.dark .genre-table-shell {
  background: rgba(34, 40, 63, 0.82);
}

.genre-table {
  height: 100%;
}

.genre-table-state {
  height: 100%;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #8190b3;
}

.genre-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

html.dark .genre-detail-toolbar h2 {
  color: #eef2ff;
}

html.dark .genre-detail-toolbar-tip,
html.dark .genre-table-state {
  color: #a8b5d8;
}

@media (max-width: 900px) {
  .genre-detail-hero {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .genre-detail-stat {
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .genre-detail-page {
    padding: 14px;
  }

  .genre-detail-hero,
  .genre-detail-content {
    padding: 18px;
  }

  .genre-detail-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
