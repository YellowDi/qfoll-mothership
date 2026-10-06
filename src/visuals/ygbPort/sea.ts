/**
 * [INPUT]: 依赖 ./iso 的投影/色彩/随机，./layout 的岸线与水位
 * [OUTPUT]: 对外提供 Sea：拖船/引航艇沿样条航线航行 (离屏加速)、开尔文尾迹、航道浮标、日间粼光与夜间倒影；spline/at 样条工具与 SplinePath/PathPose/SeaLight 类型
 * [POS]: visuals/ygbPort 的海面动态层；只在泊位之外的水域活动，绘制顺序在岸桥上部结构之后
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { alpha, rng, tone, type Ctx, type Iso, type OboxOpts, type Pt } from "./iso";
import { QUAY_Y, WATER_Z } from "./layout";
import type { Palette } from "./palette";
import type { Xy } from "./roads";

export interface SplinePoint {
  x: number;
  y: number;
  /* 自起点的累计弧长 */
  s: number;
  h: number;
}

export interface SplinePath {
  pts: SplinePoint[];
  length: number;
}

export interface PathPose {
  x: number;
  y: number;
  h: number;
}

/* 夜间水面倒影的光源：位置、强度、颜色 */
export interface SeaLight {
  x: number;
  y: number;
  a: number;
  color: string;
}

interface BoatDef {
  kind: "tug" | "pilot";
  speed: number;
  /* 起始位置占航线全长的比例 */
  s: number;
  pts: Xy[];
}

interface Boat extends BoatDef {
  path: SplinePath;
  x: number;
  y: number;
  h: number;
  bob: number;
}

interface Buoy {
  x: number;
  y: number;
  color: string;
  phase: number;
}

interface Glint {
  x: number;
  y: number;
  phase: number;
  speed: number;
  len: number;
}

interface WakeSample {
  l: Pt;
  r: Pt;
  m: Pt;
  w: number;
}

/* 闭合 Catmull-Rom 样条 → 等距采样表 */
export function spline(points: Xy[], step = 4): SplinePath {
  const n = points.length, raw: Xy[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    for (let k = 0; k < 24; k++) {
      const t = k / 24, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      raw.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  const pts: SplinePoint[] = [];
  let s = 0;
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i], b = raw[(i + 1) % raw.length];
    pts.push({ x: a[0], y: a[1], s, h: Math.atan2(b[1] - a[1], b[0] - a[0]) });
    s += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return { pts, length: s };
}
export function at(path: SplinePath, s: number): PathPose {
  const L = path.length;
  s = ((s % L) + L) % L;
  let lo = 0, hi = path.pts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (path.pts[mid].s <= s) lo = mid; else hi = mid - 1;
  }
  const a = path.pts[lo], b = path.pts[(lo + 1) % path.pts.length], seg = ((b.s - a.s + L) % L) || 1, t = (s - a.s) / seg;
  let dh = b.h - a.h;
  while (dh > Math.PI) dh -= Math.PI * 2;
  while (dh < -Math.PI) dh += Math.PI * 2;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, h: a.h + dh * t };
}

const BOATS: BoatDef[] = [
  { kind: "tug", speed: 12, s: 0.18, pts: [[-1500, 560], [-700, 520], [-280, 476], [80, 458], [330, 500], [520, 700], [300, 1100], [-600, 1300], [-1500, 1000]] },
  { kind: "tug", speed: 10, s: 0.64, pts: [[900, 560], [300, 610], [-200, 640], [-600, 700], [-1100, 900], [-600, 1400], [700, 1200]] },
  { kind: "pilot", speed: 24, s: 0.4, pts: [[-1300, 760], [-420, 600], [120, 540], [600, 640], [900, 1000], [0, 1500], [-1300, 1250]] },
];

export class Sea {
  boats: Boat[];
  buoys: Buoy[];
  glints: Glint[];
  time: number;
  constructor() {
    this.boats = BOATS.map((b) => {
      const path = spline(b.pts);
      return { ...b, path, s: b.s * path.length, x: 0, y: 0, h: 0, bob: Math.random() * 6 };
    });
    const R = rng(99);
    this.buoys = ([[-330, 560, "#d1503c"], [-84, 604, "#3f9f6c"], [-560, 700, "#d1503c"], [160, 520, "#3f9f6c"]] as Array<[number, number, string]>).map(([x, y, color]) => ({ x, y, color, phase: R() * 6 }));
    this.glints = Array.from({ length: 170 }, () => ({ x: -1300 + R() * 2200, y: QUAY_Y + 14 + R() * 900, phase: R() * 40, speed: 0.6 + R() * 0.9, len: 3 + R() * 6 }));
    this.time = 0;
    this.update(0, () => true);
  }

