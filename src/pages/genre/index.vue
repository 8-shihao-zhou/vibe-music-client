<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getStyleList } from '@/api/system'

const router = useRouter()
const loading = ref(false)

interface StyleItem {
  styleId: number
  name: string
  songCount: number
}

const styles = ref<StyleItem[]>([])

// 为曲风卡片准备不同的渐变和图标，让页面更有音乐主题感
const themes = [
  { from: '#4c6ef5', to: '#7c4dff', icon: 'ri:disc-line', badge: '灵感流动' },
  { from: '#ff7a59', to: '#ffb347', icon: 'ri:fire-line', badge: '热度升温' },
  { from: '#08bdbd', to: '#3a86ff', icon: 'ri:rhythm-line', badge: '律动节拍' },
  { from: '#43aa8b', to: '#90be6d', icon: 'ri:leaf-line', badge: '轻松氛围' },
  { from: '#f15bb5', to: '#9b5de5', icon: 'ri:magic-line', badge: '夜色声场' },
  { from: '#577590', to: '#277da1', icon: 'ri:compass-3-line', badge: '探索更多' },
  { from: '#f28482', to: '#f6bd60', icon: 'ri:sparkling-2-line', badge: '情绪上升' },
  { from: '#118ab2', to: '#06d6a0', icon: 'ri:headphone-line', badge: '沉浸聆听' },
  { from: '#7b2cbf', to: '#c77dff', icon: 'ri:star-smile-line', badge: '风格精选' },
]

const totalSongCount = computed(() =>
  styles.value.reduce((sum, item) => sum + Number(item.songCount || 0), 0),
)

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

const goToDetail = (style: StyleItem) => {
  if (!style.styleId) return
  router.push(`/genre/${style.styleId}?name=${encodeURIComponent(style.name)}`)
}

onMounted(fetchStyles)
</script>

<template>
  <div class="genre-page">
    <section class="genre-hero">
      <div class="genre-hero-copy">
        <p class="genre-hero-kicker">Music Palette</p>
        <h1>曲风分类</h1>
        <p class="genre-hero-desc">
          用更轻松的方式找到你当下想听的风格，从热烈、治愈到律动感，都可以直接进入。
        </p>
      </div>

      <div class="genre-hero-stats">
        <div class="genre-stat-card">
          <span class="genre-stat-label">已收录曲风</span>
          <strong>{{ styles.length }}</strong>
        </div>
        <div class="genre-stat-card">
          <span class="genre-stat-label">覆盖歌曲</span>
          <strong>{{ totalSongCount }}</strong>
        </div>
      </div>

      <div class="genre-hero-glow genre-hero-glow-a" />
      <div class="genre-hero-glow genre-hero-glow-b" />
    </section>

    <section class="genre-content">
      <div class="genre-toolbar">
        <div>
          <p class="genre-section-kicker">Style Library</p>
          <h2>按风格探索音乐</h2>
        </div>
        <span class="genre-toolbar-tip">点击任意曲风即可查看对应歌曲</span>
      </div>

      <div v-if="loading" class="genre-state">
        <icon-ri:loader-4-line class="text-2xl animate-spin" />
        <span>正在加载曲风列表...</span>
      </div>

      <div v-else-if="styles.length === 0" class="genre-state is-empty">
        <icon-ri:survey-line class="text-2xl" />
        <span>暂时还没有可展示的曲风数据</span>
      </div>

      <div v-else class="genre-grid">
        <button
          v-for="(style, index) in styles"
          :key="style.styleId"
          class="genre-card"
          :style="{
            '--genre-from': themes[index % themes.length].from,
            '--genre-to': themes[index % themes.length].to,
          }"
          @click="goToDetail(style)"
        >
          <div class="genre-card-top">
            <span class="genre-card-badge">{{ themes[index % themes.length].badge }}</span>
            <component :is="themes[index % themes.length].icon" class="genre-card-icon" />
          </div>

          <div class="genre-card-main">
            <div class="genre-card-name">{{ style.name }}</div>
            <div class="genre-card-meta">
              <span>{{ style.songCount }} 首歌曲</span>
              <span>立即进入</span>
            </div>
          </div>

          <div class="genre-card-orb genre-card-orb-a" />
          <div class="genre-card-orb genre-card-orb-b" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.genre-page {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.genre-hero {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  padding: 28px 28px 24px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  min-height: 220px;
}

html.light .genre-hero {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0) 36%),
    linear-gradient(135deg, rgba(83, 107, 255, 0.96) 0%, rgba(123, 77, 255, 0.9) 52%, rgba(13, 148, 136, 0.88) 100%);
  box-shadow: 0 24px 60px rgba(74, 86, 163, 0.16);
}

