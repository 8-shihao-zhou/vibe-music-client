<script setup lang="ts">
import { ref, reactive } from 'vue'
import { User, Message, Lock, Key } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { sendEmailCode, register } from '@/api/system'

const emit = defineEmits(['success', 'switch-tab'])

const loading = ref(false)
const countdown = ref(0)
const registerFormRef = ref<FormInstance>()

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  verificationCode: '',
})

// 表单验证规则
const registerRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_-]{4,16}$/,
      message: '用户名格式：4-16位字符（字母、数字、下划线、连字符）',
      trigger: 'blur',
    },
  ],
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
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    {
      pattern: /^[0-9a-zA-Z]{6}$/,
      message: '验证码格式：6位字符（大小写字母、数字）',
      trigger: 'blur',
    },
  ],
})

// 发送验证码
const handleSendCode = async () => {
  try {
    if (!registerForm.email) {
      ElMessage.warning('请先输入邮箱')
      return
    }
    const response = await sendEmailCode(registerForm.email)
    if (response.code === 0) {
      ElMessage.success('验证码已发送')
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      ElMessage.error(response.message)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '发送验证码失败')
  }
}

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      loading.value = true
      try {
        const response = await register(registerForm)
        if (response.code === 0) {
          ElMessage.success('注册成功，请登录')
          emit('switch-tab', 'login')
        } else {
          ElMessage.error(response.message)
        }
      } catch (error: any) {
        ElMessage.error(error.message || '注册失败')
      } finally {
        loading.value = false
      }
    } else {
      console.log('验证失败:', fields)
    }
  })
}

function switchToLogin() {
  // 通知父组件切换到登录标签
  emit('switch-tab', 'login')
}
</script>

<template>
  <div class="register-container">
    <p class="form-subtitle">创建一个新账户</p>

    <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="0" size="large"
      @keyup.enter="handleRegister">
      <el-form-item prop="username">
        <el-input v-model="registerForm.username" placeholder="用户名" :prefix-icon="User" autocomplete="off" />
      </el-form-item>

      <el-form-item prop="email" class="mt-6">
        <el-input v-model="registerForm.email" placeholder="邮箱" :prefix-icon="Message" autocomplete="off">
          <template #append>
            <el-button :disabled="!!countdown || loading" @click="handleSendCode">
              {{ countdown ? `${countdown}s后重试` : '获取验证码' }}
            </el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="verificationCode" class="mt-6">
        <el-input v-model="registerForm.verificationCode" placeholder="验证码" :prefix-icon="Key" autocomplete="off" />
      </el-form-item>

      <el-form-item prop="password" class="mt-6">
        <el-input v-model="registerForm.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password autocomplete="new-password" />
      </el-form-item>

      <el-form-item class="mt-6">
        <el-button class="submit-btn" type="primary" :loading="loading" @click="handleRegister">
          注册
        </el-button>
      </el-form-item>
    </el-form>

    <p class="login-text">
      已有账户？
      <a href="#" @click.prevent="switchToLogin">登录</a>
    </p>
  </div>
</template>


<style scoped>
.register-container {
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

:deep(.el-input-group__append) {
  border-radius: 0 12px 12px 0;
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-left: none;
}

html.light :deep(.el-input-group__append) {
  background: rgba(248, 249, 255, 0.95);
}

html.dark :deep(.el-input-group__append) {
  background: rgba(60, 60, 80, 0.95);
}

:deep(.el-input-group__append .el-button) {
  border-radius: 0;
  font-weight: 500;
}

html.dark :deep(.el-input-group__append .el-button) {
  color: #e0e0e0;
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

.login-text {
  text-align: center;
  margin-top: 16px;
}

html.light .login-text {
  color: #666;
}

html.dark .login-text {
  color: #a0a0a0;
}

.login-text a {
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.login-text a:hover {
  color: #764ba2;
  text-decoration: underline;
}
</style>
