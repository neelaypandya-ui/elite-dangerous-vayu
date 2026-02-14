/**
 * @vayu/client -- useGamepad Hook
 *
 * React hook that polls `navigator.getGamepads()` at 60fps via
 * requestAnimationFrame. Uses refs for high-frequency state (button/axis
 * values updated every frame without re-renders) and React state for
 * meaningful events (device connect/disconnect, button press/release).
 *
 * Features:
 *   - Automatic device detection via gamepadconnected/gamepaddisconnected
 *   - Deadzone filtering for axis noise (default 0.15)
 *   - Listen mode: fires onAnyInput for the first detected input (for rebinding)
 *   - Maps each device to its Elite Dangerous identifier via gamepad-mapping
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  matchDevice,
  buttonIndexToEliteKey,
  axisIndexToEliteKey,
  buttonLabel,
  axisLabel,
  halfAxisKey,
  type GamepadInput,
  type DeviceMapping,
} from '../utils/gamepad-mapping';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConnectedDevice {
  /** Gamepad API index. */
  index: number;
  /** Raw gamepad.id string. */
  rawId: string;
  /** Matched Elite device identifier. */
  eliteDevice: string;
  /** Human-readable label. */
  label: string;
  /** Device mapping info. */
  mapping: DeviceMapping;
  /** Number of buttons. */
  buttonCount: number;
  /** Number of axes. */
  axisCount: number;
}

export interface InputStates {
  /** Current button states per device index. */
  buttons: Map<number, boolean[]>;
  /** Current axis values per device index. */
  axes: Map<number, number[]>;
}

export interface UseGamepadOptions {
  /** When true, fires onAnyInput for the first detected button press or
   *  large axis movement (>0.7). Used by the binding editor. */
  listenMode?: boolean;
  /** Callback fired on any meaningful input in listen mode. */
  onAnyInput?: (input: GamepadInput) => void;
  /** Callback fired when a button is pressed. */
  onButtonPress?: (input: GamepadInput) => void;
  /** Callback fired when a button is released. */
  onButtonRelease?: (input: GamepadInput) => void;
  /** Axis deadzone threshold (default 0.15). */
  deadzone?: number;
  /** Axis threshold to trigger listen-mode capture (default 0.7). */
  axisThreshold?: number;
}

export interface UseGamepadReturn {
  /** Currently connected devices. */
  devices: ConnectedDevice[];
  /** Ref to current input states (non-reactive, updated every frame). */
  inputStatesRef: React.RefObject<InputStates>;
  /** Last detected input (reactive, updates on press/release). */
  lastInput: GamepadInput | null;
  /** Active button presses (reactive). */
  activeButtons: GamepadInput[];
  /** Force refresh device list. */
  refreshDevices: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGamepad(options: UseGamepadOptions = {}): UseGamepadReturn {
  const {
    listenMode = false,
    onAnyInput,
    onButtonPress,
    onButtonRelease,
    deadzone = 0.15,
    axisThreshold = 0.7,
  } = options;

  // Reactive state
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [lastInput, setLastInput] = useState<GamepadInput | null>(null);
  const [activeButtons, setActiveButtons] = useState<GamepadInput[]>([]);

  // Refs for high-frequency state (no re-renders)
  const inputStatesRef = useRef<InputStates>({
    buttons: new Map(),
    axes: new Map(),
  });

  // Track previous button states to detect press/release edges
  const prevButtonsRef = useRef<Map<number, boolean[]>>(new Map());

  // Refs for callbacks to avoid stale closures in animation frame
  const callbacksRef = useRef({ onAnyInput, onButtonPress, onButtonRelease });
  callbacksRef.current = { onAnyInput, onButtonPress, onButtonRelease };

  const listenModeRef = useRef(listenMode);
  listenModeRef.current = listenMode;

  // Track whether listen mode already fired (to only capture first input)
  const listenFiredRef = useRef(false);
  useEffect(() => {
    if (listenMode) {
      listenFiredRef.current = false;
    }
  }, [listenMode]);

  // Ref for devices to use in animation loop without reactive dependency
  const devicesRef = useRef<ConnectedDevice[]>([]);

  // -------------------------------------------------------------------
  // Device scanning
  // -------------------------------------------------------------------

  const scanDevices = useCallback(() => {
    const gamepads = navigator.getGamepads();
    const detected: ConnectedDevice[] = [];

    for (const gp of gamepads) {
      if (!gp) continue;

      const mapping = matchDevice(gp.id);
      detected.push({
        index: gp.index,
        rawId: gp.id,
        eliteDevice: mapping.eliteDevice,
        label: mapping.label,
        mapping,
        buttonCount: gp.buttons.length,
        axisCount: gp.axes.length,
      });
    }

    devicesRef.current = detected;
    setDevices(detected);
  }, []);

  // -------------------------------------------------------------------
  // Connect / disconnect events
  // -------------------------------------------------------------------

  useEffect(() => {
    const onConnect = () => scanDevices();
    const onDisconnect = () => scanDevices();

    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);

    // Initial scan
    scanDevices();

    return () => {
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
    };
  }, [scanDevices]);

