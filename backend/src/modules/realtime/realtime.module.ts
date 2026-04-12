import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../sessions/session.entity';
import { Player } from '../players/player.entity';
import { Round } from '../gameplay/round.entity';
import { Answer } from '../gameplay/answer.entity';
import { QuestionsModule } from '../questions/questions.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Player, Round, Answer]), QuestionsModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
