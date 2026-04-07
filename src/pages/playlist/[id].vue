<script setup lang="ts">
import { getPlaylistDetail, addPlaylistComment, likeComment, deleteComment } from '@/api/system'
import { formatNumber } from '@/utils'
import type { PlaylistDetail, Song } from '@/api/interface'
import coverImg from '@/assets/cover.png'
import { usePlaylistStore } from '@/stores/modules/playlist'
import { useFavoriteStore } from '@/stores/modules/favorite'
import { ElMessage } from 'element-plus'
import { UserStore } from '@/stores/modules/user'
import ReportDialog from '@/components/ReportDialog.vue'

const route = useRoute()
const audui = AudioStore()
const playlistStore = usePlaylistStore()
const favoriteStore = useFavoriteStore()
const userStore = UserStore()
const isPlaylistDetailRoute = computed(() => /^\/playlist\/[^/]+$/.test(route.path))
const playlist = computed(() => playlistStore.playlist)
const songs = computed(() => playlistStore.songs)
const { loadTrack, play } = useAudioPlayer()

// 当前激活的详情页签
const activeTab = ref('songs')

// 判断当前歌单是否已收藏
const isCollected = computed(() => {
  const playlistId = Number(route.params.id)
  return favoriteStore.favoritePlaylists.some(item => item.id === playlistId)
})

// 进入歌单详情前先同步收藏列表，避免收藏状态显示不正确
const ensureFavoritePlaylistsLoaded = async () => {
  if (!userStore.isLoggedIn || favoriteStore.loading || favoriteStore.loaded) {
    return
  }
  await favoriteStore.getFavoritePlaylists()
}

// 收藏或取消收藏歌单
const toggleCollect = async () => {
  try {
    const playlistId = Number(route.params.id)
    if (isCollected.value) {
      await favoriteStore.cancelCollectPlaylist(playlistId)
    } else {
      await favoriteStore.collectPlaylist(playlistId)
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

interface PlaylistComment {
  commentId: number
  username: string
  userAvatar: string
  content: string
  createTime: string
  likeCount: number
}

// 评论输入内容
const commentContent = ref('')
const maxLength = 180
const showReportDialog = ref(false)
const reportTargetId = ref(0)
const comments = computed(() => {
  const rawComments = (playlistStore.playlist?.comments || []) as PlaylistComment[]
  return rawComments
    .map(comment => ({
      ...comment,
      likeCount: comment.likeCount
    }))
    .sort((a, b) => b.commentId - a.commentId)
})

// 当前登录用户名，用于显示删除按钮
const currentUsername = computed(() => userStore.userInfo?.username || '')

// 打开评论举报弹窗
const openReportDialog = (commentId: number) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  reportTargetId.value = commentId
  showReportDialog.value = true
}

// 举报成功反馈
const handleReportSuccess = () => {
  ElMessage.success('举报已提交，感谢你的反馈')
}

// 发布评论
const handleComment = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  try {
    const playlistId = Number(route.params.id)
    const content = commentContent.value.trim()

    const res = await addPlaylistComment({
      playlistId,
      content
    })

    if (res.code === 0) {
      ElMessage.success('评论发布成功')
      commentContent.value = ''

      const detailRes = await getPlaylistDetail(playlistId)
      if (detailRes.code === 0 && detailRes.data) {
        const playlistData = detailRes.data as PlaylistDetail
        playlistStore.setPlaylistInfo({
          ...playlistStore.playlist!,
          comments: playlistData.comments || []
        })
      }
    } else {
      ElMessage.error('评论发布失败')
    }
  } catch (error) {
    ElMessage.error('评论发布失败')
  }
}

// 点赞评论
const handleLike = async (comment: PlaylistComment) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    const res = await likeComment(comment.commentId)
    if (res.code === 0) {
      const updatedComments = comments.value.map(item => {
        if (item.commentId === comment.commentId) {
          return {
            ...item,
            likeCount: item.likeCount + 1
          }
        }
        return item
      })

      playlistStore.setPlaylistInfo({
        ...playlistStore.playlist!,
        comments: updatedComments
      })

      ElMessage.success('点赞成功')
    }
  } catch (error) {
    ElMessage.error('点赞失败')
  }
}

