/**
 * @vayu/server — Bindings XML Parser
 *
 * Parses Elite Dangerous `.binds` XML files into structured {@link BindingSet}
 * objects. Handles key bindings (Primary/Secondary with optional modifiers),
 * axis bindings (analog sticks/throttle), device classification, and
 * categorisation of every action into logical groups.
 *
 * The `.binds` file lives at:
 *   %LOCALAPPDATA%\Frontier Developments\Elite Dangerous\Options\Bindings\
 *
 * XML structure:
 * ```xml
 * <Root PresetName="..." MajorVersion="4" MinorVersion="1">
 *   <!-- Key binding -->
 *   <YawLeftButton>
 *     <Primary Device="Keyboard" Key="Key_A" />
 *     <Secondary Device="{NoDevice}" Key="" />
 *   </YawLeftButton>
 *
 *   <!-- Axis binding -->
 *   <YawAxisRaw>
 *     <Binding Device="GamePad" Key="Joy_RZAxis" />
 *     <Inverted Value="1" />
 *     <Deadzone Value="0.00000000" />
 *   </YawAxisRaw>
 *
 *   <!-- Key binding with modifier -->
 *   <UseBoostJuice>
 *     <Primary Device="ThrustMasterWarthogThrottle" Key="Neg_Joy_YAxis">
 *       <Modifier Device="ThrustMasterWarthogThrottle" Key="Neg_Joy_XAxis" />
 *     </Primary>
 *     <Secondary Device="{NoDevice}" Key="" />
 *   </UseBoostJuice>
 * </Root>
 * ```
 */

import { XMLParser } from 'fast-xml-parser';
import fs from 'fs/promises';
import type {
  BindingSet,
  BindingEntry,
  KeyBinding,
  AxisBinding,
  BindingCategory,
  BindingModifier,
} from '@vayu/shared';
import { DeviceType } from '@vayu/shared';

// ---------------------------------------------------------------------------
// Device name constants
// ---------------------------------------------------------------------------

/** The sentinel device name ED uses for unbound controls. */
const NO_DEVICE = '{NoDevice}';

/**
 * Map of raw device identifiers from the XML to human-readable labels.
 * Unknown devices are returned as-is.
 */
const DEVICE_LABELS: Record<string, string> = {
  Keyboard: 'Keyboard',
  Mouse: 'Mouse',
  GamePad: 'VKB Gladiator NXT',
  ThrustMasterWarthogThrottle: 'TM Warthog Throttle',
  vkb_gladiator: 'VKB Gladiator NXT',
  T16000M: 'T.16000M',
  T16000MFCS: 'T.16000M FCS',
  LogitechExtreme3DPro: 'Logitech Extreme 3D Pro',
  SaitekX52: 'Saitek X52',
  SaitekX52Pro: 'Saitek X52 Pro',
  SaitekX55Rhino: 'Saitek X55 Rhino',
  SaitekX56Rhino: 'Saitek X56 Rhino',
  T_Flight: 'T.Flight HOTAS',
  CH_Fighterstick: 'CH Fighterstick',
  VirpilControls: 'Virpil Controls',
  WinJoy: 'Windows Joystick',
};

// ---------------------------------------------------------------------------
// Action categorisation
// ---------------------------------------------------------------------------

/**
 * Maps action name prefixes/patterns to their logical category.
 * The order matters -- more specific prefixes must come first.
 * Matching is done top-to-bottom, first match wins.
 */
