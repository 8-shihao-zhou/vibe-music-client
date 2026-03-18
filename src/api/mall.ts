import { http } from '@/utils/http'

// 获取商城商品列表
export const getMallItems = (type?: string) => {
  return http('get', '/api/mall/items', { params: { type } })
}

// 购买商品
export const purchaseItem = (itemId: number, targetId?: number) => {
  return http('post', '/api/mall/purchase', { params: { itemId, targetId } })
}

// 获取用户购买记录
export const getUserPurchases = () => {
  return http('get', '/api/mall/purchases')
}

// 检查用户特权
export const checkPrivilege = (privilegeType: string, targetId?: number) => {
  return http('get', '/api/mall/privilege/check', {
    params: { privilegeType, targetId },
  })
}
