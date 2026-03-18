<template>
  <div class="points-center">
    <!-- 头部 -->
    <div class="points-header">
      <h1 class="page-title"><el-icon class="title-icon"><Coin /></el-icon>积分中心</h1>
      <p class="page-subtitle">管理你的积分，提升等级，解锁更多特权</p>
    </div>

    <!-- 概览 + 侧边栏 -->
    <div class="overview-section">
      <!-- 左：积分概览卡片 -->
      <div class="points-overview-card">
        <!-- 顶部：积分 + 三项统计 横排 -->
        <div class="points-main">
          <div class="points-display">
            <div class="points-icon"><el-icon><Coin /></el-icon></div>
            <div class="points-info">
              <div class="points-value">{{ userPoints.availablePoints || 0 }}</div>
              <div class="points-label">可用积分</div>
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ userPoints.totalPoints || 0 }}</div>
              <div class="stat-label">总积分</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">
                <span class="level-badge">{{ userPoints.levelName || '新手' }}</span>
              </div>
              <div class="stat-label">当前等级</div>
            </div>
            <div class="stat-item">
              <div class="stat-value ranking-val">第 {{ userPoints.ranking || '-' }} 名</div>
              <div class="stat-label">积分排名</div>
            </div>
          </div>
        </div>

        <!-- 等级进度 -->
        <div class="level-progress">
          <div class="progress-header">
            <span class="current-level">{{ userPoints.levelName || '新手' }}</span>
            <span class="progress-text" v-if="userPoints.nextLevelPoints > 0">
              距下一级还需 <em>{{ userPoints.nextLevelPoints - userPoints.totalPoints }}</em> 积分
            </span>
            <span class="progress-text" v-else>已满级 🎉</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: getProgressPercentage() + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- 右：操作卡片 -->
      <div class="quick-actions">
        <!-- 积分商城 -->
        <div class="action-card mall-entry" @click="goToMall">
          <div class="action-icon mall"><el-icon><Shop /></el-icon></div>
          <div class="action-content">
            <div class="action-title">积分商城</div>
            <div class="action-subtitle">兑换特权和装扮</div>
          </div>
          <el-icon class="action-arrow"><ArrowRight /></el-icon>
        </div>

        <!-- 每日任务 -->
        <div class="action-card" @click="openTasks">
          <div class="action-icon tasks"><el-icon><Trophy /></el-icon></div>
          <div class="action-content">
            <div class="action-title">每日任务</div>
            <div class="action-subtitle">完成任务获得积分</div>
          </div>
          <el-icon class="action-arrow"><ArrowRight /></el-icon>
        </div>

        <!-- 排行榜入口 -->
        <div class="action-card" @click="openRanking">
          <div class="action-icon ranking"><el-icon><Medal /></el-icon></div>
          <div class="action-content">
            <div class="action-title">积分排行榜</div>
            <div class="action-subtitle">查看用户积分排名</div>
          </div>
          <el-icon class="action-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 积分记录 -->
    <div class="records-section">
      <div class="section-header">
        <h2 class="section-title"><el-icon><List /></el-icon>积分记录</h2>
        <div class="filter-tabs">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="全部" name="all"></el-tab-pane>
            <el-tab-pane label="获得" name="earn"></el-tab-pane>
            <el-tab-pane label="消费" name="spend"></el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <div class="records-list" v-loading="recordsLoading">
        <div
          v-for="record in filteredRecords"
          :key="record.id"
          class="record-item"
          :class="{ earn: record.changeType === 'EARN', spend: record.changeType === 'SPEND' }"
        >
          <div class="record-icon">
            <el-icon v-if="record.changeType === 'EARN'"><Plus /></el-icon>
            <el-icon v-else><Minus /></el-icon>
          </div>
          <div class="record-content">
            <div class="record-title">{{ record.description }}</div>
            <div class="record-time">{{ formatTime(record.createTime) }}</div>
          </div>
          <div class="record-points" :class="(record.changeType || 'earn').toLowerCase()">
            {{ record.changeType === 'EARN' ? '+' : '-' }}{{ Math.abs(record.points) }}
          </div>
        </div>
        <div v-if="!recordsLoading && filteredRecords.length === 0" class="empty-state">
          <el-empty description="暂无积分记录" />
        </div>
      </div>

      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 每日任务对话框 -->
    <el-dialog v-model="showTasksDialog" title="每日任务" width="560px" class="tasks-dialog">
      <div class="tasks-content">
        <div class="task-item" v-for="task in dailyTasks" :key="task.id">
          <div class="task-icon" :class="{ done: task.completed }">
            <el-icon><Star /></el-icon>
          </div>
          <div class="task-info">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-description">{{ task.description }}</div>
            <div class="task-progress-row">
              <span class="task-reward">+{{ task.reward }} 积分/次</span>
              <span class="task-count" :class="{ completed: task.completed }">
                {{ Math.min(task.count, task.target) }}/{{ task.target }}
              </span>
            </div>
            <div class="task-progress-bar" v-if="task.target > 1">
              <div
                class="task-progress-fill"
                :style="{ width: Math.min(100, (task.count / task.target) * 100) + '%' }"
              ></div>
            </div>
          </div>
          <div class="task-status">
            <el-tag v-if="task.completed" type="success">已完成</el-tag>
            <el-tag v-else-if="task.action === 'auto'" type="info">自动完成</el-tag>
            <el-button v-else type="primary" size="small" @click="completeTask(task)">去完成</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
    <!-- 排行榜对话框 -->
    <el-dialog v-model="showRankingDialog" title="积分排行榜" width="500px" class="tasks-dialog">
      <div class="ranking-dialog-content" v-loading="rankingLoading">
        <div
          v-for="(item, index) in rankingList"
          :key="item.userId"
          class="ranking-item"
          :class="{ 'is-me': item.userId === currentUserId }"
        >
          <div class="rank-no" :class="'rank-' + (index + 1)">
            <el-icon v-if="index < 3"><Medal /></el-icon>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="rank-name">{{ item.username || ('用户' + item.userId) }}</div>
          <span class="level-tag">{{ item.levelName }}</span>
          <div class="rank-points">{{ item.totalPoints }} <small>分</small></div>
        </div>
        <div v-if="!rankingLoading && rankingList.length === 0" class="ranking-empty">暂无数据</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Coin, Shop, Trophy, List, ArrowRight, Plus, Minus, Star, Medal } from '@element-plus/icons-vue'
