import { Log } from '@lsby/ts-log'
import * as uuid from 'uuid'
import { z } from 'zod'

let log = new Log('@lsby:ts-post-extend')

export async function 原始的扩展WebPost(
  url: string,
  参数: object,
  头: object = {},
  ws信息回调?: (事件: MessageEvent) => Promise<void>,
  ws关闭回调?: (事件: CloseEvent) => Promise<void>,
  ws错误回调?: (事件: Event) => Promise<void>,
): Promise<object> {
  let url解析 = new URL(url)

  let wsId = uuid.v1()
  let 扩展头: { [key: string]: string } = {}
  if (ws信息回调 !== void 0) {
    let 设置ws连接 = async (wsId: string): Promise<void> => {
      await log.info(`正在建立 WebSocket 连接: ${wsId}`)
      let ws连接 = new WebSocket(`${url解析.protocol}//${url解析.host}/ws?id=${wsId}`)

      await new Promise((res, _rej) => {
        ws连接.onopen = async (): Promise<void> => {
          await log.info(`WebSocket 连接已打开: ${wsId}`)
          res(null)
        }
      })
      ws连接.onmessage = async (event: MessageEvent): Promise<void> => {
        await log.debug(`收到 WebSocket 消息: ${event.data}`)
        await ws信息回调(event)
      }
      ws连接.onclose = async (event): Promise<void> => {
        await ws关闭回调?.(event)
        if (event.code === 1000) {
          await log.info(`WebSocket 连接正常关闭: ${wsId}`)
          return
        }
        let 退避时间 = 100
        await log.warn(
          `WebSocket 连接异常关闭 (code: ${event.code}), 将在 ${退避时间} 毫秒后尝试重连: ${wsId}: %o`,
          event.reason,
        )
        await new Promise<void>((res, _rej) => setTimeout(() => res(), 退避时间))
        await 设置ws连接(wsId)
      }
      ws连接.onerror = async (error): Promise<void> => {
        await log.error(`WebSocket 发生错误: ${wsId}`, error)
        await ws错误回调?.(error)
      }
    }
    await 设置ws连接(wsId)
    扩展头 = { 'ws-client-id': wsId }
  }

  return await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...扩展头, ...头 },
    body: JSON.stringify(参数),
  }).then((a) => a.json())
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
    async (e) => await ws信息回调?.(e.data as any),
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
  let 调用结果 = 原始的扩展WebPost(
    url,
    参数,
    头,
    async (e) => {
      let 校验 = ws结果描述.safeParse(e.data)
      if (校验.success === false) throw 校验.error
      await ws信息回调?.(校验.data)
    },
    ws关闭回调,
    ws错误回调,
  )
  let 校验 = post结果描述.safeParse(调用结果)
  if (校验.success === false) throw 校验.error
  return 校验.data
}
