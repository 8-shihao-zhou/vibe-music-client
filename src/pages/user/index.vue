<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserStore } from '@/stores/modules/user'
import defaultAvatar from '@/assets/user.jpg'
import {
  updateUserInfo,
  updateUserAvatar,
  deleteUser,
  getUserInfo,
} from '@/api/system'
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'
import { useRouter } from 'vue-router'
import AuthTabs from '@/components/Auth/AuthTabs.vue'
import { getUserPoints } from '@/api/points'
import { getMallItems, togglePrivilege } from '@/api/mall'

const router = useRouter()
const userStore = UserStore()
const loading = ref(false)
const userFormRef = ref<FormInstance>()
const cropperVisible = ref(false)
const cropperImg = ref('')
const cropper = ref<any>(null)
const authVisible = ref(false)
const unreadCount = ref(0)
const userPoints = ref(0)

const nicknameColors = ref<any[]>([])
const avatarFrames = ref<any[]>([])
const currentNicknameColor = ref('default')
const currentAvatarFrame = ref('default')

const userForm = reactive({
  userId: userStore.userInfo.userId,
  username: userStore.userInfo.username || '',
  phone: userStore.userInfo.phone || '',
  email: userStore.userInfo.email || '',
  introduction: userStore.userInfo.introduction || '',
})

// 琛ㄥ崟楠岃瘉瑙勫垯
const userRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_-]{4,16}$/,
      message: '用户名格式为 4-16 位字符，可包含字母、数字、下划线和连字符',
      trigger: 'blur',
    },
  ],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  introduction: [
    { max: 100, message: '简介不能超过 100 个字符', trigger: 'blur' },
  ],
})

// 妫€鏌ョ櫥褰曠姸鎬?
onMounted(() => {
  if (!userStore.isLoggedIn) {
    authVisible.value = true
  } else {
    loadUnreadCount()
    loadUserPoints()
    loadMallPrivileges()
  }
})

// 鐩戝惉鐧诲綍鐘舵€佸彉鍖栵紝鐧诲綍鍚庣珛鍗冲姞杞芥暟鎹紙瑙ｅ喅鍒锋柊鏃?token 鏈氨缁殑绔炴€侀棶棰橈級
watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      loadUnreadCount()
      loadUserPoints()
      loadMallPrivileges()
    }
  }
)

// 鐩戝惉璺敱鍙樺寲锛屽綋浠庨€氱煡椤甸潰杩斿洖鏃跺埛鏂版湭璇绘暟閲?
watch(
  () => router.currentRoute.value.path,
  (newPath, oldPath) => {
    // 褰撲粠閫氱煡椤甸潰杩斿洖鍒颁釜浜轰腑蹇冩椂锛屽埛鏂版湭璇绘暟閲?
    if (newPath === '/user' && oldPath?.startsWith('/notification')) {
      console.log('从通知页面返回，刷新未读数量')
      loadUnreadCount()
    }
  }
)

// 鐩戝惉鐢ㄦ埛鍙樺寲锛岃嚜鍔ㄥ埛鏂版湭璇绘暟閲?
watch(
  () => userStore.userInfo.userId,
  (newUserId, oldUserId) => {
    // 褰撶敤鎴稩D鍙樺寲鏃讹紝閲嶆柊鍔犺浇鏈鏁伴噺
    if (newUserId !== oldUserId) {
      console.log('用户切换，重新加载未读数量')
      if (newUserId) {
        loadUnreadCount()
        loadUserPoints()
      } else {
        unreadCount.value = 0
        userPoints.value = 0
      }
    }
  }
)

// 鍔犺浇鏈娑堟伅鏁伴噺
const loadUnreadCount = async () => {
  try {
    const response: any = await http('get', '/notification/user/unread-count')
    if (response.code === 0) {
      unreadCount.value = response.data?.count || 0
    }
  } catch (error) {
    console.error('鍔犺浇鏈娑堟伅鏁伴噺澶辫触:', error)
  }
}

