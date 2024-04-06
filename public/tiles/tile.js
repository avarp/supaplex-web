import { LVL_WIDTH } from "../const.js";
import { animationFrames } from "./const.js";

export class Tile {
  /**
   * @param {GameField} gameField the parent of this tile
   * @param {number} offset the data offset
   */
  constructor(gameField, offset) {
    this.offset = offset;
    this.animation = undefined;
    this.animationProgress = -1;
    this.field = gameField;
    this.skipProcess = false;
  }

  /**
   * Get X position within the game field
   */
  get x() {
    return (this.offset / 3) % LVL_WIDTH;
  }

  /**
   * Get Y position within the game field
   */
  get y() {
    return Math.floor(this.offset / 3 / LVL_WIDTH);
  }

  /**
   * Get animation frame
   */
  get frame() {
    return [
      this.field.webglData[this.offset + 1],
      this.field.webglData[this.offset + 2],
    ];
  }

  /**
   * Set animation frame
   */
  set frame([x, y]) {
    this.field.webglData[this.offset + 1] = x;
    this.field.webglData[this.offset + 2] = y;
    this.field.needRedraw = true;
  }

  /**
   * Get the type, one of TILE_* constants
   */
  get type() {
    return this.field.webglData[this.offset];
  }

  /**
   * Get neighbor tiles: top, left, right, bottom
   * @return {Array<Tile?>}
   */
  getNeighbors() {
    let x = this.x,
      y = this.y;
    return [
      this.field.get(x, y - 1),
      this.field.get(x + 1, y),
      this.field.get(x, y + 1),
      this.field.get(x - 1, y),
    ];
  }

  /**
   * Swap this tile with other one
   * @param {Tile} otherOne
   * @void
   */
  swapWith(otherOne) {
    // Modify WebGL state
    let thisType = this.field.webglData[this.offset],
      thisFrameX = this.field.webglData[this.offset + 1],
      thisFrameY = this.field.webglData[this.offset + 2];
    this.field.webglData[this.offset] = this.field.webglData[otherOne.offset];
    this.field.webglData[this.offset + 1] =
      this.field.webglData[otherOne.offset + 1];
    this.field.webglData[this.offset + 2] =
      this.field.webglData[otherOne.offset + 2];
    this.field.webglData[otherOne.offset] = thisType;
    this.field.webglData[otherOne.offset + 1] = thisFrameX;
    this.field.webglData[otherOne.offset + 2] = thisFrameY;
    // Swap tiles
    this.field.tiles[Math.round(otherOne.offset / 3)] = this;
    this.field.tiles[Math.round(this.offset / 3)] = otherOne;
    // Swap offset fields
    let thisOffset = this.offset;
    this.offset = otherOne.offset;
    otherOne.offset = thisOffset;
    // Ask to redraw
    this.field.needRedraw = true;
  }

  /**
   * Replace with the other tile type
   * @param {number} tileType
   * @return {Tile} the new tile
   */
  replaceWith(tileType) {
    this.field.webglData[this.offset] = tileType;
    this.field.webglData[this.offset + 1] = 0;
    this.field.webglData[this.offset + 2] = 0;
    this.field.needRedraw = true;
    return (this.field.tiles[Math.round(this.offset / 3)] =
      this.field.createTile(this.offset));
  }

  /**
   * Check if animation is started
   * @return {boolean}
   */
  isAnimating() {
    return this.animationProgress >= 0;
  }

  /**
   * Check if animation is ended
   * @return {boolean}
   */
  isAnimationEnded() {
    return this.animationProgress == -1;
  }

  /**
   * Get animation
   */
  getAnimation() {
    return this.animation;
  }

  /**
   * Start animation
   * @param {number} animation
   */
  startAnimation(animation) {
    this.animation = animation;
    this.animationProgress = 0;
    let frames = animationFrames[this.animation];
    this.frame = [frames[0], frames[1]];
    this.field.needRedraw = true;
  }

  /**
   * Reset tile
   * @void
   */
  reset() {
    this.animation = undefined;
    this.animationProgress = -1;
    this.frame = [0, 0];
    this.skipProcess = false;
    this.field.needRedraw = true;
  }

  /**
   * Forward animation to n frames
   * @param {number} n
   * @void
   */
  continueAnimation(n) {
    if (!this.isAnimating()) throw Error("Animation wasn't started yet.");
    let nextFrameIndex = (this.animationProgress + n) * 2;
    let frames = animationFrames[this.animation];
    if (nextFrameIndex >= frames.length) {
      this.animationProgress = -1;
    } else {
      this.animationProgress += n;
      this.frame = [frames[nextFrameIndex], frames[nextFrameIndex + 1]];
    }
    this.field.needRedraw = true;
  }

  /**
   * Process the tile
   * @param {number} framesNum
   * @param {object} input the keyboard input
   * @void
   */
  process(framesNum, input) {}
}
