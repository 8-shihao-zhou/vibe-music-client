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
watch(
  () => route.params.id,
  (newId, oldId) => {
    // 只有当路由路径是帖子详情页（/community/:id）且ID发生变化时才刷新
    // 避免跳转到其他页面（如 /community/user/:id、/community/favorite）时触发
    if (
      route.path.startsWith('/community/') &&
      !route.path.includes('/user/') &&
      !route.path.includes('/create') &&
      !route.path.includes('/drafts') &&
      !route.path.includes('/favorite') &&
      newId &&
      newId !== oldId
    ) {
      console.log('>>> [路由监听] 帖子ID变化:', oldId, '->', newId)
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
  <div class="post-detail-container">
    <div v-loading="loading" class="detail-content">
      <!-- 返回按钮 -->
      <el-button class="back-btn" @click="goBack">
        <i class="i-carbon-arrow-left mr-1" />
        返回
      </el-button>

      <div v-if="post" class="post-detail">
        <!-- 帖子头部 -->
        <div class="post-header">
          <div class="title-row">
            <span v-if="post.isTop" class="tag-top">置顶</span>
            <span v-if="post.isHot" class="tag-hot">热门</span>
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

        <!-- 操作栏 -->
        <div class="post-actions" style="display: flex; gap: 12px">
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
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.back-btn {
  margin-bottom: 20px;
}

.post-detail {
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  .post-header {
    margin-bottom: 24px;

    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
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
        font-size: 28px;
        font-weight: 700;
        margin: 0;
        color: var(--el-text-color-primary);
      }
    }

    .post-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;

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
        gap: 20px;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: var(--el-text-color-secondary);

          i {
            font-size: 18px;
          }

          .stat-label {
            font-size: 13px;
            color: var(--el-text-color-regular);
          }
        }
      }

      .meta-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .report-btn {
        color: #909399;
        font-size: 14px;

        &:hover {
          color: #f56c6c;
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
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 24px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .post-content {
    margin-bottom: 32px;

    .content-text {
      font-size: 16px;
      line-height: 1.8;
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }

  .post-actions {
    padding: 20px 0;
    border-top: 1px solid var(--el-border-color-light);
    border-bottom: 1px solid var(--el-border-color-light);
    margin-bottom: 32px;

    .action-btn {
      padding: 12px 24px;
      font-size: 14px;
      border-radius: 12px;
    }
  }

  .comments-section {
    .section-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: var(--el-text-color-primary);
    }

    .comment-input-box {
      margin-bottom: 32px;

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
            border-left: 2px solid var(--el-border-color-lighter);

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

.comment-footer, .reply-footer { .like-btn { transition: all 0.3s ease; &:hover
{ transform: scale(1.1); } &.el-button--primary { color: #667eea; } i {
font-size: 16px; margin-right: 4px; } } }

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
</style>