// 鍔犺浇鐢ㄦ埛绉垎
const loadUserPoints = async () => {
  try {
    const response = await getUserPoints()
    if (response.code === 0) {
      userPoints.value = response.data?.availablePoints || 0
    }
  } catch (error) {
    console.error('鍔犺浇鐢ㄦ埛绉垎澶辫触:', error)
  }
}

// 鍔犺浇鍟嗗煄鐗规潈瑁呮壆
const loadMallPrivileges = async () => {
  try {
    const res = await getMallItems()
    if (res.code === 0) {
      const items = res.data || []
      nicknameColors.value = items.filter(
        (item: any) => item.itemType === 'NICKNAME_COLOR' && item.alreadyOwned
      )
      avatarFrames.value = items.filter(
        (item: any) => item.itemType === 'AVATAR_FRAME' && item.alreadyOwned
      )
      const isActive = (item: any) =>
        item?.isActive === true || item?.isActive === 1 || item?.isActive === '1'
      const activeNickname = nicknameColors.value.find((item: any) =>
        isActive(item)
      )
      const activeFrame = avatarFrames.value.find((item: any) => isActive(item))
      currentNicknameColor.value = activeNickname?.itemCode || 'default'
      currentAvatarFrame.value = activeFrame?.itemCode || 'default'
    }
  } catch (error) {
    console.error('鍔犺浇瑁呮壆澶辫触:', error)
  }
}

// 鍒囨崲鏄电О棰滆壊
const handleNicknameColorChange = async (colorCode: string) => {
  try {
    loading.value = true
    const value =
      colorCode === 'default' ? 'default' : getColorFromCode(colorCode)
    const res = await togglePrivilege('NICKNAME_COLOR', value)
    if (res.code === 0) {
      ElMessage.success('鏄电О棰滆壊鍒囨崲鎴愬姛')
      currentNicknameColor.value = colorCode
    } else {
      ElMessage.error(res.message || '鍒囨崲澶辫触')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '鍒囨崲澶辫触')
  } finally {
    loading.value = false
  }
}

// 鍒囨崲澶村儚妗?
const handleAvatarFrameChange = async (frameCode: string) => {
  try {
    loading.value = true
    const value =
      frameCode === 'default' ? 'default' : getFrameStyleFromCode(frameCode)
    const res = await togglePrivilege('AVATAR_FRAME', value)
    if (res.code === 0) {
      ElMessage.success('头像框切换成功')
      currentAvatarFrame.value = frameCode
    } else {
      ElMessage.error(res.message || '鍒囨崲澶辫触')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '鍒囨崲澶辫触')
  } finally {
    loading.value = false
  }
}

const getColorFromCode = (code: string) => {
  switch (code) {
    case 'NICKNAME_COLOR_RED':
      return '#ff4757'
    case 'NICKNAME_COLOR_BLUE':
      return '#3742fa'
    case 'NICKNAME_COLOR_PURPLE':
      return '#8c7ae6'
    case 'NICKNAME_COLOR_GRADIENT':
      return 'linear-gradient(45deg, #ff6b6b, #4ecdc4)'
    default:
      return '#333333'
  }
}

const getFrameStyleFromCode = (code: string) => {
  switch (code) {
    case 'AVATAR_FRAME_GOLD':
      return 'gold'
    case 'AVATAR_FRAME_RAINBOW':
      return 'rainbow'
    default:
      return 'default'
  }
}

// 璺宠浆鍒伴€氱煡椤甸潰
const goToNotifications = () => {
  router.push('/notification')
}

// 璺宠浆鍒扮ぞ鍖轰釜浜轰腑蹇?
const goToCommunityProfile = () => {
  const userId = userStore.userInfo?.userId
  if (userId) {
    router.push(`/community/user/${userId}`)
  } else {
      ElMessage.warning('请先登录')
  }
}

// 璺宠浆鍒扮Н鍒嗕腑蹇?
const goToPoints = () => {
  router.push('/points')
}

// 澶勭悊澶村儚涓婁紶
const handleAvatarClick = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          cropperImg.value = result
          cropperVisible.value = true
        }
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

