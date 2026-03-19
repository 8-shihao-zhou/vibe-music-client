<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useFavoriteStore } from '@/stores/modules/favorite'
import { UserStore } from '@/stores/modules/user'
import coverImg from '@/assets/cover.png'

const router = useRouter()
const favoriteStore = useFavoriteStore()
const user = UserStore()
</script>

<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-6">收藏的歌单</h2>

    <div v-if="!user.isLoggedIn" class="text-center text-gray-400 py-20">
      请先登录查看收藏的歌单
    </div>

    <el-skeleton v-else-if="favoriteStore.loading" :rows="3" animated />

    <div v-else-if="favoriteStore.favoritePlaylists.length === 0" class="text-center text-gray-400 py-20">
      暂无收藏的歌单
    </div>

    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      <div
        v-for="item in favoriteStore.favoritePlaylists"
        :key="item.id"
        class="cursor-pointer group"
        @click="router.push(`/playlist/${item.id}`)"
      >
        <div class="relative overflow-hidden rounded-xl aspect-square mb-2">
          <img
            :src="item.coverImgUrl || coverImg"
            :alt="item.name"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <p class="text-sm font-medium line-clamp-2 leading-snug">{{ item.name }}</p>
      </div>
    </div>
  </div>
</template>
