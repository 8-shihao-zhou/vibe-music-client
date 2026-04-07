<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPostDetail,
  likePost,
  unlikePost,
  favoritePost,
  unfavoritePost,
  commentPost,
  deletePostComment,
  deletePost,
  likeComment,
  unlikeComment,
} from '@/api/community'
import { UserStore } from '@/stores/modules/user'
import ReportDialog from '@/components/ReportDialog.vue'

const route = useRoute()
const router = useRouter()
const userStore = UserStore()

const postId = computed(() => {
  const id = Number(route.params.id)
  return isNaN(id) ? 0 : id
})
const loading = ref(false)
const post = ref<any>(null)
const commentContent = ref('')
const replyTo = ref<any>(null)

// 举报相关
const showReportDialog = ref(false)
const reportTarget = ref<{ type: number; id: number }>({ type: 1, id: 0 })

// 打开举报对话框
const openReportDialog = (type: number, id: number) => {
  if (!userStore.userInfo?.userId) {
    ElMessage.warning('请先登录')
    return
  }
  reportTarget.value = { type, id }
  showReportDialog.value = true
}

// 举报成功回调
const handleReportSuccess = () => {
  ElMessage.success('举报已提交，感谢您的反馈')
}

// 监听路由变化，切换帖子时刷新
// 监听整个路由对象，确保 name 和 params 同步更新，避免竞态问题
watch(
  () => route.name,
  (newName) => {
    if (newName === 'CommunityDetail' && postId.value > 0) {
      commentContent.value = ''
      replyTo.value = null
      fetchPostDetail()
    }
  }
)