// 閲嶇疆瑁佸壀
const reset = () => {
  if (cropper.value) {
    cropper.value.refresh()
  }
}

// 缂╂斁
const changeScale = (num: number) => {
  if (cropper.value) {
    cropper.value.changeScale(num)
  }
}

// 鍚戝乏鏃嬭浆
const rotateLeft = () => {
  if (cropper.value) {
    cropper.value.rotateLeft()
  }
}

// 鍚戝彸鏃嬭浆
const rotateRight = () => {
  if (cropper.value) {
    cropper.value.rotateRight()
  }
}

// 纭瑁佸壀
const handleCropConfirm = async () => {
  if (!cropper.value) return
  cropper.value.getCropData(async (base64: string) => {
    try {
      const response = await fetch(base64)
      const blob = await response.blob()

      const formData = new FormData()
      formData.append('avatar', blob, 'avatar.png')

      const res = await updateUserAvatar(formData)

      if (res.code === 0) {
        // 閲嶆柊鑾峰彇鐢ㄦ埛淇℃伅浠ユ洿鏂板ご鍍廢RL
        const userInfoResponse = await getUserInfo()
        if (userInfoResponse.code === 0) {
          userStore.setUserInfo(userInfoResponse.data, userStore.userInfo.token)
          ElMessage.success('澶村儚鏇存柊鎴愬姛')
          cropperVisible.value = false
          cropperImg.value = ''
        } else {
          ElMessage.error(userInfoResponse.message || '鑾峰彇鐢ㄦ埛淇℃伅澶辫触')
        }
      } else {
        ElMessage.error(res.message || '澶村儚鏇存柊澶辫触')
      }
    } catch (error: any) {
      console.error('澶村儚鏇存柊閿欒:', error)
      ElMessage.error(error.message || '澶村儚鏇存柊澶辫触')
    }
  })
}

// 澶勭悊琛ㄥ崟鎻愪氦
const handleSubmit = async () => {
  if (!userFormRef.value) return
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await updateUserInfo(userForm)
        if (response.code === 0) {
          const userInfoResponse = await getUserInfo()
          userStore.setUserInfo(userInfoResponse.data, userStore.userInfo.token)
          ElMessage.success('鏇存柊鎴愬姛')
        } else {
          ElMessage.error(response.message || '鏇存柊澶辫触')
        }
      } catch (error: any) {
        ElMessage.error(error.message || '鏇存柊澶辫触')
      } finally {
        loading.value = false
      }
    }
  })
}

