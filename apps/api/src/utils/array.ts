export function emptyBoard(): number[][] {
  return new Array(6).fill([]).map(() => new Array(6).fill(0));
}
