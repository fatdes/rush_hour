import { MovementDirection } from '@board/board/car';
import { expect, test } from '@playwright/test';

[
  {
    name: 'drive to the right',
    board: [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
    solution: [
      { carId: 1, direction: MovementDirection.Right },
      { carId: 1, direction: MovementDirection.Right },
    ],
  },
  {
    name: 'simple solution',
    board: [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 2, 0, 0, 0],
      [1, 1, 2, 3, 0, 0],
      [0, 0, 0, 3, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
    solution: [
      { carId: 2, direction: MovementDirection.Up },
      { carId: 3, direction: MovementDirection.Down },
      { carId: 1, direction: MovementDirection.Right },
      { carId: 1, direction: MovementDirection.Right },
      { carId: 1, direction: MovementDirection.Right },
      { carId: 1, direction: MovementDirection.Right },
    ],
  },
  {
    name: 'a bit harder',
    board: [
      [2, 2, 2, 0, 0, 3],
      [0, 0, 4, 0, 0, 3],
      [1, 1, 4, 0, 0, 3],
      [5, 0, 4, 0, 6, 6],
      [5, 0, 0, 0, 7, 0],
      [8, 8, 8, 0, 7, 0],
    ],
    solution: [
      { carId: 2, direction: MovementDirection.Right },
      { carId: 2, direction: MovementDirection.Right },
      { carId: 6, direction: MovementDirection.Left },
      { carId: 3, direction: MovementDirection.Down },
      { carId: 2, direction: MovementDirection.Right },
      { carId: 4, direction: MovementDirection.Up },
      { carId: 3, direction: MovementDirection.Down },
      { carId: 6, direction: MovementDirection.Left },
      { carId: 6, direction: MovementDirection.Left },
      { carId: 8, direction: MovementDirection.Right },
      { carId: 5, direction: MovementDirection.Down },
      { carId: 6, direction: MovementDirection.Left },
      { carId: 4, direction: MovementDirection.Down },
      { carId: 4, direction: MovementDirection.Down },
      { carId: 7, direction: MovementDirection.Up },
      { carId: 8, direction: MovementDirection.Right },
      { carId: 8, direction: MovementDirection.Right },
      { carId: 4, direction: MovementDirection.Down },
      { carId: 1, direction: MovementDirection.Right },
      { carId: 1, direction: MovementDirection.Right },
      { carId: 1, direction: MovementDirection.Right },
      { carId: 4, direction: MovementDirection.Up },
      { carId: 8, direction: MovementDirection.Left },
      { carId: 3, direction: MovementDirection.Down },
      { carId: 1, direction: MovementDirection.Right },
    ],
  },
].forEach(({ name, board, solution }) => {
  test(`end to end - ${name}`, async ({ request }) => {
    const newBoard = await request.post(`/create-board`, {
      data: board,
    });
    expect(newBoard.ok()).toBeTruthy();
    const boardId = await newBoard.text();
    expect(boardId).toMatch(/BOARD-\d+/);

    const newGame = await request.post(`/start-game/${boardId}`);
    expect(newGame.ok()).toBeTruthy();
    const gameId = await newGame.text();
    // ulid is 26 character of Crockford's Base32
    expect(gameId).toMatch(/GAME-[0-9A-HJ-KM-NP-TV-Z]{26}/);

    for (let i = 0; i < solution.length; i++) {
      const result = await request.put(`/move-car/${gameId}`, {
        data: solution[i],
      });
      expect(result.ok()).toBeTruthy();
      expect(await result.text()).toEqual(
        i === solution.length - 1 ? 'true' : 'false',
      );
    }
  });
});
