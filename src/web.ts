import { Log } from '@lsby/ts-log'
import * as uuid from 'uuid'
import { z } from 'zod'
import { parseURL } from './tools.js'

let log = new Log('@lsby:ts-post-extend')

export async function 原始的扩展WebPost(
  url: string,
  参数: object,
  头: object = {},
  ws信息回调?: (事件: MessageEvent) => Promise<void>,
  ws关闭回调?: (事件: CloseEvent) => Promise<void>,
  ws错误回调?: (事件: Event) => Promise<void>,
): Promise<object> {
  let url解析 = parseURL(url)
  if (url解析 === null) throw new Error(`无法解析url: ${url}`)

  let 扩展头: { [key: string]: string } = {}

  if (ws信息回调 !== void 0) {
    let wsId = uuid.v1()
    let ws连接 = new WebSocket(`${url解析.protocol}//${url解析.host}/ws?id=${wsId}`)
    扩展头 = { 'ws-client-id': wsId }

    let ws连接Promise = new Promise<void>((resolve) => {
      ws连接.onopen = async (): Promise<void> => {
        await log.info(`WebSocket 连接已打开: ${wsId}`)
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

  let 结果文本 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...扩展头, ...头 },
    body: JSON.stringify(参数),
  }).then((a) => a.text())
  await log.debug(`请求结果: %o`, 结果文本)

  return JSON.parse(结果文本)
}

export async function 不安全的扩展WebPost<
  url类型 extends string,
  post参数类型 extends object,
  post结果类型 extends object,
  ws结果类型,
>(
  url: url类型,
  参数: post参数类型,
  头: object = {},
  ws信息回调?: (数据: ws结果类型) => Promise<void>,
  ws关闭回调?: (事件: CloseEvent) => Promise<void>,
  ws错误回调?: (事件: Event) => Promise<void>,
): Promise<post结果类型> {
  let 调用结果 = 原始的扩展WebPost(
    url,
    参数,
    头,
    ws信息回调 === void 0 ? ws信息回调 : async (e): Promise<void> => await ws信息回调(JSON.parse(e.data as any)),
    ws关闭回调,
    ws错误回调,
  )
  return 调用结果 as any
}

export async function 扩展WebPost<
  url类型 extends string,
  post参数类型 extends object,
  post结果类型描述 extends z.ZodTypeAny,
  ws结果类型描述 extends z.ZodTypeAny,
>(
  post结果描述: post结果类型描述,
  ws结果描述: ws结果类型描述,
  url: url类型,
  参数: post参数类型,
  头: object = {},
  ws信息回调?: (数据: z.infer<ws结果类型描述>) => Promise<void>,
  ws关闭回调?: (事件: CloseEvent) => Promise<void>,
  ws错误回调?: (事件: Event) => Promise<void>,
): Promise<z.infer<post结果类型描述>> {
  let 调用结果 = await 原始的扩展WebPost(
    url,
    参数,
    头,
    ws信息回调 === void 0
      ? ws信息回调
      : async (e): Promise<void> => {
          let 校验 = ws结果描述.safeParse(JSON.parse(e.data.toString()))
          if (校验.success === false) throw 校验.error
          await ws信息回调(校验.data)
        },
    ws关闭回调,
    ws错误回调,
  )
  let 校验 = post结果描述.safeParse(调用结果)
  if (校验.success === false) throw 校验.error
  return 校验.data
}
