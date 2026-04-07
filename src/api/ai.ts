import { http } from '@/utils/http'

interface ApiResult<T = any> {
  code: number
  message: string
  data: T
}

export interface AiVideoTaskItem {
  id: number
  songName: string
  artistName?: string
  status: 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED'
  statusText?: string
  mvName?: string
  mvFileName?: string
  mvUrl?: string
  errorMessage?: string
  startTime?: string
  finishTime?: string
  createTime?: string
  updateTime?: string
}

export interface AiHistoryItem {
  fileName: string
  mvName?: string
  songName?: string
  url: string
  createTime: string
  size: string
}

export interface CreateVideoTaskParams {
  songName: string
  artistName?: string
  audioUrl: string
  styleCode?: string
  styleLabel?: string
}

// 兼容旧版同步接口，当前 AI 创作页已不再使用
export const generateVideoApi = (params: FormData) => {
  return http<ApiResult<string>>('post', '/api/ai/generate', {
    data: params,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000000,
  })
}

// 创建异步 MV 任务
export const createVideoTaskApi = (data: CreateVideoTaskParams) => {
  return http<ApiResult<AiVideoTaskItem>>('post', '/api/ai/tasks', { data })
}

// 获取当前用户任务列表
export const getVideoTaskListApi = () => {
  return http<ApiResult<AiVideoTaskItem[]>>('get', '/api/ai/tasks')
}

// 删除当前用户的单个任务
export const deleteVideoTaskApi = (taskId: number) => {
  return http<ApiResult<string>>('delete', `/api/ai/tasks/${taskId}`)
}

// 获取作品库历史
export const getHistoryApi = () => {
  return http<ApiResult<AiHistoryItem[]>>('get', '/api/ai/history')
}

// 重命名作品
export const renameMvFileApi = (oldFileName: string, newFileName: string) => {
  const params = new URLSearchParams()
  params.append('oldFileName', oldFileName)
  params.append('newFileName', newFileName)
  return http<ApiResult<string>>('put', `/api/ai/rename?${params.toString()}`)
}
