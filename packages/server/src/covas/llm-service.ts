/**
 * LLM service using Claude API for COVAS natural language understanding and generation.
 */

import { config } from '../config.js';
import { gameStateManager } from '../core/game-state.js';
import type { CovasMessage, GameState } from '@vayu/shared';
import { resolveShipName, formatCredits } from '@vayu/shared';

export interface LLMResponse {
  text: string;
  intent: string | null;
  entities: Record<string, string | number | boolean>;
  latencyMs: number;
}

function buildSystemPrompt(state: GameState): string {
  const cmdr = state.commander;
  const ship = state.ship;
  const loc = state.location;
  const fuelPct = ship.fuel.mainCapacity > 0
    ? ((ship.fuel.main / ship.fuel.mainCapacity) * 100).toFixed(0)
    : '?';

  return `You are VAYU, an elite cockpit voice assistant for Elite Dangerous. You serve CMDR ${cmdr.name}.

CURRENT STATE:
- Ship: ${resolveShipName(ship.ship)} "${ship.shipName}" (Hull ${(ship.hullHealth * 100).toFixed(0)}%, Fuel ${fuelPct}%)
- Location: ${loc.system}${loc.station ? ` — docked at ${loc.station}` : ''}${loc.supercruise ? ' (supercruise)' : ''}
- Credits: ${formatCredits(cmdr.credits, true)}
- Cargo: ${ship.cargoCount}/${ship.cargoCapacity}t
- Active missions: ${state.missions.length}

PERSONALITY:
- Speak concisely like a military AI copilot
- Use Elite Dangerous terminology (CMDR, o7, supercruise, hyperspace, etc.)
- Be helpful and proactive with warnings (low fuel, mission expiry, threats)
- Keep responses under 3 sentences unless detailed info is requested

When the user asks a question, respond with useful information from the game state.
When the user gives a command, acknowledge it and provide relevant context.

COMMODITY MARKET QUERIES:
When the user asks about commodity prices, where to sell/buy something, or best trade routes, include an intent tag in your response:
- To find best SELL prices: <intent>search_commodity_sell</intent><commodity>COMMODITY_NAME</commodity>
- To find best BUY prices: <intent>search_commodity_buy</intent><commodity>COMMODITY_NAME</commodity>
Examples:
- "Where can I sell void opals for the most?" → <intent>search_commodity_sell</intent><commodity>void opals</commodity>
- "Where's the cheapest tritium?" → <intent>search_commodity_buy</intent><commodity>tritium</commodity>
- "Best price for gold" → <intent>search_commodity_sell</intent><commodity>gold</commodity>
Keep the spoken response short — the system will fetch live market data and append it.

SHIP ACTIONS:
When the user gives a command (slang or direct) that implies a ship action, include an action intent tag in your response:
- Deploy weapons / combat: <intent>action_combat_ready</intent>
- Retract weapons / stand down: <intent>action_retract_weapons</intent>
- Flee / escape / retreat: <intent>action_flee</intent>
- Deploy landing gear: <intent>action_deploy_landing_gear</intent>
- Retract landing gear: <intent>action_retract_landing_gear</intent>
- Open cargo scoop: <intent>action_open_cargo_scoop</intent>
- Close cargo scoop: <intent>action_close_cargo_scoop</intent>
- Prepare for docking: <intent>action_dock_prepare</intent>
- Enter supercruise: <intent>action_supercruise</intent>
- Silent running on: <intent>action_silent_running</intent>
- Silent running off: <intent>action_silent_running_off</intent>
- Evasive manoeuvres (chaff + boost + pips to SYS): <intent>action_evasive</intent>
- Toggle night vision: <intent>action_night_vision</intent>
- Toggle ship lights: <intent>action_lights_toggle</intent>
- Enter FSS scanner: <intent>action_scan_mode</intent>
- Open galaxy map: <intent>action_galaxy_map</intent>
- Open system map: <intent>action_system_map</intent>
- Open camera suite: <intent>action_photo_camera</intent>
- Boost engines: <intent>action_boost</intent>
- Deploy chaff: <intent>action_chaff</intent>
- Deploy heat sink: <intent>action_heatsink</intent>
- Fire shield cell bank: <intent>action_shield_cell</intent>

Examples:
- "time to kick some ass" → <intent>action_combat_ready</intent> with an enthusiastic combat response
- "time to get out of here" → <intent>action_flee</intent> with an urgent escape response
- "let's bounce" → <intent>action_flee</intent> with a casual acknowledgment
- "weapons away" → <intent>action_retract_weapons</intent>
- "prepare for landing" → <intent>action_dock_prepare</intent>
- "go dark" → <intent>action_silent_running</intent> with a stealthy acknowledgment
- "evasive manoeuvres" → <intent>action_evasive</intent> with an urgent response
- "lights on" → <intent>action_lights_toggle</intent>
- "scan the system" → <intent>action_scan_mode</intent>
- "hit the afterburners" → <intent>action_boost</intent>
- "pop chaff" → <intent>action_chaff</intent>
- "dump heat" → <intent>action_heatsink</intent>
- "shields failing, cell" → <intent>action_shield_cell</intent>

Match the commander's energy. If they're hyped for combat, be hyped back. If they want to flee, be urgent. Respond naturally — the system will execute the actual keypresses.`;
}

