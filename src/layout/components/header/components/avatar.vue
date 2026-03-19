<script setup lang="ts">
import { ref, reactive } from 'vue'
import { UserStore } from '@/stores/modules/user'
import AuthTabs from '@/components/Auth/AuthTabs.vue'
import FeedbackDialog from '@/components/Common/FeedbackDialog.vue'
import defaultAvatar from '@/assets/user.jpg'
import { ElMessage } from 'element-plus'
import { logout, submitSongRequest, uploadSongRequestFile } from '@/api/system'
import { useRouter } from 'vue-router'

const showLogin = ref(false)
const user = UserStore()
const router = useRouter()
const feedbackDialogRef = ref<InstanceType<typeof FeedbackDialog> | null>(null)

const handleLogout = async () => {
  try {
    const response = await logout()
    if (response.code === 0) {
      user.clearUserInfo()
      ElMessage.success('退出登录成功')
    } else {
      ElMessage.error(response.message || '退出失败')
    }
  } catch (error: any) {
    console.error('退出登录错误:', error)
    ElMessage.error(error.message || '退出失败')
    user.clearUserInfo()
  }
}

const openFeedbackDialog = () => {
  feedbackDialogRef.value?.openDialog()
}

// ===== 请求收录 =====
const showRequestDialog = ref(false)
const submitting = ref(false)
const requestFormRef = ref()
const coverUploading = ref(false)
const audioUploading = ref(false)
const audioError = ref('')

const requestForm = reactive({
  songName: '',
  artistName: '',
  album: '',
  style: '',
  releaseTime: '',
  coverUrl: '',
  audioUrl: '',
  duration: '',
  licenseDesc: '',
  remark: '',
})

const requestRules = {
  songName: [{ required: true, message: '请输入歌曲名称', trigger: 'blur' }],
  artistName: [{ required: true, message: '请输入歌手名称', trigger: 'blur' }],
  licenseDesc: [{ required: true, message: '请填写版权说明', trigger: 'blur' }],
}

const openRequestDialog = () => {
  if (!user.userInfo?.userId) {
    ElMessage.warning('请先登录')
    return
  }
  showRequestDialog.value = true
}

const resetForm = () => {
  requestForm.songName = ''
  requestForm.artistName = ''
  requestForm.album = ''
  requestForm.style = ''
  requestForm.releaseTime = ''
  requestForm.coverUrl = ''
  requestForm.audioUrl = ''
  requestForm.duration = ''
  requestForm.licenseDesc = ''
  requestForm.remark = ''
  audioError.value = ''
  requestFormRef.value?.clearValidate()
}

