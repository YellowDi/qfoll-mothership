/**
 * [INPUT]: 依赖 ./mapView 的底图、./common 的集卡判定/停放集卡/车牌，../layout 的港界；订阅 PortScene 帧
 * [OUTPUT]: 对外提供 mountDispatch(canvas, scene, onInfo)：新货源落点 → 候选集卡实时打分连线 → 派单，回传订单与候选列表；DispatchInfo 载荷类型
 * [POS]: 杂志第 02 章"智能调度"配图；候选来自世界中真实的停场与在途集卡，位置与空重状态都是实时的
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { FENCE_Y } from "../layout";
import type { PortScene } from "../scene";
import type { Vehicle } from "../traffic";
import type { ParkedVehicle } from "../types";
import { MapView } from "./mapView";
import { isTruck, parkedTrucks, plateOf } from "./common";

export interface DispatchInfo {
  no: string;
  box: string;
  origin: string;
  dest: string;
  phase: string;
  eta: number;
  candidates: { plate: string; status: string; km: string; score: number; chosen: boolean }[];
}

/* 候选集卡：停车场待命的停放集卡，或港界外的在途集卡 */
type Candidate = Vehicle | ParkedVehicle;

interface Origin {
  x: number;
  y: number;
  name: string;
}

interface Order {
  no: string;
  box: string;
  origin: Origin;
  start: number;
  ranked: Array<{ v: Candidate; score: number }>;
}

/* 货源起点：物流园与冷库的装货月台 */
const ORIGINS: Origin[] = [
  { x: -820, y: -425, name: "物流园 A 区 · 3 号月台" },
  { x: 20, y: -440, name: "物流园 B 区 · 冷链月台" },
  { x: 650, y: -456, name: "冷库 C 区 · 1 号门" },
  { x: -250, y: -480, name: "车辆服务中心 · 2 号位" },
];
const BOXES = ["40HQ 高柜", "20GP 普柜", "40GP 普柜", "45HQ 高柜"];
const CYCLE = 8;

export function mountDispatch(canvas: HTMLCanvasElement, scene: PortScene, onInfo: (info: DispatchInfo) => void): () => void {
  const map = new MapView(canvas, scene);
  let round = -1, order: Order | null = null, cam: { x: number; y: number; px: number } | null = null, lastInfo = 0;

  const statusOf = (v: Candidate) => (v.parked ? "停车场待命" : v.cargo == null ? "空车在途" : "重车在途");
  const newOrder = (t: number) => {
    round++;
    const origin = ORIGINS[round % ORIGINS.length];
    const pool: Candidate[] = [
      ...parkedTrucks(scene).filter((v) => v.where === "park"),
      ...scene.traffic.vehicles.filter((v) => isTruck(v) && v.y < FENCE_Y - 10),
    ];
    const ranked = pool.map((v) => {
      const d = Math.hypot(v.x - origin.x, v.y - origin.y);
      const score = Math.max(42, Math.min(98, Math.round(100 - d * 0.034 + (v.cargo == null ? 10 : -14) + (v.parked ? 4 : 0))));
      return { v, score };
    }).sort((a, b) => b.score - a.score).slice(0, 3);
    order = { no: `DD${String(26100500 + round * 37).slice(-8)}`, box: BOXES[round % BOXES.length], origin, start: t, ranked };
  };

  const draw = (sc: PortScene) => {
    if (!map.w) return;
    const t = sc.traffic.time;
    if (!order || t - order.start >= CYCLE) newOrder(t);
    const tau = t - order!.start, { origin, ranked } = order!; // newOrder 在闭包内赋值，TS 看不到
    /* 镜头：框住货源与候选车，平滑跟随 */
    let x0 = origin.x, x1 = origin.x, y0 = origin.y, y1 = origin.y;
    for (const { v } of ranked) { x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
    const px = Math.max(0.12, Math.min(0.42 * Math.max(1, map.w / 460), Math.min((map.w - 120) / (x1 - x0 + 1), (map.h - 140) / (y1 - y0 + 1))));
    const target = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 + 20 / px, px };
    cam = cam ? { x: cam.x + (target.x - cam.x) * 0.06, y: cam.y + (target.y - cam.y) * 0.06, px: cam.px + (target.px - cam.px) * 0.06 } : target;
    map.begin(cam.x, cam.y, cam.px);
    const c = map.c;
    for (const v of parkedTrucks(sc)) if (v.where === "park" && map.inView(v.x, v.y, v.x, v.y)) map.dot(v.x, v.y, 1.8, c.truck);

    const scoring = Math.min(1, Math.max(0, (tau - 1) / 2.4)), assigned = tau >= 3.6;
    ranked.forEach(({ v }, i) => {
      const best = i === 0;
      if (assigned && !best) return;
      const k = assigned ? 1 : Math.min(1, scoring * 1.4 - i * 0.18);
      if (k <= 0) return;
      const p = { x: v.x + (origin.x - v.x) * k, y: v.y + (origin.y - v.y) * k };
      if (assigned) {
        map.line([v, origin], 5, c.halo);
        map.line([v, origin], 2.6, "#f97316");
        /* 派单流光：沿连线流动的亮点 */
        const f = ((tau * 0.6) % 1), q = { x: v.x + (origin.x - v.x) * f, y: v.y + (origin.y - v.y) * f };
        map.dot(q.x, q.y, 3, "#f97316");
      } else map.line([v, p], 1.6, c.accent, [4, 4]);
      map.marker(v.x, v.y, v.h ?? 0, best && assigned ? "#f97316" : c.accent, best && assigned ? (tau * 0.9) % 1 : null);
      if (!assigned || best) map.label(map.X(v.x) + 10, map.Y(v.y) + 6, plateOf(v.id), best && assigned ? "#f97316" : undefined);
    });
    /* 货源落点：下落 + 涟漪 */
    const drop = Math.min(1, tau / 0.5);
    map.ctx.globalAlpha = drop;
    map.pin(origin.x, origin.y - (1 - drop) * 30 / cam.px, "#e5484d");
    map.ctx.globalAlpha = 1;
    if (tau < 1.6) {
      const r = (tau % 0.8) / 0.8;
      map.ctx.strokeStyle = "#e5484d";
      map.ctx.globalAlpha = 1 - r;
      map.ctx.beginPath();
      map.ctx.arc(map.X(origin.x), map.Y(origin.y), 6 + r * 24, 0, Math.PI * 2);
      map.ctx.stroke();
      map.ctx.globalAlpha = 1;
    }

    const now = performance.now();
    if (now - lastInfo > 160) {
      lastInfo = now;
      const best = ranked[0];
      const km = best ? (Math.hypot(best.v.x - origin.x, best.v.y - origin.y) * 0.5) / 1000 : 0;
      onInfo({
        no: order!.no, box: order!.box, origin: origin.name, dest: "港区闸口 · 进港",
        phase: tau < 1 ? "新货源" : assigned ? "已派单" : "智能匹配中",
        candidates: ranked.map(({ v, score }, i) => ({
          plate: plateOf(v.id), status: statusOf(v), km: ((Math.hypot(v.x - origin.x, v.y - origin.y) * 0.5) / 1000).toFixed(1),
          score: Math.round(score * Math.min(1, Math.max(0, scoring * 1.4 - i * 0.18))), chosen: assigned && i === 0,
        })),
        eta: Math.max(2, Math.round((km / 32) * 60) + 1),
      });
    }
  };
  const off = scene.subscribe(draw);
  return () => {
    off();
    map.dispose();
  };
}
