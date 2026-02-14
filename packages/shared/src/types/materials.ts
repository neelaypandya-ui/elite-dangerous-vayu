/**
 * @vayu/shared — Material & Engineering Types
 *
 * Types for raw/manufactured/encoded materials, engineering blueprints,
 * and the material inventory tracked by VAYU.
 */

// ---------------------------------------------------------------------------
// Material Categories
// ---------------------------------------------------------------------------

/** Top-level material categories as used in the journal. */
export type MaterialCategory = 'Raw' | 'Manufactured' | 'Encoded';

/** Grade of a material (1 = Very Common, 5 = Very Rare). */
export type MaterialGrade = 1 | 2 | 3 | 4 | 5;

/** Maximum storage per grade: grade 1=300, 2=250, 3=200, 4=150, 5=100. */
export const MATERIAL_GRADE_CAPS: Record<MaterialGrade, number> = {
  1: 300,
  2: 250,
  3: 200,
  4: 150,
  5: 100,
};

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------

/** A single material entry in the inventory. */
export interface Material {
  /** Internal name (lowercase, no spaces — as from journal). */
  name: string;
  /** Localised display name. */
  nameLocalised: string | null;
  /** Category this material belongs to. */
  category: MaterialCategory;
  /** Rarity grade. */
  grade: MaterialGrade;
  /** Current count held by the commander. */
  count: number;
  /** Maximum storable for this grade. */
  maximum: number;
}

// ---------------------------------------------------------------------------
// Materials State (inventory)
// ---------------------------------------------------------------------------

/** Full material inventory as tracked by VAYU. */
export interface MaterialsState {
  /** Raw materials (gathered from planet surfaces / asteroids). */
  raw: Material[];
  /** Manufactured materials (dropped from ships, signal sources). */
  manufactured: Material[];
  /** Encoded materials (scanned from data points, ships, wakes). */
  encoded: Material[];
}

// ---------------------------------------------------------------------------
// Engineering Blueprints
// ---------------------------------------------------------------------------

/** A single ingredient for a blueprint. */
export interface BlueprintIngredient {
  /** Internal material name. */
  name: string;
  /** Localised name. */
  nameLocalised: string | null;
  /** Category of the material. */
  category: MaterialCategory;
  /** Quantity required per roll. */
  count: number;
}

/** A specific grade of an engineering blueprint. */
export interface BlueprintGrade {
  /** Engineering grade (1-5). */
  grade: number;
  /** Engineers that offer this grade. */
  engineers: string[];
  /** Required ingredients for one roll. */
  ingredients: BlueprintIngredient[];
}

/** An engineering blueprint definition. */
export interface EngineeringBlueprint {
  /** Internal blueprint name (e.g. "Weapon_LongRange"). */
  name: string;
  /** Human-readable blueprint name. */
  displayName: string;
  /** Module type this applies to (e.g. "Beam Laser", "Frame Shift Drive"). */
  moduleType: string;
  /** Available grades with their ingredients. */
  grades: BlueprintGrade[];
}

/** An experimental effect definition. */
export interface ExperimentalEffect {
  /** Internal effect name. */
  name: string;
  /** Human-readable name. */
  displayName: string;
  /** Module type this applies to. */
  moduleType: string;
  /** Required ingredients. */
  ingredients: BlueprintIngredient[];
}

// ---------------------------------------------------------------------------
// Engineer
// ---------------------------------------------------------------------------

/** Known engineering progress for a single engineer. */
export interface EngineerState {
  /** Engineer's name. */
  name: string;
  /** Engineer numeric ID. */
  id: number;
  /** Unlock / progress stage: "Known", "Invited", "Acquainted", "Unlocked". */
  progress: 'Known' | 'Invited' | 'Acquainted' | 'Unlocked';
  /** Current rank achieved (1-5, or null if not unlocked). */
  rank: number | null;
  /** Percentage progress to next rank (0-100). */
  rankProgress: number;
}

// ---------------------------------------------------------------------------
// Material Trade Rates
// ---------------------------------------------------------------------------

/** Cross-grade trade ratio for material traders. */
export interface MaterialTradeRate {
  /** Source grade. */
  fromGrade: MaterialGrade;
  /** Target grade. */
  toGrade: MaterialGrade;
  /** Number of source mats consumed. */
  cost: number;
  /** Number of target mats received. */
  yield: number;
}
