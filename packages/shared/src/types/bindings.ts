/**
 * @vayu/shared — Key Binding Types
 *
 * Types for Elite Dangerous custom key bindings as parsed from
 * the .binds XML files in %LOCALAPPDATA%\Frontier Developments\Elite Dangerous\Options\Bindings\.
 */

// ---------------------------------------------------------------------------
// Device Types
// ---------------------------------------------------------------------------

/** Input device types. */
export enum DeviceType {
  Keyboard = 'Keyboard',
  Mouse = 'Mouse',
  Gamepad = 'Gamepad',
  Joystick = 'Joystick',
  HOTAS = 'HOTAS',
  Unknown = 'Unknown',
}

// ---------------------------------------------------------------------------
// Binding Categories
// ---------------------------------------------------------------------------

/** Logical grouping of bindings. */
export type BindingCategory =
  | 'flight_rotation'
  | 'flight_thrust'
  | 'flight_throttle'
  | 'flight_miscellaneous'
  | 'targeting'
  | 'weapons'
  | 'cooling'
  | 'miscellaneous'
  | 'mode_switches'
  | 'headlook'
  | 'galaxy_map'
  | 'system_map'
  | 'camera_suite'
  | 'interface'
  | 'driving'
  | 'driving_targeting'
  | 'driving_throttle'
  | 'driving_miscellaneous'
  | 'multi_crew'
  | 'fighter_orders'
  | 'store'
  | 'holo_me'
  | 'on_foot'
  | 'on_foot_combat'
  | 'on_foot_social'
  | 'on_foot_inventory'
  | 'fss_mode'
  | 'saa_mode'
  | string;

// ---------------------------------------------------------------------------
// Key Binding
// ---------------------------------------------------------------------------

/** A modifier key required alongside the primary key. */
export interface BindingModifier {
  /** Device identifier. */
  device: string;
  /** Key/button identifier. */
  key: string;
}

/** A single key/button binding. */
export interface KeyBinding {
  /** Device identifier (e.g. "Keyboard", "231D2328" for specific device). */
  device: string;
  /** Device type classification. */
  deviceType: DeviceType;
  /** Key or button identifier (e.g. "Key_W", "Joy_1"). */
  key: string;
  /** Modifier keys that must be held. */
  modifiers: BindingModifier[];
}

/** An axis binding (for analog controls). */
export interface AxisBinding {
  /** Device identifier. */
  device: string;
  /** Device type classification. */
  deviceType: DeviceType;
  /** Axis identifier (e.g. "Joy_XAxis", "Joy_RZAxis"). */
  axis: string;
  /** Whether the axis is inverted. */
  inverted: boolean;
  /** Dead zone (0.0-1.0). */
  deadzone: number;
}

// ---------------------------------------------------------------------------
// Binding Entry
// ---------------------------------------------------------------------------

/** A complete binding entry for a single game action. */
export interface BindingEntry {
  /** Internal action name (e.g. "YawLeftButton", "FireGroup"). */
  action: string;
  /** Which category this action belongs to. */
  category: BindingCategory;
  /** Primary key binding (null if unbound). */
  primary: KeyBinding | null;
  /** Secondary key binding (null if unbound). */
  secondary: KeyBinding | null;
  /** Axis binding for analog controls (null for digital-only actions). */
  axis: AxisBinding | null;
}

// ---------------------------------------------------------------------------
// Binding Set (full profile)
// ---------------------------------------------------------------------------

/** A complete binding profile loaded from a .binds file. */
export interface BindingSet {
  /** Profile name / preset name. */
  name: string;
  /** File path the profile was loaded from. */
  filePath: string;
  /** Major version of the bindings format. */
  majorVersion: string;
  /** Minor version of the bindings format. */
  minorVersion: string;
  /** All bindings keyed by action name. */
  bindings: Record<string, BindingEntry>;
  /** Mouse X-axis deadzone. */
  mouseXDeadzone: number;
  /** Mouse Y-axis deadzone. */
  mouseYDeadzone: number;
  /** Mouse decay rate. */
  mouseDecayRate: number;
}

/** Summary of bindings for a specific category. */
export interface BindingCategorySummary {
  /** Category identifier. */
  category: BindingCategory;
  /** Human-readable category label. */
  label: string;
  /** Number of actions in this category. */
  totalActions: number;
  /** Number of actions that have at least one binding. */
  boundActions: number;
  /** Number of unbound actions. */
  unboundActions: number;
}
