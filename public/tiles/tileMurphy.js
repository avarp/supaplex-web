import {
  EDIBLE_TILES,
  MURPHY_COMES_FROM_BOTTOM_L,
  MURPHY_COMES_FROM_LEFT,
  MURPHY_COMES_FROM_RIGHT,
  MURPHY_COMES_FROM_TOP_L,
  MURPHY_GOES_DOWN_L,
  MURPHY_GOES_DOWN_R,
  MURPHY_GOES_LEFT,
  MURPHY_GOES_RIGHT,
  MURPHY_GOES_UP_L,
  MURPHY_GOES_UP_R,
  MURPHY_LOOKS_LEFT,
  MURPHY_LOOKS_RIGHT,
  MURPHY_SNAPS_DOWN,
  MURPHY_SNAPS_LEFT,
  MURPHY_SNAPS_RIGHT,
  MURPHY_SNAPS_UP,
  SNAPPABLE_TILES,
  SNAP_ANIMATIONS,
  TILE_SPACE,
} from "./const.js";
import { Tile } from "./tile.js";
import { schedule } from "../utils.js";

export class TileMurphy extends Tile {
  /**
   * @param {GameField} gameField the parent
   * @param {number} offset
   */
  constructor(gameField, offset) {
    super(gameField, offset);
    this.looksLeft = false;
    this.busyCounter = 0;
    this.boundReset = this.reset.bind(this);
  }

  /**
   * Reset after milliseconds
   * @param {number} n
   */
  resetAfter(n) {
    schedule.add(this.boundReset, n);
  }

  /**
   * Start animation
   * @param {number} animation
   */
  startAnimation(animation) {
    schedule.cancel(this.boundReset);
    if (animation == MURPHY_GOES_LEFT || animation == MURPHY_SNAPS_LEFT) {
      this.looksLeft = true;
    } else if (
      animation == MURPHY_GOES_RIGHT ||
      animation == MURPHY_SNAPS_RIGHT
    ) {
      this.looksLeft = false;
    }
    if (animation >= MURPHY_GOES_LEFT && animation <= MURPHY_GOES_UP_R) {
      this.busyCounter = 8;
    }
    super.startAnimation(animation);
  }

  /**
   * Process Murphy tile
   * @param {number} framesNum
   * @param {object} input the keyboard input
   * @void
   */
  process(framesNum, input) {
    let [topTile, rightTile, bottomTile, leftTile] = this.getNeighbors();
    let R = this.looksLeft ? 0 : 1;

    // Continue animation
    if (this.isAnimating()) {
      this.continueAnimation(framesNum);
      if (this.isAnimationEnded()) {
        switch (this.getAnimation()) {
          case MURPHY_GOES_UP_L:
          case MURPHY_GOES_UP_R:
            this.reset();
            this.frame = R ? MURPHY_LOOKS_RIGHT : MURPHY_LOOKS_LEFT;
            this.resetAfter(1000);
            this.swapWith(topTile);
            topTile.replaceWith(TILE_SPACE);
            break;

          case MURPHY_GOES_RIGHT:
            this.reset();
            this.frame = MURPHY_LOOKS_RIGHT;
            this.resetAfter(1000);
            this.skipProcess = true;
            this.swapWith(rightTile);
            rightTile.replaceWith(TILE_SPACE);
            break;

          case MURPHY_GOES_DOWN_L:
          case MURPHY_GOES_DOWN_R:
            this.reset();
            this.frame = R ? MURPHY_LOOKS_RIGHT : MURPHY_LOOKS_LEFT;
            this.resetAfter(1000);
            this.skipProcess = true;
            this.swapWith(bottomTile);
            bottomTile.replaceWith(TILE_SPACE);
            break;

          case MURPHY_GOES_LEFT:
            this.reset();
            this.frame = MURPHY_LOOKS_LEFT;
            this.resetAfter(1000);
            this.swapWith(leftTile);
            leftTile.replaceWith(TILE_SPACE);
            break;
        }
      }
    }

    // Decrease busy counter
    if (this.busyCounter > 0) {
      this.busyCounter -= framesNum;
      if (this.busyCounter < 0) this.busyCounter = 0;
    }

    // Start a new animation
    if (this == this.field.murphy && this.busyCounter == 0) {
      // Snap up
      if (
        input.ArrowUp &&
        input.Space &&
        SNAPPABLE_TILES.includes(topTile?.type)
      ) {
        this.frame = MURPHY_SNAPS_UP;
        this.busyCounter = 8;
        this.resetAfter(500);
        topTile.startAnimation(SNAP_ANIMATIONS[topTile.type]);
      }
      // Snap right
      else if (
        input.ArrowRight &&
        input.Space &&
        SNAPPABLE_TILES.includes(rightTile?.type)
      ) {
        this.frame = MURPHY_SNAPS_RIGHT;
        this.busyCounter = 8;
        this.resetAfter(500);
        rightTile.startAnimation(SNAP_ANIMATIONS[rightTile.type]);
        rightTile.skipProcess = true;
      }
      // Snap down
      else if (
        input.ArrowDown &&
        input.Space &&
        SNAPPABLE_TILES.includes(bottomTile?.type)
      ) {
        this.frame = MURPHY_SNAPS_DOWN;
        this.busyCounter = 8;
        this.resetAfter(500);
        bottomTile.startAnimation(SNAP_ANIMATIONS[bottomTile.type]);
        bottomTile.skipProcess = true;
      }
      // Snap left
      else if (
        input.ArrowLeft &&
        input.Space &&
        SNAPPABLE_TILES.includes(leftTile?.type)
      ) {
        this.frame = MURPHY_SNAPS_LEFT;
        this.busyCounter = 8;
        this.resetAfter(500);
        leftTile.startAnimation(SNAP_ANIMATIONS[leftTile.type]);
      }
      // Go up
      else if (
        input.ArrowUp &&
        !input.Space &&
        EDIBLE_TILES.includes(topTile?.type)
      ) {
        this.startAnimation(MURPHY_GOES_UP_L + R);
        topTile.startAnimation(MURPHY_COMES_FROM_BOTTOM_L + R);
      }
      // Go right
      else if (
        input.ArrowRight &&
        !input.Space &&
        EDIBLE_TILES.includes(rightTile?.type)
      ) {
        this.startAnimation(MURPHY_GOES_RIGHT);
        rightTile.startAnimation(MURPHY_COMES_FROM_LEFT);
        rightTile.skipProcess = true;
      }
      // Go down
      else if (
        input.ArrowDown &&
        !input.Space &&
        EDIBLE_TILES.includes(bottomTile?.type)
      ) {
        this.startAnimation(MURPHY_GOES_DOWN_L + R);
        bottomTile.startAnimation(MURPHY_COMES_FROM_TOP_L + R);
        bottomTile.skipProcess = true;
      }
      // Go left
      else if (
        input.ArrowLeft &&
        !input.Space &&
        EDIBLE_TILES.includes(leftTile?.type)
      ) {
        this.startAnimation(MURPHY_GOES_LEFT);
        leftTile.startAnimation(MURPHY_COMES_FROM_RIGHT);
      }
    }
  }
}
