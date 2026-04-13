import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @Length(1, 64)
  hostName!: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color' })
  hostColor!: string;

  @IsOptional()
  @IsString()
  hostAvatarUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  questionPackId?: string;
}
