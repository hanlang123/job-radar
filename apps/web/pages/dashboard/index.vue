<script setup lang="ts">
/**
 * 个人仪表盘页面 (CSR)
 * 技能雷达 + 个人信息管理
 */
import type { MarketOverview } from '@job-radar/shared'

definePageMeta({ middleware: 'auth' })
useHead({ title: '个人仪表盘 - JobRadar' })

const config = useRuntimeConfig()
const { user } = useAuth()
const { fetchMarketOverview } = useGraph()

const overview = ref<MarketOverview | null>(null)
const loading = ref(true)

/** 技能编辑 */
const editingSkills = ref(false)
const skillInput = ref('')
const editSkills = ref<string[]>([])

/** 计算用户技能在市场中的匹配度 */
const skillRadarData = computed(() => {
  if (!user.value?.skills?.length || !overview.value?.topSkills?.length) return null

  const userSkills = user.value.skills.slice(0, 8)
  const topSkillMap = new Map(overview.value.topSkills.map((s) => [s.skill, s.count]))
  const maxCount = overview.value.topSkills[0]?.count || 1

  const labels = userSkills
  // 用户自评：既然是用户声明的技能，默认给予 70-90 分
  const values = userSkills.map((_, i) => Math.max(60, 90 - i * 5))
  // 市场需求：基于该技能的出现频次
  const marketValues = userSkills.map((skill) => {
    const count = topSkillMap.get(skill) || 0
    return Math.round((count / maxCount) * 100)
  })

  return { labels, values, marketValues }
})

onMounted(async () => {
  try {
    const data = await fetchMarketOverview()
    overview.value = data
  } catch {
    // 忽略
  } finally {
    loading.value = false
  }
})

/** 开始编辑技能 */
function startEditSkills() {
  editSkills.value = [...(user.value?.skills || [])]
  editingSkills.value = true
}

/** 添加技能 */
function addSkill() {
  const skill = skillInput.value.trim()
  if (skill && !editSkills.value.includes(skill)) {
    editSkills.value.push(skill)
  }
  skillInput.value = ''
}

/** 删除技能 */
function removeSkill(index: number) {
  editSkills.value.splice(index, 1)
}

/** 保存技能 */
async function saveSkills() {
  try {
    const token = localStorage.getItem('accessToken')
    await $fetch(`${useApiBase()}/auth/profile`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: { skills: editSkills.value },
    })
    if (user.value) {
      user.value.skills = [...editSkills.value]
      localStorage.setItem('user', JSON.stringify(user.value))
    }
    editingSkills.value = false
    ElMessage.success('技能已更新')
  } catch {
    ElMessage.error('保存失败，请重试')
  }
}
</script>

