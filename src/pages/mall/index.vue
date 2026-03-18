<template>
  <div class="mall-container">
    <!-- 头部区域 -->
    <div class="mall-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <el-icon class="title-icon"><Shop /></el-icon>
            积分商城
          </h1>
          <p class="page-subtitle">用积分兑换专属特权，让你的体验更精彩</p>
        </div>
        <div class="points-display">
          <div class="points-card">
            <div class="points-icon">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="points-info">
              <div class="points-label">我的积分</div>
              <div class="points-value">{{ userPoints }}</div>
            </div>
            <el-button
              type="primary"
              plain
              @click="$router.push('/points')"
              size="small"
            >
              积分中心
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类导航 -->
    <div class="category-section">
      <el-tabs
        v-model="activeCategory"
        @tab-change="handleCategoryChange"
        class="mall-tabs"
      >
        <el-tab-pane label="全部商品" name="all">
          <template #label>
            <span class="tab-label">
              <el-icon><Grid /></el-icon>
              全部商品
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="帖子特权" name="post">
          <template #label>
            <span class="tab-label">
              <el-icon><Star /></el-icon>
              帖子特权
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="个性装扮" name="decoration">
          <template #label>
            <span class="tab-label">
              <el-icon><Brush /></el-icon>
              个性装扮
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 商品网格 -->
    <div class="products-section" v-loading="loading">
      <div class="products-grid">
        <div
          v-for="item in items"
          :key="item.id"
          class="product-card"
          :class="{ disabled: !item.canPurchase, owned: item.alreadyOwned }"
        >
          <div class="product-header">
            <div class="product-icon">
              <el-icon :class="getItemIconClass(item.itemType, item.itemCode)">
                <component :is="getItemIcon(item.itemType)" />
              </el-icon>
            </div>
            <div class="product-badges">
              <el-tag v-if="item.alreadyOwned" type="success" size="small"
                >已拥有</el-tag
              >
              <el-tag v-if="item.durationDays === 0" type="warning" size="small"
                >永久</el-tag
              >
            </div>
          </div>

          <div class="product-content">
            <h3 class="product-name">{{ item.itemName }}</h3>
            <p class="product-description">{{ item.itemDescription }}</p>

            <div class="product-details">
              <div class="product-type">
                <el-tag size="small" :type="getTypeTagType(item.itemType)">
                  {{ item.itemTypeName }}
                </el-tag>
              </div>
              <div class="product-duration">
                <el-icon><Timer /></el-icon>
                {{ item.durationText }}
              </div>
            </div>
          </div>

          <div class="product-footer">
            <div class="price-section">
              <span class="price-label">价格</span>
              <div class="price-value">
                <el-icon class="coin-icon"><Coin /></el-icon>
                {{ item.itemPrice }}
              </div>
            </div>

            <el-button
              type="primary"
              :disabled="!item.canPurchase || item.alreadyOwned"
              @click="handlePurchase(item)"
              class="purchase-btn"
            >
              <template v-if="item.alreadyOwned">
                <el-icon><Check /></el-icon>
                已拥有
              </template>
              <template v-else-if="!item.canPurchase">
                <el-icon><Lock /></el-icon>
                积分不足
              </template>
              <template v-else>
                <el-icon><ShoppingCart /></el-icon>
                立即兑换
              </template>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && items.length === 0" class="empty-state">
        <el-empty description="暂无商品" />
      </div>
    </div>

    <!-- 购买确认对话框 -->
    <el-dialog
      v-model="purchaseDialogVisible"
      title="确认兑换"
      width="500px"
      class="purchase-dialog"
    >
      <div v-if="selectedItem" class="purchase-content">
        <div class="purchase-item">
          <div class="item-icon">
            <el-icon
              :class="
                getItemIconClass(selectedItem.itemType, selectedItem.itemCode)
              "
            >
              <component :is="getItemIcon(selectedItem.itemType)" />
            </el-icon>
          </div>
          <div class="item-info">
            <h4>{{ selectedItem.itemName }}</h4>
            <p>{{ selectedItem.itemDescription }}</p>
            <div class="item-price">
              <el-icon><Coin /></el-icon>
              {{ selectedItem.itemPrice }} 积分
            </div>
          </div>
        </div>

        <!-- 帖子选择 -->
        <div
          v-if="
            selectedItem.itemType === 'POST_TOP' ||
            selectedItem.itemType === 'POST_HIGHLIGHT'
          "
          class="target-selection"
        >
          <h5>选择要应用的帖子：</h5>
          <el-select
            v-model="targetPostId"
            placeholder="请选择帖子"
            style="width: 100%"
          >
            <el-option
              v-for="post in userPosts"
              :key="post.id"
              :label="post.title"
              :value="post.id"
            />
          </el-select>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer" style="display: flex; justify-content: space-between; padding: 0 4px;">
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
            确认兑换
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Shop,
  Coin,
  Grid,
  Star,
  Brush,
  Timer,
  Check,
  Lock,
  ShoppingCart,
  Top,
  StarFilled,
  Medal,
  MagicStick,
} from '@element-plus/icons-vue'
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
        filteredItems = response.data.filter(
          (item) =>
            item.itemType === 'POST_TOP' || item.itemType === 'POST_HIGHLIGHT'
        )
      } else if (activeCategory.value === 'decoration') {
        filteredItems = response.data.filter(
          (item) =>
            item.itemType === 'AVATAR_FRAME' ||
            item.itemType === 'NICKNAME_COLOR'
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
      ElMessage.success('兑换成功！')
      purchaseDialogVisible.value = false
      loadItems()
      loadUserPoints()
      loadPurchases()
    } else {
      ElMessage.error(response.message || '兑换失败')
    }
  } catch (error) {
    ElMessage.error('兑换失败，请重试')
  }
}

