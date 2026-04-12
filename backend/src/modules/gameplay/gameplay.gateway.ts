import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameplayService } from './gameplay.service';
import { GameplayEmitterService } from './gameplay-emitter.service';
import { GameStartDto } from './dto/game-start.dto';
import { AnswerSubmitDto } from './dto/answer-submit.dto';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameplayGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GameplayGateway.name);

  constructor(
    private readonly gameplayService: GameplayService,
    private readonly emitter: GameplayEmitterService,
  ) {}

  afterInit(server: Server): void {
    this.emitter.setServer(server);
  }

  @SubscribeMessage('game:start')
  async handleGameStart(
    @ConnectedSocket() _socket: Socket,
    @MessageBody() payload: GameStartDto,
  ) {
    try {
      await this.gameplayService.startGame(payload.sessionId, payload.playerId);
      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`game:start failed: ${message}`);
      return { code: 'FORBIDDEN', message };
    }
  }

  @SubscribeMessage('answer:submit')
  async handleAnswerSubmit(
    @ConnectedSocket() _socket: Socket,
    @MessageBody() payload: AnswerSubmitDto,
  ) {
    const result = await this.gameplayService.submitAnswer(
      payload.sessionId,
      payload.playerId,
      payload.questionId,
      payload.answerIndex,
    );

    if (result.accepted) {
      return { event: 'answer:accepted', data: { scoreDelta: result.scoreDelta } };
    }
    return { event: 'answer:rejected', data: { code: result.error, message: result.error } };
  }
}
