/**
 * AGNI — Unit tests for name-resolver.ts
 *
 * Tests ship name resolution, module name resolution, material name
 * resolution, credit formatting, and distance formatting.
 */

import { describe, it, expect } from 'vitest';
import {
  resolveShipName,
  resolveModuleName,
  resolveMaterialName,
  cleanLocalizedString,
  formatCredits,
  formatDistance,
} from './name-resolver.js';

// ---------------------------------------------------------------------------
// resolveShipName
// ---------------------------------------------------------------------------

describe('resolveShipName()', () => {
  describe('known ship identifiers', () => {
    it.each([
      ['SideWinder', 'Sidewinder Mk I'],
      ['Anaconda', 'Anaconda'],
      ['CobraMkIII', 'Cobra Mk III'],
      ['CobraMkIV', 'Cobra Mk IV'],
      ['FerDeLance', 'Fer-de-Lance'],
      ['Krait_MkII', 'Krait Mk II'],
      ['Krait_Light', 'Krait Phantom'],
      ['Python', 'Python'],
      ['Python_NX', 'Python Mk II'],
      ['Federation_Corvette', 'Federal Corvette'],
      ['Cutter', 'Imperial Cutter'],
      ['Empire_Trader', 'Imperial Clipper'],
      ['Empire_Courier', 'Imperial Courier'],
      ['Empire_Eagle', 'Imperial Eagle'],
      ['Independant_Trader', 'Keelback'],
      ['DiamondBackXL', 'Diamondback Explorer'],
      ['DiamondBack', 'Diamondback Scout'],
      ['Type6', 'Type-6 Transporter'],
      ['Type7', 'Type-7 Transporter'],
      ['Type9', 'Type-9 Heavy'],
      ['Type9_Military', 'Type-10 Defender'],
      ['TypeX', 'Alliance Chieftain'],
      ['TypeX_2', 'Alliance Crusader'],
      ['TypeX_3', 'Alliance Challenger'],
      ['Vulture', 'Vulture'],
      ['Mamba', 'Mamba'],
      ['Orca', 'Orca'],
      ['BelugaLiner', 'Beluga Liner'],
      ['Dolphin', 'Dolphin'],
      ['Asp', 'Asp Explorer'],
      ['Asp_Scout', 'Asp Scout'],
      ['Viper', 'Viper Mk III'],
      ['Viper_MkIV', 'Viper Mk IV'],
      ['Hauler', 'Hauler'],
      ['Eagle', 'Eagle Mk II'],
      ['Adder', 'Adder'],
      ['Mandalay', 'Mandalay'],
    ])('should resolve "%s" to "%s"', (input, expected) => {
      expect(resolveShipName(input)).toBe(expected);
    });
  });

  describe('localized string format', () => {
    it('should handle $sidewinder_name; format', () => {
      expect(resolveShipName('$sidewinder_name;')).toBe('Sidewinder Mk I');
    });

    it('should handle $anaconda_name; format', () => {
      expect(resolveShipName('$anaconda_name;')).toBe('Anaconda');
    });

    it('should handle $cobramkiii_name; format (case-insensitive)', () => {
      expect(resolveShipName('$cobramkiii_name;')).toBe('Cobra Mk III');
    });
  });

  describe('fallback for unknown ships', () => {
    it('should title-case an unknown identifier', () => {
      const result = resolveShipName('some_unknown_ship');
      expect(result).toBe('Some Unknown Ship');
    });

    it('should handle plain identifiers without wrappers', () => {
      const result = resolveShipName('newship2024');
      expect(result).toBe('Newship2024');
    });

    it('should strip localization wrapper from unknown ships', () => {
      const result = resolveShipName('$brand_new_vessel_name;');
      expect(result).toBe('Brand New Vessel');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(resolveShipName('')).toBe('');
    });

    it('should handle just $ prefix', () => {
      const result = resolveShipName('$');
      expect(result).toBe('');
    });

    it('should handle just ; suffix', () => {
      const result = resolveShipName(';');
      expect(result).toBe('');
    });
  });
});

// ---------------------------------------------------------------------------
// resolveModuleName
// ---------------------------------------------------------------------------

