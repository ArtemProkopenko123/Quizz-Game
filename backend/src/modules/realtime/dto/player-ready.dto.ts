import { IsString } from 'class-validator';

export class PlayerReadyDto {
  @IsString()
  sessionId!: string;

  @IsString()
  playerId!: string;
}