// 获取帖子详情
const fetchPostDetail = async (silent = false) => {
  // 如果postId无效，不发送请求
  if (!postId.value || postId.value === 0) {
    console.warn('>>> [详情页] Invalid postId:', postId.value)
    return
  }

  console.log('>>> [详情页] 开始获取帖子详情, postId:', postId.value)
  loading.value = true
  try {
    const res = await getPostDetail(postId.value)
    console.log('>>> [详情页] 帖子详情响应:', res)
    if (res.code === 0 && res.data) {
      post.value = res.data
      console.log(
        '>>> [详情页] 设置帖子数据成功, isLiked:',
        res.data.isLiked,
        '点赞数:',
        res.data.likeCount,
        '浏览数:',
        res.data.viewCount
      )
    } else if (res.code !== 0 && !silent) {
      // silent模式下不显示错误（用于点赞后刷新）
      console.error('>>> [详情页] 获取帖子详情失败:', res.msg)
      ElMessage.error(res.msg || '获取帖子详情失败')
    }
  } catch (error) {
    if (!silent) {
      console.error('>>> [详情页] 获取帖子详情异常:', error)
      ElMessage.error('网络错误，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}

// 点赞/取消点赞
const handleLike = async () => {
  if (!userStore.userInfo?.userId) {
    ElMessage.warning('请先登录')
    return
  }

  // 保存当前状态，用于回滚
  const originalIsLiked = post.value.isLiked
  const originalLikeCount = post.value.likeCount

  try {
    if (post.value.isLiked) {
      // 乐观更新：先更新UI
      post.value.isLiked = false
      post.value.likeCount--

      const res = await unlikePost(postId.value)
      if (res.code === 0) {
        ElMessage.success('取消点赞成功')
      } else {
        // 失败时回滚
        post.value.isLiked = originalIsLiked
        post.value.likeCount = originalLikeCount
        ElMessage.error(res.msg || '操作失败')
      }
    } else {
      // 乐观更新：先更新UI
      post.value.isLiked = true
      post.value.likeCount++

      const res = await likePost(postId.value)
      if (res.code === 0) {
        ElMessage.success('点赞成功')
      } else {
        // 失败时回滚
        post.value.isLiked = originalIsLiked
        post.value.likeCount = originalLikeCount

        // 如果是"已经点赞过了"，说明状态不同步，重新获取
        if (res.msg && res.msg.includes('已经点赞')) {
          ElMessage.warning('您已经点赞过了')
          await fetchPostDetail(true)
        } else {
          ElMessage.error(res.msg || '操作失败')
        }
      }
    }
  } catch (error) {
    // 网络错误时回滚
    post.value.isLiked = originalIsLiked
    post.value.likeCount = originalLikeCount
    console.error('点赞操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 收藏/取消收藏
const handleFavorite = async () => {
  if (!userStore.userInfo?.userId) {
    ElMessage.warning('请先登录')
    return
  }

  // 保存当前状态，用于回滚
  const originalIsFavorited = post.value.isFavorited
  const originalFavoriteCount = post.value.favoriteCount || 0

  try {
    if (post.value.isFavorited) {
      // 乐观更新：先更新UI
      post.value.isFavorited = false
      post.value.favoriteCount = Math.max(0, originalFavoriteCount - 1)

      const res = await unfavoritePost(postId.value)
      if (res.code === 0) {
        ElMessage.success('取消收藏成功')
      } else {
        // 失败时回滚
        post.value.isFavorited = originalIsFavorited
        post.value.favoriteCount = originalFavoriteCount
        ElMessage.error(res.msg || '操作失败')
      }
    } else {
      // 乐观更新：先更新UI
      post.value.isFavorited = true
      post.value.favoriteCount = originalFavoriteCount + 1

      const res = await favoritePost(postId.value)
      if (res.code === 0) {
        ElMessage.success('收藏成功')
      } else {
        // 失败时回滚
        post.value.isFavorited = originalIsFavorited
        post.value.favoriteCount = originalFavoriteCount

        // 如果是"已经收藏过了"，说明状态不同步，重新获取
        if (res.msg && res.msg.includes('已经收藏')) {
          ElMessage.warning('您已经收藏过了')
          await fetchPostDetail(true)
        } else {
          ElMessage.error(res.msg || '操作失败')
        }
      }
    }
  } catch (error) {
    // 网络错误时回滚
    post.value.isFavorited = originalIsFavorited
    post.value.favoriteCount = originalFavoriteCount
    console.error('收藏操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 发表评论
const handleComment = async () => {
  if (!userStore.userInfo?.userId) {
    ElMessage.warning('请先登录')
    return
  }

  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  try {
    console.log('>>> [评论] 开始发表评论')
    console.log('>>> [评论] postId:', postId.value)
    console.log('>>> [评论] content:', commentContent.value)
    console.log('>>> [评论] parentId:', replyTo.value?.commentId || undefined)

    const res = await commentPost(
      postId.value,
      commentContent.value,
      replyTo.value?.commentId || undefined
    )

    console.log('>>> [评论] API 响应:', res)

    if (res.code === 0) {
      ElMessage.success('评论成功')
      commentContent.value = ''
      replyTo.value = null
      // 刷新帖子详情以显示新评论
      await fetchPostDetail(true)
    } else {
      ElMessage.error(res.message || '评论失败')
    }
  } catch (error) {
    console.error('>>> [评论] 评论失败:', error)
    ElMessage.error('评论失败')
  }
}

// 回复评论
const handleReply = (comment: any) => {
  // 如果回复的是一个回复（有 parentId 且不为 0），则应该回复原始评论
  // 否则回复当前评论
  const targetParentId =
    comment.parentId && comment.parentId !== 0
      ? comment.parentId
      : comment.commentId

  replyTo.value = {
    ...comment,
    // 保存原始评论ID作为 parentId
    commentId: targetParentId,
    // 保存被回复者的用户名用于显示
    replyToUsername: comment.username,
  }

  commentContent.value = `@${comment.username} `

  console.log('>>> [回复] 回复评论:', {
    originalCommentId: comment.commentId,
    parentId: targetParentId,
    username: comment.username,
  })
}

// 取消回复
const cancelReply = () => {
  replyTo.value = null
  commentContent.value = ''
}

// 删除评论
const handleDeleteComment = async (commentId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deletePostComment(commentId)
    ElMessage.success('删除成功')
    fetchPostDetail(true) // 使用静默模式
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 点赞评论
const handleLikeComment = async (comment: any) => {
  if (!userStore.userInfo?.userId) {
    ElMessage.warning('请先登录')
    return
  }

  // 乐观更新
  const originalLiked = comment.isLiked
  const originalCount = comment.likeCount

  comment.isLiked = !comment.isLiked
  comment.likeCount = comment.isLiked ? originalCount + 1 : originalCount - 1

  try {
    if (originalLiked) {
      await unlikeComment(comment.commentId)
    } else {
      await likeComment(comment.commentId)
    }
  } catch (error) {
    // 失败时回滚
    comment.isLiked = originalLiked
    comment.likeCount = originalCount
    console.error('评论点赞操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 返回上一页
const goBack = () => {
  // 使用浏览器历史记录返回，这样可以返回到之前的页面（论坛首页、用户主页等）
  router.back()
}

// 跳转到用户主页
const goToUserProfile = (userId: number) => {
  router.push(`/community/user/${userId}`)
}

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 编辑帖子
const handleEditPost = () => {
  router.push(`/community/edit/${postId.value}`)
}

// 删除帖子
const handleDeletePost = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这篇帖子吗？删除后无法恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const res = await deletePost(postId.value)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      // 返回社区列表
      router.push('/community')
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除帖子失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 初始化
onMounted(() => {
  // 使用nextTick确保路由参数已经设置
  nextTick(() => {
    if (postId.value && postId.value > 0) {
      fetchPostDetail()
    }
  })
})

// 监听用户信息变化（切换账号时刷新）
watch(
  () => userStore.userInfo?.userId,
  (newUserId, oldUserId) => {
    if (newUserId !== oldUserId && postId.value && postId.value > 0) {
      fetchPostDetail()
    }
  }
)
</script>

<template>
  <div
    class="post-detail-container"
    :class="post?.postTheme ? `detail-theme-${post.postTheme}` : ''"
  >
    <div v-loading="loading" class="detail-content">
      <!-- 返回按钮 -->
      <el-button class="back-btn" @click="goBack">
        <i class="i-carbon-arrow-left mr-1" />
        返回
      </el-button>

      <div
        v-if="post"
        class="post-detail"
        :class="[
          { 'post-highlight': post.isHighlight },
          post.postTheme ? `post-theme-${post.postTheme}` : '',
        ]"
      >
        <!-- 帖子头部 -->
        <div class="post-header">
          <div class="title-row">
            <span v-if="post.isTop" class="tag-top">置顶</span>
            <span v-if="post.isHot" class="tag-hot">热门</span>
            <span v-if="post.isHighlight" class="tag-highlight">
              <i class="i-carbon-star-filled" />
              高亮
            </span>
            <h1 class="post-title">{{ post.title }}</h1>
          </div>

          <div class="post-meta">
            <div
              class="author-info clickable"
              @click="goToUserProfile(post.userId)"
            >
              <img
                :src="post.userAvatar || '/src/assets/user.jpg'"
                class="avatar"
              />
              <div class="author-details">
                <span class="username">{{ post.username }}</span>
                <span class="time">{{ formatTime(post.createTime) }}</span>
              </div>
            </div>

            <div class="meta-right">
              <div class="post-stats">
                <span class="stat-item">
                  <i class="i-carbon-view" />
                  <span class="stat-label">浏览</span>
                  {{ post.viewCount }}
                </span>
                <span class="stat-item">
                  <i class="i-carbon-thumbs-up" />
                  <span class="stat-label">点赞</span>
                  {{ post.likeCount }}
                </span>
                <span class="stat-item">
                  <i class="i-carbon-chat" />
                  <span class="stat-label">评论</span>
                  {{ post.commentCount }}
                </span>
              </div>

              <!-- 作者操作按钮（编辑、删除） -->
              <div v-if="post.userId === userStore.userInfo?.userId" class="author-actions">
                <el-button
                  text
                  class="action-btn"
                  @click="handleEditPost"
                >
                  <i class="i-carbon-edit" />
                  编辑
                </el-button>
                <el-button
                  text
                  type="danger"
                  class="action-btn"
                  @click="handleDeletePost"
                >
                  <i class="i-carbon-trash-can" />
                  删除
                </el-button>
              </div>

              <!-- 举报按钮 -->
              <el-button
                v-if="post.userId !== userStore.userInfo?.userId"
                text
                class="report-btn"
                @click="openReportDialog(1, post.id)"
              >
                <i class="i-carbon-flag" />
                举报
              </el-button>
            </div>
          </div>
        </div>

        <!-- 封面图 -->
        <div v-if="post.coverUrl" class="post-cover">
          <img :src="post.coverUrl" alt="封面" />
        </div>

        <!-- 帖子内容 -->
        <div class="post-content">
          <div
            class="content-text"
            v-html="post.content.replace(/\n/g, '<br>')"
          ></div>
        </div>

        <!-- 图片展示 -->
        <div v-if="post.images && post.images.length > 0" class="post-images">
          <div class="images-grid" :class="`grid-${post.images.length}`">
            <el-image
              v-for="(image, index) in post.images"
              :key="index"
              :src="image"
              :preview-src-list="post.images"
              :initial-index="index"
              fit="cover"
              class="image-item"
            />
          </div>
        </div>

        <!-- MV展示 -->
        <div v-if="post.mv" class="post-mv">
          <div class="mv-header">
            <i class="i-carbon-video" />
            <span class="mv-name">{{ post.mv.mvName }}</span>
          </div>
          <video
            :src="post.mv.mvUrl"
            controls
            class="mv-player"
            preload="metadata"
          >
            您的浏览器不支持视频播放
          </video>
        </div>

        <!-- 操作栏 -->
        <div class="post-actions">
          <el-button
            :type="post.isLiked ? 'primary' : 'default'"
            class="action-btn"
            @click="handleLike"
          >
            <i
              :class="
                post.isLiked
                  ? 'i-carbon-thumbs-up-filled'
                  : 'i-carbon-thumbs-up'
              "
            />
            {{ post.isLiked ? '已点赞' : '点赞' }} ({{ post.likeCount }})
          </el-button>

          <el-button
            :type="post.isFavorited ? 'warning' : 'default'"
            class="action-btn"
            @click="handleFavorite"
          >
            <i
              :class="
                post.isFavorited ? 'i-carbon-star-filled' : 'i-carbon-star'
              "
            />
            {{ post.isFavorited ? '已收藏' : '收藏' }} ({{
              post.favoriteCount || 0
            }})
          </el-button>
        </div>

        <!-- 评论区 -->
        <div class="comments-section">
          <h2 class="section-title">评论 ({{ post.commentCount }})</h2>

          <!-- 发表评论 -->
          <div class="comment-input-box">
            <div v-if="replyTo" class="reply-tip">
              回复 @{{ replyTo.replyToUsername || replyTo.username }}
              <el-button text @click="cancelReply">取消</el-button>
            </div>
            <el-input
              v-model="commentContent"
              type="textarea"
              :rows="4"
              placeholder="发表你的看法..."
              class="comment-input"
            />
            <div class="comment-actions">
              <el-button type="primary" @click="handleComment"
                >发表评论</el-button
              >
            </div>
          </div>

          <!-- 评论列表 -->
          <div class="comments-list">
            <div
              v-for="comment in post.comments"
              :key="comment.commentId"
              class="comment-item"
            >
              <img
                :src="comment.userAvatar || '/src/assets/user.jpg'"
                class="comment-avatar"
              />
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-username">{{ comment.username }}</span>
                  <span class="comment-time">{{
                    formatTime(comment.createTime)
                  }}</span>
                </div>
                <div class="comment-text">{{ comment.content }}</div>
                <div class="comment-footer">
                  <el-button
                    :type="comment.isLiked ? 'primary' : 'default'"
                    text
                    size="small"
                    class="like-btn"
                    @click="handleLikeComment(comment)"
                  >
                    <i
                      :class="
                        comment.isLiked
                          ? 'i-carbon-thumbs-up-filled'
                          : 'i-carbon-thumbs-up'
                      "
                    />
                    {{ comment.likeCount || 0 }}
                  </el-button>
                  <el-button text size="small" @click="handleReply(comment)">
                    回复
                  </el-button>
                  <el-button
                    v-if="comment.userId === userStore.userInfo?.userId"
                    text
                    size="small"
                    type="danger"
                    @click="handleDeleteComment(comment.commentId)"
                  >
                    删除
                  </el-button>
                  <el-button
                    v-if="comment.userId !== userStore.userInfo?.userId"
                    text
                    size="small"
                    @click="openReportDialog(2, comment.commentId)"
                  >
                    <i class="i-carbon-flag" />
                    举报
                  </el-button>
                </div>

                <!-- 回复列表 -->
                <div
                  v-if="comment.replies && comment.replies.length > 0"
                  class="replies-list"
                >
                  <div
                    v-for="reply in comment.replies"
                    :key="reply.commentId"
                    class="reply-item"
                  >
                    <img
                      :src="reply.userAvatar || '/src/assets/user.jpg'"
                      class="reply-avatar"
                    />
                    <div class="reply-content">
                      <div class="reply-header">
                        <span class="reply-username">{{ reply.username }}</span>
                        <span class="reply-time">{{
                          formatTime(reply.createTime)
                        }}</span>
                      </div>
                      <div class="reply-text">{{ reply.content }}</div>
                      <div class="reply-footer">
                        <el-button
                          :type="reply.isLiked ? 'primary' : 'default'"
                          text
                          size="small"
                          class="like-btn"
                          @click="handleLikeComment(reply)"
                        >
                          <i
                            :class="
                              reply.isLiked
                                ? 'i-carbon-thumbs-up-filled'
                                : 'i-carbon-thumbs-up'
                            "
                          />
                          {{ reply.likeCount || 0 }}
                        </el-button>
                        <el-button
                          text
                          size="small"
                          @click="handleReply(reply)"
                        >
                          回复
                        </el-button>
                        <el-button
                          v-if="reply.userId === userStore.userInfo?.userId"
                          text
                          size="small"
                          type="danger"
                          @click="handleDeleteComment(reply.commentId)"
                        >
                          删除
                        </el-button>
                        <el-button
                          v-if="reply.userId !== userStore.userInfo?.userId"
                          text
                          size="small"
                          @click="openReportDialog(2, reply.commentId)"
                        >
                          <i class="i-carbon-flag" />
                          举报
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <el-empty
              v-if="post.comments.length === 0"
              description="暂无评论，快来发表第一条评论吧！"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 举报对话框 -->
    <ReportDialog
      v-model:visible="showReportDialog"
      :target-type="reportTarget.type"
      :target-id="reportTarget.id"
      @success="handleReportSuccess"
    />
  </div>
</template>

<style scoped lang="scss">
.post-detail-container {
  width: 100%;
  max-width: none;
  min-height: calc(100vh - 72px);
  margin: 0;
  padding: 24px 0 56px;
  position: relative;
  background: transparent;
}

.detail-content {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 24px;
  border-radius: 28px;
}

.back-btn {
  margin-bottom: 20px;
  border-radius: 999px;
  border: 1px solid rgba(87, 114, 239, 0.12);
  background: rgba(255, 255, 255, 0.84);
  color: #54617f;
}

.post-detail {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 255, 0.95));
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);

  .post-header {
    margin-bottom: 24px;
    padding: 22px;
    border-radius: 24px;
    background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.86), transparent 34%),
      linear-gradient(135deg, rgba(238, 245, 255, 0.96), rgba(255, 240, 237, 0.92));

    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;

      .tag-top,
      .tag-hot {
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
      }

      .tag-top {
        background: #f56c6c;
        color: white;
      }

      .tag-hot {
        background: #e6a23c;
        color: white;
      }

      .post-title {
        font-size: 32px;
        font-weight: 700;
        margin: 0;
        color: #2f3447;
      }
    }

    .post-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 18px;
      flex-wrap: wrap;

      .author-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        border-radius: 12px;
        transition: all 0.3s ease;

        &.clickable {
          cursor: pointer;

          &:hover {
            background: var(--el-fill-color-light);
            transform: translateX(4px);

            .username {
              color: #667eea;
            }
          }
        }

        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        &.clickable:hover .avatar {
          transform: scale(1.1);
        }

        .author-details {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .username {
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            transition: color 0.3s ease;
          }

          .time {
            font-size: 13px;
            color: var(--el-text-color-secondary);
          }
        }
      }

      .post-stats {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 13px;
          color: #6b7280;
          background: rgba(255, 255, 255, 0.8);

          i {
            font-size: 18px;
            color: #d95c61;
          }

          .stat-label {
            font-size: 13px;
            color: #7b8399;
          }
        }
      }

      .meta-right {
        display: flex;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 16px;
      }

      .author-actions {
        display: flex;
        align-items: center;
        gap: 8px;

        .action-btn {
          color: var(--el-text-color-regular);
          font-size: 14px;

          &:hover {
            color: var(--el-color-primary);
          }

          &.el-button--danger:hover {
            color: var(--el-color-danger);
          }

          i {
            font-size: 16px;
          }
        }
      }

      .report-btn {
        color: #909399;
        font-size: 14px;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.72);

        &:hover {
          color: #f56c6c;
          background: rgba(255, 255, 255, 0.92);
        }

        i {
          font-size: 16px;
        }
      }
    }
  }

  .post-cover {
    width: 100%;
    max-height: 400px;
    border-radius: 22px;
    overflow: hidden;
    margin-bottom: 24px;
    box-shadow: 0 18px 34px rgba(15, 23, 42, 0.08);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .post-content {
    margin-bottom: 32px;
    padding: 20px 22px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid rgba(232, 236, 245, 0.92);

    .content-text {
      font-size: 16px;
      line-height: 1.8;
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }

  .post-images {
    margin-bottom: 24px;
    padding: 18px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(232, 236, 245, 0.92);

    .images-grid {
      display: grid;
      gap: 8px;
      border-radius: 12px;
      overflow: hidden;

      &.grid-1 {
        grid-template-columns: 1fr;
        max-width: 600px;
      }

      &.grid-2 {
        grid-template-columns: repeat(2, 1fr);
      }

      &.grid-3 {
        grid-template-columns: repeat(3, 1fr);
      }

      &.grid-4 {
        grid-template-columns: repeat(2, 1fr);
      }

      &.grid-5,
      &.grid-6 {
        grid-template-columns: repeat(3, 1fr);
      }

      &.grid-7,
      &.grid-8,
      &.grid-9 {
        grid-template-columns: repeat(3, 1fr);
      }

      .image-item {
        width: 100%;
        height: 200px;
        cursor: pointer;
        transition: transform 0.3s;

        &:hover {
          transform: scale(1.02);
        }
      }
    }
  }

  .post-mv {
    margin-bottom: 24px;
    border-radius: 22px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid rgba(232, 236, 245, 0.92);

    .mv-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--el-fill-color);
      border-bottom: 1px solid var(--el-border-color);

      i {
        font-size: 20px;
        color: var(--el-color-primary);
      }

      .mv-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }

    .mv-player {
      width: 100%;
      max-height: 500px;
      display: block;
      background: #000;
    }
  }

  .post-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    padding: 20px 0;
    border-top: 1px solid var(--el-border-color-light);
    border-bottom: 1px solid var(--el-border-color-light);
    margin-bottom: 32px;

    .action-btn {
      padding: 12px 24px;
      font-size: 14px;
      border-radius: 999px;
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
    }
  }

  .comments-section {
    padding: 24px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(232, 236, 245, 0.92);

    .section-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: var(--el-text-color-primary);
    }

    .comment-input-box {
      margin-bottom: 32px;
      padding: 18px;
      border-radius: 20px;
      background: linear-gradient(180deg, rgba(250, 251, 255, 0.96), rgba(255, 255, 255, 0.92));
      border: 1px solid rgba(232, 236, 245, 0.92);

      .reply-tip {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 14px;
        color: #667eea;
      }

      .comment-input {
        margin-bottom: 12px;
      }

      .comment-actions {
        display: flex;
        justify-content: flex-end;
      }
    }

    .comments-list {
      .comment-item {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
        padding: 18px;
        border-radius: 20px;
        background: rgba(248, 250, 255, 0.92);
        border: 1px solid rgba(232, 236, 245, 0.86);

        .comment-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .comment-content {
          flex: 1;

          .comment-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;

            .comment-username {
              font-size: 14px;
              font-weight: 600;
              color: var(--el-text-color-primary);
            }

            .comment-time {
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
          }

          .comment-text {
            font-size: 14px;
            line-height: 1.6;
            color: var(--el-text-color-primary);
            margin-bottom: 8px;
          }

          .comment-footer {
            display: flex;
            align-items: center;
            gap: 16px;

            .comment-likes {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 13px;
              color: var(--el-text-color-secondary);
            }
          }

          .replies-list {
            margin-top: 16px;
            padding-left: 20px;
            border-left: 2px solid #e2e8f0;

            .reply-item {
              display: flex;
              gap: 12px;
              margin-bottom: 16px;

              .reply-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
                flex-shrink: 0;
              }

              .reply-content {
                flex: 1;

                .reply-header {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  margin-bottom: 6px;

                  .reply-username {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--el-text-color-primary);
                  }

                  .reply-time {
                    font-size: 12px;
                    color: var(--el-text-color-secondary);
                  }
                }

                .reply-text {
                  font-size: 13px;
                  line-height: 1.6;
                  color: var(--el-text-color-primary);
                  margin-bottom: 6px;
                }

                .reply-footer {
                  display: flex;
                  align-items: center;
                  gap: 12px;

                  .reply-likes {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: var(--el-text-color-secondary);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>

<style scoped lang="scss">
.comment-footer,
.reply-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;

  :deep(.like-btn) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    background: var(--el-fill-color-light);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    border: 1px solid transparent;

    &:hover {
      background: var(--el-fill-color);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: var(--el-border-color);
    }

    &.el-button--primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;

      &:hover {
        background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        transform: translateY(-3px);
      }
    }

    i {
      font-size: 17px;
      transition: transform 0.2s ease;
    }

    &:active i {
      transform: scale(1.3);
    }

    span {
      font-weight: 600;
    }
  }
}

@media (max-width: 768px) {
  .post-detail {
    padding: 22px;
  }

  .post-detail .post-header,
  .post-detail .comments-section {
    padding: 18px;
  }

  .post-detail .post-meta {
    align-items: stretch;
  }

  .post-detail .post-actions {
    flex-direction: column;
  }
}
</style>

<style scoped lang="scss">
.post-detail .title-row .tag-highlight {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #ffe16c 0%, #ffbc3f 45%, #ff8d61 100%);
  box-shadow:
    0 10px 18px rgba(255, 183, 55, 0.24),
    0 0 16px rgba(255, 206, 92, 0.2);
}

.post-detail.post-highlight {
  position: relative;
  outline: 2px solid rgba(255, 202, 72, 0.96);
  outline-offset: 4px;
  border: 1px solid rgba(255, 208, 96, 0.7);
  box-shadow:
    0 0 0 4px rgba(255, 240, 180, 0.42),
    0 0 28px rgba(255, 200, 60, 0.26),
    0 26px 56px rgba(255, 184, 71, 0.14);
}

.post-detail.post-highlight::before {
  content: '';
  position: absolute;
  left: 32px;
  right: 32px;
  top: 18px;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 213, 96, 1), rgba(255, 151, 80, 0.94), rgba(255, 213, 96, 0));
  box-shadow: 0 0 16px rgba(255, 196, 66, 0.38);
  pointer-events: none;
}

.post-detail.post-highlight .post-header {
  border: 1px solid rgba(255, 216, 122, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 14px 28px rgba(255, 193, 89, 0.1);
}

.post-detail.post-highlight .post-cover {
  position: relative;
  box-shadow:
    0 0 0 2px rgba(255, 215, 92, 0.7),
    0 20px 36px rgba(255, 184, 71, 0.2);
}

.post-detail.post-highlight .post-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(130deg, rgba(255, 255, 255, 0.3), transparent 32%, transparent 68%, rgba(255, 215, 120, 0.14));
  pointer-events: none;
}

.post-detail.post-highlight .post-content,
.post-detail.post-highlight .post-images,
.post-detail.post-highlight .post-mv,
.post-detail.post-highlight .comments-section {
  border-color: rgba(255, 216, 122, 0.24);
  box-shadow: 0 16px 30px rgba(255, 191, 73, 0.06);
}

.post-detail.post-theme-starry {
  background:
    radial-gradient(circle at 15% 20%, rgba(120, 232, 255, 0.18), transparent 28%),
    radial-gradient(circle at 80% 25%, rgba(255, 120, 240, 0.16), transparent 30%),
    radial-gradient(circle at 55% 80%, rgba(120, 160, 255, 0.18), transparent 32%),
    linear-gradient(130deg, rgba(10, 14, 35, 0.98), rgba(24, 22, 54, 0.96), rgba(20, 34, 70, 0.94));
  border: 1px solid rgba(129, 176, 255, 0.28);
}

.post-detail.post-theme-starry::before {
  content: '';
  position: absolute;
  inset: -25%;
  background:
    radial-gradient(circle at 12% 22%, rgba(255, 255, 255, 0.95) 0 2px, transparent 3px),
    radial-gradient(circle at 24% 68%, rgba(180, 220, 255, 0.88) 0 1.8px, transparent 2.8px),
    radial-gradient(circle at 38% 32%, rgba(255, 255, 255, 0.92) 0 1.5px, transparent 2.6px),
    radial-gradient(circle at 58% 18%, rgba(255, 200, 255, 0.9) 0 1.8px, transparent 2.8px),
    radial-gradient(circle at 72% 62%, rgba(170, 255, 240, 0.82) 0 2px, transparent 3px),
    radial-gradient(circle at 86% 38%, rgba(255, 255, 255, 0.92) 0 1.7px, transparent 2.7px);
  opacity: 0.7;
  pointer-events: none;
  z-index: 0;
}

.post-detail.post-theme-starry .post-header,
.post-detail.post-theme-starry .post-content,
.post-detail.post-theme-starry .post-images,
.post-detail.post-theme-starry .post-mv,
.post-detail.post-theme-starry .comments-section,
.post-detail.post-theme-starry .comment-item,
.post-detail.post-theme-starry .comment-input-box {
  background: rgba(12, 18, 42, 0.72);
  border-color: rgba(129, 176, 255, 0.24);
  color: #eef3ff;
  box-shadow: inset 0 0 0 1px rgba(190, 235, 255, 0.08);
}

.post-detail.post-theme-starry .post-title,
.post-detail.post-theme-starry .content-text,
.post-detail.post-theme-starry .section-title,
.post-detail.post-theme-starry .comment-text,
.post-detail.post-theme-starry .reply-text,
.post-detail.post-theme-starry .comment-username,
.post-detail.post-theme-starry .reply-username,
.post-detail.post-theme-starry .author-details .username,
.post-detail.post-theme-starry .mv-name {
  color: #eef3ff;
}

.post-detail.post-theme-starry .time,
.post-detail.post-theme-starry .comment-time,
.post-detail.post-theme-starry .reply-time,
.post-detail.post-theme-starry .stat-label,
.post-detail.post-theme-starry .stat-item {
  color: rgba(226, 235, 255, 0.78) !important;
}

.post-detail.post-theme-sakura {
  background:
    radial-gradient(circle at top left, rgba(255, 214, 232, 0.22), transparent 28%),
    radial-gradient(circle at bottom right, rgba(255, 174, 211, 0.18), transparent 34%),
    linear-gradient(145deg, rgba(255, 248, 251, 0.98), rgba(255, 240, 246, 0.96));
  border: 1px solid rgba(255, 176, 216, 0.3);
}

.post-detail.post-theme-sakura::before {
  content: '';
  position: absolute;
  inset: -12%;
  background:
    radial-gradient(ellipse 18px 10px at 12% 22%, rgba(255, 203, 232, 0.42), transparent 70%),
    radial-gradient(ellipse 16px 9px at 26% 66%, rgba(255, 177, 220, 0.38), transparent 70%),
    radial-gradient(ellipse 20px 11px at 44% 18%, rgba(255, 220, 238, 0.46), transparent 70%),
    radial-gradient(ellipse 17px 10px at 68% 72%, rgba(255, 170, 215, 0.38), transparent 70%),
    radial-gradient(ellipse 18px 10px at 84% 32%, rgba(255, 232, 243, 0.42), transparent 70%);
  opacity: 0.75;
  pointer-events: none;
  z-index: 0;
}

.post-detail.post-theme-sakura .post-header {
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 30%),
    linear-gradient(135deg, rgba(255, 241, 246, 0.98), rgba(255, 231, 240, 0.94));
  border: 1px solid rgba(255, 190, 224, 0.36);
}

.post-detail.post-theme-sakura .post-content,
.post-detail.post-theme-sakura .post-images,
.post-detail.post-theme-sakura .post-mv,
.post-detail.post-theme-sakura .comments-section,
.post-detail.post-theme-sakura .comment-item,
.post-detail.post-theme-sakura .comment-input-box {
  background: rgba(255, 249, 252, 0.82);
  border-color: rgba(255, 198, 226, 0.34);
}

.post-detail.post-theme-neon {
  background:
    linear-gradient(135deg, rgba(12, 18, 42, 0.98), rgba(28, 16, 58, 0.96), rgba(8, 39, 58, 0.94));
  box-shadow:
    inset 0 0 0 1px rgba(111, 223, 255, 0.18),
    0 24px 56px rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(0, 245, 255, 0.3);
}

.post-detail.post-theme-neon::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    130deg,
    rgba(0, 245, 255, 0.07) 0 10px,
    rgba(255, 0, 255, 0.06) 10px 20px
  );
  mix-blend-mode: screen;
  opacity: 0.65;
  pointer-events: none;
  z-index: 0;
}

.post-detail.post-theme-neon .post-header,
.post-detail.post-theme-neon .post-content,
.post-detail.post-theme-neon .post-images,
.post-detail.post-theme-neon .post-mv,
.post-detail.post-theme-neon .comments-section,
.post-detail.post-theme-neon .comment-item,
.post-detail.post-theme-neon .comment-input-box {
  background: rgba(10, 18, 40, 0.78);
  border-color: rgba(92, 229, 255, 0.26);
  box-shadow: 0 0 24px rgba(0, 229, 255, 0.08);
}

.post-detail.post-theme-neon .post-title,
.post-detail.post-theme-neon .content-text,
.post-detail.post-theme-neon .section-title,
.post-detail.post-theme-neon .comment-text,
.post-detail.post-theme-neon .reply-text,
.post-detail.post-theme-neon .comment-username,
.post-detail.post-theme-neon .reply-username,
.post-detail.post-theme-neon .author-details .username,
.post-detail.post-theme-neon .mv-name {
  color: #effcff;
}

.post-detail.post-theme-neon .time,
.post-detail.post-theme-neon .comment-time,
.post-detail.post-theme-neon .reply-time,
.post-detail.post-theme-neon .stat-label,
.post-detail.post-theme-neon .stat-item {
  color: rgba(223, 247, 255, 0.78) !important;
}

.post-detail.post-theme-lava {
  background:
    radial-gradient(circle at top right, rgba(255, 150, 54, 0.24), transparent 28%),
    radial-gradient(circle at bottom left, rgba(255, 96, 64, 0.2), transparent 34%),
    linear-gradient(145deg, rgba(58, 24, 16, 0.98), rgba(99, 36, 19, 0.95), rgba(44, 16, 11, 0.96));
  border: 1px solid rgba(255, 167, 86, 0.3);
}

.post-detail.post-theme-lava::before {
  content: '';
  position: absolute;
  inset: -20% -12%;
  background:
    radial-gradient(circle at 18% 26%, rgba(255, 187, 92, 0.18), transparent 24%),
    radial-gradient(circle at 72% 68%, rgba(255, 92, 32, 0.22), transparent 28%),
    radial-gradient(circle at 56% 42%, rgba(255, 218, 118, 0.12), transparent 24%);
  pointer-events: none;
  z-index: 0;
}

.post-detail.post-theme-lava .post-header,
.post-detail.post-theme-lava .post-content,
.post-detail.post-theme-lava .post-images,
.post-detail.post-theme-lava .post-mv,
.post-detail.post-theme-lava .comments-section,
.post-detail.post-theme-lava .comment-item,
.post-detail.post-theme-lava .comment-input-box {
  background: rgba(74, 30, 18, 0.72);
  border-color: rgba(255, 165, 84, 0.24);
  color: #fff6ef;
}

.post-detail .post-header,
.post-detail .post-cover,
.post-detail .post-content,
.post-detail .post-images,
.post-detail .post-mv,
.post-detail .post-actions,
.post-detail .comments-section {
  position: relative;
  z-index: 1;
}

.post-detail.post-theme-lava .post-title,
.post-detail.post-theme-lava .content-text,
.post-detail.post-theme-lava .section-title,
.post-detail.post-theme-lava .comment-text,
.post-detail.post-theme-lava .reply-text,
.post-detail.post-theme-lava .comment-username,
.post-detail.post-theme-lava .reply-username,
.post-detail.post-theme-lava .author-details .username,
.post-detail.post-theme-lava .mv-name {
  color: #fff3ea;
}

.post-detail.post-theme-lava .time,
.post-detail.post-theme-lava .comment-time,
.post-detail.post-theme-lava .reply-time,
.post-detail.post-theme-lava .stat-label,
.post-detail.post-theme-lava .stat-item {
  color: rgba(255, 231, 214, 0.78) !important;
}

@media (max-width: 768px) {
  .post-detail.post-highlight::before {
    left: 20px;
    right: 20px;
    top: 14px;
  }
}
</style>

<style scoped lang="scss">
.post-detail-container {
  position: relative;
  overflow: hidden;
  z-index: 0;
  isolation: isolate;
  --detail-aura: rgba(126, 146, 255, 0.24);
}

.post-detail-container::before,
.post-detail-container::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.post-detail-container::before {
  z-index: 0;
}

.post-detail-container::after {
  z-index: 0;
  opacity: 0.92;
}

.post-detail-container .detail-content {
  position: relative;
  z-index: 1;
}

.post-detail-container .detail-content::before {
  content: '';
  position: absolute;
  inset: 56px 12px -18px;
  border-radius: 40px;
  background:
    radial-gradient(circle at 50% 0%, var(--detail-aura), transparent 56%),
    radial-gradient(circle at 50% 100%, rgba(255, 255, 255, 0.12), transparent 52%);
  filter: blur(28px);
  opacity: 0.95;
  z-index: -1;
}

.post-detail-container.detail-theme-starry {
  --detail-aura: rgba(121, 155, 255, 0.34);
  background:
    radial-gradient(circle at 14% 18%, rgba(126, 218, 255, 0.18), transparent 18%),
    radial-gradient(circle at 84% 14%, rgba(129, 148, 255, 0.22), transparent 20%),
    radial-gradient(circle at 74% 82%, rgba(211, 142, 255, 0.2), transparent 24%),
    radial-gradient(circle at 22% 78%, rgba(106, 129, 255, 0.16), transparent 18%),
    linear-gradient(135deg, #081128 0%, #161b47 32%, #2d2369 68%, #0c3154 100%);
  background-size:
    100% 100%,
    100% 100%,
    100% 100%,
    100% 100%,
    180% 180%;
  animation: detailThemeBgShift 16s ease-in-out infinite;
}

.post-detail-container.detail-theme-starry::before {
  background:
    radial-gradient(circle at 8% 12%, rgba(255, 255, 255, 0.96) 0 1.6px, transparent 2.6px),
    radial-gradient(circle at 20% 72%, rgba(199, 228, 255, 0.88) 0 1.8px, transparent 2.8px),
    radial-gradient(circle at 34% 22%, rgba(255, 255, 255, 0.95) 0 1.4px, transparent 2.4px),
    radial-gradient(circle at 44% 58%, rgba(147, 242, 255, 0.9) 0 1.7px, transparent 2.7px),
    radial-gradient(circle at 58% 16%, rgba(255, 210, 255, 0.88) 0 1.5px, transparent 2.5px),
    radial-gradient(circle at 66% 68%, rgba(255, 255, 255, 0.92) 0 1.8px, transparent 2.8px),
    radial-gradient(circle at 78% 34%, rgba(173, 183, 255, 0.9) 0 1.7px, transparent 2.7px),
    radial-gradient(circle at 88% 76%, rgba(255, 255, 255, 0.95) 0 1.6px, transparent 2.6px),
    radial-gradient(circle at 16% 44%, rgba(255, 247, 180, 0.78) 0 1.9px, transparent 2.9px),
    radial-gradient(circle at 82% 18%, rgba(172, 255, 241, 0.84) 0 1.8px, transparent 2.8px);
  background-size: 140% 140%;
  animation: detailThemeStarfield 18s linear infinite;
}

.post-detail-container.detail-theme-starry::after {
  inset: -12% -10%;
  background:
    linear-gradient(118deg, transparent 14%, rgba(255, 255, 255, 0.9) 16%, transparent 18%),
    linear-gradient(118deg, transparent 34%, rgba(131, 223, 255, 0.78) 36%, transparent 38%),
    linear-gradient(118deg, transparent 58%, rgba(255, 194, 255, 0.86) 60%, transparent 62%),
    linear-gradient(118deg, transparent 80%, rgba(170, 190, 255, 0.84) 82%, transparent 84%);
  background-size: 220% 220%;
  mix-blend-mode: screen;
  animation: detailThemeMeteorRain 9s linear infinite;
}

.post-detail-container.detail-theme-sakura {
  --detail-aura: rgba(255, 180, 222, 0.34);
  background:
    radial-gradient(circle at 14% 18%, rgba(255, 224, 238, 0.24), transparent 18%),
    radial-gradient(circle at 84% 16%, rgba(255, 190, 224, 0.26), transparent 20%),
    radial-gradient(circle at 72% 82%, rgba(244, 214, 255, 0.22), transparent 22%),
    radial-gradient(circle at 20% 78%, rgba(255, 206, 228, 0.18), transparent 18%),
    linear-gradient(135deg, #ffe7f1 0%, #ffd5e7 30%, #efd8ff 68%, #ddd4ff 100%);
  background-size:
    100% 100%,
    100% 100%,
    100% 100%,
    100% 100%,
    180% 180%;
  animation: detailThemeBgShift 14s ease-in-out infinite;
}

.post-detail-container.detail-theme-sakura::before {
  inset: -8% -4%;
  background:
    radial-gradient(ellipse 28px 16px at 8% 18%, rgba(255, 255, 255, 0.78), transparent 70%),
    radial-gradient(ellipse 24px 14px at 22% 64%, rgba(255, 189, 223, 0.76), transparent 70%),
    radial-gradient(ellipse 26px 15px at 34% 30%, rgba(255, 233, 244, 0.8), transparent 70%),
    radial-gradient(ellipse 22px 13px at 50% 82%, rgba(255, 166, 214, 0.7), transparent 70%),
    radial-gradient(ellipse 24px 14px at 62% 18%, rgba(255, 244, 248, 0.82), transparent 70%),
    radial-gradient(ellipse 28px 16px at 76% 56%, rgba(255, 182, 220, 0.76), transparent 70%),
    radial-gradient(ellipse 24px 14px at 88% 28%, rgba(255, 227, 241, 0.8), transparent 70%),
    radial-gradient(ellipse 26px 15px at 94% 76%, rgba(255, 164, 212, 0.68), transparent 70%);
  background-size: 140% 140%;
  animation: detailThemePetalStorm 14s linear infinite;
}

.post-detail-container.detail-theme-sakura::after {
  inset: -4%;
  background:
    linear-gradient(135deg, transparent 15%, rgba(255, 255, 255, 0.28) 48%, transparent 78%),
    radial-gradient(circle at 76% 18%, rgba(255, 255, 255, 0.52), transparent 28%),
    radial-gradient(circle at 18% 84%, rgba(255, 192, 225, 0.38), transparent 30%),
    repeating-linear-gradient(
      145deg,
      rgba(255, 183, 223, 0.18) 0 10px,
      rgba(255, 255, 255, 0) 10px 28px
    );
  mix-blend-mode: screen;
  animation: detailThemeSakuraSheen 10s linear infinite;
}

.post-detail-container.detail-theme-neon {
  --detail-aura: rgba(0, 245, 255, 0.28);
  background:
    radial-gradient(circle at 16% 18%, rgba(0, 245, 255, 0.18), transparent 18%),
    radial-gradient(circle at 86% 18%, rgba(255, 0, 255, 0.16), transparent 18%),
    radial-gradient(circle at 74% 84%, rgba(109, 122, 255, 0.16), transparent 20%),
    linear-gradient(135deg, #09111f 0%, #170e2b 32%, #102c47 68%, #250f44 100%);
  background-size:
    100% 100%,
    100% 100%,
    100% 100%,
    100% 100%,
    190% 190%;
  animation: detailThemeBgShift 11s ease-in-out infinite;
}

.post-detail-container.detail-theme-neon::before {
  background:
    linear-gradient(rgba(0, 245, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 0, 255, 0.08) 1px, transparent 1px),
    linear-gradient(135deg, transparent 0%, rgba(0, 245, 255, 0.12) 50%, transparent 100%);
  background-size: 46px 46px, 46px 46px, 220% 220%;
  mix-blend-mode: screen;
  animation: detailThemeNeonGrid 10s linear infinite;
}

.post-detail-container.detail-theme-neon::after {
  inset: -12% -18%;
  background:
    linear-gradient(90deg, transparent 0%, rgba(0, 245, 255, 0.24) 34%, transparent 60%),
    linear-gradient(90deg, transparent 20%, rgba(255, 0, 255, 0.2) 48%, transparent 74%);
  background-size: 180% 180%;
  mix-blend-mode: screen;
  animation: detailThemeNeonBeam 4.6s linear infinite;
}

.post-detail-container.detail-theme-lava {
  --detail-aura: rgba(255, 136, 52, 0.3);
  background:
    radial-gradient(circle at 16% 20%, rgba(255, 193, 104, 0.22), transparent 18%),
    radial-gradient(circle at 84% 16%, rgba(255, 115, 58, 0.22), transparent 20%),
    radial-gradient(circle at 76% 82%, rgba(255, 210, 132, 0.18), transparent 22%),
    radial-gradient(circle at 26% 78%, rgba(255, 142, 64, 0.16), transparent 18%),
    linear-gradient(135deg, #311008 0%, #61190d 28%, #a63716 62%, #4f170f 100%);
  background-size:
    100% 100%,
    100% 100%,
    100% 100%,
    100% 100%,
    190% 190%;
  animation: detailThemeBgShift 10s ease-in-out infinite;
}

.post-detail-container.detail-theme-lava::before {
  inset: -10% -6%;
  background:
    radial-gradient(circle at 18% 28%, rgba(255, 188, 88, 0.28), transparent 18%),
    radial-gradient(circle at 38% 66%, rgba(255, 97, 36, 0.24), transparent 20%),
    radial-gradient(circle at 68% 38%, rgba(255, 229, 130, 0.18), transparent 18%),
    radial-gradient(circle at 82% 74%, rgba(255, 108, 28, 0.24), transparent 20%),
    radial-gradient(circle at 54% 48%, rgba(255, 243, 165, 0.12), transparent 18%);
  filter: blur(6px);
  animation: detailThemeLavaGlow 8s ease-in-out infinite;
}

.post-detail-container.detail-theme-lava::after {
  inset: -4%;
  background:
    repeating-linear-gradient(
      118deg,
      rgba(255, 217, 133, 0) 0 16px,
      rgba(255, 217, 133, 0.14) 16px 18px,
      rgba(255, 115, 43, 0.22) 18px 22px,
      rgba(255, 217, 133, 0) 22px 42px
    ),
    linear-gradient(135deg, transparent 0%, rgba(255, 180, 71, 0.14) 50%, transparent 100%);
  mix-blend-mode: screen;
  animation: detailThemeLavaCrack 6.5s linear infinite;
}

.post-detail-container .post-detail.post-highlight {
  outline: none;
  border: none;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);
}

.post-detail-container .post-detail.post-highlight::before {
  display: none;
}

.post-detail-container .post-detail.post-highlight .title-row .tag-highlight {
  display: none;
}

.post-detail-container .post-detail[class*='post-theme-'] {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 255, 0.95));
  border: none;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);
  overflow: visible;
}

.post-detail-container .post-detail[class*='post-theme-']::before,
.post-detail-container .post-detail[class*='post-theme-']::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.post-detail-container .post-detail[class*='post-theme-']::before {
  inset: -12px;
  border-radius: 34px;
  z-index: -1;
}

.post-detail-container .post-detail[class*='post-theme-']::after {
  top: 18px;
  right: 26px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  z-index: 2;
}

.post-detail-container .post-detail[class*='post-theme-'] .post-header,
.post-detail-container .post-detail[class*='post-theme-'] .post-content,
.post-detail-container .post-detail[class*='post-theme-'] .post-images,
.post-detail-container .post-detail[class*='post-theme-'] .post-mv,
.post-detail-container .post-detail[class*='post-theme-'] .comments-section,
.post-detail-container .post-detail[class*='post-theme-'] .comment-item,
.post-detail-container .post-detail[class*='post-theme-'] .comment-input-box {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 251, 255, 0.92)) !important;
  border-color: rgba(232, 236, 245, 0.92) !important;
  color: inherit !important;
  box-shadow: none !important;
}

