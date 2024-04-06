import { BASE_SNAPS, TILE_SPACE } from "./const.js";
import { Tile } from "./tile.js";

export class TileBase extends Tile {
  /**
   * @param {GameField} gameField the parent
   * @param {number} offset
   */
  constructor(gameField, offset) {
    super(gameField, offset);
  }

  /**
   * Process Base tile
   * @param {number} framesNum
   * @void
   */
  process(framesNum) {
    if (this.isAnimating()) {
      this.continueAnimation(framesNum);
      if (this.isAnimationEnded() && this.getAnimation() == BASE_SNAPS) {
        this.replaceWith(TILE_SPACE);
      }
    }
  }
}
