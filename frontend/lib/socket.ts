import { io, type Socket } from 'socket.io-client';
import { getWsUrl } from '@/lib/public-origin';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getWsUrl(), {
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
