<script setup lang="ts">
import { ref, computed } from 'vue'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'
import ResetPasswordForm from './ResetPasswordForm.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const activeTab = ref('login')

const tabTitles = {
  login: '登录',
  register: '注册',
  reset: '重置密码',
}

const handleSuccess = () => {
  dialogVisible.value = false
}

const handleClose = () => {
  activeTab.value = 'login'
}

const handleSwitchTab = (tab: string) => {
  activeTab.value = tab
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="tabTitles[activeTab]"
    width="500px"
    destroy-on-close
    @close="handleClose"
    class="auth-dialog"
    align-center
    append-to-body
    :z-index="3000"
  >
    <div>
      <el-tabs v-model="activeTab" class="auth-tabs">
        <el-tab-pane name="login" :label="tabTitles.login">
          <LoginForm 
            @success="handleSuccess" 
            @switch-tab="handleSwitchTab"
          />
        </el-tab-pane>
        <el-tab-pane name="register" :label="tabTitles.register">
          <RegisterForm 
            @success="handleSuccess" 
            @switch-tab="handleSwitchTab"
          />
        </el-tab-pane>
        <el-tab-pane name="reset" :label="tabTitles.reset">
          <ResetPasswordForm 
            @success="handleSuccess" 
            @switch-tab="handleSwitchTab"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-dialog>
</template>

<style scoped>
.auth-tabs :deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
  justify-content: center;
}

.auth-tabs :deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
  font-weight: 500;
  transition: all 0.3s ease;
}

.auth-tabs :deep(.el-tabs__item:hover) {
  color: #667eea;
}

.auth-tabs :deep(.el-tabs__item.is-active) {
  color: #667eea;
  font-weight: 600;
}

.auth-tabs :deep(.el-tabs__active-bar) {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  height: 3px;
}

/* 对话框样式优化 */
.auth-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  padding: 20px !important;
  margin: 0 !important;
}

.auth-dialog :deep(.el-dialog__title) {
  color: white !important;
  font-weight: 600 !important;
  font-size: 20px !important;
}

.auth-dialog :deep(.el-dialog__headerbtn) {
  top: 20px !important;
  right: 20px !important;
  width: 32px !important;
  height: 32px !important;
}

.auth-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
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

.auth-dialog :deep(.el-dialog__headerbtn:hover) {
  background: rgba(255, 255, 255, 0.2) !important;
  border-radius: 8px !important;
}

.auth-dialog :deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: white !important;
  transform: scale(1.1) !important;
}

.auth-dialog :deep(.el-dialog__body) {
  padding: 30px !important;
}
</style>
