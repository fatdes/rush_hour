import { CarMoveCommentedEvent } from '@board/board';
import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { MoveCarDto } from './dto/game.dto';
import { PlayerService } from './player.service';

@Controller()
@ApiTags('player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Post('start-game/:boardId')
  async startGame(@Param('boardId') boardId: string): Promise<string> {
    return await this.playerService.startGame({ boardId });
  }

  @Put('move-car/:gameId')
  async moveCar(
    @Param('gameId') gameId: string,
    @Body() dto: MoveCarDto,
  ): Promise<boolean> {
    return await this.playerService.moveCar({ gameId, step: dto });
  }

  @EventPattern('car_move_commented')
  async handleCarMoveCommented(@Payload() data: CarMoveCommentedEvent) {
    this.playerService.handleCarMoveCommented(data);
  }
}
