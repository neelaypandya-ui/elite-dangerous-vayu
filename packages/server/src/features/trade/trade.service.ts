/**
 * Trade route optimizer service.
 * Provides trade route analysis, commodity prices via EDSM/Spansh, and session tracking.
 */

import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';
import { config } from '../../config.js';
import {
  searchBestSellPrice,
  searchBestBuyPrice,
  resolveCommodityName,
  type SpanshCommoditySearch,
} from './spansh-client.js';

interface InternalTradeTransaction {
  type: 'buy' | 'sell';
  commodity: string;
  count: number;
  price: number;
  total: number;
  profit: number;
  timestamp: string;
}

interface InternalTradeSession {
  id: string;
  startTime: string;
  endTime: string | null;
  startSystem: string;
  startStation: string;
  transactions: InternalTradeTransaction[];
  totalProfit: number;
  totalRevenue: number;
  totalCost: number;
  cargoTonsMoved: number;
}

interface CommodityPrice {
  name: string;
  buyPrice: number;
  sellPrice: number;
  demand: number;
  supply: number;
  station: string;
  system: string;
  distanceLy?: number;
  landingPadSize?: string;
  updatedAt?: string;
}

class TradeService {
  private tradeSessions: InternalTradeSession[] = [];
  private currentSession: InternalTradeSession | null = null;
  private priceCache: Map<string, { data: CommodityPrice[]; expiry: number }> = new Map();

  constructor() {
    eventBus.onJournalEvent('MarketSell', (evt) => {
      if (!this.currentSession) this.startSession();
      if (this.currentSession) {
        this.currentSession.transactions.push({
          type: 'sell',
          commodity: (evt as any).Type_Localised || (evt as any).Type || 'Unknown',
          count: (evt as any).Count || 0,
          price: (evt as any).SellPrice || 0,
          total: (evt as any).TotalSale || 0,
          profit: ((evt as any).TotalSale || 0) - (((evt as any).AvgPricePaid || 0) * ((evt as any).Count || 0)),
          timestamp: evt.timestamp,
        });
      }
    });

    eventBus.onJournalEvent('MarketBuy', (evt) => {
      if (!this.currentSession) this.startSession();
      if (this.currentSession) {
        this.currentSession.transactions.push({
          type: 'buy',
          commodity: (evt as any).Type_Localised || (evt as any).Type || 'Unknown',
          count: (evt as any).Count || 0,
          price: (evt as any).BuyPrice || 0,
          total: (evt as any).TotalCost || 0,
          profit: 0,
          timestamp: evt.timestamp,
        });
      }
    });

    eventBus.onJournalEvent('Undocked', () => {
      if (this.currentSession) this.endSession();
    });
  }

  private startSession(): void {
    const state = gameStateManager.getState();
    this.currentSession = {
      id: `trade-${Date.now()}`,
      startTime: new Date().toISOString(),
      endTime: null,
      startSystem: state.location.system,
      startStation: state.location.station || 'Unknown',
      transactions: [],
      totalProfit: 0,
      totalRevenue: 0,
      totalCost: 0,
      cargoTonsMoved: 0,
    };
  }

  private endSession(): void {
    if (!this.currentSession) return;
    this.currentSession.endTime = new Date().toISOString();
    for (const tx of this.currentSession.transactions) {
      if (tx.type === 'sell') {
        this.currentSession.totalRevenue += tx.total;
        this.currentSession.totalProfit += tx.profit;
      } else {
        this.currentSession.totalCost += tx.total;
      }
      this.currentSession.cargoTonsMoved += tx.count;
    }
    this.tradeSessions.push(this.currentSession);
    if (this.tradeSessions.length > 100) this.tradeSessions.shift();
    this.currentSession = null;
  }

  getSessions(): InternalTradeSession[] {
    return [...this.tradeSessions];
  }

  getCurrentSession(): InternalTradeSession | null {
    return this.currentSession;
  }

  async searchCommodityPrices(commodity: string): Promise<CommodityPrice[]> {
    const cacheKey = commodity.toLowerCase();
    const cached = this.priceCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) return cached.data;

    try {
      const state = gameStateManager.getState();
      const refSystem = state.location.system || 'Sol';

      const result = await searchBestSellPrice(commodity, refSystem, 10, 1);
      const prices: CommodityPrice[] = result.results.map(r => ({
        name: result.commodity,
        buyPrice: r.buyPrice,
        sellPrice: r.sellPrice,
        demand: r.demand,
        supply: r.supply,
        station: r.stationName,
        system: r.systemName,
        distanceLy: r.distanceLy,
        landingPadSize: r.landingPadSize,
        updatedAt: r.marketUpdatedAt,
      }));

      this.priceCache.set(cacheKey, { data: prices, expiry: Date.now() + 15 * 60 * 1000 });
      return prices;
    } catch (err) {
      console.error('[Trade] Commodity search failed:', err);
      return [];
    }
  }

  /**
   * Search for best sell prices for a commodity near the commander's current system.
   */
  async findBestSellPrice(commodity: string, maxResults = 5): Promise<SpanshCommoditySearch> {
    const state = gameStateManager.getState();
    return searchBestSellPrice(commodity, state.location.system || 'Sol', maxResults);
  }

  /**
   * Search for cheapest buy prices for a commodity near the commander's current system.
   */
  async findBestBuyPrice(commodity: string, maxResults = 5): Promise<SpanshCommoditySearch> {
    const state = gameStateManager.getState();
    return searchBestBuyPrice(commodity, state.location.system || 'Sol', maxResults);
  }

  /**
   * Resolve a user query to the exact commodity name.
   */
  async resolveCommodity(query: string): Promise<string | null> {
    return resolveCommodityName(query);
  }

  getTradeStats(): object {
    const state = gameStateManager.getState();
    return {
      currentSystem: state.location.system,
      currentStation: state.location.station,
      cargo: state.ship.cargo,
      cargoUsed: state.ship.cargoCount,
      cargoCapacity: state.ship.cargoCapacity,
      sessionCount: this.tradeSessions.length,
      totalProfit: this.tradeSessions.reduce((sum, s) => sum + s.totalProfit, 0),
      currentSession: this.currentSession,
    };
  }
}

export const tradeService = new TradeService();
