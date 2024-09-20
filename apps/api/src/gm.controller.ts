import { BoardService } from '@board/board';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('gm')
export class GMController {
  constructor(private readonly boardService: BoardService) {}

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
    const board = await this.boardService.createBoard({ raw });
    return board.id;
  }
}
