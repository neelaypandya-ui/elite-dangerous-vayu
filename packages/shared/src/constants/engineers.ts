/**
 * @vayu/shared — Engineer Database
 *
 * Complete catalogue of all Horizons and Odyssey engineers in Elite Dangerous.
 * Includes their locations, specialties, unlock requirements, and referral chains.
 *
 * Data sourced from:
 * - Elite Dangerous Wiki
 * - Inara.cz engineer database
 * - In-game journal data
 */

// ---------------------------------------------------------------------------
// Engineer Data Interface
// ---------------------------------------------------------------------------

/** Static reference data for a single engineer. */
export interface EngineerData {
  /** Engineer numeric ID as used in journal events. */
  id: number;
  /** Engineer's full name. */
  name: string;
  /** Star system where the engineer is located. */
  system: string;
  /** Station or base name. */
  station: string;
  /** List of module types / blueprint categories this engineer offers. */
  specialties: string[];
  /** Description of how to unlock access to this engineer. */
  unlockRequirement: string;
  /** Name of the engineer who refers you to this one (if any). */
  referralChain?: string;
  /** Whether this is an Odyssey on-foot engineer. */
  isOdyssey: boolean;
}

// ---------------------------------------------------------------------------
// Horizons Engineers (Ship Modules)
// ---------------------------------------------------------------------------

