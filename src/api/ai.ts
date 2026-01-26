import { http } from '@/utils/http'

// 这里的地址对应你本地运行的 SpringBoot 地址
const BASE_URL = 'http://localhost:8080'

// 上传音频并生成视频的接口
export const generateVideoApi = (params: FormData) => {
  return http('post', '/api/ai/generate', {
    data: params,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    // 设置超时，防止AI生成时间过长前端报错
    timeout: 60000000,
  })
}

// 获取历史记录
export const getHistoryApi = () => {
  return http('get', '/api/ai/history')
}
