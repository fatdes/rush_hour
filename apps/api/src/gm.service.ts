import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Board } from './board.model';

import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class GMService {
  private readonly logger = new Logger(GMService.name);

  constructor(
    @InjectModel(Board)
    private boardModel: typeof Board,
  ) {}

  async createBoard({ raw }: { raw: number[][] }): Promise<string> {
    if (
      raw === undefined ||
      !raw.length ||
      raw.length !== 6 ||
      raw.every((r) => r && r.length === 6) === false
    ) {
      throw new UnprocessableEntityException('board must be 6x6 number array');
    }

    this.logger.debug(`creating board ${JSON.stringify({ raw })}`);

    // TODO: more validation on cars (size, position, etc)

    // TODO: normalize
    const h: string = '';
    const v: string = '';
    const hash: string = 'TODO';

    const [board, isNew] = await this.boardModel.findCreateFind({
      where: { hash },
      defaults: {
        h,
        v,
        hash,
      },
    });

    this.logger.log(
      `created board ${JSON.stringify({ id: board.id, hash: board.hash, isNew })}`,
    );

    return board.id;
  }
}
