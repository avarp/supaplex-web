precision mediump float;

varying vec2 vPosition;

uniform sampler2D uLevelTiles;
uniform sampler2D uFixedTilesTexture;
uniform sampler2D uPanelTexture;
uniform float uPanelHeight;
uniform vec2 uFixedTilesTextureSize;
uniform vec2 uLevelOffset;
uniform vec2 uScreenSize;

uniform float TILE_SIZE;
uniform float LVL_WIDTH;
uniform float LVL_HEIGHT;
uniform float LVL_WIDTH_PX;
uniform float LVL_HEIGHT_PX;
uniform float LVL_BORDER_WIDTH;



bool isPanel(vec2 screenPos) {
  return screenPos.y >= uScreenSize.y - uPanelHeight;
}

vec4 drawPanel(vec2 screenPos) {
  return texture2D(
    uPanelTexture,
    vec2(
      vPosition.x,
      (screenPos.y - uScreenSize.y + uPanelHeight) / uPanelHeight
    )
  );
}

vec4 drawGameField(vec2 screenPos) {
  vec2 gameFieldPos = vec2(
    uLevelOffset.x + screenPos.x - LVL_BORDER_WIDTH,
    uLevelOffset.y + screenPos.y - LVL_BORDER_WIDTH
  );
  float tileIndex = floor(
    texture2D(
      uLevelTiles,
      vec2(
        gameFieldPos.x / (LVL_WIDTH_PX - LVL_BORDER_WIDTH * 2.0),
        gameFieldPos.y / (LVL_HEIGHT_PX - LVL_BORDER_WIDTH * 2.0)
      )
    ).r * 256.0
  );
  return texture2D(
    uFixedTilesTexture,
    vec2(
      (tileIndex * TILE_SIZE + mod(gameFieldPos.x, TILE_SIZE)) / uFixedTilesTextureSize.x,
      mod(gameFieldPos.y, TILE_SIZE) / uFixedTilesTextureSize.y
    )
  );
}

bool isBorder(vec2 screenPos) {
  vec2 absPos = vec2(uLevelOffset.x + screenPos.x, uLevelOffset.y + screenPos.y);
  return (
    absPos.x < LVL_BORDER_WIDTH ||
    absPos.y < LVL_BORDER_WIDTH ||
    LVL_WIDTH_PX - absPos.x < LVL_BORDER_WIDTH ||
    LVL_HEIGHT_PX - absPos.y < LVL_BORDER_WIDTH
  );
}

vec4 drawBorder(vec2 screenPos) {
  vec2 absPos = vec2(uLevelOffset.x + screenPos.x, uLevelOffset.y + screenPos.y);
  float x; // texture x
  float y; // texture y
  if (absPos.x < LVL_BORDER_WIDTH) {
    x = uFixedTilesTextureSize.x - LVL_BORDER_WIDTH * 2.0 + absPos.x;
    if (absPos.y < LVL_BORDER_WIDTH) {
      // top left corner
      y = absPos.y;
    } else if (LVL_HEIGHT_PX - absPos.y < LVL_BORDER_WIDTH) {
      // bottom left corner
      y = LVL_BORDER_WIDTH * 2.0 - (LVL_HEIGHT_PX - absPos.y);
    } else {
      // left border
      y = LVL_BORDER_WIDTH;
    }
  } else if (LVL_WIDTH_PX - absPos.x < LVL_BORDER_WIDTH) {
    x = uFixedTilesTextureSize.x - (LVL_WIDTH_PX - absPos.x);
    if (absPos.y < LVL_BORDER_WIDTH) {
      // top right corner
      y = absPos.y;
    } else if (LVL_HEIGHT_PX - absPos.y < LVL_BORDER_WIDTH) {
      // bottom right corner
      y = LVL_BORDER_WIDTH * 2.0 - (LVL_HEIGHT_PX - absPos.y);
    } else {
      // right border
      y = LVL_BORDER_WIDTH;
    }
  } else {
    x = uFixedTilesTextureSize.x - LVL_BORDER_WIDTH + 1.0;
    if (absPos.y < LVL_BORDER_WIDTH) {
      // top border
      y = absPos.y;
    } else {
      // bottom border
      y = LVL_BORDER_WIDTH - (LVL_HEIGHT_PX - absPos.y);
    }
  }
  return texture2D(
    uFixedTilesTexture,
    vec2(x / uFixedTilesTextureSize.x, y / uFixedTilesTextureSize.y)
  );
}

void main() {
  vec2 screenPos = vec2(vPosition.x*uScreenSize.x, vPosition.y*uScreenSize.y);
  if (isPanel(screenPos)) {
    gl_FragColor = drawPanel(screenPos);
  } else if (isBorder(screenPos)) {
    gl_FragColor = drawBorder(screenPos);
  } else {
    gl_FragColor = drawGameField(screenPos);
  }
}
