import { defineStore } from 'pinia'
import piniaPersistConfig from '@/stores/helper/persist'
import { trackListData } from '@/mock'
import { AudioState, trackModel } from '@/stores/interface'
import { Song } from '@/api/interface'
import { normalizeMediaUrl } from '@/utils/media'
/**
 * 音频
 */
export const AudioStore = defineStore({
  id: 'AudioStore',
  state: (): AudioState => ({
    // 歌曲缓存
    trackList: trackListData,
    // 当前播放歌曲索引
    currentSongIndex: 0,
    // 音量
    volume: 50,
    // 音质
    quality: 'exhigh',
    currentPageSongs: [], // 当前页面的歌曲列表
  }),
  actions: {
    //set AudioStore
    setAudioStore<T extends keyof AudioState>(key: T, value: AudioState[T]) {
      this[key] = value
    },
    // 新增歌曲或歌曲数组到 trackList
    addTracks(newTracks: trackModel | trackModel[]) {
      // 收集现有歌曲的ID
      const existingIds = new Set(
        this.trackList.map((track: { id: any }) => track.id)
      )
      // 将参数归一化为数组
      const tracksToAdd = Array.isArray(newTracks) ? newTracks : [newTracks]
      for (const track of tracksToAdd) {
        if (existingIds.has(track.id)) {
          const existingIndex = this.trackList.findIndex(
            (existingTrack: { id: string }) => existingTrack.id === track.id
          )
          if (existingIndex !== -1) {
            // 已存在同一歌曲时，使用最新数据覆盖，避免本地持久化的旧封面长期不刷新
            this.trackList[existingIndex] = {
              ...this.trackList[existingIndex],
              ...track,
              cover: normalizeMediaUrl(track.cover) || track.cover,
            }
          }
          this.currentSongIndex = existingIndex
          break
        } else {
          this.trackList.push({
            ...track,
            cover: normalizeMediaUrl(track.cover) || track.cover,
          })
          this.currentSongIndex = this.trackList.length - 1
        }
      }
    },
    // 删除指定歌曲
    deleteTrack(id: number | string) {
      this.trackList = this.trackList.filter(
        (track: { id: string | number }) => track.id !== id
      )
    },
    // 设置当前页面的歌曲列表
    setCurrentPageSongs(songs: Song[]) {
      this.currentPageSongs = songs
      if (!songs?.length || !this.trackList.length) return

      // 页面重新取到最新歌曲数据后，同步修正播放队列中的封面与基础信息
      this.trackList = this.trackList.map((track) => {
        const matchedSong = songs.find(song => String(song.songId) === String(track.id))
        if (!matchedSong) {
          return track
        }

        return {
          ...track,
          title: matchedSong.songName,
          artist: matchedSong.artistName,
          album: matchedSong.album,
          url: matchedSong.audioUrl || track.url,
          duration: Number(matchedSong.duration) || track.duration,
          cover: normalizeMediaUrl(matchedSong.coverUrl) || track.cover,
        }
      })
    }
  },
  persist: piniaPersistConfig('AudioStore'),
})
