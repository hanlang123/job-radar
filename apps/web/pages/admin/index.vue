<script setup lang="ts">
/**
 * 管理员页面 - CSV 数据导入
 * 仅管理员可访问
 */
definePageMeta({
  middleware: ['auth'],
})

const { user } = useAuth()
const apiBase = useApiBase()

// 非管理员重定向
if (import.meta.client && user.value?.role !== 'admin') {
  navigateTo('/')
}

const fileRef = ref<File | null>(null)
const importMode = ref<'append' | 'replace'>('append')
const uploading = ref(false)
const result = ref<{
  total: number
  success: number
  failed: number
  errors: string[]
} | null>(null)

/** 文件选择 */
function handleFileChange(uploadFile: any) {
  fileRef.value = uploadFile.raw
}

/** 上传导入 */
async function handleImport() {
  if (!fileRef.value) {
    ElMessage.warning('请先选择 CSV 文件')
    return
  }

  if (importMode.value === 'replace') {
    try {
      await ElMessageBox.confirm(
        '替换模式将清空所有现有职位数据后重新导入，确定继续？',
        '警告',
        { type: 'warning', confirmButtonText: '确定替换', cancelButtonText: '取消' },
      )
    } catch {
      return
    }
  }

  uploading.value = true
  result.value = null

  const formData = new FormData()
  formData.append('file', fileRef.value)

  const token = localStorage.getItem('accessToken')

  try {
    const res = await $fetch<any>(`${apiBase}/admin/import-jobs?mode=${importMode.value}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    // 兼容 transform interceptor 包裹的响应
    result.value = res.data || res
    ElMessage.success(`导入完成: 成功 ${result.value!.success} 条`)
  } catch (err: any) {
    ElMessage.error(err.data?.message || err.message || '导入失败')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-header">
      <h2>数据管理</h2>
      <el-tag type="danger" size="small">管理员</el-tag>
    </div>

    <!-- CSV 导入卡片 -->
    <el-card class="import-card">
      <template #header>
        <div class="card-header">
          <span>CSV 职位数据导入</span>
        </div>
      </template>

      <el-form label-width="100px">
        <el-form-item label="CSV 文件">
          <el-upload
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".csv"
            :on-change="handleFileChange"
          >
            <el-button type="primary" plain>选择文件</el-button>
            <template #tip>
              <div class="upload-tip">
                支持 Boss 直聘格式 CSV，字段顺序：职位名称,薪资,公司,行业,公司规模,融资阶段,工作地点,详细地址,经验要求,学历要求,技能标签,福利待遇,HR,HR职位,岗位描述,链接,采集时间
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="导入模式">
          <el-radio-group v-model="importMode">
            <el-radio value="append">追加（保留现有数据，重复数据更新）</el-radio>
            <el-radio value="replace">替换（清空后重新导入）</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="uploading"
            :disabled="!fileRef"
            @click="handleImport"
          >
            {{ uploading ? '导入中...' : '开始导入' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 导入结果 -->
      <div v-if="result" class="import-result">
        <el-divider />
        <h4>导入结果</h4>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="总计">{{ result.total }}</el-descriptions-item>
          <el-descriptions-item label="成功">
            <el-tag type="success">{{ result.success }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="失败">
            <el-tag :type="result.failed > 0 ? 'danger' : 'info'">{{ result.failed }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="result.errors.length > 0" class="error-list">
          <h5>错误详情（前 20 条）</h5>
          <el-scrollbar max-height="200px">
            <div v-for="(err, idx) in result.errors" :key="idx" class="error-item">
              {{ err }}
            </div>
          </el-scrollbar>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.admin-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.admin-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;

  h2 {
    margin: 0;
  }
}

.import-card {
  .card-header {
    font-size: 16px;
    font-weight: 500;
  }
}

.upload-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8px;
  line-height: 1.6;
}

.import-result {
  h4 {
    margin: 12px 0;
  }
}

.error-list {
  margin-top: 16px;

  h5 {
    margin-bottom: 8px;
    color: #ff3366;
  }

  .error-item {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    padding: 4px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
}
</style>
