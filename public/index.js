import {
  Tile,
  TILE_MURPHY,
  TILE_SPACE,
  MURPHY_COMES_FROM_RIGHT,
  MURPHY_COMES_FROM_LEFT,
  MURPHY_COMES_FROM_TOP,
  MURPHY_COMES_FROM_BOTTOM,
  MURPHY_GOES_DOWN,
  MURPHY_GOES_LEFT,
  MURPHY_GOES_RIGHT,
  MURPHY_GOES_UP,
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
  NONE,
  LVL_BORDER_WIDTH,
  TILE_SIZE,
} from "./const.js";
import {
  clamp,
  getEmptyLevel,
  getLevelTiles,
  loadImage,
  nextFrame,
  readFile,
  readFileText,
} from "./utils.js";
import { Webgl2D } from "./webgl2d.js";

async function main() {
  const canvas = document.querySelector("canvas");
  const gl = canvas.getContext("webgl");
  const fixedPng = await loadImage("img/fixed.png");
  const panelPng = await loadImage("img/panel.png");
  const fragmentShader = await readFileText("glsl/fixedLevel.glsl");

  const fixedTilesProgram = new Webgl2D(gl, fragmentShader, {
    ...constForGlsl,
    uFixedTilesTexture: {
      type: "sampler2D",
      value: fixedPng,
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

  const levelState = {
    tiles: getEmptyLevel(), // getLevelTiles(await readFile("data/LEVELS.DAT"), 108),
    screenTop: 0,
    screenLeft: 0,
    keyboard: {
      lastHorzDirection: LEFT,
      direction: NONE,
      space: false,
    },
  };

  window.addEventListener("keydown", function (event) {
    switch (event.code) {
      case "Space":
        levelState.keyboard.space = true;
        break;

      case "ArrowUp":
        levelState.keyboard.direction = UP;
        break;

      case "ArrowDown":
        levelState.keyboard.direction = DOWN;
        break;

      case "ArrowLeft":
        levelState.keyboard.lastHorzDirection = LEFT;
        levelState.keyboard.direction = LEFT;
        break;

      case "ArrowRight":
        levelState.keyboard.lastHorzDirection = LEFT;
        levelState.keyboard.direction = RIGHT;
        break;
    }
  });

  window.addEventListener("keyup", function (event) {
    switch (event.code) {
      case "Space":
        levelState.keyboard.space = false;
        break;

      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
        levelState.keyboard.direction = NONE;
        break;
    }
  });

  function drawLevel() {
    fixedTilesProgram.draw({
      uLevelTiles: {
        data: levelState.tiles,
        type: gl.UNSIGNED_BYTE,
        width: LVL_WIDTH,
        height: LVL_HEIGHT,
        format: gl.LUMINANCE_ALPHA,
      },
      uLevelOffset: [levelState.screenLeft, levelState.screenTop],
    });
  }
  drawLevel();

  // canvas.addEventListener("mousemove", function (event) {
  //   let canvasPos = event.target.getBoundingClientRect(),
  //     x = (event.clientX - canvasPos.x) / canvasPos.width,
  //     y = (event.clientY - canvasPos.y) / canvasPos.height,
  //     windowWidth = canvas.width,
  //     windowHeight = canvas.height - panelPng.height;

  //   levelState.screenLeft = (LVL_WIDTH_PX - windowWidth) * x;
  //   levelState.screenTop = (LVL_HEIGHT_PX - windowHeight) * y;
  //   drawLevel();
  // });

  window.requestAnimationFrame(theLoop);
  var timeStart = performance.now();
  const frameLength = 35; //ms
  var prevFrame = 0;
  function theLoop(timeNow) {
    const thisFrame = Math.round((timeNow - timeStart) / frameLength);
    if (thisFrame == prevFrame) return;
    for (let y = 0; y < LVL_HEIGHT; y++) {
      for (let x = 0; x < LVL_WIDTH; x++) {
        let thisTile = Tile.read(levelState.tiles, x, y);
        let topTile = Tile.read(levelState.tiles, x, y - 1);
        let leftTile = Tile.read(levelState.tiles, x - 1, y);
        // If animation is going, just continue it
        if (isAnimating(thisTile)) {
          continueAnimation(thisTile, thisFrame - prevFrame);
        }
        // Should we start a new animation on the current tile?
        else {
          // Should we start to move Murphy?
          if (
            thisTile.type == TILE_MURPHY &&
            levelState.keyboard.direction != NONE
          ) {
            switch (levelState.keyboard.direction) {
              case LEFT:
                if (x > 0) {
                  startAnimation(thisTile, MURPHY_GOES_LEFT);
                  startAnimation(leftTile, MURPHY_COMES_FROM_RIGHT);
                }
                break;
              case RIGHT:
                if (LVL_WIDTH - x > 1) {
                  startAnimation(thisTile, MURPHY_GOES_RIGHT);
                  // Right tile will be processed later
                }
                break;
              case UP:
                if (y > 0) {
                  startAnimation(thisTile, MURPHY_GOES_UP);
                  startAnimation(topTile, MURPHY_COMES_FROM_BOTTOM);
                }
                break;
              case DOWN:
                if (LVL_HEIGHT - y > 1) {
                  startAnimation(thisTile, MURPHY_GOES_DOWN);
                  // Bottom tile will be processed later
                }
            }
          }
          // Should we animate base tile or space tile because of Murhpy coming here?
          if (thisTile.type == TILE_SPACE || thisTile.type == TILE_BASE) {
            if (
              topTile.type == TILE_MURPHY &&
              getAnimation(topTile) == MURPHY_GOES_DOWN
            ) {
              startAnimation(thisTile, MURPHY_COMES_FROM_TOP);
            } else if (
              leftTile == TILE_MURPHY &&
              getAnimation(leftTile) == MURPHY_GOES_RIGHT
            ) {
              startAnimation(thisTile, MURPHY_COMES_FROM_LEFT);
            }
          }
        }
        // Update offset of the screen
        if (thisTile.type == TILE_MURPHY) {
          levelState.screenLeft = clamp(
            LVL_BORDER_WIDTH + (x + 0.5) * TILE_SIZE - canvas.width / 2,
            0,
            LVL_WIDTH_PX - canvas.width
          );
          levelState.screenTop = clamp(
            LVL_BORDER_WIDTH +
              (y + 0.5) * TILE_SIZE -
              (canvas.height - panelPng.height) / 2,
            0,
            LVL_HEIGHT_PX - canvas.height + panelPng.height
          );
        }
      }
    }
  }
}
main();
