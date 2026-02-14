/**
 * @vayu/server — WebSocket Manager
 *
 * Singleton WebSocket server that broadcasts typed messages to all connected
 * clients using the WSEnvelope format defined in @vayu/shared.
 *
 * Usage:
 *   import { wsManager } from './websocket.js';
 *   wsManager.init(httpServer);
 *   wsManager.broadcast('state:ship', shipStatePayload);
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { WSEventType, WSEnvelope } from '@vayu/shared';

// ---------------------------------------------------------------------------
// Client tracking
// ---------------------------------------------------------------------------

/** Metadata attached to each connected client. */
interface ClientInfo {
  /** Unique ID assigned on connection. */
  id: string;
  /** Connection timestamp. */
  connectedAt: string;
  /** Event types this client has subscribed to (empty = all). */
  subscriptions: Set<WSEventType>;
}

// ---------------------------------------------------------------------------
// WebSocket Manager
// ---------------------------------------------------------------------------

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientInfo> = new Map();
  private sequence = 0;

  /**
   * Attach the WebSocket server to an existing HTTP server.
   * Must be called exactly once during startup.
   */
  init(server: Server): void {
    if (this.wss) {
      throw new Error('WebSocketManager already initialised');
    }

    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = this.generateClientId();
      const info: ClientInfo = {
        id: clientId,
        connectedAt: new Date().toISOString(),
        subscriptions: new Set(),
      };
      this.clients.set(ws, info);

      console.log(`WebSocket client connected: ${clientId} (${this.clients.size} total)`);

      // Send welcome envelope
      this.send(ws, 'connection:open', {
        serverVersion: '1.0.0',
        clientId,
        availableSubscriptions: [],
      });

      // -- Incoming message handling --
      ws.on('message', (raw: Buffer | string) => {
        try {
          const data = JSON.parse(raw.toString()) as WSEnvelope;
          this.handleClientMessage(ws, data);
        } catch {
          this.send(ws, 'connection:error', {
            message: 'Invalid message format',
            code: 'PARSE_ERROR',
          });
        }
      });

      // -- Ping / pong keep-alive --
      ws.on('pong', () => {
        // Client is alive — no action needed
      });

      // -- Disconnect --
      ws.on('close', (code: number, reason: Buffer) => {
        const closedClient = this.clients.get(ws);
        this.clients.delete(ws);
        console.log(
          `WebSocket client disconnected: ${closedClient?.id ?? 'unknown'} ` +
          `(code ${code}, ${this.clients.size} remaining)`,
        );
      });

      ws.on('error', (err: Error) => {
        console.error(`WebSocket error (${info.id}):`, err.message);
      });
    });

    // Periodic ping to detect stale connections (every 30 seconds)
    const pingInterval = setInterval(() => {
      if (!this.wss) {
        clearInterval(pingInterval);
        return;
      }
      for (const [ws] of this.clients) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }
    }, 30_000);

    // Clean up interval when server closes
    this.wss.on('close', () => {
      clearInterval(pingInterval);
    });
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Broadcast a typed message to all connected clients.
   * Clients that subscribed to a subset of events will only receive
   * messages matching their subscriptions.
   */
  broadcast<T>(type: WSEventType, payload: T): void {
    const envelope: WSEnvelope<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      sequence: this.sequence++,
    };
    const message = JSON.stringify(envelope);

    for (const [ws, info] of this.clients) {
      if (ws.readyState !== WebSocket.OPEN) continue;

      // If the client has subscriptions, only send matching events
      if (info.subscriptions.size > 0 && !info.subscriptions.has(type)) continue;

      try {
        ws.send(message);
      } catch {
        // Socket may have closed between readyState check and send — safe to ignore
      }
    }
  }

  /** Send a message to a single client. */
  send<T>(ws: WebSocket, type: WSEventType, payload: T): void {
    if (ws.readyState !== WebSocket.OPEN) return;

    const envelope: WSEnvelope<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      sequence: this.sequence++,
    };
    try {
      ws.send(JSON.stringify(envelope));
    } catch {
      // Socket may have closed between readyState check and send — safe to ignore
    }
  }

  /** Number of currently connected clients. */
  getClientCount(): number {
    return this.clients.size;
  }

  /** Gracefully close all connections and shut down the server. */
  close(): void {
    if (!this.wss) return;

    for (const [ws] of this.clients) {
      ws.close(1001, 'Server shutting down');
    }
    this.clients.clear();
    this.wss.close();
    this.wss = null;
    console.log('WebSocket server closed');
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  /** Handle an incoming message from a client. */
  private handleClientMessage(ws: WebSocket, envelope: WSEnvelope): void {
    const info = this.clients.get(ws);
    if (!info) return;

    switch (envelope.type) {
      case 'client:ping':
        this.send(ws, 'connection:pong', { timestamp: new Date().toISOString() });
        break;

      case 'client:subscribe': {
        const events = (envelope.payload as { events?: WSEventType[] })?.events;
        if (Array.isArray(events)) {
          for (const ev of events) {
            info.subscriptions.add(ev);
          }
        }
        break;
      }

      case 'client:unsubscribe': {
        const events = (envelope.payload as { events?: WSEventType[] })?.events;
        if (Array.isArray(events)) {
          for (const ev of events) {
            info.subscriptions.delete(ev);
          }
        }
        break;
      }

      case 'client:command':
        // Commands will be routed to the appropriate handler once COVAS is wired up
        console.log(`Client command from ${info.id}:`, envelope.payload);
        break;

      default:
        console.warn(`Unknown client message type: ${envelope.type}`);
    }
  }

  /** Generate a short random client ID. */
  private generateClientId(): string {
    return `vayu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const wsManager = new WebSocketManager();