.post-detail-container .post-detail[class*='post-theme-'] .post-title,
.post-detail-container .post-detail[class*='post-theme-'] .content-text,
.post-detail-container .post-detail[class*='post-theme-'] .section-title,
.post-detail-container .post-detail[class*='post-theme-'] .comment-text,
.post-detail-container .post-detail[class*='post-theme-'] .reply-text,
.post-detail-container .post-detail[class*='post-theme-'] .comment-username,
.post-detail-container .post-detail[class*='post-theme-'] .reply-username,
.post-detail-container .post-detail[class*='post-theme-'] .author-details .username,
.post-detail-container .post-detail[class*='post-theme-'] .mv-name {
  color: #2f3447 !important;
  text-shadow: none !important;
}

.post-detail-container .post-detail[class*='post-theme-'] .time,
.post-detail-container .post-detail[class*='post-theme-'] .comment-time,
.post-detail-container .post-detail[class*='post-theme-'] .reply-time,
.post-detail-container .post-detail[class*='post-theme-'] .stat-label,
.post-detail-container .post-detail[class*='post-theme-'] .stat-item {
  color: #7b8399 !important;
}

.post-detail-container .post-detail[class*='post-theme-'] .post-cover,
.post-detail-container .post-detail[class*='post-theme-'] .post-cover::before,
.post-detail-container .post-detail[class*='post-theme-'] .post-cover::after {
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.08) !important;
  border: none !important;
}

