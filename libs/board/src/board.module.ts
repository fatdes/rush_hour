import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Board } from './board.model';
import { BoardService } from './board.service';

@Module({
  imports: [SequelizeModule.forFeature([Board])],
  providers: [BoardService],
  exports: [BoardService],
})
export class BoardModule {}