/** All Horizons engineers (ship module engineering). */
export const HORIZONS_ENGINEERS: readonly EngineerData[] = [
  {
    id: 300100,
    name: 'Felicity Farseer',
    system: 'Deciat',
    station: 'Farseer Inc',
    specialties: ['Frame Shift Drive', 'Thrusters', 'Sensors', 'Detailed Surface Scanner'],
    unlockRequirement: 'Reach Scout exploration rank',
    isOdyssey: false,
  },
  {
    id: 300160,
    name: 'Elvira Martuuk',
    system: 'Khun',
    station: 'Long Sight Base',
    specialties: ['Frame Shift Drive', 'Shield Generator', 'Shield Booster'],
    unlockRequirement: 'Travel at least 300 LY from starting system',
    isOdyssey: false,
  },
  {
    id: 300110,
    name: 'The Dweller',
    system: 'Wyrd',
    station: 'Black Hide',
    specialties: ['Power Distributor', 'Pulse Laser', 'Burst Laser', 'Beam Laser'],
    unlockRequirement: 'Deal in 5 black markets',
    isOdyssey: false,
  },
  {
    id: 300120,
    name: 'Liz Ryder',
    system: 'Eurybia',
    station: 'Demolition Unlimited',
    specialties: ['Missile Rack', 'Torpedo Pylon', 'Mine Launcher', 'Hull Reinforcement', 'Armour'],
    unlockRequirement: 'Gain Cordial reputation with Eurybia Blue Mafia',
    referralChain: 'The Dweller',
    isOdyssey: false,
  },
  {
    id: 300130,
    name: 'Tod "The Blaster" McQuinn',
    system: 'Wolf 397',
    station: 'Trophy Camp',
    specialties: ['Multi-cannon', 'Fragment Cannon', 'Rail Gun'],
    unlockRequirement: 'Earn 15 bounty vouchers',
    isOdyssey: false,
  },
  {
    id: 300140,
    name: 'Zacariah Nemo',
    system: 'Yoru',
    station: "Nemo's Workshop",
    specialties: ['Multi-cannon', 'Fragment Cannon', 'Plasma Accelerator'],
    unlockRequirement: 'Provide 25 units of Xihe Biomorphic Companions',
    referralChain: 'Elvira Martuuk',
    isOdyssey: false,
  },
  {
    id: 300150,
    name: 'Lei Cheung',
    system: 'Laksak',
    station: "Trader's Rest",
    specialties: ['Shield Generator', 'Shield Booster', 'Sensors'],
    unlockRequirement: 'Trade in 50 markets',
    referralChain: 'The Dweller',
    isOdyssey: false,
  },
  {
    id: 300180,
    name: 'Hera Tani',
    system: 'Kuwemaki',
    station: 'The Jet\'s Hole',
    specialties: ['Power Plant', 'Sensors', 'Detailed Surface Scanner'],
    unlockRequirement: 'Reach Outsider Empire rank',
    referralChain: 'Liz Ryder',
    isOdyssey: false,
  },
  {
    id: 300170,
    name: 'Juri Ishmaak',
    system: 'Giryak',
    station: 'Pater\'s Memorial',
    specialties: ['Mine Launcher', 'Torpedo Pylon', 'Missile Rack', 'Sensors'],
    unlockRequirement: 'Earn 50 combat bonds',
    referralChain: 'Felicity Farseer',
    isOdyssey: false,
  },
  {
    id: 300190,
    name: 'Selene Jean',
    system: 'Kuk',
    station: 'Prospector\'s Rest',
    specialties: ['Armour', 'Hull Reinforcement'],
    unlockRequirement: 'Mine and refine 500 tons of ore',
    referralChain: 'Tod "The Blaster" McQuinn',
    isOdyssey: false,
  },
  {
    id: 300200,
    name: 'Marco Qwent',
    system: 'Sirius',
    station: 'Qwent Research Base',
    specialties: ['Power Plant', 'Power Distributor'],
    unlockRequirement: 'Gain access to Sirius system (permit) and provide 25 units of Modular Terminals',
    referralChain: 'Elvira Martuuk',
    isOdyssey: false,
  },
  {
    id: 300220,
    name: 'Professor Palin',
    system: 'Arque',
    station: 'Abel Laboratory',
    specialties: ['Thrusters', 'Frame Shift Drive Interdictor'],
    unlockRequirement: 'Travel at least 5,000 LY from starting system',
    referralChain: 'Marco Qwent',
    isOdyssey: false,
  },
  {
    id: 300230,
    name: 'Didi Vatermann',
    system: 'Leesti',
    station: 'Vatermann LLC',
    specialties: ['Shield Booster', 'Shield Generator'],
    unlockRequirement: 'Trade with 50 markets and have Entrepreneur trade rank',
    referralChain: 'Selene Jean',
    isOdyssey: false,
  },
  {
    id: 300240,
    name: 'Colonel Bris Dekker',
    system: 'Sol',
    station: 'Dekker\'s Yard',
    specialties: ['Frame Shift Drive Interdictor', 'Frame Shift Drive'],
    unlockRequirement: 'Earn 1,000,000 Cr worth of Federal combat bonds',
    referralChain: 'Juri Ishmaak',
    isOdyssey: false,
  },
  {
    id: 300250,
    name: 'Broo Tarquin',
    system: 'Muang',
    station: 'Broo\'s Legacy',
    specialties: ['Pulse Laser', 'Burst Laser', 'Beam Laser'],
    unlockRequirement: 'Provide 50 units of Fujin Tea',
    referralChain: 'Hera Tani',
    isOdyssey: false,
  },
  {
    id: 300260,
    name: 'The Sarge',
    system: 'Beta-3 Tucani',
    station: 'The Beach',
    specialties: ['Cannon', 'Multi-cannon'],
    unlockRequirement: 'Earn 10 Federal navy rank promotions',
    referralChain: 'Juri Ishmaak',
    isOdyssey: false,
  },
  {
    id: 300270,
    name: 'Lori Jameson',
    system: 'Shinrarta Dezhra',
    station: 'Jameson Base',
    specialties: ['Auto Field-Maintenance Unit', 'Collector Limpet Controller', 'Fuel Transfer Limpet', 'Hatch Breaker Limpet', 'Mining Laser', 'Prospector Limpet Controller', 'Refinery', 'Sensors', 'Life Support'],
    unlockRequirement: 'Achieve combat rank of Dangerous',
    referralChain: 'Lei Cheung',
    isOdyssey: false,
  },
  {
    id: 300280,
    name: 'Ram Tah',
    system: 'Meene',
    station: 'Phoenix Base',
    specialties: ['Collector Limpet Controller', 'Heat Sink Launcher', 'Point Defence', 'Chaff Launcher', 'Electronic Countermeasure'],
    unlockRequirement: 'Provide 50 units of classified scan databanks',
    referralChain: 'Lei Cheung',
    isOdyssey: false,
  },
  {
    id: 300290,
    name: 'Petra Olmanova',
    system: 'Asura',
    station: 'Sanctuary',
    specialties: ['Armour', 'Hull Reinforcement', 'Mine Launcher'],
    unlockRequirement: 'Earn 200 combat bonds',
    referralChain: 'Tod "The Blaster" McQuinn',
    isOdyssey: false,
  },
  {
    id: 300300,
    name: 'Marsha Hicks',
    system: 'Tir',
    station: 'The Watchtower',
    specialties: ['Fragment Cannon', 'Cannon', 'Multi-cannon', 'Rail Gun', 'Plasma Accelerator'],
    unlockRequirement: 'Mine and refine 500 tons of minerals',
    referralChain: 'The Sarge',
    isOdyssey: false,
  },
  {
    id: 300310,
    name: 'Mel Brandon',
    system: 'Luchtaine',
    station: 'The Brig',
    specialties: ['Shield Generator', 'Shield Booster', 'Frame Shift Drive'],
    unlockRequirement: 'Provide 100,000 Cr in bounty vouchers to Colonia factions',
    referralChain: 'Elvira Martuuk',
    isOdyssey: false,
  },
  {
    id: 300320,
    name: 'Etienne Dorn',
    system: 'Los',
    station: 'Kraken\'s Retreat',
    specialties: ['Power Plant', 'Power Distributor', 'Sensors', 'Life Support', 'Plasma Accelerator'],
    unlockRequirement: 'Provide 25 units of Occupied Escape Pods to the engineer',
    referralChain: 'Liz Ryder',
    isOdyssey: false,
  },
  {
    id: 300330,
    name: 'Tiana Fortune',
    system: 'Achenar',
    station: 'Fortune\'s Loss',
    specialties: ['Frame Shift Drive Interdictor', 'Sensors', 'Collector Limpet Controller', 'Mining Laser'],
    unlockRequirement: 'Be Friendly with Empire and provide 50 decoded emission data',
    referralChain: 'Hera Tani',
    isOdyssey: false,
  },
  {
    id: 300340,
    name: 'Bill Turner',
    system: 'Alioth',
    station: 'Turner Metallics Inc',
    specialties: ['Plasma Accelerator', 'Rail Gun', 'Sensors', 'Life Support'],
    unlockRequirement: 'Gain Alioth permit and provide 50 units of Bromellite',
    referralChain: 'Selene Jean',
    isOdyssey: false,
  },
  {
    id: 300350,
    name: 'Chloe Sedesi',
    system: 'Shenve',
    station: 'Cinder Dock',
    specialties: ['Thrusters', 'Frame Shift Drive Interdictor'],
    unlockRequirement: 'Travel at least 5,000 LY from starting system',
    referralChain: 'Marco Qwent',
    isOdyssey: false,
  },
] as const;

