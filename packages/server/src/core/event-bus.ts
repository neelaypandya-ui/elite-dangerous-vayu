/**
 * @vayu/server — Core Event Bus
 *
 * A typed EventEmitter-based event bus that all server components use to
 * communicate. Journal events, status updates, and game state changes all
 * flow through this singleton.
 *
 * Event naming convention:
 *   - `journal:*`            — wildcard, every journal event
 *   - `journal:<EventName>`  — specific journal event (e.g. `journal:FSDJump`)
 *   - `status:update`        — Status.json changed
 *   - `cargo:update`         — Cargo.json changed
 *   - `navroute:update`      — NavRoute.json changed
 *   - `market:update`        — Market.json changed
 *   - `backpack:update`      — Backpack.json changed
 *   - `modules:update`       — ModulesInfo.json changed
 *   - `shipyard:update`      — Shipyard.json changed
 *   - `outfitting:update`    — Outfitting.json changed
 *   - `companion:update`     — any companion file changed (wildcard)
 *   - `gamestate:change`     — game state projection changed
 *   - `watcher:started`      — a watcher has started
 *   - `watcher:stopped`      — a watcher has stopped
 *   - `watcher:error`        — a watcher encountered an error
 */

import { EventEmitter } from 'events';
import type { AnyJournalEvent, JournalEventMap, JournalEventName } from '@vayu/shared';

// ---------------------------------------------------------------------------
// Event Bus
// ---------------------------------------------------------------------------

/**
 * Central event bus for all VAYU server-side communication.
 *
 * Extends Node's EventEmitter with typed helper methods for journal events,
 * companion file updates, and game state changes.
 */
class VayuEventBus extends EventEmitter {
  private journalEventCount = 0;

  constructor() {
    super();
    // Allow a generous number of listeners — many subsystems will subscribe.
    this.setMaxListeners(100);
  }

  // -------------------------------------------------------------------------
  // Journal events
  // -------------------------------------------------------------------------

  /**
   * Emit a parsed journal event.
   *
   * This fires two events:
   *   1. `journal:*` — wildcard that receives every event
   *   2. `journal:<eventName>` — specific channel for the event type
   */
  emitJournalEvent(event: AnyJournalEvent): void {
    this.journalEventCount++;
    this.emit('journal:*', event);
    this.emit(`journal:${event.event}`, event);
  }

  /**
   * Subscribe to a specific journal event type with full type safety.
   *
   * @example
   * ```ts
   * eventBus.onJournalEvent('FSDJump', (event) => {
   *   console.log(event.StarSystem); // fully typed
   * });
   * ```
   */
  onJournalEvent<K extends JournalEventName>(
    eventName: K,
    handler: (event: JournalEventMap[K]) => void,
  ): this {
    return this.on(`journal:${eventName}`, handler);
  }

  /**
   * Subscribe to ALL journal events (wildcard).
   *
   * The handler receives every journal event regardless of type.
   */
  onAnyJournalEvent(handler: (event: AnyJournalEvent) => void): this {
    return this.on('journal:*', handler);
  }

  /**
   * Subscribe once to a specific journal event type.
   */
  onceJournalEvent<K extends JournalEventName>(
    eventName: K,
    handler: (event: JournalEventMap[K]) => void,
  ): this {
    return this.once(`journal:${eventName}`, handler);
  }

  /**
   * Remove a journal event listener.
   */
  offJournalEvent<K extends JournalEventName>(
    eventName: K,
    handler: (event: JournalEventMap[K]) => void,
  ): this {
    return this.off(`journal:${eventName}`, handler);
  }

  // -------------------------------------------------------------------------
  // Companion file updates
  // -------------------------------------------------------------------------

  /**
   * Emit a Status.json update (ship flags, pips, fuel, etc.).
   *
   * @param status - Parsed Status.json contents.
   */
  emitStatusUpdate(status: Record<string, unknown>): void {
    this.emit('status:update', status);
    this.emit('companion:update', { file: 'Status.json', data: status });
  }

  /**
   * Subscribe to Status.json updates.
   */
  onStatusUpdate(handler: (status: Record<string, unknown>) => void): this {
    return this.on('status:update', handler);
  }

