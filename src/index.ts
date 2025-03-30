import { Log } from '@lsby/ts-log'
import { randomUUID } from 'crypto'
import { URL } from 'url'
import WebSocket from 'ws'

let log = new Log('@lsby:ts-post-extend')

export async function 不安全的扩展NodePost(
  url: string,
  参数: object,
  头: object = {},
  ws信息回调?: (信息: WebSocket.MessageEvent) => Promise<void>,
  ws关闭回调?: (事件: WebSocket.CloseEvent) => Promise<void>,
  ws错误回调?: (事件: WebSocket.ErrorEvent) => Promise<void>,
): Promise<object> {
  let url解析 = URL.parse(url)
  if (url解析 === null) throw new Error(`无法解析url: ${url}`)

  let wsId = randomUUID()
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
      ws连接.onmessage = async (event: WebSocket.MessageEvent): Promise<void> => {
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
