export const LVL_DATA_LENGTH = 1536, // bytes
  LVL_WIDTH = 58, // tiles
  LVL_HEIGHT = 22, // tiles
  LVL_BORDER_WIDTH = 8, // pixels
  TILE_SIZE = 16, // pixels
  LVL_WIDTH_PX = LVL_WIDTH * TILE_SIZE + LVL_BORDER_WIDTH * 2,
  LVL_HEIGHT_PX = LVL_HEIGHT * TILE_SIZE + LVL_BORDER_WIDTH * 2,
  LVL_VIEWPORT_WIDTH_PX = 320,
  LVL_VIEWPORT_HEIGHT_PX = 240 - 24,
  FRAME_DURATION = 40, // ms
  // Movings
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
  NONE = -1;

export const constForGlsl = {
  LVL_WIDTH: {
    type: "float",
    value: LVL_WIDTH,
  },
  LVL_HEIGHT: {
    type: "float",
    value: LVL_HEIGHT,
  },
  LVL_WIDTH_PX: {
    type: "float",
    value: LVL_WIDTH_PX,
  },
  LVL_HEIGHT_PX: {
    type: "float",
    value: LVL_HEIGHT_PX,
  },
  LVL_BORDER_WIDTH: {
    type: "float",
    value: LVL_BORDER_WIDTH,
  },
  TILE_SIZE: {
    type: "float",
    value: TILE_SIZE,
  },
};
