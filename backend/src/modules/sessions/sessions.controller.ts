import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { QuestionsService } from '../questions/questions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JoinSessionDto } from './dto/join-session.dto';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly questionsService: QuestionsService,
  ) {}

  @Get('packs')
  listPacks() {
    return this.questionsService.listPacks();
  }

  @Post()
  createSession(@Body() dto: CreateSessionDto) {
    return this.sessionsService.createSession(dto);
  }

  @Post(':code/join')
  joinSession(@Param('code') code: string, @Body() dto: JoinSessionDto) {
    return this.sessionsService.joinSession(code, dto);
  }
}
