import { expect, test } from '@playwright/test';

test('simplest board end to end', async ({ request }) => {
  const newBoard = await request.post(`/create-board`, {
    data: [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
  });
  expect(newBoard.ok()).toBeTruthy();
  const boardId = await newBoard.text();
  expect(boardId).toMatch(/BOARD-\d+/);

  const newGame = await request.post(`/start-game/${boardId}`);
  expect(newGame.ok()).toBeTruthy();
  // ulid is 26 character of Crockford's Base32
  expect(await newGame.text()).toMatch(/GAME-[0-9A-HJ-KM-NP-TV-Z]{26}/);
});
