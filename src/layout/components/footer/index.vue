<script setup lang="ts">
import Left from './components/left.vue'
import Center from './components/center.vue'
import Right from './components/right.vue'
</script>

<template>
  <footer class="player-footer">
    <Left />
    <Center />
    <Right />
  </footer>
</template>

<style scoped>
.player-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  position: relative;
  z-index: 30;
}

html.light .player-footer {
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(120, 139, 255, 0.14);
  box-shadow: 0 -10px 30px rgba(94, 111, 180, 0.08);
}

html.dark .player-footer {
  background: rgba(28, 34, 54, 0.88);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(120, 139, 255, 0.18);
  box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.22);
}

@media (max-width: 900px) {
  .player-footer {
    padding: 10px 12px;
  }
}
</style>
