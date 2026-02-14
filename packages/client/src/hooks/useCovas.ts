import { useCallback } from 'react';
import { useCovasStore } from '../stores/covasStore';
import { apiFetch } from './useApi';

export function useCovas() {
  const store = useCovasStore();

  const sendCommand = useCallback(async (text: string) => {
    store.setProcessing(true);
    store.addMessage({ role: 'user', text, timestamp: new Date().toISOString() });
    try {
      const result = await apiFetch<{ response: string }>('/covas/command', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      store.addMessage({ role: 'assistant', text: result.response, timestamp: new Date().toISOString() });
    } catch (e: unknown) {
      store.addMessage({
        role: 'assistant',
        text: 'Command failed. Check COVAS configuration.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      store.setProcessing(false);
    }
  }, [store]);

  return { ...store, sendCommand };
}
