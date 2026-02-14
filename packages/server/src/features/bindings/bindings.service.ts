/**
 * @vayu/server -- Bindings Service
 *
 * Service layer that manages the bindings parser lifecycle. Provides a
 * lazy-loading, cacheable interface so callers do not need to worry about
 * whether the `.binds` file has been parsed yet.
 *
 * Responsibilities:
 *   1. Lazy-load and cache parsed bindings from the config path.
 *   2. Expose filtered views: by device, by category, by search query.
 *   3. Expose conflict and unbound-action reports.
 *   4. Allow on-demand reload when the user changes their bindings file.
 *
 * Supports both reading and writing bindings via the bindings-writer module.
 */

import { bindingsParser } from '../../core/bindings-parser.js';
import {
  updateKeyBinding,
  updateAxisBinding,
  type KeyBindingUpdate,
  type AxisBindingUpdate,
} from '../../core/bindings-writer.js';
import { config } from '../../config.js';
import type { BindingSet, BindingEntry, BindingCategory } from '@vayu/shared';

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

const LOG_PREFIX = '[Bindings]';

function log(message: string, ...args: unknown[]): void {
  console.log(`${LOG_PREFIX} ${message}`, ...args);
}

function warn(message: string, ...args: unknown[]): void {
  console.warn(`${LOG_PREFIX} ${message}`, ...args);
}

// ---------------------------------------------------------------------------
// BindingsService
// ---------------------------------------------------------------------------

class BindingsService {
  /** Whether the bindings file has been loaded at least once. */
  private loaded = false;

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * Ensure bindings have been parsed at least once.
   * If already loaded this is a no-op.
   *
   * @throws If the bindings file cannot be read or parsed.
   */
  async ensureLoaded(): Promise<void> {
    if (this.loaded && bindingsParser.getBindings() !== null) return;

    const filePath = config.paths.bindingsFile;
    if (!filePath) {
      throw new Error('No bindings file path configured (BINDINGS_FILE)');
    }

    log('Loading bindings from %s', filePath);
    await bindingsParser.parse(filePath);
    this.loaded = true;

    const bs = bindingsParser.getBindings();
    if (bs) {
      const total = Object.keys(bs.bindings).length;
      const bound = Object.values(bs.bindings).filter(
        (e) => e.primary !== null || e.secondary !== null || e.axis !== null,
      ).length;
      log('Parsed %d actions (%d bound, %d unbound)', total, bound, total - bound);
    }
  }

  /**
   * Force-reload bindings from disk.
   * Useful after the user edits their `.binds` file.
   */
  async reload(): Promise<void> {
    this.loaded = false;
    await this.ensureLoaded();
    log('Bindings reloaded');
  }

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  /**
   * Get the full parsed binding set.
   * Returns `null` if bindings have not been loaded yet.
   */
  getAll(): BindingSet | null {
    return bindingsParser.getBindings();
  }

  /**
   * Get all binding entries that reference a specific device.
   *
   * @param deviceName  Raw device identifier or human-readable label.
   *                    Matching is case-insensitive.
   */
  getByDevice(deviceName: string): BindingEntry[] {
    return bindingsParser.getDeviceBindings(deviceName);
  }

  /**
   * Get all binding entries for a specific category.
   *
   * @param category  The {@link BindingCategory} string.
   */
  getByCategory(category: string): BindingEntry[] {
    return bindingsParser.getCategoryBindings(category as BindingCategory);
  }

  /**
   * Search bindings by action name substring (case-insensitive).
   *
   * @param query  The search string.
   * @returns      Array of matching binding entries.
   */
  search(query: string): BindingEntry[] {
    const bs = bindingsParser.getBindings();
    if (!bs || !query) return [];

    const lower = query.toLowerCase();
    return Object.values(bs.bindings).filter((entry) =>
      entry.action.toLowerCase().includes(lower),
    );
  }

  /**
   * Get all binding conflicts (same device+key mapped to multiple actions).
   */
  getConflicts(): Array<{ key: string; device: string; actions: string[] }> {
    return bindingsParser.getConflicts();
  }

  /**
   * Get all unbound action names.
   */
  getUnbound(): string[] {
    return bindingsParser.getUnboundActions();
  }

  /**
   * Get a JSON-friendly summary of the bindings.
   */
  toJSON(): object {
    return bindingsParser.toJSON();
  }

  // -----------------------------------------------------------------------
  // Mutations
  // -----------------------------------------------------------------------

  /**
   * Update a single binding for an action and reload the cache.
   *
   * @param action  Action name (e.g. "YawLeftButton").
   * @param slot    Which slot: 'primary', 'secondary', or 'axis'.
   * @param params  Binding parameters (or clear=true to unbind).
   * @returns       The updated BindingEntry.
   */
  async updateBinding(
    action: string,
    slot: 'primary' | 'secondary' | 'axis',
    params: {
      clear?: boolean;
      device?: string;
      key?: string;
      modifiers?: Array<{ device: string; key: string }>;
      axis?: string;
      inverted?: boolean;
      deadzone?: number;
    },
  ): Promise<BindingEntry> {
    const filePath = config.paths.bindingsFile;
    if (!filePath) {
      throw new Error('No bindings file path configured (BINDINGS_FILE)');
    }

    // Ensure we have current bindings so we can validate the action exists
    await this.ensureLoaded();
    const bs = this.getAll();
    if (!bs || !bs.bindings[action]) {
      throw new Error(`Unknown action: ${action}`);
    }

    if (slot === 'axis') {
      const binding: AxisBindingUpdate | null = params.clear
        ? null
        : {
            device: params.device!,
            axis: params.axis ?? params.key ?? '',
            inverted: params.inverted,
            deadzone: params.deadzone,
          };
      await updateAxisBinding(filePath, action, binding);
    } else {
      const binding: KeyBindingUpdate | null = params.clear
        ? null
        : {
            device: params.device!,
            key: params.key!,
            modifiers: params.modifiers,
          };
      await updateKeyBinding(filePath, action, slot, binding);
    }

    // Reload parsed bindings from the modified file
    await this.reload();

    const updated = this.getAll();
    if (!updated || !updated.bindings[action]) {
      throw new Error(`Failed to reload binding for ${action}`);
    }

    log('Binding updated: %s [%s]', action, slot);
    return updated.bindings[action];
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/** Singleton bindings service instance. */
export const bindingsService = new BindingsService();
