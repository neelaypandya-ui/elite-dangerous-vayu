import { create } from 'zustand';

interface CommanderState {
  name: string;
  credits: number;
  loan: number;
  ranks: Record<string, { rank: number; name: string; progress: number }>;
  reputation: Record<string, number>;
}

interface ShipState {
  type: string;
  displayName: string;
  name: string | null;
  ident: string | null;
  hullHealth: number;
  shieldsUp: boolean;
  fuelLevel: number;
  fuelCapacity: number;
  cargoCapacity: number;
  cargo: { name: string; count: number }[];
}

interface LocationState {
  system: string;
  systemAddress: number | null;
  body: string | null;
  station: string | null;
  docked: boolean;
  landed: boolean;
  supercruise: boolean;
  onFoot: boolean;
  coordinates: [number, number, number] | null;
}

interface SessionState {
  startTime: string;
  jumps: number;
  distanceTraveled: number;
  creditsEarned: number;
  creditsSpent: number;
  elapsedSeconds: number;
}

interface GameState {
  commander: CommanderState;
  ship: ShipState;
  location: LocationState;
  materials: { raw: any[]; manufactured: any[]; encoded: any[] };
  missions: any[];
  session: SessionState;
  carrier: any | null;
  odyssey: any;
  lastUpdated: string;
}

interface GameStateStore extends GameState {
  initialized: boolean;
  setFullState: (state: GameState) => void;
  updateCommander: (commander: CommanderState) => void;
  updateShip: (ship: ShipState) => void;
  updateLocation: (location: LocationState) => void;
  updateMaterials: (materials: any) => void;
  updateMissions: (missions: any[]) => void;
  updateSession: (session: SessionState) => void;
  updateCarrier: (carrier: any) => void;
}

const defaultState: GameState = {
  commander: { name: '', credits: 0, loan: 0, ranks: {}, reputation: {} },
  ship: { type: '', displayName: '', name: null, ident: null, hullHealth: 100, shieldsUp: true, fuelLevel: 0, fuelCapacity: 0, cargoCapacity: 0, cargo: [] },
  location: { system: '', systemAddress: null, body: null, station: null, docked: false, landed: false, supercruise: false, onFoot: false, coordinates: null },
  materials: { raw: [], manufactured: [], encoded: [] },
  missions: [],
  session: { startTime: '', jumps: 0, distanceTraveled: 0, creditsEarned: 0, creditsSpent: 0, elapsedSeconds: 0 },
  carrier: null,
  odyssey: { suits: [], weapons: [], backpack: [], onFootCombatStats: { kills: 0, deaths: 0, czWins: 0 } },
  lastUpdated: '',
};

export const useGameStateStore = create<GameStateStore>((set) => ({
  ...defaultState,
  initialized: false,
  setFullState: (state) => set({ ...state, initialized: true }),
  updateCommander: (commander) => set({ commander, lastUpdated: new Date().toISOString() }),
  updateShip: (ship) => set({ ship, lastUpdated: new Date().toISOString() }),
  updateLocation: (location) => set({ location, lastUpdated: new Date().toISOString() }),
  updateMaterials: (materials) => set({ materials, lastUpdated: new Date().toISOString() }),
  updateMissions: (missions) => set({ missions, lastUpdated: new Date().toISOString() }),
  updateSession: (session) => set({ session, lastUpdated: new Date().toISOString() }),
  updateCarrier: (carrier) => set({ carrier, lastUpdated: new Date().toISOString() }),
}));
