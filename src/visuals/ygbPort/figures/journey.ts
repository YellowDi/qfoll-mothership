/**
 * [INPUT]: 依赖 ./common 的时钟/车牌/位置语义、../layout 的闸口坐标；订阅 PortScene 帧与 gate/arrive 事件
 * [OUTPUT]: 对外提供 mountJourney(scene, onState)：被追踪集卡当前运单的五节点链路 (提箱/进港/交箱/出港/回单)、连续进度、ETA、节点日志、车速轨迹与已完成运单；JourneyInfo/JourneyNode 载荷类型
 * [POS]: 杂志第 03 章"全链路节点"配图的状态源；节点边界取自真实路径上的固定终点与闸口停止线，进度随车辆里程连续推进
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { GATE } from "../layout";
import type { PortScene } from "../scene";
import { clock, plateOf, zoneOf } from "./common";

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

const NODES = [
  { label: "提箱", place: "物流园提箱点" },
  { label: "进港", place: "港区闸口" },
  { label: "交箱", place: "堆场交箱点" },
  { label: "出港", place: "港区闸口" },
  { label: "回单", place: "物流园 · 电子回单" },
];

export function mountJourney(scene: PortScene, onState: (state: JourneyInfo) => void): () => void {
  const v = scene.traffic.vehicles.find((o) => o.tracked)!, path = v.path, L = path.length;
  const gateKey = `${GATE.x},${GATE.y}`;
  const pickup = path.waypoints!.find((w) => w.role === "pickup")!, drop = path.waypoints!.find((w) => w.role === "drop")!;
  const gateIn = path.stops.find((s) => s.kind === "gate" && s.node.k === gateKey && s.dir === "0,1")!;
  const gateOut = path.stops.find((s) => s.kind === "gate" && s.node.k === gateKey && s.dir === "0,-1")!;
  /* 以提箱点为起点的累计里程边界 */
  const rel = (s: number) => (s - pickup.s + L) % L;
  const bounds = [0, rel(gateIn.s), rel(drop.s), rel(gateOut.s), L];
  let serial = 41, times: Array<string | null> = [null, null, null, null, null], history: JourneyInfo["history"] = [], lastInfo = 0, lastSpeed = 0;
  const speeds: number[] = [], log: JourneyInfo["log"] = [];
  const note = (t: number, text: string) => {
    log.unshift({ time: clock(t), text });
    if (log.length > 5) log.length = 5;
  };
  const start = (t: number) => {
    serial++;
    times = [clock(t), null, null, null, null];
  };
  /* 开场按当前里程补齐已经过的节点时间，避免空白 */
  {
    const r = rel(v.s), t = scene.traffic.time;
    times = [...bounds.slice(0, 4).map((b) => (r >= b ? clock(Math.max(0, t - (r - b) / 26)) : null)), null];
    times.forEach((time, i) => time && log.unshift({ time, text: `${NODES[i].label} · ${NODES[i].place}` }));
  }
  const offs = [
    scene.on("gate", (e) => {
      if (e.id !== v.id || e.gate !== "港区闸口") return;
      times[e.dir === "进港" ? 1 : 3] = clock(e.t);
      note(e.t, `${e.dir} · 闸口核验放行 · ${e.cargo == null ? "空车" : "重车"}`);
    }),
    scene.on("arrive", (e) => {
      if (e.id !== v.id) return;
      note(e.t, e.text);
      if (e.role === "drop") times[2] = clock(e.t);
      else {
        /* 回到物流园：本单回单完成，同时开启下一单的提箱 */
        times[4] = clock(e.t);
        history = [{ no: `YD${serial}`, span: `${times[0]} — ${times[4]}` }, ...history].slice(0, 2);
        start(e.t);
      }
    }),
  ];
  const off = scene.subscribe((sc) => {
    /* 车速轨迹：按世界时间采样，暂停时不推进 */
    if (sc.traffic.time - lastSpeed > 0.25) {
      lastSpeed = sc.traffic.time;
      speeds.push(Math.round(v.v * 1.8));
      if (speeds.length > 90) speeds.shift();
    }
    const now = performance.now();
    if (now - lastInfo < 120) return;
    lastInfo = now;
    const r = rel(v.s);
    let stage = 0;
    while (stage < 3 && r >= bounds[stage + 1]) stage++;
    const frac = (r - bounds[stage]) / (bounds[stage + 1] - bounds[stage]);
    const remainKm = ((bounds[stage + 1] - r) * 0.5) / 1000;
    const etaMin = remainKm / 30 * 60;
    onState({
      no: `YD2610${String(serial).padStart(4, "0")}`,
      plate: plateOf(v.id),
      progress: stage + Math.max(0, Math.min(1, frac)),
      stage,
      nodes: NODES.map((n, i) => ({ ...n, time: times[i], done: !!times[i] && i <= stage, eta: i === stage + 1 ? clock(sc.traffic.time + (etaMin * 60) / 4) : null })),
      next: { ...NODES[stage + 1], km: remainKm.toFixed(2) },
      speed: Math.round(v.v * 1.8),
      zone: zoneOf(v.x, v.y),
      moving: v.v > 0.6,
      history,
      speeds: [...speeds],
      log: [...log],
    });
  });
  return () => {
    off();
    offs.forEach((f) => f());
  };
}
