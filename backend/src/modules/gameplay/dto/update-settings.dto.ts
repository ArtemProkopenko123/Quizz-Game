import { IsInt, IsIn, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  sessionId!: string;

  @IsString()
  playerId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  roundCount?: number;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(10)
  questionsPerRound?: number;

  @IsOptional()
  @IsInt()
  @IsIn([15, 20, 30])
  questionDuration?: number;
}
