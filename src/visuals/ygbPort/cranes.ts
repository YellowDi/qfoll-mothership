/**
 * [INPUT]: 依赖 ./iso 的投影/色彩/缓动，./layout 的轨道与车道常量，./ship 的 DECK_Z 与箱格接口
 * [OUTPUT]: 对外提供 Crane (岸桥几何与分层绘制：back/front/upper/hoist/shadow/glow)、CraneWork (唯一作业岸桥的装卸状态机)、Dockable (停靠在岸桥下的车辆需满足的形状) 与 TRAVEL_Z
 * [POS]: visuals/ygbPort 的岸桥；分层绘制让船体夹在门腿与大梁之间，彻底消除穿模；只有一台岸桥在作业
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { SUN, alpha, smooth, tone, type Ctx, type Iso, type Pt } from "./iso";
import { CRANE_LANE_Y, QUAY_Y, RAIL_LAND, RAIL_SEA, TEU, type CraneMode, type CraneSpec } from "./layout";
import type { Palette, ThemeColors } from "./palette";
import type { Xy } from "./roads";
import { DECK_Z, type Ship } from "./ship";
import type { container } from "./terminal";
import type { WorldBox } from "./types";

/* 停靠在岸桥下作业的车辆：吊具与它交换集装箱，served 表示已服务完毕可以离开 */
export interface Dockable {
  cargo: number | null;
  served: boolean;
}

/*
 * 岸桥动作队列：每步在 update 时补上执行期的 t (已用时)、from (起点)、dur (时长)、target (hoist 的求值目标)。
 * 规划时只给出 PlanStep，取出执行时再按 CraneAction 使用。
 */
type PlanStep =
  | { k: "trolley"; to: number }
  | { k: "hoist"; to: number | (() => number) }
  | { k: "gantry"; to: number }
  | { k: "lock" | "unlock"; where: "ship"; bay: number; row: number }
  | { k: "lock" | "unlock"; where: "truck" }
  | { k: "wait"; need: "empty" | "loaded" }
  | { k: "release" };

type CraneAction = PlanStep & { t: number; from: number; dur: number; target: number };

/* ─── 岸桥尺寸 (1u≈0.5m)：轨距 29m、前伸距 64m、起升高度约 46m ─── */
const FRAME = 18, PORTAL_Z = 34, LEG_TOP = 92, G0 = 92, G1 = 99;
const BACK_Y = 204, HINGE_Y = 314, TIP_Y = 444, APEX_Y = 296, APEX_Z = 150;
export const TRAVEL_Z = 76;
const PARK_Y = 300;

/* 绕 x 轴旋转的长方体：大梁俯仰用；按 (1,1,0.73) 视向剔除背面 */
function boomBox(ctx: Ctx, iso: Iso, x0: number, x1: number, t0: number, t1: number, u0: number, u1: number, angle: number, hy: number, hz: number, color: string) {
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const P = (x: number, t: number, u: number): Pt => [x, hy + t * ca - u * sa, hz + t * sa + u * ca];
  const faces: Array<[number, number, number, Pt[], number]> = [
    [1, 0, 0, [P(x1, t0, u0), P(x1, t1, u0), P(x1, t1, u1), P(x1, t0, u1)], 0.67],
    [0, ca, sa, [P(x0, t1, u0), P(x1, t1, u0), P(x1, t1, u1), P(x0, t1, u1)], 0.83],
    [0, -sa, ca, [P(x0, t0, u1), P(x1, t0, u1), P(x1, t1, u1), P(x0, t1, u1)], 1],
    [0, sa, -ca, [P(x0, t0, u0), P(x1, t0, u0), P(x1, t1, u0), P(x0, t1, u0)], 0.78],
  ];
  for (const [nx, ny, nz, pts, f] of faces) if (nx + ny + nz * 0.73 > 0.01) iso.poly(ctx, pts, tone(color, f));
}

