import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { BoardService } from './board.service';

@Controller()
@ApiTags('gm')
export class GMController {
  private readonly logger = new Logger(GMController.name);

  constructor(
    @Inject(BoardService)
    private readonly boardService: BoardService,
  ) {}

  @Post('create-board')
  @ApiBody({
    required: true,
    schema: {
      // references https://docs.nestjs.com/openapi/types-and-parameters#raw-definitions
      type: 'array',
      items: {
        type: 'array',
        items: {
          type: 'number',
        },
      },
      example: [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ],
    },
  })
  @HttpCode(200)
  async createBoard(@Body() raw: number[][]): Promise<string> {
    try {
      const board = await this.boardService.createBoard({ raw });
      return board.id;
    } finally {
      this.logger.log('board created');
    }
  }
}
