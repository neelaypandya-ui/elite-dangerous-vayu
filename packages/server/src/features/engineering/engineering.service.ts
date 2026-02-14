/**
 * Engineering & materials manager service.
 * Tracks material inventory, engineer progress, and blueprint requirements.
 */

import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';
import type { Material, MaterialCategory, EngineerState } from '@vayu/shared';
import { MATERIAL_GRADE_CAPS } from '@vayu/shared';

interface BlueprintCheck {
  blueprintName: string;
  grade: number;
  canCraft: boolean;
  ingredients: Array<{
    name: string;
    required: number;
    available: number;
    sufficient: boolean;
  }>;
}

class EngineeringService {
  private engineers: Map<number, EngineerState> = new Map();

  constructor() {
    eventBus.onJournalEvent('EngineerProgress', (evt) => {
      const engineers = (evt as any).Engineers as Array<{
        Engineer: string;
        EngineerID: number;
        Progress: string;
        Rank?: number;
        RankProgress?: number;
      }> | undefined;
      if (engineers) {
        for (const eng of engineers) {
          this.engineers.set(eng.EngineerID, {
            name: eng.Engineer,
            id: eng.EngineerID,
            progress: eng.Progress as EngineerState['progress'],
            rank: eng.Rank ?? null,
            rankProgress: eng.RankProgress ?? 0,
          });
        }
      }
    });

    eventBus.onJournalEvent('EngineerCraft', (evt) => {
      const raw = evt as any;
      if (raw.EngineerID && raw.Engineer) {
        this.engineers.set(raw.EngineerID, {
          name: raw.Engineer,
          id: raw.EngineerID,
          progress: 'Unlocked',
          rank: raw.Level ?? null,
          rankProgress: 0,
        });
      }
    });
  }

  getMaterials(): { raw: Material[]; manufactured: Material[]; encoded: Material[] } {
    const state = gameStateManager.getState();
    return state.materials;
  }

  getMaterialsByCategory(category: MaterialCategory): Material[] {
    const mats = this.getMaterials();
    switch (category) {
      case 'Raw': return mats.raw;
      case 'Manufactured': return mats.manufactured;
      case 'Encoded': return mats.encoded;
    }
  }

  getEngineers(): EngineerState[] {
    return [...this.engineers.values()];
  }

  getEngineer(id: number): EngineerState | null {
    return this.engineers.get(id) ?? null;
  }

  getMaterialStats(): object {
    const mats = this.getMaterials();
    const categoryStats = (materials: Material[], label: string) => {
      const total = materials.reduce((s, m) => s + m.count, 0);
      const maxTotal = materials.reduce((s, m) => s + m.maximum, 0);
      return { category: label, count: materials.length, held: total, capacity: maxTotal, fillPercent: maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0 };
    };
    return {
      raw: categoryStats(mats.raw, 'Raw'),
      manufactured: categoryStats(mats.manufactured, 'Manufactured'),
      encoded: categoryStats(mats.encoded, 'Encoded'),
      engineers: this.getEngineers(),
    };
  }

  searchMaterials(query: string): Material[] {
    const lower = query.toLowerCase();
    const all = [...this.getMaterials().raw, ...this.getMaterials().manufactured, ...this.getMaterials().encoded];
    return all.filter((m) =>
      m.name.toLowerCase().includes(lower) ||
      (m.nameLocalised && m.nameLocalised.toLowerCase().includes(lower))
    );
  }

  getMaterialsNearCap(): Material[] {
    const all = [...this.getMaterials().raw, ...this.getMaterials().manufactured, ...this.getMaterials().encoded];
    return all.filter((m) => m.count >= m.maximum * 0.9 && m.count > 0);
  }
}

export const engineeringService = new EngineeringService();