.post-detail-container .post-detail[class*='post-theme-'] .post-cover::before,
.post-detail-container .post-detail[class*='post-theme-'] .post-cover::after {
  content: none !important;
}

.post-detail-container .post-detail.post-theme-starry::before {
  inset: -14px;
  border: 1px solid rgba(154, 188, 255, 0.4);
  background:
    radial-gradient(circle at 12% 18%, rgba(255, 255, 255, 0.86) 0 2px, transparent 3px),
    radial-gradient(circle at 24% 72%, rgba(160, 227, 255, 0.8) 0 2px, transparent 3px),
    radial-gradient(circle at 56% 20%, rgba(255, 214, 255, 0.78) 0 2px, transparent 3px),
    radial-gradient(circle at 82% 34%, rgba(255, 255, 255, 0.9) 0 1.8px, transparent 2.8px),
    linear-gradient(125deg, rgba(81, 112, 255, 0.18), rgba(255, 255, 255, 0.04));
  box-shadow:
    0 0 0 1px rgba(201, 224, 255, 0.18),
    0 0 30px rgba(108, 138, 255, 0.28),
    0 0 70px rgba(111, 79, 255, 0.16);
  animation: detailCardStarFrame 7s linear infinite;
}

.post-detail-container .post-detail.post-theme-starry::after {
  content: 'STARFIELD';
  color: #eaf2ff;
  background: rgba(35, 48, 108, 0.68);
  border: 1px solid rgba(173, 210, 255, 0.34);
  box-shadow: 0 10px 24px rgba(48, 70, 160, 0.26);
}