  update(dt: number, isVisible: (x: number, y: number) => boolean) {
    this.time += dt;
    for (const b of this.boats) {
      /* 画面外加速，让可见航段更频繁地出现 */
      const fast = isVisible(b.x, b.y) ? 1 : 5;
      b.s = (b.s + b.speed * fast * dt) % b.path.length;
      const p = at(b.path, b.s);
      b.x = p.x; b.y = p.y; b.h = p.h;
    }
  }

  /* ─── 水面层：粼光、夜间倒影、尾迹 (在船体之前绘制) ─── */
  surface(ctx: Ctx, iso: Iso, c: Palette, dark: boolean, lights: SeaLight[]) {
    const t = this.time;
    if (!dark) {
      for (const g of this.glints) {
        if (!iso.visible(g.x, g.y, 10)) continue;
        const a = Math.pow(Math.max(0, Math.sin(t * g.speed + g.phase)), 6);
        if (a < 0.04) continue;
        iso.line(ctx, [[g.x, g.y, WATER_Z], [g.x + g.len, g.y, WATER_Z]], alpha("#ffffff", a * 0.55), 0.6);
      }
    } else {
      /* 灯光倒影：竖向碎亮带被水波切开，不越过岸线 */
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const L of lights) {
        for (let i = 0; i < 16; i++) {
          const y = L.y + 6 + i * 6, x = L.x + Math.sin(i * 2.1 + t * 0.9 + L.x) * 3;
          if (y < QUAY_Y + 2) continue;
          const fade = (1 - i / 16) * L.a;
          iso.line(ctx, [[x - 2 - i * 0.25, y, WATER_Z], [x + 4 + i * 0.25, y, WATER_Z]], alpha(L.color, fade), 0.7);
        }
      }
      ctx.restore();
    }
    for (const b of this.boats) if (iso.visible(b.x, b.y, 200)) this.wake(ctx, iso, c, dark, b);
  }

  /* 开尔文尾迹：两条约 19.5° 的发散浪 + 螺旋桨中央白水 */
  wake(ctx: Ctx, iso: Iso, c: Palette, dark: boolean, b: Boat) {
    const n = 18, ds = b.kind === "pilot" ? 9 : 6, spread = 0.36;
    const foam = dark ? "#9cc2c8" : c.foam;
    let prev: WakeSample | null = null;
    for (let k = 0; k <= n; k++) {
      const p = at(b.path, b.s - 12 - k * ds), rx = -Math.sin(p.h), ry = Math.cos(p.h), w = k * ds * spread + 3;
      const cur: WakeSample = { l: [p.x + rx * w, p.y + ry * w, WATER_Z], r: [p.x - rx * w, p.y - ry * w, WATER_Z], m: [p.x, p.y, WATER_Z], w };
      if (prev) {
        const a = Math.pow(1 - k / n, 1.6) * (dark ? 0.3 : 0.5);
        iso.line(ctx, [prev.l, cur.l], alpha(foam, a), 0.6);
        iso.line(ctx, [prev.r, cur.r], alpha(foam, a), 0.6);
        iso.line(ctx, [prev.m, cur.m], alpha(foam, a * 0.7), 2 + k * 0.22);
      }
      prev = cur;
    }
  }

  /* ─── 船只与浮标：按深度排序后逐个绘制 ─── */
  draw(ctx: Ctx, iso: Iso, c: Palette, dark: boolean) {
    const t = this.time;
    const items: Array<{ d: number; f: () => void }> = [];
    for (const b of this.boats) if (iso.visible(b.x, b.y, 80)) items.push({ d: b.x + b.y, f: () => this.boat(ctx, iso, c, dark, b) });
    for (const u of this.buoys) if (iso.visible(u.x, u.y, 40)) items.push({ d: u.x + u.y, f: () => this.buoy(ctx, iso, c, dark, u, t) });
    items.sort((a, b) => a.d - b.d);
    for (const it of items) it.f();
  }

  boat(ctx: Ctx, iso: Iso, c: Palette, dark: boolean, b: Boat) {
    const cos = Math.cos(b.h), sin = Math.sin(b.h), bob = Math.sin(this.time * 1.7 + b.bob) * 0.4;
    const W = (lx: number, ly: number): Xy => [b.x + lx * cos - ly * sin, b.y + lx * sin + ly * cos];
    const B = (lx0: number, lx1: number, ly0: number, ly1: number, z0: number, z1: number, color: string, o?: OboxOpts) => iso.obox(ctx, b.x, b.y, cos, sin, lx0, lx1, ly0, ly1, WATER_Z + z0 + bob, WATER_Z + z1 + bob, color, o);
    const pilot = b.kind === "pilot";
    const len = pilot ? 11 : 15, beam = pilot ? 4 : 5.6;
    /* 船体轮廓：尾部圆钝、首部收尖 */
    const outline: Xy[] = [];
    for (let i = 0; i <= 8; i++) {
      const a = -Math.PI / 2 + (i / 8) * Math.PI;
      outline.push(W(len * 0.55 + Math.cos(a) * len * 0.45, Math.sin(a) * beam * (1 - 0.1 * Math.cos(a))));
    }
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI / 2 + (i / 6) * Math.PI;
      outline.push(W(-len * 0.75 + Math.cos(a) * beam * 0.55, Math.sin(a) * beam));
    }
    const hull = pilot ? c.orange : c.tug;
    iso.poly(ctx, outline.map(([x, y]): Pt => [x + 2.5, y + 1.6, WATER_Z]), dark ? alpha("#000000", 0.25) : alpha(c.shadow, 0.18));
    iso.prism(ctx, outline, WATER_Z + bob - 0.5, WATER_Z + bob + 3.4, hull, { top: dark ? "#3a3b37" : tone(hull, 0.78) });
    iso.line(ctx, [...outline, outline[0]].map(([x, y]): Pt => [x, y, WATER_Z + bob + 3]), c.tire, pilot ? 0.6 : 1.3);
    if (pilot) {
      B(-4, 3, -2.6, 2.6, 3.4, 7.2, c.white, { faces: (nx, ny) => (dark ? tone(c.lit, 0.8) : tone(c.white, 0.75 + 0.08 * (ny - nx))) });
      B(-3, 2, -2.2, 2.2, 7.2, 7.8, c.white);
      iso.line(ctx, [[...W(0, 0), WATER_Z + 7.8 + bob], [...W(0, 0), WATER_Z + 11 + bob]], c.metal, 0.5);
    } else {
      B(-3, 7, -3.6, 3.6, 3.4, 9, c.tugTop, { faces: (nx, ny) => tone(c.tugTop, 0.75 + 0.08 * (ny - nx)) });
      B(6.9, 7.05, -3.2, 3.2, 6.4, 8.4, dark ? c.lit : c.glassDark);
      B(-1, 6, -3, 3, 9, 12.4, c.tugTop);
      B(5.9, 6.05, -2.8, 2.8, 10.2, 12, dark ? c.lit : c.glassDark);
      for (const ly of [-1.8, 1.8]) B(-6, -4.2, ly - 0.9, ly + 0.9, 3.4, 12, c.dark, { top: c.orange });
      B(-12, -8, -1.6, 1.6, 3.4, 5.6, c.metal);
      iso.line(ctx, [[...W(2, 0), WATER_Z + 12.4 + bob], [...W(2, 0), WATER_Z + 18 + bob]], c.metal, 0.6);
    }
    if (dark) {
      const m = W(pilot ? 0 : 2, 0);
      iso.glow(ctx, m[0], m[1], WATER_Z + (pilot ? 11 : 18) + bob, 6, "#fff6dc", 0.6, 1);
      const port = W(1, -beam), stbd = W(1, beam);
      iso.glow(ctx, port[0], port[1], WATER_Z + 9 + bob, 5, "#ff4f3f", 0.6, 1);
      iso.glow(ctx, stbd[0], stbd[1], WATER_Z + 9 + bob, 5, "#45e08f", 0.6, 1);
    }
  }

  buoy(ctx: Ctx, iso: Iso, c: Palette, dark: boolean, u: Buoy, t: number) {
    const bob = Math.sin(t * 1.3 + u.phase) * 0.5, ring = Array.from({ length: 10 }, (_, i): Xy => [u.x + Math.cos((i / 10) * Math.PI * 2) * 2.2, u.y + Math.sin((i / 10) * Math.PI * 2) * 2.2]);
    iso.prism(ctx, ring, WATER_Z - 0.5 + bob, WATER_Z + 3 + bob, u.color, { top: tone(u.color, 0.9) });
    iso.line(ctx, [[u.x, u.y, WATER_Z + 3 + bob], [u.x, u.y, WATER_Z + 8 + bob]], dark ? "#7d969b" : c.metal, 0.9);
    iso.box(ctx, u.x - 1, u.y - 1, WATER_Z + 7 + bob, 2, 2, 1.6, u.color);
    if ((t + u.phase) % 3 < 0.5) {
      iso.dot(ctx, u.x, u.y, WATER_Z + 9.5 + bob, 0.6, u.color);
      iso.glow(ctx, u.x, u.y, WATER_Z + 9.5 + bob, dark ? 10 : 4, u.color, dark ? 0.7 : 0.35, 1);
    }
  }
}
