import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../sessions/session.entity';
import { Player } from '../players/player.entity';
import { Round } from './round.entity';
import { Answer } from './answer.entity';
import { QuestionsModule } from '../questions/questions.module';
import { GameplayService } from './gameplay.service';
import { GameplayGateway } from './gameplay.gateway';
import { ScoringService } from './scoring.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Player, Round, Answer]),
    forwardRef(() => QuestionsModule),
  ],
  providers: [GameplayService, GameplayGateway, ScoringService],
  exports: [GameplayService, GameplayGateway],
})
export class GameplayModule {}