// 澶勭悊璐﹀彿娉ㄩ攢
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      '注销账号后，所有数据将被清除且无法恢复，是否确认注销？',
      '警告',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    loading.value = true
    const response = await deleteUser()
    if (response.code === 0) {
      userStore.clearUserInfo()
      ElMessage.success('璐﹀彿宸叉敞閿€')
      router.push('/')
    } else {
      ElMessage.error(response.message || '娉ㄩ攢澶辫触')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '娉ㄩ攢澶辫触')
    }
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <div class="user-page">
    <section class="profile-hero">
      <div class="hero-main">
        <p class="hero-kicker">Profile Center</p>
        <h1 class="hero-title">个人中心</h1>
        <p class="hero-subtitle">
          在这里管理头像、昵称、联系方式和个性装扮，也可以快速进入通知、社区主页和积分中心。
        </p>

        <div class="hero-stats">
          <div class="stat-card">
            <span class="stat-label">未读通知</span>
            <strong>{{ unreadCount }}</strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">当前积分</span>
            <strong>{{ userPoints }}</strong>
          </div>
          <div class="stat-card">
            <span class="stat-label">当前账号</span>
            <strong>{{ userForm.username || '未设置昵称' }}</strong>
          </div>
        </div>
      </div>

      <div class="hero-avatar-card">
        <div class="avatar-wrapper avatar-wrapper-large" @click="handleAvatarClick">
          <el-avatar
            :src="userStore.userInfo.avatarUrl || defaultAvatar"
            :size="112"
          />
          <div class="avatar-hover">
            <icon-ic:outline-photo-camera class="camera-icon" />
            <span>更新头像</span>
          </div>
        </div>
        <div class="avatar-meta">
          <div class="avatar-name">{{ userForm.username || '未设置昵称' }}</div>
          <div class="avatar-email">{{ userForm.email || '未绑定邮箱' }}</div>
        </div>
      </div>

      <div class="hero-glow hero-glow-a" />
      <div class="hero-glow hero-glow-b" />
    </section>

    <section class="quick-entry-grid">
      <button class="quick-entry-card" @click="goToNotifications">
        <div class="quick-entry-left">
          <div class="entry-icon entry-icon-primary">
            <icon-ep:bell />
          </div>
          <div>
            <div class="entry-title">我的通知</div>
            <div class="entry-desc">查看系统消息与互动提醒</div>
          </div>
        </div>
        <div class="quick-entry-right">
          <el-badge
            v-if="unreadCount > 0"
            :value="unreadCount"
            :max="99"
          />
          <icon-ep:arrow-right class="arrow-icon" />
        </div>
      </button>

      <button class="quick-entry-card" @click="goToCommunityProfile">
        <div class="quick-entry-left">
          <div class="entry-icon entry-icon-secondary">
            <icon-ep:user />
          </div>
          <div>
            <div class="entry-title">社区个人中心</div>
            <div class="entry-desc">进入社区主页查看动态与内容</div>
          </div>
        </div>
        <div class="quick-entry-right">
          <icon-ep:arrow-right class="arrow-icon" />
        </div>
      </button>

      <button class="quick-entry-card" @click="goToPoints">
        <div class="quick-entry-left">
          <div class="entry-icon entry-icon-gold">
            <icon-ep:trophy />
          </div>
          <div>
            <div class="entry-title">积分中心</div>
            <div class="entry-desc">查看积分并使用已购买装扮</div>
          </div>
        </div>
        <div class="quick-entry-right">
          <span v-if="userPoints > 0" class="points-badge">
            {{ userPoints }} 积分
          </span>
          <icon-ep:arrow-right class="arrow-icon" />
        </div>
      </button>
    </section>

    <section class="profile-panel">
      <div class="panel-header">
        <div>
          <p class="panel-kicker">Profile Settings</p>
          <h2 class="panel-title">资料设置</h2>
        </div>
        <span class="panel-tip">修改后记得保存，装扮切换会即时生效</span>
      </div>

      <div class="avatar-setting-card">
        <div class="section-title">头像与装扮</div>
        <div class="avatar-setting-body">
          <div class="avatar-wrapper" @click="handleAvatarClick">
            <el-avatar
              :src="userStore.userInfo.avatarUrl || defaultAvatar"
              :size="100"
            />
            <div class="avatar-hover">
              <icon-ic:outline-photo-camera class="camera-icon" />
              <span>更新头像</span>
            </div>
          </div>

          <div class="avatar-setting-actions">
            <div class="setting-tip">
              点击头像即可上传并裁剪新的头像图片。
            </div>

            <div
              v-if="avatarFrames.length > 0"
              class="privilege-section"
            >
              <span class="field-tip">头像框</span>
              <el-select
                v-model="currentAvatarFrame"
                @change="handleAvatarFrameChange"
                placeholder="选择头像框"
                style="width: 100%"
              >
                <el-option label="默认头像框" value="default"></el-option>
                <el-option
                  v-for="item in avatarFrames"
                  :key="item.itemCode"
                  :label="item.itemName"
                  :value="item.itemCode"
                ></el-option>
              </el-select>
            </div>
          </div>
        </div>
      </div>

      <el-dialog
        v-model="cropperVisible"
        title="裁剪头像"
        width="600px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <div class="cropper-container">
          <vue-cropper
            ref="cropper"
            :img="cropperImg"
            :info="true"
            :canScale="true"
            :autoCrop="true"
            :fixedBox="true"
            :canMove="true"
            :canMoveBox="true"
            :centerBox="true"
            :infoTrue="true"
            :fixed="true"
            :fixedNumber="[1, 1]"
            :high="true"
            mode="cover"
            :round="true"
          />
        </div>
        <template #footer>
          <div class="dialog-footer">
            <div class="flex justify-between items-center w-full">
              <div class="flex">
                <el-button size="mini" type="info" @click="reset" class="mr-1">
                  重置
                </el-button>
                <el-button size="mini" plain @click="changeScale(1)" class="mr-1">
                  <icon-ph:magnifying-glass-plus-light class="mr-0.5" />放大
                </el-button>
                <el-button
                  size="mini"
                  plain
                  @click="changeScale(-1)"
                  class="mr-1"
                >
                  <icon-ph:magnifying-glass-minus-light class="mr-0.5" />缩小
                </el-button>
                <el-button size="mini" plain @click="rotateLeft" class="mr-1">
                  <icon-grommet-icons:rotate-left class="mr-0.5" />左旋转
                </el-button>
                <el-button size="mini" plain @click="rotateRight" class="mr-1">
                  <icon-grommet-icons:rotate-right class="mr-0.5" />右旋转
                </el-button>
              </div>
              <div class="flex">
                <el-button
                  size="mini"
                  type="warning"
                  plain
                  @click="cropperVisible = false"
                  class="mr-3"
                >
                  取消
                </el-button>
                <el-button size="mini" type="primary" @click="handleCropConfirm">
                  确认
                </el-button>
              </div>
            </div>
          </div>
        </template>
      </el-dialog>

      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="0"
        size="large"
        class="user-form"
      >
        <div class="form-grid">
          <div class="section section-span-full">
            <div class="section-title">用户名称</div>
            <div class="inline-setting-row">
              <el-form-item prop="username" style="flex: 1; margin-bottom: 0">
                <el-input v-model="userForm.username" placeholder="请输入用户名" />
              </el-form-item>

              <div
                v-if="nicknameColors.length > 0"
                class="privilege-section privilege-section-inline"
              >
                <el-select
                  v-model="currentNicknameColor"
                  @change="handleNicknameColorChange"
                  placeholder="选择昵称颜色"
                  style="width: 100%"
                >
                  <el-option label="默认颜色" value="default"></el-option>
                  <el-option
                    v-for="item in nicknameColors"
                    :key="item.itemCode"
                    :label="item.itemName"
                    :value="item.itemCode"
                  ></el-option>
                </el-select>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">邮箱</div>
            <el-form-item prop="email">
              <el-input v-model="userForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </div>

          <div class="section">
            <div class="section-title">联系电话</div>
            <el-form-item prop="phone">
              <el-input v-model="userForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </div>

          <div class="section section-span-full">
            <div class="section-title">简介</div>
            <el-form-item prop="introduction">
              <el-input
                v-model="userForm.introduction"
                type="textarea"
                :rows="4"
                placeholder="编辑一段简短的个人简介"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </div>
        </div>

        <el-form-item class="button-group">
          <div class="button-row">
            <el-button
              type="primary"
              :loading="loading"
              @click="handleSubmit"
              class="submit-btn"
            >
              保存资料
            </el-button>
            <el-button
              type="danger"
              :loading="loading"
              @click="handleDelete"
              class="submit-btn"
            >
              注销账号
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <AuthTabs v-model="authVisible" />
    </section>
  </div>
