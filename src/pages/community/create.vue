<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createPost, updatePost, getPostDetail } from '@/api/community'
import { UserStore } from '@/stores/modules/user'
import ImageUploader from '@/components/ImageUploader.vue'
import MvSelector from '@/components/MvSelector.vue'

const router = useRouter()
const route = useRoute()
const userStore = UserStore()

const isEditMode = ref(false)
const postId = ref<number | null>(null)

const formData = reactive({
  title: '',
  content: '',
  category: 'SHARE',
  tags: '',
  coverUrl: '',
  images: [] as string[],
  mvId: null as number | null,
  status: 1,
})

const categories = [
  { label: '创作分享', value: 'SHARE' },
  { label: '技术交流', value: 'TECH' },
  { label: '问答互助', value: 'QA' },
  { label: '闲聊讨论', value: 'CHAT' },
]

const submitting = ref(false)
const loading = ref(false)

const loadPostDetail = async (id: number) => {
  loading.value = true
  try {
    const res = await getPostDetail(id)
    if (res.code === 0 && res.data) {
      const post = res.data
      formData.title = post.title
      formData.content = post.content
      formData.category = post.category
      formData.coverUrl = post.coverUrl || ''

      if (post.tags) {
        try {
          const tagsArray = JSON.parse(post.tags)
          formData.tags = tagsArray.join(', ')
        } catch (e) {
          formData.tags = ''
        }
      }

      if (post.images && Array.isArray(post.images)) {
        formData.images = post.images
      }

      if (post.mv && post.mv.mvId) {
        formData.mvId = post.mv.mvId
      }
    } else {
      ElMessage.error('加载帖子失败')
      router.push('/community')
    }
  } catch (error) {
    console.error('加载帖子失败:', error)
    ElMessage.error('加载帖子失败')
    router.push('/community')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.title = ''
  formData.content = ''
  formData.category = 'SHARE'
  formData.tags = ''
  formData.coverUrl = ''
  formData.images = []
  formData.mvId = null
  isEditMode.value = false
  postId.value = null
}

const handleSubmit = async (isDraft = false) => {
  if (!formData.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }

  if (!formData.content.trim()) {
    ElMessage.warning('请输入内容')
    return
  }

  submitting.value = true
  try {
    let tagsJson = ''
    if (formData.tags.trim()) {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)
      tagsJson = JSON.stringify(tagsArray)
    }

    let res
    if (isEditMode.value && postId.value) {
      res = await updatePost({
        id: postId.value,
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: tagsJson,
        coverUrl: formData.coverUrl,
        status: isDraft ? 0 : 1,
      })
    } else {
      res = await createPost({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: tagsJson,
        coverUrl: formData.coverUrl,
        images: formData.images,
        mvId: formData.mvId,
        status: isDraft ? 0 : 1,
      })
    }

    if (res.code === 0) {
      ElMessage.success(
        isDraft ? '保存草稿成功' : isEditMode.value ? '更新成功' : '发布成功'
      )

      if (!isDraft) {
        resetForm()
        router.push('/community')
      } else if (!isEditMode.value && res.data) {
        const newPostId = res.data.id || res.data
        if (newPostId) {
          isEditMode.value = true
          postId.value = newPostId
          router.replace(`/community/edit/${newPostId}`)
        }
      }
    } else {
      ElMessage.error(res.message || (isDraft ? '保存失败' : '发布失败'))
    }
  } catch (error) {
    console.error('提交帖子失败:', error)
    ElMessage.error(isDraft ? '保存失败' : '发布失败')
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  resetForm()
  router.push('/community')
}

onMounted(() => {
  if (!userStore.userInfo?.userId) {
    ElMessage.warning('请先登录')
    router.push('/community')
    return
  }

  const id = route.params.id
  if (id) {
    isEditMode.value = true
    postId.value = Number(id)
    loadPostDetail(postId.value)
  } else {
    resetForm()
  }
})

watch(
  () => route.params.id,
  newId => {
    if (newId) {
      isEditMode.value = true
      postId.value = Number(newId)
      loadPostDetail(postId.value)
    } else {
      resetForm()
    }
  }
)
</script>

<template>
  <div class="create-post-container">
    <div v-loading="loading" class="create-content">
      <section class="create-header">
        <el-button class="back-btn" @click="goBack">
          <i class="i-carbon-arrow-left mr-1" />
          返回社区
        </el-button>
        <p class="header-kicker">{{ isEditMode ? 'Edit Post' : 'Create Post' }}</p>
        <h1 class="title">{{ isEditMode ? '编辑帖子' : '发布帖子' }}</h1>
        <p class="header-desc">
          用更完整的标题、封面和内容，把你的观点与作品展示得更清楚一些。
        </p>
      </section>

      <el-form :model="formData" label-width="80px" class="create-form">
        <div class="form-panel">
          <div class="panel-head">
            <h3>基础信息</h3>
            <p>先补充标题、分类和标签，让帖子更容易被看到。</p>
          </div>

          <el-form-item label="标题" required>
            <el-input
              v-model="formData.title"
              placeholder="请输入帖子标题"
              maxlength="200"
              show-word-limit
              size="large"
            />
          </el-form-item>

          <el-form-item label="分类" required>
            <el-radio-group v-model="formData.category">
              <el-radio
                v-for="cat in categories"
                :key="cat.value"
                :label="cat.value"
                border
              >
                {{ cat.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="标签">
            <el-input
              v-model="formData.tags"
              placeholder="输入标签，用逗号分隔，例如：AI-MV, 新手, 分享"
              maxlength="100"
            />
            <div class="form-tip">标签能帮助其他用户更快理解帖子主题。</div>
          </el-form-item>
        </div>

        <div class="form-panel">
          <div class="panel-head">
            <h3>封面与内容</h3>
            <p>封面负责第一眼印象，正文负责把想法说完整。</p>
          </div>

          <el-form-item label="封面图">
            <el-input
              v-model="formData.coverUrl"
              placeholder="请输入封面图 URL（可选）"
            />
            <div v-if="formData.coverUrl" class="cover-preview">
              <img :src="formData.coverUrl" alt="封面预览" />
            </div>
          </el-form-item>

          <el-form-item label="内容" required>
            <el-input
              v-model="formData.content"
              type="textarea"
              :rows="15"
              placeholder="分享你的想法、经验、问题或作品说明..."
              maxlength="10000"
              show-word-limit
            />
          </el-form-item>
        </div>

        <div v-if="!isEditMode" class="form-panel">
          <div class="panel-head">
            <h3>素材补充</h3>
            <p>你可以继续补充图片或 MV，让帖子展示更完整。</p>
          </div>

          <el-form-item label="图片">
            <ImageUploader v-model="formData.images" :max-count="9" />
          </el-form-item>

          <el-form-item label="MV作品">
            <MvSelector v-model="formData.mvId" />
          </el-form-item>
        </div>

        <el-form-item>
          <div class="form-actions">
            <el-button class="cancel-btn" @click="goBack">取消</el-button>
            <el-button class="draft-btn" :loading="submitting" @click="handleSubmit(true)">
              保存草稿
            </el-button>
            <el-button
              class="submit-btn"
              type="primary"
              :loading="submitting"
              @click="handleSubmit(false)"
            >
              {{ isEditMode ? '更新帖子' : '立即发布' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.create-post-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.create-content {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 255, 0.95));
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 22px 46px rgba(15, 23, 42, 0.08);
}

.create-header {
  margin-bottom: 32px;
  padding: 26px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.86), transparent 36%),
    linear-gradient(135deg, rgba(238, 245, 255, 0.96), rgba(255, 242, 232, 0.92));
}

.back-btn {
  margin-bottom: 16px;
  border-radius: 999px;
  border: 1px solid rgba(87, 114, 239, 0.12);
  background: rgba(255, 255, 255, 0.78);
}

.header-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  color: #6d73d5;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.title {
  font-size: 34px;
  font-weight: 700;
  margin: 0 0 10px;
  color: #2f3447;
}