export class Crane {
  x: number;
  mode: CraneMode;
  /* 大梁俯仰角 (弧度)：0 为放下，约 78° 为扬起 */
  angle: number;
  trolleyY: number;
  spreaderZ: number;
  sway: number;
  /* 吊具所携带集装箱的色索引；空吊具为 null */
  carry: number | null;
  moving: boolean;
  constructor({ x, mode }: CraneSpec) {
    this.x = x;
    this.mode = mode;
    this.angle = mode === "raised" ? (78 * Math.PI) / 180 : 0;
    this.trolleyY = mode === "working" ? 352 + ((x * 7) % 40) : mode === "raised" ? 236 : PARK_Y;
    this.spreaderZ = mode === "working" ? 64 : TRAVEL_Z + 8;
    this.sway = 0;
    this.carry = null;
    this.moving = false;
  }
  frames(): [number, number] { return [this.x - FRAME, this.x + FRAME]; }
  boomPoint(t: number): [number, number] { return [HINGE_Y + t * Math.cos(this.angle), G1 + t * Math.sin(this.angle)]; }

  /* ─── 陆侧门腿与台车：位于作业车道之后 ─── */
  back(ctx: Ctx, iso: Iso, c: Palette, dark: boolean, t: number) {
    const [f0, f1] = this.frames(), white = c.craneWhite;
    this.bogie(ctx, iso, c, f0, RAIL_LAND, dark, t);
    this.leg(ctx, iso, white, f0, RAIL_LAND);
    const brace = tone(white, 0.78);
    iso.line(ctx, [[f0 + 1, RAIL_LAND, PORTAL_Z + 6], [f1 - 1, RAIL_LAND, LEG_TOP - 6]], brace, 0.9);
    iso.line(ctx, [[f1 - 1, RAIL_LAND, PORTAL_Z + 6], [f0 + 1, RAIL_LAND, LEG_TOP - 6]], brace, 0.9);
    this.bogie(ctx, iso, c, f1, RAIL_LAND, dark, t);
    this.leg(ctx, iso, white, f1, RAIL_LAND);
  }
  /* ─── 门框横梁、斜撑与海侧门腿：位于作业车道之前、船体之后 ─── */
  front(ctx: Ctx, iso: Iso, c: Palette, dark: boolean, t: number) {
    const white = c.craneWhite;
    for (const f of this.frames()) {
      iso.box(ctx, f - 1.8, RAIL_LAND - 1.6, PORTAL_Z, 3.6, RAIL_SEA - RAIL_LAND + 3.2, 5, white, { rim: dark ? undefined : alpha("#ffffff", 0.6) });
      iso.line(ctx, [[f, RAIL_LAND + 4, PORTAL_Z + 5], [f, RAIL_SEA - 3, LEG_TOP - 4]], tone(white, 0.8), 1.1);
      iso.box(ctx, f - 2.6, RAIL_LAND + 8, PORTAL_Z - 5, 5.2, 10, 5, c.metal);
      this.bogie(ctx, iso, c, f, RAIL_SEA, dark, t);
      this.leg(ctx, iso, white, f, RAIL_SEA);
    }
  }
  leg(ctx: Ctx, iso: Iso, white: string, fx: number, y: number) {
    iso.box(ctx, fx - 1.7, y - 1.7, 4, 3.4, 3.4, LEG_TOP - 4, white, { side: tone(white, 0.86), end: tone(white, 0.7) });
  }
  bogie(ctx: Ctx, iso: Iso, c: Palette, fx: number, y: number, dark: boolean, t: number) {
    iso.box(ctx, fx - 8, y - 2, 0, 16, 4, 2.6, c.dark, { top: tone(c.dark, 1.5) });
    iso.box(ctx, fx - 3, y - 2.2, 2.6, 6, 4.4, 1.6, c.crane);
    for (const wx of [-6, -2, 2, 6]) iso.dot(ctx, fx + wx, y + 2.05, 1.1, 0.9, c.tire);
    if (this.moving && Math.sin(t * 9) > 0) {
      iso.dot(ctx, fx + 7, y + 2.2, 3, 0.8, "#ffb347");
      iso.glow(ctx, fx + 7, y + 2.2, 3, 7, "#ffb347", dark ? 0.6 : 0.4, 1);
    }
  }

