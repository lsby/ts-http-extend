# ts-http-extend

一个 TypeScript HTTP 库，为 Node.js 和 Web 环境提供增强的 HTTP 请求功能。

## 什么是增强的 HTTP 请求？

传统的 HTTP 请求是单向的：客户端发送请求，服务器响应后连接关闭。而“增强的 HTTP 请求”结合了 WebSocket 的双向通信能力，实现了一种新型的请求模式：

1. **先建立 WebSocket 连接**：客户端生成一个唯一的 UUID，并使用该 UUID 作为查询参数建立 WebSocket 连接（例如：`ws://host/ws?id=<uuid>`）。
2. **发送 HTTP 请求**：在 HTTP 请求头中附带 WebSocket 的 ID（默认为 `ws-client-id`），服务器端通过该 ID 找到对应的 WebSocket 句柄。
3. **双向通信**：HTTP 请求处理过程中，可以通过 WebSocket 进行实时数据推送、监听客户端消息等操作。

这种模式允许在单个 HTTP 请求的生命周期内维持持久的双向连接，适用于需要实时交互的场景，如推送通知、实时数据更新、长轮询替代等。

## 后端配合要求

要使用增强的 HTTP 请求，后端服务器必须配合实现以下功能：

1. **WebSocket 端点支持**：服务器需要提供 WebSocket 端点（默认 `/ws?<queryParam>=<uuid>`），用于建立 WebSocket 连接。客户端生成的 UUID 将作为查询参数传递。可以通过 `wsPath` 和 `wsIdQueryParam` 参数自定义路径和查询参数名称。
2. **HTTP 请求头处理**：在处理 HTTP 请求时，服务器需要读取请求头中的 `ws-client-id`（或自定义的头名称），并使用该 ID 关联到对应的 WebSocket 连接。
3. **WebSocket 管理**：服务器端需要维护 WebSocket 连接的管理器，能够根据 ID 查找和操作 WebSocket 句柄。

例如，可以使用 [net-core](https://github.com/lsby/net-core) 框架的 WebSocket 插件来实现这些功能。该插件提供了开箱即用的 WebSocket 连接管理和 HTTP 请求关联机制。

如果后端不支持这些功能，此库将退化为普通的 HTTP 请求（不建立 WebSocket 连接）。
