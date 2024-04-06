import { LVL_HEIGHT, LVL_WIDTH, LVL_DATA_LENGTH } from "./const.js";
import { TILE_BASE, TILE_MURPHY } from "./tiles/const.js";

/**
 * Load image
 * @param {string} url
 * @returns {Promise<Image>}
 */
export function loadImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.src = url;
    image.addEventListener("load", () => resolve(image));
  });
}

/**
 * Read binary file
 * @param {string} url
 * @returns {Promise<Uint8ClampedArray>}
 */
export async function readFile(url) {
  const response = await fetch(url);
  return new Uint8ClampedArray(await response.arrayBuffer());
}

/**
 * Read text file
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function readFileText(url) {
  const response = await fetch(url);
  return await response.text();
}

/**
 * Get tiles of the level
 * @param {Uint8ClampedArray} levelsData
 * @param {number} levelIndex
 * @return {Uint8ClampedArray}
 */
export function getLevelTiles(levelsData, levelIndex) {
  let levelData = levelsData.slice(
    levelIndex * LVL_DATA_LENGTH,
    (levelIndex + 1) * LVL_DATA_LENGTH
  );
  for (let row = 0; row < LVL_HEIGHT + 2; row++) {
    if (row == 0 || row == LVL_HEIGHT + 1) continue;
    let target = (row - 1) * LVL_WIDTH,
      start = row * (LVL_WIDTH + 2) + 1,
      end = start + LVL_WIDTH;
    levelData.copyWithin(target, start, end);
  }
  return levelData.slice(0, LVL_WIDTH * LVL_HEIGHT);
}

/**
 * Create empty level
 * @return {Uint8ClampedArray}
 */
export function getEmptyLevel() {
  let levelData = new Uint8ClampedArray(LVL_WIDTH * LVL_HEIGHT).fill(TILE_BASE);
  levelData[0] = TILE_MURPHY;
  return levelData;
}

/**
 * Clamp value in the given range
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Delayed functions scheduler
 */
export const schedule = {
  _timeouts: new Map(),
  /**
   * Schedule a function
   * @param {Function} fn
   * @param {number} delay
   * @void
   */
  add(fn, delay = 0) {
    this.cancel(fn);
    this._timeouts.set(
      fn,
      setTimeout(() => {
        fn();
        this._timeouts.delete(fn);
      }, delay)
    );
  },
  /**
   * Cancel a function execution
   * @param {Function} fn
   * @void
   */
  cancel(fn) {
    if (this._timeouts.has(fn)) {
      clearTimeout(this._timeouts.get(fn));
    }
  },
};