class LLMService {
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private maxHistory = 20;

  async processInput(text: string, _messages?: CovasMessage[]): Promise<LLMResponse> {
    const start = Date.now();
    const state = gameStateManager.getState();

    if (!config.api.anthropicKey) {
      return this.fallbackResponse(text, state, start);
    }

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: config.api.anthropicKey });

      this.conversationHistory.push({ role: 'user', content: text });
      if (this.conversationHistory.length > this.maxHistory) {
        this.conversationHistory = this.conversationHistory.slice(-this.maxHistory);
      }

      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        system: buildSystemPrompt(state),
        messages: this.conversationHistory,
      });

      const responseText = response.content
        .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
        .map((b) => b.text)
        .join('');

      this.conversationHistory.push({ role: 'assistant', content: responseText });

      const { intent, entities } = this.extractIntent(text, responseText);

      return {
        text: responseText,
        intent,
        entities,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      console.error('[COVAS/LLM] API error:', err);
      return this.fallbackResponse(text, state, start);
    }
  }

  private fallbackResponse(text: string, state: GameState, start: number): LLMResponse {
    const lower = text.toLowerCase();
    const { intent, entities } = this.extractIntent(text, '');

    let responseText = `I heard "${text}", but the LLM service is not configured. Set ANTHROPIC_API_KEY to enable full conversation.`;

    if (lower.includes('fuel')) {
      const pct = state.ship.fuel.mainCapacity > 0
        ? ((state.ship.fuel.main / state.ship.fuel.mainCapacity) * 100).toFixed(0)
        : '?';
      responseText = `Fuel level is at ${pct}%. ${state.ship.fuel.main.toFixed(1)}t of ${state.ship.fuel.mainCapacity}t remaining.`;
    } else if (lower.includes('where') || lower.includes('location') || lower.includes('system')) {
      responseText = `You are in the ${state.location.system} system.`;
      if (state.location.station) responseText += ` Docked at ${state.location.station}.`;
    } else if (lower.includes('mission')) {
      responseText = `You have ${state.missions.length} active mission${state.missions.length !== 1 ? 's' : ''}.`;
    } else if (lower.includes('ship')) {
      responseText = `Flying ${resolveShipName(state.ship.ship)} "${state.ship.shipName}". Hull at ${(state.ship.hullHealth * 100).toFixed(0)}%.`;
    }

    return { text: responseText, intent, entities, latencyMs: Date.now() - start };
  }

  private extractIntent(input: string, response: string): { intent: string | null; entities: Record<string, string | number | boolean> } {
    const lower = input.toLowerCase();
    const entities: Record<string, string | number | boolean> = {};

    // Check LLM response for explicit intent tags first
    const intentTagMatch = response.match(/<intent>([\w_]+)<\/intent>/);
    const commodityTagMatch = response.match(/<commodity>([^<]+)<\/commodity>/);
    if (intentTagMatch) {
      const tagIntent = intentTagMatch[1];
      if (commodityTagMatch) entities['commodity'] = commodityTagMatch[1].trim();
      return { intent: tagIntent, entities };
    }

    // Commodity price queries (from user input)
    const sellPatterns = [
      /(?:where|best|highest|top)\s+(?:can i|to|price|prices?)\s+(?:sell|offload|unload)\s+(.+?)(?:\s*\?|$)/,
      /(?:sell|selling)\s+(?:price|prices?)\s+(?:for|of)\s+(.+?)(?:\s*\?|$)/,
      /(?:best|highest|top)\s+(?:price|prices?)\s+(?:for|of)\s+(.+?)(?:\s*\?|$)/,
      /(?:where|who)\s+(?:is|are)\s+(?:buying|paying\s+(?:the\s+)?(?:most|highest))\s+(?:for\s+)?(.+?)(?:\s*\?|$)/,
    ];
    for (const pattern of sellPatterns) {
      const match = lower.match(pattern);
      if (match) {
        entities['commodity'] = match[1].trim().replace(/\s*\?$/, '');
        return { intent: 'search_commodity_sell', entities };
      }
    }

    const buyPatterns = [
      /(?:where|best|cheapest|lowest)\s+(?:can i|to|price|prices?)\s+(?:buy|purchase|get)\s+(.+?)(?:\s*\?|$)/,
      /(?:buy|buying)\s+(?:price|prices?)\s+(?:for|of)\s+(.+?)(?:\s*\?|$)/,
      /(?:cheapest|lowest)\s+(?:price|prices?)\s+(?:for|of)\s+(.+?)(?:\s*\?|$)/,
    ];
    for (const pattern of buyPatterns) {
      const match = lower.match(pattern);
      if (match) {
        entities['commodity'] = match[1].trim().replace(/\s*\?$/, '');
        return { intent: 'search_commodity_buy', entities };
      }
    }

    // Action intents — slang and direct commands for ship controls
    const actionPatterns: Array<[RegExp, string]> = [
      [/\b(kick.*ass|weapons?\s*hot|engage|attack|fight|combat|battle\s*stations?|lock\s*and\s*load)\b/, 'action_combat_ready'],
      [/\b(get\s*out|flee|run\b|escape|bail|bug\s*out|let'?s?\s*bounce|retreat|withdraw|gtfo)\b/, 'action_flee'],
      [/\b(weapons?\s*away|retract\s*(hard\s*points?|weapons?)|stand\s*down|holster|lights?\s*out)\b/, 'action_retract_weapons'],
      [/\b(landing\s*gear\s*down|gear\s*down|deploy\s*(landing\s*)?gear|wheels?\s*down)\b/, 'action_deploy_landing_gear'],
      [/\b(landing\s*gear\s*up|gear\s*up|retract\s*(landing\s*)?gear|wheels?\s*up)\b/, 'action_retract_landing_gear'],
      [/\b(open\s*(cargo\s*)?scoop|deploy\s*scoop|scoop\s*out)\b/, 'action_open_cargo_scoop'],
      [/\b(close\s*(cargo\s*)?scoop|retract\s*scoop|scoop\s*in|secure\s*scoop)\b/, 'action_close_cargo_scoop'],
      [/\b(prepare\s*(for\s*)?dock|docking\s*prep|coming\s*in\s*to\s*land)\b/, 'action_dock_prepare'],
      [/\b(supercruise|punch\s*it|cruise)\b/, 'action_supercruise'],
      [/\b(go\s*dark|go\s*silent|silent\s*running\s*(on|activate|engage)?|run\s*silent|stealth\s*mode|cloak)\b/, 'action_silent_running'],
      [/\b(silent\s*running\s*(off|deactivate|disengage|disable)|drop\s*silent|uncloak|go\s*loud)\b/, 'action_silent_running_off'],
      [/\b(evasive|evasive\s*manoe?uvres?|evade|jink|dodge|break\s*away)\b/, 'action_evasive'],
      [/\b(night\s*vision|nv\s*(on|off|toggle)?|dark\s*sight)\b/, 'action_night_vision'],
      [/\b(lights?\s*(on|off|toggle)|ship\s*lights?|headlights?|spot\s*lights?)\b/, 'action_lights_toggle'],
      [/\b(scan\s*(mode|the\s*system)?|fss|full\s*spectrum|enter\s*scanner)\b/, 'action_scan_mode'],
      [/\b(galaxy\s*map|gal\s*map|open\s*galaxy)\b/, 'action_galaxy_map'],
      [/\b(system\s*map|sys\s*map|open\s*system)\b/, 'action_system_map'],
      [/\b(camera\s*(suite|mode)?|photo\s*(mode|camera)|selfie|screenshot|take\s*a?\s*pic(ture)?)\b/, 'action_photo_camera'],
      [/\b(boost|afterburner|hit\s*the\s*burners?|floor\s*it|full\s*throttle\s*boost)\b/, 'action_boost'],
      [/\b(chaff|pop\s*chaff|deploy\s*chaff|drop\s*chaff|launch\s*chaff)\b/, 'action_chaff'],
      [/\b(heat\s*sink|dump\s*heat|deploy\s*heat\s*sink|drop\s*a?\s*sink|cool\s*down)\b/, 'action_heatsink'],
      [/\b(shield\s*cell|fire\s*cell|scb|cell\s*bank|bank\s*cell|pop\s*cell)\b/, 'action_shield_cell'],
    ];
    for (const [pattern, intent] of actionPatterns) {
      if (pattern.test(lower)) return { intent, entities };
    }

    if (lower.includes('navigate') || lower.includes('go to') || lower.includes('jump to') || lower.includes('plot route')) {
      const match = lower.match(/(?:to|for)\s+(.+?)(?:\s*$|\s*please)/);
      if (match) entities['system'] = match[1].trim();
      return { intent: 'navigate_to_system', entities };
    }
    if (lower.includes('fuel') || lower.includes('tank')) return { intent: 'check_fuel', entities };
    if (lower.includes('mission')) return { intent: 'check_missions', entities };
    if (lower.includes('cargo') || lower.includes('hold')) return { intent: 'check_cargo', entities };
    if (lower.includes('where am i') || lower.includes('current location') || lower.includes('what system')) return { intent: 'check_location', entities };
    if (lower.includes('ship') || lower.includes('hull') || lower.includes('status')) return { intent: 'check_ship_status', entities };
    if (lower.includes('play') || lower.includes('music') || lower.includes('song')) {
      const match = lower.match(/play\s+(.+)/);
      if (match) entities['query'] = match[1].trim();
      return { intent: 'play_music', entities };
    }

    return { intent: null, entities };
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}

export const llmService = new LLMService();