  /* ─── 上部结构：联系横梁、双主梁 (含俯仰前大梁)、机房、A 字架、拉杆、小车与司机室 ─── */
  upper(ctx: Ctx, iso: Iso, c: Palette, dark: boolean, t: number) {
    const x = this.x, [f0, f1] = this.frames(), white = c.craneWhite, beam = c.crane;
    for (const y of [RAIL_LAND, RAIL_SEA]) iso.box(ctx, f0 - 2, y - 1.8, LEG_TOP - 4, f1 - f0 + 4, 3.6, 4, white);
    for (const f of this.frames()) iso.box(ctx, f - 1.8, RAIL_LAND - 1.8, LEG_TOP - 4, 3.6, RAIL_SEA - RAIL_LAND + 3.6, 4, white);
    /* 机房在后伸距上，先画以便被 A 字架覆盖 */
    iso.box(ctx, x - 11, BACK_Y + 3, G1, 22, 30, 13, white, { side: tone(white, 0.88), end: tone(white, 0.74), rim: dark ? undefined : alpha("#ffffff", 0.7) });
    iso.box(ctx, x - 11, BACK_Y + 3, G1 + 13, 22, 30, 1, tone(white, 0.9));
    iso.poly(ctx, [[x + 11.05, BACK_Y + 10, G1 + 2], [x + 11.05, BACK_Y + 16, G1 + 2], [x + 11.05, BACK_Y + 16, G1 + 8], [x + 11.05, BACK_Y + 10, G1 + 8]], dark ? alpha(c.lit, 0.7) : c.glassDark);
    iso.line(ctx, [[x - 11, BACK_Y + 33.05, G1 + 4], [x + 11, BACK_Y + 33.05, G1 + 4]], c.orange, 1.2);
    for (const [gx0, gx1] of [[x - 7, x - 3], [x + 3, x + 7]]) {
      boomBox(ctx, iso, gx0, gx1, BACK_Y - HINGE_Y, 0, -(G1 - G0), 0, 0, HINGE_Y, G1, beam);
      boomBox(ctx, iso, gx0, gx1, 0, TIP_Y - HINGE_Y, -(G1 - G0), 0, this.angle, HINGE_Y, G1, beam);
    }
    /* 主梁桁架斜腹杆与走道栏杆 */
    const L = TIP_Y - HINGE_Y, truss = dark ? alpha("#e3b58e", 0.25) : alpha("#fff3e0", 0.65);
    const pt = (tt: number, u: number): Pt => { const ca = Math.cos(this.angle), sa = Math.sin(this.angle); return [x + 7.05, HINGE_Y + tt * ca - u * sa, G1 + tt * sa + u * ca]; };
    const zig: Pt[] = [];
    for (let tt = 0, k = 0; tt <= L; tt += 9, k++) zig.push(pt(tt, k % 2 ? -(G1 - G0) + 0.6 : -0.6));
    iso.line(ctx, zig, truss, 0.45);
    const zigBack: Pt[] = [];
    for (let y = BACK_Y, k = 0; y <= HINGE_Y; y += 9, k++) zigBack.push([x + 7.05, y, k % 2 ? G0 + 0.6 : G1 - 0.6]);
    iso.line(ctx, zigBack, truss, 0.45);
    if (this.angle === 0) {
      for (let y = BACK_Y + 10; y < TIP_Y - 4; y += 26) iso.box(ctx, x - 3, y, G1 - 1.4, 6, 1.6, 1.4, tone(beam, 0.9));
      iso.line(ctx, [[x + 7.5, BACK_Y, G1 + 1.6], [x + 7.5, TIP_Y, G1 + 1.6]], dark ? alpha("#c9d6cf", 0.2) : alpha("#ffffff", 0.7), 0.35);
    }
    /* A 字架：两片斜柱汇于顶点，顶梁横向连接 */
    for (const sx of [x - 8, x + 8]) {
      iso.line(ctx, [[sx, RAIL_LAND + 2, G1], [sx, APEX_Y, APEX_Z]], white, 2.1);
      iso.line(ctx, [[sx, RAIL_SEA + 2, G1], [sx, APEX_Y, APEX_Z]], tone(white, 0.86), 2.1);
    }
    iso.box(ctx, x - 9, APEX_Y - 2, APEX_Z - 1, 18, 4, 3, white);
    /* 前拉杆连到前大梁两点，后拉杆连到后伸距端部 */
    const tie = c.craneTie;
    for (const sx of [x - 6, x + 6]) {
      for (const tt of [72, L - 6]) {
        const [py, pz] = this.boomPoint(tt);
        iso.line(ctx, [[sx, APEX_Y, APEX_Z], [sx, py, pz]], tie, 0.7);
      }
      iso.line(ctx, [[sx, APEX_Y, APEX_Z], [sx, BACK_Y + 2, G1]], tie, 0.7);
    }
    /* 小车 + 司机室：仅大梁放下时运行 */
    if (this.angle === 0) {
      const ty = this.trolleyY;
      iso.box(ctx, x - 6.8, ty - 5, G1, 13.6, 10, 4, white, { side: tone(white, 0.88), end: tone(white, 0.72) });
      iso.box(ctx, x - 6.8, ty - 5, G1 + 4, 13.6, 10, 0.8, c.orange);
      iso.box(ctx, x + 3.4, ty - 1.4, G0 - 8, 5.6, 6.4, 7.4, white, { side: dark ? tone(c.lit, 0.9) : c.glass, end: dark ? tone(c.lit, 0.75) : c.glassDark });
    }
    /* 夜间：航空障碍灯低频闪烁 */
    if (dark || this.mode !== "parked") {
      const blink = (t + this.x * 0.013) % 2.4 < 0.7;
      if (blink) {
        iso.dot(ctx, x, APEX_Y, APEX_Z + 2.5, 0.9, "#ff5745");
        iso.glow(ctx, x, APEX_Y, APEX_Z + 2.5, 9, "#ff5745", dark ? 0.55 : 0.25, 1);
        const [py, pz] = this.boomPoint(L);
        iso.dot(ctx, x, py, pz + 1, 0.8, "#ff5745");
        if (dark) iso.glow(ctx, x, py, pz + 1, 7, "#ff5745", 0.45, 1);
      }
    }
  }

