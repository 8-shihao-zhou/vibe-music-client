<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Message, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { UserStore } from '@/stores/modules/user'

const emit = defineEmits(['success', 'switch-tab'])
const userStore = UserStore()

const loading = ref(false)
const loginFormRef = ref<FormInstance>()

const loginForm = reactive({
  email: '',
  password: '',
})

// 表单验证规则
const loginRules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z\W]{8,18}$/,
      message: '密码格式：8-18位数字、字母、符号的任意两种组合',
      trigger: 'blur',
    },
  ],
})

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const result = await userStore.userLogin(loginForm)
        if (result.success) {
          ElMessage.success(result.message)
          emit('success')
        } else {
          ElMessage.error(result.message)
        }
      } catch (error: any) {
        ElMessage.error(error.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}

function switchToRegister() {
  // 通知父组件切换到注册标签
  emit('switch-tab', 'register')
}

function switchToReset() {
  // 通知父组件切换到重置密码标签
  emit('switch-tab', 'reset')
}
</script>

<template>
  <div class="login-container">
    <p class="form-subtitle">输入您的邮箱以登录您的账户</p>

    <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="0" size="large"
      @keyup.enter="handleLogin">
      <el-form-item prop="email">
        <el-input v-model="loginForm.email" placeholder="邮箱" :prefix-icon="Message" />
      </el-form-item>

      <el-form-item prop="password" class="mt-6">
        <el-input v-model="loginForm.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
      </el-form-item>

      <div class="forgot-password">
        <a href="#" @click.prevent="switchToReset">忘记密码？</a>
      </div>

      <el-form-item class="mt-6">
        <el-button class="submit-btn" type="primary" :loading="loading" @click="handleLogin">
          登录
        </el-button>
      </el-form-item>
    </el-form>

    <p class="signup-text">
      没有账户？
      <a href="#" @click.prevent="switchToRegister">注册</a>
    </p>
  </div>
</template>

<style scoped>
.login-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.form-subtitle {
  margin-bottom: 24px;
  font-size: 14px;
}

html.light .form-subtitle {
  color: #666;
}

html.dark .form-subtitle {
  color: #a0a0a0;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-input__wrapper) {
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

html.light :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.95);
}

html.dark :deep(.el-input__wrapper) {
  background: rgba(50, 50, 70, 0.95);
}

:deep(.el-input__wrapper:hover) {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
}

:deep(.el-input__inner) {
  color: inherit;
}

html.dark :deep(.el-input__inner) {
  color: #e0e0e0;
}

html.dark :deep(.el-input__inner::placeholder) {
  color: #909399;
}

.submit-btn {
  width: 100%;
  border-radius: 12px;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.signup-text {
  text-align: center;
  margin-top: 16px;
}

html.light .signup-text {
  color: #666;
}

html.dark .signup-text {
  color: #a0a0a0;
}

.signup-text a {
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.signup-text a:hover {
  color: #764ba2;
  text-decoration: underline;
}

.forgot-password {
  text-align: right;
  margin: -10px 0 10px;
}

.forgot-password a {
  font-size: 14px;
  text-decoration: none;
  transition: all 0.3s ease;
}

html.light .forgot-password a {
  color: #666;
}

html.dark .forgot-password a {
  color: #a0a0a0;
}

.forgot-password a:hover {
  color: #667eea;
  text-decoration: underline;
}
</style>
