import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
  ) {}

  async findByIdOrThrow(playerId: string): Promise<Player> {
    const player = await this.playerRepo.findOneBy({ id: playerId });
    if (!player) throw new NotFoundException('Player not found');
    return player;
  }

  async updatePlayer(playerId: string, dto: UpdatePlayerDto): Promise<Player> {
    const player = await this.findByIdOrThrow(playerId);

    if (dto.name !== undefined) player.name = dto.name;
    if (dto.color !== undefined) player.color = dto.color;

    return this.playerRepo.save(player);
  }

  async setAvatarUrl(playerId: string, avatarUrl: string): Promise<Player> {
    const player = await this.findByIdOrThrow(playerId);
    player.avatarUrl = avatarUrl;
    return this.playerRepo.save(player);
  }

  async findBySessionId(sessionId: string): Promise<Player[]> {
    return this.playerRepo.findBy({ sessionId });
  }
}
