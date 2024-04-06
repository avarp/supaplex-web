import { LVL_HEIGHT, LVL_WIDTH } from "../const.js";
import { TILE_BASE, TILE_MURPHY, TILE_SPACE } from "./const.js";
import { Tile } from "./tile.js";
import { TileBase } from "./tileBase.js";
import { TileMurphy } from "./tileMurphy.js";
import { TileSpace } from "./tileSpace.js";

export class GameField {
  /**
   * Create a game field
   * @param {Uint8ClampedArray} tileTypes
   */
  constructor(tileTypes) {
    this.webglData = new Uint8ClampedArray(tileTypes.length * 3).fill(0);
    this.tiles = [];
    this.murphy = null;
    tileTypes.forEach((tileType, i) => {
      this.webglData[i * 3] = tileType;
      let tile = this.createTile(i * 3);
      if (!this.murphy && tile instanceof TileMurphy) this.murphy = tile;
      this.tiles.push(tile);
    });
    this.needRedraw = false;
  }

  /**
   * Create a tile
   * @param {number} offset
   * @return {Tile}
   */
  createTile(offset) {
    let tileType = this.webglData[offset];
    switch (tileType) {
      case TILE_SPACE:
        return new TileSpace(this, offset);
      case TILE_BASE:
        return new TileBase(this, offset);
      case TILE_MURPHY:
        return new TileMurphy(this, offset);
      default:
        return new Tile(this, offset);
    }
  }

  /**
   * Get tile by coordinates
   * @param {number} x
   * @param {number} y
   * @returns {Tile?}
   */
  get(x, y) {
    if (x < 0 || x >= LVL_WIDTH || y < 0 || y >= LVL_HEIGHT) return null;
    return this.tiles[y * LVL_WIDTH + x];
  }
}