<template>
  <ClientOnly>
    <div class="dashboard-page">
      <div class="dashboard-header">
        <h2>个人仪表盘</h2>
        <p class="dashboard-welcome">
          欢迎回来，{{ user?.nickname || user?.email }}
        </p>
      </div>

      <div v-if="loading" class="dashboard-loading">
        <el-skeleton :rows="6" animated />
      </div>

      <div v-else class="dashboard-grid">
        <!-- 个人信息卡片 -->
        <div class="dashboard-card profile-card">
          <h3 class="card-title">个人信息</h3>
          <div class="profile-info">
            <div class="profile-item">
              <span class="profile-label">邮箱</span>
              <span class="profile-value">{{ user?.email }}</span>
            </div>
            <div class="profile-item">
              <span class="profile-label">昵称</span>
              <span class="profile-value">{{ user?.nickname || '未设置' }}</span>
            </div>
            <div class="profile-item">
              <span class="profile-label">目标城市</span>
              <span class="profile-value">{{ user?.targetCity || '未设置' }}</span>
            </div>
            <div class="profile-item">
              <span class="profile-label">期望薪资</span>
              <span class="profile-value">
                {{ user?.targetSalary ? user.targetSalary + 'K' : '未设置' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 技能管理卡片 -->
        <div class="dashboard-card skills-card">
          <div class="card-title-row">
            <h3 class="card-title">我的技能</h3>
            <el-button v-if="!editingSkills" size="small" text type="primary" @click="startEditSkills">
              编辑
            </el-button>
          </div>

          <!-- 编辑模式 -->
          <div v-if="editingSkills" class="skills-edit">
            <div class="skills-tags">
              <el-tag
                v-for="(skill, idx) in editSkills"
                :key="skill"
                closable
                size="default"
                @close="removeSkill(idx)"
              >
                {{ skill }}
              </el-tag>
            </div>
            <div class="skill-add-row">
              <el-input
                v-model="skillInput"
                placeholder="输入技能名称"
                size="small"
                @keyup.enter="addSkill"
              />
              <el-button size="small" @click="addSkill">添加</el-button>
            </div>
            <div class="skill-actions">
              <el-button type="primary" size="small" @click="saveSkills">保存</el-button>
              <el-button size="small" @click="editingSkills = false">取消</el-button>
            </div>
          </div>

          <!-- 展示模式 -->
          <div v-else class="skills-display">
            <div v-if="user?.skills?.length" class="skills-tags">
              <el-tag
                v-for="skill in user.skills"
                :key="skill"
                effect="plain"
              >
                {{ skill }}
              </el-tag>
            </div>
            <el-empty v-else description="还没有添加技能" :image-size="60" />
          </div>
        </div>

        <!-- 技能雷达图 -->
        <div class="dashboard-card radar-card">
          <h3 class="card-title">技能雷达</h3>
          <div v-if="skillRadarData" class="radar-container">
            <DashboardSkillRadar
              :labels="skillRadarData.labels"
              :values="skillRadarData.values"
              :market-values="skillRadarData.marketValues"
            />
          </div>
          <el-empty v-else description="添加技能后查看雷达图" :image-size="80" />
        </div>

        <!-- 快捷入口 -->
        <div class="dashboard-card actions-card">
          <h3 class="card-title">快捷功能</h3>
          <div class="action-grid">
            <div class="action-item" @click="navigateTo('/chat?scene=skill-match')">
              <span class="action-icon">🎯</span>
              <span class="action-label">技能匹配分析</span>
            </div>
            <div class="action-item" @click="navigateTo('/chat?scene=interview-mock')">
              <span class="action-icon">🎤</span>
              <span class="action-label">模拟面试</span>
            </div>
            <div class="action-item" @click="navigateTo('/graph')">
              <span class="action-icon">🕸️</span>
              <span class="action-label">技术图谱</span>
            </div>
            <div class="action-item" @click="navigateTo('/jobs')">
              <span class="action-icon">💼</span>
              <span class="action-label">浏览岗位</span>
            </div>
          </div>
        </div>

        <!-- 市场概览 -->
        <div v-if="overview" class="dashboard-card overview-card">
          <h3 class="card-title">市场概览</h3>
          <DashboardMarketOverview :data="overview" />
        </div>
      </div>
    </div>
    <template #fallback>
      <div style="padding: 40px">
        <el-skeleton :rows="8" animated />
      </div>
    </template>
  </ClientOnly>
</template>

<style scoped lang="scss">
.dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 24px;

  h2 {
    margin: 0 0 4px;
    font-size: 24px;
    background: linear-gradient(135deg, #00e0ff, #7b61ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .dashboard-welcome {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    margin: 0;
  }
}

.dashboard-loading {
  padding: 20px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.dashboard-card {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  transition: border-color 0.3s, box-shadow 0.3s;

  &:hover {
    border-color: rgba(0, 224, 255, 0.15);
    box-shadow: 0 0 20px rgba(0, 224, 255, 0.05);
  }
}

.card-title {
  font-size: 16px;
  margin: 0 0 16px;
  color: rgba(255, 255, 255, 0.85);
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .card-title {
    margin: 0;
  }
}

/* 个人信息 */
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.profile-label {
  color: rgba(255, 255, 255, 0.45);
}

.profile-value {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

/* 技能管理 */
.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.skill-add-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.skill-actions {
  display: flex;
  gap: 8px;
}

/* 雷达图 */
.radar-container {
  display: flex;
  justify-content: center;
}

/* 快捷入口 */
.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    background: rgba(0, 224, 255, 0.06);
    border-color: rgba(0, 224, 255, 0.2);
    transform: translateY(-1px);
  }
}

.action-icon {
  font-size: 24px;
}

.action-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* 市场概览 */
.overview-card {
  grid-column: 1 / -1;
}
</style>
