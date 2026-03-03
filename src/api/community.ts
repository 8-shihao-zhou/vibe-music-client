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