  /* ─── 吊具：钢丝绳 + 上架 + 伸缩吊具，可带箱 ─── */
  hoist(ctx: Ctx, iso: Iso, c: Palette, dark: boolean, colors: ThemeColors, container?: typeof import("./terminal").container) {
    if (this.angle !== 0) return;
    const x = this.x, ty = this.trolleyY, sy = ty + this.sway, z = this.spreaderZ;
    const rope = dark ? alpha("#9fb3b6", 0.6) : alpha("#33454c", 0.75);
    for (const dx of [-2.4, 2.4]) for (const dy of [-1.4, 1.4]) iso.line(ctx, [[x + dx, ty + dy, G1 - 0.5], [x + dx * 0.8, sy + dy, z + 3.6]], rope, 0.28);
    iso.box(ctx, x - 3.5, sy - 2, z + 1.8, 7, 4, 1.8, c.dark);
    iso.box(ctx, x - TEU.l / 2, sy - 2.5, z, TEU.l, 5, 1.6, c.yellow, { end: tone(c.yellow, 0.7) });
    if (this.carry != null && container) container(ctx, iso, c, dark, x - TEU.l / 2, sy - TEU.w / 2, z - TEU.h, TEU.l, TEU.w, TEU.h - 0.1, colors.box[this.carry], false, true, true, false);
  }
  hoistOverSea() { return this.trolleyY + this.sway > QUAY_Y; }

