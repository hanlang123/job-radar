<script setup lang="ts">
useHead({ title: '注册 - JobRadar' })

const { register } = useAuth()
const form = reactive({ email: '', password: '', nickname: '' })
const loading = ref(false)
const errorMsg = ref('')
const formRef = ref()

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email' as const, message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

async function handleRegister() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  errorMsg.value = ''
  try {
    await register(form.email, form.password, form.nickname || undefined)
    navigateTo('/')
  } catch (error: unknown) {
    const err = error as { data?: { message?: string }; message?: string }
    errorMsg.value = err.data?.message || err.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <el-card class="auth-card" shadow="hover">
      <div class="auth-header">
        <span class="auth-logo">📡</span>
        <h2>注册 JobRadar</h2>
        <p class="auth-desc">创建账号即可访问完整功能</p>
      </div>
      <ClientOnly>
        <el-alert v-if="errorMsg" :title="errorMsg" type="error" show-icon :closable="false" style="margin-bottom: 16px" />
        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleRegister" label-position="top">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" type="email" placeholder="请输入邮箱" size="large" />
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="form.nickname" placeholder="请输入昵称（可选）" size="large" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" placeholder="至少 6 位密码" show-password size="large" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="loading" size="large" style="width: 100%">
              注册
            </el-button>
          </el-form-item>
        </el-form>
        <p class="auth-link">
          已有账号？<NuxtLink to="/auth/login">去登录</NuxtLink>
        </p>
      </ClientOnly>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 180px);
}

.auth-card {
  width: 440px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(16px);
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;

  .auth-logo {
    font-size: 36px;
    display: block;
    margin-bottom: 12px;
  }

  h2 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 6px;
    background: linear-gradient(135deg, #00e0ff, #7b61ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .auth-desc {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.45);
  }
}

.auth-link {
  text-align: center;
  color: rgba(255, 255, 255, 0.45);
  font-size: 14px;

  a {
    color: #00e0ff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
