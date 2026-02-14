/**
 * @vayu/shared — WebSocket Envelope Types
 *
 * Types for the WebSocket communication protocol between the VAYU
 * server and client. All messages use a typed envelope format.
 */

// ---------------------------------------------------------------------------
// Event Types
// ---------------------------------------------------------------------------

/**
 * All WebSocket event type strings.
 * Grouped logically to match the server event emitter topics.
 */
export type WSEventType =
  // Connection lifecycle
  | 'connection:open'
  | 'connection:close'
  | 'connection:error'
  | 'connection:ping'
  | 'connection:pong'

  // Journal events (forwarded from watcher)
  | 'journal:event'
  | 'journal:batch'
  | 'journal:backlog'

  // Game state
  | 'state:full'
  | 'state:patch'
  | 'state:commander'
  | 'state:ship'
  | 'state:location'
  | 'state:materials'
  | 'state:missions'
  | 'state:carrier'
  | 'state:odyssey'
  | 'state:session'

  // COVAS voice pipeline
  | 'covas:listening'
  | 'covas:transcription'
  | 'covas:command'
  | 'covas:response'
  | 'covas:audio'
  | 'covas:error'
  | 'covas:state'

  // Market data
  | 'market:update'
  | 'market:snapshot'

  // Navigation
  | 'nav:route'
  | 'nav:routeClear'
  | 'nav:fsdTarget'

  // Status flags (from Status.json polling)
  | 'status:flags'
  | 'status:pips'
  | 'status:firegroup'
  | 'status:guifocus'
  | 'status:fuel'
  | 'status:cargo'

  // Server admin
  | 'server:info'
  | 'server:config'
  | 'server:error'

  // Alerts
  | 'alert:fired'
  | 'alert:acknowledged'

  // Pips
  | 'pips:update'

  // Threats
  | 'threat:interdiction'
  | 'threat:system_alert'
  | 'threat:anarchy_warning'

  // Bindings
  | 'bindings:updated'

  // Mining
  | 'mining:update'
  | 'mining:prospector'

  // Music
  | 'music:state'
  | 'music:track'

  // Client requests
  | 'client:subscribe'
  | 'client:unsubscribe'
  | 'client:command'
  | 'client:ping';

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------

/**
 * Typed WebSocket message envelope.
 *
 * Every message sent over the wire is wrapped in this structure.
 * The generic parameter `T` is the payload type determined by `type`.
 */
export interface WSEnvelope<T = unknown> {
  /** Event type discriminant. */
  type: WSEventType;
  /** Message payload. */
  payload: T;
  /** ISO 8601 timestamp of when the message was created. */
  timestamp: string;
  /** Optional correlation ID for request/response pairing. */
  correlationId?: string;
  /** Optional sequence number for ordering. */
  sequence?: number;
}

// ---------------------------------------------------------------------------
// Common Payloads
// ---------------------------------------------------------------------------

/** Payload for connection:open. */
export interface WSConnectionOpenPayload {
  /** Server version. */
  serverVersion: string;
  /** Client ID assigned by the server. */
  clientId: string;
  /** Available subscriptions. */
  availableSubscriptions: WSEventType[];
}

/** Payload for connection:close. */
export interface WSConnectionClosePayload {
  /** Close code. */
  code: number;
  /** Close reason. */
  reason: string;
}

/** Payload for connection:error. */
export interface WSConnectionErrorPayload {
  /** Error message. */
  message: string;
  /** Error code. */
  code: string;
}

/** Payload for client:subscribe / client:unsubscribe. */
export interface WSSubscriptionPayload {
  /** Event types to subscribe/unsubscribe. */
  events: WSEventType[];
}

/** Payload for client:command. */
export interface WSClientCommandPayload {
  /** Command name. */
  command: string;
  /** Command arguments. */
  args: Record<string, unknown>;
}

/** Payload for server:info. */
export interface WSServerInfoPayload {
  /** Server version. */
  version: string;
  /** Server uptime in seconds. */
  uptimeSeconds: number;
  /** Number of connected clients. */
  connectedClients: number;
  /** Whether the journal watcher is active. */
  journalWatcherActive: boolean;
  /** Whether COVAS is enabled. */
  covasEnabled: boolean;
  /** Game running status. */
  gameRunning: boolean;
}

/** Payload for state:patch (JSON Patch operations). */
export interface WSStatePatchPayload {
  /** JSON Patch operations (RFC 6902). */
  operations: Array<{
    op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
    path: string;
    value?: unknown;
    from?: string;
  }>;
}

/** Payload for journal:batch. */
export interface WSJournalBatchPayload {
  /** Array of journal event objects. */
  events: Array<Record<string, unknown>>;
  /** Whether this is a backlog replay (historical events). */
  isBacklog: boolean;
}

/** Payload for status:flags (from Status.json). */
export interface WSStatusFlagsPayload {
  /** Bitfield flags from Status.json. */
  flags: number;
  /** Flags2 bitfield (Odyssey). */
  flags2: number;
  /** System pips [Sys, Eng, Wep]. */
  pips: [number, number, number];
  /** Active fire group index. */
  fireGroup: number;
  /** GUI focus index. */
  guiFocus: number;
  /** Fuel main tank level. */
  fuelMain: number;
  /** Fuel reservoir level. */
  fuelReservoir: number;
  /** Cargo mass in tons. */
  cargo: number;
  /** Legal state. */
  legalState: string;
  /** Latitude (if applicable). */
  latitude: number | null;
  /** Longitude (if applicable). */
  longitude: number | null;
  /** Altitude (if applicable). */
  altitude: number | null;
  /** Heading (if applicable). */
  heading: number | null;
  /** Body name. */
  bodyName: string | null;
  /** Planet radius (if applicable). */
  planetRadius: number | null;
  /** Selected target destination. */
  destination: {
    system: number;
    body: number;
    name: string;
  } | null;
}
