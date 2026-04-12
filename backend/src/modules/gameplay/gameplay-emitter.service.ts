import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class GameplayEmitterService {
  private server!: Server;

  setServer(server: Server): void {
    this.server = server;
  }

  emitToSession(sessionId: string, event: string, data: unknown): void {
    this.server.to(sessionId).emit(event, data);
  }
}
