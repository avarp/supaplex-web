import { Tile } from "./tile.js";

export class TileSpace extends Tile {
  /**
   * @param {GameField} gameField the parent
   * @param {number} offset
   */
  constructor(gameField, offset) {
    super(gameField, offset);
  }

  /**
   * Process space tile
   * @param {number} framesNum
   * @void
   */
  process(framesNum) {
    if (this.isAnimating()) {
      this.continueAnimation(framesNum);
    }
  }
}