describe('resolveModuleName()', () => {
  describe('hardpoint pattern: hpt_{type}_{mount}_{size}', () => {
    it('should resolve a gimballed beam laser', () => {
      expect(resolveModuleName('$hpt_beamlaser_gimbal_large_name;')).toBe(
        'Large Gimballed Beam Laser',
      );
    });

    it('should resolve a fixed multi-cannon', () => {
      expect(resolveModuleName('$hpt_multicannon_fixed_medium_name;')).toBe(
        'Medium Fixed Multi-Cannon',
      );
    });

    it('should resolve a turreted pulse laser', () => {
      expect(resolveModuleName('$hpt_pulselaser_turret_small_name;')).toBe(
        'Small Turreted Pulse Laser',
      );
    });

    it('should resolve a huge plasma accelerator', () => {
      expect(resolveModuleName('$hpt_plasmaaccelerator_fixed_huge_name;')).toBe(
        'Huge Fixed Plasma Accelerator',
      );
    });
  });

  describe('utility hardpoint pattern: hpt_{type}_{size}', () => {
    it('should resolve a chaff launcher', () => {
      expect(resolveModuleName('$hpt_chafflauncher_tiny_name;')).toBe('Tiny Chaff Launcher');
    });

    it('should resolve a shield booster', () => {
      expect(resolveModuleName('$hpt_shieldbooster_small_name;')).toBe('Small Shield Booster');
    });

    it('should resolve a heat sink launcher', () => {
      expect(resolveModuleName('$hpt_heatsinklauncher_tiny_name;')).toBe(
        'Tiny Heat Sink Launcher',
      );
    });
  });

  describe('internal module pattern: int_{type}_size{N}_class{C}', () => {
    it('should resolve a 5A FSD', () => {
      expect(resolveModuleName('$int_hyperdrive_size5_class5_name;')).toBe(
        '5A Frame Shift Drive',
      );
    });

    it('should resolve a 4E power plant', () => {
      expect(resolveModuleName('$int_powerplant_size4_class1_name;')).toBe('4E Power Plant');
    });

    it('should resolve a 3D shield generator', () => {
      expect(resolveModuleName('$int_shieldgenerator_size3_class2_name;')).toBe(
        '3D Shield Generator',
      );
    });

    it('should resolve a 6C power distributor', () => {
      expect(resolveModuleName('$int_powerdistributor_size6_class3_name;')).toBe(
        '6C Power Distributor',
      );
    });

    it('should resolve a 2B fuel scoop', () => {
      expect(resolveModuleName('$int_fuelscoop_size2_class4_name;')).toBe('2B Fuel Scoop');
    });
  });

  describe('bare internal pattern: int_{type}', () => {
    it('should resolve planetary approach suite', () => {
      expect(resolveModuleName('$int_planetapproachsuite_name;')).toBe(
        'Planetary Approach Suite',
      );
    });

    it('should resolve supercruise assist', () => {
      expect(resolveModuleName('$int_supercruiseassist_name;')).toBe('Supercruise Assist');
    });
  });

  describe('fallback to title case', () => {
    it('should title-case unknown module names', () => {
      expect(resolveModuleName('$some_weird_module_name;')).toBe('Some Weird Module');
    });

    it('should handle plain identifiers', () => {
      expect(resolveModuleName('fancywidget')).toBe('Fancywidget');
    });
  });
});

// ---------------------------------------------------------------------------
// resolveMaterialName
// ---------------------------------------------------------------------------

describe('resolveMaterialName()', () => {
  it('should resolve known materials (case-insensitive)', () => {
    // "iron" is a very common raw material in ED
    const result = resolveMaterialName('iron');
    // Should either match the display name or fallback to "Iron"
    expect(result.toLowerCase()).toContain('iron');
  });

  it('should handle localization wrapper', () => {
    const result = resolveMaterialName('$iron_name;');
    expect(result.toLowerCase()).toContain('iron');
  });

  it('should fallback to title case for unknown materials', () => {
    expect(resolveMaterialName('somefakematerial')).toBe('Somefakematerial');
  });

  it('should strip wrappers from unknown materials', () => {
    expect(resolveMaterialName('$strange_alloy_name;')).toBe('Strange Alloy');
  });
});

// ---------------------------------------------------------------------------
// cleanLocalizedString
// ---------------------------------------------------------------------------

