<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { searchTags } from '@/api/community'

const router = useRouter()
const loading = ref(false)
const tagList = ref<any[]>([])
const keyword = ref('')
const currentPage = ref(1)
const pageSize = ref(40)
const total = ref(0)

const fetchTags = async () => {
  loading.value = true
  try {
    const res = await searchTags(
      keyword.value,
      currentPage.value,
      pageSize.value
    )
    if (res.code === 0 && res.data) {
      tagList.value = (res.data as any).records || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取标签列表失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchTags()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchTags()
}

const goToTagPosts = (tagName: string) => {
  router.push(`/community?tag=${encodeURIComponent(tagName)}`)
}

const goBack = () => router.back()

onMounted(fetchTags)
</script>

<template>
  <div class="tags-page">
    <div class="page-container">
      <div class="page-header">
        <el-button class="back-btn" @click="goBack">
          <i class="i-carbon-arrow-left mr-1" />
          返回
        </el-button>
        <h1 class="page-title">
          <i class="i-carbon-tag mr-2" />
          标签广场
        </h1>
        <p class="page-subtitle">探索热门话题，发现精彩内容</p>
      </div>

      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索标签..."
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <i class="i-carbon-search" />
          </template>
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div v-loading="loading" class="tags-grid">
        <div
          v-for="tag in tagList"
          :key="tag.tagName"
          class="tag-card"
          @click="goToTagPosts(tag.tagName)"
        >
          <div class="tag-icon">
            <i class="i-carbon-tag" />
          </div>
          <div class="tag-info">
            <h3 class="tag-name"># {{ tag.tagName }}</h3>
            <div class="tag-stats">
              <span class="stat">{{ tag.postCount || 0 }} 帖子</span>
              <span class="stat-divider">·</span>
              <span class="stat">{{ tag.useCount || 0 }} 次使用</span>
            </div>
          </div>
        </div>
        <el-empty
          v-if="!loading && tagList.length === 0"
          description="暂无标签"
        />
      </div>

      <div v-if="total > pageSize" class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tags-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%);
  padding: 24px;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;

  .back-btn {
    margin-bottom: 16px;
    border-radius: 8px;
  }

  .page-title {
    font-size: 32px;
    font-weight: 700;
    color: #2c3e50;
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;

    i {
      font-size: 36px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .page-subtitle {
    font-size: 14px;
    color: #95a5a6;
    margin: 0;
  }
}

.search-bar {
  margin-bottom: 32px;

  .search-input {
    max-width: 600px;
  }
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  min-height: 400px;

  .tag-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);

      .tag-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
    }

    .tag-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      i {
        font-size: 28px;
        color: #667eea;
      }
    }

    .tag-info {
      flex: 1;

      .tag-name {
        font-size: 18px;
        font-weight: 600;
        color: #2c3e50;
        margin: 0 0 8px 0;
      }

      .tag-stats {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #7f8c8d;

        .stat-divider {
          color: #bdc3c7;
        }
      }
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>
