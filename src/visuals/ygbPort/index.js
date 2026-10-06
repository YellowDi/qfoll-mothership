/**
 * [INPUT]: 依赖 ./scene 的 PortScene、./figures 的五个集卡配图
 * [OUTPUT]: 对外提供 mountYgbPort(canvas, { dark, paused })，返回 { setTheme, setPaused, setSpeed, flyTo, subscribe, dispose, scene }；转出 mountTracker/mountDispatch/mountJourney/mountFleet/mountUplink 配图
 * [POS]: visuals/ygbPort 的唯一入口；React 适配器与原型页只依赖这里，不触碰内部模块
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { PortScene } from "./scene";

/* 杂志配图：全部订阅同一个场景，围绕社会集卡讲故事 */
export { mountTracker } from "./figures/tracker";
export { mountDispatch } from "./figures/dispatch";
export { mountJourney } from "./figures/journey";
export { mountFleet, FLEET_STATES } from "./figures/fleet";
export { mountUplink } from "./figures/uplink";

export function mountYgbPort(canvas, { dark = false, paused = false } = {}) {
  const scene = new PortScene(canvas, dark);
  scene.setPaused(paused);
  return {
    setTheme: (value) => scene.setTheme(value),
    setPaused: (value) => scene.setPaused(value),
    setSpeed: (value) => scene.setSpeed(value),
    flyTo: (camera, ms) => scene.flyTo(camera, ms),
    subscribe: (fn) => scene.subscribe(fn),
    dispose: () => scene.dispose(),
    scene,
  };
}
