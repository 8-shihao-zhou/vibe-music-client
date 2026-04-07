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
      status: 0,
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

const handleEdit = (draftId: number) => {
  router.push(`/community/edit/${draftId}`)
}

const handleDelete = async (draft: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除草稿《${draft.title || '未命名草稿'}》吗？`, '删除草稿', {
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

const goBack = () => {
  router.push('/community')
}

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

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchDrafts()
}

watch(
  () => route.path,
  (newPath, oldPath) => {
    if (
      newPath === '/community/drafts' &&
      oldPath &&
      oldPath !== '/community/drafts'
    ) {
      fetchDrafts()
    }
  }
)

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
      <section class="drafts-hero">
        <div class="hero-main">
          <el-button class="back-btn" @click="goBack">
            <i class="i-carbon-arrow-left mr-1" />
            返回社区
          </el-button>
          <p class="hero-kicker">Draft Studio</p>
          <h1 class="title">我的草稿</h1>
          <p class="subtitle">把还没准备公开的想法先留在这里，随时续写、调整或发布。</p>
        </div>
        <div class="hero-side">
          <div class="hero-stat">
            <span>草稿总数</span>
            <strong>{{ total }}</strong>
          </div>
          <el-button type="primary" round @click="router.push('/community/create')">
            新建帖子
          </el-button>
        </div>
      </section>

      <div v-loading="loading" class="draft-list">
        <div v-for="draft in draftList" :key="draft.id" class="draft-card">
          <div class="draft-content">
            <div class="draft-topline">
              <span class="draft-badge">未发布</span>
              <span class="draft-time">
                <i class="i-carbon-time" />
                {{ formatTime(draft.updateTime || draft.createTime) }}
              </span>
            </div>
            <h3 class="draft-title">{{ draft.title || '未命名草稿' }}</h3>
            <p class="draft-excerpt">
              {{ (draft.content || '').substring(0, 120)
              }}{{ (draft.content || '').length > 120 ? '...' : '' }}
            </p>
            <div class="draft-meta">
              <span class="meta-chip">分类 {{ draft.category || '默认' }}</span>
              <span class="meta-chip">字数 {{ (draft.content || '').length }}</span>
            </div>
          </div>

          <div class="draft-actions">
            <el-button class="edit-btn" type="primary" @click="handleEdit(draft.id)">
              继续编辑
            </el-button>
            <el-button class="delete-btn" @click="handleDelete(draft)">删除</el-button>
          </div>
        </div>

        <el-empty
          v-if="!loading && draftList.length === 0"
          description="暂时还没有草稿"
        >
          <el-button type="primary" @click="router.push('/community/create')">
            去创建帖子
          </el-button>
        </el-empty>
      </div>

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
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 255, 0.94));
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.08);
}

.drafts-hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  padding: 24px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.85), transparent 36%),
    linear-gradient(135deg, rgba(236, 245, 255, 0.96), rgba(252, 242, 231, 0.92));
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.hero-main {
  flex: 1;
}

.back-btn {
  margin-bottom: 16px;
  border-radius: 999px;
  border: 1px solid rgba(87, 114, 239, 0.12);
  background: rgba(255, 255, 255, 0.78);
}

.hero-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  color: #6d73d5;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #2f3447;
}

.subtitle {
  max-width: 560px;
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #6b7280;
}

.hero-side {
  min-width: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
}

.hero-stat {
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.08);
}

.hero-stat span {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #7b8399;
}

.hero-stat strong {
  font-size: 30px;
  color: #2f3447;
}

.draft-list {
  min-height: 400px;
}

.draft-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  padding: 22px;
  margin-bottom: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(231, 235, 245, 0.9);
  transition: all 0.3s ease;
}

.draft-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 32px rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.14);
}

.draft-content {
  flex: 1;
}

.draft-topline {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.draft-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.12);
  color: #5960c9;
  font-size: 12px;
  font-weight: 600;
}

.draft-time {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #8a93a8;
  font-size: 12px;
}

.draft-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2f3447;
}

.draft-excerpt {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.8;
  margin: 0 0 12px 0;
}

.draft-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.meta-chip {
  padding: 6px 12px;
  border-radius: 999px;
  background: #f4f6fb;
  color: #7b8399;
  font-size: 12px;
}

.draft-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  align-self: center;
}

.edit-btn,
.delete-btn {
  min-width: 96px;
  border-radius: 999px;
}

.delete-btn {
  background: #fff4f4;
  border: 1px solid #ffd8d8;
  color: #d95c61;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

@media (max-width: 768px) {
  .drafts-content {
    padding: 22px;
  }

  .drafts-hero,
  .draft-card {
    flex-direction: column;
  }

  .hero-side,
  .draft-actions {
    width: 100%;
  }

  .draft-actions {
    justify-content: flex-end;
  }
}
</style>
