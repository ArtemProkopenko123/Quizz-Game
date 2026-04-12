import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class JoinSessionDto {
  @IsString()
  @Length(1, 64)
  playerName!: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color' })
  playerColor!: string;

  @IsOptional()
  @IsString()
  playerAvatarUrl?: string;
}
