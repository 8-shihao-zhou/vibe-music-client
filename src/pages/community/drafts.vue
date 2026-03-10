<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPostList, deletePost } from '@/api/community'
import { UserStore } from '@/stores/modules/user'

const router = useRouter()
const route = useRoute()
const userStore = UserStore()

const loading = ref(false)
const draftList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取草稿列表
const fetchDrafts = async () => {
  if (!userStore.userInfo?.userId) {
    ElMessage.warning('请先登录')
    router.push('/community')
    return
  }

  loading.value = true
  try {
    const res = await getPostList({
      userId: userStore.userInfo.userId,
      status: 0, // 只查询草稿
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    })

    if (res.code === 0 && res.data) {
      draftList.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取草稿列表失败')
    }
  } catch (error) {
    console.error('获取草稿列表异常:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 编辑草稿
const handleEdit = (draftId: number) => {
  router.push(`/community/edit/${draftId}`)
}

// 删除草稿
const handleDelete = async (draft: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除草稿【${draft.title}】吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const res = await deletePost(draft.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchDrafts()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除草稿失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 返回社区
const goBack = () => {
  router.push('/community')
}

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchDrafts()
}

// 监听路由变化，从其他页面返回时刷新
watch(
  () => route.path,
  (newPath, oldPath) => {
    // 当路由变为 /community/drafts 时刷新（从编辑页返回）
    if (
      newPath === '/community/drafts' &&
      oldPath &&
      oldPath !== '/community/drafts'
    ) {
      fetchDrafts()
    }
  }
)

// 监听用户信息变化（切换账号时刷新）
watch(
  () => userStore.userInfo?.userId,
  (newUserId, oldUserId) => {
    if (newUserId && newUserId !== oldUserId) {
      fetchDrafts()
    }
  }
)

onMounted(() => {
  fetchDrafts()
})
</script>

<template>
  <div class="drafts-container">
    <div class="drafts-content">
      <!-- 头部 -->
      <div class="drafts-header">
        <el-button class="back-btn" @click="goBack">
          <i class="i-carbon-arrow-left mr-1" />
          返回社区
        </el-button>
        <h1 class="title">我的草稿</h1>
        <p class="subtitle">共 {{ total }} 篇草稿</p>
      </div>

      <!-- 草稿列表 -->
      <div v-loading="loading" class="draft-list">
        <div v-for="draft in draftList" :key="draft.id" class="draft-card">
          <div class="draft-content">
            <h3 class="draft-title">{{ draft.title }}</h3>
            <p class="draft-excerpt">
              {{ draft.content.substring(0, 100) }}...
            </p>
            <div class="draft-meta">
              <span class="time">
                <i class="i-carbon-time" />
                {{ formatTime(draft.updateTime || draft.createTime) }}
              </span>
            </div>
          </div>
          <div class="draft-actions">
            <el-button type="primary" @click="handleEdit(draft.id)">
              编辑
            </el-button>
            <el-button type="danger" plain @click="handleDelete(draft)">
              删除
            </el-button>
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="!loading && draftList.length === 0"
          description="暂无草稿"
        >
          <el-button type="primary" @click="router.push('/community/create')">
            去发布帖子
          </el-button>
        </el-empty>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.drafts-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.drafts-content {
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.drafts-header {
  margin-bottom: 32px;

  .back-btn {
    margin-bottom: 16px;
  }

  .title {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 8px 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0;
  }
}

.draft-list {
  min-height: 400px;

  .draft-card {
    background: var(--el-fill-color-light);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-fill-color);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .draft-content {
      flex: 1;
      margin-right: 20px;

      .draft-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 12px 0;
        color: var(--el-text-color-primary);
      }

      .draft-excerpt {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        line-height: 1.6;
        margin: 0 0 12px 0;
      }

      .draft-meta {
        display: flex;
        align-items: center;
        gap: 16px;

        .time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--el-text-color-secondary);

          i {
            font-size: 14px;
          }
        }
      }
    }

    .draft-actions {
      display: flex;
      gap: 12px;
      flex-shrink: 0;
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>