import { getUserPoints, getPointsLog, getPointsRanking, getDailyTaskStatus } from '@/api/points'
import { UserStore } from '@/stores/modules/user'

const userStore = UserStore()
const router = useRouter()

const currentUserId = computed(() => userStore.userInfo?.userId)

const userPoints = ref<any>({
  totalPoints: 0, availablePoints: 0, level: 1,
  levelName: '新手', nextLevelPoints: 100, ranking: 0,
})
const pointsRecords = ref<any[]>([])
const recordsLoading = ref(false)
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showTasksDialog = ref(false)
const showRankingDialog = ref(false)

// 排行榜
const rankingList = ref<any[]>([])
const rankingLoading = ref(false)

const dailyTasks = ref([
  {
    id: 'DAILY_LOGIN',
    title: '每日登录',
    description: '每天登录系统获得积分奖励',
    reward: 5,
    target: 1,
    count: 0,
    completed: false,
    action: 'auto',
  },
  {
    id: 'POST_CREATE',
    title: '发布帖子',
    description: '在社区发布一篇帖子',
    reward: 10,
    target: 1,
    count: 0,
    completed: false,
    action: 'navigate',
    route: '/community/create',
  },
  {
    id: 'COMMENT_CREATE',
    title: '评论交流',
    description: '在社区发表评论',
    reward: 2,
    target: 3,
    count: 0,
    completed: false,
    action: 'navigate',
    route: '/community',
  },
])

const filteredRecords = computed(() => {
  if (activeTab.value === 'earn') return pointsRecords.value.filter(r => r.changeType === 'EARN')
  if (activeTab.value === 'spend') return pointsRecords.value.filter(r => r.changeType === 'SPEND')
  return pointsRecords.value
})

const getProgressPercentage = () => {
  if (!userPoints.value.nextLevelPoints || userPoints.value.nextLevelPoints <= 0) return 100
  const current = userPoints.value.totalPoints || 0
  const next = userPoints.value.nextLevelPoints
  const prev = [0, 0, 100, 300, 600, 1000][userPoints.value.level] || 0
  return Math.min(100, ((current - prev) / (next - prev)) * 100)
}

const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const diff = Date.now() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return date.toLocaleDateString()
}

const loadUserPoints = async () => {
  try {
    const res: any = await getUserPoints()
    if (res.code === 0) userPoints.value = res.data
  } catch (e) { console.error(e) }
}

