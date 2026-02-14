/**
 * Keypress service — sends keyboard inputs to Elite Dangerous via koffi FFI.
 *
 * Resolves the user's actual key bindings at runtime from the bindings parser,
 * then sends the corresponding Windows virtual key codes via user32.dll keybd_event.
 */

import koffi from 'koffi';
import { bindingsService } from '../features/bindings/index.js';

// ---------------------------------------------------------------------------
// user32.dll FFI
// ---------------------------------------------------------------------------

const user32 = koffi.load('user32.dll');

const keybd_event = user32.func(
  'void __stdcall keybd_event(uint8_t bVk, uint8_t bScan, uint32_t dwFlags, uintptr_t dwExtraInfo)',
);

const KEYEVENTF_KEYUP = 0x0002;

// ---------------------------------------------------------------------------
// Elite Dangerous key name → Windows Virtual Key code mapping
// ---------------------------------------------------------------------------

const VK_MAP: Record<string, number> = {
  // Letters A-Z
  Key_A: 0x41, Key_B: 0x42, Key_C: 0x43, Key_D: 0x44, Key_E: 0x45,
  Key_F: 0x46, Key_G: 0x47, Key_H: 0x48, Key_I: 0x49, Key_J: 0x4a,
  Key_K: 0x4b, Key_L: 0x4c, Key_M: 0x4d, Key_N: 0x4e, Key_O: 0x4f,
  Key_P: 0x50, Key_Q: 0x51, Key_R: 0x52, Key_S: 0x53, Key_T: 0x54,
  Key_U: 0x55, Key_V: 0x56, Key_W: 0x57, Key_X: 0x58, Key_Y: 0x59,
  Key_Z: 0x5a,

  // Number row 0-9
  Key_0: 0x30, Key_1: 0x31, Key_2: 0x32, Key_3: 0x33, Key_4: 0x34,
  Key_5: 0x35, Key_6: 0x36, Key_7: 0x37, Key_8: 0x38, Key_9: 0x39,

  // Function keys F1-F12
  Key_F1: 0x70, Key_F2: 0x71, Key_F3: 0x72, Key_F4: 0x73,
  Key_F5: 0x74, Key_F6: 0x75, Key_F7: 0x76, Key_F8: 0x77,
  Key_F9: 0x78, Key_F10: 0x79, Key_F11: 0x7a, Key_F12: 0x7b,

  // Numpad
  Key_Numpad_0: 0x60, Key_Numpad_1: 0x61, Key_Numpad_2: 0x62,
  Key_Numpad_3: 0x63, Key_Numpad_4: 0x64, Key_Numpad_5: 0x65,
  Key_Numpad_6: 0x66, Key_Numpad_7: 0x67, Key_Numpad_8: 0x68,
  Key_Numpad_9: 0x69,
  Key_NumpadEnter: 0x0d, Key_NumpadMultiply: 0x6a,
  Key_NumpadAdd: 0x6b, Key_NumpadSubtract: 0x6d,
  Key_NumpadDecimal: 0x6e, Key_NumpadDivide: 0x6f,

  // Modifiers
  Key_LeftShift: 0xa0, Key_RightShift: 0xa1,
  Key_LeftControl: 0xa2, Key_RightControl: 0xa3,
  Key_LeftAlt: 0xa4, Key_RightAlt: 0xa5,

  // Navigation
  Key_Up: 0x26, Key_Down: 0x28, Key_Left: 0x25, Key_Right: 0x27,
  Key_Home: 0x24, Key_End: 0x23, Key_PageUp: 0x21, Key_PageDown: 0x22,
  Key_Insert: 0x2d, Key_Delete: 0x2e,

  // Common keys
  Key_Space: 0x20, Key_Enter: 0x0d, Key_Return: 0x0d,
  Key_Escape: 0x1b, Key_Tab: 0x09, Key_Backspace: 0x08,
  Key_CapsLock: 0x14, Key_NumLock: 0x90, Key_ScrollLock: 0x91,

  // Punctuation
  Key_Semicolon: 0xba, Key_Equals: 0xbb, Key_Comma: 0xbc,
  Key_Minus: 0xbd, Key_Period: 0xbe, Key_Slash: 0xbf,
  Key_Grave: 0xc0, Key_LeftBracket: 0xdb, Key_Backslash: 0xdc,
  Key_RightBracket: 0xdd, Key_Apostrophe: 0xde,
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class KeypressService {
  /**
   * Resolve a binding action name to its virtual key code and modifier codes.
   * Returns null if the action is unbound or bound to a non-keyboard device.
   */
  resolveBinding(actionName: string): { vkCode: number; modifiers: number[] } | null {
    const bs = bindingsService.getAll();
    if (!bs) {
      console.warn('[Keypress] Bindings not loaded');
      return null;
    }

    const entry = bs.bindings[actionName];
    if (!entry) {
      console.warn(`[Keypress] No binding entry for "${actionName}"`);
      return null;
    }

    // Try primary, then secondary
    const binding = entry.primary ?? entry.secondary;
    if (!binding || binding.device === '{NoDevice}') {
      console.warn(`[Keypress] "${actionName}" is unbound`);
      return null;
    }

    // Only handle keyboard bindings
    if (binding.deviceType !== 'Keyboard') {
      console.warn(`[Keypress] "${actionName}" is bound to ${binding.deviceType}, not keyboard`);
      return null;
    }

    const vkCode = VK_MAP[binding.key];
    if (vkCode === undefined) {
      console.warn(`[Keypress] Unknown key name: "${binding.key}"`);
      return null;
    }

    const modifiers: number[] = [];
    for (const mod of binding.modifiers) {
      const modVk = VK_MAP[mod.key];
      if (modVk !== undefined) {
        modifiers.push(modVk);
      }
    }

    return { vkCode, modifiers };
  }

  /**
   * Send a single keypress with optional modifiers.
   * Presses modifiers → key down → hold 50ms → key up → release modifiers.
   */
  async sendKey(vkCode: number, modifiers: number[] = []): Promise<void> {
    // Press modifiers
    for (const mod of modifiers) {
      keybd_event(mod, 0, 0, 0);
    }

    // Press key
    keybd_event(vkCode, 0, 0, 0);
    await sleep(50);

    // Release key
    keybd_event(vkCode, 0, KEYEVENTF_KEYUP, 0);

    // Release modifiers (reverse order)
    for (const mod of modifiers.reverse()) {
      keybd_event(mod, 0, KEYEVENTF_KEYUP, 0);
    }
  }

  /**
   * Send a binding action by its Elite Dangerous action name.
   * Looks up the user's configured key from the bindings parser.
   * Returns true if the key was sent, false if the action couldn't be resolved.
   */
  async sendAction(actionName: string): Promise<boolean> {
    const resolved = this.resolveBinding(actionName);
    if (!resolved) return false;

    console.log(`[Keypress] Sending action "${actionName}" → VK 0x${resolved.vkCode.toString(16).toUpperCase()}`);
    await this.sendKey(resolved.vkCode, resolved.modifiers);
    return true;
  }
}

export const keypressService = new KeypressService();
