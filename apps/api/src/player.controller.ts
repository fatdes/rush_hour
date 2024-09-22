import { CarMoveCommentedEvent } from '@board/board';
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { GameStateDto, MoveCarDto } from './dto/game.dto';
import { PlayerService } from './player.service';

@Controller()
@ApiTags('player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Post('/start-game/:boardId')
  async startGame(@Param('boardId') boardId: string): Promise<string> {
    return await this.playerService.startGame({ boardId });
  }

  @Get('/game/:gameId')
  async getGameState(@Param('gameId') gameId: string): Promise<GameStateDto> {
    return await this.playerService.getGameState({ gameId });
  }

  @Put('/move-car/:gameId')
  async moveCar(
    @Param('gameId') gameId: string,
    @Body() dto: MoveCarDto,
  ): Promise<boolean> {
    return await this.playerService.moveCar({ gameId, step: dto });
  }

  @EventPattern('car_move_commented')
  async handleCarMoveCommented(@Payload() data: CarMoveCommentedEvent) {
    await this.playerService.handleCarMoveCommented(data);
  }
}