</template>

<style scoped>
.user-page {
  min-height: 100%;
  padding: 20px;
  background:
    radial-gradient(circle at top left, rgba(117, 139, 255, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(255, 194, 210, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(247, 249, 255, 0.95), rgba(252, 252, 255, 0.98));
}

.profile-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) 260px;
  gap: 24px;
  padding: 28px;
  overflow: hidden;
  border: 1px solid rgba(140, 168, 230, 0.16);
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(250, 245, 255, 0.92)),
    #fff;
  box-shadow: 0 22px 52px rgba(91, 118, 179, 0.13);
}

.hero-main,
.hero-avatar-card {
  position: relative;
  z-index: 1;
}

.hero-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6e7ee0;
}

.hero-title {
  margin: 0;
  font-size: 40px;
  line-height: 1.12;
  color: #223350;
}

.hero-subtitle {
  max-width: 720px;
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.8;
  color: #687891;
}

.hero-stats {
  display: flex;
  gap: 14px;
  margin-top: 22px;
  flex-wrap: wrap;
}

.stat-card {
  min-width: 150px;
  padding: 14px 16px;
  border: 1px solid rgba(146, 174, 226, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 10px 22px rgba(98, 123, 178, 0.1);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #7b89a4;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 22px;
  color: #253754;
}

.hero-avatar-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 18px 36px rgba(94, 118, 176, 0.12);
  backdrop-filter: blur(14px);
}