describe('cleanLocalizedString()', () => {
  it('should clean a standard localized string', () => {
    expect(cleanLocalizedString('$mission_delivery_name;')).toBe('Mission Delivery');
  });

  it('should handle strings without wrappers', () => {
    expect(cleanLocalizedString('already_clean')).toBe('Already Clean');
  });

  it('should handle just a $ prefix', () => {
    expect(cleanLocalizedString('$hello')).toBe('Hello');
  });

  it('should handle just a ; suffix', () => {
    expect(cleanLocalizedString('hello;')).toBe('Hello');
  });

  it('should handle empty string', () => {
    expect(cleanLocalizedString('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// formatCredits
// ---------------------------------------------------------------------------

describe('formatCredits()', () => {
  describe('full format (short=false)', () => {
    it('should format zero credits', () => {
      expect(formatCredits(0)).toBe('0 CR');
    });

    it('should format small amounts', () => {
      expect(formatCredits(500)).toBe('500 CR');
    });

    it('should format thousands with commas', () => {
      expect(formatCredits(1_234)).toBe('1,234 CR');
    });

    it('should format millions with commas', () => {
      expect(formatCredits(1_234_567)).toBe('1,234,567 CR');
    });

    it('should format billions with commas', () => {
      expect(formatCredits(1_234_567_890)).toBe('1,234,567,890 CR');
    });

    it('should handle negative amounts', () => {
      expect(formatCredits(-500)).toBe('-500 CR');
    });

    it('should handle negative amounts with commas', () => {
      expect(formatCredits(-1_234_567)).toBe('-1,234,567 CR');
    });
  });

  describe('short format (short=true)', () => {
    it('should format amounts under 1K without abbreviation', () => {
      expect(formatCredits(999, true)).toBe('999 CR');
    });

    it('should format thousands as K', () => {
      expect(formatCredits(1_500, true)).toBe('1.50K CR');
    });

    it('should format millions as M', () => {
      expect(formatCredits(12_345_678, true)).toBe('12.35M CR');
    });

    it('should format billions as B', () => {
      expect(formatCredits(5_000_000_000, true)).toBe('5.00B CR');
    });

    it('should format trillions as T', () => {
      expect(formatCredits(1_500_000_000_000, true)).toBe('1.50T CR');
    });

    it('should handle negative short format', () => {
      expect(formatCredits(-5_000_000, true)).toBe('-5.00M CR');
    });

    it('should handle zero in short format', () => {
      expect(formatCredits(0, true)).toBe('0 CR');
    });

    it('should handle exact boundaries', () => {
      expect(formatCredits(1_000, true)).toBe('1.00K CR');
      expect(formatCredits(1_000_000, true)).toBe('1.00M CR');
      expect(formatCredits(1_000_000_000, true)).toBe('1.00B CR');
      expect(formatCredits(1_000_000_000_000, true)).toBe('1.00T CR');
    });
  });
});

// ---------------------------------------------------------------------------
// formatDistance
// ---------------------------------------------------------------------------

describe('formatDistance()', () => {
  it('should format distances >= 1 LY with 2 decimal places', () => {
    expect(formatDistance(12.345)).toBe('12.35 LY');
  });

  it('should format distances >= 0.001 LY with 3 decimal places', () => {
    expect(formatDistance(0.543)).toBe('0.543 LY');
  });

  it('should format distances >= 0.001 LY at the boundary', () => {
    expect(formatDistance(0.001)).toBe('0.001 LY');
  });

  it('should convert very small distances to light seconds', () => {
    // 0.0001 LY * 31,557,600 = 3,155.76 LS
    const result = formatDistance(0.0001);
    expect(result).toContain('LS');
    expect(result).toContain('3,156');
  });

  it('should format exactly 1 LY', () => {
    expect(formatDistance(1)).toBe('1.00 LY');
  });

  it('should format 0 LY as LS', () => {
    const result = formatDistance(0);
    expect(result).toContain('0 LS');
  });

  it('should handle large distances', () => {
    expect(formatDistance(65279.42)).toBe('65279.42 LY');
  });

  it('should handle negative distances (absolute value logic)', () => {
    const result = formatDistance(-5.5);
    expect(result).toBe('-5.50 LY');
  });
});
