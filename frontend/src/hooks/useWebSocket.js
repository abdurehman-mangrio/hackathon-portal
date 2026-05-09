import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

export const useWebSocket = (event, callback) => {
  const { on, off, isConnected } = useSocket();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!event) return;

    const handleEvent = (data) => {
      callbackRef.current?.(data);
    };

    const cleanup = on(event, handleEvent);

    return () => {
      cleanup?.();
    };
  }, [event, on, off]);

  return { isConnected };
};