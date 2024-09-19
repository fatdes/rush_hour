import { getModelToken } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import { Board } from './board.model';
import { GMService } from './gm.service';
import { emptyBoard } from './utils/array';

describe('GMService', () => {
  let gmService: GMService;

  const mockBoardModel = {
    findCreateFind: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GMService,
        {
          provide: getModelToken(Board),
          useValue: mockBoardModel,
        },
      ],
    }).compile();

    gmService = moduleRef.get<GMService>(GMService);
  });

  describe('createBoard', () => {
    it.each([
      ['1x1', [[1], [1]]],
      [
        '2x2',
        [
          [1, 1],
          [0, 0],
        ],
      ],
      [
        '6x7',
        [
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
        ],
      ],
      [
        '7x6',
        [
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
        ],
      ],
      [
        '7x7',
        [
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0],
        ],
      ],
    ])('should fail when board is %s', async (_, raw) => {
      await expect(gmService.createBoard({ raw })).rejects.toThrow(
        'board must be 6x6 number array',
      );
    });

    it('should fail when board has non integer', async () => {
      for (let v = 6; --v >= 0; ) {
        for (let h = 6; --h >= 0; ) {
          const raw = emptyBoard();
          raw[v][h] = v * 10 + h + 0.1;

          await expect(gmService.createBoard({ raw })).rejects.toThrow(
            `[${v}][${h}] is not an integer`,
          );
        }
      }
    });

    it('should fail when board has negative integer', async () => {
      for (let v = 6; --v >= 0; ) {
        for (let h = 6; --h >= 0; ) {
          const raw = emptyBoard();
          raw[v][h] = -1;

          await expect(gmService.createBoard({ raw })).rejects.toThrow(
            `[${v}][${h}] is negative integer`,
          );
        }
      }
    });

    it.each([
      [
        'simplest',
        [
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [1, 1, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
        ],
      ],
      [
        'a bit harder',
        [
          [2, 2, 2, 0, 0, 3],
          [0, 0, 4, 0, 0, 3],
          [1, 1, 4, 0, 0, 3],
          [5, 0, 4, 0, 6, 6],
          [5, 0, 0, 0, 7, 0],
          [8, 8, 8, 0, 7, 0],
        ],
      ],
    ])('should pass when board is 6x6, %s', async (_, raw) => {
      jest
        .spyOn(mockBoardModel, 'findCreateFind')
        .mockReturnValue([{ id: 'OK' }, false]);

      const board = await gmService.createBoard({ raw });
      expect(board.id).toEqual('OK');
    });
  });
});
