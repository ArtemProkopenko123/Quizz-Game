import { IsString } from 'class-validator';

export class GameStartDto {
  @IsString()
  sessionId!: string;

  @IsString()
  playerId!: string;
}
