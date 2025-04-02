export function parseURL(url: string): { protocol: string; host: string; pathname: string } | null {
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
