import {
  Controller,
  Patch,
  Param,
  Body,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlayersService } from './players.service';
import { UpdatePlayerDto } from './dto/update-player.dto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Patch(':playerId')
  updatePlayer(
    @Param('playerId') playerId: string,
    @Body() dto: UpdatePlayerDto,
  ) {
    return this.playersService.updatePlayer(playerId, dto);
  }

  @Post(':playerId/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Param('playerId') playerId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, or WebP images are allowed');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size must not exceed 5 MB');
    }

    // S3 upload is deferred for MVP; store as data URL or skip
    // TODO: integrate S3 upload here when storage is configured
    const avatarUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return this.playersService.setAvatarUrl(playerId, avatarUrl);
  }
}
