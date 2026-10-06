/**
 * [INPUT]: 依赖 ./scene 的 PortScene、./figures 的五个集卡配图
 * [OUTPUT]: 对外提供 mountYgbPort(canvas, { dark, paused })，返回 PortHandle { setTheme, setPaused, setSpeed, flyTo, subscribe, dispose, scene }；转出 mountTracker/mountDispatch/mountJourney/mountFleet/mountUplink 配图及其状态载荷类型 (TrackInfo 等)，以及 PortScene/PortCamera 类型
 * [POS]: visuals/ygbPort 的唯一入口；React 适配器只依赖这里，不触碰内部模块
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { PortScene, type PortCamera } from "./scene";

export type { PortScene, PortCamera };

/* 杂志配图：全部订阅同一个场景，围绕社会集卡讲故事 */
export { mountTracker, type TrackInfo } from "./figures/tracker";
export { mountDispatch, type DispatchInfo } from "./figures/dispatch";
export { mountJourney, type JourneyInfo, type JourneyNode } from "./figures/journey";
export { mountFleet, FLEET_STATES, type FleetInfo } from "./figures/fleet";
export { mountUplink, type UplinkInfo } from "./figures/uplink";

/* 外部持有的句柄：主题/暂停/倍速/镜头与帧订阅；scene 暴露完整场景供配图状态源读取 */
export interface PortHandle {
  setTheme: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  setSpeed: (value: number) => void;
  flyTo: (camera: PortCamera | null, ms?: number) => void;
  subscribe: (fn: (scene: PortScene) => void) => () => void;
  dispose: () => void;
  scene: PortScene;
}

export function mountYgbPort(canvas: HTMLCanvasElement, { dark = false, paused = false }: { dark?: boolean; paused?: boolean } = {}): PortHandle {
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
