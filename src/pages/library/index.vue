/* eslint-disable */
<script setup lang="ts">
import { getAllSongs } from '@/api/system'
import { useLibraryStore } from '@/stores/modules/library'

const route = useRoute()
const libraryStore = useLibraryStore()

const props = defineProps({
  selected: {
    type: String,
    default: '1',
  },
})
const tableData = computed(() => libraryStore.tableData)

const currentPage = ref(1) // 当前页
const pageSize = ref(20) // 每页显示数量

const state = reactive({
  size: 'default',
  disabled: false,
  background: false,
  layout: 'total, sizes, prev, pager, next, jumper',
  total: 0,
  pageSizes: [20, 30, 50],
})

// 监听分页大小变化
const handleSizeChange = () => {
  getSongs()
}

// 监听当前页变化
const handleCurrentChange = () => {
  getSongs()
}

const getSongs = () => {
  libraryStore.setTableData(null)
  getAllSongs({
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    songName: (route.query.query as string) || '',
    artistName: '',
    album: '',
  }).then((res) => {
    if (res.code === 0 && res.data) {
      libraryStore.setTableData(res.data)
      state.total = res.data.total || 0
    }
  })
}

watch(
  () => [route.query.query, props.selected],
  (val) => {
    if (!val[1] || val[1] != '1') return
    getSongs()
  },
  {
    immediate: true,
  }
)
</script>

<template>
  <div class="library-page">
    <section class="library-hero">
      <div class="hero-copy">
        <div class="hero-badge">
          <div class="hero-icon">
            <icon-ri:music-2-line class="hero-icon-inner" />
          </div>
          <span>Music Library</span>
        </div>

        <h1 class="hero-title">曲库</h1>
        <p class="hero-subtitle">
          在这里浏览全部歌曲，结合搜索与分页更快定位你想听的内容。
        </p>

        <div class="hero-stats">
          <div class="stat-card">
            <span class="stat-label">当前页码</span>
            <strong>{{ currentPage }}</strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">每页数量</span>
            <strong>{{ pageSize }}</strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">总歌曲数</span>
            <strong>{{ state.total }}</strong>
          </div>
        </div>
      </div>

      <div class="hero-side">
        <div class="library-note-card">
          <div class="note-chip">Collection</div>
          <div class="note-title">完整浏览你的音乐内容</div>
          <p class="note-text">
            支持分页查看与站内搜索联动，方便从全量曲库里继续筛选。
          </p>
        </div>
      </div>

      <div class="hero-glow hero-glow-a" />
      <div class="hero-glow hero-glow-b" />
    </section>

    <section class="library-table-panel">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">All Songs</p>
          <h2 class="panel-title">歌曲列表</h2>
        </div>
        <span class="panel-tip">搜索结果会自动同步到这里，不影响现有分页逻辑</span>
      </div>

      <div class="table-shell">
        <Table :data="tableData?.items" class="library-table" />
      </div>

      <nav class="pagination-wrap">
        <el-pagination
          v-model:page-size="pageSize"
          v-model:currentPage="currentPage"
          v-bind="state"
          class="library-pagination"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </nav>
    </section>
  </div>
</template>

<style scoped>
.library-page {
  min-height: 100%;
  padding: 20px;
  background:
    radial-gradient(circle at top left, rgba(118, 161, 255, 0.11), transparent 28%),
    radial-gradient(circle at top right, rgba(255, 198, 214, 0.12), transparent 22%),
    linear-gradient(180deg, rgba(246, 249, 255, 0.96), rgba(252, 252, 255, 0.98));
}

.library-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) 320px;
  gap: 24px;
  padding: 28px;
  overflow: hidden;
  border: 1px solid rgba(140, 168, 230, 0.16);
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 245, 255, 0.93)),
    #fff;
  box-shadow: 0 22px 48px rgba(91, 118, 179, 0.12);
}

.hero-copy,
.hero-side {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px 10px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(138, 166, 227, 0.16);
  color: #687892;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, #4f84e7 0%, #757fe8 58%, #ee91a8 100%);
  box-shadow: 0 10px 22px rgba(103, 126, 214, 0.25);
}

.hero-icon-inner {
  font-size: 24px;
  color: #fff;
}

.hero-title {
  margin: 18px 0 0;
  font-size: 40px;
  line-height: 1.12;
  color: #223350;
}

.hero-subtitle {
  max-width: 720px;
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.85;
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
  border: 1px solid rgba(143, 171, 228, 0.16);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 10px 22px rgba(95, 121, 178, 0.09);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #7c89a3;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 22px;
  color: #243653;
}

.hero-side {
  display: flex;
  align-items: stretch;
}

.library-note-card {
  width: 100%;
  padding: 22px;
  border: 1px solid rgba(142, 170, 228, 0.15);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(246, 250, 255, 0.9)),
    #fff;
  box-shadow: 0 16px 32px rgba(89, 116, 172, 0.1);
}

.note-chip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(99, 125, 214, 0.12);
  color: #5671cf;
  font-size: 12px;
  font-weight: 700;
}

.note-title {
  margin-top: 16px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  color: #233451;
}

.note-text {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.8;
  color: #6f809a;
}

.hero-glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.hero-glow-a {
  top: -72px;
  right: 210px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(128, 168, 255, 0.24), transparent 70%);
}

.hero-glow-b {
  right: -48px;
  bottom: -54px;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(255, 187, 205, 0.22), transparent 70%);
}

.library-table-panel {
  margin-top: 22px;
  padding: 22px;
  border: 1px solid rgba(143, 171, 229, 0.14);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(247, 250, 255, 0.95)),
    #fff;
  box-shadow: 0 18px 38px rgba(87, 112, 167, 0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
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
  color: #223350;
}

.panel-tip {
  font-size: 13px;
  color: #7b88a4;
}

.table-shell {
  overflow: hidden;
  border: 1px solid rgba(145, 172, 228, 0.12);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
}

.library-table {
  min-height: 420px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 18px;
}

:deep(.library-pagination .el-pagination__total),
:deep(.library-pagination .el-pagination__jump) {
  color: #687892;
  font-weight: 500;
}

:deep(.library-pagination .el-pager li) {
  border-radius: 10px;
  margin: 0 4px;
  transition: all 0.25s ease;
}

:deep(.library-pagination .el-pager li:hover) {
  background: rgba(102, 126, 234, 0.12);
  color: #5d76d7;
}

:deep(.library-pagination .el-pager li.is-active) {
  background: linear-gradient(135deg, #5f87e6 0%, #7d7fe8 58%, #eb8fa8 100%);
  color: #fff;
  box-shadow: 0 10px 20px rgba(103, 126, 214, 0.22);
}

:deep(.library-pagination .btn-prev),
:deep(.library-pagination .btn-next) {
  border-radius: 10px;
  transition: all 0.25s ease;
}

:deep(.library-pagination .btn-prev:hover),
:deep(.library-pagination .btn-next:hover) {
  background: rgba(102, 126, 234, 0.12);
  color: #5d76d7;
}

@media (max-width: 1100px) {
  .library-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .library-page {
    padding: 14px;
  }

  .library-hero,
  .library-table-panel {
    padding: 18px 16px;
    border-radius: 22px;
  }

  .hero-title {
    font-size: 30px;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-card {
    min-width: 0;
    flex: 1 1 calc(50% - 8px);
  }
}
</style>
