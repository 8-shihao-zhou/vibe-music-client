const API_BASE_URL = 'http://localhost:8080'
const LOCAL_MINIO_HOSTS = ['127.0.0.1:9000', 'localhost:9000']

/**
 * 统一将媒体地址转换为前端可访问的地址
 * 1. 已经是代理地址则直接返回
 * 2. MinIO 直链统一转为后端代理
 * 3. 相对路径也走后端代理
 */
export const normalizeMediaUrl = (url?: string | null) => {
  if (!url) return ''

  const trimmedUrl = url.trim()
  if (!trimmedUrl) return ''

  if (trimmedUrl.includes('/file/proxy?path=')) {
    return trimmedUrl
  }

  if (trimmedUrl.startsWith('blob:') || trimmedUrl.startsWith('data:')) {
    return trimmedUrl
  }

  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    if (trimmedUrl.startsWith(`${API_BASE_URL}/files/`)) {
      return trimmedUrl
    }

    const shouldProxy = LOCAL_MINIO_HOSTS.some(host => trimmedUrl.includes(host))
    return shouldProxy
      ? `${API_BASE_URL}/file/proxy?path=${encodeURIComponent(trimmedUrl)}`
      : trimmedUrl
  }

  const shouldProxyRelative =
    trimmedUrl.startsWith('songCovers/') ||
    trimmedUrl.startsWith('songs/') ||
    trimmedUrl.startsWith('playlists/') ||
    trimmedUrl.startsWith('artists/')

  return shouldProxyRelative
    ? `${API_BASE_URL}/file/proxy?path=${encodeURIComponent(trimmedUrl)}`
    : trimmedUrl
}