.post-detail-container .post-detail.post-theme-sakura::before {
  inset: -14px;
  border: 1px solid rgba(255, 184, 223, 0.52);
  background:
    radial-gradient(ellipse 28px 16px at 10% 20%, rgba(255, 247, 250, 0.76), transparent 70%),
    radial-gradient(ellipse 26px 15px at 24% 78%, rgba(255, 188, 224, 0.72), transparent 70%),
    radial-gradient(ellipse 22px 13px at 56% 16%, rgba(255, 224, 239, 0.78), transparent 70%),
    radial-gradient(ellipse 28px 16px at 84% 66%, rgba(255, 164, 214, 0.68), transparent 70%),
    linear-gradient(135deg, rgba(255, 199, 230, 0.24), rgba(255, 255, 255, 0.06));
  box-shadow:
    0 0 0 1px rgba(255, 242, 248, 0.5),
    0 0 28px rgba(255, 175, 221, 0.28),
    0 0 68px rgba(255, 217, 237, 0.2);
  animation: detailCardPetalFrame 6.5s ease-in-out infinite;
}

.post-detail-container .post-detail.post-theme-sakura::after {
  content: 'BLOSSOM';
  color: #9d336d;
  background: rgba(255, 244, 249, 0.88);
  border: 1px solid rgba(255, 191, 226, 0.6);
  box-shadow: 0 10px 22px rgba(255, 187, 223, 0.24);
}

