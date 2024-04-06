import { getEmptyLevel } from "./utils.js";
import { Level } from "./level.js";

async function main() {
  fullscreenBtn();
  const canvas = document.querySelector("canvas");
  canvas.focus();
  const level = new Level(getEmptyLevel());
  await level.play(canvas);
}
main();

/**
 * Handle fullscreen mode
 */
function fullscreenBtn() {
  let btn = document.querySelector(".fullscreen-btn");
  btn.addEventListener("click", () => document.body.requestFullscreen());
  document.addEventListener(
    "fullscreenchange",
    () => (btn.style.display = document.fullscreenElement ? "none" : "")
  );
}