html.dark .genre-hero {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 36%),
    linear-gradient(135deg, rgba(63, 77, 173, 0.96) 0%, rgba(98, 64, 182, 0.94) 52%, rgba(9, 98, 109, 0.92) 100%);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.genre-hero-copy,
.genre-hero-stats {
  position: relative;
  z-index: 1;
}

.genre-hero-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.76);
}

.genre-hero h1 {
  margin: 0;
  font-size: clamp(28px, 4vw, 38px);
  line-height: 1.08;
  color: #fff;
}

.genre-hero-desc {
  margin: 14px 0 0;
  max-width: 560px;
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.82);
}

.genre-hero-stats {
  display: flex;
  gap: 12px;
}

.genre-stat-card {
  min-width: 128px;
  padding: 16px 18px;
  border-radius: 20px;
  backdrop-filter: blur(18px);
}

html.light .genre-stat-card {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

html.dark .genre-stat-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.genre-stat-label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.genre-stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  line-height: 1;
  color: #fff;
}

.genre-hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(8px);
}

.genre-hero-glow-a {
  right: 64px;
  top: -28px;
  width: 180px;
  height: 180px;
  background: rgba(255, 255, 255, 0.12);
}

.genre-hero-glow-b {
  right: -24px;
  bottom: -42px;
  width: 220px;
  height: 220px;
  background: rgba(255, 255, 255, 0.08);
}

.genre-content {
  margin-top: 18px;
  border-radius: 28px;
  padding: 22px;
}

html.light .genre-content {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(125, 140, 220, 0.12);
  box-shadow: 0 16px 42px rgba(88, 101, 168, 0.08);
}

html.dark .genre-content {
  background: rgba(28, 34, 54, 0.72);
  border: 1px solid rgba(125, 140, 220, 0.1);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
}

.genre-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.genre-section-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6b7adc;
  font-weight: 700;
}

.genre-toolbar h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  color: #27324e;
}

.genre-toolbar-tip {
  font-size: 13px;
  color: #8190b3;
}

.genre-state {
  min-height: 220px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #8190b3;
}

html.light .genre-state {
  background: rgba(245, 247, 255, 0.82);
}

html.dark .genre-state {
  background: rgba(34, 40, 63, 0.82);
  color: #a8b5d8;
}

.genre-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.genre-card {
  position: relative;
  overflow: hidden;
  min-height: 168px;
  border: 0;
  border-radius: 24px;
  padding: 18px 18px 16px;
  background: linear-gradient(135deg, var(--genre-from), var(--genre-to));
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease;
  box-shadow: 0 16px 32px rgba(55, 64, 120, 0.18);
}

.genre-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 42px rgba(55, 64, 120, 0.24);
}

.genre-card-top,
.genre-card-main {
  position: relative;
  z-index: 1;
}

.genre-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.genre-card-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.genre-card-icon {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.92);
}

.genre-card-main {
  margin-top: 38px;
}

.genre-card-name {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  line-height: 1.18;
}

.genre-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
}

.genre-card-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.genre-card-orb-a {
  width: 120px;
  height: 120px;
  right: -18px;
  top: -28px;
  background: rgba(255, 255, 255, 0.12);
}

.genre-card-orb-b {
  width: 72px;
  height: 72px;
  right: 18px;
  bottom: -18px;
  background: rgba(255, 255, 255, 0.08);
}

html.dark .genre-toolbar h2 {
  color: #eef2ff;
}

html.dark .genre-toolbar-tip {
  color: #a8b5d8;
}

@media (max-width: 1100px) {
  .genre-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .genre-page {
    padding: 14px;
  }

  .genre-hero {
    flex-direction: column;
    align-items: flex-start;
    min-height: auto;
    padding: 24px 20px 20px;
  }

  .genre-hero-stats {
    width: 100%;
  }

  .genre-stat-card {
    flex: 1;
    min-width: 0;
  }

  .genre-content {
    padding: 18px;
  }

  .genre-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .genre-grid {
    grid-template-columns: 1fr;
  }

  .genre-card {
    min-height: 148px;
  }
}
</style>