.avatar-meta {
  text-align: center;
}

.avatar-name {
  font-size: 18px;
  font-weight: 700;
  color: #253754;
}

.avatar-email {
  margin-top: 6px;
  font-size: 13px;
  color: #74839f;
}

.hero-glow {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.hero-glow-a {
  top: -70px;
  right: 180px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(134, 172, 255, 0.24), transparent 70%);
}

.hero-glow-b {
  right: -40px;
  bottom: -46px;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(255, 191, 208, 0.24), transparent 70%);
}

.quick-entry-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.quick-entry-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid rgba(140, 168, 228, 0.14);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 255, 0.94)),
    #fff;
  box-shadow: 0 18px 38px rgba(86, 111, 168, 0.1);
  text-align: left;
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
}

.quick-entry-card:hover {
  transform: translateY(-3px);
  border-color: rgba(109, 142, 218, 0.24);
  box-shadow: 0 20px 34px rgba(91, 116, 172, 0.15);
}

.quick-entry-left,
.quick-entry-right {
  display: flex;
  align-items: center;
}

.quick-entry-left {
  gap: 14px;
  min-width: 0;
}

.quick-entry-right {
  gap: 10px;
  color: #7f8cab;
}

.entry-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  font-size: 22px;
  color: #fff;
  flex-shrink: 0;
}

.entry-icon-primary {
  background: linear-gradient(135deg, #5e84e7 0%, #7b7be8 100%);
}

.entry-icon-secondary {
  background: linear-gradient(135deg, #4f9cf3 0%, #6d7ef2 100%);
}

.entry-icon-gold {
  background: linear-gradient(135deg, #f5b342 0%, #f08b38 100%);
}

.entry-title {
  font-size: 16px;
  font-weight: 700;
  color: #253754;
}

.entry-desc {
  margin-top: 6px;
  font-size: 13px;
  color: #7c89a4;
}

.points-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.profile-panel {
  margin-top: 24px;
  padding: 22px;
  border: 1px solid rgba(138, 167, 228, 0.14);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 255, 0.94)),
    #fff;
  box-shadow: 0 18px 38px rgba(87, 111, 167, 0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.panel-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6f7ee2;
}

.panel-title {
  margin: 0;
  font-size: 24px;
  color: #233451;
}

.panel-tip {
  font-size: 13px;
  color: #7b89a4;
}

.avatar-setting-card {
  margin-bottom: 22px;
  padding: 22px;
  border: 1px solid rgba(144, 171, 222, 0.16);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 255, 0.94));
}

.avatar-setting-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
}

.avatar-setting-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.setting-tip {
  font-size: 14px;
  line-height: 1.8;
  color: #6f7f98;
}

.field-tip {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #6f7ee2;
}

.user-form {
  max-width: 100%;
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 20px;
}

.section {
  margin-bottom: 0;
  padding: 20px;
  border: 1px solid rgba(144, 171, 222, 0.14);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(249, 251, 255, 0.92));
}

.section-span-full {
  grid-column: 1 / -1;
}

.section-title {
  margin-bottom: 10px;
  color: #667791;
  font-size: 14px;
  font-weight: 600;
}

.inline-setting-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.privilege-section {
  width: 180px;
  flex-shrink: 0;
}

.privilege-section-inline {
  align-self: flex-end;
}

:deep(.el-form-item) {
  margin-bottom: 0;
}

