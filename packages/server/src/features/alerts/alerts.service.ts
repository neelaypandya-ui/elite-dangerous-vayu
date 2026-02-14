/**
 * Custom alert system service.
 * Monitors game state and triggers alerts based on configurable rules.
 */

import { eventBus } from '../../core/event-bus.js';
import { gameStateManager } from '../../core/game-state.js';
import { wsManager } from '../../websocket.js';

interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  condition: string; // 'low_fuel' | 'low_hull' | 'mission_expiring' | 'interdiction' | 'heat_warning' | 'under_attack' | 'shield_down' | 'custom'
  threshold?: number;
  sound?: string;
  tts?: boolean;
}

interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

const DEFAULT_RULES: AlertRule[] = [
  { id: 'low_fuel', name: 'Low Fuel', enabled: true, condition: 'low_fuel', threshold: 25, tts: true },
  { id: 'low_hull', name: 'Low Hull', enabled: true, condition: 'low_hull', threshold: 50, tts: true },
  { id: 'mission_expiring', name: 'Mission Expiring', enabled: true, condition: 'mission_expiring', threshold: 24, tts: false },
  { id: 'interdiction', name: 'Interdiction', enabled: true, condition: 'interdiction', tts: true },
  { id: 'heat_warning', name: 'Heat Warning', enabled: true, condition: 'heat_warning', tts: false },
  { id: 'under_attack', name: 'Under Attack', enabled: true, condition: 'under_attack', tts: true },
  { id: 'shield_down', name: 'Shield Down', enabled: true, condition: 'shield_down', tts: true },
];

class AlertsService {
  private rules: AlertRule[] = [...DEFAULT_RULES];
  private alertHistory: AlertEvent[] = [];
  private alertCounter = 0;

  constructor() {
    eventBus.onJournalEvent('HullDamage', (evt) => {
      const rule = this.rules.find((r) => r.id === 'low_hull' && r.enabled);
      if (!rule) return;
      const health = (evt as any).Health ?? 1;
      if (health * 100 < (rule.threshold ?? 50)) {
        this.fireAlert(rule, `Hull integrity critical: ${(health * 100).toFixed(0)}%`, 'critical');
      }
    });

    eventBus.onJournalEvent('InterdictedEvent' as any, () => {
      const rule = this.rules.find((r) => r.id === 'interdiction' && r.enabled);
      if (rule) this.fireAlert(rule, 'Interdiction detected!', 'critical');
    });

    eventBus.onJournalEvent('HeatWarning' as any, () => {
      const rule = this.rules.find((r) => r.id === 'heat_warning' && r.enabled);
      if (rule) this.fireAlert(rule, 'Heat warning — temperature rising!', 'warning');
    });

    eventBus.onJournalEvent('UnderAttack', () => {
      const rule = this.rules.find((r) => r.id === 'under_attack' && r.enabled);
      if (rule) this.fireAlert(rule, 'Under attack!', 'critical');
    });

    eventBus.onJournalEvent('ShieldState' as any, (evt) => {
      const raw = evt as any;
      if (raw.ShieldsUp === false) {
        const rule = this.rules.find((r) => r.id === 'shield_down' && r.enabled);
        if (rule) this.fireAlert(rule, 'Shields offline!', 'critical');
      }
    });

    // Periodic fuel check
    eventBus.onJournalEvent('FuelScoop', () => this.checkFuelAlert());
    eventBus.onJournalEvent('FSDJump', () => this.checkFuelAlert());
  }

  private checkFuelAlert(): void {
    const rule = this.rules.find((r) => r.id === 'low_fuel' && r.enabled);
    if (!rule) return;
    const { fuel } = gameStateManager.getState().ship;
    if (fuel.mainCapacity > 0) {
      const pct = (fuel.main / fuel.mainCapacity) * 100;
      if (pct < (rule.threshold ?? 25)) {
        this.fireAlert(rule, `Low fuel: ${pct.toFixed(0)}% remaining`, pct < 10 ? 'critical' : 'warning');
      }
    }
  }

  private fireAlert(rule: AlertRule, message: string, severity: AlertEvent['severity']): void {
    const alert: AlertEvent = {
      id: `alert-${++this.alertCounter}`,
      ruleId: rule.id,
      ruleName: rule.name,
      message,
      severity,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
    this.alertHistory.push(alert);
    if (this.alertHistory.length > 200) this.alertHistory.shift();
    wsManager.broadcast('alert:fired', alert);
  }

  getRules(): AlertRule[] { return this.rules; }

  updateRule(id: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.find((r) => r.id === id);
    if (!rule) return false;
    Object.assign(rule, updates);
    return true;
  }

  getAlertHistory(limit = 50): AlertEvent[] {
    return this.alertHistory.slice(-limit).reverse();
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alertHistory.find((a) => a.id === alertId);
    if (!alert) return false;
    alert.acknowledged = true;
    return true;
  }

  clearHistory(): void { this.alertHistory = []; }
}

export const alertsService = new AlertsService();