const CATEGORY_RULES: Array<{ pattern: RegExp; category: BindingCategory }> = [
  // On-foot (Odyssey Humanoid)
  { pattern: /^Humanoid(Primary|Secondary)?Fire/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidZoom/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidThrowGrenade/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidMelee/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidReload/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidToggleShields/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidSelect.*Weapon/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidHideWeapon/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidSwitchWeapon/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidSelect.*Grenade/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidHealthPack/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidBattery/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidSwitch(ToRecharge|ToComp|ToSuit)/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidToggleToolMode/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidToggleFlashlight/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidToggleNightVision/i, category: 'on_foot_combat' },
  { pattern: /^HumanoidClearAuthority/i, category: 'on_foot_combat' },

  { pattern: /^HumanoidEmote/i, category: 'on_foot_social' },
  { pattern: /^HumanoidPing/i, category: 'on_foot_social' },
  { pattern: /^HumanoidConflictContextual/i, category: 'on_foot_social' },
  { pattern: /^HumanoidOpenAccessPanel/i, category: 'on_foot_social' },
  { pattern: /^HumanoidToggleMissionHelp/i, category: 'on_foot_social' },

  { pattern: /^HumanoidItemWheel/i, category: 'on_foot_inventory' },
  { pattern: /^HumanoidEmoteWheel/i, category: 'on_foot_inventory' },
  { pattern: /^HumanoidUtilityWheel/i, category: 'on_foot_inventory' },

  { pattern: /^Humanoid/i, category: 'on_foot' },

  // FSS (Full Spectrum Scanner)
  { pattern: /^ExplorationFSS/i, category: 'fss_mode' },
  { pattern: /^FSS/i, category: 'fss_mode' },

  // SAA (Surface Area Analysis / DSS)
  { pattern: /^ExplorationSAA/i, category: 'saa_mode' },
  { pattern: /^SAA/i, category: 'saa_mode' },

  // SRV / Buggy driving
  { pattern: /^BuggyTurret/i, category: 'driving_targeting' },
  { pattern: /^SelectTarget_Buggy/i, category: 'driving_targeting' },
  { pattern: /^BuggyPrimaryFire/i, category: 'driving' },
  { pattern: /^BuggySecondaryFire/i, category: 'driving' },
  { pattern: /^BuggyCycleFireGroup/i, category: 'driving' },
  { pattern: /^ToggleBuggyTurret/i, category: 'driving' },
  { pattern: /^Buggy(Roll|Pitch)/i, category: 'driving' },
  { pattern: /^Steering/i, category: 'driving' },
  { pattern: /^SteerLeft|^SteerRight/i, category: 'driving' },
  { pattern: /^DriveSpeed/i, category: 'driving_throttle' },
  { pattern: /^BuggyThrottle/i, category: 'driving_throttle' },
  { pattern: /^BuggyToggleReverse/i, category: 'driving_throttle' },
  { pattern: /^IncreaseSpeedButton|^DecreaseSpeedButton/i, category: 'driving_throttle' },
  { pattern: /^AutoBreakBuggy/i, category: 'driving_miscellaneous' },
  { pattern: /^HeadlightsBuggy/i, category: 'driving_miscellaneous' },
  { pattern: /^ToggleDriveAssist/i, category: 'driving_miscellaneous' },
  { pattern: /^DriveAssistDefault/i, category: 'driving_miscellaneous' },
  { pattern: /^VerticalThrustersButton/i, category: 'driving_miscellaneous' },
  { pattern: /^RecallDismissShip/i, category: 'driving_miscellaneous' },
  { pattern: /^(ToggleCargoScoop|EjectAllCargo)_Buggy/i, category: 'driving_miscellaneous' },
  { pattern: /^(IncreaseEngines|IncreaseWeapons|IncreaseSystems|ResetPower).*_Buggy/i, category: 'driving_miscellaneous' },
  { pattern: /^(FocusLeft|FocusComms|FocusRadar|FocusRight|QuickComms).*_Buggy/i, category: 'driving_miscellaneous' },
  { pattern: /^(GalaxyMapOpen|SystemMapOpen|OpenCodex|PlayerHUDMode|HeadLookToggle|UIFocus)_Buggy/i, category: 'driving_miscellaneous' },
  { pattern: /^EnableMenuGroupsSRV/i, category: 'driving_miscellaneous' },
  { pattern: /^MouseBuggy/i, category: 'driving' },
  { pattern: /^MouseTurret/i, category: 'driving_targeting' },

  // Multi-crew
  { pattern: /^MultiCrew/i, category: 'multi_crew' },

  // Fighter orders
  { pattern: /^Order/i, category: 'fighter_orders' },
  { pattern: /^OpenOrders/i, category: 'fighter_orders' },

  // Camera suite
  { pattern: /^PhotoCamera/i, category: 'camera_suite' },
  { pattern: /^VanityCamera/i, category: 'camera_suite' },
  { pattern: /^ToggleFreeCam/i, category: 'camera_suite' },
  { pattern: /^FreeCam/i, category: 'camera_suite' },
  { pattern: /^MoveFreeCam/i, category: 'camera_suite' },
  { pattern: /^(Pitch|Yaw|Roll)Camera/i, category: 'camera_suite' },
  { pattern: /^FixCamera/i, category: 'camera_suite' },
  { pattern: /^QuitCamera/i, category: 'camera_suite' },
  { pattern: /^ToggleAdvanceMode/i, category: 'camera_suite' },
  { pattern: /^FStop/i, category: 'camera_suite' },
  { pattern: /^ToggleRotationLock/i, category: 'camera_suite' },

  // Galaxy map
  { pattern: /^CamPitch/i, category: 'galaxy_map' },
  { pattern: /^CamYaw/i, category: 'galaxy_map' },
  { pattern: /^CamTranslate/i, category: 'galaxy_map' },
  { pattern: /^CamZoom/i, category: 'galaxy_map' },
  { pattern: /^GalaxyMap/i, category: 'galaxy_map' },

  // System map
  { pattern: /^SystemMap/i, category: 'system_map' },

  // Store / Holo-Me
  { pattern: /^Store/i, category: 'store' },
  { pattern: /^CommanderCreator/i, category: 'holo_me' },

  // Galnet audio
  { pattern: /^GalnetAudio/i, category: 'miscellaneous' },

  // Headlook
  { pattern: /^HeadLook/i, category: 'headlook' },
  { pattern: /^Headlook/i, category: 'headlook' },
  { pattern: /^MouseHeadlook/i, category: 'headlook' },
  { pattern: /^MotionHeadlook/i, category: 'headlook' },
  { pattern: /^yawRotateHeadlook/i, category: 'headlook' },

  // Flight rotation
  { pattern: /^Yaw(AxisRaw|LeftButton|RightButton)$/i, category: 'flight_rotation' },
  { pattern: /^YawAxis$/i, category: 'flight_rotation' },
  { pattern: /^Roll(AxisRaw|LeftButton|RightButton)$/i, category: 'flight_rotation' },
  { pattern: /^Pitch(AxisRaw|UpButton|DownButton)$/i, category: 'flight_rotation' },
  { pattern: /^YawToRoll/i, category: 'flight_rotation' },

  // Flight rotation — landing overrides
  { pattern: /^YawAxis_Landing/i, category: 'flight_rotation' },
  { pattern: /^Yaw(Left|Right)Button_Landing/i, category: 'flight_rotation' },
  { pattern: /^PitchAxis_Landing/i, category: 'flight_rotation' },
  { pattern: /^Pitch(Up|Down)Button_Landing/i, category: 'flight_rotation' },
  { pattern: /^RollAxis_Landing/i, category: 'flight_rotation' },
  { pattern: /^Roll(Left|Right)Button_Landing/i, category: 'flight_rotation' },

  // Flight thrust
  { pattern: /^LateralThrust(Raw)?$/i, category: 'flight_thrust' },
  { pattern: /^(Left|Right)ThrustButton$/i, category: 'flight_thrust' },
  { pattern: /^VerticalThrust(Raw)?$/i, category: 'flight_thrust' },
  { pattern: /^(Up|Down)ThrustButton$/i, category: 'flight_thrust' },
  { pattern: /^AheadThrust$/i, category: 'flight_thrust' },
  { pattern: /^(Forward|Backward)ThrustButton$/i, category: 'flight_thrust' },
  // Landing overrides for thrust
  { pattern: /^LateralThrust_Landing/i, category: 'flight_thrust' },
  { pattern: /^(Left|Right)ThrustButton_Landing/i, category: 'flight_thrust' },
  { pattern: /^VerticalThrust_Landing/i, category: 'flight_thrust' },
  { pattern: /^(Up|Down)ThrustButton_Landing/i, category: 'flight_thrust' },
  { pattern: /^AheadThrust_Landing/i, category: 'flight_thrust' },
  { pattern: /^(Forward|Backward)ThrustButton_Landing/i, category: 'flight_thrust' },

  // Flight throttle
  { pattern: /^ThrottleAxis/i, category: 'flight_throttle' },
  { pattern: /^ThrottleRange/i, category: 'flight_throttle' },
  { pattern: /^ThrottleIncrement/i, category: 'flight_throttle' },
  { pattern: /^ToggleReverseThrottleInput$/i, category: 'flight_throttle' },
  { pattern: /^(Forward|Backward)Key$/i, category: 'flight_throttle' },
  { pattern: /^SetSpeed/i, category: 'flight_throttle' },

  // Alternate flight controls
  { pattern: /^UseAlternateFlightValues/i, category: 'flight_miscellaneous' },
  { pattern: /^(Yaw|Roll|Pitch|LateralThrust|VerticalThrust).*Alternate/i, category: 'flight_miscellaneous' },

  // Flight miscellaneous
  { pattern: /^ToggleFlightAssist/i, category: 'flight_miscellaneous' },
  { pattern: /^UseBoostJuice/i, category: 'flight_miscellaneous' },
  { pattern: /^HyperSuperCombination/i, category: 'flight_miscellaneous' },
  { pattern: /^Supercruise$/i, category: 'flight_miscellaneous' },
  { pattern: /^Hyperspace$/i, category: 'flight_miscellaneous' },
  { pattern: /^DisableRotationCorrect/i, category: 'flight_miscellaneous' },
  { pattern: /^OrbitLinesToggle/i, category: 'flight_miscellaneous' },
  { pattern: /^LandingGearToggle/i, category: 'flight_miscellaneous' },
  { pattern: /^ToggleCargoScoop$/i, category: 'flight_miscellaneous' },
  { pattern: /^EjectAllCargo$/i, category: 'flight_miscellaneous' },
  { pattern: /^ShipSpotLightToggle/i, category: 'flight_miscellaneous' },
  { pattern: /^NightVisionToggle/i, category: 'flight_miscellaneous' },
  { pattern: /^ExplorationFSSEnter/i, category: 'flight_miscellaneous' },

  // Targeting
  { pattern: /^SelectTarget$/i, category: 'targeting' },
  { pattern: /^CycleNext(Target|HostileTarget)$/i, category: 'targeting' },
  { pattern: /^CyclePrevious(Target|HostileTarget)$/i, category: 'targeting' },
  { pattern: /^SelectHighestThreat/i, category: 'targeting' },
  { pattern: /^TargetWingman/i, category: 'targeting' },
  { pattern: /^SelectTargetsTarget/i, category: 'targeting' },
  { pattern: /^WingNavLock/i, category: 'targeting' },
  { pattern: /^CycleNext(Subsystem)/i, category: 'targeting' },
  { pattern: /^CyclePrevious(Subsystem)/i, category: 'targeting' },
  { pattern: /^TargetNextRouteSystem/i, category: 'targeting' },

  // Weapons
  { pattern: /^PrimaryFire$/i, category: 'weapons' },
  { pattern: /^SecondaryFire$/i, category: 'weapons' },
  { pattern: /^CycleFireGroup/i, category: 'weapons' },
  { pattern: /^DeployHardpoint/i, category: 'weapons' },
  { pattern: /^DeployHardpointsOnFire/i, category: 'weapons' },

  // Cooling / defence
  { pattern: /^DeployHeatSink/i, category: 'cooling' },
  { pattern: /^UseShieldCell/i, category: 'cooling' },
  { pattern: /^FireChaffLauncher/i, category: 'cooling' },
  { pattern: /^ChargeECM/i, category: 'cooling' },
  { pattern: /^TriggerFieldNeutraliser/i, category: 'cooling' },

  // Power distribution
  { pattern: /^IncreaseEnginesPower$/i, category: 'miscellaneous' },
  { pattern: /^IncreaseWeaponsPower$/i, category: 'miscellaneous' },
  { pattern: /^IncreaseSystemsPower$/i, category: 'miscellaneous' },
  { pattern: /^ResetPowerDistribution$/i, category: 'miscellaneous' },

  // Mode switches
  { pattern: /^PlayerHUDModeToggle$/i, category: 'mode_switches' },
  { pattern: /^GalaxyMapOpen$/i, category: 'mode_switches' },
  { pattern: /^SystemMapOpen$/i, category: 'mode_switches' },
  { pattern: /^OpenCodexGoToDiscovery$/i, category: 'mode_switches' },
  { pattern: /^Pause$/i, category: 'mode_switches' },
  { pattern: /^FriendsMenu/i, category: 'mode_switches' },

  // Interface / UI navigation
  { pattern: /^UI_/i, category: 'interface' },
  { pattern: /^UIFocus$/i, category: 'interface' },
  { pattern: /^UIFocusMode/i, category: 'interface' },
  { pattern: /^FocusLeftPanel$/i, category: 'interface' },
  { pattern: /^FocusCommsPanel$/i, category: 'interface' },
  { pattern: /^FocusRadarPanel$/i, category: 'interface' },
  { pattern: /^FocusRightPanel$/i, category: 'interface' },
  { pattern: /^QuickCommsPanel$/i, category: 'interface' },
  { pattern: /^CycleNext(Panel|Page)$/i, category: 'interface' },
  { pattern: /^CyclePrevious(Panel|Page)$/i, category: 'interface' },
  { pattern: /^ToggleButtonUpInput/i, category: 'interface' },
  { pattern: /^ShowPGScoreSummary/i, category: 'interface' },
  { pattern: /^FocusOnTextEntry/i, category: 'interface' },
  { pattern: /^(Left|Comms|Role|Right)PanelFocusOptions/i, category: 'interface' },
  { pattern: /^EnableCameraLockOn/i, category: 'interface' },

  // Radar
  { pattern: /^RadarRangeAxis/i, category: 'miscellaneous' },
  { pattern: /^Radar(Increase|Decrease)Range/i, category: 'miscellaneous' },

  // HMD / misc
  { pattern: /^HMDReset/i, category: 'miscellaneous' },
  { pattern: /^MicrophoneMute/i, category: 'miscellaneous' },
  { pattern: /^MuteButtonMode/i, category: 'miscellaneous' },
  { pattern: /^CqcMuteButtonMode/i, category: 'miscellaneous' },
  { pattern: /^WeaponColourToggle/i, category: 'miscellaneous' },
  { pattern: /^EngineColourToggle/i, category: 'miscellaneous' },
  { pattern: /^EnableRumbleTrigger/i, category: 'miscellaneous' },
  { pattern: /^EnableMenuGroups$/i, category: 'miscellaneous' },
  { pattern: /^EnableMenuGroupsOnFoot/i, category: 'miscellaneous' },
  { pattern: /^EnableAimAssistOnFoot/i, category: 'miscellaneous' },

  // On-foot map/comms overrides
  { pattern: /^(GalaxyMapOpen|SystemMapOpen|FocusCommsPanel|QuickCommsPanel)_Humanoid/i, category: 'on_foot' },

  // Mouse settings (not actionable bindings, but present in XML)
  { pattern: /^Mouse[A-Z]/i, category: 'miscellaneous' },
  { pattern: /^KeyboardLayout/i, category: 'miscellaneous' },
];