:deep(.el-input__wrapper) {
  min-height: 46px;
  border-radius: 14px;
  background-color: var(--el-fill-color-blank);
  box-shadow: 0 0 0 1px rgba(144, 171, 222, 0.16) inset !important;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(103, 126, 214, 0.3) inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

:deep(.el-textarea__inner) {
  border-radius: 16px;
  resize: none;
  background-color: var(--el-fill-color-blank);
  box-shadow: 0 0 0 1px rgba(144, 171, 222, 0.16) inset !important;
}

:deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px rgba(103, 126, 214, 0.3) inset !important;
}

:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: var(--el-fill-color-blank);
  box-shadow: 0 0 0 1px var(--el-border-color-light) inset !important;
  cursor: not-allowed;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-wrapper-large {
  width: 112px;
  height: 112px;
}

.avatar-hover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
  font-size: 14px;
}

.avatar-hover .camera-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.avatar-wrapper:hover .avatar-hover {
  opacity: 1;
}

.button-group {
  margin-top: 24px;
}

.button-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.submit-btn {
  min-width: 140px;
  height: 44px;
  border-radius: 14px;
}

.cropper-container {
  width: 100%;
  height: 400px;
}

:deep(.el-dialog__body) {
  padding-top: 10px;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  padding: 20px !important;
}

:deep(.el-dialog__title) {
  color: white !important;
  font-weight: 600 !important;
}

:deep(.el-dialog__headerbtn) {
  top: 20px !important;
  right: 20px !important;
  width: 32px !important;
  height: 32px !important;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white !important;
  font-size: 22px !important;
  font-weight: bold !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.3s ease !important;
}

:deep(.el-dialog__headerbtn:hover) {
  background: rgba(255, 255, 255, 0.2) !important;
  border-radius: 8px !important;
}

:deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: white !important;
  transform: scale(1.1) !important;
}

@media (max-width: 1100px) {
  .profile-hero {
    grid-template-columns: 1fr;
  }

  .hero-avatar-card {
    align-items: flex-start;
  }

  .avatar-meta {
    text-align: left;
  }

  .quick-entry-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .user-page {
    padding: 14px;
  }

  .profile-hero,
  .profile-panel,
  .avatar-setting-card {
    padding: 18px 16px;
    border-radius: 22px;
  }

  .hero-title {
    font-size: 30px;
  }

  .hero-stats,
  .button-row,
  .avatar-setting-body,
  .inline-setting-row,
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .section-span-full {
    grid-column: auto;
  }

  .privilege-section {
    width: 100%;
  }

  .submit-btn {
    width: 100%;
  }

  .button-row {
    gap: 12px;
  }
}

html.dark .user-page {
  background:
    radial-gradient(circle at top left, rgba(79, 112, 196, 0.22), transparent 28%),
    radial-gradient(circle at top right, rgba(171, 92, 144, 0.18), transparent 24%),
    linear-gradient(180deg, rgba(17, 23, 38, 0.98), rgba(10, 15, 28, 1));
}

html.dark .profile-hero,
html.dark .quick-entry-card,
html.dark .profile-panel,
html.dark .avatar-setting-card,
html.dark .section,
html.dark .hero-avatar-card,
html.dark .stat-card {
  border-color: rgba(117, 138, 196, 0.18);
  background:
    linear-gradient(180deg, rgba(26, 34, 54, 0.94), rgba(20, 27, 44, 0.96)),
    #182133;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.26);
}

html.dark .hero-title,
html.dark .panel-title,
html.dark .entry-title,
html.dark .avatar-name,
html.dark .stat-card strong {
  color: #eef3ff;
}

html.dark .hero-subtitle,
html.dark .panel-tip,
html.dark .entry-desc,
html.dark .avatar-email,
html.dark .setting-tip,
html.dark .section-title,
html.dark .stat-label {
  color: #aab7d6;
}

html.dark .quick-entry-right {
  color: #aab7d6;
}

html.dark :deep(.el-input__wrapper),
html.dark :deep(.el-textarea__inner),
html.dark :deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.06);
  color: #e9efff;
  box-shadow: 0 0 0 1px rgba(142, 163, 224, 0.16) inset !important;
}
</style>
