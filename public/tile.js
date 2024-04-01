import { LVL_WIDTH } from "./const.js";

export const [
  TILE_SPACE,
  TILE_ZONK,
  TILE_BASE,
  TILE_MURPHY,
  TILE_INFOTRON,
  TILE_CHIP,
  TILE_HARDWARE,
  TILE_EXIT,
  TILE_ORANGE_DISK,
  TILE_PORT_RIGHT,
  TILE_PORT_DOWN,
  TILE_PORT_LEFT,
  TILE_PORT_UP,
  TILE_S_PORT_RIGHT,
  TILE_S_PORT_DOWN,
  TILE_S_PORT_LEFT,
  TILE_S_PORT_UP,
  TILE_SNIK_SNAK,
  TILE_YELLOW_DISK,
  TILE_TERMINAL,
  TILE_RED_DISK,
  TILE_PORT_VERTICAL,
  TILE_PORT_HORIZONTAL,
  TILE_PORT_4WAY,
  TILE_ELECTRON,
  TILE_BUG,
  TILE_CHIP_LEFT,
  TILE_CHIP_RIGHT,
  TILE_HARDWARE2,
  TILE_HARDWARE3,
  TILE_HARDWARE4,
  TILE_HARDWARE5,
  TILE_HARDWARE6,
  TILE_HARDWARE7,
  TILE_HARDWARE8,
  TILE_HARDWARE9,
  TILE_HARDWARE10,
  TILE_HARDWARE11,
  TILE_CHIP_TOP,
  TILE_CHIP_BOTTOM,
] = Array(40)
  .fill(0)
  .map((_, i) => i);

export const MURPHY_LOOKS_LEFT = [32, 32],
  MURPHY_LOOKS_RIGHT = [64, 32];

export const [
  MURPHY_COMES_FROM_RIGHT,
  MURPHY_COMES_FROM_LEFT,
  MURPHY_COMES_FROM_TOP_L,
  MURPHY_COMES_FROM_TOP_R,
  MURPHY_COMES_FROM_BOTTOM_L,
  MURPHY_COMES_FROM_BOTTOM_R,
  MURPHY_GOES_LEFT,
  MURPHY_GOES_RIGHT,
  MURPHY_GOES_DOWN_L,
  MURPHY_GOES_DOWN_R,
  MURPHY_GOES_UP_L,
  MURPHY_GOES_UP_R,
] = Array(12)
  .fill(0)
  .map((_, i) => i);

// prettier-ignore
const animationFrames = [
  [144,0, 160,0, 176,0, 192,0, 208,0, 224,0, 240,0],       // MURPHY_COMES_FROM_RIGHT
  [144,16, 160,16, 176,16, 192,16, 208,16, 224,16, 240,16],// MURPHY_COMES_FROM_LEFT
  [144,32, 160,32, 176,32, 192,32, 208,32, 224,32, 240,32],// MURPHY_COMES_FROM_TOP_L
  [144,48, 160,48, 176,48, 192,48, 208,48, 224,48, 240,48],// MURPHY_COMES_FROM_TOP_R
  [144,64, 160,64, 176,64, 192,64, 208,64, 224,64, 240,64],// MURPHY_COMES_FROM_BOTTOM_L
  [144,80, 160,80, 176,80, 192,80, 208,80, 224,80, 240,80],// MURPHY_COMES_FROM_BOTTOM_R
  [18,16, 20,16, 54,16, 56,16, 90,16, 92,16, 46,32],// MURPHY_GOES_LEFT
  [14,48, 12,48, 42,48, 40,48, 70,48, 68,48, 50,32],// MURPHY_GOES_RIGHT
  [16,14, 16,12, 48,10, 48,8, 80,6, 80,4, 32,18],   // MURPHY_GOES_DOWN_L
  [16,46, 16,44, 48,42, 48,40, 80,38, 80,36, 64,18],// MURPHY_GOES_DOWN_R
  [16,18, 16,20, 48,22, 48,24, 80,26, 80,28, 32,46],// MURPHY_GOES_TOP_L
  [16,50, 16,52, 48,54, 48,56, 80,58, 80,60, 64,46],// MURPHY_GOES_TOP_R
];

export class Tiles {
  constructor(tileTypes) {
    this.webglTileState = new Uint8ClampedArray(tileTypes.length * 3).fill(0);
    this.tiles = [];
    tileTypes.forEach((tileType, i) => {
      this.webglTileState[i * 3] = tileType;
      this.tiles.push(new Tile(this.webglTileState, i * 3, this));
    });
    this.needRedraw = false;
  }

  /**
   * Get tile by coordinates
   * @param {number} x
   * @param {number} y
   * @returns {Tile}
   */
  get(x, y) {
    return this.tiles[y * LVL_WIDTH + x];
  }

  /**
   * Get Murphy
   * @return {Tile|undefined}
   */
  getMurphy() {
    for (let tile of this.tiles) {
      if (tile.type == TILE_MURPHY) return tile;
    }
  }
}

export class Tile {
  /**
   * @param {Uint8ClampedArray} webglTileState
   * @param {number} offset
   * @param {Tiles} tiles the parent
   */
  constructor(webglTileState, offset, tiles) {
    this.webglTileState = webglTileState;
    this._offset = offset;
    this._animation = undefined;
    this._animationProgress = -1;
    this._tiles = tiles;
  }

  get x() {
    return (this._offset / 3) % LVL_WIDTH;
  }

  get y() {
    return Math.floor(this._offset / 3 / LVL_WIDTH);
  }

  get frame() {
    return [
      this.webglTileState[this._offset + 1],
      this.webglTileState[this._offset + 2],
    ];
  }

  set frame([x, y]) {
    this.webglTileState[this._offset + 1] = x;
    this.webglTileState[this._offset + 2] = y;
    this._tiles.needRedraw = true;
  }

  get type() {
    return this.webglTileState[this._offset];
  }

  set type(value) {
    this.webglTileState[this._offset] = value;
    this.frame = [0, 0];
    this._animation = undefined;
    this._animationProgress = -1;
    this._tiles.needRedraw = true;
  }

  /**
   * Check if animation is started
   * @return {boolean}
   */
  isAnimating() {
    return this._animationProgress >= 0;
  }

  /**
   * Check if animation is ended
   * @return {boolean}
   */
  isAnimationEnded() {
    return this._animationProgress == -1;
  }

  /**
   * Get animation
   */
  getAnimation() {
    return this._animation;
  }

  /**
   * Start animation
   * @param {number} animation
   */
  startAnimation(animation) {
    this._animation = animation;
    this._animationProgress = 0;
    let frames = animationFrames[this._animation];
    this.frame = [frames[0], frames[1]];
    this._tiles.needRedraw = true;
  }

  /**
   * Forward animation to n frames
   * @param {number} n
   * @void
   */
  continueAnimation(n) {
    if (!this.isAnimating()) throw Error("Animation wasn't started yet.");
    let nextFrameIndex = (this._animationProgress + n) * 2;
    let frames = animationFrames[this._animation];
    if (nextFrameIndex >= frames.length) {
      this._animationProgress = -1;
    } else {
      this._animationProgress += n;
      this.frame = [frames[nextFrameIndex], frames[nextFrameIndex + 1]];
    }
    this._tiles.needRedraw = true;
  }
}