  /* ─── 白天投影：门腿、门框与大梁的长影落在前沿与水面 ─── */
  shadow(ctx: Ctx, iso: Iso, c: Palette) {
    const a = alpha(c.shadowSoft, 0.17), s = (x: number, y: number, z: number): Xy => [x + z * SUN.x, y + z * SUN.y];
    for (const f of this.frames()) for (const y of [RAIL_LAND, RAIL_SEA]) iso.line(ctx, [[f, y], s(f, y, LEG_TOP)], a, 3);
    for (const f of this.frames()) iso.line(ctx, [s(f, RAIL_LAND, PORTAL_Z), s(f, RAIL_SEA, PORTAL_Z)], a, 3.4);
    const [ty, tz] = this.boomPoint(TIP_Y - HINGE_Y);
    iso.poly(ctx, [s(this.x - 7, BACK_Y, G1), s(this.x + 7, BACK_Y, G1), s(this.x + 7, ty, tz), s(this.x - 7, ty, tz)], alpha(c.shadowSoft, 0.12));
  }
  /* ─── 夜间泛光：前沿车道与船舶甲板各一组灯池 ─── */
  floodGround(ctx: Ctx, iso: Iso) {
    if (this.mode === "raised") return;
    iso.pool(ctx, this.x, 282, 0, 70, "#ffe6bd", 0.36);
  }
  floodShip(ctx: Ctx, iso: Iso) {
    if (this.mode === "working" || this.mode === "active") iso.glow(ctx, this.x, 368, DECK_Z + 34, 54, "#fff0cf", 0.14, 0.55);
    for (const y of [266, 300]) iso.glow(ctx, this.x + 6, y, G0 - 1, 6, "#fff4d6", 0.6, 1);
    if (this.angle === 0) for (const y of [350, 400]) iso.glow(ctx, this.x + 6, y, G0 - 1, 6, "#fff4d6", 0.6, 1);
  }
  bounds(): WorldBox { return [this.x - 26, BACK_Y, 0, this.x + 26, TIP_Y, APEX_Z + 4]; }
}

/* ════════════════════════════════════════════════════════════════════
 * 作业状态机：逐贝装卸；卸船时每贝取 4 箱后整机平移一贝，满一轮后转为装船反向回走
 *   动作队列：trolley / hoist / gantry / lock / unlock / wait / release
 * ════════════════════════════════════════════════════════════════════ */
export class CraneWork {
  crane: Crane;
  ship: Ship;
  bays: number[];
  mode: "unload" | "load";
  bayStep: number;
  movesLeft: number;
  queue: PlanStep[];
  action: CraneAction | null;
  /* 当前停靠在岸桥下的车辆 (traffic 写入) */
  docked: Dockable | null;
  vel: number;
  swayV: number;
  random: number;
  constructor(crane: Crane, ship: Ship, bays: number[]) {
    this.crane = crane;
    this.ship = ship;
    this.bays = bays;
    this.mode = "unload";
    this.bayStep = 0;
    this.movesLeft = 2;
    this.queue = [];
    this.action = null;
    this.docked = null;
    this.vel = 0;
    this.swayV = 0;
    this.random = 0.37;
    crane.x = ship.bays[bays[0]].cx;
    /* 开场即在作业中：吊具携箱驶向陆侧，几秒内就能看到落箱 */
    const bay = bays[0], row = this.pickRow(bay);
    crane.carry = ship.take(bay, row);
    crane.trolleyY = QUAY_Y + 12;
    crane.spreaderZ = TRAVEL_Z;
    this.queue.push(...this.deliverToTruck());
  }
  get bay() { return this.bays[this.bayStep]; }


  pickRow(bay: number): number {
    const s = this.ship, rows = [...Array(14).keys()];
    if (this.mode === "unload") return rows.filter((j) => s.height(bay, j) > 1).sort((a, b) => s.height(bay, b) - s.height(bay, a) || b - a)[0] ?? -1;
    return rows.filter((j) => s.height(bay, j) < 6).sort((a, b) => s.height(bay, a) - s.height(bay, b) || a - b)[0] ?? -1;
  }
  deliverToTruck(): PlanStep[] {
    return [
      { k: "trolley", to: CRANE_LANE_Y },
      { k: "wait", need: "empty" },
      { k: "hoist", to: 3 + TEU.h + 0.1 },
      { k: "unlock", where: "truck" },
      { k: "hoist", to: TRAVEL_Z },
      { k: "release" },
    ];
  }
  plan(): PlanStep[] {
    if (this.movesLeft <= 0) {
      this.bayStep++;
      this.movesLeft = 4;
      /* 走完一轮：原地掉头，先在当前贝转为装船，不跳过脚下这一贝 */
      if (this.bayStep >= this.bays.length) {
        this.mode = this.mode === "unload" ? "load" : "unload";
        this.bays = [...this.bays].reverse();
        this.bayStep = 0;
        return [];
      }
      return [{ k: "trolley", to: PARK_Y }, { k: "gantry", to: this.ship.bays[this.bay].cx }];
    }
    this.movesLeft--;
    const bay = this.bay, row = this.pickRow(bay);
    if (row < 0) { this.movesLeft = 0; return []; }
    const y = this.ship.rowY(row);
    if (this.mode === "unload") {
      return [
        { k: "trolley", to: y },
        { k: "hoist", to: () => this.ship.topZ(bay, row) + 0.1 },
        { k: "lock", where: "ship", bay, row },
        { k: "hoist", to: TRAVEL_Z },
        ...this.deliverToTruck(),
      ];
    }
    return [
      { k: "trolley", to: CRANE_LANE_Y },
      { k: "wait", need: "loaded" },
      { k: "hoist", to: 3 + TEU.h + 0.1 },
      { k: "lock", where: "truck" },
      { k: "hoist", to: TRAVEL_Z },
      { k: "release" },
      { k: "trolley", to: y },
      { k: "hoist", to: () => this.ship.topZ(bay, row) + TEU.h + 0.1 },
      { k: "unlock", where: "ship", bay, row },
      { k: "hoist", to: TRAVEL_Z },
    ];
  }

