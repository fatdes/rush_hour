import { getModelToken } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import { Board } from './board.model';
import { GMService } from './gm.service';

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
      try {
        await gmService.createBoard({ raw });
        fail('no exception is thrown, something is wrong');
      } catch (err) {
        expect(err.getResponse().message).toEqual(
          'board must be 6x6 number array',
        );
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

      const id = await gmService.createBoard({ raw });
      expect(id).toEqual('OK');
    });
  });
});