.post-detail-container .post-detail.post-theme-neon::before {
  inset: -14px;
  border: 1px solid rgba(0, 245, 255, 0.46);
  background:
    linear-gradient(rgba(0, 245, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 0, 255, 0.12) 1px, transparent 1px),
    linear-gradient(135deg, rgba(0, 245, 255, 0.16), rgba(255, 0, 255, 0.1));
  background-size: 28px 28px, 28px 28px, 100% 100%;
  box-shadow:
    0 0 0 1px rgba(255, 0, 255, 0.2),
    0 0 28px rgba(0, 245, 255, 0.28),
    0 0 74px rgba(255, 0, 255, 0.18);
  animation: detailCardNeonFrame 4.8s linear infinite;
}

.post-detail-container .post-detail.post-theme-neon::after {
  content: 'NEON';
  color: #dffcff;
  background: rgba(9, 19, 36, 0.82);
  border: 1px solid rgba(0, 245, 255, 0.44);
  box-shadow:
    0 0 18px rgba(0, 245, 255, 0.26),
    0 0 34px rgba(255, 0, 255, 0.14);
}

.post-detail-container .post-detail.post-theme-lava::before {
  inset: -14px;
  border: 1px solid rgba(255, 176, 94, 0.5);
  background:
    radial-gradient(circle at 16% 20%, rgba(255, 217, 137, 0.34), transparent 18%),
    radial-gradient(circle at 32% 78%, rgba(255, 115, 39, 0.28), transparent 20%),
    radial-gradient(circle at 66% 30%, rgba(255, 236, 164, 0.22), transparent 18%),
    radial-gradient(circle at 86% 72%, rgba(255, 97, 28, 0.28), transparent 20%),
    repeating-linear-gradient(
      120deg,
      rgba(255, 226, 151, 0) 0 18px,
      rgba(255, 226, 151, 0.16) 18px 20px,
      rgba(255, 110, 34, 0.18) 20px 24px,
      rgba(255, 226, 151, 0) 24px 42px
    );
  box-shadow:
    0 0 0 1px rgba(255, 226, 162, 0.24),
    0 0 30px rgba(255, 115, 28, 0.26),
    0 0 72px rgba(255, 193, 95, 0.16);
  animation: detailCardLavaFrame 5.2s ease-in-out infinite;
}

