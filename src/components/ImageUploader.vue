<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadImages } from '@/api/community'

const props = defineProps<{
  modelValue: string[]
  maxCount?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const uploading = ref(false)
const imageList = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val),
})

const maxCount = computed(() => props.maxCount || 9)

// 选择文件
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])

  if (files.length === 0) return

  // 检查数量限制
  if (imageList.value.length + files.length > maxCount.value) {
    ElMessage.warning(`最多只能上传${maxCount.value}张图片`)
    return
  }

  // 检查文件类型和大小
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      ElMessage.error('只能上传图片文件')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过5MB')
      return
    }
  }

  // 上传图片
  uploading.value = true
  try {
    const res = await uploadImages(files)
    if (res.code === 0 && res.data) {
      const newImages = [...imageList.value, ...res.data]
      imageList.value = newImages
      ElMessage.success('上传成功')
    } else {
      ElMessage.error(res.msg || '上传失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
    // 清空input
    target.value = ''
  }
}

// 删除图片
const handleRemove = (index: number) => {
  const newImages = [...imageList.value]
  newImages.splice(index, 1)
  imageList.value = newImages
}

// 触发文件选择
const triggerFileInput = () => {
  const input = document.getElementById(
    'image-upload-input'
  ) as HTMLInputElement
  input?.click()
}
</script>

<template>
  <div class="image-uploader">
    <div class="image-list">
      <!-- 已上传的图片 -->
      <div v-for="(image, index) in imageList" :key="index" class="image-item">
        <el-image
          :src="image"
          fit="cover"
          class="image-preview"
          :preview-src-list="imageList"
          :initial-index="index"
        />
        <div class="image-actions">
          <el-button
            type="danger"
            size="small"
            circle
            @click="handleRemove(index)"
          >
            <i class="i-carbon-close" />
          </el-button>
        </div>
      </div>

      <!-- 上传按钮 -->
      <div
        v-if="imageList.length < maxCount"
        class="upload-btn"
        @click="triggerFileInput"
      >
        <i v-if="!uploading" class="i-carbon-add" />
        <i v-else class="i-carbon-loading animate-spin" />
        <span>{{ uploading ? '上传中...' : '添加图片' }}</span>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      id="image-upload-input"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- 提示信息 -->
    <div class="upload-tips">
      <i class="i-carbon-information" />
      <span>最多上传{{ maxCount }}张图片，单张不超过5MB</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.image-uploader {
  .image-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }

  .image-item {
    position: relative;
    width: 100%;
    padding-bottom: 100%;
    border-radius: 8px;
    overflow: hidden;
    background: var(--el-fill-color-light);

    .image-preview {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .image-actions {
      position: absolute;
      top: 8px;
      right: 8px;
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover .image-actions {
      opacity: 1;
    }
  }

  .upload-btn {
    width: 100%;
    padding-bottom: 100%;
    position: relative;
    border: 2px dashed var(--el-border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-fill-color-light);
    }

    > * {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    i {
      font-size: 32px;
      color: var(--el-text-color-secondary);
      margin-bottom: 8px;
    }

    span {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-top: 40px;
    }
  }

  .upload-tips {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 6px;
    font-size: 13px;
    color: var(--el-text-color-secondary);

    i {
      font-size: 16px;
      flex-shrink: 0;
    }
  }
}
</style>
