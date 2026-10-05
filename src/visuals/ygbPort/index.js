/**
 * [INPUT]: 依赖 ./scene 的 PortScene
 * [OUTPUT]: 对外提供 mountYgbPort(canvas, { dark, paused })，返回 { setTheme, setPaused, setSpeed, dispose, scene }
 * [POS]: visuals/ygbPort 的唯一入口；React/Vue 适配器与原型页只依赖这里，不触碰内部模块
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { PortScene } from "./scene";

export function mountYgbPort(canvas, { dark = false, paused = false } = {}) {
  const scene = new PortScene(canvas, dark);
  scene.setPaused(paused);
  return {
    setTheme: (value) => scene.setTheme(value),
    setPaused: (value) => scene.setPaused(value),
    setSpeed: (value) => scene.setSpeed(value),
    dispose: () => scene.dispose(),
    scene,
  };
}
