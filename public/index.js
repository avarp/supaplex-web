import {
  TILE_SPACE,
  TILE_MURPHY,
  Tiles,
  TILE_BASE,
  MURPHY_COMES_FROM_LEFT,
  MURPHY_COMES_FROM_TOP_L,
  MURPHY_GOES_UP_L,
  MURPHY_GOES_UP_R,
  MURPHY_COMES_FROM_BOTTOM_L,
  MURPHY_GOES_DOWN_L,
  MURPHY_GOES_DOWN_R,
  MURPHY_GOES_LEFT,
  MURPHY_COMES_FROM_RIGHT,
  MURPHY_GOES_RIGHT,
  MURPHY_LOOKS_LEFT,
  MURPHY_LOOKS_RIGHT,
} from "./tile.js";
import {
  LVL_HEIGHT,
  LVL_WIDTH,
  LVL_WIDTH_PX,
  LVL_HEIGHT_PX,
  constForGlsl,
  UP,
  DOWN,
  LEFT,
  RIGHT,
  NONE,
  TILE_SIZE,
  LVL_BORDER_WIDTH,
} from "./const.js";
import { clamp, getEmptyLevel, loadImage, readFileText } from "./utils.js";
import { Webgl2D } from "./webgl2d.js";

async function main() {
  const canvas = document.querySelector("canvas");
  const gl = canvas.getContext("webgl");
  const fixedPng = await loadImage("img/fixed.png");
  const movingPng = await loadImage("img/moving.png");
  const panelPng = await loadImage("img/panel.png");
  const fragmentShader = await readFileText("glsl/level.glsl");

  const fixedTilesProgram = new Webgl2D(gl, fragmentShader, {
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

  let tiles = new Tiles(getEmptyLevel());
  const levelState = {
    tiles,
    murphy: {
      tile: tiles.getMurphy(),
      looksLeft: true,
      resetFrameTimeout: null,
    },
    screenTop: 0,
    screenLeft: 0,
    kbd: {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      Space: false,
    },
  };
  window.levelState = levelState;

  canvas.focus();
  window.addEventListener("keydown", function (event) {
    if (event.code in levelState.kbd) levelState.kbd[event.code] = true;
  });
  window.addEventListener("keyup", function (event) {
    if (event.code in levelState.kbd) levelState.kbd[event.code] = false;
  });

  function drawLevel() {
    fixedTilesProgram.draw({
      uLevelTiles: {
        data: levelState.tiles.webglTileState,
        type: gl.UNSIGNED_BYTE,
        width: LVL_WIDTH,
        height: LVL_HEIGHT,
        format: gl.RGB,
      },
      uLevelOffset: [levelState.screenLeft, levelState.screenTop],
    });
  }
  drawLevel();

  var timeBefore = performance.now();
  const frameLength = 35; //ms
  function theLoop(timeNow) {
    const framesNum = Math.round((timeNow - timeBefore) / frameLength);
    if (framesNum > 0) {
      levelState.tiles.needRedraw = false;
      for (let y = 0; y < LVL_HEIGHT; y++) {
        for (let x = 0; x < LVL_WIDTH; x++) {
          let thisTile = levelState.tiles.get(x, y);
          let leftTile = x > 0 ? levelState.tiles.get(x - 1, y) : null;
          let topTile = y > 0 ? levelState.tiles.get(x, y - 1) : null;
          let R = levelState.murphy.looksLeft ? 0 : 1;

          switch (thisTile.type) {
            case TILE_MURPHY:
              if (thisTile.isAnimating()) {
                thisTile.continueAnimation(framesNum);
                if (thisTile.isAnimationEnded()) {
                  // For now all animations are moving animations
                  thisTile.type = TILE_SPACE; // Animation ended - Murphy is gone
                }
              } else if (thisTile == levelState.murphy.tile) {
                if (levelState.kbd.ArrowUp && y > 0) {
                  thisTile.startAnimation(MURPHY_GOES_UP_L + R);
                  if (topTile.type == TILE_SPACE || topTile.type == TILE_BASE) {
                    topTile.startAnimation(MURPHY_COMES_FROM_BOTTOM_L + R);
                  }
                } else if (levelState.kbd.ArrowDown && y < LVL_HEIGHT - 1) {
                  thisTile.startAnimation(MURPHY_GOES_DOWN_L + R);
                } else if (levelState.kbd.ArrowLeft && x > 0) {
                  thisTile.startAnimation(MURPHY_GOES_LEFT);
                  levelState.murphy.looksLeft = true;
                  R = 0;
                  if (
                    leftTile.type == TILE_SPACE ||
                    leftTile.type == TILE_BASE
                  ) {
                    leftTile.startAnimation(MURPHY_COMES_FROM_RIGHT);
                  }
                } else if (levelState.kbd.ArrowRight && x < LVL_WIDTH - 1) {
                  thisTile.startAnimation(MURPHY_GOES_RIGHT);
                  levelState.murphy.looksLeft = false;
                  R = 1;
                }
                if (
                  thisTile.isAnimating() &&
                  levelState.murphy.resetFrameTimeout
                ) {
                  clearTimeout(levelState.murphy.resetFrameTimeout);
                  levelState.murphy.resetFrameTimeout = null;
                }
              }
              break;

            case TILE_SPACE:
            case TILE_BASE:
              if (thisTile.isAnimating()) {
                thisTile.continueAnimation(framesNum);
                if (thisTile.isAnimationEnded()) {
                  // For now all animations are moving animations
                  thisTile.type = TILE_MURPHY; // Animation ended - Murphy arrived here
                  thisTile.frame = R ? MURPHY_LOOKS_RIGHT : MURPHY_LOOKS_LEFT;
                  levelState.murphy.tile = thisTile;
                  levelState.murphy.resetFrameTimeout = setTimeout(() => {
                    thisTile.frame = [0, 0];
                    drawLevel();
                  }, 1000);
                }
              } else {
                if (
                  topTile?.type == TILE_MURPHY &&
                  topTile.isAnimating() &&
                  topTile.getAnimation() == MURPHY_GOES_DOWN_L + R
                ) {
                  thisTile.startAnimation(MURPHY_COMES_FROM_TOP_L + R);
                } else if (
                  leftTile?.type == TILE_MURPHY &&
                  leftTile.isAnimating() &&
                  leftTile.getAnimation() == MURPHY_GOES_RIGHT
                ) {
                  thisTile.startAnimation(MURPHY_COMES_FROM_LEFT);
                }
              }
              break;
          }
        }
      }
      if (levelState.tiles.needRedraw) {
        let murphy = levelState.murphy.tile;
        let murphyX = murphy.x * TILE_SIZE + TILE_SIZE / 2 + LVL_BORDER_WIDTH; // center of the tile
        let murphyY = murphy.y * TILE_SIZE + TILE_SIZE / 2 + LVL_BORDER_WIDTH;

        if (murphy.isAnimating()) {
          let delta = (murphy._animationProgress + 1) * 2;
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

        let viewportW = canvas.width;
        let viewportH = canvas.height - panelPng.height;
        levelState.screenLeft = Math.round(
          clamp(murphyX - viewportW / 2, 0, LVL_WIDTH_PX - viewportW)
        );
        levelState.screenTop = Math.round(
          clamp(murphyY - viewportH / 2, 0, LVL_HEIGHT_PX - viewportH)
        );
        drawLevel();
      }
      timeBefore = timeNow;
    }
    window.requestAnimationFrame(theLoop);
  }
  window.requestAnimationFrame(theLoop);
}
main();