// ---------------------------------------------------------------------------
// Helper: classify a device name string into a DeviceType enum
// ---------------------------------------------------------------------------

/**
 * Classify a raw device identifier string from the XML into a
 * {@link DeviceType} enum value.
 */
function classifyDevice(device: string): DeviceType {
  if (!device || device === NO_DEVICE) return DeviceType.Unknown;

  const lower = device.toLowerCase();
  if (lower === 'keyboard') return DeviceType.Keyboard;
  if (lower === 'mouse') return DeviceType.Mouse;

  // Known HOTAS throttles
  if (lower.includes('throttle') || lower.includes('hotas')) return DeviceType.HOTAS;

  // Known joystick identifiers
  if (
    lower.includes('gamepad') ||
    lower.includes('joystick') ||
    lower.includes('vkb') ||
    lower.includes('virpil') ||
    lower.includes('gladiator') ||
    lower.includes('winjoy')
  ) {
    return DeviceType.Joystick;
  }

  // Saitek / Logitech / CH / T.16000M are joysticks
  if (
    lower.includes('saitek') ||
    lower.includes('logitech') ||
    lower.includes('ch_') ||
    lower.includes('t16000')
  ) {
    return DeviceType.Joystick;
  }

  // Anything with "thrustmaster" that is not a throttle is joystick
  if (lower.includes('thrustmaster') || lower.includes('t_flight')) {
    return DeviceType.Joystick;
  }

  // Fallback: if key contains "Joy_" it is a gamepad/joystick-type device
  return DeviceType.Unknown;
}

