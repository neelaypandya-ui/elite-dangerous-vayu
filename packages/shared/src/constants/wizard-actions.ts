/**
 * @vayu/shared — Binding Wizard Action Phases
 *
 * Curated list of ~80 important Elite Dangerous actions organized into 8 phases
 * for the guided binding setup wizard. Each action includes a human-readable
 * label, binding slot type, and in-game description.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WizardSlotType = 'primary' | 'axis';

export interface WizardAction {
  /** Elite Dangerous action identifier (must match .binds file). */
  action: string;
  /** Human-readable label shown in the wizard. */
  label: string;
  /** Which binding slot to configure. */
  slot: WizardSlotType;
  /** Plain-English description of what this action does in-game. */
  description: string;
}

export interface WizardPhase {
  /** Phase title. */
  title: string;
  /** Short description of this phase's purpose. */
  description: string;
  /** Ordered list of actions in this phase. */
  actions: WizardAction[];
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

const PHASE_1_SHIP_MOVEMENT: WizardPhase = {
  title: 'Ship Movement',
  description: 'Pitch, yaw, roll axes and thrust controls for flying your ship.',
  actions: [
    { action: 'YawAxisRaw', label: 'Yaw Axis', slot: 'axis', description: 'Turns ship left/right (twist axis).' },
    { action: 'RollAxisRaw', label: 'Roll Axis', slot: 'axis', description: 'Rolls ship CW/CCW (joystick X).' },
    { action: 'PitchAxisRaw', label: 'Pitch Axis', slot: 'axis', description: 'Tilts nose up/down (joystick Y).' },
    { action: 'YawLeftButton', label: 'Yaw Left', slot: 'primary', description: 'Digital yaw left fallback.' },
    { action: 'YawRightButton', label: 'Yaw Right', slot: 'primary', description: 'Digital yaw right fallback.' },
    { action: 'RollLeftButton', label: 'Roll Left', slot: 'primary', description: 'Digital roll left fallback.' },
    { action: 'RollRightButton', label: 'Roll Right', slot: 'primary', description: 'Digital roll right fallback.' },
    { action: 'PitchUpButton', label: 'Pitch Up', slot: 'primary', description: 'Digital pitch up fallback.' },
    { action: 'PitchDownButton', label: 'Pitch Down', slot: 'primary', description: 'Digital pitch down fallback.' },
    { action: 'LeftThrustButton', label: 'Thrust Left', slot: 'primary', description: 'Strafe left (docking/combat).' },
    { action: 'RightThrustButton', label: 'Thrust Right', slot: 'primary', description: 'Strafe right.' },
    { action: 'UpThrustButton', label: 'Thrust Up', slot: 'primary', description: 'Push upward (docking).' },
    { action: 'DownThrustButton', label: 'Thrust Down', slot: 'primary', description: 'Push downward.' },
    { action: 'ForwardThrustButton', label: 'Thrust Forward', slot: 'primary', description: 'Burst of forward thrust.' },
  ],
};

const PHASE_2_THROTTLE_SPEED: WizardPhase = {
  title: 'Throttle & Speed',
  description: 'Throttle axis, speed presets, boost, and FSD controls.',
  actions: [
    { action: 'ThrottleAxis', label: 'Throttle Axis', slot: 'axis', description: 'Main throttle lever.' },
    { action: 'SetSpeedZero', label: 'Full Stop', slot: 'primary', description: 'Emergency brake.' },
    { action: 'SetSpeed50', label: '50% Speed', slot: 'primary', description: 'Sweet spot for supercruise approaches.' },
    { action: 'SetSpeed100', label: '100% Speed', slot: 'primary', description: 'Full forward.' },
    { action: 'UseBoostJuice', label: 'Boost', slot: 'primary', description: 'Engine boost burst.' },
    { action: 'ToggleReverseThrottleInput', label: 'Toggle Reverse', slot: 'primary', description: 'Forward/reverse toggle.' },
    { action: 'HyperSuperCombination', label: 'Supercruise/Hyperspace', slot: 'primary', description: 'Multi-purpose FSD key.' },
    { action: 'Supercruise', label: 'Supercruise Only', slot: 'primary', description: 'Supercruise without hyperspace.' },
  ],
};

const PHASE_3_COMBAT: WizardPhase = {
  title: 'Combat',
  description: 'Fire, hardpoints, fire groups, targeting, and countermeasures.',
  actions: [
    { action: 'PrimaryFire', label: 'Primary Fire', slot: 'primary', description: 'Main trigger.' },
    { action: 'SecondaryFire', label: 'Secondary Fire', slot: 'primary', description: 'Secondary fire group slot.' },
    { action: 'DeployHardpointToggle', label: 'Deploy Hardpoints', slot: 'primary', description: 'Extend/retract weapons.' },
    { action: 'CycleFireGroupNext', label: 'Next Fire Group', slot: 'primary', description: 'Cycle fire groups forward.' },
    { action: 'CycleFireGroupPrevious', label: 'Previous Fire Group', slot: 'primary', description: 'Cycle fire groups back.' },
    { action: 'SelectTarget', label: 'Target Ahead', slot: 'primary', description: 'Lock target in crosshairs.' },
    { action: 'CycleNextTarget', label: 'Next Target', slot: 'primary', description: 'Cycle all contacts.' },
    { action: 'CycleNextHostileTarget', label: 'Next Hostile', slot: 'primary', description: 'Cycle hostile contacts only.' },
    { action: 'SelectHighestThreat', label: 'Highest Threat', slot: 'primary', description: 'Target most dangerous enemy.' },
    { action: 'DeployHeatSink', label: 'Heat Sink', slot: 'primary', description: 'Rapid cooling.' },
    { action: 'UseShieldCell', label: 'Shield Cell Bank', slot: 'primary', description: 'Emergency shield recharge.' },
    { action: 'FireChaffLauncher', label: 'Chaff', slot: 'primary', description: 'Break gimbal tracking.' },
  ],
};

const PHASE_4_SHIP_SYSTEMS: WizardPhase = {
  title: 'Ship Systems',
  description: 'Power pips, flight assist, landing gear, cargo scoop, and lights.',
  actions: [
    { action: 'IncreaseEnginesPower', label: 'Pips to Engines', slot: 'primary', description: 'Faster speed + boost recharge.' },
    { action: 'IncreaseWeaponsPower', label: 'Pips to Weapons', slot: 'primary', description: 'Faster weapon capacitor recharge.' },
    { action: 'IncreaseSystemsPower', label: 'Pips to Systems', slot: 'primary', description: 'Stronger shields.' },
    { action: 'ResetPowerDistribution', label: 'Reset Power', slot: 'primary', description: 'Even 2-2-2 split.' },
    { action: 'ToggleFlightAssist', label: 'Flight Assist', slot: 'primary', description: 'Toggle FA on/off.' },
    { action: 'LandingGearToggle', label: 'Landing Gear', slot: 'primary', description: 'Extend/retract gear.' },
    { action: 'ToggleCargoScoop', label: 'Cargo Scoop', slot: 'primary', description: 'Open/close scoop.' },
    { action: 'ShipSpotLightToggle', label: 'Ship Lights', slot: 'primary', description: 'Toggle headlights.' },
    { action: 'NightVisionToggle', label: 'Night Vision', slot: 'primary', description: 'Amplified light mode.' },
    { action: 'OrbitLinesToggle', label: 'Orbit Lines', slot: 'primary', description: 'Toggle orbital line display.' },
  ],
};

const PHASE_5_PANELS_UI: WizardPhase = {
  title: 'Panels & UI',
  description: 'Cockpit panels, maps, HUD mode, and UI navigation.',
  actions: [
    { action: 'FocusLeftPanel', label: 'Navigation Panel', slot: 'primary', description: 'Left panel (nav/contacts).' },
    { action: 'FocusRightPanel', label: 'Ship Panel', slot: 'primary', description: 'Right panel (modules/cargo).' },
    { action: 'FocusCommsPanel', label: 'Comms Panel', slot: 'primary', description: 'Top-left chat/inbox.' },
    { action: 'FocusRadarPanel', label: 'Role Panel', slot: 'primary', description: 'Bottom panel (fighters/SRV).' },
    { action: 'GalaxyMapOpen', label: 'Galaxy Map', slot: 'primary', description: 'Plot routes between systems.' },
    { action: 'SystemMapOpen', label: 'System Map', slot: 'primary', description: 'View system bodies/stations.' },
    { action: 'PlayerHUDModeToggle', label: 'HUD Mode', slot: 'primary', description: 'Combat / Analysis toggle.' },
    { action: 'UI_Up', label: 'UI Up', slot: 'primary', description: 'Menu cursor up.' },
    { action: 'UI_Down', label: 'UI Down', slot: 'primary', description: 'Menu cursor down.' },
    { action: 'UI_Select', label: 'UI Select', slot: 'primary', description: 'Confirm selection.' },
  ],
};

const PHASE_6_EXPLORATION: WizardPhase = {
  title: 'Exploration',
  description: 'Full Spectrum Scanner and Detailed Surface Scanner controls.',
  actions: [
    { action: 'ExplorationFSSEnter', label: 'Enter FSS', slot: 'primary', description: 'Open Full Spectrum Scanner.' },
    { action: 'ExplorationFSSCameraPitchIncreaseButton', label: 'FSS Pitch Up', slot: 'primary', description: 'Move scanner view up.' },
    { action: 'ExplorationFSSCameraPitchDecreaseButton', label: 'FSS Pitch Down', slot: 'primary', description: 'Move scanner view down.' },
    { action: 'ExplorationFSSCameraYawIncreaseButton', label: 'FSS Yaw Right', slot: 'primary', description: 'Move scanner view right.' },
    { action: 'ExplorationFSSCameraYawDecreaseButton', label: 'FSS Yaw Left', slot: 'primary', description: 'Move scanner view left.' },
    { action: 'ExplorationFSSZoomIn', label: 'FSS Zoom In', slot: 'primary', description: 'Zoom to identify signal.' },
    { action: 'ExplorationFSSZoomOut', label: 'FSS Zoom Out', slot: 'primary', description: 'Zoom out to wider spectrum.' },
    { action: 'ExplorationSAAExitThirdPerson', label: 'Exit DSS', slot: 'primary', description: 'Exit surface scanner.' },
  ],
};

const PHASE_7_SRV: WizardPhase = {
  title: 'SRV Driving',
  description: 'Steering, throttle, turret, and ship recall for the SRV.',
  actions: [
    { action: 'SteeringAxis', label: 'Steering', slot: 'axis', description: 'SRV left/right steering.' },
    { action: 'BuggyThrottleAxis', label: 'SRV Throttle', slot: 'axis', description: 'SRV speed control.' },
    { action: 'BuggyPrimaryFireButton', label: 'SRV Fire', slot: 'primary', description: 'Turret weapon fire.' },
    { action: 'BuggyTurretYawAxis', label: 'Turret Yaw', slot: 'axis', description: 'Aim turret left/right.' },
    { action: 'BuggyTurretPitchAxis', label: 'Turret Pitch', slot: 'axis', description: 'Aim turret up/down.' },
    { action: 'ToggleBuggyTurretButton', label: 'Toggle Turret', slot: 'primary', description: 'Drive mode / turret mode.' },
    { action: 'RecallDismissShip', label: 'Recall/Dismiss Ship', slot: 'primary', description: 'Call or send away your ship.' },
    { action: 'HeadlightsBuggyButton', label: 'SRV Lights', slot: 'primary', description: 'Toggle SRV headlights.' },
  ],
};

const PHASE_8_ON_FOOT: WizardPhase = {
  title: 'On Foot — Odyssey',
  description: 'First-person movement, weapons, and tools for Odyssey.',
  actions: [
    { action: 'HumanoidForwardButton', label: 'Walk Forward', slot: 'primary', description: 'Move forward.' },
    { action: 'HumanoidBackwardButton', label: 'Walk Backward', slot: 'primary', description: 'Move backward.' },
    { action: 'HumanoidStrafeLeftButton', label: 'Strafe Left', slot: 'primary', description: 'Sidestep left.' },
    { action: 'HumanoidStrafeRightButton', label: 'Strafe Right', slot: 'primary', description: 'Sidestep right.' },
    { action: 'HumanoidSprintButton', label: 'Sprint', slot: 'primary', description: 'Run faster.' },
    { action: 'HumanoidJumpButton', label: 'Jump', slot: 'primary', description: 'Jump (high in low gravity).' },
    { action: 'HumanoidCrouchButton', label: 'Crouch', slot: 'primary', description: 'Crouch for stealth.' },
    { action: 'HumanoidPrimaryFireButton', label: 'Fire Weapon', slot: 'primary', description: 'Shoot equipped weapon.' },
    { action: 'HumanoidReloadButton', label: 'Reload', slot: 'primary', description: 'Reload weapon.' },
    { action: 'HumanoidToggleFlashlightButton', label: 'Flashlight', slot: 'primary', description: 'Toggle suit light.' },
  ],
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** All wizard phases in order. */
export const WIZARD_PHASES: WizardPhase[] = [
  PHASE_1_SHIP_MOVEMENT,
  PHASE_2_THROTTLE_SPEED,
  PHASE_3_COMBAT,
  PHASE_4_SHIP_SYSTEMS,
  PHASE_5_PANELS_UI,
  PHASE_6_EXPLORATION,
  PHASE_7_SRV,
  PHASE_8_ON_FOOT,
];

/** Total number of actions across all phases. */
export const WIZARD_TOTAL_ACTIONS = WIZARD_PHASES.reduce(
  (sum, phase) => sum + phase.actions.length,
  0,
);
