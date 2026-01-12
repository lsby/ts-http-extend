import { Log } from '@lsby/ts-log'
import * as uuid from 'uuid'
import { parseURL } from './tools.js'
import { 请求方法类型 } from './type.js'

let log = new Log('@lsby:ts-http-extend')

export async function web请求(选项: {
  url: string
  body: string | FormData
  headers: { [key: string]: string }
  method: 请求方法类型
  ws路径?: string
  wsId参数键?: string
  wsId头键?: string
  ws信息回调?: (事件: MessageEvent) => Promise<void>
  ws关闭回调?: (事件: CloseEvent) => Promise<void>
  ws错误回调?: (事件: Event) => Promise<void>
  ws连接回调?: (ws: WebSocket) => Promise<void>
}): Promise<object> {
  let {
    url,
    body,
    headers,
    method,
    ws路径 = '/ws',
    wsId参数键 = 'id',
    wsId头键 = 'ws-client-id',
    ws信息回调,
    ws关闭回调,
    ws错误回调,
    ws连接回调,
  } = 选项
  let url解析 = parseURL(url)
  if (url解析 === null) throw new Error(`无法解析url: ${url}`)

  let 扩展头: { [key: string]: string } = {}

  if (ws信息回调 !== void 0) {
    let wsId = uuid.v1()
    let ws连接 = new WebSocket(`${url解析.protocol}//${url解析.host}${ws路径}?${wsId参数键}=${wsId}`)
    扩展头 = { [wsId头键]: wsId }

    let ws连接Promise = new Promise<void>((resolve) => {
      ws连接.onopen = async (): Promise<void> => {
        await log.info(`WebSocket 连接已打开: ${wsId}`)
        await ws连接回调?.(ws连接)
        resolve()
      }

      ws连接.onerror = async (error: Event): Promise<void> => {
        await log.warn(`WebSocket 连接失败: ${wsId}`, error)
        await ws错误回调?.(error)
        resolve()
      }
    })

    ws连接.onmessage = async (event: MessageEvent): Promise<void> => {
      await log.debug(`收到 WebSocket 消息: ${event.data}`)
      await ws信息回调(event)
    }

    ws连接.onclose = async (event): Promise<void> => {
      await log.info(`WebSocket 连接关闭: ${wsId}, code: ${event.code}, reason: ${event.reason}`)
      await ws关闭回调?.(event)
    }

    await ws连接Promise
  }

  let fetch选项: RequestInit = {
    method,
    headers: { ...扩展头, ...headers },
  }
  if (method !== 'GET') {
    fetch选项.body = body
  }

  let 结果文本 = await fetch(url, fetch选项).then((a) => a.text())
  await log.debug(`请求结果: %o`, 结果文本)

  try {
    return JSON.parse(结果文本)
  } catch (_e) {
    throw 结果文本
  }
}

export async function web请求json(选项: {
  url: string
  参数: object
  头?: { [key: string]: string }
  method?: 请求方法类型
  ws路径?: string
  wsId参数键?: string
  wsId头键?: string
  ws信息回调?: (事件: MessageEvent) => Promise<void>
  ws关闭回调?: (事件: CloseEvent) => Promise<void>
  ws错误回调?: (事件: Event) => Promise<void>
  ws连接回调?: (ws: WebSocket) => Promise<void>
}): Promise<object> {
  let {
    url,
    参数,
    头 = {},
    method = 'POST',
    ws路径,
    wsId参数键,
    wsId头键,
    ws信息回调,
    ws关闭回调,
    ws错误回调,
    ws连接回调,
  } = 选项
  return await web请求({
    url,
    body: JSON.stringify(参数),
    headers: { 'Content-Type': 'application/json', ...头 },
    method,
    ...(ws路径 !== void 0 && { ws路径 }),
    ...(wsId参数键 !== void 0 && { wsId参数键 }),
    ...(wsId头键 !== void 0 && { wsId头键 }),
    ...(ws信息回调 !== void 0 && { ws信息回调 }),
    ...(ws关闭回调 !== void 0 && { ws关闭回调 }),
    ...(ws错误回调 !== void 0 && { ws错误回调 }),
    ...(ws连接回调 !== void 0 && { ws连接回调 }),
  })
}
export async function web请求form(选项: {
  url: string
  表单数据: FormData
  头?: { [key: string]: string }
  method?: 请求方法类型
  ws路径?: string
  wsId参数键?: string
  wsId头键?: string
  ws信息回调?: (事件: MessageEvent) => Promise<void>
  ws关闭回调?: (事件: CloseEvent) => Promise<void>
  ws错误回调?: (事件: Event) => Promise<void>
  ws连接回调?: (ws: WebSocket) => Promise<void>
}): Promise<object> {
  let {
    url,
    表单数据,
    头,
    method = 'POST',
    ws路径,
    wsId参数键,
    wsId头键,
    ws信息回调,
    ws关闭回调,
    ws错误回调,
    ws连接回调,
  } = 选项
  return await web请求({
    url,
    body: 表单数据,
    headers: 头 ?? {},
    method,
    ...(ws路径 !== void 0 && { ws路径 }),
    ...(wsId参数键 !== void 0 && { wsId参数键 }),
    ...(wsId头键 !== void 0 && { wsId头键 }),
    ...(ws信息回调 !== void 0 && { ws信息回调 }),
    ...(ws关闭回调 !== void 0 && { ws关闭回调 }),
    ...(ws错误回调 !== void 0 && { ws错误回调 }),
    ...(ws连接回调 !== void 0 && { ws连接回调 }),
  })
}

