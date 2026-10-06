/**
 * [INPUT]: 描述同目录 index.js 的运行时导出，不引入运行时依赖
 * [OUTPUT]: 对外提供 PortCamera/PortScene/PortHandle 与五张配图的状态载荷类型，并声明 mount* 函数与 FLEET_STATES
 * [POS]: ygbPort 引擎的 TypeScript 契约；React 适配器依赖这里而非猜测 JS 推断，载荷类型以引擎实际 emit 的字段为准
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* 镜头：s 缩放，(x, y) 画面中心对准的世界点，ax/ay 为中心落在画布上的比例位置 */
export interface PortCamera {
  s: number;
  x: number;
  y: number;
  ax?: number;
  ay?: number;
}

/* 配图与外部视图可见的场景面；引擎内部的车流、静物与渲染细节刻意不暴露 */
export interface PortScene {
  setTheme(dark: boolean): void;
  setPaused(paused: boolean): void;
  setSpeed(speed: number): void;
  setCamera(camera: PortCamera | null): void;
  flyTo(camera: PortCamera | null, ms?: number): void;
  /* 立即回调一次，之后随每帧回调；返回取消订阅函数 */
  subscribe(fn: (scene: PortScene) => void): () => void;
  dispose(): void;
}

export interface PortHandle {
  setTheme(dark: boolean): void;
  setPaused(paused: boolean): void;
  setSpeed(speed: number): void;
  flyTo(camera: PortCamera | null, ms?: number): void;
  subscribe(fn: (scene: PortScene) => void): () => void;
  dispose(): void;
  scene: PortScene;
}

export function mountYgbPort(
  canvas: HTMLCanvasElement,
  options?: { dark?: boolean; paused?: boolean }
): PortHandle;

/* ---- 杂志配图的状态载荷 ---- */
export interface TrackInfo {
  zone: string;
  speed: number;
  heading: string;
  status: string;
  time: string;
  dest: string | null;
  remain: string | null;
  events: { time: string; text: string }[];
}

export interface DispatchInfo {
  no: string;
  box: string;
  origin: string;
  dest: string;
  phase: string;
  eta: number;
  candidates: { plate: string; status: string; km: string; score: number; chosen: boolean }[];
}

export interface JourneyNode {
  label: string;
  place: string;
  time: string | null;
  done: boolean;
  eta: string | null;
}

export interface JourneyInfo {
  no: string;
  plate: string;
  progress: number;
  stage: number;
  nodes: JourneyNode[];
  next: { label: string; place: string; km: string };
  speed: number;
  zone: string;
  moving: boolean;
  history: { no: string; span: string }[];
  speeds: number[];
  log: { time: string; text: string }[];
}

export interface FleetInfo {
  total: number;
  busy: number;
  rate: number;
  counts: Record<string, number>;
  rows: { id: number; plate: string; state: string; zone: string; speed: number; box: string }[];
}

export interface UplinkInfo {
  total: number;
  latency: string;
  packets: { id: number; kind: string; p: number }[];
  rows: { id: number; time: string; kind: string; ref: string; detail: string; sig: string; ok: boolean }[];
}

/* 带画布的配图自绘地图并推送信息；无画布的配图只推送状态。均返回清理函数 */
export function mountTracker(canvas: HTMLCanvasElement, scene: PortScene, onInfo: (info: TrackInfo) => void): () => void;
export function mountDispatch(canvas: HTMLCanvasElement, scene: PortScene, onInfo: (info: DispatchInfo) => void): () => void;
export function mountJourney(scene: PortScene, onState: (state: JourneyInfo) => void): () => void;
export function mountFleet(scene: PortScene, onState: (state: FleetInfo) => void): () => void;
export function mountUplink(scene: PortScene, onState: (state: UplinkInfo) => void): () => void;

export const FLEET_STATES: readonly string[];