  /* 集卡停靠点：货箱中心对准吊具 */
  dockX(cargoOffset: number) { return this.crane.x - cargoOffset; }

  update(dt: number) {
    const cr = this.crane;
    if (!this.action) {
      if (!this.queue.length) this.queue.push(...this.plan());
      /* 取出的步骤在下面补上执行期字段后即为 CraneAction */
      const a = this.queue.shift() as CraneAction | undefined;
      if (!a) return;
      a.t = 0;
      if (a.k === "trolley") { a.from = cr.trolleyY; a.dur = 1.2 + Math.abs(a.to - a.from) / 22; }
      if (a.k === "hoist") { a.from = cr.spreaderZ; a.target = typeof a.to === "function" ? a.to() : a.to; a.dur = 0.9 + Math.abs(a.target - a.from) / 15; }
      if (a.k === "gantry") { a.from = cr.x; a.dur = 3 + Math.abs(a.to - a.from) / 5; cr.moving = true; }
      if (a.k === "lock" || a.k === "unlock") a.dur = 0.9;
      this.action = a;
    }
    const a = this.action;
    a.t += dt;
    const p = a.dur ? smooth(Math.min(1, a.t / a.dur)) : 1;
    const prevY = cr.trolleyY;
    if (a.k === "trolley") cr.trolleyY = a.from + (a.to - a.from) * p;
    else if (a.k === "hoist") cr.spreaderZ = a.from + (a.target - a.from) * p;
    else if (a.k === "gantry") cr.x = a.from + (a.to - a.from) * p;
    /* 吊具摆动：小车加减速驱动的阻尼摆 */
    const v = (cr.trolleyY - prevY) / Math.max(dt, 1e-3), acc = (v - this.vel) / Math.max(dt, 1e-3);
    this.vel = v;
    const k = 1.6, damp = 0.9;
    this.swayV += (-k * cr.sway - damp * this.swayV - acc * 0.035 * (cr.carry != null ? 1.3 : 1)) * dt;
    cr.sway = Math.max(-2.2, Math.min(2.2, cr.sway + this.swayV * dt));

    let done = a.dur ? a.t >= a.dur : false;
    if (a.k === "wait") {
      const d = this.docked;
      if (d) {
        const ok = a.need === "empty" ? d.cargo == null : d.cargo != null;
        if (ok) done = true;
        else { d.served = true; this.docked = null; }
      }
    }
    if (a.k === "release") {
      if (this.docked) this.docked.served = true;
      this.docked = null;
      done = true;
    }
    if (done) {
      if (a.k === "lock") {
        if (a.where === "ship") cr.carry = this.ship.take(a.bay, a.row);
        else if (this.docked) { cr.carry = this.docked.cargo; this.docked.cargo = null; }
      }
      if (a.k === "unlock") {
        if (a.where === "ship") this.ship.put(a.bay, a.row, cr.carry as number);
        else if (this.docked) this.docked.cargo = cr.carry;
        cr.carry = null;
      }
      if (a.k === "gantry") cr.moving = false;
      this.action = null;
    }
  }
}
