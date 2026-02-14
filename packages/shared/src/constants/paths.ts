/**
 * @vayu/shared — Default File Paths
 *
 * Default filesystem paths for Elite Dangerous journal files, configuration,
 * and companion data. These are Windows paths since ED is a Windows game.
 *
 * No Node.js `path` module is used — this file is shared between server and
 * client, so we use simple string concatenation with backslash separators.
 */

// ---------------------------------------------------------------------------
// Path helpers (no Node.js path dependency)
// ---------------------------------------------------------------------------

/**
 * Join path segments using Windows backslash separator.
 * Strips trailing backslashes from the base before joining.
 */
function winJoin(base: string, ...segments: string[]): string {
  let result = base.replace(/\\+$/, '');
  for (const seg of segments) {
    result += '\\' + seg.replace(/^\\+/, '');
  }
  return result;
}

// ---------------------------------------------------------------------------
// Default paths (for commander "neela")
// ---------------------------------------------------------------------------

/** Base journal directory where ED writes .journal files, Status.json, etc. */
export const DEFAULT_JOURNAL_DIR =
  'C:\\Users\\neela\\Saved Games\\Frontier Developments\\Elite Dangerous';

/** Path to the custom key bindings file. */
export const DEFAULT_BINDINGS_FILE =
  'C:\\Users\\neela\\AppData\\Local\\Frontier Developments\\Elite Dangerous\\Options\\Bindings\\NEELAYODYSSEY.4.1.binds';

/** Path to the graphics configuration override XML. */
export const DEFAULT_GRAPHICS_OVERRIDE =
  'C:\\Users\\neela\\AppData\\Local\\Frontier Developments\\Elite Dangerous\\Options\\Graphics\\GraphicsConfigurationOverride.xml';

/** Directory where ED saves screenshots. */
export const DEFAULT_SCREENSHOTS_DIR =
  'C:\\Users\\neela\\Pictures\\Frontier Developments\\Elite Dangerous';

// ---------------------------------------------------------------------------
// Companion file resolvers
// ---------------------------------------------------------------------------

/**
 * Paths to companion JSON files that ED writes alongside journal files.
 * Each function accepts the journal directory and returns the full path.
 */
export const COMPANION_FILES = {
  /** Status.json — real-time ship/player flags, updated every ~1s. */
  status: (journalDir: string) => winJoin(journalDir, 'Status.json'),

  /** Cargo.json — current cargo manifest, written on Cargo event. */
  cargo: (journalDir: string) => winJoin(journalDir, 'Cargo.json'),

  /** Market.json — station market data, written on Market event. */
  market: (journalDir: string) => winJoin(journalDir, 'Market.json'),

  /** NavRoute.json — current plotted route, written on NavRoute event. */
  navRoute: (journalDir: string) => winJoin(journalDir, 'NavRoute.json'),

  /** Backpack.json — on-foot inventory (Odyssey), written on Backpack event. */
  backpack: (journalDir: string) => winJoin(journalDir, 'Backpack.json'),

  /** ModulesInfo.json — currently fitted modules, written on Loadout event. */
  modulesInfo: (journalDir: string) => winJoin(journalDir, 'ModulesInfo.json'),

  /** Shipyard.json — available ships at station, written on Shipyard event. */
  shipyard: (journalDir: string) => winJoin(journalDir, 'Shipyard.json'),

  /** Outfitting.json — available modules at station, written on Outfitting event. */
  outfitting: (journalDir: string) => winJoin(journalDir, 'Outfitting.json'),

  /** ShipLocker.json — on-foot stored materials (Odyssey). */
  shipLocker: (journalDir: string) => winJoin(journalDir, 'ShipLocker.json'),

  /** FCMaterials.json — fleet carrier commodity data. */
  fcMaterials: (journalDir: string) => winJoin(journalDir, 'FCMaterials.json'),
} as const;

// ---------------------------------------------------------------------------
// Consolidated DEFAULT_PATHS export
// ---------------------------------------------------------------------------

/**
 * All default paths in a single object for easy destructuring.
 * Companion file functions use the journalDir as their base.
 */
export const DEFAULT_PATHS = {
  journalDir: DEFAULT_JOURNAL_DIR,
  bindingsFile: DEFAULT_BINDINGS_FILE,
  graphicsOverride: DEFAULT_GRAPHICS_OVERRIDE,
  screenshotsDir: DEFAULT_SCREENSHOTS_DIR,
  statusFile: (journalDir: string) => winJoin(journalDir, 'Status.json'),
  cargoFile: (journalDir: string) => winJoin(journalDir, 'Cargo.json'),
  marketFile: (journalDir: string) => winJoin(journalDir, 'Market.json'),
  navRouteFile: (journalDir: string) => winJoin(journalDir, 'NavRoute.json'),
  backpackFile: (journalDir: string) => winJoin(journalDir, 'Backpack.json'),
  modulesInfoFile: (journalDir: string) => winJoin(journalDir, 'ModulesInfo.json'),
  shipyardFile: (journalDir: string) => winJoin(journalDir, 'Shipyard.json'),
  outfittingFile: (journalDir: string) => winJoin(journalDir, 'Outfitting.json'),
} as const;
