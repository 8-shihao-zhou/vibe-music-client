/* eslint-disable */
<script setup lang="ts">
import { getAllSongs } from '@/api/system'
import { useLibraryStore } from '@/stores/modules/library'

const route = useRoute()
const libraryStore = useLibraryStore()

//接收父组件传来的 selected 参数
//一般用于判断当前是否切换到了“曲库”这个页签
const props = defineProps({
  selected: {
    type: String,
    default: '1',
  },
})

//从 store 中取出表格数据，供页面表格组件直接使用
const tableData = computed(() => libraryStore.tableData)

const currentPage = ref(1) //当前页
const pageSize = ref(20) //每页显示数量

//分页器相关配置
const state = reactive({
  size: 'default',
  disabled: false,
  background: false,
  layout: 'total, sizes, prev, pager, next, jumper',
  total: 0,
  pageSizes: [20, 30, 50],
})

//监听分页大小变化
//当用户切换每页显示数量时，重新请求歌曲数据
const handleSizeChange = () => {
  getSongs()
}

//监听当前页变化
//当用户点击下一页、上一页、页码按钮时，重新请求歌曲数据
const handleCurrentChange = () => {
  getSongs()
}

//请求歌曲列表的方法
const getSongs = () => {
  //请求前先清空旧表格数据，避免页面展示旧内容
  libraryStore.setTableData(null)

  //调用后端接口获取歌曲列表
  getAllSongs({
    pageNum: currentPage.value,//当前页
    pageSize: pageSize.value,//每页数量
    songName: (route.query.query as string) || '',//从路由参数中读取搜索关键字
    artistName: '',//当前这里没有按歌手筛选
    album: '',//当前这里没有按专辑筛选
  }).then((res) => {
    //请求成功后，把数据保存到 store，并更新分页总数
    if (res.code === 0 && res.data) {
      libraryStore.setTableData(res.data)
      state.total = res.data.total || 0
    }
  })
}

//监听路由搜索参数和 selected 选中状态
watch(
  () => [route.query.query, props.selected],
  (val) => {
    //如果当前不是选中的模块，则不请求数据
    if (!val[1] || val[1] != '1') return
    //当搜索关键字变化，或者切换到当前模块时，重新加载歌曲
    getSongs()
  },
  {
    immediate: true,//页面初始化时立即执行一次
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

html.dark .library-page {
  background:
    radial-gradient(circle at top left, rgba(79, 112, 196, 0.22), transparent 28%),
    radial-gradient(circle at top right, rgba(171, 92, 144, 0.18), transparent 24%),
    linear-gradient(180deg, rgba(17, 23, 38, 0.98), rgba(10, 15, 28, 1));
}

html.dark .library-hero,
html.dark .library-table-panel,
html.dark .library-note-card {
  border-color: rgba(117, 138, 196, 0.18);
  background:
    linear-gradient(180deg, rgba(26, 34, 54, 0.94), rgba(20, 27, 44, 0.96)),
    #182133;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.26);
}

html.dark .hero-badge,
html.dark .stat-card {
  border-color: rgba(142, 163, 224, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: #c6d2ee;
}

html.dark .hero-title,
html.dark .panel-title,
html.dark .note-title,
html.dark .stat-card strong {
  color: #eef3ff;
}

html.dark .hero-subtitle,
html.dark .panel-tip,
html.dark .note-text,
html.dark .stat-label,
html.dark :deep(.library-pagination .el-pagination__total),
html.dark :deep(.library-pagination .el-pagination__jump) {
  color: #aab7d6;
}

html.dark .table-shell {
  border-color: rgba(120, 141, 197, 0.16);
  background: rgba(255, 255, 255, 0.04);
}

html.dark :deep(.library-pagination .btn-prev),
html.dark :deep(.library-pagination .btn-next),
html.dark :deep(.library-pagination .el-pager li) {
  background: rgba(255, 255, 255, 0.04);
  color: #c8d3ef;
}

html.dark :deep(.library-pagination .btn-prev:hover),
html.dark :deep(.library-pagination .btn-next:hover),
html.dark :deep(.library-pagination .el-pager li:hover) {
  background: rgba(103, 126, 214, 0.18);
  color: #dfe7ff;
}
</style>
