import { useEffect, useRef, useCallback, useState } from 'react';

interface WSEnvelope {
  type: string;
  payload: unknown;
  timestamp: string;
}

type MessageHandler = (envelope: WSEnvelope) => void;

export function useWebSocket(url = `ws://${window.location.hostname}:3001`) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      setConnected(true);
      console.log('[WS] Connected');
    };

    ws.onmessage = (ev) => {
      try {
        const envelope: WSEnvelope = JSON.parse(ev.data);
        // Fire specific handlers
        const specific = handlersRef.current.get(envelope.type);
        specific?.forEach((h) => h(envelope));
        // Fire wildcard handlers
        const wildcard = handlersRef.current.get('*');
        wildcard?.forEach((h) => h(envelope));
      } catch { /* ignore bad messages */ }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('[WS] Disconnected, reconnecting in 3s...');
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();

    wsRef.current = ws;
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set());
    }
    handlersRef.current.get(type)!.add(handler);
    return () => { handlersRef.current.get(type)?.delete(handler); };
  }, []);

  const send = useCallback((type: string, payload: unknown = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }));
    }
  }, []);

  return { connected, subscribe, send };
}
