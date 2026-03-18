<template>
  <div class="mall-container">
    <!-- 头部信息 -->
    <div class="mall-header">
      <div class="user-points">
        <div class="points-info">
          <span class="points-label">我的积分</span>
          <span class="points-value">{{ userPoints }}</span>
        </div>
        <el-button type="primary" @click="$router.push('/points')" size="small">
          积分中心
        </el-button>
      </div>
    </div>

    <!-- 商品分类 -->
    <div class="category-tabs">
      <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
        <el-tab-pane label="全部" name="all"></el-tab-pane>
        <el-tab-pane label="帖子特权" name="post"></el-tab-pane>
        <el-tab-pane label="个性装扮" name="decoration"></el-tab-pane>
      </el-tabs>
    </div>

    <!-- 商品列表 -->
    <div class="items-grid" v-loading="loading">
      <div
        v-for="item in items"
        :key="item.id"
        class="item-card"
        :class="{ disabled: !item.canPurchase }"
      >
        <div class="item-icon">
          <i :class="getItemIcon(item.itemType, item.itemCode)"></i>
        </div>
        <div class="item-info">
          <h3 class="item-name">{{ item.itemName }}</h3>
          <p class="item-description">{{ item.itemDescription }}</p>
          <div class="item-duration" v-if="item.durationDays">
            有效期：{{ item.durationText }}
          </div>
        </div>
        <div class="item-footer">
          <div class="item-price">
            <i class="el-icon-coin"></i>
            {{ item.itemPrice }}积分
          </div>
          <el-button
            type="primary"
            size="small"
            :disabled="!item.canPurchase || userPoints < item.itemPrice"
            @click="handlePurchase(item)"
          >
            {{ userPoints < item.itemPrice ? '积分不足' : '兑换' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 购买记录 -->
    <div class="purchase-history">
      <h3>我的购买记录</h3>
      <el-table :data="purchases" style="width: 100%">
        <el-table-column prop="itemName" label="商品名称"></el-table-column>
        <el-table-column prop="price" label="消费积分">
          <template #default="scope"> {{ scope.row.price }}积分 </template>
        </el-table-column>
        <el-table-column prop="purchaseTime" label="购买时间">
          <template #default="scope">
            {{ formatTime(scope.row.purchaseTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="expireTime" label="到期时间">
          <template #default="scope">
            <span v-if="scope.row.expireTime">
              {{ formatTime(scope.row.expireTime) }}
            </span>
            <span v-else class="permanent">永久</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : 'info'">
              {{ scope.row.status === 'ACTIVE' ? '生效中' : '已过期' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 购买确认对话框 -->
    <el-dialog v-model="purchaseDialogVisible" title="确认购买" width="400px">
      <div class="purchase-confirm" v-if="selectedItem">
        <div class="item-preview">
          <i
            :class="getItemIcon(selectedItem.itemType, selectedItem.itemCode)"
          ></i>
          <div>
            <h4>{{ selectedItem.itemName }}</h4>
            <p>{{ selectedItem.itemDescription }}</p>
          </div>
        </div>
        <div class="price-info">
          <p>
            消费积分：<strong>{{ selectedItem.itemPrice }}</strong>
          </p>
          <p>
            剩余积分：<strong>{{ userPoints - selectedItem.itemPrice }}</strong>
          </p>
        </div>
        <div
          v-if="
            selectedItem.itemType === 'POST_TOP' ||
            selectedItem.itemType === 'POST_HIGHLIGHT'
          "
          class="target-selection"
        >
          <el-form-item label="选择帖子：">
            <el-select v-model="targetPostId" placeholder="请选择要应用的帖子">
              <el-option
                v-for="post in userPosts"
                :key="post.id"
                :label="post.title"
                :value="post.id"
              ></el-option>
            </el-select>
          </el-form-item>
        </div>
      </div>
      <template #footer>
        <el-button @click="purchaseDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmPurchase"
          :disabled="
            (selectedItem?.itemType === 'POST_TOP' ||
              selectedItem?.itemType === 'POST_HIGHLIGHT') &&
            !targetPostId
          "
        >
          确认购买
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMallItems, purchaseItem, getUserPurchases } from '@/api/mall'
import { getUserPoints } from '@/api/points'
import { getPostList } from '@/api/community'
import { UserStore } from '@/stores/modules/user'

const userStore = UserStore()

// 响应式数据
const loading = ref(false)
const activeCategory = ref('all')
const items = ref([])
const purchases = ref([])
const userPoints = ref(0)
const userPosts = ref([])

// 购买对话框
const purchaseDialogVisible = ref(false)
const selectedItem = ref(null)
const targetPostId = ref(null)

// 获取商品列表
const loadItems = async () => {
  try {
    loading.value = true
    const response = await getMallItems()
    if (response.code === 0) {
      // 根据分类过滤商品
      let filteredItems = response.data
      if (activeCategory.value === 'post') {
        filteredItems = response.data.filter(item => 
          item.itemType === 'POST_TOP' || item.itemType === 'POST_HIGHLIGHT'
        )
      } else if (activeCategory.value === 'decoration') {
        filteredItems = response.data.filter(item => 
          item.itemType === 'AVATAR_FRAME' || item.itemType === 'NICKNAME_COLOR'
        )
      }
      items.value = filteredItems
    }
  } catch (error) {
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

// 获取用户积分
const loadUserPoints = async () => {
  try {
    const response = await getUserPoints()
    if (response.code === 0) {
      userPoints.value = response.data.totalPoints
    }
  } catch (error) {
    console.error('获取用户积分失败:', error)
  }
}

// 获取购买记录
const loadPurchases = async () => {
  try {
    const response = await getUserPurchases()
    if (response.code === 0) {
      purchases.value = response.data
    }
  } catch (error) {
    console.error('获取购买记录失败:', error)
  }
}

// 获取用户帖子（用于帖子特权选择）
const loadUserPosts = async () => {
  try {
    const response = await getPostList({
      userId: userStore.userInfo?.userId,
      pageNum: 1,
      pageSize: 50,
    })
    if (response.code === 0) {
      userPosts.value = response.data.records || []
    }
  } catch (error) {
    console.error('获取用户帖子失败:', error)
  }
}

// 分类切换
const handleCategoryChange = () => {
  loadItems()
}

// 购买商品
const handlePurchase = (item) => {
  selectedItem.value = item
  targetPostId.value = null

  // 如果是帖子特权，需要加载用户帖子
  if (item.itemType === 'POST_TOP' || item.itemType === 'POST_HIGHLIGHT') {
    loadUserPosts()
  }

  purchaseDialogVisible.value = true
}

// 确认购买
const confirmPurchase = async () => {
  try {
    const params = {
      itemId: selectedItem.value.id,
    }

    if (
      (selectedItem.value.itemType === 'POST_TOP' ||
        selectedItem.value.itemType === 'POST_HIGHLIGHT') &&
      targetPostId.value
    ) {
      params.targetId = targetPostId.value
    }

    const response = await purchaseItem(params.itemId, params.targetId)
    if (response.code === 0) {
      ElMessage.success('购买成功！')
      purchaseDialogVisible.value = false
      // 刷新数据
      loadUserPoints()
      loadPurchases()
      loadItems()
    } else {
      ElMessage.error(response.message || '购买失败')
    }
  } catch (error) {
    ElMessage.error('购买失败')
  }
}

// 获取商品图标
const getItemIcon = (type, code) => {
  const iconMap = {
    POST_TOP: 'el-icon-top',
    POST_HIGHLIGHT: 'el-icon-star-on',
    AVATAR_FRAME_GOLD: 'el-icon-medal',
    AVATAR_FRAME_DIAMOND: 'el-icon-trophy',
    NICKNAME_COLOR_RED: 'el-icon-brush',
    NICKNAME_COLOR_BLUE: 'el-icon-brush',
    NICKNAME_COLOR_PURPLE: 'el-icon-brush',
    NICKNAME_COLOR_GRADIENT: 'el-icon-magic-stick',
  }
  return iconMap[code] || 'el-icon-present'
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return new Date(timeStr).toLocaleString()
}

// 监听用户变化
watch(
  () => userStore.userInfo,
  (newUser) => {
    if (newUser) {
      loadUserPoints()
      loadPurchases()
    }
  },
  { immediate: true }
)

// 页面加载
onMounted(() => {
  loadItems()
  if (userStore.userInfo) {
    loadUserPoints()
    loadPurchases()
  }
})
</script>

<style scoped>
.mall-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.mall-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.user-points {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.points-info {
  display: flex;
  flex-direction: column;
}

.points-label {
  font-size: 14px;
  opacity: 0.9;
}

.points-value {
  font-size: 28px;
  font-weight: bold;
  margin-top: 5px;
}

.category-tabs {
  margin-bottom: 20px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.item-card {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s;
  background: white;
}

.item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.item-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.item-icon {
  text-align: center;
  margin-bottom: 15px;
}

.item-icon i {
  font-size: 48px;
  color: #409eff;
}

.item-info {
  text-align: center;
  margin-bottom: 20px;
}

.item-name {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: #303133;
}

.item-description {
  color: #606266;
  font-size: 14px;
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.item-duration {
  color: #909399;
  font-size: 12px;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.purchase-history {
  margin-top: 40px;
}

.purchase-history h3 {
  margin-bottom: 20px;
  color: #303133;
}

.permanent {
  color: #67c23a;
}

.purchase-confirm {
  text-align: center;
}

.item-preview {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.item-preview i {
  font-size: 32px;
  color: #409eff;
}

.item-preview h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.item-preview p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.price-info {
  margin-bottom: 20px;
}

.price-info p {
  margin: 5px 0;
  color: #606266;
}

.target-selection {
  text-align: left;
}
</style>
