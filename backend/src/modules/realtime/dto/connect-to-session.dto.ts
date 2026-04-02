import { IsString } from 'class-validator';

export class ConnectToSessionDto {
  @IsString()
  sessionId!: string;

  @IsString()
  playerId!: string;

  @IsString()
  reconnectToken!: string;
}
