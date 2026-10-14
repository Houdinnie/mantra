declare module "ws" {
  import { EventEmitter } from "events";
  import type { IncomingMessage, Server } from "http";

  export class WebSocket extends EventEmitter {
    static readonly OPEN: number;
    readonly readyState: number;
    send(data: string): void;
    close(): void;
    on(event: "message", listener: (data: { toString(): string }) => void): this;
    on(event: "close" | "error", listener: () => void): this;
  }

  export class WebSocketServer extends EventEmitter {
    constructor(options: { server: Server; path?: string });
    on(event: "connection", listener: (socket: WebSocket, request: IncomingMessage) => void): this;
  }
}
