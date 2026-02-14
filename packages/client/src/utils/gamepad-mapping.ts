/**
 * @vayu/client -- Gamepad-to-Elite Button Mapping
 *
 * Translation layer between the browser Gamepad API indices and Elite
 * Dangerous's internal key names (Joy_N, Joy_XAxis, Joy_POV1Up, etc.).
 *
 * Handles:
 *   - Button index -> Joy_N mapping (1-indexed in Elite)
 *   - Axis index -> Joy_XAxis/YAxis/ZAxis/RZAxis mapping
 *   - POV hat directions (reported as buttons by most drivers)
 *   - Device ID string matching to Elite's device identifiers
 *   - Half-axis names (Pos_Joy_ZAxis / Neg_Joy_ZAxis)
 *   - Reverse lookups for highlighting
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GamepadInput {
  /** Type of input detected. */
  type: 'button' | 'axis';
  /** Raw Gamepad API index. */
  index: number;
  /** Elite Dangerous key name (e.g. "Joy_1", "Joy_XAxis"). */
  eliteKey: string;
  /** Current value (0/1 for buttons, -1..1 for axes). */
  value: number;
  /** The matched Elite device identifier. */
  device: string;
  /** Human-readable label for the input. */
  label: string;
}

export interface DeviceMapping {
  /** Regex to match against `gamepad.id`. */
  pattern: RegExp;
  /** Elite Dangerous device identifier. */
  eliteDevice: string;
  /** Human-readable device label. */
  label: string;
  /** Axis index -> Elite axis name overrides. */
  axisMap?: Record<number, string>;
}

// ---------------------------------------------------------------------------
// Device matching patterns
// ---------------------------------------------------------------------------

const DEVICE_MAPPINGS: DeviceMapping[] = [
  {
    pattern: /Warthog.*Throttle|044F:0404/i,
    eliteDevice: 'ThrustMasterWarthogThrottle',
    label: 'TM Warthog Throttle',
    axisMap: {
      0: 'Joy_XAxis',   // Slew X
      1: 'Joy_YAxis',   // Slew Y
      2: 'Joy_ZAxis',   // Left throttle
      3: 'Joy_RXAxis',  // Right throttle (if split)
    },
  },
  {
    pattern: /VKB|Gladiator|231D/i,
    eliteDevice: 'GamePad',
    label: 'VKB Gladiator NXT',
    axisMap: {
      0: 'Joy_XAxis',   // Roll
      1: 'Joy_YAxis',   // Pitch
      2: 'Joy_RZAxis',  // Yaw / Twist
      3: 'Joy_ZAxis',   // Throttle lever (if present)
    },
  },
  {
    pattern: /T\.?16000M|044F:B10A/i,
    eliteDevice: 'T16000M',
    label: 'T.16000M',
  },
  {
    pattern: /T\.?Flight|HOTAS.*X|044F:B108/i,
    eliteDevice: 'T_Flight',
    label: 'T.Flight HOTAS',
  },
  {
    pattern: /Logitech.*Extreme.*3D|046D:C215/i,
    eliteDevice: 'LogitechExtreme3DPro',
    label: 'Logitech Extreme 3D Pro',
  },
  {
    pattern: /Saitek.*X52.*Pro|06A3:0762/i,
    eliteDevice: 'SaitekX52Pro',
    label: 'Saitek X52 Pro',
  },
  {
    pattern: /Saitek.*X52|06A3:0255/i,
    eliteDevice: 'SaitekX52',
    label: 'Saitek X52',
  },
  {
    pattern: /Saitek.*X55|06A3:0763/i,
    eliteDevice: 'SaitekX55Rhino',
    label: 'Saitek X55 Rhino',
  },
  {
    pattern: /Saitek.*X56|06A3:0764/i,
    eliteDevice: 'SaitekX56Rhino',
    label: 'Saitek X56 Rhino',
  },
  {
    pattern: /Virpil/i,
    eliteDevice: 'VirpilControls',
    label: 'Virpil Controls',
  },
  {
    pattern: /CH.*Fighter/i,
    eliteDevice: 'CH_Fighterstick',
    label: 'CH Fighterstick',
  },
];

/** Fallback mapping for unrecognised devices. */
const FALLBACK_DEVICE: DeviceMapping = {
  pattern: /.*/,
  eliteDevice: 'GamePad',
  label: 'Unknown Joystick',
};

// ---------------------------------------------------------------------------
// Default axis name map (index -> Elite axis name)
// ---------------------------------------------------------------------------

const DEFAULT_AXIS_MAP: Record<number, string> = {
  0: 'Joy_XAxis',
  1: 'Joy_YAxis',
  2: 'Joy_ZAxis',
  3: 'Joy_RZAxis',
  4: 'Joy_RXAxis',
  5: 'Joy_RYAxis',
  6: 'Joy_UAxis',
  7: 'Joy_VAxis',
};

// ---------------------------------------------------------------------------
// POV hat button index ranges
// Warthog reports POV hats as buttons starting at index 32.
// Standard HID: POV buttons usually come after regular buttons.
// We detect POV by checking if the button index corresponds to known patterns.
// ---------------------------------------------------------------------------

/**
 * POV direction names used by Elite for each hat quadrant.
 * Order: Up, Right, Down, Left (matches standard HID POV reporting).
 */
