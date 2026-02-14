/**
 * Community integrations service (EDSM, Inara).
 */

import { config } from '../../config.js';
import { gameStateManager } from '../../core/game-state.js';
import { COMBAT_RANKS, TRADE_RANKS, EXPLORE_RANKS } from '@vayu/shared';

interface EDSMSystemInfo {
  name: string;
  id: number;
  coords: { x: number; y: number; z: number };
  information?: Record<string, unknown>;
}

interface CommanderProfile {
  source: string;
  name: string;
  url: string;
  credits: number;
  combatRank: string;
  tradeRank: string;
  explorationRank: string;
}

class CommunityService {
  async getEdsmSystem(systemName: string): Promise<EDSMSystemInfo | null> {
    try {
      const url = `https://www.edsm.net/api-v1/system?systemName=${encodeURIComponent(systemName)}&showCoordinates=1&showInformation=1`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) return null;
      const data = await resp.json() as any;
      if (!data.name) return null;
      return data as EDSMSystemInfo;
    } catch {
      return null;
    }
  }

  async getEdsmCommanderPosition(): Promise<object | null> {
    if (!config.api.edsmApiKey || !config.api.edsmCommanderName) return null;
    try {
      const url = `https://www.edsm.net/api-v1/commander?commanderName=${encodeURIComponent(config.api.edsmCommanderName)}&apiKey=${config.api.edsmApiKey}&showCoordinates=1`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) return null;
      return await resp.json() as object;
    } catch {
      return null;
    }
  }

  async getEdsmTrafficReport(systemName: string): Promise<object | null> {
    try {
      const url = `https://www.edsm.net/api-system-v1/traffic?systemName=${encodeURIComponent(systemName)}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) return null;
      return await resp.json() as object;
    } catch {
      return null;
    }
  }

  getLocalProfile(): CommanderProfile {
    const state = gameStateManager.getState();
    return {
      source: 'local',
      name: state.commander.name,
      url: '',
      credits: state.commander.credits,
      combatRank: COMBAT_RANKS[state.commander.ranks.combat.rank] ?? 'Unknown',
      tradeRank: TRADE_RANKS[state.commander.ranks.trade.rank] ?? 'Unknown',
      explorationRank: EXPLORE_RANKS[state.commander.ranks.explore.rank] ?? 'Unknown',
    };
  }

  getCommunityLinks(): object {
    return {
      edsm: {
        configured: !!config.api.edsmApiKey,
        commanderName: config.api.edsmCommanderName,
        url: config.api.edsmCommanderName
          ? `https://www.edsm.net/en/user/profile/id/0/cmdr/${encodeURIComponent(config.api.edsmCommanderName)}`
          : null,
      },
      inara: {
        configured: !!config.api.inaraApiKey,
        commanderName: config.api.inaraCommanderName,
        url: config.api.inaraCommanderName
          ? `https://inara.cz/elite/cmdr-overview/?cmdr=${encodeURIComponent(config.api.inaraCommanderName)}`
          : null,
      },
    };
  }
}

export const communityService = new CommunityService();
