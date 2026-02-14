/**
 * Push-to-Talk manager for COVAS voice input.
 * Manages PTT state toggling via WebSocket commands.
 */

import { EventEmitter } from 'events';

export interface PTTState {
  active: boolean;
  startTime: number | null;
  maxDurationMs: number;
}

class PTTManager extends EventEmitter {
  private state: PTTState = {
    active: false,
    startTime: null,
    maxDurationMs: 15000,
  };
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  getState(): PTTState {
    return { ...this.state };
  }

  start(): void {
    if (this.state.active) return;

    this.state.active = true;
    this.state.startTime = Date.now();
    this.emit('ptt:start');

    // Auto-stop after max duration
    this.timeoutHandle = setTimeout(() => {
      this.stop();
    }, this.state.maxDurationMs);
  }

  stop(): void {
    if (!this.state.active) return;

    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }

    const duration = this.state.startTime ? Date.now() - this.state.startTime : 0;
    this.state.active = false;
    this.state.startTime = null;
    this.emit('ptt:stop', { durationMs: duration });
  }

  toggle(): void {
    if (this.state.active) {
      this.stop();
    } else {
      this.start();
    }
  }

  setMaxDuration(ms: number): void {
    this.state.maxDurationMs = ms;
  }
}

export const pttManager = new PTTManager();