.header-desc {
  max-width: 620px;
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #6b7280;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.form-panel {
  padding: 24px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(232, 236, 245, 0.9);
}

.panel-head {
  margin-bottom: 18px;
}

.panel-head h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: #2f3447;
}

.panel-head p {
  margin: 0;
  font-size: 14px;
  color: #7b8399;
  line-height: 1.7;
}

.form-tip {
  font-size: 12px;
  color: #7b8399;
  margin-top: 6px;
}

.cover-preview {
  margin-top: 14px;
  width: 100%;
  max-width: 400px;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 16px 26px rgba(15, 23, 42, 0.08);
}

.cover-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  width: 100%;
  padding-top: 8px;
}

.cancel-btn,
.draft-btn,
.submit-btn {
  min-width: 120px;
  border-radius: 999px;
}

.draft-btn {
  background: #fff7f0;
  border-color: #ffd9b3;
  color: #c27a35;
}

.submit-btn {
  box-shadow: 0 14px 26px rgba(64, 158, 255, 0.24);
}

:deep(.el-radio.is-bordered) {
  margin-right: 12px;
  margin-bottom: 12px;
}

:deep(.el-textarea__inner) {
  font-family: inherit;
  line-height: 1.8;
  border-radius: 18px;
}

:deep(.el-input__wrapper) {
  border-radius: 16px;
}

@media (max-width: 768px) {
  .create-content {
    padding: 22px;
  }

  .create-header,
  .form-panel {
    padding: 20px;
  }

  .form-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
