<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { submitReport, checkReported } from '@/api/community'

const props = defineProps<{
  visible: boolean
  targetType: number // 1-帖子, 2-评论
  targetId: number
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const reportForm = ref({
  reasonType: '',
  reasonDetail: '',
})

const submitting = ref(false)
const hasReported = ref(false)

// 举报原因选项
const reasonOptions = [
  { label: '垃圾广告', value: 'SPAM' },
  { label: '违规内容', value: 'ILLEGAL' },
  { label: '侮辱谩骂', value: 'ABUSE' },
  { label: '色情低俗', value: 'PORN' },
  { label: '虚假信息', value: 'FAKE' },
  { label: '侵权内容', value: 'COPYRIGHT' },
  { label: '其他', value: 'OTHER' },
]

// 检查是否已举报
const checkIfReported = async () => {
  if (!props.targetId) return
  try {
    const res = await checkReported(props.targetType, props.targetId)
    if (res.code === 0) {
      hasReported.value = res.data as boolean
    }
  } catch (error) {
    console.error('检查举报状态失败:', error)
  }
}

// 监听对话框打开
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      checkIfReported()
      // 重置表单
      reportForm.value = {
        reasonType: '',
        reasonDetail: '',
      }
    }
  }
)

// 提交举报
const handleSubmit = async () => {
  if (!reportForm.value.reasonType) {
    ElMessage.warning('请选择举报原因')
    return
  }

  submitting.value = true
  try {
    const res = await submitReport({
      targetType: props.targetType,
      targetId: props.targetId,
      reasonType: reportForm.value.reasonType,
      reasonDetail: reportForm.value.reasonDetail,
    })

    if (res.code === 0) {
      ElMessage.success(res.message || '举报提交成功')
      emit('update:visible', false)
      emit('success')
    } else {
      ElMessage.error(res.message || '举报提交失败')
    }
  } catch (error) {
    console.error('举报失败:', error)
    ElMessage.error('网络错误')
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="举报"
    width="500px"
    @close="handleClose"
  >
    <div v-if="hasReported" class="already-reported">
      <i class="i-carbon-checkmark-filled" />
      <p>您已举报过该内容，我们会尽快处理</p>
    </div>
    <el-form v-else :model="reportForm" label-width="100px">
      <el-form-item label="举报原因" required style="margin-top: 20px">
        <el-select
          v-model="reportForm.reasonType"
          placeholder="请选择举报原因"
          style="width: 100%"
        >
          <el-option
            v-for="option in reasonOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="详细说明" style="margin-top: 40px">
        <el-input
          v-model="reportForm.reasonDetail"
          type="textarea"
          :rows="4"
          placeholder="请详细描述举报原因（选填）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="">
        <div class="tips">
          <i class="i-carbon-information" />
          <span>我们会认真审核每一条举报，感谢您的监督</span>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div v-if="!hasReported" class="dialog-footer">
        <el-button @click="handleClose" style="margin-right: 16px"
          >取消</el-button
        >
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          提交举报
        </el-button>
      </div>
      <div v-else>
        <el-button type="primary" @click="handleClose">知道了</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.already-reported {
  text-align: center;
  padding: 40px 20px;

  i {
    font-size: 64px;
    color: #67c23a;
    margin-bottom: 16px;
  }

  p {
    font-size: 16px;
    color: #606266;
    margin: 0;
  }
}

.tips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f4f4f5;
  border-radius: 8px;
  font-size: 13px;
  color: #909399;

  i {
    font-size: 16px;
    flex-shrink: 0;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
