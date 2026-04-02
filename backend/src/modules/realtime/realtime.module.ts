import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../sessions/session.entity';
import { Player } from '../players/player.entity';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Player])],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