.post-detail-container .post-detail.post-theme-lava::after {
  content: 'LAVA';
  color: #fff3e8;
  background: rgba(109, 34, 15, 0.82);
  border: 1px solid rgba(255, 182, 104, 0.4);
  box-shadow: 0 12px 28px rgba(133, 40, 11, 0.28);
}

@keyframes detailThemeFloat {
  0% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(-6px, 8px, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}

@keyframes detailThemeDrift {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  50% {
    transform: translate3d(8px, -6px, 0) rotate(1deg);
  }
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
}

@keyframes detailThemePulse {
  0%,
  100% {
    filter: saturate(1) brightness(1);
  }
  50% {
    filter: saturate(1.15) brightness(1.05);
  }
}

@keyframes detailThemeLava {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(6px, -4px, 0) scale(1.03);
  }
}

@keyframes detailThemeBgShift {
  0%,
  100% {
    background-position: 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%;
  }
  50% {
    background-position: 8% 4%, 94% 8%, 92% 94%, 6% 92%, 100% 50%;
  }
}

@keyframes detailThemeStarfield {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.9;
  }
  50% {
    transform: translate3d(-22px, 14px, 0) scale(1.04);
    opacity: 1;
  }
}

@keyframes detailThemeMeteorRain {
  0%,
  20% {
    background-position: 110% -20%, 120% -30%, 130% -10%, 140% -40%;
    opacity: 0;
  }
  25%,
  70% {
    opacity: 0.95;
  }
  100% {
    background-position: -10% 110%, -20% 120%, -30% 100%, -20% 130%;
    opacity: 0;
  }
}

