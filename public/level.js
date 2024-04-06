import {
  FRAME_DURATION,
  LVL_BORDER_WIDTH,
  LVL_HEIGHT,
  LVL_HEIGHT_PX,
  LVL_VIEWPORT_HEIGHT_PX,
  LVL_VIEWPORT_WIDTH_PX,
  LVL_WIDTH,
  LVL_WIDTH_PX,
  TILE_SIZE,
  constForGlsl,
} from "./const.js";
import {
  MURPHY_GOES_DOWN_L,
  MURPHY_GOES_DOWN_R,
  MURPHY_GOES_LEFT,
  MURPHY_GOES_RIGHT,
  MURPHY_GOES_UP_L,
  MURPHY_GOES_UP_R,
} from "./tiles/const.js";
import { GameField } from "./tiles/gameField.js";
import { clamp, loadImage, readFileText } from "./utils.js";
import { Webgl2D } from "./webgl2d.js";

export class Level {
  /**
   * Create the state object of the level
   * @param {Uint8ClampedArray} tileTypes
   */
  constructor(tileTypes) {
    Object.assign(this, {
      gameField: new GameField(tileTypes),
      screenTop: 0,
      screenLeft: 0,
      input: {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false,
      },
      _onkeyup: (event) => {
        if (event.code in this.input) this.input[event.code] = true;
      },
      _onkeydown: (event) => {
        if (event.code in this.input) this.input[event.code] = false;
      },
    });
    document.addEventListener("keydown", this._onkeyup);
    document.addEventListener("keyup", this._onkeydown);
    this.updateScreenOffset();
  }

  /**
   * Clear event listeners before quit level
   * @void
   */
  destroy() {
    document.removeEventListener("keydown", this._onkeyup);
    document.removeEventListener("keyup", this._onkeydown);
  }

  /**
   * Update screen offset
   * @void
   */
  updateScreenOffset() {
    let murphy = this.gameField.murphy;
    let murphyX = murphy.x * TILE_SIZE + TILE_SIZE / 2 + LVL_BORDER_WIDTH; // center of the tile
    let murphyY = murphy.y * TILE_SIZE + TILE_SIZE / 2 + LVL_BORDER_WIDTH;
    if (murphy.isAnimating()) {
      let delta = (murphy.animationProgress + 1) * 2;
      switch (murphy.getAnimation()) {
        case MURPHY_GOES_RIGHT:
          murphyX += delta;
          break;
        case MURPHY_GOES_LEFT:
          murphyX -= delta;
          break;
        case MURPHY_GOES_DOWN_L:
        case MURPHY_GOES_DOWN_R:
          murphyY += delta;
          break;
        case MURPHY_GOES_UP_L:
        case MURPHY_GOES_UP_R:
          murphyY -= delta;
          break;
      }
    }
    this.screenLeft = Math.round(
      clamp(
        murphyX - LVL_VIEWPORT_WIDTH_PX / 2,
        0,
        LVL_WIDTH_PX - LVL_VIEWPORT_WIDTH_PX
      )
    );
    this.screenTop = Math.round(
      clamp(
        murphyY - LVL_VIEWPORT_HEIGHT_PX / 2,
        0,
        LVL_HEIGHT_PX - LVL_VIEWPORT_HEIGHT_PX
      )
    );
  }

  /**
   * Play the level
   * @param {HTMLCanvasElement} canvas
   * @return {Promise<boolean>}
   */
  play(canvas) {
    return new Promise(async (resolve) => {
      const gl = canvas.getContext("webgl");
      const fixedPng = await loadImage("img/fixed.png");
      const movingPng = await loadImage("img/moving.png");
      const panelPng = await loadImage("img/panel.png");
      const fragmentShader = await readFileText("glsl/level.glsl");
      const levelRenderer = new Webgl2D(gl, fragmentShader, {
        ...constForGlsl,
        uFixedTilesTexture: {
          type: "sampler2D",
          value: fixedPng,
        },
        uAnimationFramesTexture: {
          type: "sampler2D",
          value: movingPng,
        },
        uPanelTexture: {
          type: "sampler2D",
          value: panelPng,
        },
        uPanelHeight: {
          type: "float",
          value: panelPng.height,
        },
        uFixedTilesTextureSize: {
          type: "vec2",
          value: [fixedPng.width, fixedPng.height],
        },
        uAnimationFramesTextureSize: {
          type: "vec2",
          value: [movingPng.width, movingPng.height],
        },
        uLevelTiles: {
          type: "sampler2D",
        },
        uLevelOffset: {
          type: "vec2",
        },
        uScreenSize: {
          type: "vec2",
          value: [canvas.width, canvas.height],
        },
      });
      const render = () => {
        levelRenderer.draw({
          uLevelTiles: {
            data: this.gameField.webglData,
            type: gl.UNSIGNED_BYTE,
            width: LVL_WIDTH,
            height: LVL_HEIGHT,
            format: gl.RGB,
          },
          uLevelOffset: [this.screenLeft, this.screenTop],
        });
        this.gameField.needRedraw = false;
      };
      var timeBefore = performance.now();
      const theLoop = (timeNow) => {
        const framesNum = Math.round((timeNow - timeBefore) / FRAME_DURATION);
        if (framesNum > 0) {
          this.gameField.tiles.forEach((tile) => {
            if (tile.skipProcess) {
              tile.skipProcess = false;
            } else {
              tile.process(framesNum, this.input);
            }
          });
          if (this.gameField.needRedraw) {
            this.updateScreenOffset();
            render();
          }
          timeBefore = timeNow;
        }
        window.requestAnimationFrame(theLoop);
      };
      render();
      window.requestAnimationFrame(theLoop);
    });
  }
}
