import { emptyBoard } from '@board/board';
import { getModelToken } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import { Board } from './board.model';
import { BoardService } from './board.service';

describe('BoardService', () => {
  let boardService: BoardService;

  const mockBoardModel = {
    findCreateFind: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: getModelToken(Board),
          useValue: mockBoardModel,
        },
      ],
    }).compile();

    boardService = moduleRef.get<BoardService>(BoardService);
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
      await expect(boardService.createBoard({ raw })).rejects.toThrow(
        'board must be 6x6 number array',
      );
    });

    it('should fail when board has non integer', async () => {
      for (let v = 6; --v >= 0; ) {
        for (let h = 6; --h >= 0; ) {
          const raw = emptyBoard();
          raw[v][h] = v * 10 + h + 0.1;

          await expect(boardService.createBoard({ raw })).rejects.toThrow(
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

          await expect(boardService.createBoard({ raw })).rejects.toThrow(
            `[${v}][${h}] is negative integer`,
          );
        }
      }
    });

    it('should fail when board has no car', async () => {
      const raw = emptyBoard();

      await expect(boardService.createBoard({ raw })).rejects.toThrow(
        `board must have car[1] of size 2 at row 2`,
      );
    });

    describe('should fail when board car[1] is not size 2', () => {
      it('size 1', async () => {
        const raw = emptyBoard();
        raw[2][2] = 1;

        await expect(boardService.createBoard({ raw })).rejects.toThrow(
          `board must have car[1] of size 2 at row 2`,
        );
      });

      it('size 3', async () => {
        const raw = emptyBoard();
        raw[2][0] = 1;
        raw[2][1] = 1;
        raw[2][2] = 1;

        await expect(boardService.createBoard({ raw })).rejects.toThrow(
          `board must have car[1] of size 2 at row 2`,
        );
      });
    });

    it.each([[0], [1], [3], [4], [5]])(
      'should fail when board car[1] is not in row 2',
      async (row) => {
        const raw = emptyBoard();
        raw[row][0] = 1;
        raw[row][1] = 1;

        await expect(boardService.createBoard({ raw })).rejects.toThrow(
          `board must have car[1] of size 2 at row 2`,
        );
      },
    );

    describe('should fail when board car is not placed correctly', () => {
      it('size 2 diagonal', async () => {
        const raw = emptyBoard();
        raw[0][0] = 1;
        raw[1][1] = 1;

        await expect(boardService.createBoard({ raw })).rejects.toThrow(
          `car[1] is not placed correctly`,
        );
      });

      it('size 3 twisted', async () => {
        const raw = emptyBoard();
        raw[0][0] = 1;
        raw[0][1] = 1;
        raw[1][2] = 1;

        await expect(boardService.createBoard({ raw })).rejects.toThrow(
          `car[1] is not placed correctly`,
        );
      });
    });

    describe('should fail when board has invalid car size', () => {
      let raw: number[][];

      beforeEach(() => {
        raw = [
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [1, 1, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
        ];
      });

      it('horizontal, size < 2', async () => {
        raw[0][0] = 2;

        await expect(boardService.createBoard({ raw })).rejects.toThrow(
          `car[2] is invalid size "1"`,
        );
      });

      it('vertical, size < 2', async () => {
        raw[0][5] = 2;

        await expect(boardService.createBoard({ raw })).rejects.toThrow(
          `car[2] is invalid size "1"`,
        );
      });
      it('horizontal, size > 3', async () => {
        raw[0][0] = 2;
        raw[0][1] = 2;
        raw[0][2] = 2;
        raw[0][3] = 2;

        await expect(boardService.createBoard({ raw })).rejects.toThrow(
          `car[2] is invalid size "4"`,
        );
      });

      it('vertical, size > 3', async () => {
        raw[0][5] = 2;
        raw[1][5] = 2;
        raw[2][5] = 2;
        raw[3][5] = 2;

        await expect(boardService.createBoard({ raw })).rejects.toThrow(
          `car[2] is invalid size "4"`,
        );
      });
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

      const board = await boardService.createBoard({ raw });
      expect(board.id).toEqual('OK');
    });
  });
});
