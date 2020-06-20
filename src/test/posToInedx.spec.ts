import { positionToIndex } from '../tetris';
test('pos to index', () => {
  expect(positionToIndex({ x: 0, y: 0 }, 10)).toBe(0);
  expect(positionToIndex({ x: 1, y: 0 }, 10)).toBe(1);
  expect(positionToIndex({ x: 3, y: 0 }, 10)).toBe(3);
  expect(positionToIndex({ x: 0, y: 1 }, 10)).toBe(10);
  expect(positionToIndex({ x: 1, y: 1 }, 10)).toBe(11);
  expect(positionToIndex({ x: 10, y: 20 }, 10)).toBe(200);
});
