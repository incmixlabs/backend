import type { Bindings } from "@/types"

import { DurableObject } from "cloudflare:workers"
import type { WsMessage } from "@incmix/utils/types"

export class Clients extends DurableObject<Bindings> {
  connectedClients: Map<WebSocket, { userId: string }>

  constructor(ctx: DurableObjectState, env: Bindings) {
    super(ctx, env)

    this.connectedClients = new Map<WebSocket, { userId: string }>()

    this.ctx.getWebSockets().forEach((webSocket) => {
      const meta = webSocket.deserializeAttachment()

      this.connectedClients.set(webSocket, { ...meta })
    })
  }

  override fetch(req: Request) {
    const { 0: client, 1: server } = new WebSocketPair()
    const url = new URL(req.url)

    const userId = url.searchParams.get("userId")

    if (!userId?.length)
      return Response.json(
        { message: "Session cookie required" },
        { status: 400 }
      )

    this.handleSession(server, userId)

    return new Response(null, { status: 101, webSocket: client })
  }

  handleSession(ws: WebSocket, userId: string) {
    this.ctx.acceptWebSocket(ws)
    const session = { userId }
    ws.serializeAttachment({
      ...ws.deserializeAttachment(),
      userId,
    })
    this.connectedClients.set(ws, session)
    this.broadcast(
      JSON.stringify({
        action: "CONNECT",
        data: {
          message: `User Connected: ${userId}`,
          connectedUsers: Array.from(this.connectedClients.values()),
        },
      } satisfies WsMessage)
    )
  }

  override webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer
  ): void {
    if (message instanceof ArrayBuffer) {
      ws.send("Invalid Data")
      return
    }

    const data: WsMessage = JSON.parse(message)

    if (data.action === "GET_ONLINE_USERS") {
      ws.send(
        JSON.stringify({
          action: "GET_ONLINE_USERS",
          data: { connectedUsers: Array.from(this.connectedClients.values()) },
        } satisfies WsMessage)
      )
      return
    }

    if (data.action === "DISCONNECT") {
      this.disconnectUser(ws)
      return
    }

    ws.send("Invalid Data")
  }

  broadcast(message: string) {
    this.connectedClients.forEach((_session, ws) => {
      ws.send(message)
    })
  }

  disconnectUser(ws: WebSocket) {
    const session = this.connectedClients.get(ws)
    this.connectedClients.delete(ws)
    this.broadcast(
      JSON.stringify({
        action: "DISCONNECT",
        data: {
          message: `User Disconnected: ${session?.userId}`,
          connectedUsers: Array.from(this.connectedClients.values()),
        },
      } satisfies WsMessage)
    )
  }

  override webSocketClose(ws: WebSocket): void | Promise<void> {
    this.disconnectUser(ws)
  }

  override webSocketError(ws: WebSocket): void | Promise<void> {
    this.disconnectUser(ws)
  }
}
