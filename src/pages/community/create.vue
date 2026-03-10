<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createPost, updatePost, getPostDetail } from '@/api/community'
import { UserStore } from '@/stores/modules/user'

const router = useRouter()
const route = useRoute()
const userStore = UserStore()

// 是否为编辑模式
const isEditMode = ref(false)
const postId = ref<number | null>(null)

// 表单数据
const formData = reactive({
  title: '',
  content: '',
  category: 'SHARE',
  tags: '',
  coverUrl: '',
  status: 1, // 1-已发布, 0-草稿
})

// 分类选项
const categories = [
  { label: '创作分享', value: 'SHARE' },
  { label: '技术交流', value: 'TECH' },
  { label: '问答互助', value: 'QA' },
  { label: '灌水闲聊', value: 'CHAT' },
]

const submitting = ref(false)
const loading = ref(false)

// 加载帖子详情（编辑模式）
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

      // 解析标签
      if (post.tags) {
        try {
          const tagsArray = JSON.parse(post.tags)
          formData.tags = tagsArray.join(', ')
        } catch (e) {
          formData.tags = ''
        }
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

// 发布帖子
const handleSubmit = async (isDraft = false) => {
  console.log(
    '>>> [发布帖子] 开始，isDraft:',
    isDraft,
    'isEditMode:',
    isEditMode.value
  )

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
    // 处理标签
    let tagsJson = ''
    if (formData.tags.trim()) {
      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag)
      tagsJson = JSON.stringify(tagsArray)
    }

    console.log('>>> [发布帖子] 调用 API，status:', isDraft ? 0 : 1)

    let res
    if (isEditMode.value && postId.value) {
      // 更新帖子
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
      // 创建新帖子
      res = await createPost({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: tagsJson,
        coverUrl: formData.coverUrl,
        status: isDraft ? 0 : 1,
      })
    }

    console.log('>>> [发布帖子] API 响应:', res)
    console.log('>>> [发布帖子] 响应 code:', res.code)

    if (res.code === 0) {
      ElMessage.success(
        isDraft ? '保存草稿成功' : isEditMode.value ? '更新成功' : '发布成功'
      )

      // 只有发布成功时才跳转
      if (!isDraft) {
        console.log('>>> [发布帖子] 发布成功，跳转到社区列表')
        // 返回社区列表
        router.push('/community')
      } else {
        console.log('>>> [发布帖子] 草稿保存成功')
        // 草稿保存成功，不跳转，保留在当前页面
        // 如果是新建草稿，需要切换到编辑模式
        if (!isEditMode.value && res.data) {
          // 假设后端返回了新创建的帖子ID
          const newPostId = res.data.id || res.data
          if (newPostId) {
            isEditMode.value = true
            postId.value = newPostId
            // 更新浏览器URL，但不刷新页面
            router.replace(`/community/edit/${newPostId}`)
          }
        }
      }
    } else {
      console.log('>>> [发布帖子] 失败，错误信息:', res.message)
      ElMessage.error(res.message || (isDraft ? '保存失败' : '发布失败'))
    }
  } catch (error) {
    console.error('>>> [发布帖子] 异常:', error)
    ElMessage.error(isDraft ? '保存失败' : '发布失败')
  } finally {
    submitting.value = false
    console.log('>>> [发布帖子] 结束')
  }
}

// 返回
const goBack = () => {
  router.push('/community')
}

// 检查登录状态
onMounted(() => {
  if (!userStore.userInfo?.userId) {
    ElMessage.warning('请先登录')
    router.push('/community')
    return
  }

  // 检查是否为编辑模式
  const id = route.params.id
  if (id) {
    isEditMode.value = true
    postId.value = Number(id)
    loadPostDetail(postId.value)
  } else {
    // 新建模式，清空表单数据
    formData.title = ''
    formData.content = ''
    formData.category = 'SHARE'
    formData.tags = ''
    formData.coverUrl = ''
  }
})
</script>

<template>
  <div class="create-post-container">
    <div v-loading="loading" class="create-content">
      <!-- 头部 -->
      <div class="create-header">
        <el-button class="back-btn" @click="goBack">
          <i class="i-carbon-arrow-left mr-1" />
          返回
        </el-button>
        <h1 class="title">{{ isEditMode ? '编辑帖子' : '发布帖子' }}</h1>
      </div>

      <!-- 表单 -->
      <el-form :model="formData" label-width="80px" class="create-form">
        <!-- 标题 -->
        <el-form-item label="标题" required>
          <el-input
            v-model="formData.title"
            placeholder="请输入帖子标题"
            maxlength="200"
            show-word-limit
            size="large"
          />
        </el-form-item>

        <!-- 分类 -->
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

        <!-- 标签 -->
        <el-form-item label="标签">
          <el-input
            v-model="formData.tags"
            placeholder="输入标签，用逗号分隔，如：AI-MV,新手,分享"
            maxlength="100"
          />
          <div class="form-tip">标签可以帮助其他用户更容易找到你的帖子</div>
        </el-form-item>

        <!-- 封面 -->
        <el-form-item label="封面图">
          <el-input
            v-model="formData.coverUrl"
            placeholder="请输入封面图URL（可选）"
          />
          <div v-if="formData.coverUrl" class="cover-preview">
            <img :src="formData.coverUrl" alt="封面预览" />
          </div>
        </el-form-item>

        <!-- 内容 -->
        <el-form-item label="内容" required>
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="15"
            placeholder="分享你的想法、经验或问题..."
            maxlength="10000"
            show-word-limit
          />
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <div class="form-actions">
            <el-button @click="goBack">取消</el-button>
            <el-button :loading="submitting" @click="handleSubmit(true)">
              保存草稿
            </el-button>
            <el-button
              type="primary"
              :loading="submitting"
              @click="handleSubmit(false)"
            >
              {{ isEditMode ? '更新' : '发布' }}
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
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.create-header {
  margin-bottom: 32px;

  .back-btn {
    margin-bottom: 16px;
  }

  .title {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.create-form {
  .form-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  .cover-preview {
    margin-top: 12px;
    width: 100%;
    max-width: 400px;
    border-radius: 8px;
    overflow: hidden;

    img {
      width: 100%;
      height: auto;
      display: block;
    }
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    width: 100%;
  }
}

:deep(.el-radio.is-bordered) {
  margin-right: 12px;
  margin-bottom: 12px;
}

:deep(.el-textarea__inner) {
  font-family: inherit;
  line-height: 1.6;
}
</style>
