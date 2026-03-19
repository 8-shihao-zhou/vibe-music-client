<script setup lang="ts">
import { getStyleList } from '@/api/system'

const router = useRouter()
const loading = ref(false)

interface StyleItem {
  styleId: number
  name: string
  songCount: number
}

const styles = ref<StyleItem[]>([])

// 每个曲风的配色方案
const themes = [
  { from: '#667eea', to: '#764ba2', icon: 'ri:music-2-line' },
  { from: '#f093fb', to: '#f5576c', icon: 'ri:heart-3-line' },
  { from: '#4facfe', to: '#00f2fe', icon: 'ri:rhythm-line' },
  { from: '#43e97b', to: '#38f9d7', icon: 'ri:leaf-line' },
  { from: '#fa709a', to: '#fee140', icon: 'ri:fire-line' },
  { from: '#a18cd1', to: '#fbc2eb', icon: 'ri:star-line' },
  { from: '#ffecd2', to: '#fcb69f', icon: 'ri:sun-line' },
  { from: '#ff9a9e', to: '#fecfef', icon: 'ri:moon-line' },
  { from: '#a1c4fd', to: '#c2e9fb', icon: 'ri:cloud-line' },
  { from: '#fd7043', to: '#ff8a65', icon: 'ri:flashlight-line' },
  { from: '#26d0ce', to: '#1a2980', icon: 'ri:compass-3-line' },
  { from: '#ee9ca7', to: '#ffdde1', icon: 'ri:flower-line' },
]

const fetchStyles = async () => {
  loading.value = true
  try {
    const res = await getStyleList()
    if (res.code === 0 && res.data) {
      styles.value = res.data as StyleItem[]
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchStyles)
</script>

<template>
  <div class="genre-container h-full overflow-y-auto">
    <!-- 头部 -->
    <div class="flex items-center gap-3 mb-6 px-1">
      <div class="header-icon">
        <icon-ri:price-tag-3-line class="text-2xl text-white" />
      </div>
      <div>
        <div class="text-xl font-bold">曲风分类</div>
        <div class="text-sm opacity-50 mt-0.5">探索你喜欢的音乐风格</div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-40 opacity-50">
      <icon-ri:loader-4-line class="text-2xl animate-spin mr-2" />加载中...
    </div>

    <div v-else-if="styles.length === 0" class="flex items-center justify-center h-40 opacity-40">
      暂无曲风数据
    </div>

    <div v-else class="genre-grid">
      <div
        v-for="(style, index) in styles"
        :key="style.styleId"
        class="genre-card"
        :style="{
          background: `linear-gradient(135deg, ${themes[index % themes.length].from}, ${themes[index % themes.length].to})`
        }"
        @click="style.styleId && router.push(`/genre/${style.styleId}?name=${style.name}`)"
      >
        <!-- 背景装饰圆 -->
        <div class="deco-circle deco-1" />
        <div class="deco-circle deco-2" />

        <!-- 图标 -->
        <div class="card-icon-wrap">
          <component :is="themes[index % themes.length].icon" class="text-white text-2xl" />
        </div>

        <!-- 内容 -->
        <div class="flex-1 min-w-0">
          <div class="card-name">{{ style.name }}</div>
          <div class="card-count">
            <icon-ri:music-line class="text-xs mr-1" />
            {{ style.songCount }} 首
          </div>
        </div>

        <!-- 箭头 -->
        <icon-ri:arrow-right-s-line class="text-white/50 text-lg shrink-0" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.genre-container {
  padding: 16px;
  border-radius: 16px;
  backdrop-filter: blur(20px);
}

html.light .genre-container {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 255, 0.9) 100%);
}
html.dark .genre-container {
  background: linear-gradient(135deg, rgba(30, 30, 46, 0.6) 0%, rgba(26, 26, 46, 0.6) 100%);
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.genre-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.genre-card {
  position: relative;
  border-radius: 16px;
  padding: 18px 20px;
  cursor: pointer;
  overflow: hidden;
  height: 88px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.genre-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
}

/* 背景装饰圆 */
.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  pointer-events: none;
}
.deco-1 {
  width: 70px;
  height: 70px;
  top: -20px;
  right: 40px;
}
.deco-2 {
  width: 45px;
  height: 45px;
  bottom: -15px;
  right: 10px;
  background: rgba(255, 255, 255, 0.07);
}

.card-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon {
  position: absolute;
  top: 14px;
  right: 14px;
}

.card-content {
  margin-top: auto;
}

.card-name {
  color: white;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-count {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  margin-top: 4px;
}

.card-arrow {
  position: absolute;
  bottom: 14px;
  right: 12px;
}
</style>
