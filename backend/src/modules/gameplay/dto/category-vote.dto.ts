import { IsString } from 'class-validator';

export class CategoryVoteDto {
  @IsString()
  sessionId!: string;

  @IsString()
  playerId!: string;

  @IsString()
  packId!: string;
}
