import { Log } from '@lsby/ts-log'
import * as uuid from 'uuid'
import { z } from 'zod'
import { parseURL } from './tools.js'

let log = new Log('@lsby:ts-http-extend')

async function 内部WebRequest处理(选项: {
  url: string
  body: string | FormData
  headers: { [key: string]: string }
  method: 'POST' | 'GET'
  wsClientIdHeader?: string
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
    wsClientIdHeader = 'ws-client-id',
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
    let ws连接 = new WebSocket(`${url解析.protocol}//${url解析.host}/ws?id=${wsId}`)
    扩展头 = { [wsClientIdHeader]: wsId }

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

export async function 原始的扩展WebRequest(选项: {
  url: string
  参数: object
  头?: { [key: string]: string }
  method: 'POST' | 'GET'
  ws信息回调?: (事件: MessageEvent) => Promise<void>
  ws关闭回调?: (事件: CloseEvent) => Promise<void>
  ws错误回调?: (事件: Event) => Promise<void>
  ws连接回调?: (ws: WebSocket) => Promise<void>
}): Promise<object> {
  let { url, 参数, 头 = {}, method, ws信息回调, ws关闭回调, ws错误回调, ws连接回调 } = 选项
  return await 内部WebRequest处理({
    url,
    body: JSON.stringify(参数),
    headers: { 'Content-Type': 'application/json', ...头 },
    method,
    ...(ws信息回调 !== void 0 && { ws信息回调 }),
    ...(ws关闭回调 !== void 0 && { ws关闭回调 }),
    ...(ws错误回调 !== void 0 && { ws错误回调 }),
    ...(ws连接回调 !== void 0 && { ws连接回调 }),
  })
}

export async function 原始的扩展WebRequest表单(选项: {
  url: string
  表单数据: FormData
  头?: { [key: string]: string }
  method: 'POST' | 'GET'
  ws信息回调?: (事件: MessageEvent) => Promise<void>
  ws关闭回调?: (事件: CloseEvent) => Promise<void>
  ws错误回调?: (事件: Event) => Promise<void>
  ws连接回调?: (ws: WebSocket) => Promise<void>
}): Promise<object> {
  let { url, 表单数据, 头, method, ws信息回调, ws关闭回调, ws错误回调, ws连接回调 } = 选项
  return await 内部WebRequest处理({
    url,
    body: 表单数据,
    headers: 头 ?? {},
    method,
    ...(ws信息回调 !== void 0 && { ws信息回调 }),
    ...(ws关闭回调 !== void 0 && { ws关闭回调 }),
    ...(ws错误回调 !== void 0 && { ws错误回调 }),
    ...(ws连接回调 !== void 0 && { ws连接回调 }),
  })
}

export async function 不安全的扩展WebRequest<
  url类型 extends string,
  post参数类型 extends object,
  post结果类型 extends object,
  ws结果类型,
>(选项: {
  url: url类型
  参数: post参数类型
  头?: { [key: string]: string }
  method: 'POST' | 'GET'
  ws信息回调?: (数据: ws结果类型) => Promise<void>
  ws关闭回调?: (事件: CloseEvent) => Promise<void>
  ws错误回调?: (事件: Event) => Promise<void>
  ws连接回调?: (ws: WebSocket) => Promise<void>
}): Promise<post结果类型> {
  let { url, 参数, 头, method, ws信息回调, ws关闭回调, ws错误回调, ws连接回调 } = 选项
  let 调用结果 = 原始的扩展WebRequest({
    url,
    参数,
    ...(头 !== void 0 && { 头 }),
    method,
    ...(ws信息回调 !== void 0 && {
      ws信息回调: async (e): Promise<void> => await ws信息回调(JSON.parse(e.data as any)),
    }),
    ...(ws关闭回调 !== void 0 && { ws关闭回调 }),
    ...(ws错误回调 !== void 0 && { ws错误回调 }),
    ...(ws连接回调 !== void 0 && { ws连接回调 }),
  })
  return 调用结果 as any
}

export async function 不安全的扩展WebRequest表单<
  url类型 extends string,
  post结果类型 extends object,
  ws结果类型,
>(选项: {
  url: url类型
  表单数据: FormData
  头?: { [key: string]: string }
  method: 'POST' | 'GET'
  ws信息回调?: (数据: ws结果类型) => Promise<void>
  ws关闭回调?: (事件: CloseEvent) => Promise<void>
  ws错误回调?: (事件: Event) => Promise<void>
  ws连接回调?: (ws: WebSocket) => Promise<void>
}): Promise<post结果类型> {
  let { url, 表单数据, 头 = {}, method, ws信息回调, ws关闭回调, ws错误回调, ws连接回调 } = 选项
  let 调用结果 = 原始的扩展WebRequest表单({
    url,
    表单数据,
    头,
    method,
    ...(ws信息回调 !== void 0 && {
      ws信息回调: async (e): Promise<void> => await ws信息回调(JSON.parse(e.data as any)),
    }),
    ...(ws关闭回调 !== void 0 && { ws关闭回调 }),
    ...(ws错误回调 !== void 0 && { ws错误回调 }),
    ...(ws连接回调 !== void 0 && { ws连接回调 }),
  })
  return 调用结果 as any
}

export async function 扩展WebRequest<
  url类型 extends string,
  post参数类型 extends object,
  post结果类型描述 extends z.ZodTypeAny,
  ws结果类型描述 extends z.ZodTypeAny,
>(选项: {
  post结果描述: post结果类型描述
  ws结果描述: ws结果类型描述
  url: url类型
  参数: post参数类型
  头?: { [key: string]: string }
  method: 'POST' | 'GET'
  ws信息回调?: (数据: z.infer<ws结果类型描述>) => Promise<void>
  ws关闭回调?: (事件: CloseEvent) => Promise<void>
  ws错误回调?: (事件: Event) => Promise<void>
  ws连接回调?: (ws: WebSocket) => Promise<void>
}): Promise<z.infer<post结果类型描述>> {
  let { post结果描述, ws结果描述, url, 参数, 头, method, ws信息回调, ws关闭回调, ws错误回调, ws连接回调 } = 选项
  let 调用结果 = await 原始的扩展WebRequest({
    url,
    参数,
    ...(头 !== void 0 && { 头 }),
    method,
    ...(ws信息回调 !== void 0 && {
      ws信息回调: async (e): Promise<void> => {
        let 校验 = ws结果描述.safeParse(JSON.parse(e.data.toString()))
        if (校验.success === false) throw e.data.toString()
        await ws信息回调(校验.data)
      },
    }),
    ...(ws关闭回调 !== void 0 && { ws关闭回调 }),
    ...(ws错误回调 !== void 0 && { ws错误回调 }),
    ...(ws连接回调 !== void 0 && { ws连接回调 }),
  })
  let 校验 = post结果描述.safeParse(调用结果)
  if (校验.success === false) throw 调用结果
  return 校验.data
}

export async function 扩展WebRequest表单<
  url类型 extends string,
  post结果类型描述 extends z.ZodTypeAny,
  ws结果类型描述 extends z.ZodTypeAny,
>(选项: {
  post结果描述: post结果类型描述
  ws结果描述: ws结果类型描述
  url: url类型
  表单数据: FormData
  头?: { [key: string]: string }
  method: 'POST' | 'GET'
  ws信息回调?: (数据: z.infer<ws结果类型描述>) => Promise<void>
  ws关闭回调?: (事件: CloseEvent) => Promise<void>
  ws错误回调?: (事件: Event) => Promise<void>
  ws连接回调?: (ws: WebSocket) => Promise<void>
}): Promise<z.infer<post结果类型描述>> {
  let { post结果描述, ws结果描述, url, 表单数据, 头, method, ws信息回调, ws关闭回调, ws错误回调, ws连接回调 } = 选项
  let 调用结果 = await 原始的扩展WebRequest表单({
    url,
    表单数据,
    ...(头 !== void 0 && { 头 }),
    method,
    ...(ws信息回调 !== void 0 && {
      ws信息回调: async (e): Promise<void> => {
        let 校验 = ws结果描述.safeParse(JSON.parse(e.data.toString()))
        if (校验.success === false) throw e.data.toString()
        await ws信息回调(校验.data)
      },
    }),
    ...(ws关闭回调 !== void 0 && { ws关闭回调 }),
    ...(ws错误回调 !== void 0 && { ws错误回调 }),
    ...(ws连接回调 !== void 0 && { ws连接回调 }),
  })
  let 校验 = post结果描述.safeParse(调用结果)
  if (校验.success === false) throw 调用结果
  return 校验.data
}
