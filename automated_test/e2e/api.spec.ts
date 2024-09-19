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

test('a bit harder board end to end', async ({ request }) => {
  const newBoard = await request.post(`/create-board`, {
    data: [
      [2, 2, 2, 0, 0, 3],
      [0, 0, 4, 0, 0, 3],
      [1, 1, 4, 0, 0, 3],
      [5, 0, 4, 0, 6, 6],
      [5, 0, 0, 0, 7, 0],
      [8, 8, 8, 0, 7, 0],
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
