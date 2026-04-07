import type { Router } from 'vue-router'
import { ElMessage } from 'element-plus'
import defaultAlbum from '@/assets/default_album.jpg'
import { getSongDetail } from '@/api/system'
import type { AgentAction } from '@/api/agent'
import type { trackModel } from '@/stores/interface'
import { AudioStore } from '@/stores/modules/audio'

type AgentExecutorOptions = {
  router: Router
  audioStore: ReturnType<typeof AudioStore>
  loadTrack: () => Promise<void>
  play: () => void
}

export type AgentActionFeedback = {
  status: 'success' | 'error'
  message: string
}

/**
 * 将歌曲详情转换成播放器内部使用的 trackModel
 */
const convertSongDetailToTrack = (song: any): trackModel | null => {
  if (!song?.songId || !song?.songName || !song?.audioUrl) {
    return null
  }

  return {
    id: String(song.songId),
    title: song.songName,
    artist: song.artistName || '未知歌手',
    album: song.album || '',
    cover: song.coverUrl || defaultAlbum,
    url: song.audioUrl,
    duration: Number(song.duration) || 0,
    likeStatus: song.likeStatus || 0,
  }
}

/**
 * 根据搜索类型解析实际要跳转的目标页面。
 *
 * 规则：
 * 1. 歌曲搜索统一走全站综合搜索页 `/search`
 * 2. 歌手、歌单、社区搜索走各自页面，让页面内搜索框接管
 */
const resolveSearchTarget = (payload: Record<string, any>) => {
  const searchType = String(payload.searchType || '').trim()

  if (searchType === 'artist') {
    return {
      path: '/artist',
      pageName: payload.pageName || '歌手页',
    }
  }

  if (searchType === 'playlist') {
    return {
      path: '/playlist',
      pageName: payload.pageName || '歌单页',
    }
  }

  if (searchType === 'community') {
    return {
      path: '/community',
      pageName: payload.pageName || '社区页',
    }
  }

  return {
    path: '/search',
    pageName: payload.pageName || '全站综合搜索',
  }
}

/**
 * 生成动作执行前的提示文案
 */
export const getAgentActionPendingMessages = (actions: AgentAction[] = []) => {
  return actions
    .map(action => {
      const payload = action.payload || {}

      if (action.type === 'navigate_to') {
        return `正在为你打开${payload.pageName || '目标页面'}...`
      }

      if (action.type === 'play_song') {
        if (payload.songName && payload.artistName) {
          return `正在为你准备播放《${payload.songName}》 - ${payload.artistName}...`
        }
        if (payload.songName) {
          return `正在为你准备播放《${payload.songName}》...`
        }
        return '正在为你准备播放歌曲...'
      }

      if (action.type === 'search_site') {
        const target = resolveSearchTarget(payload)
        return `正在为你搜索${payload.keyword || '相关内容'}，并打开${target.pageName}...`
      }

      return ''
    })
    .filter(Boolean)
}

/**
 * 执行 Agent 返回的前端动作，并把结果反馈给聊天面板
 */
export const executeAgentActions = async (
  actions: AgentAction[] = [],
  options: AgentExecutorOptions
): Promise<AgentActionFeedback[]> => {
  const feedbacks: AgentActionFeedback[] = []

  for (const action of actions) {
    const payload = action.payload || {}

    // 页面跳转动作
    if (action.type === 'navigate_to' && payload.path) {
      try {
        if (options.router.currentRoute.value.path !== payload.path) {
          await options.router.push(payload.path)
        }

        feedbacks.push({
          status: 'success',
          message: `已为你打开${payload.pageName || '目标页面'}。`,
        })
      } catch (error: any) {
        feedbacks.push({
          status: 'error',
          message: error?.message || '页面打开失败，请稍后再试。',
        })
      }
      continue
    }

    // 播放歌曲动作
    if (action.type === 'play_song') {
      const songId = Number(payload.songId)

      if (!songId) {
        const message = '智能助手返回了播放指令，但缺少歌曲 ID。'
        ElMessage.warning(message)
        feedbacks.push({
          status: 'error',
          message,
        })
        continue
      }

      try {
        const detailRes: any = await getSongDetail(songId)
        if (detailRes.code !== 0 || !detailRes.data) {
          const message =
            detailRes.message || '获取歌曲详情失败，暂时无法播放。'
          ElMessage.error(message)
          feedbacks.push({
            status: 'error',
            message,
          })
          continue
        }

        const track = convertSongDetailToTrack(detailRes.data)
        if (!track) {
          const message = '歌曲数据不完整，暂时无法播放。'
          ElMessage.error(message)
          feedbacks.push({
            status: 'error',
            message,
          })
          continue
        }

        // 如果播放列表中已经存在这首歌，则直接切换索引
        const existingIndex = options.audioStore.trackList.findIndex(
          item => Number(item.id) === songId
        )

        if (existingIndex >= 0) {
          options.audioStore.setAudioStore('currentSongIndex', existingIndex)
        } else {
          options.audioStore.addTracks(track)
        }

        await options.loadTrack()
        options.play()

        feedbacks.push({
          status: 'success',
          message: `已开始播放《${track.title}》 - ${track.artist}。`,
        })
      } catch (error: any) {
        feedbacks.push({
          status: 'error',
          message: error?.message || '播放歌曲时出现异常，请稍后再试。',
        })
      }
      continue
    }

    // 站内搜索动作
    if (action.type === 'search_site') {
      try {
        const keyword = String(payload.keyword || '').trim()
        const target = resolveSearchTarget(payload)

        await options.router.push({
          path: target.path,
          query: keyword ? { query: keyword } : {},
        })

        feedbacks.push({
          status: 'success',
          message: `已为你搜索${keyword || '相关内容'}，并打开${target.pageName}。`,
        })
      } catch (error: any) {
        feedbacks.push({
          status: 'error',
          message: error?.message || '站内搜索跳转失败，请稍后再试。',
        })
      }
      continue
    }
  }

  return feedbacks
}