// 删除评论
const handleDelete = async (comment: PlaylistComment) => {
  try {
    const res = await deleteComment(comment.commentId)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      const playlistId = Number(route.params.id)
      const detailRes = await getPlaylistDetail(playlistId)
      if (detailRes.code === 0 && detailRes.data) {
        const playlistData = detailRes.data as PlaylistDetail
        playlistStore.setPlaylistInfo({
          ...playlistStore.playlist!,
          comments: playlistData.comments || []
        })
      }
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

watch(
  () => [route.path, route.params.id],
  async ([currentPath, currentId]) => {
    if (!isPlaylistDetailRoute.value || !currentPath || !currentId) return

    await ensureFavoritePlaylistsLoaded()
    playlistStore.setPlaylistInfo(null)
    playlistStore.setSongs([])

    const numericId = Number(currentId)
    if (Number.isNaN(numericId) || numericId <= 0) return

    const res = await getPlaylistDetail(numericId)
    if (res.code === 0 && res.data && typeof res.data === 'object' && 'songs' in res.data) {
      const playlistData = res.data as PlaylistDetail

      // 转成播放器与表格共用的歌曲结构
      const convertedSongs: Song[] = playlistData.songs.map(song => ({
        songId: song.songId,
        songName: song.songName,
        artistName: song.artistName,
        album: song.album,
        duration: song.duration,
        coverUrl: song.coverUrl || coverImg,
        audioUrl: song.audioUrl,
        likeStatus: song.likeStatus,
        releaseTime: song.releaseTime
      }))

      playlistStore.setSongs(convertedSongs)
      playlistStore.setPlaylistInfo({
        name: playlistData.title,
        description: playlistData.introduction,
        coverImgUrl: playlistData.coverUrl || coverImg,
        creator: {
          nickname: 'AI Music',
          avatarUrl: coverImg
        },
        trackCount: playlistData.songs.length,
        tracks: convertedSongs,
        commentCount: playlistData.comments?.length || 0,
        tags: [],
        comments: playlistData.comments || []
      })
    }
  },
  { immediate: true }
)

watch(
  () => userStore.isLoggedIn,
  async (loggedIn) => {
    if (loggedIn) {
      await ensureFavoritePlaylistsLoaded()
    } else {
      favoriteStore.clearFavoritePlaylists()
    }
  },
  { immediate: true }
)

// 播放整张歌单
const handlePlayAll = async () => {
  audui.setAudioStore('trackList', [])

  if (!songs.value.length) return

  const result = songs.value.map(song => ({
    id: song.songId.toString(),
    title: song.songName,
    artist: song.artistName,
    album: song.album,
    cover: song.coverUrl || coverImg,
    url: song.audioUrl,
    duration: parseFloat(song.duration) * 1000,
    likeStatus: song.likeStatus
  }))

  audui.setAudioStore('trackList', result)
  audui.setAudioStore('currentSongIndex', 0)
  await loadTrack()
  play()
}
</script>

<template>
  <div class="playlist-detail-page">
    <section class="playlist-detail-hero">
      <div class="cover-shell">
        <img
          :alt="playlist?.name"
          class="cover-image"
          :src="(playlist?.coverImgUrl || coverImg) + '?param=500y500'"
        />
      </div>

      <div class="hero-content">
        <div class="hero-badge">
          <icon-ri:album-line class="hero-badge-icon" />
          <span>精选歌单</span>
        </div>

        <div class="hero-headline">
          <h1 class="hero-title">{{ playlist?.name || '歌单详情' }}</h1>
          <p class="hero-description" :title="playlist?.description">
            {{ playlist?.description || '这张歌单暂时还没有补充简介，先去听听里面的歌曲吧。' }}
          </p>
        </div>

        <div class="hero-meta">
          <div class="meta-pill">
            <span class="meta-label">创建者</span>
            <div class="meta-user">
              <span class="meta-avatar">
                <img :alt="playlist?.creator.nickname" :src="playlist?.creator.avatarUrl" />
              </span>
              <span>{{ playlist?.creator.nickname }}</span>
            </div>
          </div>
          <div class="meta-pill">
            <span class="meta-label">歌曲数量</span>
            <strong>{{ playlist?.trackCount || 0 }}</strong>
          </div>
          <div class="meta-pill">
            <span class="meta-label">评论数量</span>
            <strong>{{ formatNumber(playlist?.commentCount ?? 0) }}</strong>
          </div>
        </div>

        <div v-if="playlist?.tags?.length" class="hero-tags">
          <span v-for="tag in playlist.tags" :key="tag" class="hero-tag">
            {{ tag }}
          </span>
        </div>

        <div class="hero-actions">
          <button @click="handlePlayAll" class="primary-action">
            <icon-solar:play-line-duotone />
            <span>播放全部</span>
          </button>
          <button
            @click="toggleCollect"
            class="secondary-action"
            :class="{ active: isCollected }"
          >
            <icon-ic:round-favorite v-if="isCollected" class="text-xl" />
            <icon-ic:round-favorite-border v-else class="text-xl" />
            <span>{{ isCollected ? '已收藏' : '收藏歌单' }}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="playlist-detail-panel">
      <div class="tabs-shell">
        <button
          v-for="tab in [
            { name: '歌曲', value: 'songs' },
            { name: '评论', value: 'comments' }
          ]"
          :key="tab.value"
          class="tab-button"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          {{ tab.name }}
        </button>
      </div>

      <div class="panel-content">
        <div v-show="activeTab === 'songs'" class="songs-pane">
          <div class="section-heading">
            <div>
              <h3>歌曲列表</h3>
              <p>按顺序浏览这张歌单中的全部内容。</p>
            </div>
          </div>
          <div class="table-shell">
            <Table :data="songs" />
          </div>
        </div>

        <div v-show="activeTab === 'comments'" class="comments-pane">
          <div class="comment-editor">
            <div class="section-heading compact">
              <div>
                <h3>评论区</h3>
                <p>留下你的感受，也可以看看大家都在聊什么。</p>
              </div>
            </div>
            <el-input
              v-model="commentContent"
              type="textarea"
              :rows="3"
              :maxlength="maxLength"
              placeholder="说点什么吧"
              resize="none"
              show-word-limit
            />
            <div class="editor-actions">
              <button
                @click="handleComment"
                :disabled="!commentContent.trim()"
                class="publish-button"
              >
                发布评论
              </button>
            </div>
          </div>

          <div class="comment-list-shell">
            <div class="section-heading compact">
              <div>
                <h3>最新评论</h3>
                <p>共 {{ formatNumber(playlist?.commentCount ?? 0) }} 条互动内容</p>
              </div>
            </div>

            <div v-if="comments.length" class="comment-list">
              <article
                v-for="comment in comments"
                :key="comment.commentId"
                class="comment-card"
              >
                <div class="comment-avatar">
                  <img :src="comment.userAvatar || coverImg" alt="avatar" class="w-full h-full object-cover" />
                </div>
                <div class="comment-main">
                  <div class="comment-top">
                    <span class="comment-author">{{ comment.username }}</span>
                    <span class="comment-time">{{ comment.createTime }}</span>
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                  <div class="comment-actions">
                    <button
                      v-if="comment.username === currentUsername"
                      class="comment-action danger"
                      @click="handleDelete(comment)"
                    >
                      <icon-material-symbols:delete-outline />
                      <span>删除</span>
                    </button>
                    <button
                      v-if="comment.username !== currentUsername"
                      class="comment-action"
                      @click="openReportDialog(comment.commentId)"
                    >
                      <icon-material-symbols:flag-outline-rounded />
                      <span>举报</span>
                    </button>
                    <button
                      class="comment-action"
                      @click="handleLike(comment)"
                    >
                      <icon-material-symbols:thumb-up />
                      <span>点赞 {{ formatNumber(comment.likeCount) }}</span>
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <div v-else class="comment-empty">
              <div class="comment-empty-icon">
                <icon-solar:chat-round-dots-outline />
              </div>
              <p>还没有评论，来留下第一条互动吧。</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <ReportDialog
      v-model:visible="showReportDialog"
      :target-type="2"
      :target-id="reportTargetId"
      @success="handleReportSuccess"
    />
  </div>
</template>

<style scoped>
.playlist-detail-page{display:flex;flex:1;flex-direction:column;min-height:100%;padding:20px;background:radial-gradient(circle at top left, rgba(118,163,255,.14), transparent 24%),radial-gradient(circle at top right, rgba(255,194,210,.16), transparent 24%),linear-gradient(180deg, rgba(246,249,255,.96), rgba(252,253,255,.98))}
.playlist-detail-hero,.playlist-detail-panel{border:1px solid rgba(140,168,230,.16);background:linear-gradient(180deg, rgba(255,255,255,.97), rgba(247,250,255,.95)),#fff;box-shadow:0 18px 38px rgba(87,111,167,.1)}
.playlist-detail-hero{display:grid;grid-template-columns:280px minmax(0,1fr);gap:28px;padding:28px;border-radius:32px}
.cover-shell{position:relative;aspect-ratio:1/1;padding:12px;border-radius:30px;background:linear-gradient(135deg, rgba(95,135,230,.16), rgba(235,143,168,.18));box-shadow:inset 0 1px 0 rgba(255,255,255,.78)}
.cover-image{width:100%;height:100%;object-fit:cover;border-radius:24px;box-shadow:0 18px 34px rgba(82,106,160,.22)}
.hero-content{display:flex;flex-direction:column;justify-content:space-between;gap:22px;min-width:0}
.hero-badge{display:inline-flex;align-items:center;gap:10px;width:max-content;padding:10px 14px;border-radius:999px;background:rgba(255,255,255,.82);border:1px solid rgba(138,166,227,.16);color:#687892;font-size:13px;font-weight:700;letter-spacing:.08em}
.hero-badge-icon{font-size:18px;color:#5f79d8}
.hero-headline{display:flex;flex-direction:column;gap:12px}
.hero-title{margin:0;font-size:40px;line-height:1.15;color:#223350}
.hero-description{max-width:760px;margin:0;font-size:15px;line-height:1.9;color:#6c7c97}
.hero-meta{display:flex;flex-wrap:wrap;gap:14px}
.meta-pill{min-width:150px;padding:14px 16px;border:1px solid rgba(143,171,228,.16);border-radius:18px;background:rgba(255,255,255,.78);box-shadow:0 10px 22px rgba(95,121,178,.09)}
.meta-label{display:block;font-size:12px;color:#7c89a3}
.meta-pill strong{display:block;margin-top:8px;font-size:24px;color:#243653}
.meta-user{display:flex;align-items:center;gap:10px;margin-top:8px;color:#243653;font-weight:600}
.meta-avatar{display:inline-flex;width:30px;height:30px;overflow:hidden;border-radius:999px;border:2px solid rgba(255,255,255,.88);box-shadow:0 8px 16px rgba(95,121,178,.12)}
.meta-avatar img{width:100%;height:100%;object-fit:cover}
.hero-tags{display:flex;flex-wrap:wrap;gap:10px}
.hero-tag{display:inline-flex;align-items:center;min-height:34px;padding:0 14px;border-radius:999px;background:rgba(96,122,214,.1);color:#5872d3;font-size:13px;font-weight:600}
.hero-actions{display:flex;flex-wrap:wrap;gap:14px}
.primary-action,.secondary-action{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 20px;border-radius:16px;font-size:14px;font-weight:700;transition:all .25s ease}
.primary-action{background:linear-gradient(135deg,#5f87e6 0%,#7d7fe8 58%,#eb8fa8 100%);color:#fff;box-shadow:0 14px 26px rgba(103,126,214,.24)}
.primary-action:hover{transform:translateY(-1px);box-shadow:0 18px 30px rgba(103,126,214,.28)}
.secondary-action{border:1px solid rgba(143,168,215,.2);background:rgba(255,255,255,.92);color:#536480;box-shadow:0 10px 20px rgba(108,131,177,.08)}
.secondary-action.active{border-color:rgba(237,111,144,.18);background:rgba(255,240,244,.9);color:#df5f81}
.playlist-detail-panel{display:flex;flex:1;flex-direction:column;margin-top:22px;padding:22px;border-radius:30px;min-height:0}
.tabs-shell{display:inline-flex;gap:10px;width:max-content;padding:8px;border:1px solid rgba(145,172,228,.12);border-radius:18px;background:rgba(243,247,255,.82)}
.tab-button{min-height:40px;padding:0 18px;border-radius:12px;color:#5c6d88;font-size:14px;font-weight:700;transition:all .25s ease}
.tab-button:hover{background:rgba(102,126,234,.1)}
.tab-button.active{background:linear-gradient(135deg,#5f87e6 0%,#7d7fe8 58%,#eb8fa8 100%);color:#fff;box-shadow:0 10px 20px rgba(103,126,214,.2)}
.panel-content{flex:1;min-height:0;margin-top:18px}
.songs-pane,.comments-pane{height:100%}
.section-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}
.section-heading.compact{margin-bottom:14px}
.section-heading h3{margin:0;font-size:22px;font-weight:700;color:#243653}
.section-heading p{margin:8px 0 0;font-size:14px;line-height:1.8;color:#73829d}
.table-shell{overflow:hidden;border:1px solid rgba(142,170,228,.14);border-radius:24px;background:rgba(255,255,255,.74)}
.comment-editor,.comment-list-shell{border:1px solid rgba(142,170,228,.14);border-radius:24px;background:rgba(255,255,255,.8);box-shadow:0 14px 28px rgba(91,116,172,.08)}
.comment-editor{padding:20px}
.editor-actions{display:flex;justify-content:flex-end;margin-top:14px}
.publish-button{display:inline-flex;align-items:center;justify-content:center;min-width:116px;min-height:42px;padding:0 20px;border-radius:999px;background:linear-gradient(135deg,#5f87e6 0%,#7d7fe8 58%,#eb8fa8 100%);color:#fff;font-size:14px;font-weight:700;transition:all .25s ease}
.publish-button:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}
.comment-list-shell{margin-top:18px;padding:20px}
.comment-list{display:flex;flex-direction:column;gap:16px}
.comment-card{display:flex;gap:14px;padding:18px;border:1px solid rgba(143,168,215,.16);border-radius:20px;background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(247,250,255,.95))}
.comment-avatar{width:46px;height:46px;overflow:hidden;border-radius:999px;flex-shrink:0;box-shadow:0 10px 20px rgba(108,131,177,.14)}
.comment-main{display:flex;flex:1;flex-direction:column;min-width:0}
.comment-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.comment-author{font-size:14px;font-weight:700;color:#4f70d2}
.comment-time{font-size:12px;color:#8a97ac}
.comment-text{margin:10px 0 0;font-size:14px;line-height:1.8;color:#32435f;word-break:break-word}
.comment-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:14px}
.comment-action{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:0 12px;border-radius:999px;background:rgba(243,247,255,.92);color:#60718d;font-size:13px;font-weight:600;transition:all .25s ease}
.comment-action:hover{background:rgba(96,122,214,.12);color:#5670cf}
.comment-action.danger:hover{background:rgba(255,111,145,.12);color:#dc5f83}
.comment-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:40px 20px;color:#7a88a1;text-align:center}
.comment-empty-icon{display:flex;align-items:center;justify-content:center;width:68px;height:68px;border-radius:22px;background:linear-gradient(135deg,rgba(95,135,230,.14),rgba(235,143,168,.16));color:#5f79d8;font-size:30px}
:deep(.el-input__wrapper){border-radius:16px;box-shadow:0 0 0 1px rgba(143,167,213,.18),0 10px 20px rgba(108,131,177,.08)}
:deep(.el-textarea__inner){border-radius:16px !important;min-height:112px;padding:14px 16px;background:rgba(255,255,255,.96);color:#30415d;line-height:1.8}
@media (max-width:980px){.playlist-detail-hero{grid-template-columns:1fr}.cover-shell{max-width:320px}}
@media (max-width:768px){.playlist-detail-page{padding:14px}.playlist-detail-hero,.playlist-detail-panel{padding:18px 16px;border-radius:24px}.hero-title{font-size:30px}.hero-actions{flex-direction:column;align-items:stretch}.primary-action,.secondary-action{width:100%}.tabs-shell{width:100%;overflow-x:auto}.comment-card{padding:16px}.comment-top{flex-direction:column;align-items:flex-start}.comment-actions{justify-content:flex-start;flex-wrap:wrap}}
</style>
