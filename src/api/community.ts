import { http } from '@/utils/http'
import type { Result, ResultTable } from './system'

/** 社区帖子相关接口 */

/** 创建帖子 */
export const createPost = (data: {
  title: string
  content: string
  category: string
  tags?: string
  coverUrl?: string
  images?: string[]
  mvId?: number
  status: number
}) => {
  return http<Result>('post', '/community/post/create', { data })
}

/** 更新帖子 */
export const updatePost = (data: {
  id: number
  title?: string
  content?: string
  category?: string
  tags?: string
  coverUrl?: string
  status?: number
}) => {
  return http<Result>('put', '/community/post/update', { data })
}

/** 删除帖子 */
export const deletePost = (postId: number) => {
  return http<Result>('delete', `/community/post/delete/${postId}`)
}

/** 分页查询帖子列表 */
export const getPostList = (data: {
  category?: string
  keyword?: string
  tag?: string
  userId?: number
  isHot?: number
  sortBy?: string
  pageNum?: number
  pageSize?: number
}) => {
  return http<ResultTable>('post', '/community/post/list', { data })
}

/** 获取帖子详情 */
export const getPostDetail = (postId: number) => {
  return http<Result>('get', `/community/post/detail/${postId}`)
}

/** 点赞帖子 */
export const likePost = (postId: number) => {
  return http<Result>('post', `/community/post/like/${postId}`)
}

/** 取消点赞帖子 */
export const unlikePost = (postId: number) => {
  return http<Result>('delete', `/community/post/like/${postId}`)
}

/** 评论帖子 */
export const commentPost = (
  postId: number,
  content: string,
  parentId?: number
) => {
  // 使用URLSearchParams构建查询参数
  const params = new URLSearchParams()
  params.append('content', content)
  // 只有当 parentId 存在且大于 0 时才添加
  if (parentId !== undefined && parentId !== null && parentId > 0) {
    params.append('parentId', parentId.toString())
  }

  console.log('>>> [API] commentPost 参数:', {
    postId,
    content,
    parentId,
    url: `/community/post/comment/${postId}?${params.toString()}`,
  })

  return http<Result>(
    'post',
    `/community/post/comment/${postId}?${params.toString()}`
  )
}

/** 删除评论 */
export const deletePostComment = (commentId: number) => {
  return http<Result>('delete', `/community/post/comment/${commentId}`)
}

/** 点赞评论 */
export const likeComment = (commentId: number) => {
  return http<Result>('post', `/community/post/comment/like/${commentId}`)
}

/** 取消点赞评论 */
export const unlikeComment = (commentId: number) => {
  return http<Result>('delete', `/community/post/comment/like/${commentId}`)
}

/** 获取用户统计信息 */
export const getUserStats = (userId: number) => {
  return http<Result>('get', `/community/post/user/stats/${userId}`)
}

/** 收藏帖子 */
export const favoritePost = (postId: number) => {
  return http<Result>('post', `/community/post/favorite/${postId}`)
}

/** 取消收藏帖子 */
export const unfavoritePost = (postId: number) => {
  return http<Result>('delete', `/community/post/favorite/${postId}`)
}

/** 获取用户收藏列表 */
export const getUserFavorites = (
  pageNum: number = 1,
  pageSize: number = 10
) => {
  return http<ResultTable>(
    'get',
    `/community/post/favorites?pageNum=${pageNum}&pageSize=${pageSize}`
  )
}

/** ==================== 用户关注相关接口 ==================== */

/** 关注用户 */
export const followUser = (userId: number) => {
  return http<Result>('post', `/user/follow/${userId}`)
}

/** 取消关注用户 */
export const unfollowUser = (userId: number) => {
  return http<Result>('delete', `/user/follow/${userId}`)
}

/** 获取关注列表 */
export const getFollowingList = (
  userId: number,
  pageNum: number = 1,
  pageSize: number = 10
) => {
  return http<ResultTable>(
    'get',
    `/user/follow/following/${userId}?pageNum=${pageNum}&pageSize=${pageSize}`
  )
}

/** 获取粉丝列表 */
export const getFollowerList = (
  userId: number,
  pageNum: number = 1,
  pageSize: number = 10
) => {
  return http<ResultTable>(
    'get',
    `/user/follow/followers/${userId}?pageNum=${pageNum}&pageSize=${pageSize}`
  )
}

/** 获取关注统计 */
export const getFollowStats = (userId: number) => {
  return http<Result>('get', `/user/follow/stats/${userId}`)
}

/** ==================== 标签相关接口 ==================== */

/** 获取热门标签 */
export const getHotTags = (limit: number = 20) => {
  return http<Result>('get', `/tag/hot?limit=${limit}`)
}

/** 搜索标签 */
export const searchTags = (
  keyword?: string,
  pageNum: number = 1,
  pageSize: number = 20
) => {
  const params = new URLSearchParams()
  if (keyword) params.append('keyword', keyword)
  params.append('pageNum', pageNum.toString())
  params.append('pageSize', pageSize.toString())
  return http<ResultTable>('get', `/tag/search?${params.toString()}`)
}

/** ==================== 举报相关接口 ==================== */

/** 提交举报 */
export const submitReport = (data: {
  targetType: number
  targetId: number
  reasonType: string
  reasonDetail?: string
}) => {
  return http<Result>('post', '/report/submit', { data })
}

/** 检查是否已举报 */
export const checkReported = (targetType: number, targetId: number) => {
  return http<Result>(
    'get',
    `/report/check?targetType=${targetType}&targetId=${targetId}`
  )
}

/** ==================== 媒体上传相关接口 ==================== */

/** 上传图片 */
export const uploadImages = (files: File[]) => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  return http<Result>('post', '/community/post/upload/images', {
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/** 获取用户MV列表 */
export const getUserMvList = (userId?: number, status: number = 1) => {
  const params = new URLSearchParams()
  if (userId) params.append('userId', userId.toString())
  params.append('status', status.toString())
  return http<Result>('get', `/community/post/user-mvs?${params.toString()}`)
}

/** 获取MV详情 */
export const getMvDetail = (mvId: number) => {
  return http<Result>('get', `/community/post/mv/${mvId}`)
}

/** 同步本地MV文件到数据库 */
export const syncMvFiles = (userId?: number) => {
  const params = new URLSearchParams()
  if (userId) params.append('userId', userId.toString())
  return http<Result>('post', `/community/post/sync-mvs?${params.toString()}`)
}

/** 更新MV名称 */
export const updateMvName = (mvId: number, mvName: string) => {
  const params = new URLSearchParams()
  params.append('mvName', mvName)
  return http<Result>(
    
   
  
    'put',
    `/community/post/mv/${mvId}/name?${params.toString()}`
  )
}