/**
 * Determine the {@link BindingCategory} for a given action name.
 * Falls back to `'miscellaneous'` when no rule matches.
 */
function categoriseAction(action: string): BindingCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(action)) {
      return rule.category;
    }
  }
  return 'miscellaneous';
}

/**
 * Returns a human-readable label for a device identifier.
 */
function getDeviceLabel(device: string): string {
  if (!device || device === NO_DEVICE) return '';
  return DEVICE_LABELS[device] ?? device;
}

// ---------------------------------------------------------------------------
// Elements in the XML that are NOT bindings (just scalar config values)
// ---------------------------------------------------------------------------

/**
 * Set of XML element names that are scalar configuration values
 * (not key/axis bindings). These have a simple `Value` attribute and no
 * children, or are text-only like `<KeyboardLayout>`.
 */
const SCALAR_CONFIG_ELEMENTS = new Set([
  'KeyboardLayout',
  'MouseXMode', 'MouseXDecay', 'MouseYMode', 'MouseYDecay',
  'MouseSensitivity', 'MouseDecayRate', 'MouseDeadzone', 'MouseLinearity',
  'MouseGUI',
  'YawToRollMode', 'YawToRollSensitivity', 'YawToRollMode_FAOff',
  'YawToRollMode_Landing',
  'ThrottleRange', 'ThrottleIncrement',
  'DeployHardpointsOnFire',
  'MuteButtonMode', 'CqcMuteButtonMode',
  'EnableRumbleTrigger', 'EnableMenuGroups', 'EnableMenuGroupsSRV',
  'UIFocusMode',
  'LeftPanelFocusOptions', 'CommsPanelFocusOptions',
  'RolePanelFocusOptions', 'RightPanelFocusOptions',
  'EnableCameraLockOn',
  'FocusOnTextEntryField',
  'MouseHeadlook', 'MouseHeadlookInvert', 'MouseHeadlookSensitivity',
  'HeadlookDefault', 'HeadlookIncrement', 'HeadlookMode',
  'HeadlookResetOnToggle', 'HeadlookSensitivity', 'HeadlookSmoothing',
  'MotionHeadlook', 'HeadlookMotionSensitivity', 'yawRotateHeadlook',
  'MouseBuggySteeringXMode', 'MouseBuggySteeringXDecay',
  'MouseBuggyRollingXMode', 'MouseBuggyRollingXDecay',
  'MouseBuggyYMode', 'MouseBuggyYDecay',
  'BuggyThrottleRange', 'BuggyThrottleIncrement',
  'DriveAssistDefault',
  'BuggyTurretMouseSensitivity', 'BuggyTurretMouseDeadzone', 'BuggyTurretMouseLinearity',
  'MouseTurretXMode', 'MouseTurretXDecay', 'MouseTurretYMode', 'MouseTurretYDecay',
  'MultiCrewThirdPersonMouseXMode', 'MultiCrewThirdPersonMouseXDecay',
  'MultiCrewThirdPersonMouseYMode', 'MultiCrewThirdPersonMouseYDecay',
  'MultiCrewThirdPersonMouseSensitivity',
  'PitchCameraMouse', 'YawCameraMouse',
  'FreeCamMouseSensitivity', 'FreeCamMouseYDecay', 'FreeCamMouseXDecay',
  'ThrottleRangeFreeCam',
  'FSSMouseXMode', 'FSSMouseXDecay', 'FSSMouseYMode', 'FSSMouseYDecay',
  'FSSMouseSensitivity', 'FSSMouseDeadzone', 'FSSMouseLinearity',
  'FSSTuningSensitivity',
  'SAAThirdPersonMouseXMode', 'SAAThirdPersonMouseXDecay',
  'SAAThirdPersonMouseYMode', 'SAAThirdPersonMouseYDecay',
  'SAAThirdPersonMouseSensitivity',
  'MouseHumanoidXMode', 'MouseHumanoidYMode', 'MouseHumanoidSensitivity',
  'HumanoidRotateSensitivity', 'HumanoidPitchSensitivity',
  'HumanoidItemWheel_AcceptMouseInput',
  'EnableMenuGroupsOnFoot', 'EnableAimAssistOnFoot',
]);