// 获取商品图标
const getItemIcon = (type) => {
  const iconMap = {
    POST_TOP: Top,
    POST_HIGHLIGHT: StarFilled,
    AVATAR_FRAME: Medal,
    NICKNAME_COLOR: MagicStick,
  }
  return iconMap[type] || Shop
}

// 获取图标样式类
const getItemIconClass = (type, code) => {
  const classMap = {
    POST_TOP: 'icon-post-top',
    POST_HIGHLIGHT: 'icon-post-highlight',
    AVATAR_FRAME_GOLD: 'icon-frame-gold',
    AVATAR_FRAME_RAINBOW: 'icon-frame-rainbow',
    NICKNAME_COLOR_RED: 'icon-color-red',
    NICKNAME_COLOR_BLUE: 'icon-color-blue',
    NICKNAME_COLOR_PURPLE: 'icon-color-purple',
    NICKNAME_COLOR_GRADIENT: 'icon-color-gradient',
  }
  return classMap[code] || 'icon-default'
}

// 获取类型标签颜色
const getTypeTagType = (type) => {
  const typeMap = {
    POST_TOP: 'danger',
    POST_HIGHLIGHT: 'warning',
    AVATAR_FRAME: 'success',
    NICKNAME_COLOR: 'info',
  }
  return typeMap[type] || 'primary'
}

// 页面加载时获取数据
onMounted(() => {
  loadItems()
  loadUserPoints()
  loadPurchases()
})

// 监听分类变化
watch(
  activeCategory,
  () => {
    loadItems()
  },
  { immediate: true }
)
</script>

<style scoped>
.mall-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

/* 头部区域 */
.mall-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.title-section {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.title-icon {
  font-size: 36px;
  color: #667eea;
}

.page-subtitle {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
}

.points-display {
  flex-shrink: 0;
}

.points-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 20px 25px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.points-icon {
  font-size: 24px;
}

.points-info {
  text-align: center;
}

.points-label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.points-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

/* 分类导航 */
.category-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.mall-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.mall-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.mall-tabs :deep(.el-tabs__item) {
  padding: 15px 25px;
  font-weight: 500;
  border-radius: 10px;
  margin-right: 10px;
  transition: all 0.3s ease;
}

.mall-tabs :deep(.el-tabs__item.is-active) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 商品网格 */
.products-section {
  min-height: 400px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
}

.product-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.product-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.product-card.owned {
  border-color: #67c23a;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.product-icon {
  width: 60px;
  height: 60px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.product-badges {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.product-content {
  margin-bottom: 20px;
}

.product-name {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.product-description {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0 0 15px 0;
  line-height: 1.5;
}

.product-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.product-duration {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #95a5a6;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
}

.price-section {
  text-align: left;
}

.price-label {
  display: block;
  font-size: 12px;
  color: #95a5a6;
  margin-bottom: 4px;
}

.price-value {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 18px;
  font-weight: 700;
  color: #e67e22;
}

.coin-icon {
  color: #f39c12;
}

.purchase-btn {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
}

/* 图标样式 */
.icon-post-top {
  color: #e74c3c;
}
.icon-post-highlight {
  color: #f39c12;
}
.icon-frame-gold {
  color: #f1c40f;
}
.icon-frame-rainbow {
  background: linear-gradient(
    45deg,
    #ff6b6b,
    #4ecdc4,
    #45b7d1,
    #96ceb4,
    #ffeaa7
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.icon-color-red {
  color: #e74c3c;
}
.icon-color-blue {
  color: #3498db;
}
.icon-color-purple {
  color: #9b59b6;
}
.icon-color-gradient {
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

/* 购买对话框 */
.purchase-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

.purchase-content {
  padding: 20px 0;
}

.purchase-item {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 15px;
  margin-bottom: 20px;
}

.purchase-item .item-icon {
  width: 60px;
  height: 60px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.purchase-item .item-info h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.purchase-item .item-info p {
  margin: 0 0 10px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.purchase-item .item-price {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  color: #e67e22;
}

.target-selection {
  margin-top: 20px;
}

.target-selection h5 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mall-container {
    padding: 15px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .product-footer {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .purchase-btn {
    width: 100%;
  }
}
</style>
