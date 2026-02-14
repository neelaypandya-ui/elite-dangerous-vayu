import { useEffect } from 'react';
import { useGameStateStore } from '../stores/gameStateStore';
import { useWebSocket } from './useWebSocket';

export function useGameState() {
  const store = useGameStateStore();
  const { subscribe, connected } = useWebSocket();

  useEffect(() => {
    const unsubs = [
      subscribe('state:full', (env) => store.setFullState(env.payload as any)),
      subscribe('state:commander', (env) => store.updateCommander(env.payload as any)),
      subscribe('state:ship', (env) => store.updateShip(env.payload as any)),
      subscribe('state:location', (env) => store.updateLocation(env.payload as any)),
      subscribe('state:materials', (env) => store.updateMaterials(env.payload as any)),
      subscribe('state:missions', (env) => store.updateMissions(env.payload as any)),
      subscribe('state:session', (env) => store.updateSession(env.payload as any)),
      subscribe('state:carrier', (env) => store.updateCarrier(env.payload as any)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [subscribe, store]);

  return { ...store, connected };
}
