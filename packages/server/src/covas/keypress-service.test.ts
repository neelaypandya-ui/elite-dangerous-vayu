/**
 * AGNI — Unit tests for keypress-service.ts
 *
 * Tests VK_MAP coverage, resolveBinding() logic, and key name mapping.
 * The koffi FFI layer is fully mocked so no actual keypresses are sent.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockKeybd_event, mockGetAll } = vi.hoisted(() => ({
  mockKeybd_event: vi.fn(),
  mockGetAll: vi.fn(),
}));

vi.mock('koffi', () => ({
  default: {
    load: () => ({
      func: () => mockKeybd_event,
    }),
  },
}));

vi.mock('../features/bindings/index.js', () => ({
  bindingsService: { getAll: mockGetAll },
}));

// Import after mocks
import { keypressService } from './keypress-service.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBindingSet(bindings: Record<string, any>) {
  return {
    name: 'TestBinds',
    filePath: 'test.binds',
    majorVersion: '4',
    minorVersion: '0',
    bindings,
    mouseXDeadzone: 0,
    mouseYDeadzone: 0,
    mouseDecayRate: 0,
  };
}

function makeKeyboardBinding(key: string, modifiers: Array<{ device: string; key: string }> = []) {
  return {
    action: 'TestAction',
    category: 'miscellaneous' as const,
    primary: {
      device: 'Keyboard',
      deviceType: 'Keyboard',
      key,
      modifiers,
    },
    secondary: null,
    axis: null,
  };
}

function makeJoystickBinding() {
  return {
    action: 'TestAction',
    category: 'miscellaneous' as const,
    primary: {
      device: 'SomeJoystick',
      deviceType: 'Joystick',
      key: 'Joy_1',
      modifiers: [],
    },
    secondary: null,
    axis: null,
  };
}

function makeUnboundBinding() {
  return {
    action: 'TestAction',
    category: 'miscellaneous' as const,
    primary: {
      device: '{NoDevice}',
      deviceType: 'Keyboard',
      key: '',
      modifiers: [],
    },
    secondary: null,
    axis: null,
  };
}

function makeNullPrimaryBinding(secondary: any) {
  return {
    action: 'TestAction',
    category: 'miscellaneous' as const,
    primary: null,
    secondary,
    axis: null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('KeypressService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // resolveBinding — normal keyboard bindings
  // -----------------------------------------------------------------------

  describe('resolveBinding()', () => {
    it('should resolve a simple keyboard binding to the correct VK code', () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeKeyboardBinding('Key_A'),
        }),
      );

      const result = keypressService.resolveBinding('TestAction');
      expect(result).not.toBeNull();
      expect(result!.vkCode).toBe(0x41); // A
      expect(result!.modifiers).toEqual([]);
    });

    it('should resolve a binding with modifier keys', () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeKeyboardBinding('Key_F', [
            { device: 'Keyboard', key: 'Key_LeftControl' },
            { device: 'Keyboard', key: 'Key_LeftShift' },
          ]),
        }),
      );

      const result = keypressService.resolveBinding('TestAction');
      expect(result).not.toBeNull();
      expect(result!.vkCode).toBe(0x46); // F
      expect(result!.modifiers).toEqual([0xa2, 0xa0]); // LCtrl, LShift
    });

    it('should resolve number keys correctly', () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeKeyboardBinding('Key_0'),
        }),
      );

      const result = keypressService.resolveBinding('TestAction');
      expect(result).not.toBeNull();
      expect(result!.vkCode).toBe(0x30);
    });

    it('should resolve function keys correctly', () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeKeyboardBinding('Key_F12'),
        }),
      );

      const result = keypressService.resolveBinding('TestAction');
      expect(result).not.toBeNull();
      expect(result!.vkCode).toBe(0x7b);
    });

    it('should resolve numpad keys correctly', () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeKeyboardBinding('Key_Numpad_5'),
        }),
      );

      const result = keypressService.resolveBinding('TestAction');
      expect(result).not.toBeNull();
      expect(result!.vkCode).toBe(0x65);
    });

    it('should resolve navigation keys correctly', () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeKeyboardBinding('Key_Space'),
        }),
      );

      const result = keypressService.resolveBinding('TestAction');
      expect(result).not.toBeNull();
      expect(result!.vkCode).toBe(0x20);
    });

    it('should resolve punctuation keys correctly', () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeKeyboardBinding('Key_Comma'),
        }),
      );

      const result = keypressService.resolveBinding('TestAction');
      expect(result).not.toBeNull();
      expect(result!.vkCode).toBe(0xbc);
    });
  });

  // -----------------------------------------------------------------------
  // resolveBinding — fallback to secondary
  // -----------------------------------------------------------------------

  describe('resolveBinding() secondary fallback', () => {
    it('should use secondary binding when primary is null', () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeNullPrimaryBinding({
            device: 'Keyboard',
            deviceType: 'Keyboard',
            key: 'Key_G',
            modifiers: [],
          }),
        }),
      );

      const result = keypressService.resolveBinding('TestAction');
      expect(result).not.toBeNull();
      expect(result!.vkCode).toBe(0x47); // G
    });
  });

  // -----------------------------------------------------------------------
  // resolveBinding — failure cases
  // -----------------------------------------------------------------------

  describe('resolveBinding() error cases', () => {
    it('should return null when bindings are not loaded', () => {
      mockGetAll.mockReturnValue(null);
      expect(keypressService.resolveBinding('TestAction')).toBeNull();
    });

    it('should return null for an unknown action name', () => {
      mockGetAll.mockReturnValue(makeBindingSet({}));
      expect(keypressService.resolveBinding('NonExistentAction')).toBeNull();
    });

    it('should return null for an unbound action ({NoDevice})', () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeUnboundBinding(),
        }),
      );
      expect(keypressService.resolveBinding('TestAction')).toBeNull();
    });

    it('should return null for joystick-only bindings', () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeJoystickBinding(),
        }),
      );
      expect(keypressService.resolveBinding('TestAction')).toBeNull();
    });

    it('should return null for unknown key names not in VK_MAP', () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeKeyboardBinding('Key_UnknownWeirdKey'),
        }),
      );
      expect(keypressService.resolveBinding('TestAction')).toBeNull();
    });

    it('should return null when both primary and secondary are null', () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: {
            action: 'TestAction',
            category: 'miscellaneous',
            primary: null,
            secondary: null,
            axis: null,
          },
        }),
      );
      expect(keypressService.resolveBinding('TestAction')).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // sendAction
  // -----------------------------------------------------------------------

  describe('sendAction()', () => {
    it('should return true and call keybd_event for a valid binding', async () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          DeployHardpointToggle: makeKeyboardBinding('Key_U'),
        }),
      );

      const result = await keypressService.sendAction('DeployHardpointToggle');
      expect(result).toBe(true);
      // keybd_event should have been called (key down + key up = at least 2 calls)
      expect(mockKeybd_event).toHaveBeenCalled();
    });

    it('should return false for an unresolvable action', async () => {
      mockGetAll.mockReturnValue(null);
      const result = await keypressService.sendAction('ToggleCargoScoop');
      expect(result).toBe(false);
      expect(mockKeybd_event).not.toHaveBeenCalled();
    });

    it('should press and release modifier keys around the main key', async () => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeKeyboardBinding('Key_X', [
            { device: 'Keyboard', key: 'Key_LeftControl' },
          ]),
        }),
      );

      await keypressService.sendAction('TestAction');

      const calls = mockKeybd_event.mock.calls;
      // Expect: modifier down, key down, key up, modifier up
      expect(calls.length).toBeGreaterThanOrEqual(4);

      // First call: modifier down (LCtrl = 0xa2)
      expect(calls[0][0]).toBe(0xa2);
      // Second call: key down (X = 0x58)
      expect(calls[1][0]).toBe(0x58);
    });
  });

  // -----------------------------------------------------------------------
  // VK_MAP coverage
  // -----------------------------------------------------------------------

  describe('VK_MAP key coverage', () => {
    // Test each letter A-Z resolves
    it.each(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c) => [c, 0x41 + c.charCodeAt(0) - 65]),
    )('should map Key_%s to VK code 0x%x', (letter, expectedVk) => {
      mockGetAll.mockReturnValue(
        makeBindingSet({
          TestAction: makeKeyboardBinding(`Key_${letter}`),
        }),
      );
      const result = keypressService.resolveBinding('TestAction');
      expect(result).not.toBeNull();
      expect(result!.vkCode).toBe(expectedVk);
    });

    // Test arrow keys
    it.each([
      ['Key_Up', 0x26],
      ['Key_Down', 0x28],
      ['Key_Left', 0x25],
      ['Key_Right', 0x27],
    ])('should map %s to VK 0x%x', (keyName, expectedVk) => {
      mockGetAll.mockReturnValue(
        makeBindingSet({ TestAction: makeKeyboardBinding(keyName) }),
      );
      const result = keypressService.resolveBinding('TestAction');
      expect(result).not.toBeNull();
      expect(result!.vkCode).toBe(expectedVk);
    });

    // Test common keys
    it.each([
      ['Key_Space', 0x20],
      ['Key_Enter', 0x0d],
      ['Key_Escape', 0x1b],
      ['Key_Tab', 0x09],
      ['Key_Backspace', 0x08],
    ])('should map %s to VK 0x%x', (keyName, expectedVk) => {
      mockGetAll.mockReturnValue(
        makeBindingSet({ TestAction: makeKeyboardBinding(keyName) }),
      );
      const result = keypressService.resolveBinding('TestAction');
      expect(result).not.toBeNull();
      expect(result!.vkCode).toBe(expectedVk);
    });

    // Test modifier keys
    it.each([
      ['Key_LeftShift', 0xa0],
      ['Key_RightShift', 0xa1],
      ['Key_LeftControl', 0xa2],
      ['Key_RightControl', 0xa3],
      ['Key_LeftAlt', 0xa4],
      ['Key_RightAlt', 0xa5],
    ])('should map %s to VK 0x%x', (keyName, expectedVk) => {
      mockGetAll.mockReturnValue(
        makeBindingSet({ TestAction: makeKeyboardBinding(keyName) }),
      );
      const result = keypressService.resolveBinding('TestAction');
      expect(result).not.toBeNull();
      expect(result!.vkCode).toBe(expectedVk);
    });
  });
});