// ---------------------------------------------------------------------------
// BindingsParser class
// ---------------------------------------------------------------------------

/**
 * Parses Elite Dangerous `.binds` XML files into a structured
 * {@link BindingSet} with categorised bindings, device info, and
 * conflict detection.
 */
class BindingsParser {
  /** The most recently parsed binding set, or null if none parsed yet. */
  private bindings: BindingSet | null = null;

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Parse a `.binds` XML file into a {@link BindingSet}.
   *
   * @param filePath  Absolute path to the `.binds` file.
   * @returns         Structured binding data.
   * @throws          If the file cannot be read or is not valid binds XML.
   */
  async parse(filePath: string): Promise<BindingSet> {
    const xml = await fs.readFile(filePath, 'utf-8');

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      // Modifier elements can appear multiple times inside Primary/Secondary,
      // and Primary/Secondary themselves should be treated consistently.
      isArray: (name: string) => {
        return name === 'Modifier';
      },
      parseAttributeValue: false,
      trimValues: true,
    });

    const parsed = parser.parse(xml);
    this.bindings = this.transformBindings(parsed, filePath);
    return this.bindings;
  }

  /**
   * Get all bindings assigned to a specific device.
   *
   * @param deviceName  Raw device identifier (e.g. `"GamePad"`,
   *                    `"ThrustMasterWarthogThrottle"`, `"Keyboard"`).
   * @returns           Array of binding entries that reference the device.
   */
  getDeviceBindings(deviceName: string): BindingEntry[] {
    if (!this.bindings) return [];
    const lower = deviceName.toLowerCase();
    return Object.values(this.bindings.bindings).filter((entry) => {
      const primaryMatch = entry.primary?.device.toLowerCase() === lower;
      const secondaryMatch = entry.secondary?.device.toLowerCase() === lower;
      const axisMatch = entry.axis?.device.toLowerCase() === lower;
      return primaryMatch || secondaryMatch || axisMatch;
    });
  }

  /**
   * Get all bindings for a specific category.
   *
   * @param category  The {@link BindingCategory} to filter by.
   * @returns         Array of binding entries in that category.
   */
  getCategoryBindings(category: BindingCategory): BindingEntry[] {
    if (!this.bindings) return [];
    return Object.values(this.bindings.bindings).filter(
      (entry) => entry.category === category,
    );
  }

  /**
   * Find what action a specific device + key combination is bound to.
   *
   * @param device  Raw device identifier.
   * @param key     Key/button identifier (e.g. `"Joy_7"`, `"Key_A"`).
   * @returns       The binding entry, or `null` if no match.
   */
  findBinding(device: string, key: string): BindingEntry | null {
    if (!this.bindings) return null;
    const dLower = device.toLowerCase();
    const kLower = key.toLowerCase();
    for (const entry of Object.values(this.bindings.bindings)) {
      if (
        (entry.primary?.device.toLowerCase() === dLower &&
          entry.primary?.key.toLowerCase() === kLower) ||
        (entry.secondary?.device.toLowerCase() === dLower &&
          entry.secondary?.key.toLowerCase() === kLower) ||
        (entry.axis?.device.toLowerCase() === dLower &&
          entry.axis?.axis.toLowerCase() === kLower)
      ) {
        return entry;
      }
    }
    return null;
  }

  /**
   * Get all actions that have no binding (neither primary, secondary,
   * nor axis).
   *
   * @returns  Array of action name strings.
   */
  getUnboundActions(): string[] {
    if (!this.bindings) return [];
    return Object.values(this.bindings.bindings)
      .filter(
        (entry) =>
          entry.primary === null && entry.secondary === null && entry.axis === null,
      )
      .map((entry) => entry.action);
  }

  /**
   * Detect binding conflicts: the same device + key combination
   * assigned to multiple actions. This ignores `{NoDevice}` entries.
   *
   * @returns  Array of conflict objects.
   */
  getConflicts(): Array<{ key: string; device: string; actions: string[] }> {
    if (!this.bindings) return [];

    // Map of "device|key" -> action names
    const map = new Map<string, string[]>();

    for (const entry of Object.values(this.bindings.bindings)) {
      const candidates = [
        entry.primary ? { d: entry.primary.device, k: entry.primary.key } : null,
        entry.secondary ? { d: entry.secondary.device, k: entry.secondary.key } : null,
        entry.axis ? { d: entry.axis.device, k: entry.axis.axis } : null,
      ];

      for (const c of candidates) {
        if (!c || c.d === NO_DEVICE || !c.k) continue;
        const sig = `${c.d}|${c.k}`;
        const list = map.get(sig);
        if (list) {
          list.push(entry.action);
        } else {
          map.set(sig, [entry.action]);
        }
      }
    }

    const conflicts: Array<{ key: string; device: string; actions: string[] }> = [];
    for (const [sig, actions] of map) {
      if (actions.length > 1) {
        const [device, key] = sig.split('|');
        conflicts.push({ key, device, actions });
      }
    }

    return conflicts;
  }

  /**
   * Get the most recently parsed {@link BindingSet}, or `null` if
   * {@link parse} has not been called yet.
   */
  getBindings(): BindingSet | null {
    return this.bindings;
  }

  /**
   * Export the parsed bindings as a simplified JSON-friendly object.
   * Useful for sending over WebSocket or REST responses.
   */
  toJSON(): object {
    if (!this.bindings) return {};

    const categories = new Map<BindingCategory, number>();
    const devices = new Set<string>();
    let boundCount = 0;
    let unboundCount = 0;

    for (const entry of Object.values(this.bindings.bindings)) {
      // Count categories
      categories.set(
        entry.category,
        (categories.get(entry.category) ?? 0) + 1,
      );

      // Track devices
      if (entry.primary) devices.add(entry.primary.device);
      if (entry.secondary) devices.add(entry.secondary.device);
      if (entry.axis) devices.add(entry.axis.device);

      // Bound vs unbound
      if (entry.primary || entry.secondary || entry.axis) {
        boundCount++;
      } else {
        unboundCount++;
      }
    }

    // Remove NoDevice from device list
    devices.delete(NO_DEVICE);

    return {
      name: this.bindings.name,
      filePath: this.bindings.filePath,
      majorVersion: this.bindings.majorVersion,
      minorVersion: this.bindings.minorVersion,
      totalBindings: Object.keys(this.bindings.bindings).length,
      boundActions: boundCount,
      unboundActions: unboundCount,
      devices: [...devices].map((d) => ({
        id: d,
        label: getDeviceLabel(d),
        type: classifyDevice(d),
      })),
      categories: [...categories.entries()].map(([cat, count]) => ({
        category: cat,
        count,
      })),
      bindings: this.bindings.bindings,
    };
  }

  // -----------------------------------------------------------------------
  // Private: XML transformation
  // -----------------------------------------------------------------------

  /**
   * Transform the raw XML parse result into a structured {@link BindingSet}.
   */
  private transformBindings(parsed: any, filePath: string): BindingSet {
    const root = parsed?.Root ?? parsed?.root ?? parsed;

    // Extract metadata from root element attributes
    const presetName: string = root['@_PresetName'] ?? 'Unknown';
    const majorVersion: string = root['@_MajorVersion'] ?? '0';
    const minorVersion: string = root['@_MinorVersion'] ?? '0';

    // Extract mouse config values
    const mouseDeadzone = this.parseFloat(root?.MouseDeadzone?.['@_Value'], 0.05);
    const mouseDecayRate = this.parseFloat(root?.MouseDecayRate?.['@_Value'], 4.0);

    // Iterate all child elements in the root
    const bindings: Record<string, BindingEntry> = {};

    for (const [elementName, elementData] of Object.entries(root)) {
      // Skip XML attributes and metadata
      if (elementName.startsWith('@_')) continue;
      if (elementName === '#text') continue;

      // Skip scalar config values that are not bindings
      if (SCALAR_CONFIG_ELEMENTS.has(elementName)) continue;

      // Skip if elementData is a primitive (string/number) — it is a simple
      // text node like <KeyboardLayout>en-US</KeyboardLayout>
      if (typeof elementData !== 'object' || elementData === null) continue;

      // Determine what kind of binding this is
      const entry = this.parseBindingElement(elementName, elementData);
      if (entry) {
        bindings[elementName] = entry;
      }
    }

    return {
      name: presetName,
      filePath,
      majorVersion,
      minorVersion,
      bindings,
      mouseXDeadzone: mouseDeadzone,
      mouseYDeadzone: mouseDeadzone,
      mouseDecayRate,
    };
  }

  /**
   * Parse a single XML element into a {@link BindingEntry}, or return
   * `null` if the element does not represent a binding.
   */
  private parseBindingElement(
    action: string,
    data: any,
  ): BindingEntry | null {
    // An element is a binding if it has:
    //   - Primary + Secondary children (key binding), OR
    //   - Binding + Inverted + Deadzone children (axis binding), OR
    //   - Both (some actions have axis AND button forms with the same name)

    const hasPrimary = data.Primary !== undefined;
    const hasSecondary = data.Secondary !== undefined;
    const hasBinding = data.Binding !== undefined;
    const hasInverted = data.Inverted !== undefined;

    // If it has none of these, it is not a binding element
    if (!hasPrimary && !hasSecondary && !hasBinding) return null;

    // Also treat an element with only a Value attribute as a config value
    if (
      !hasPrimary &&
      !hasSecondary &&
      !hasBinding &&
      data['@_Value'] !== undefined
    ) {
      return null;
    }

    const category = categoriseAction(action);

    let primary: KeyBinding | null = null;
    let secondary: KeyBinding | null = null;
    let axis: AxisBinding | null = null;

    // Parse key bindings
    if (hasPrimary) {
      primary = this.parseKeyBinding(data.Primary);
    }
    if (hasSecondary) {
      secondary = this.parseKeyBinding(data.Secondary);
    }

    // Parse axis binding
    if (hasBinding) {
      axis = this.parseAxisBinding(
        data.Binding,
        hasInverted ? data.Inverted : null,
        data.Deadzone ?? null,
      );
    }

    return { action, category, primary, secondary, axis };
  }

  /**
   * Parse a Primary or Secondary XML element into a {@link KeyBinding}.
   * Returns `null` if the device is `{NoDevice}`.
   *
   * XML shapes:
   * ```xml
   * <Primary Device="Keyboard" Key="Key_A" />
   *
   * <Primary Device="ThrustMasterWarthogThrottle" Key="Neg_Joy_YAxis">
   *   <Modifier Device="ThrustMasterWarthogThrottle" Key="Neg_Joy_XAxis" />
   * </Primary>
   *
   * <Secondary Device="Keyboard" Key="Key_Space">
   *   <Modifier Device="Keyboard" Key="Key_LeftControl" />
   *   <Modifier Device="Keyboard" Key="Key_LeftAlt" />
   * </Secondary>
   * ```
   */
  private parseKeyBinding(node: any): KeyBinding | null {
    if (!node) return null;

    const device: string = node['@_Device'] ?? '';
    const key: string = node['@_Key'] ?? '';

    // Unbound
    if (!device || device === NO_DEVICE || !key) return null;

    // Parse modifiers
    const modifiers: BindingModifier[] = [];
    if (node.Modifier) {
      // Modifier is always an array due to isArray config
      const mods = Array.isArray(node.Modifier)
        ? node.Modifier
        : [node.Modifier];
      for (const mod of mods) {
        const modDevice: string = mod['@_Device'] ?? '';
        const modKey: string = mod['@_Key'] ?? '';
        if (modDevice && modKey) {
          modifiers.push({ device: modDevice, key: modKey });
        }
      }
    }

    return {
      device,
      deviceType: classifyDevice(device),
      key,
      modifiers,
    };
  }

  /**
   * Parse axis binding data into an {@link AxisBinding}.
   * Returns `null` if the device is `{NoDevice}`.
   *
   * XML shape:
   * ```xml
   * <Binding Device="GamePad" Key="Joy_RZAxis" />
   * <Inverted Value="1" />
   * <Deadzone Value="0.00000000" />
   * ```
   */
  private parseAxisBinding(
    bindingNode: any,
    invertedNode: any,
    deadzoneNode: any,
  ): AxisBinding | null {
    if (!bindingNode) return null;

    const device: string = bindingNode['@_Device'] ?? '';
    const axisKey: string = bindingNode['@_Key'] ?? '';

    // Unbound axis
    if (!device || device === NO_DEVICE || !axisKey) return null;

    const inverted = invertedNode?.['@_Value'] === '1';
    const deadzone = this.parseFloat(deadzoneNode?.['@_Value'], 0.0);

    return {
      device,
      deviceType: classifyDevice(device),
      axis: axisKey,
      inverted,
      deadzone,
    };
  }

  /**
   * Safely parse a string to a float, returning the default on failure.
   */
  private parseFloat(value: unknown, defaultValue: number): number {
    if (value === undefined || value === null || value === '') return defaultValue;
    const n = Number(value);
    return Number.isNaN(n) ? defaultValue : n;
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/**
 * Singleton bindings parser instance.
 * Import this and call `bindingsParser.parse(path)` to load a profile.
 */
export const bindingsParser = new BindingsParser();
