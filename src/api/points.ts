import { http } from '@/utils/http'

// 获取用户积分信息
export const getUserPoints = () => {
  return http('get', '/api/points/info')
}

// 获取积分记录
export const getPointsLog = (params: {
  pageNum?: number
  pageSize?: number
}) => {
  return http('get', '/api/points/log', { params })
}

// 获取积分排行榜
export const getPointsRanking = (params: {
  pageNum?: number
  pageSize?: number
}) => {
  return http('get', '/api/points/ranking', { params })
}

// 获取今日任务完成状态
export const getDailyTaskStatus = () => {
  return http('get', '/api/points/daily-tasks')
}

// 扣除积分
export const deductPoints = (data: { points: number; description: string }) => {
  return http('post', '/api/points/deduct', { data })
}