// ---------------------------------------------------------------------------
// Odyssey Engineers (On-Foot Equipment)
// ---------------------------------------------------------------------------

/** All Odyssey engineers (suit and personal weapon engineering). */
export const ODYSSEY_ENGINEERS: readonly EngineerData[] = [
  {
    id: 400100,
    name: 'Hero Ferrari',
    system: 'Sirius',
    station: 'Patterson Enterprise',
    specialties: ['Maverick Suit — Added Melee Damage', 'Maverick Suit — Extra Backpack Capacity', 'Maverick Suit — Improved Jump Assist'],
    unlockRequirement: 'Complete 10 covert theft or heist missions',
    isOdyssey: true,
  },
  {
    id: 400110,
    name: 'Jude Navarro',
    system: 'Aranbarahun',
    station: 'Memorial of Zetford',
    specialties: ['Dominator Suit — Extra Ammo Capacity', 'Dominator Suit — Improved Jump Assist', 'Dominator Suit — Combat Movement Speed'],
    unlockRequirement: 'Complete 10 on-foot conflict zone missions',
    isOdyssey: true,
  },
  {
    id: 400120,
    name: 'Uma Laszlo',
    system: 'Xuane',
    station: "Laszlo's Resolve",
    specialties: ['Artemis Suit — Improved Jump Assist', 'Artemis Suit — Added Melee Damage', 'Artemis Suit — Extra Backpack Capacity'],
    unlockRequirement: 'Sell 15 exobiology samples at Vista Genomics',
    isOdyssey: true,
  },
  {
    id: 400130,
    name: 'Oden Geiger',
    system: 'Candiaei',
    station: 'Ankh\'s Promise',
    specialties: ['Manticore Executioner — Faster Handling', 'Manticore Tormentor — Greater Range', 'Manticore Intimidator — Noise Suppressor'],
    unlockRequirement: 'Provide 5 units of Push, 5 units of Lazarus, and 5 units of Smeaton',
    isOdyssey: true,
  },
  {
    id: 400140,
    name: 'Terra Velasquez',
    system: 'Shou Xing',
    station: 'Velasquez Medical Research Center',
    specialties: ['Karma C-44 — Faster Handling', 'Karma AR-50 — Greater Range', 'Karma L-6 — Noise Suppressor'],
    unlockRequirement: 'Complete 10 restore/reactivation missions',
    isOdyssey: true,
  },
  {
    id: 400150,
    name: 'Kit Fowler',
    system: 'Capoya',
    station: "Fowler's Folly",
    specialties: ['TK Aphelion — Faster Handling', 'TK Eclipse — Greater Range', 'TK Zenith — Noise Suppressor'],
    unlockRequirement: 'Provide 5 units of Opinion Polls, 5 units of Cat Media, and 5 units of Multimedia Entertainment',
    isOdyssey: true,
  },
  {
    id: 400160,
    name: 'Yarden Bond',
    system: 'Bayan',
    station: "Bond's Workshop",
    specialties: ['Kinematic Weapons — Magazine Size', 'Kinematic Weapons — Headshot Damage', 'Kinematic Weapons — Reload Speed'],
    unlockRequirement: 'Complete 10 sabotage or disable missions',
    isOdyssey: true,
  },
  {
    id: 400170,
    name: 'Wellington Beck',
    system: 'Jolapa',
    station: "Beck's Field",
    specialties: ['Plasma Weapons — Magazine Size', 'Plasma Weapons — Headshot Damage', 'Plasma Weapons — Reload Speed'],
    unlockRequirement: 'Complete 10 covert assassination missions',
    isOdyssey: true,
  },
  {
    id: 400180,
    name: 'Eleanor Bresa',
    system: 'Desy',
    station: "Bresa's Legacy",
    specialties: ['Laser Weapons — Magazine Size', 'Laser Weapons — Headshot Damage', 'Laser Weapons — Reload Speed'],
    unlockRequirement: 'Complete 10 settlement raid or theft missions',
    isOdyssey: true,
  },
  {
    id: 400190,
    name: 'Domino Green',
    system: 'Orishis',
    station: "Green's Respite",
    specialties: ['All Suits — Night Vision', 'All Suits — Quieter Footsteps', 'All Suits — Increased Battery Life'],
    unlockRequirement: 'Sell 20 items of goods or assets to a bartender',
    isOdyssey: true,
  },
  {
    id: 400200,
    name: 'Baltanos',
    system: 'Deriso',
    station: "Baltanos' Lab",
    specialties: ['All Suits — Damage Resistance', 'All Suits — Extra Ammo Capacity', 'All Suits — Increased Sprint Duration'],
    unlockRequirement: 'Complete 15 ground conflict zone victories',
    isOdyssey: true,
  },
  {
    id: 400210,
    name: 'Rosa Dayette',
    system: 'Kojeara',
    station: "Dayette's Workshop",
    specialties: ['Manticore Weapons — Stability', 'Karma Weapons — Stability', 'TK Weapons — Stability'],
    unlockRequirement: 'Provide 5 units of Building Fabrication Plans, 5 units of Insight Entertainment Suite, and 5 units of Push',
    isOdyssey: true,
  },
  {
    id: 400220,
    name: 'Yi Shen',
    system: 'Einheriar',
    station: 'Yi Shen Tech',
    specialties: ['All Weapons — Scope', 'All Weapons — Higher Accuracy', 'All Weapons — Stowed Reloading'],
    unlockRequirement: 'Sell 25 stolen goods to a bartender',
    isOdyssey: true,
  },
  {
    id: 400230,
    name: 'Clio',
    system: 'Anotchi',
    station: "Clio's Camp",
    specialties: ['All Suits — Reduced Tool Battery Consumption', 'All Suits — Improved Scanner Range', 'All Suits — Increased Air Reserve'],
    unlockRequirement: 'Reach rank 3 with any Odyssey engineer',
    isOdyssey: true,
  },
] as const;

