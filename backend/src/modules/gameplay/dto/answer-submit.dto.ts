import { IsString, IsInt, Min, Max } from 'class-validator';

export class AnswerSubmitDto {
  @IsString()
  sessionId!: string;

  @IsString()
  playerId!: string;

  @IsString()
  questionId!: string;

  @IsInt()
  @Min(0)
  @Max(3)
  answerIndex!: number;
}
