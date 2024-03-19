export const TILE_SPACE = 0,
  TILE_ZONK = 1,
  TILE_BASE = 2,
  TILE_MURPHY = 3,
  TILE_INFOTRON = 4,
  TILE_CHIP = 5,
  TILE_HARDWARE = 6,
  TILE_EXIT = 7,
  TILE_ORANGE_DISK = 8,
  TILE_PORT_RIGHT = 9,
  TILE_PORT_DOWN = 10,
  TILE_PORT_LEFT = 11,
  TILE_PORT_UP = 12,
  TILE_S_PORT_RIGHT = 13,
  TILE_S_PORT_DOWN = 14,
  TILE_S_PORT_LEFT = 15,
  TILE_S_PORT_UP = 16,
  TILE_SNIK_SNAK = 17,
  TILE_YELLOW_DISK = 18,
  TILE_TERMINAL = 19,
  TILE_RED_DISK = 20,
  TILE_PORT_VERTICAL = 21,
  TILE_PORT_HORIZONTAL = 22,
  TILE_PORT_4WAY = 23,
  TILE_ELECTRON = 24,
  TILE_BUG = 25,
  TILE_CHIP_LEFT = 26,
  TILE_CHIP_RIGHT = 27,
  TILE_HARDWARE2 = 28,
  TILE_HARDWARE3 = 29,
  TILE_HARDWARE4 = 30,
  TILE_HARDWARE5 = 31,
  TILE_HARDWARE6 = 32,
  TILE_HARDWARE7 = 33,
  TILE_HARDWARE8 = 34,
  TILE_HARDWARE9 = 35,
  TILE_HARDWARE10 = 36,
  TILE_HARDWARE11 = 37,
  TILE_CHIP_TOP = 38,
  TILE_CHIP_BOTTOM = 39;

// prettier-ignore
const animations = {
  [TILE_SPACE]:{
    murphyComesFromRight: [144,0, 160,0, 176,0, 192,0, 208,0, 224,0, 240,0],
    murphyComesFromLeft:[144,16, 160,16, 176,16, 192,16, 208,16, 224,16, 240,16],
    murphyComesFromTopL: [144,32, 160,32, 176,32, 192,32, 208,32, 224,32, 240,32],
    murphyComesFromTopR: [144,48, 160,48, 176,48, 192,48, 208,48, 224,48, 240,48],
    murphyComesFromBottomL: [144,64, 160,64, 176,64, 192,64, 208,64, 224,64, 240,64],
    murphyComesFromBottomR: [144,80, 160,80, 176,80, 192,80, 208,80, 224,80, 240,80],
  },
  [TILE_BASE]:{
    eatenFromRight: [144,0, 160,0, 176,0, 192,0, 208,0, 224,0, 240,0],
    eatenFromLeft:[144,16, 160,16, 176,16, 192,16, 208,16, 224,16, 240,16],
    eatenFromTopL: [144,32, 160,32, 176,32, 192,32, 208,32, 224,32, 240,32],
    eatenFromTopR: [144,48, 160,48, 176,48, 192,48, 208,48, 224,48, 240,48],
    eatenFromBottomL: [144,64, 160,64, 176,64, 192,64, 208,64, 224,64, 240,64],
    eatenFromBottomR: [144,80, 160,80, 176,80, 192,80, 208,80, 224,80, 240,80],
    eatenDistantly: [144,112, 160,112, 176,112, 192,112, 208,112, 224,112, 240,112],
  },
  [TILE_MURPHY]: {
    goesLeft: [18,16, 20,16, 52,16, 54,16, 90,16, 92,16, 46,32],
    goesRight: [14,48, 12,48, 42,48, 40,48, 70,48, 68,48, 50,32],
    goesDownL: [16,14, 16,12, 48,10, 48,8, 80,6, 80,4, 32,18],
    goesDownR: [16,46, 16,44, 48,42, 48,40, 80,38, 80,36, 64,18],
    goesUpL: [16,18, 16,20, 48,22, 48,24, 80,26, 80,28, 32,46],
    goesUpR: [16,50, 16,52, 48,54, 48,56, 80,58, 80,60, 64,46],
  }
}

export class Tile {
  /**
   * @param {Uint8ClampedArray} tiles
   * @param {number} type
   * @param {{x: number, y: number}} frame
   * @param {number} x
   * @param {number} y
   */
  constructor(tiles, type, frame, x, y) {
    this.tiles = tiles;
    this.type = type;
    this.frame = frame;
    this.x = x;
    this.y = y;
  }

  /**
   * Read tile from the tiles array
   * @param {Uint8ClampedArray} tiles
   * @param {number} x
   * @param {number} y
   * @returns {Tile?}
   */
  static read(tiles, x, y) {
    if (x < 0 || y < 0 || x >= LVL_WIDTH || x >= LVL_HEIGHT) return;
    let offset = (y * LVL_WIDTH + x) * 3;
    return new Tile(
      tiles,
      tiles[offset],
      { x: tiles[offset + 1], y: tiles[offset + 2] },
      x,
      y
    );
  }

  /**
   * Save tile to the tiles array
   * @void
   */
  write() {
    if (x < 0 || y < 0 || x >= LVL_WIDTH || x >= LVL_HEIGHT) return;
    let offset = (y * LVL_WIDTH + x) * 3;
    this.tiles[offset] = this.type;
    this.tiles[offset + 1] = this.frame.x;
    this.tiles[offset + 2] = this.frame.y;
  }

  /**
   * Check is this tile is animating
   * @return {boolean}
   */
  isAnimating() {
    return this.frame.x + this.frame.y > 0;
  }

  /**
   * Get animation type
   * @return {number|undefined} animation type
   */
  getAnimationType() {
    if (!this.isAnimating()) return;
    let [firstAnimation, lastAnimation] = animationsByType[this.type];
    for (let n = firstAnimation; n <= lastAnimation; n++) {
      let [firstFrame, lastFrame] = getAnimation(n);
      if (this.frame >= firstFrame && this.frame <= lastFrame) return n;
    }
  }

  /**
   * Continue animation to n frames forward
   * @param {number} n
   */
  continueAnimation(n) {
    if (!this.isAnimating()) return;
    var animationType = this.getAnimationType();
    while (1) {
      let [firstFrame, lastFrame, nextAnimation] = getAnimation(animationType);
      if (this.frame + n <= lastFrame) {
        this.frame += n;
        return;
      }
      if (!nextAnimation) {
        this.frame = 0;
        return;
      }
      animationType = nextAnimation;
      this.frame;
    }
  }
}
