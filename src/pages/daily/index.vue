<script setup lang="ts">
import { getRecommendedSongs } from '@/api/system'
import { UserStore } from '@/stores/modules/user'
import Table from '@/components/Table.vue'
import { Song } from '@/api/interface'

const userStore = UserStore()
const songs = ref<Song[]>([])
const loading = ref(false)

// 今天的日期显示
const today = new Date()
const dateStr = today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })

const fetchDaily = async () => {
  loading.value = true
  try {
    const res = await getRecommendedSongs()
    if (res.code === 0 && res.data) {
      songs.value = res.data as Song[]
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchDaily)
</script>

<template>
  <div class="daily-container flex flex-col h-full overflow-hidden">
    <!-- 头部 -->
    <div class="daily-header flex items-end gap-4 mb-4 px-1">
      <div class="header-icon">
        <icon-ri:calendar-2-line class="text-3xl text-white" />
      </div>
      <div>
        <div class="text-xl font-bold">每日推荐</div>
        <div class="text-sm opacity-60 mt-0.5">{{ dateStr }} · 根据你的喜好为你推荐</div>
      </div>
      <el-button
        class="ml-auto refresh-btn"
        size="small"
        :loading="loading"
        @click="fetchDaily"
      >
        <icon-ri:refresh-line class="mr-1" />
        刷新
      </el-button>
    </div>

    <!-- 未登录提示 -->
    <div v-if="!userStore.isLoggedIn" class="tip-card flex items-center gap-3 mb-4 px-4 py-3 rounded-xl">
      <icon-ri:information-line class="text-lg text-purple-400 shrink-0" />
      <span class="text-sm opacity-70">登录后可获得基于你收藏风格的个性化推荐</span>
    </div>

    <!-- 歌曲列表 -->
    <div class="flex-1 overflow-hidden table-wrap rounded-xl">
      <div v-if="loading" class="flex items-center justify-center h-40 opacity-50">
        <icon-ri:loader-4-line class="text-2xl animate-spin mr-2" />
        加载中...
      </div>
      <Table v-else :data="songs" class="h-full" />
    </div>
  </div>
</template>

<style scoped>
.daily-container {
  padding: 16px;
  border-radius: 16px;
  backdrop-filter: blur(20px);
}

html.light .daily-container {
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,249,255,0.9) 100%);
}
html.dark .daily-container {
  background: linear-gradient(135deg, rgba(30,30,46,0.6) 0%, rgba(26,26,46,0.6) 100%);
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tip-card {
  background: rgba(102, 126, 234, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.refresh-btn {
  border-radius: 8px;
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