@keyframes detailThemePetalStorm {
  0%,
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  50% {
    transform: translate3d(-24px, 18px, 0) rotate(8deg);
  }
}

@keyframes detailThemeSakuraSheen {
  0%,
  100% {
    background-position: 0% 0%, 100% 0%, 0% 100%, 0 0;
    opacity: 0.88;
  }
  50% {
    background-position: 100% 100%, 60% 10%, 100% 0%, 120px 0;
    opacity: 1;
  }
}

@keyframes detailThemeNeonGrid {
  0% {
    background-position: 0 0, 0 0, 0% 0%;
  }
  100% {
    background-position: 46px 46px, -46px 46px, 100% 100%;
  }
}

@keyframes detailThemeNeonBeam {
  0% {
    background-position: 160% 0%, -80% 0%;
    opacity: 0.25;
  }
  25%,
  65% {
    opacity: 0.9;
  }
  100% {
    background-position: -60% 0%, 180% 0%;
    opacity: 0.22;
  }
}

@keyframes detailThemeLavaGlow {
  0%,
  100% {
    transform: scale(1) translate3d(0, 0, 0);
    opacity: 0.88;
  }
  50% {
    transform: scale(1.08) translate3d(12px, -10px, 0);
    opacity: 1;
  }
}

@keyframes detailThemeLavaCrack {
  0%,
  100% {
    background-position: 0 0, 0% 0%;
    opacity: 0.72;
  }
  50% {
    background-position: 120px 40px, 100% 100%;
    opacity: 0.96;
  }
}

@keyframes detailCardStarFrame {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
    filter: saturate(1) brightness(1);
  }
  50% {
    transform: translate3d(0, -4px, 0);
    filter: saturate(1.14) brightness(1.06);
  }
}

@keyframes detailCardPetalFrame {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
    filter: saturate(1) brightness(1);
  }
  50% {
    transform: rotate(0.4deg) scale(1.01);
    filter: saturate(1.12) brightness(1.04);
  }
}

@keyframes detailCardNeonFrame {
  0% {
    background-position: 0 0, 0 0, 0% 0%;
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.08);
  }
  100% {
    background-position: 28px 28px, -28px 28px, 100% 100%;
    filter: brightness(1);
  }
}

@keyframes detailCardLavaFrame {
  0%,
  100% {
    transform: scale(1) translate3d(0, 0, 0);
    filter: saturate(1) brightness(1);
  }
  50% {
    transform: scale(1.01) translate3d(0, -3px, 0);
    filter: saturate(1.14) brightness(1.08);
  }
}
</style>
