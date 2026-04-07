import { defineStore } from 'pinia'
import {
  getFavoritePlaylists,
  collectPlaylist,
  cancelCollectPlaylist,
} from '@/api/system'
import type { ResultTable } from '@/api/system'
import { ElMessage } from 'element-plus'
import coverImg from '@/assets/cover.png'

interface FavoritePlaylist {
  id: number
  name: string
  coverImgUrl: string
}

export const useFavoriteStore = defineStore('favorite', {
  state: () => ({
    favoritePlaylists: [] as FavoritePlaylist[],
    loading: false,
    loaded: false,
  }),

  actions: {
    // 获取收藏歌单列表
    async getFavoritePlaylists() {
      try {
        this.loading = true
        const res = await getFavoritePlaylists({
          pageNum: 1,
          pageSize: 50,
          title: '',
          style: '',
        })

        if (res.code === 0 && res.data) {
          const data = res.data as ResultTable['data']
          this.favoritePlaylists = (data?.items || []).map((item) => ({
            id: item.playlistId,
            name: item.title,
            coverImgUrl: item.coverUrl ?? coverImg,
          }))
        } else {
          this.favoritePlaylists = []
        }
      } catch (error) {
        this.favoritePlaylists = []
        ElMessage.error('获取收藏歌单失败')
      } finally {
        this.loading = false
        this.loaded = true
      }
    },

    // 收藏歌单
    async collectPlaylist(playlistId: number) {
      try {
        const res = await collectPlaylist(playlistId)
        if (res.code === 0) {
          ElMessage.success('收藏成功')
          await this.getFavoritePlaylists()
          return true
        }
        ElMessage.warning(res.message || '收藏失败')
        return false
      } catch (error) {
        ElMessage.error('收藏失败')
        return false
      }
    },

    // 取消收藏歌单
    async cancelCollectPlaylist(playlistId: number) {
      try {
        const res = await cancelCollectPlaylist(playlistId)
        if (res.code === 0) {
          ElMessage.success('取消收藏成功')
          this.favoritePlaylists = this.favoritePlaylists.filter(
            (item) => item.id !== playlistId
          )
          return true
        }
        ElMessage.warning(res.message || '取消收藏失败')
        return false
      } catch (error) {
        ElMessage.error('取消收藏失败')
        return false
      }
    },

    // 清空收藏列表
    clearFavoritePlaylists() {
      this.favoritePlaylists = []
      this.loaded = false
    },
  },
})