// ---------------------------------------------------------------------------
// Combined & Lookup
// ---------------------------------------------------------------------------

/** All engineers across both Horizons and Odyssey. */
export const ALL_ENGINEERS: readonly EngineerData[] = [
  ...HORIZONS_ENGINEERS,
  ...ODYSSEY_ENGINEERS,
] as const;

/** Map from engineer numeric ID to EngineerData. */
export const ENGINEER_BY_ID: ReadonlyMap<number, EngineerData> = new Map(
  ALL_ENGINEERS.map((e) => [e.id, e]),
);

/** Map from engineer name (lowercase) to EngineerData. */
export const ENGINEER_BY_NAME: ReadonlyMap<string, EngineerData> = new Map(
  ALL_ENGINEERS.map((e) => [e.name.toLowerCase(), e]),
);

/**
 * Get engineer data by numeric ID.
 * Returns undefined if the ID is not recognized.
 */
export function getEngineerById(id: number): EngineerData | undefined {
  return ENGINEER_BY_ID.get(id);
}

/**
 * Get engineer data by name (case-insensitive).
 * Returns undefined if no match is found.
 */
export function getEngineerByName(name: string): EngineerData | undefined {
  return ENGINEER_BY_NAME.get(name.toLowerCase());
}

/**
 * Get all engineers that can modify a given module type / specialty.
 */
export function getEngineersForSpecialty(specialty: string): readonly EngineerData[] {
  const lower = specialty.toLowerCase();
  return ALL_ENGINEERS.filter((e) =>
    e.specialties.some((s) => s.toLowerCase().includes(lower)),
  );
}

/**
 * Get the referral chain leading to a specific engineer.
 * Returns an ordered array from the first engineer to the target.
 */
export function getReferralChain(engineerName: string): readonly EngineerData[] {
  const chain: EngineerData[] = [];
  let current = getEngineerByName(engineerName);

  while (current) {
    chain.unshift(current);
    if (current.referralChain) {
      current = getEngineerByName(current.referralChain);
    } else {
      current = undefined;
    }
  }

  return chain;
}
