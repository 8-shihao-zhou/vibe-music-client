/* eslint-disable */

<script setup lang="ts">
import { MenuData } from './data'
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { ref, watch } from 'vue'
import { UserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'
import AuthTabs from '@/components/Auth/AuthTabs.vue'
import { useFavoriteStore } from '@/stores/modules/favorite'

const route = useRoute()
const router = useRouter()
const user = UserStore()
const favoriteStore = useFavoriteStore()
const authVisible = ref(false)

// 处理需要登录的路由
const handleProtectedRoute = (path: string) => {
  if (!user.isLoggedIn && (path === '/like' || path === '/user' || path === '/favorite-playlists')) {
    ElMessage.warning('请先登录')
    authVisible.value = true
    return false
  }
  return true
}

// 监听用户登录状态
watch(
  () => user.isLoggedIn,
  (newVal) => {
    if (newVal) {
      favoriteStore.getFavoritePlaylists()
    } else {
      favoriteStore.clearFavoritePlaylists()
    }
  },
  { immediate: true }
)
</script>

<template>
  <aside
    class="w-64 hidden h-full overflow-hidden md:block border-r shadow-lg aside-gradient"
  >
    <nav
      class="flex flex-col p-4 space-y-4 flex-1 h-full box-border overflow-hidden"
    >
      <div
        v-for="(item, index) in MenuData"
        :key="index"
        class="w-full flex flex-col gap-1"
      >
        <h3 class="ml-4 text-sm font-semibold text-inactive menu-title">
          {{ item.title }}
        </h3>
        <div
          v-for="(item2, index2) in item.children"
          :key="index2"
          class="mx-2 rounded-xl transition text-lg duration-300 py-3 px-3 flex items-center gap-3 text-primary-foreground cursor-pointer menu-item"
          :class="{
            'bg-activeMenuBg menu-item-active': route.path === item2.router,
            'hover:bg-hoverMenuBg': route.path !== item2.router,
          }"
          @click="
            handleProtectedRoute(item2.router) && router.push(item2.router)
          "
        >
          <Icon :icon="item2.icon" class="menu-icon" />
          <span>{{ item2.title }}</span>
          <span
            class="!ml-auto text-xs text-primary-foreground bg-emphasis border-border p-1 rounded-lg"
          ></span>
        </div>
      </div>

      <!-- 收藏的歌单 -->
      <div class="w-full flex flex-col gap-1 flex-1 overflow-hidden" v-if="user.isLoggedIn">
        <h3 class="ml-4 text-sm font-semibold text-inactive menu-title">
          收藏的歌单（{{ favoriteStore.favoritePlaylists.length }}）
        </h3>
        <el-scrollbar class="flex-1">
          <el-skeleton
            :loading="favoriteStore.loading"
            animated
            :count="3"
            v-if="favoriteStore.loading"
          >
            <template #template>
              <div class="flex items-center space-x-2 p-2 mx-2">
                <el-skeleton-item
                  variant="image"
                  style="width: 28px; height: 28px"
                />
                <el-skeleton-item variant="text" style="width: 130px" />
              </div>
            </template>
          </el-skeleton>

          <template v-else>
            <div
              v-for="item in favoriteStore.favoritePlaylists"
              :key="item.id"
              class="mx-2 my-1 rounded-xl transition text-sm duration-300 py-2 px-2 flex items-center gap-2 text-primary-foreground cursor-pointer playlist-item"
              :class="{
                'bg-activeMenuBg': route.path === `/playlist/${item.id}`,
                'hover:bg-hoverMenuBg': route.path !== `/playlist/${item.id}`,
              }"
              @click="router.push(`/playlist/${item.id}`)"
            >
              <el-image
                lazy
                :src="item.coverImgUrl + '?param=50y50'"
                class="w-10 h-10 rounded-lg flex-shrink-0 playlist-cover"
                :alt="item.name"
              />
              <div class="flex-1 min-w-0">
                <span class="line-clamp-2 text-sm leading-normal">{{
                  item.name
                }}</span>
              </div>
            </div>
          </template>
        </el-scrollbar>
      </div>
    </nav>

    <!-- 登录对话框 -->
    <AuthTabs v-model="authVisible" />
  </aside>
</template>

<style scoped>
/* 浅色模式 */
html.light aside {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(102, 126, 234, 0.1);
}

/* 暗色模式 */
html.dark aside {
  background: rgba(30, 30, 46, 0.85);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(102, 126, 234, 0.2);
}

.menu-title {
  position: relative;
  padding-left: 12px;
}

.menu-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.menu-item {
  position: relative;
  overflow: hidden;
}

.menu-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.menu-item-active::before {
  transform: scaleY(1);
}

.menu-item:hover {
  transform: translateX(4px);
}

.menu-icon {
  transition: all 0.3s ease;
}

.menu-item:hover .menu-icon {
  transform: scale(1.2);
}

.menu-item-active {
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

html.light .menu-item-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
}

html.dark .menu-item-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%);
}

.playlist-item {
  transition: all 0.3s ease;
}

.playlist-item:hover {
  transform: translateX(4px);
}

html.light .playlist-item:hover {
  background: rgba(102, 126, 234, 0.08);
}

html.dark .playlist-item:hover {
  background: rgba(102, 126, 234, 0.15);
}

.playlist-cover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.playlist-item:hover .playlist-cover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}
</style>
