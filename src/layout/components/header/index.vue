<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useDark, useToggle } from '@vueuse/core'
import Avatar from './components/avatar.vue'

const route = useRoute()
const router = useRouter()
const currentIcon = ref('material-symbols:wb-sunny-outline-rounded')
const theme = themeStore()
const searchText = ref('')

const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
})
const toggleDark = useToggle(isDark)

const toggleMode = () => {
  theme.setDark(!isDark.value)
  toggleDark()
}

watch(
  () => theme.isDark,
  newValue => {
    currentIcon.value = newValue
      ? 'mdi:weather-night'
      : 'material-symbols:wb-sunny-outline-rounded'
  },
  { immediate: true }
)

watch(
  () => route.query,
  newValue => {
    if (route.path === '/search' && newValue.query) {
      searchText.value = newValue.query as string
      return
    }

    // 只有音乐库页的全局搜索才和顶部搜索框联动，其他页面保持独立
    if (route.path !== '/search') {
      searchText.value = ''
    }
  },
  { immediate: true }
)
</script>

<template>
  <header class="client-header">
    <div class="brand-block">
      <div class="brand-mark">
        <img src="/logo.svg" alt="logo" class="brand-logo" />
      </div>
      <div class="brand-copy">
        <span class="brand-title">AI Music</span>
        <span class="brand-subtitle">Discover · Create · Enjoy</span>
      </div>
    </div>

    <div class="header-center">
      <div class="search-shell">
        <Icon icon="mdi:magnify" class="search-icon" />
        <input
          v-model="searchText"
          type="text"
          class="search-input"
          placeholder="搜索歌曲、歌单或内容"
          @keyup.enter="router.push('/search?query=' + encodeURIComponent(searchText))"
        />
      </div>
    </div>

    <div class="header-actions">
      <button class="theme-toggle" @click="toggleMode">
        <Icon class="text-xl" :icon="currentIcon" />
      </button>
      <Avatar />
    </div>
  </header>
</template>

<style scoped>
.client-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 20px;
  position: relative;
  z-index: 100;
}

html.light .client-header {
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(120, 139, 255, 0.12);
  box-shadow: 0 10px 30px rgba(94, 111, 180, 0.08);
}

html.dark .client-header {
  background: rgba(28, 34, 54, 0.84);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(120, 139, 255, 0.18);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);
}

.brand-block {
  display: flex;
  align-items: center;
  min-width: 220px;
  gap: 14px;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(110, 125, 255, 0.18) 0%, rgba(148, 131, 255, 0.24) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.brand-logo {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-title {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
  background: linear-gradient(135deg, #5166ef 0%, #8a63f8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #8190b3;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.search-shell {
  position: relative;
  width: min(100%, 520px);
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #7f8db0;
}

.search-input {
  width: 100%;
  height: 46px;
  padding: 0 16px 0 42px;
  border-radius: 16px;
  border: 1px solid rgba(120, 139, 255, 0.16);
  outline: none;
  transition: all 0.3s ease;
}

html.light .search-input {
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 24px rgba(94, 111, 180, 0.08);
  color: #2c3957;
}

html.dark .search-input {
  background: rgba(38, 45, 70, 0.95);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  color: #e3e9ff;
}

.search-input:focus {
  border-color: rgba(101, 121, 242, 0.45);
  box-shadow: 0 14px 30px rgba(100, 119, 234, 0.18);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(120, 139, 255, 0.16);
  transition: all 0.3s ease;
}

html.light .theme-toggle {
  background: rgba(255, 255, 255, 0.92);
  color: #5f6fe0;
  box-shadow: 0 10px 24px rgba(94, 111, 180, 0.08);
}

html.dark .theme-toggle {
  background: rgba(38, 45, 70, 0.92);
  color: #d9e1ff;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.18);
}

.theme-toggle:hover {
  transform: translateY(-1px);
  border-color: rgba(101, 121, 242, 0.35);
}

@media (max-width: 900px) {
  .client-header {
    flex-wrap: wrap;
    padding: 14px 16px;
  }

  .brand-block {
    min-width: auto;
  }

  .header-center {
    order: 3;
    width: 100%;
  }

  .search-shell {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .brand-subtitle {
    display: none;
  }

  .brand-title {
    font-size: 21px;
  }

  .search-input {
    height: 42px;
    border-radius: 14px;
  }
}
</style>