  // -------------------------------------------------------------------
  // Animation frame polling loop
  // -------------------------------------------------------------------

  useEffect(() => {
    let rafId: number;

    const poll = () => {
      const gamepads = navigator.getGamepads();
      const newActiveButtons: GamepadInput[] = [];

      for (const device of devicesRef.current) {
        const gp = gamepads[device.index];
        if (!gp) continue;

        // Read current button states
        const currentButtons: boolean[] = [];
        const prevButtons = prevButtonsRef.current.get(device.index) ?? [];

        for (let i = 0; i < gp.buttons.length; i++) {
          const pressed = gp.buttons[i].pressed;
          currentButtons[i] = pressed;

          const wasPressed = prevButtons[i] ?? false;

          if (pressed) {
            const input: GamepadInput = {
              type: 'button',
              index: i,
              eliteKey: buttonIndexToEliteKey(i),
              value: gp.buttons[i].value,
              device: device.eliteDevice,
              label: buttonLabel(i),
            };
            newActiveButtons.push(input);

            // Edge: just pressed
            if (!wasPressed) {
              setLastInput(input);
              callbacksRef.current.onButtonPress?.(input);

              // Listen mode: capture first press
              if (listenModeRef.current && !listenFiredRef.current) {
                listenFiredRef.current = true;
                callbacksRef.current.onAnyInput?.(input);
              }
            }
          } else if (wasPressed) {
            // Edge: just released
            callbacksRef.current.onButtonRelease?.({
              type: 'button',
              index: i,
              eliteKey: buttonIndexToEliteKey(i),
              value: 0,
              device: device.eliteDevice,
              label: buttonLabel(i),
            });
          }
        }

        prevButtonsRef.current.set(device.index, currentButtons);

        // Store button states in ref
        inputStatesRef.current.buttons.set(device.index, currentButtons);

        // Read current axis values
        const currentAxes: number[] = [];
        for (let i = 0; i < gp.axes.length; i++) {
          const raw = gp.axes[i];
          const value = Math.abs(raw) < deadzone ? 0 : raw;
          currentAxes[i] = value;

          // Listen mode: capture large axis movement
          if (
            listenModeRef.current &&
            !listenFiredRef.current &&
            Math.abs(raw) > axisThreshold
          ) {
            const axisKey = axisIndexToEliteKey(i, device.mapping);
            const isPositive = raw > 0;
            const input: GamepadInput = {
              type: 'axis',
              index: i,
              eliteKey: halfAxisKey(axisKey, isPositive),
              value: raw,
              device: device.eliteDevice,
              label: `${axisLabel(i, device.mapping)} ${isPositive ? '+' : '-'}`,
            };
            listenFiredRef.current = true;
            setLastInput(input);
            callbacksRef.current.onAnyInput?.(input);
          }
        }

        inputStatesRef.current.axes.set(device.index, currentAxes);
      }

      // Only update active buttons state when count changes or buttons differ
      setActiveButtons((prev) => {
        if (prev.length === 0 && newActiveButtons.length === 0) return prev;
        return newActiveButtons;
      });

      rafId = requestAnimationFrame(poll);
    };

    rafId = requestAnimationFrame(poll);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [deadzone, axisThreshold]);

  return {
    devices,
    inputStatesRef,
    lastInput,
    activeButtons,
    refreshDevices: scanDevices,
  };
}
