<script setup lang="ts">
import { getRecommendedSongs } from '@/api/system'
import { UserStore } from '@/stores/modules/user'
import Table from '@/components/Table.vue'
import { Song } from '@/api/interface'

const userStore = UserStore()
const songs = ref<Song[]>([])
const loading = ref(false)

//今日日期展示
const today = new Date() //获取当前系统时间
const dateStr = today.toLocaleDateString('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

//获取每日推荐歌曲
const fetchDaily = async () => {
  loading.value = true //开始请求 → 打开加载动画
  try {
    //向后端发请求：拿每日推荐歌曲数据
    const res = await getRecommendedSongs()
    //如果后端返回成功（code=0）并且有数据
    if (res.code === 0 && res.data) {
      //把歌曲放进歌曲盒子 → 页面自动显示
      songs.value = res.data as Song[]
    }
  } finally {
    loading.value = false //结束请求 → 关闭加载动画
  }
}

//页面加载完成后，自动执行获取推荐歌曲
onMounted(fetchDaily)
</script>

<template>
  <div class="daily-page">
    <section class="daily-hero">
      <div class="hero-copy">
        <div class="hero-badge">
          <div class="hero-icon">
            <icon-ri:calendar-2-line class="hero-icon-inner" />
          </div>
          <span>Daily Picks</span>
        </div>

        <h1 class="hero-title">每日推荐</h1>
        <p class="hero-subtitle">
          {{ dateStr }}，为你整理一份适合今天打开的音乐清单。
        </p>

        <div class="hero-meta">
          <div class="meta-card">
            <span class="meta-label">推荐歌曲</span>
            <strong>{{ songs.length }}</strong>
          </div>
          <div class="meta-card">
            <span class="meta-label">推荐状态</span>
            <strong>{{
              userStore.isLoggedIn ? '个性推荐' : '通用推荐'
            }}</strong>
          </div>
        </div>
      </div>

      <div class="hero-side">
        <button class="refresh-button" :disabled="loading" @click="fetchDaily">
          <icon-ri:refresh-line :class="{ spinning: loading }" />
          <span>{{ loading ? '刷新中' : '刷新推荐' }}</span>
        </button>

        <div class="playlist-preview">
          <div class="preview-chip">Today</div>
          <div class="preview-title">让今天的播放列表更有氛围</div>
          <p class="preview-text">轻松开听。</p>
        </div>
      </div>

      <div class="hero-glow hero-glow-a" />
      <div class="hero-glow hero-glow-b" />
    </section>

    <section v-if="!userStore.isLoggedIn" class="login-tip">
      <icon-ri:information-line class="tip-icon" />
      <div>
        <div class="tip-title">登录后推荐会更懂你</div>
        <div class="tip-text">系统会为您推荐更贴近口味的每日歌曲。</div>
      </div>
    </section>

    <section class="daily-table-panel">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">Recommendation List</p>
          <h2 class="panel-title">今日歌曲清单</h2>
        </div>
        <span class="panel-note">点击播放按钮即可开始收听</span>
      </div>

      <div class="table-shell">
        <div v-if="loading" class="loading-state">
          <icon-ri:loader-4-line class="loading-icon" />
          <span>正在生成今日推荐...</span>
        </div>
        <Table v-else :data="songs" class="daily-table" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.daily-page {
  min-height: 100%;
  padding: 20px;
  background: radial-gradient(
      circle at top left,
      rgba(111, 156, 255, 0.12),
      transparent 26%
    ),
    radial-gradient(
      circle at top right,
      rgba(255, 191, 205, 0.13),
      transparent 22%
    ),
    linear-gradient(
      180deg,
      rgba(246, 249, 255, 0.96),
      rgba(252, 252, 255, 0.98)
    );
}

.daily-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) 320px;
  gap: 24px;
  padding: 28px;
  overflow: hidden;
  border: 1px solid rgba(141, 169, 229, 0.16);
  border-radius: 30px;
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.96),
      rgba(248, 244, 255, 0.93)
    ),
    #fff;
  box-shadow: 0 22px 48px rgba(88, 115, 173, 0.12);
}

.hero-copy,
.hero-side {
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px 10px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(136, 165, 227, 0.16);
  color: #667791;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, #5c86e8 0%, #7c7ce8 52%, #ef8ea5 100%);
  box-shadow: 0 10px 22px rgba(103, 126, 214, 0.26);
}

.hero-icon-inner {
  font-size: 24px;
  color: #fff;
}

.hero-title {
  margin: 18px 0 0;
  font-size: 40px;
  line-height: 1.12;
  color: #223350;
}

.hero-subtitle {
  max-width: 720px;
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.85;
  color: #687891;
}

.hero-meta {
  display: flex;
  gap: 14px;
  margin-top: 22px;
  flex-wrap: wrap;
}

.meta-card {
  min-width: 160px;
  padding: 14px 16px;
  border: 1px solid rgba(143, 171, 228, 0.16);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.75);
  box-shadow: 0 12px 24px rgba(95, 121, 178, 0.09);
}

