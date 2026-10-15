export function parseURL(url: string): { protocol: string; host: string; pathname: string } | null {
  // 处理没有协议的情况，假设使用当前页面的域名
  if (url.includes('://') === false) {
    url = `${window.location.protocol}//${window.location.host}${url.startsWith('/') ? '' : '/'}${url}`
  }

  let urlRegex = /^(https?:)\/\/(.*?)(\/.*|$)/
  let match = url.match(urlRegex)

  if (match === null) return null

  let protocol = match[1]
  let host = match[2]
  if (protocol === void 0 || host === void 0) {
    throw new Error('解析失败')
  }

  return {
    protocol: protocol,
    host: host,
    pathname: match[3] ?? '/',
  }
}

export function 构建WebSocket地址(参数: {
  协议: 'ws:' | 'wss:'
  主机: string
  路径: string
  id参数键: string
  id: string
  查询参数?: Record<string, string>
}): string {
  let 根地址 = `${参数.协议}//${参数.主机}`
  let 地址 = new URL(参数.路径, 根地址)
  if (地址.protocol !== 参数.协议 || 地址.host !== 参数.主机) throw new Error('WebSocket 路径不能指向其他主机')
  for (let [键, 值] of Object.entries(参数.查询参数 ?? {})) 地址.searchParams.set(键, 值)
  地址.searchParams.set(参数.id参数键, 参数.id)
  return 地址.toString()
}