const loadPointsRecords = async () => {
  try {
    recordsLoading.value = true
    const res: any = await getPointsLog({ pageNum: currentPage.value, pageSize: pageSize.value })
    if (res.code === 0) {
      pointsRecords.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (e) { console.error(e) }
  finally { recordsLoading.value = false }
}

const loadRanking = async () => {
  try {
    rankingLoading.value = true
    const res: any = await getPointsRanking({ pageNum: 1, pageSize: 5 })
    if (res.code === 0) rankingList.value = res.data.records || []
  } catch (e) { console.error(e) }
  finally { rankingLoading.value = false }
}

const goToMall = () => router.push('/mall')
const openRanking = () => { showRankingDialog.value = true; loadRanking() }

const openTasks = async () => {
  showTasksDialog.value = true
  await loadDailyTaskStatus()
}

const loadDailyTaskStatus = async () => {
  try {
    const res: any = await getDailyTaskStatus()
    if (res.code === 0 && Array.isArray(res.data)) {
      res.data.forEach((item: any) => {
        const task = dailyTasks.value.find(t => t.id === item.actionType)
        if (task) {
          task.count = item.count
          task.target = item.target
          task.completed = item.completed
          task.reward = item.pointsPerAction
        }
      })
    }
  } catch (e) { console.error(e) }
}

const completeTask = (task: any) => {
  if (task.action === 'navigate') {
    showTasksDialog.value = false
    router.push(task.route)
  }
}
const handleTabChange = () => { currentPage.value = 1; loadPointsRecords() }
const handleSizeChange = (size: number) => { pageSize.value = size; currentPage.value = 1; loadPointsRecords() }
const handleCurrentChange = (page: number) => { currentPage.value = page; loadPointsRecords() }

onMounted(() => { loadUserPoints(); loadPointsRecords() })

watch(() => userStore.userInfo.userId, (newId, oldId) => {
  if (newId !== oldId) {
    const reset = { totalPoints: 0, availablePoints: 0, level: 1, levelName: '新手', nextLevelPoints: 100, ranking: 0 }
    userPoints.value = reset
    pointsRecords.value = []
    rankingList.value = []
    if (newId) { loadUserPoints(); loadPointsRecords() }
  }
})
</script>

<style scoped>
.points-center {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
}

/* 头部 */
.points-header { text-align: center; margin-bottom: 24px; }
.page-title {
  display: inline-flex; align-items: center; gap: 10px;
  font-size: 26px; font-weight: 700; color: #fff; margin: 0 0 6px;
}
.title-icon { font-size: 28px; color: #ffd700; }
.page-subtitle { font-size: 13px; color: rgba(255,255,255,0.75); margin: 0; }

/* 布局 */
.overview-section {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  margin-bottom: 20px;
  align-items: stretch;
}

/* 概览卡片 */
.points-overview-card {
  background: rgba(255,255,255,0.96);
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.points-main {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
}

.points-display {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.points-icon {
  width: 60px; height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  display: flex; align-items: center; justify-content: center;
  font-size: 30px; color: white;
  box-shadow: 0 4px 14px rgba(255,215,0,0.35);
}

.points-value { font-size: 40px; font-weight: 700; color: #1a1a2e; line-height: 1; }
.points-label { font-size: 13px; color: #8e9aaf; margin-top: 4px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  flex: 1;
}

.stat-item {
  text-align: center;
  padding: 14px 10px;
  background: #f4f6fb;
  border-radius: 12px;
}

.stat-value { font-size: 20px; font-weight: 600; color: #2c3e50; margin-bottom: 5px; }
.stat-label { font-size: 11px; color: #a0aab8; letter-spacing: 0.5px; }

.level-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.ranking-val { color: #e67e22; font-size: 18px; }

/* 进度条 */
.level-progress { border-top: 1px solid #eef0f5; padding-top: 16px; }
.progress-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.current-level { font-size: 13px; font-weight: 600; color: #2c3e50; }
.progress-text { font-size: 12px; color: #a0aab8; }
.progress-text em { font-style: normal; color: #667eea; font-weight: 600; }
.progress-bar { height: 7px; background: #eef0f5; border-radius: 4px; overflow: hidden; }
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.4s ease;
}

/* 右侧操作区 */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-card {
  background: rgba(255,255,255,0.96);
  border-radius: 14px;
  padding: 16px;
  display: flex; align-items: center; gap: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 3px 12px rgba(0,0,0,0.07);
  flex: 1;
}
.action-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); }

.action-icon {
  width: 42px; height: 42px; border-radius: 11px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: white; flex-shrink: 0;
}
.action-icon.mall { background: linear-gradient(135deg, #f093fb, #f5576c); }
.action-icon.tasks { background: linear-gradient(135deg, #ffd700, #ff9500); }
.action-icon.ranking { background: linear-gradient(135deg, #43e97b, #38f9d7); }

.action-title { font-size: 14px; font-weight: 600; color: #2c3e50; }
.action-subtitle { font-size: 11px; color: #a0aab8; margin-top: 2px; }
.action-content { flex: 1; }
.action-arrow { color: #c8cdd8; font-size: 16px; }

/* 排行榜 dialog */
.ranking-dialog-content { padding: 4px 0; min-height: 100px; }

.ranking-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 8px;
  background: #f8f9fc;
  transition: background 0.2s;
}
.ranking-item.is-me {
  background: linear-gradient(135deg, rgba(102,126,234,0.12), rgba(118,75,162,0.08));
  border: 1px solid rgba(102,126,234,0.2);
}

.rank-no {
  width: 30px; height: 30px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; flex-shrink: 0;
  background: #e8eaf0; color: #8e9aaf;
}
.rank-1 { background: linear-gradient(135deg, #ffd700, #ffb300); color: white; font-size: 16px; }
.rank-2 { background: linear-gradient(135deg, #b0bec5, #90a4ae); color: white; font-size: 16px; }
.rank-3 { background: linear-gradient(135deg, #ff8a65, #ff7043); color: white; font-size: 16px; }

.rank-name { flex: 1; font-size: 13px; font-weight: 500; color: #2c3e50; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.level-tag {
  font-size: 11px; color: #667eea;
  background: rgba(102,126,234,0.1);
  padding: 2px 8px; border-radius: 6px; flex-shrink: 0;
}
.rank-points { font-size: 14px; font-weight: 700; color: #667eea; flex-shrink: 0; }
.rank-points small { font-size: 11px; font-weight: 400; color: #a0aab8; }
.ranking-empty { text-align: center; font-size: 13px; color: #a0aab8; padding: 20px 0; }

/* 积分记录 */
.records-section {
  background: rgba(255,255,255,0.96);
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.1);
}

.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 600; color: #2c3e50; margin: 0;
}

.filter-tabs :deep(.el-tabs__header) { margin: 0; }
.filter-tabs :deep(.el-tabs__nav-wrap::after) { display: none; }
.filter-tabs :deep(.el-tabs__item) { padding: 8px 16px; font-size: 13px; }

.records-list { min-height: 200px; }

.record-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 10px;
  background: #f8f9fc;
  transition: all 0.2s;
}
.record-item:hover { background: #eef0f8; transform: translateX(4px); }
.record-item.earn { border-left: 3px solid #27ae60; }
.record-item.spend { border-left: 3px solid #e74c3c; }

.record-icon {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; color: white; flex-shrink: 0;
}
.record-item.earn .record-icon { background: #27ae60; }
.record-item.spend .record-icon { background: #e74c3c; }

.record-title { font-size: 13px; font-weight: 500; color: #2c3e50; }
.record-time { font-size: 11px; color: #a0aab8; margin-top: 2px; }
.record-content { flex: 1; }

.record-points { font-size: 15px; font-weight: 700; }
.record-points.earn { color: #27ae60; }
.record-points.spend { color: #e74c3c; }

.empty-state { text-align: center; padding: 40px 20px; }
.pagination-wrapper { margin-top: 20px; text-align: center; }

/* 任务弹窗 */
.tasks-dialog :deep(.el-dialog) { border-radius: 18px; }
.tasks-content { padding: 10px 0; }
.task-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px; border-radius: 10px; margin-bottom: 10px; background: #f8f9fc;
}
.task-icon {
  width: 36px; height: 36px; border-radius: 9px;
  background: linear-gradient(135deg, #ffd700, #ff9500);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: white; flex-shrink: 0;
}
.task-icon.done { background: linear-gradient(135deg, #27ae60, #2ecc71); }
.task-title { font-size: 13px; font-weight: 600; color: #2c3e50; }
.task-description { font-size: 11px; color: #a0aab8; margin: 2px 0 4px; }
.task-progress-row { display: flex; align-items: center; justify-content: space-between; }
.task-reward { font-size: 11px; color: #e67e22; font-weight: 500; }
.task-count { font-size: 11px; color: #a0aab8; font-weight: 600; }
.task-count.completed { color: #27ae60; }
.task-progress-bar {
  height: 4px; background: #eef0f5; border-radius: 2px;
  overflow: hidden; margin-top: 5px;
}
.task-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
  transition: width 0.3s ease;
}
.task-info { flex: 1; }

/* 响应式 */
@media (max-width: 900px) {
  .overview-section { grid-template-columns: 1fr; }
  .points-main { flex-direction: column; align-items: flex-start; }
  .stats-grid { width: 100%; }
}
@media (max-width: 600px) {
  .points-center { padding: 14px; }
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
