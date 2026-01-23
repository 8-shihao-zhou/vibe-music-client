/* eslint-disable */
<template>
  <div class="community-container">
    <div class="page-header">
      <h2>🌏 音乐灵感社区</h2>
      <p class="subtitle">探索大家的 AI 创作，分享你的音乐故事</p>
    </div>

    <!-- 帖子列表 -->
    <div class="post-list">
      <el-card
        v-for="post in postList"
        :key="post.id"
        class="post-card"
        shadow="hover"
      >
        <div class="user-info">
          <el-avatar :size="40" :src="post.avatar" />
          <div class="user-meta">
            <span class="username">{{ post.username }}</span>
            <span class="time">{{ post.time }}</span>
          </div>
          <el-button class="follow-btn" type="primary" link>+ 关注</el-button>
        </div>

        <div class="post-content">
          <p class="post-text">{{ post.content }}</p>
          <div class="media-box" v-if="post.videoUrl">
            <video
              :src="post.videoUrl"
              controls
              preload="metadata"
              class="post-video"
            ></video>
          </div>
        </div>

        <div class="action-bar">
          <div
            class="action-item"
            :class="{ active: post.isLiked }"
            @click="toggleLike(post)"
          >
            <el-icon><Pointer /></el-icon>
            <span>{{ post.likes }}</span>
          </div>
          <div class="action-item" @click="openComments(post)">
            <el-icon><ChatLineRound /></el-icon>
            <span>{{ post.comments }}</span>
          </div>
          <div class="action-item" @click="handleShare(post)">
            <el-icon><Share /></el-icon>
            <span>分享</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Pointer, ChatLineRound, Share } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const postList = ref([
  {
    id: 1,
    username: '赛博莫扎特',
    avatar:
      'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    time: '2小时前',
    content: '用 AI 生成了一段赛博朋克风格的 MV，感觉这个鼓点卡得太准了！',
    videoUrl: 'http://localhost:8080/files/mv_test.mp4',
    likes: 128,
    comments: 32,
    isLiked: false,
  },
])

const toggleLike = (post: any) => {
  post.isLiked = !post.isLiked
  if (post.isLiked) {
    post.likes++
    ElMessage.success('点赞成功')
  } else {
    post.likes--
  }
}

const openComments = (post: any) => {
  console.log(post.id)
  ElMessage.info('评论区功能开发中...')
}

// 👇👇👇 【修复点】 👇👇👇
const handleShare = (post: any) => {
  // 这里使用了 post 变量，就不会报错了
  console.log('分享帖子:', post.id)
  ElMessage.success('链接已复制到剪贴板')
}
</script>

<style scoped>
.community-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
}
.page-header {
  margin-bottom: 24px;
}
.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}
.subtitle {
  color: #909399;
  font-size: 14px;
  margin-top: 5px;
}
.post-card {
  margin-bottom: 20px;
  border-radius: 12px;
}
.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.user-meta {
  margin-left: 12px;
  display: flex;
  flex-direction: column;
}
.username {
  font-size: 15px;
  font-weight: 600;
}
.time {
  font-size: 12px;
  color: #909399;
}
.follow-btn {
  margin-left: auto;
}
.post-text {
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 12px;
}
.media-box {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}
.post-video {
  width: 100%;
  max-height: 400px;
  display: block;
}
.action-bar {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #f2f3f5;
  padding-top: 12px;
}
.action-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
}
.action-item:hover {
  color: #409eff;
}
.action-item .el-icon {
  font-size: 18px;
  margin-right: 4px;
}
.action-item.active {
  color: #f56c6c;
}
</style>
