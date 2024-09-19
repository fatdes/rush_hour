import { Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlayerService } from './player.service';

@Controller()
@ApiTags('player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Post('start-game/:boardId')
  async startGame(@Param('boardId') boardId: string): Promise<string> {
    return await this.playerService.startGame({ boardId });
  }
}
