import { http } from '@/utils/http'

/**
 * Agent 单个动作定义
 */
export interface AgentAction {
  type: string
  payload?: Record<string, any>
}

/**
 * Agent 工具层返回的数据结构
 */
export interface AgentToolData {
  songId?: number
  songName?: string
  artistName?: string
  album?: string
  coverUrl?: string
  audioUrl?: string
  unreadCount?: number
  availablePoints?: number
  totalPoints?: number
  pagePath?: string
  pageName?: string
  success?: boolean
  message?: string
}

/**
 * Agent 聊天响应 data 部分
 */
export interface AgentChatData {
  reply: string
  actions: AgentAction[]
  toolData?: AgentToolData
}

/**
 * Agent 聊天接口统一返回
 */
export interface AgentChatResult {
  code: number
  message: string
  data: AgentChatData
}

/**
 * Agent 聊天请求参数
 */
export interface AgentChatRequest {
  message: string
  sessionId: string
  userId?: number
}

/**
 * 发送 Agent 聊天请求
 */
export const sendAgentChat = (data: AgentChatRequest) => {
  return http<AgentChatResult>('post', '/agent/chat', { data })
}
