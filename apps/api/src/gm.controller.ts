import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { GMService } from './gm.service';

@Controller()
@ApiTags('gm')
export class GMController {
  constructor(private readonly gmService: GMService) {}

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
    return await this.gmService.createBoard({ raw });
  }
}
