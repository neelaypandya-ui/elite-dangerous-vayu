/**
 * Text-to-Speech service supporting ElevenLabs API and local Piper fallback.
 */

import { config } from '../config.js';

export interface TTSResult {
  audioData: Buffer;
  format: 'mp3' | 'pcm' | 'wav';
  durationMs: number;
  provider: string;
}

export interface TTSService {
  synthesize(text: string): Promise<TTSResult>;
  isAvailable(): boolean;
}

class ElevenLabsTTS implements TTSService {
  isAvailable(): boolean {
    return !!(config.api.elevenLabsKey && config.api.elevenLabsVoiceId);
  }

  async synthesize(text: string): Promise<TTSResult> {
    const start = Date.now();
    const voiceId = config.api.elevenLabsVoiceId;

    // 15s timeout to prevent hanging on ElevenLabs API issues
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': config.api.elevenLabsKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.15,
            use_speaker_boost: true,
          },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} — ${errBody}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    return {
      audioData: audioBuffer,
      format: 'mp3',
      durationMs: Date.now() - start,
      provider: 'elevenlabs',
    };
  }
}

class PiperTTS implements TTSService {
  private available = false;

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      const { execSync } = await import('child_process');
      execSync('piper --help', { stdio: 'ignore' });
      this.available = true;
    } catch {
      this.available = false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async synthesize(text: string): Promise<TTSResult> {
    const start = Date.now();
    const { execSync } = await import('child_process');
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');

    const tmpFile = path.join(os.tmpdir(), `vayu-tts-${Date.now()}.wav`);

    try {
      execSync(`echo "${text.replace(/"/g, '\\"')}" | piper --output_file "${tmpFile}"`, {
        timeout: 15000,
        stdio: 'pipe',
      });

      const audioData = fs.readFileSync(tmpFile);
      return {
        audioData,
        format: 'wav',
        durationMs: Date.now() - start,
        provider: 'piper',
      };
    } finally {
      try { (await import('fs')).unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  }
}

class FallbackTTS implements TTSService {
  isAvailable(): boolean { return true; }

  async synthesize(text: string): Promise<TTSResult> {
    // Return empty audio — the client will display text instead
    return {
      audioData: Buffer.alloc(0),
      format: 'pcm',
      durationMs: 0,
      provider: 'none',
    };
  }
}

// ---------------------------------------------------------------------------
// Pronunciation normalization for Elite Dangerous terminology
// ---------------------------------------------------------------------------

const PRONUNCIATION_MAP: Array<[RegExp, string]> = [

  // ===========================================================================
  // 1. TITLES & GREETINGS
  // ===========================================================================

  [/\bCMDRs\b/g, 'Commanders'],
  [/\bCMDR\b/g, 'Commander'],
  [/\bo7\b/g, 'o-seven'],
  [/\bO7\b/g, 'o-seven'],

  // ===========================================================================
  // 2. SHIP INTERNAL NAMES (journal ShipType → display name)
  //    More specific patterns first to prevent partial matches.
  // ===========================================================================

  // --- Starter / Small ---
  [/\bSideWinder\b/g, 'Sidewinder'],
  [/\bEmpire_Eagle\b/g, 'Imperial Eagle'],
  [/\bViper_MkIV\b/g, 'Viper Mark Four'],
  [/\bCobraMkIV\b/g, 'Cobra Mark Four'],
  [/\bCobraMkIII\b/g, 'Cobra Mark Three'],
  [/\bDiamondBackXL\b/g, 'Diamondback Explorer'],
  [/\bDiamondBack\b/g, 'Diamondback Scout'],
  [/\bEmpire_Courier\b/g, 'Imperial Courier'],

  // --- Medium ---
  [/\bAsp_Scout\b/g, 'Asp Scout'],
  [/\bIndependant_Trader\b/g, 'Keelback'],
  [/\bType6\b/g, 'Type Six Transporter'],
  [/\bFederation_Dropship_MkII\b/g, 'Federal Assault Ship'],
  [/\bFederation_Dropship\b/g, 'Federal Dropship'],
  [/\bFederation_Gunship\b/g, 'Federal Gunship'],
  [/\bEmpire_Trader\b/g, 'Imperial Clipper'],
  [/\bTypeX_3\b/g, 'Alliance Challenger'],
  [/\bTypeX_2\b/g, 'Alliance Crusader'],
  [/\bTypeX\b/g, 'Alliance Chieftain'],
  [/\bFerDeLance\b/g, 'Fer-de-Lance'],
  [/\bPython_NX\b/g, 'Python Mark Two'],
  [/\bKrait_MkII\b/g, 'Krait Mark Two'],
  [/\bKrait_Light\b/g, 'Krait Phantom'],

  // --- Large ---
  [/\bType7\b/g, 'Type Seven Transporter'],
  [/\bType8\b/g, 'Type Eight Transporter'],
  [/\bType9_Military\b/g, 'Type Ten Defender'],
  [/\bType9\b/g, 'Type Nine Heavy'],
  [/\bBelugaLiner\b/g, 'Beluga Liner'],
  [/\bFederation_Corvette\b/g, 'Federal Corvette'],

  // ===========================================================================
  // 3. SHIP COMMON ABBREVIATIONS & NICKNAMES
  //    These match uppercase abbreviations or common slang used in chat/voice.
  // ===========================================================================

  [/\bFDL\b/g, 'Fer-de-Lance'],
  [/\bDBX\b/g, 'Diamondback Explorer'],
  [/\bDBS\b/g, 'Diamondback Scout'],
  [/\bDBE\b/g, 'Diamondback Explorer'],
  [/\bASP\b/g, 'Asp'],
  [/\bAspX\b/g, 'Asp Explorer'],
  [/\bFAS\b/g, 'Federal Assault Ship'],
  [/\bFGS\b/g, 'Federal Gunship'],
  [/\bFDS\b/g, 'Federal Dropship'],
  [/\bconda\b/gi, 'Anaconda'],
  [/\bvette\b/gi, 'Corvette'],
  [/\bclippy\b/gi, 'Imperial Clipper'],
  [/\bchieftain\b/gi, 'Alliance Chieftain'],
  [/\bchally\b/gi, 'Alliance Challenger'],
  [/\bT6\b/g, 'Type Six'],
  [/\bT7\b/g, 'Type Seven'],
  [/\bT8\b/g, 'Type Eight'],
  [/\bT9\b/g, 'Type Nine'],
  [/\bT10\b/g, 'Type Ten'],

  // Ship name pronunciation helpers (TTS might mangle these)
  [/\bGutamaya\b/gi, 'Goo-tah-my-ah'],
  [/\bFaulcon DeLacy\b/gi, 'Fawl-con De-lacy'],
  [/\bZorgon Peterson\b/gi, 'Zorgon Peterson'],
  [/\bSaud Kruger\b/gi, 'Sawd Kruger'],
  [/\bLakon\b/gi, 'Lay-kon'],

  // ===========================================================================
  // 4. FRAME SHIFT DRIVE & CORE MODULE ABBREVIATIONS
  // ===========================================================================

  [/\bFSD\b/g, 'frame shift drive'],
  [/\bSRV\b/g, 'S R V'],
  [/\bSLF\b/g, 'ship launched fighter'],
  [/\bSCBs\b/g, 'shield cell banks'],
  [/\bSCB\b/g, 'shield cell bank'],
  [/\bGFSDB\b/g, 'guardian frame shift drive booster'],
  [/\bGFSD\b/g, 'guardian frame shift drive'],
  [/\bKWS\b/g, 'kill warrant scanner'],
  [/\bECM\b/g, 'electronic countermeasure'],
  [/\bPDT\b/g, 'point defence turret'],
  [/\bAFMUs\b/g, 'auto field maintenance units'],
  [/\bAFMU\b/g, 'auto field maintenance unit'],
  [/\bAMFU\b/g, 'auto field maintenance unit'],
  [/\bDCM\b/g, 'detailed surface scanner'],
  [/\bHRPs\b/g, 'hull reinforcement packages'],
  [/\bHRP\b/g, 'hull reinforcement package'],
  [/\bMRPs\b/g, 'module reinforcement packages'],
  [/\bMRP\b/g, 'module reinforcement package'],
  [/\bSRPs\b/g, 'shield reinforcement packages'],
  [/\bSRP\b/g, 'shield reinforcement package'],
  [/\bFSDP\b/g, 'frame shift drive interdictor'],
  [/\bFSDI\b/g, 'frame shift drive interdictor'],

  // ===========================================================================
  // 5. POWER & DISTRIBUTOR ABBREVIATIONS
  //    (PD is context-ambiguous; prefer "power distributor" as more common)
  // ===========================================================================

  [/\bPP\b/g, 'powerplay'],
  [/\bPD\b/g, 'power distributor'],

  // ===========================================================================
  // 6. SCANNER & SURVEY TOOLS
  // ===========================================================================

  [/\bFSS\b/g, 'full spectrum scanner'],
  [/\bDSS\b/g, 'detailed surface scanner'],

  // ===========================================================================
  // 7. SUPERCRUISE & NAVIGATION
  // ===========================================================================

  [/\bSCA\b/g, 'supercruise assist'],
  [/\bSC\b/g, 'supercruise'],

  // ===========================================================================
  // 8. STATION TYPES & PRONUNCIATION
  // ===========================================================================

  [/\bCoriolis\.io\b/g, 'Coriolis dot I O'],
  [/\bCoriolis\b/g, 'Cor-ee-oh-lis'],
  [/\bOrbis\b/g, 'Or-bis'],
  [/\bOcellus\b/g, 'Oh-sell-us'],

  // ===========================================================================
  // 9. ALIEN / THARGOID TERMINOLOGY
  // ===========================================================================

  [/\bThargoids\b/gi, 'Thar-goyds'],
  [/\bThargoid\b/gi, 'Thar-goyd'],
  [/\bThargons\b/gi, 'Thar-gons'],
  [/\bThargon\b/gi, 'Thar-gon'],
  [/\bCyclops\b/g, 'Sy-clops'],
  [/\bBasilisk\b/g, 'Baz-il-isk'],
  [/\bMedusa\b/g, 'Meh-doo-sah'],
  [/\bHydra\b/g, 'Hy-dra'],
  [/\bOrthrus\b/g, 'Or-thrus'],
  [/\bAXI\b/g, 'anti-xeno initiative'],
  [/\bAXCZs\b/g, 'anti-xeno conflict zones'],
  [/\bAXCZ\b/g, 'anti-xeno conflict zone'],
  [/\bNHSS\b/g, 'non-human signal source'],
  [/\bAX\b/g, 'anti-xeno'],
  [/\bGlaive\b/g, 'Glaive'],
  [/\bScythe\b/g, 'Sythe'],
  [/\bBanshee\b/g, 'Ban-shee'],
  [/\bRevenant\b/g, 'Revenant'],

  // Guardian terminology
  [/\bGuardian\b/g, 'Guardian'],
  [/\bGauss\b/gi, 'Gowss'],
  [/\bShard Cannon\b/gi, 'Shard Cannon'],
  [/\bPlasma Charger\b/gi, 'Plasma Charger'],

  // ===========================================================================
  // 10. SIGNAL SOURCES & LOCATIONS
  // ===========================================================================

  [/\bHazRES\b/gi, 'hazardous resource extraction site'],
  [/\bHighRES\b/gi, 'high intensity resource extraction site'],
  [/\bLowRES\b/gi, 'low intensity resource extraction site'],
  [/\bRES\b/g, 'resource extraction site'],
  [/\bCZs\b/g, 'conflict zones'],
  [/\bCZ\b/g, 'conflict zone'],
  [/\bUSS\b/g, 'unidentified signal source'],
  [/\bHGE\b/g, 'high grade emissions'],
  [/\bPOIs\b/g, 'points of interest'],
  [/\bPOI\b/g, 'point of interest'],
  [/\bCNB\b/g, 'compromised nav beacon'],

  // ===========================================================================
  // 11. FLEET CARRIERS & COMMUNITY
  // ===========================================================================

  [/\bFCs\b/g, 'fleet carriers'],
  [/\bFC\b/g, 'fleet carrier'],
  [/\bDSSA\b/g, 'D S S A'],
  [/\bEDDB\b/g, 'E D D B'],
  [/\bEDSM\b/g, 'E D S M'],
  [/\bINARA\b/g, 'In-ara'],
  [/\bEDDN\b/g, 'E D D N'],
  [/\bEdAstro\b/g, 'Ed Astro'],
  [/\bEDSY\b/g, 'E D S Y'],

  // ===========================================================================
  // 12. GAME MODES & GENERAL ABBREVIATIONS
  // ===========================================================================

  [/\bCQC\b/g, 'C Q C'],
  [/\bNPCs\b/g, 'N P Cs'],
  [/\bNPC\b/g, 'N P C'],
  [/\bBGS\b/g, 'background simulation'],
  [/\bCGs\b/g, 'community goals'],
  [/\bCG\b/g, 'community goal'],
  [/\bPvP\b/g, 'P v P'],
  [/\bPvE\b/g, 'P v E'],

  // ===========================================================================
  // 13. CURRENCY & CREDITS
  // ===========================================================================

  [/\bCR\b/g, 'credits'],
  [/\bCr\b/g, 'credits'],
  [/\bARX\b/g, 'Arx'],

  // Large number formatting for credits (e.g. "1,000,000 CR" is handled by
  // the CR rule above; these handle raw large numbers with "cr"/"credits")
  [/(\d{1,3}(?:,\d{3})*)\s*(?:credits|cr)\b/gi, '$1 credits'],

  // ===========================================================================
  // 14. DISTANCE, UNITS & MEASUREMENTS
  // ===========================================================================

  [/\bLY\b/g, 'light years'],
  [/\bly\b/g, 'light years'],
  [/\bLs\b/g, 'light seconds'],
  [/(\d+)\s*t\b/g, '$1 tons'],
  [/(\d+)\s*MJ\b/g, '$1 megajoules'],
  [/(\d+)\s*km\/s/g, '$1 kilometers per second'],
  [/(\d+)\s*ls\b/g, '$1 light seconds'],
  [/(\d+)\s*m\/s\b/g, '$1 meters per second'],
  [/(\d+)\s*kls\b/g, '$1 kilo-light-seconds'],
  [/(\d+)\s*AU\b/g, '$1 astronomical units'],

  // ===========================================================================
  // 15. ENGINEERING GRADES & TERMS
  // ===========================================================================

  [/\bG5\b/g, 'grade five'],
  [/\bG4\b/g, 'grade four'],
  [/\bG3\b/g, 'grade three'],
  [/\bG2\b/g, 'grade two'],
  [/\bG1\b/g, 'grade one'],
  [/\bDD\b/g, 'dirty drives'],
  [/\bLWR\b/g, 'lightweight'],
  [/\bLR\b/g, 'long range'],

  // ===========================================================================
  // 16. POWERPLAY LEADERS
  //     Names that TTS might mangle without phonetic hints.
  // ===========================================================================

  [/\bAisling Duval\b/gi, 'Aisling Doo-val'],
  [/\bArissa Lavigny-Duval\b/gi, 'Arissa La-veen-yee Doo-val'],
  [/\bArissa Lavigny\b/gi, 'Arissa La-veen-yee'],
  [/\bLavigny-Duval\b/gi, 'La-veen-yee Doo-val'],
  [/\bZemina Torval\b/gi, 'Zemina Torval'],
  [/\bDenton Patreus\b/gi, 'Denton Pa-tray-us'],
  [/\bPatreus\b/gi, 'Pa-tray-us'],
  [/\bEdmund Mahon\b/gi, 'Edmund Ma-hon'],
  [/\bArchon Delaine\b/gi, 'Ar-kon De-lane'],
  [/\bPranav Antal\b/gi, 'Pra-nav An-tal'],
  [/\bLi Yong-Rui\b/gi, 'Lee Yong Roo-ee'],
  [/\bYong-Rui\b/gi, 'Yong Roo-ee'],
  [/\bFelicia Winters\b/gi, 'Felicia Winters'],
  [/\bZachary Hudson\b/gi, 'Zachary Hudson'],
  [/\bNakato Kaine\b/gi, 'Na-kah-to Kane'],
  [/\bJerome Archer\b/gi, 'Jerome Archer'],

  // ===========================================================================
  // 17. ENGINEER NAMES (pronunciation help for tricky ones)
  // ===========================================================================

  [/\bFelicity Farseer\b/gi, 'Felicity Farseer'],
  [/\bElvira Martuuk\b/gi, 'El-veer-ah Mar-took'],
  [/\bMartuuk\b/gi, 'Mar-took'],
  [/\bZacariah Nemo\b/gi, 'Zack-a-rye-ah Nee-mo'],
  [/\bLei Cheung\b/gi, 'Lay Chung'],
  [/\bHera Tani\b/gi, 'Hera Tah-nee'],
  [/\bJuri Ishmaak\b/gi, 'Yoo-ree Ish-mahk'],
  [/\bIshmaak\b/gi, 'Ish-mahk'],
  [/\bSelene Jean\b/gi, 'Seh-leen Jean'],
  [/\bDidi Vatermann\b/gi, 'Dee-dee Vah-ter-man'],
  [/\bVatermann\b/gi, 'Vah-ter-man'],
  [/\bBroo Tarquin\b/gi, 'Broo Tar-kwin'],
  [/\bTarquin\b/gi, 'Tar-kwin'],
  [/\bPetra Olmanova\b/gi, 'Petra Ol-mah-nova'],
  [/\bOlmanova\b/gi, 'Ol-mah-nova'],
  [/\bEtienne Dorn\b/gi, 'Eh-tee-en Dorn'],
  [/\bChloe Sedesi\b/gi, 'Chloe Seh-deh-see'],
  [/\bSedesi\b/gi, 'Seh-deh-see'],
  [/\bRam Tah\b/gi, 'Ram Tah'],
  [/\bOden Geiger\b/gi, 'Oh-den Gy-ger'],
  [/\bBaltanos\b/gi, 'Bal-tah-nos'],

  // ===========================================================================
  // 18. RANK NAMES (pronunciation help for unusual names)
  // ===========================================================================

  // Federation ranks
  [/\bLt\.\s*Commander\b/g, 'Lieutenant Commander'],

  // Empire ranks
  [/\bMarquis\b/g, 'Mar-kee'],
  [/\bViscount\b/g, 'Vy-count'],

  // Exobiologist ranks
  [/\bCataloguer\b/g, 'Cat-a-logger'],
  [/\bTaxonomist\b/g, 'Tax-on-oh-mist'],
  [/\bExobiologist\b/g, 'Exo-bye-ol-oh-jist'],

  // General rank patterns (longest match first to avoid partial matches)
  [/\bTriple Elite\b/gi, 'Triple Elite'],
  [/\bElite III\b/g, 'Elite Three'],
  [/\bElite II\b/g, 'Elite Two'],
  [/\bElite IV\b/g, 'Elite Four'],
  [/\bElite V\b/g, 'Elite Five'],
  [/\bElite I\b/g, 'Elite One'],

  // ===========================================================================
  // 19. EXPLORATION & STELLAR TERMINOLOGY
  // ===========================================================================

  [/\bELWs\b/g, 'earth-like worlds'],
  [/\bELW\b/g, 'earth-like world'],
  [/\bWWs\b/g, 'water worlds'],
  [/\bWW\b/g, 'water world'],
  [/\bHMC\b/g, 'high metal content'],
  [/\bAWs\b/g, 'ammonia worlds'],
  [/\bAW\b/g, 'ammonia world'],
  [/\bNS\b/g, 'neutron star'],
  [/\bWD\b/g, 'white dwarf'],
  [/\bSMBH\b/g, 'super massive black hole'],
  [/\bSagA\*?/g, 'Sagittarius A star'],

  // ===========================================================================
  // 20. MINING TERMINOLOGY
  // ===========================================================================

  [/\bLTDs\b/g, 'low temperature diamonds'],
  [/\bLTD\b/g, 'low temperature diamond'],
  [/\bVOs\b/g, 'void opals'],
  [/\bVO\b/g, 'void opal'],

  // ===========================================================================
  // 21. ODYSSEY / ON-FOOT TERMINOLOGY
  // ===========================================================================

  [/\bMaverick\b/g, 'Maverick'],
  [/\bDominator\b/g, 'Dominator'],
  [/\bArtemis\b/g, 'Artemis'],
  [/\bManticore\b/g, 'Manti-core'],

  // ===========================================================================
  // 22. MISCELLANEOUS GAME TERMS
  // ===========================================================================

  [/\bRAAXLa\b/gi, 'Raak-lah'],
  [/\bShinrarta Dezhra\b/gi, 'Shin-rar-ta Dez-ra'],
  [/\bJameson Memorial\b/gi, 'Jameson Memorial'],
  [/\bDeciat\b/gi, 'Deh-see-at'],
  [/\bColonia\b/gi, 'Koh-loh-nee-ah'],
  [/\bSol\b/g, 'Sol'],
  [/\bHutton Orbital\b/gi, 'Hutton Orbital'],
  [/\bRobigo\b/gi, 'Roh-bee-go'],

  // Lore & factions
  [/\bAegis\b/g, 'Ee-jis'],
  [/\bAzimuth Biotech\b/gi, 'Az-ih-muth Biotech'],
  [/\bAzimuth\b/g, 'Az-ih-muth'],
  [/\bSalvation\b/g, 'Salvation'],
  [/\bPilots Federation\b/gi, "Pilots' Federation"],

  // ===========================================================================
  // 23. ROMAN NUMERALS IN SHIP NAMES (Mk patterns)
  // ===========================================================================

  [/\bMk\s*IV\b/gi, 'Mark Four'],
  [/\bMk\s*III\b/gi, 'Mark Three'],
  [/\bMk\s*II\b/gi, 'Mark Two'],
  [/\bMk\s*I\b/gi, 'Mark One'],
  [/\bMkIV\b/g, 'Mark Four'],
  [/\bMkIII\b/g, 'Mark Three'],
  [/\bMkII\b/g, 'Mark Two'],
  [/\bMkI\b/g, 'Mark One'],
];

function normalizePronunciation(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PRONUNCIATION_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ---------------------------------------------------------------------------

const elevenLabs = new ElevenLabsTTS();
const piper = new PiperTTS();
const fallback = new FallbackTTS();

export function getTTSService(): TTSService {
  if (elevenLabs.isAvailable()) return elevenLabs;
  if (piper.isAvailable()) return piper;
  return fallback;
}

export const ttsService = {
  async synthesize(text: string): Promise<TTSResult> {
    return getTTSService().synthesize(normalizePronunciation(text));
  },
  isAvailable(): boolean {
    return elevenLabs.isAvailable() || piper.isAvailable();
  },
};