.meta-label {
  display: block;
  font-size: 12px;
  color: #7c89a3;
}

.meta-card strong {
  display: block;
  margin-top: 8px;
  font-size: 22px;
  color: #243653;
}

.hero-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 18px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #5f87e6 0%, #7e80e8 55%, #ea8fa7 100%);
  box-shadow: 0 16px 28px rgba(104, 126, 209, 0.24);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    opacity 0.25s ease;
}

.refresh-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 30px rgba(104, 126, 209, 0.3);
}

.refresh-button:disabled {
  opacity: 0.78;
  cursor: not-allowed;
  transform: none;
}

.spinning {
  animation: daily-spin 1s linear infinite;
}

.playlist-preview {
  padding: 22px;
  border: 1px solid rgba(142, 170, 228, 0.15);
  border-radius: 24px;
  background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.92),
      rgba(246, 250, 255, 0.9)
    ),
    #fff;
  box-shadow: 0 16px 32px rgba(89, 116, 172, 0.1);
}

.preview-chip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(99, 125, 214, 0.12);
  color: #5671cf;
  font-size: 12px;
  font-weight: 700;
}

.preview-title {
  margin-top: 16px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  color: #233451;
}

.preview-text {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.8;
  color: #6f809a;
}

.hero-glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.hero-glow-a {
  top: -72px;
  right: 230px;
  width: 180px;
  height: 180px;
  background: radial-gradient(
    circle,
    rgba(128, 168, 255, 0.26),
    transparent 70%
  );
}

.hero-glow-b {
  right: -48px;
  bottom: -54px;
  width: 250px;
  height: 250px;
  background: radial-gradient(
    circle,
    rgba(255, 187, 205, 0.24),
    transparent 70%
  );
}

.login-tip {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 20px;
  padding: 18px 20px;
  border: 1px solid rgba(143, 172, 228, 0.14);
  border-radius: 20px;
  background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.96),
      rgba(246, 249, 255, 0.94)
    ),
    #fff;
  box-shadow: 0 14px 28px rgba(90, 118, 173, 0.09);
}

.tip-icon {
  font-size: 22px;
  color: #6a7fe3;
  flex-shrink: 0;
}

.tip-title {
  font-size: 14px;
  font-weight: 700;
  color: #283956;
}

.tip-text {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.7;
  color: #70809b;
}

.daily-table-panel {
  margin-top: 22px;
  padding: 22px;
  border: 1px solid rgba(143, 171, 229, 0.14);
  border-radius: 28px;
  background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.97),
      rgba(247, 250, 255, 0.95)
    ),
    #fff;
  box-shadow: 0 18px 38px rgba(87, 112, 167, 0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6f7ee2;
}

.panel-title {
  margin: 0;
  font-size: 24px;
  color: #223350;
}

.panel-note {
  font-size: 13px;
  color: #7b88a4;
}

.table-shell {
  min-height: 420px;
  overflow: hidden;
  border: 1px solid rgba(145, 172, 228, 0.12);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 200px;
  color: #6b7ce2;
  font-size: 15px;
  font-weight: 600;
}

.loading-icon {
  font-size: 22px;
  animation: daily-spin 1s linear infinite;
}

.daily-table {
  height: 100%;
}

@keyframes daily-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .daily-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .daily-page {
    padding: 14px;
  }

  .daily-hero,
  .daily-table-panel,
  .login-tip {
    padding: 18px 16px;
    border-radius: 22px;
  }

  .hero-title {
    font-size: 30px;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .refresh-button {
    width: 100%;
  }
}

html.dark .daily-page {
  background:
    radial-gradient(circle at top left, rgba(79, 112, 196, 0.22), transparent 28%),
    radial-gradient(circle at top right, rgba(171, 92, 144, 0.18), transparent 24%),
    linear-gradient(180deg, rgba(17, 23, 38, 0.98), rgba(10, 15, 28, 1));
}

html.dark .daily-hero,
html.dark .playlist-preview,
html.dark .login-tip,
html.dark .daily-table-panel {
  border-color: rgba(117, 138, 196, 0.18);
  background:
    linear-gradient(180deg, rgba(26, 34, 54, 0.94), rgba(20, 27, 44, 0.96)),
    #182133;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.26);
}

html.dark .hero-badge,
html.dark .meta-card {
  border-color: rgba(142, 163, 224, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: #c6d2ee;
}

html.dark .hero-title,
html.dark .panel-title,
html.dark .preview-title,
html.dark .tip-title,
html.dark .meta-card strong {
  color: #eef3ff;
}

html.dark .hero-subtitle,
html.dark .panel-note,
html.dark .preview-text,
html.dark .tip-text,
html.dark .meta-label {
  color: #aab7d6;
}

html.dark .table-shell {
  border-color: rgba(120, 141, 197, 0.16);
  background: rgba(255, 255, 255, 0.04);
}

html.dark .loading-state {
  color: #c8d3ef;
}
</style>
