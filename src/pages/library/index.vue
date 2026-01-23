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
const pageSize = ref(20) // 每页显示的数量

const state = reactive({
  size: 'default',
  disabled: false,
  background: false,
  layout: 'total, sizes, prev, pager, next, jumper',
  total: 0,
  pageSizes: [20, 30, 50],
})

// 监听分页变化
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
  <div class="flex-1 h-full flex flex-col overflow-hidden library-container">
    <Table :data="tableData?.items" class="flex-1 overflow-x-hidden custom-table" />
    <nav class="mx-auto flex w-full justify-center mt-3">
      <el-pagination
        v-model:page-size="pageSize"
        v-model:currentPage="currentPage"
        v-bind="state"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="mb-3 custom-pagination"
      />
    </nav>
  </div>
</template>

<style scoped>
.library-container {
  backdrop-filter: blur(20px);
  padding: 16px;
  border-radius: 16px;
}

html.light .library-container {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 255, 0.9) 100%);
}

html.dark .library-container {
  background: linear-gradient(135deg, rgba(30, 30, 46, 0.6) 0%, rgba(26, 26, 46, 0.6) 100%);
}

:deep(.custom-table) {
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.1);
}

html.light :deep(.custom-table) {
  background: rgba(255, 255, 255, 0.95);
}

html.dark :deep(.custom-table) {
  background: rgba(40, 40, 60, 0.95);
}

:deep(.custom-pagination .el-pagination__total),
:deep(.custom-pagination .el-pagination__jump) {
  color: #667eea;
  font-weight: 500;
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
