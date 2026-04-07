<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import DrawerMusic from '@/components/DrawerMusic/index.vue'
import defaultAlbum from '@/assets/default_album.jpg'
import { normalizeMediaUrl } from '@/utils/media'
import { getSongDetail } from '@/api/system'
import type { SongDetail } from '@/api/interface'

const { currentTrack } = useAudioPlayer()
const showDrawerMusic = ref(false)
const footerCover = ref(defaultAlbum)
const footerSongDetail = ref<SongDetail | null>(null)

watch(
  () => currentTrack.value.id,
  async (newId) => {
    footerSongDetail.value = null
    footerCover.value = normalizeMediaUrl(currentTrack.value.cover) || defaultAlbum

    if (!newId) return

    try {
      const res = await getSongDetail(Number(newId))
      if (res.code === 0 && res.data) {
        footerSongDetail.value = res.data as unknown as SongDetail
        footerCover.value =
          normalizeMediaUrl(footerSongDetail.value.coverUrl) ||
          normalizeMediaUrl(currentTrack.value.cover) ||
          defaultAlbum
      }
    } catch (error) {
      console.error('获取底部播放器歌曲详情失败:', error)
    }
  },
  { immediate: true }
)

const handleCoverError = () => {
  footerCover.value = defaultAlbum
}
</script>

<template>
  <div 
    class="flex items-center gap-2 w-64 cursor-pointer select-none hover:bg-hoverMenuBg transition-colors rounded-lg p-1" 
    @click="showDrawerMusic = !showDrawerMusic"
  >
    <div class="min-w-12 max-w-12 h-full">
      <img
        :key="`${currentTrack.id}-${footerCover}`"
        :src="footerCover"
        :alt="currentTrack.title"
        class="w-full h-full object-cover rounded-lg m-1"
        @error="handleCoverError"
      />
    </div>
    <div>
      <div
        class="text-base text-primary-foreground line-clamp-1 mb-0.5 mx-2"
        :title="currentTrack.title"
      >
        {{ currentTrack.title }}
      </div>
      <div class="text-xs text-muted-foreground line-clamp-1 h-4 mt-0.5 mx-2">
        {{ currentTrack.artist }}
      </div>
    </div>
    <DrawerMusic v-model="showDrawerMusic" />
  </div>
</template>
