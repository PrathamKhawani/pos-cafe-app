import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const useSocket = (onEvent?: (event: string, data: any) => void) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    if (onEvent) {
      socket.onAny((event, data) => {
        onEvent(event, data);
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [onEvent]);

  const emit = (event: string, data: any) => {
    socketRef.current?.emit(event, data);
  };

  return { socket: socketRef.current, emit };
};