export async function web请求query(选项: {
  url: string
  参数: object
  头?: { [key: string]: string }
  method?: 请求方法类型
  ws路径?: string
  wsId参数键?: string
  wsId头键?: string
  ws信息回调?: (事件: MessageEvent) => Promise<void>
  ws关闭回调?: (事件: CloseEvent) => Promise<void>
  ws错误回调?: (事件: Event) => Promise<void>
  ws连接回调?: (ws: WebSocket) => Promise<void>
}): Promise<object> {
  let {
    url,
    参数,
    头 = {},
    method = 'GET',
    ws路径,
    wsId参数键,
    wsId头键,
    ws信息回调,
    ws关闭回调,
    ws错误回调,
    ws连接回调,
  } = 选项
  let 查询字符串 = new URLSearchParams(参数 as Record<string, string>).toString()
  let 分隔符 = url.includes('?') ? '&' : '?'
  let 新url = `${url}${分隔符}${查询字符串}`
  return await web请求({
    url: 新url,
    body: '',
    headers: 头,
    method,
    ...(ws路径 !== void 0 && { ws路径 }),
    ...(wsId参数键 !== void 0 && { wsId参数键 }),
    ...(wsId头键 !== void 0 && { wsId头键 }),
    ...(ws信息回调 !== void 0 && { ws信息回调 }),
    ...(ws关闭回调 !== void 0 && { ws关闭回调 }),
    ...(ws错误回调 !== void 0 && { ws错误回调 }),
    ...(ws连接回调 !== void 0 && { ws连接回调 }),
  })
}

export async function web请求urlencoded(选项: {
  url: string
  参数: object
  头?: { [key: string]: string }
  method?: 请求方法类型
  ws路径?: string
  wsId参数键?: string
  wsId头键?: string
  ws信息回调?: (事件: MessageEvent) => Promise<void>
  ws关闭回调?: (事件: CloseEvent) => Promise<void>
  ws错误回调?: (事件: Event) => Promise<void>
  ws连接回调?: (ws: WebSocket) => Promise<void>
}): Promise<object> {
  let {
    url,
    参数,
    头 = {},
    method = 'POST',
    ws路径,
    wsId参数键,
    wsId头键,
    ws信息回调,
    ws关闭回调,
    ws错误回调,
    ws连接回调,
  } = 选项
  return await web请求({
    url,
    body: new URLSearchParams(参数 as Record<string, string>).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...头 },
    method,
    ...(ws路径 !== void 0 && { ws路径 }),
    ...(wsId参数键 !== void 0 && { wsId参数键 }),
    ...(wsId头键 !== void 0 && { wsId头键 }),
    ...(ws信息回调 !== void 0 && { ws信息回调 }),
    ...(ws关闭回调 !== void 0 && { ws关闭回调 }),
    ...(ws错误回调 !== void 0 && { ws错误回调 }),
    ...(ws连接回调 !== void 0 && { ws连接回调 }),
  })
}