  /**
   * Emit a Cargo.json update.
   *
   * @param cargo - Parsed Cargo.json contents.
   */
  emitCargoUpdate(cargo: Record<string, unknown>): void {
    this.emit('cargo:update', cargo);
    this.emit('companion:update', { file: 'Cargo.json', data: cargo });
  }

  /**
   * Subscribe to Cargo.json updates.
   */
  onCargoUpdate(handler: (cargo: Record<string, unknown>) => void): this {
    return this.on('cargo:update', handler);
  }

  /**
   * Emit a NavRoute.json update.
   *
   * @param route - Parsed NavRoute.json contents.
   */
  emitNavRouteUpdate(route: Record<string, unknown>): void {
    this.emit('navroute:update', route);
    this.emit('companion:update', { file: 'NavRoute.json', data: route });
  }

  /**
   * Subscribe to NavRoute.json updates.
   */
  onNavRouteUpdate(handler: (route: Record<string, unknown>) => void): this {
    return this.on('navroute:update', handler);
  }

  /**
   * Emit a Market.json update.
   */
  emitMarketUpdate(market: Record<string, unknown>): void {
    this.emit('market:update', market);
    this.emit('companion:update', { file: 'Market.json', data: market });
  }

  /**
   * Emit a Backpack.json update.
   */
  emitBackpackUpdate(backpack: Record<string, unknown>): void {
    this.emit('backpack:update', backpack);
    this.emit('companion:update', { file: 'Backpack.json', data: backpack });
  }

  /**
   * Emit a ModulesInfo.json update.
   */
  emitModulesUpdate(modules: Record<string, unknown>): void {
    this.emit('modules:update', modules);
    this.emit('companion:update', { file: 'ModulesInfo.json', data: modules });
  }

  /**
   * Emit a Shipyard.json update.
   */
  emitShipyardUpdate(shipyard: Record<string, unknown>): void {
    this.emit('shipyard:update', shipyard);
    this.emit('companion:update', { file: 'Shipyard.json', data: shipyard });
  }

  /**
   * Emit an Outfitting.json update.
   */
  emitOutfittingUpdate(outfitting: Record<string, unknown>): void {
    this.emit('outfitting:update', outfitting);
    this.emit('companion:update', { file: 'Outfitting.json', data: outfitting });
  }

  /**
   * Subscribe to any companion file update (wildcard).
   */
  onCompanionUpdate(
    handler: (update: { file: string; data: Record<string, unknown> }) => void,
  ): this {
    return this.on('companion:update', handler);
  }

  // -------------------------------------------------------------------------
  // Game state
  // -------------------------------------------------------------------------

  /**
   * Emit a game state change. Called when the state projection is rebuilt
   * or patched after processing journal events.
   *
   * @param state - The updated game state (or a partial patch).
   */
  emitGameStateChange(state: Record<string, unknown>): void {
    this.emit('gamestate:change', state);
  }

  /**
   * Subscribe to game state changes.
   */
  onGameStateChange(handler: (state: Record<string, unknown>) => void): this {
    return this.on('gamestate:change', handler);
  }

  // -------------------------------------------------------------------------
  // Watcher lifecycle
  // -------------------------------------------------------------------------

  /**
   * Emit a watcher lifecycle event.
   */
  emitWatcherEvent(
    type: 'started' | 'stopped' | 'error',
    info: { watcher: string; message?: string; error?: Error },
  ): void {
    this.emit(`watcher:${type}`, info);
  }

  /**
   * Subscribe to watcher lifecycle events.
   */
  onWatcherEvent(
    type: 'started' | 'stopped' | 'error',
    handler: (info: { watcher: string; message?: string; error?: Error }) => void,
  ): this {
    return this.on(`watcher:${type}`, handler);
  }

  // -------------------------------------------------------------------------
  // Diagnostics
  // -------------------------------------------------------------------------

  /**
   * Get the total number of journal events emitted since startup.
   */
  getJournalEventCount(): number {
    return this.journalEventCount;
  }

  /**
   * Reset the journal event counter (useful for testing).
   */
  resetJournalEventCount(): void {
    this.journalEventCount = 0;
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/** Global event bus instance for the VAYU server. */
export const eventBus = new VayuEventBus();
