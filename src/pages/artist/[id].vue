<script setup lang="ts">
import { getArtistDetail } from '@/api/system'
import Table from '@/components/Table.vue'
import { useArtistStore } from '@/stores/modules/artist'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'

interface ArtistDetailResponse {
  artistId: number
  artistName: string
  avatar: string
  birth: string
  area: string
  introduction: string
  songs: any[]
}

const route = useRoute()
const artistStore = useArtistStore()
const isArtistDetailRoute = computed(() => /^\/artist\/[^/]+$/.test(route.path))

// 歌手详情数据
const artistInfo = computed(() => artistStore.artistInfo)

const fetchArtistDetail = async () => {
  if (!isArtistDetailRoute.value) return

  const id = route.params.id
  if (!id) return
  const numericId = parseInt(id.toString())
  if (Number.isNaN(numericId)) return

  try {
    artistStore.setArtistInfo(null)
    const res = await getArtistDetail(numericId)

    if (res.code === 0 && res.data) {
      const artistData = res.data as ArtistDetailResponse
      artistStore.setArtistInfo({
        artistId: artistData.artistId,
        artistName: artistData.artistName || '未知歌手',
        avatar: artistData.avatar || '',
        birth: artistData.birth || '',
        area: artistData.area || '未知地区',
        introduction: artistData.introduction || '暂未补充歌手简介',
        songs: artistData.songs || []
      })
    } else {
      ElMessage.error(res.message || '获取歌手信息失败')
    }
  } catch (error) {
    console.error('获取歌手详情失败:', error)
    ElMessage.error('获取歌手信息失败，请稍后重试')
  }
}

watch(
  () => [route.path, route.params.id],
  () => {
    fetchArtistDetail()
  },
  { immediate: true }
)

// 格式化生日
const formatBirth = (birth: string) => {
  if (!birth) return ''
  return new Date(birth).toLocaleDateString()
}
</script>

<template>
  <div class="artist-detail-page">
    <section class="artist-hero">
      <div class="artist-avatar-shell">
        <img
          :src="artistInfo?.avatar || ''"
          :alt="artistInfo?.artistName"
          class="artist-avatar"
        />
      </div>

      <div class="artist-main">
        <div class="artist-badge">
          <icon-ri:mic-2-line class="artist-badge-icon" />
          <span>Artist Profile</span>
        </div>

        <div class="artist-heading">
          <h1 class="artist-title">{{ artistInfo?.artistName || '歌手详情' }}</h1>
          <p class="artist-description">
            {{ artistInfo?.introduction || '暂未补充歌手简介，先看看这位歌手的作品吧。' }}
          </p>
        </div>

        <div class="artist-meta">
          <div class="meta-card">
            <span class="meta-label">地区</span>
            <strong>{{ artistInfo?.area || '未知地区' }}</strong>
          </div>
          <div class="meta-card">
            <span class="meta-label">生日</span>
            <strong>{{ artistInfo?.birth ? formatBirth(artistInfo.birth) : '暂未公开' }}</strong>
          </div>
          <div class="meta-card">
            <span class="meta-label">歌曲数量</span>
            <strong>{{ artistInfo?.songs?.length || 0 }}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="artist-panel">
      <div class="panel-heading">
        <div>
          <h2>代表作品</h2>
          <p>按列表浏览当前歌手的歌曲内容。</p>
        </div>
      </div>

      <div class="songs-table-shell">
        <Table :data="artistInfo?.songs || []" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.artist-detail-page{min-height:100%;padding:20px;background:radial-gradient(circle at top left, rgba(118,163,255,.13), transparent 24%),radial-gradient(circle at top right, rgba(255,194,210,.14), transparent 22%),linear-gradient(180deg, rgba(246,249,255,.96), rgba(252,253,255,.98))}
.artist-hero,.artist-panel{border:1px solid rgba(140,168,230,.16);background:linear-gradient(180deg, rgba(255,255,255,.97), rgba(247,250,255,.95)),#fff;box-shadow:0 18px 38px rgba(87,111,167,.1)}
.artist-hero{display:grid;grid-template-columns:260px minmax(0,1fr);gap:28px;padding:28px;border-radius:32px;align-items:center}
.artist-avatar-shell{display:flex;align-items:center;justify-content:center;aspect-ratio:1/1;padding:14px;border-radius:32px;background:linear-gradient(135deg, rgba(95,135,230,.16), rgba(235,143,168,.18));box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}
.artist-avatar{width:100%;height:100%;border-radius:28px;object-fit:cover;box-shadow:0 18px 34px rgba(82,106,160,.22)}
.artist-main{display:flex;flex-direction:column;gap:22px;min-width:0}
.artist-badge{display:inline-flex;align-items:center;gap:10px;width:max-content;padding:10px 14px;border-radius:999px;background:rgba(255,255,255,.82);border:1px solid rgba(138,166,227,.16);color:#687892;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.artist-badge-icon{font-size:18px;color:#5f79d8}
.artist-heading{display:flex;flex-direction:column;gap:12px}
.artist-title{margin:0;font-size:40px;line-height:1.15;color:#223350}
.artist-description{max-width:780px;margin:0;font-size:15px;line-height:1.9;color:#6c7c97}
.artist-meta{display:flex;flex-wrap:wrap;gap:14px}
.meta-card{min-width:170px;padding:14px 16px;border:1px solid rgba(143,171,228,.16);border-radius:18px;background:rgba(255,255,255,.78);box-shadow:0 10px 22px rgba(95,121,178,.09)}
.meta-label{display:block;font-size:12px;color:#7c89a3}
.meta-card strong{display:block;margin-top:8px;font-size:22px;color:#243653;line-height:1.5}
.artist-panel{margin-top:22px;padding:22px;border-radius:30px}
.panel-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
.panel-heading h2{margin:0;font-size:24px;font-weight:700;color:#243653}
.panel-heading p{margin:8px 0 0;font-size:14px;line-height:1.8;color:#73829d}
.songs-table-shell{overflow:hidden;border:1px solid rgba(142,170,228,.14);border-radius:24px;background:rgba(255,255,255,.76)}
@media (max-width:980px){.artist-hero{grid-template-columns:1fr}.artist-avatar-shell{max-width:320px}}
@media (max-width:768px){.artist-detail-page{padding:14px}.artist-hero,.artist-panel{padding:18px 16px;border-radius:24px}.artist-title{font-size:30px}.artist-meta{gap:12px}.meta-card{min-width:calc(50% - 6px)}}
</style>
