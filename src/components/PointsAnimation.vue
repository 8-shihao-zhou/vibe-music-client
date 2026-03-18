<template>
  <div class="points-animation-container">
    <transition-group name="points-float" tag="div">
      <div
        v-for="item in animations"
        :key="item.id"
        class="points-float-item"
        :style="{ left: item.x + 'px', top: item.y + 'px' }"
      >
        <div class="points-text" :class="item.type">
          {{ item.text }}
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

interface PointsAnimation {
  id: number
  text: string
  type: 'positive' | 'negative'
  x: number
  y: number
}

const animations = ref<PointsAnimation[]>([])
let animationId = 0

// 显示积分动画
const showPointsAnimation = (points: number, x?: number, y?: number) => {
  const id = ++animationId
  const text = points > 0 ? `+${points}` : `${points}`
  const type = points > 0 ? 'positive' : 'negative'

  // 如果没有指定位置，使用屏幕中心
  const posX = x ?? window.innerWidth / 2
  const posY = y ?? window.innerHeight / 2

  const animation: PointsAnimation = {
    id,
    text,
    type,
    x: posX,
    y: posY,
  }

  animations.value.push(animation)

  // 3秒后移除动画
  setTimeout(() => {
    const index = animations.value.findIndex((item) => item.id === id)
    if (index > -1) {
      animations.value.splice(index, 1)
    }
  }, 3000)
}

// 暴露方法给父组件
defineExpose({
  showPointsAnimation,
})
</script>

<style scoped lang="scss">
.points-animation-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
}

.points-float-item {
  position: absolute;
  transform: translate(-50%, -50%);
}

.points-text {
  font-size: 24px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.points-text.positive {
  color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
  border: 2px solid rgba(82, 196, 26, 0.3);
}

.points-text.negative {
  color: #f5222d;
  background: rgba(245, 34, 45, 0.1);
  border: 2px solid rgba(245, 34, 45, 0.3);
}

// 动画效果
.points-float-enter-active {
  transition: all 3s ease-out;
}

.points-float-leave-active {
  transition: all 0.5s ease-in;
}

.points-float-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}

.points-float-enter-to {
  opacity: 1;
  transform: translate(-50%, -150%) scale(1);
}

.points-float-leave-from {
  opacity: 1;
  transform: translate(-50%, -150%) scale(1);
}

.points-float-leave-to {
  opacity: 0;
  transform: translate(-50%, -200%) scale(0.8);
}
</style>