const POV_DIRECTIONS = ['Up', 'Right', 'Down', 'Left'] as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Match a browser Gamepad's `id` string to an Elite Dangerous device mapping.
 */
export function matchDevice(gamepadId: string): DeviceMapping {
  for (const mapping of DEVICE_MAPPINGS) {
    if (mapping.pattern.test(gamepadId)) {
      return mapping;
    }
  }
  return { ...FALLBACK_DEVICE, label: gamepadId.slice(0, 40) };
}

/**
 * Convert a Gamepad API button index to an Elite key name.
 *
 * @param index  The `gamepad.buttons` array index.
 * @returns      Elite key name like `"Joy_1"`, `"Joy_POV1Up"`, etc.
 */
export function buttonIndexToEliteKey(index: number): string {
  // POV hats on Warthog/VKB: buttons 32+ are POV buttons
  // Each hat has 4 directions, so hat N starts at 32 + (N-1)*4
  if (index >= 32) {
    const povOffset = index - 32;
    const hatNumber = Math.floor(povOffset / 4) + 1;
    const direction = POV_DIRECTIONS[povOffset % 4];
    return `Joy_POV${hatNumber}${direction}`;
  }

  // Standard buttons are 1-indexed in Elite
  return `Joy_${index + 1}`;
}

/**
 * Convert a Gamepad API axis index to an Elite axis name using the
 * device-specific mapping or defaults.
 *
 * @param index    The `gamepad.axes` array index.
 * @param mapping  The matched device mapping (for axis overrides).
 * @returns        Elite axis name like `"Joy_XAxis"`.
 */
export function axisIndexToEliteKey(index: number, mapping?: DeviceMapping): string {
  const axisMap = mapping?.axisMap ?? DEFAULT_AXIS_MAP;
  return axisMap[index] ?? `Joy_Axis${index}`;
}

/**
 * Get the half-axis Elite key for a given axis when the value is positive
 * or negative. Elite uses `Pos_Joy_ZAxis` / `Neg_Joy_ZAxis` for throttle
 * halves and split-axis bindings.
 *
 * @param axisKey   The full axis key (e.g. `"Joy_ZAxis"`).
 * @param positive  Whether this is the positive half.
 */
export function halfAxisKey(axisKey: string, positive: boolean): string {
  return positive ? `Pos_${axisKey}` : `Neg_${axisKey}`;
}

/**
 * Create a human-readable label for a button index.
 */
export function buttonLabel(index: number): string {
  if (index >= 32) {
    const povOffset = index - 32;
    const hatNumber = Math.floor(povOffset / 4) + 1;
    const dirLabels = ['\u2191', '\u2192', '\u2193', '\u2190']; // ↑ → ↓ ←
    const direction = dirLabels[povOffset % 4];
    return `POV${hatNumber} ${direction}`;
  }
  return `Button ${index + 1}`;
}

/**
 * Create a human-readable label for an axis index.
 */
export function axisLabel(index: number, mapping?: DeviceMapping): string {
  const key = axisIndexToEliteKey(index, mapping);
  return key
    .replace('Joy_', '')
    .replace('Axis', ' Axis');
}

// ---------------------------------------------------------------------------
// Reverse lookup: Elite key -> gamepad button/axis index
// ---------------------------------------------------------------------------

/**
 * Convert an Elite button key name back to a Gamepad API button index.
 * Returns -1 if the key does not match a button pattern.
 */
export function eliteKeyToButtonIndex(key: string): number {
  // POV hat buttons
  const povMatch = key.match(/^Joy_POV(\d+)(Up|Right|Down|Left)$/);
  if (povMatch) {
    const hatNumber = parseInt(povMatch[1], 10);
    const dirIndex = POV_DIRECTIONS.indexOf(povMatch[2] as typeof POV_DIRECTIONS[number]);
    if (dirIndex >= 0) {
      return 32 + (hatNumber - 1) * 4 + dirIndex;
    }
  }

  // Standard buttons: Joy_N -> index N-1
  const btnMatch = key.match(/^Joy_(\d+)$/);
  if (btnMatch) {
    return parseInt(btnMatch[1], 10) - 1;
  }

  return -1;
}

/**
 * Convert an Elite axis key name back to a Gamepad API axis index.
 * Returns -1 if the key does not match an axis pattern.
 *
 * @param key      The Elite axis key (e.g. `"Joy_XAxis"`, `"Pos_Joy_ZAxis"`).
 * @param mapping  The device mapping to use for reverse lookup.
 */
export function eliteKeyToAxisIndex(key: string, mapping?: DeviceMapping): number {
  // Strip Pos_/Neg_ prefix for half-axes
  const stripped = key.replace(/^(Pos|Neg)_/, '');

  const axisMap = mapping?.axisMap ?? DEFAULT_AXIS_MAP;
  for (const [indexStr, axisName] of Object.entries(axisMap)) {
    if (axisName === stripped) {
      return parseInt(indexStr, 10);
    }
  }
  return -1;
}

/**
 * Check if an Elite key name represents a button (vs axis).
 */
export function isButtonKey(key: string): boolean {
  return /^Joy_(\d+|POV\d+(Up|Right|Down|Left))$/.test(key);
}

/**
 * Check if an Elite key name represents an axis (including half-axes).
 */
export function isAxisKey(key: string): boolean {
  return /^(Pos_|Neg_)?Joy_\w*Axis\w*$/.test(key);
}