const handleUploadCover = async (file: File) => {
  console.log('[收录申请] 开始上传封面:', file.name, file.size)
  coverUploading.value = true
  try {
    const res = await uploadSongRequestFile(file, 'covers')
    console.log('[收录申请] 封面上传响应:', res)
    if (res.code === 0) {
      requestForm.coverUrl = res.data as string
      console.log('[收录申请] 封面URL已设置:', requestForm.coverUrl)
      ElMessage.success('封面上传成功')
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch (e) {
    console.error('[收录申请] 封面上传异常:', e)
    ElMessage.error('上传失败')
  } finally {
    coverUploading.value = false
  }
}

const handleUploadAudio = async (file: File) => {
  console.log('[收录申请] 开始上传音频:', file.name, file.size)
  audioUploading.value = true
  try {
    const res = await uploadSongRequestFile(file, 'audios')
    console.log('[收录申请] 音频上传响应:', res)
    if (res.code === 0) {
      requestForm.audioUrl = res.data as string
      audioError.value = ''
      console.log('[收录申请] 音频URL已设置:', requestForm.audioUrl)
      // 用 HTML5 Audio API 读取时长
      const objectUrl = URL.createObjectURL(file)
      const audio = new Audio(objectUrl)
      audio.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(audio.duration)) {
          requestForm.duration = audio.duration.toFixed(2)
          console.log('[收录申请] 音频时长:', requestForm.duration)
        }
        URL.revokeObjectURL(objectUrl)
      })
      ElMessage.success('音频上传成功')
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch (e) {
    console.error('[收录申请] 音频上传异常:', e)
    ElMessage.error('上传失败')
  } finally {
    audioUploading.value = false
  }
}

const handleSubmitRequest = async () => {
  const valid = await requestFormRef.value.validate().catch(() => false)
  if (!valid) return

  if (!requestForm.audioUrl?.trim()) {
    audioError.value = '请上传音频文件或填写音频链接'
    return
  }
  audioError.value = ''

  submitting.value = true
  try {
    console.log('[收录申请] 提交数据:', { ...requestForm })
    const res = await submitSongRequest({ ...requestForm })
    console.log('[收录申请] 提交响应:', res)
    if (res.code === 0) {
      ElMessage.success('提交成功，等待管理员审核')
      showRequestDialog.value = false
      resetForm()
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch (e) {
    console.error('[收录申请] 提交异常:', e)
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- 请求收录按钮（登录后显示） -->
    <el-button
      v-if="user.userInfo?.userId"
      size="small"
      class="request-song-btn"
      @click="openRequestDialog"
    >
      <icon-carbon:add-alt class="mr-1" />
      请求收录
    </el-button>

    <el-dropdown v-if="user.userInfo && user.userInfo.userId" class="cursor-pointer">
      <span class="flex items-center">
        <el-avatar :src="user.userInfo.avatarUrl || defaultAvatar" class="mr-1" shape="circle" :size="32" />
        <span class="text-sm font-medium mr-2 ml-1">{{ user.userInfo.username }}</span>
        <icon-uiw:down />
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="router.push('/user')">
            <icon-mi:user />&ensp;个人中心
          </el-dropdown-item>
          <el-dropdown-item @click="openFeedbackDialog">
            <icon-feather:edit />&ensp;意见反馈
          </el-dropdown-item>
          <el-dropdown-item @click="handleLogout">
            <icon-pajamas:power />&ensp;退出
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-button class="mr-3 rounded-full" v-else type="primary" @click="showLogin = true">
      <div class="flex items-center gap-1">
        <icon-ic:baseline-person-pin />
        登录
      </div>
    </el-button>
  </div>

  <AuthTabs v-if="showLogin" v-model="showLogin" />
  <FeedbackDialog ref="feedbackDialogRef" />

  <!-- 请求收录弹窗 -->
  <el-dialog
    v-model="showRequestDialog"
    title="请求收录歌曲"
    width="560px"
    :close-on-click-modal="false"
    append-to-body
    @closed="resetForm"
  >
    <el-form ref="requestFormRef" :model="requestForm" :rules="requestRules" label-width="90px">
      <el-form-item label="歌曲名称" prop="songName">
        <el-input v-model="requestForm.songName" placeholder="请输入歌曲名称" />
      </el-form-item>
      <el-form-item label="歌手名称" prop="artistName">
        <el-input v-model="requestForm.artistName" placeholder="请输入歌手名称" />
      </el-form-item>
      <el-form-item label="专辑">
        <el-input v-model="requestForm.album" placeholder="专辑名称（可选）" />
      </el-form-item>
      <el-form-item label="曲风">
        <el-input v-model="requestForm.style" placeholder="如：流行,电子（逗号分隔）" />
      </el-form-item>
      <el-form-item label="发行日期">
        <el-date-picker
          v-model="requestForm.releaseTime"
          type="date"
          placeholder="选择发行日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="封面图">
        <div class="flex gap-2 w-full">
          <el-input v-model="requestForm.coverUrl" placeholder="粘贴图片链接，或点击右侧上传" class="flex-1" />
          <el-upload :show-file-list="false" accept="image/*"
            :http-request="({ file }: any) => handleUploadCover(file)">
            <el-button :loading="coverUploading" size="small">上传</el-button>
          </el-upload>
        </div>
        <el-image v-if="requestForm.coverUrl" :src="requestForm.coverUrl" fit="cover"
          style="width: 60px; height: 60px; border-radius: 6px; margin-top: 6px" />
      </el-form-item>
      <el-form-item label="音频文件">
        <div class="flex gap-2 w-full">
          <el-input v-model="requestForm.audioUrl" placeholder="粘贴音频链接，或点击右侧上传" class="flex-1"
            @input="audioError = ''" />
          <el-upload :show-file-list="false" accept="audio/*"
            :http-request="({ file }: any) => handleUploadAudio(file)">
            <el-button :loading="audioUploading" size="small">上传</el-button>
          </el-upload>
        </div>
        <div v-if="audioError" style="color: var(--el-color-danger); font-size: 12px; margin-top: 4px">
          {{ audioError }}
        </div>
        <audio v-if="requestForm.audioUrl" :src="requestForm.audioUrl" controls style="height: 32px; width: 100%; margin-top: 6px" />
      </el-form-item>
      <el-form-item label="版权说明" prop="licenseDesc">
        <el-input v-model="requestForm.licenseDesc" type="textarea" :rows="2"
          placeholder="请说明该音乐的开源协议或来源，如：CC0、CC BY 4.0、来自 Free Music Archive 等" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="requestForm.remark" type="textarea" :rows="2" placeholder="其他补充说明（可选）" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showRequestDialog = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmitRequest">提交申请</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.request-song-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  border-radius: 8px;
  font-size: 12px;
  height: 30px;
}
.request-song-btn:hover {
  opacity: 0.9;
}
</style>
