/**
 * [INPUT]: 依赖 ./iso 的投影/色彩/随机，./layout 的船位与水位，./terminal 的 container 箱体绘制，./palette 的箱色权重
 * [OUTPUT]: 对外提供 Ship 类：舱位/箱格数据 (take/put/top)、分段精灵渲染 (按作业贝切分)、水面投影与夜灯
 * [POS]: visuals/ygbPort 的靠泊集装箱船；岸桥通过它的箱格接口装卸，版本号变化时场景重绘精灵
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { SUN, alpha, faceShade, mix, rng, tone } from "./iso";
import { SHIP, TEU, WATER_Z } from "./layout";
import { BOX_WEIGHTS, pick } from "./palette";
import { container } from "./terminal";

export const DECK_Z = 20;
const ROWS = 14, ROW_PITCH = 5.1, BAY = 25;
const Y0 = SHIP.y0, Y1 = SHIP.y1, YC = (Y0 + Y1) / 2, HALF = (Y1 - Y0) / 2;
const ROW0 = YC - (ROWS * ROW_PITCH) / 2;

/* 海侧轮廓：自艏尖沿南舷到艉部，遇到靠泊侧即止 */
function seaEdge(outline) {
  let tip = 0;
  for (let i = 1; i < outline.length; i++) if (outline[i][0] > outline[tip][0]) tip = i;
  const out = [];
  for (let k = 0; k < outline.length; k++) {
    const p = outline[(tip + k) % outline.length];
    if (k > 0 && p[1] < YC - 1) break;
    out.push(p);
  }
  return out;
}

/* 船体分段：船尾 → A 区 → 机舱/烟囱 → B 区 → 驾驶台 → C 区 → 艏楼 */
const LAYOUT = [["stern", 22], ["bay", 3], ["funnel", 18], ["bay", 6], ["bridge", 24], ["bay", 6], ["bow", 41]];

export class Ship {
  constructor() {
    this.bays = [];
    this.parts = {};
    let x = SHIP.x0;
    for (const [kind, n] of LAYOUT) {
      if (kind === "bay") for (let i = 0; i < n; i++, x += BAY) this.bays.push({ x0: x, x1: x + BAY, cx: x + BAY / 2 });
      else { this.parts[kind] = [x, x + n]; x += n; }
    }
    /* 箱量剖面：驾驶台前方受瞭望视线限制逐渐降低，外侧列略低 */
    const R = rng(1987);
    const bridge = this.parts.bridge[1];
    this.cells = this.bays.map((bay, i) => {
      const forward = bay.x0 >= bridge ? (bay.x0 - bridge) / BAY : 0;
      const base = 4.6 - forward * 0.35 + (R() - 0.5) * 1.2;
      const lines = [pick(R, BOX_WEIGHTS), pick(R, BOX_WEIGHTS), pick(R, BOX_WEIGHTS)];
      return Array.from({ length: ROWS }, (_, j) => {
        const edge = j === 0 || j === ROWS - 1 ? 1 : 0;
        const n = Math.max(1, Math.min(6, Math.round(base - edge + (R() - 0.5) * 1.3)));
        return Array.from({ length: n }, () => (R() < 0.62 ? lines[Math.floor(R() * 3)] : pick(R, BOX_WEIGHTS)));
      });
    });
    this.version = 0;
  }

  /* ─── 箱格接口：岸桥只通过这里改变船上状态 ─── */
  rowY(j) { return ROW0 + (j + 0.5) * ROW_PITCH; }
  bayIndexAt(x) { return this.bays.findIndex((b) => x >= b.x0 && x < b.x1); }
  height(i, j) { return this.cells[i][j].length; }
  topZ(i, j) { return DECK_Z + 2.5 + this.cells[i][j].length * TEU.h; }
  take(i, j) {
    const c = this.cells[i][j].pop();
    this.version++;
    return c;
  }
  put(i, j, color) {
    this.cells[i][j].push(color);
    this.version++;
  }

  /* ─── 船体外形：甲板线与水线两套轮廓，艏部外飘 ─── */
  outline(z) {
    const t = (z - WATER_Z) / (DECK_Z - WATER_Z);
    const pts = [];
    const sternX = SHIP.x0 + 8 * (1 - t), bowTip = SHIP.x1 - 9 * (1 - t), bowStart = SHIP.x1 - 80;
    const half = HALF * (0.93 + 0.07 * t);
    /* 艉封板：圆角 */
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI / 2 + (i / 6) * (Math.PI / 2);
      pts.push([sternX + 10 + Math.cos(a) * 10, YC + (half - 10) + Math.sin(a) * 10]);
    }
    for (let i = 0; i <= 6; i++) {
      const a = Math.PI + (i / 6) * (Math.PI / 2);
      pts.push([sternX + 10 + Math.cos(a) * 10, YC - (half - 10) + Math.sin(a) * 10]);
    }
    /* 靠泊侧 (北) 平行舯体 → 艏部 */
    for (let i = 0; i <= 14; i++) {
      const u = i / 14, x = bowStart + (bowTip - bowStart) * u;
      pts.push([x, YC - half * Math.pow(Math.max(0, 1 - Math.pow(u, 2.1 + (1 - t) * 0.6)), 0.55)]);
    }
    /* 海侧 (南) 艏部 → 平行舯体 */
    for (let i = 14; i >= 0; i--) {
      const u = i / 14, x = bowStart + (bowTip - bowStart) * u;
      pts.push([x, YC + half * Math.pow(Math.max(0, 1 - Math.pow(u, 2.1 + (1 - t) * 0.6)), 0.55)]);
    }
    return pts;
  }

  /* ─── 精灵绘制：part = "back" (x < split) | "front" (x ≥ split) ─── */
  draw(ctx, iso, c, dark, colors, split, part) {
    const inBack = (x) => x < split;
    const want = (x) => (part === "back" ? inBack(x) : !inBack(x));
    if (part === "back") this.hull(ctx, iso, c, dark);
    const [bx0, bx1] = this.parts.bow;
    if (want(bx0)) this.forecastle(ctx, iso, c, dark);
    const [sx0, sx1] = this.parts.stern;
    if (want(sx0)) this.sternDeck(ctx, iso, c, dark, sx0, sx1);
    for (let i = 0; i < this.bays.length; i++) {
      const bay = this.bays[i];
      if (!want(bay.x0)) continue;
      this.lashing(ctx, iso, c, bay.x0 - 0.3);
      this.bay(ctx, iso, c, dark, colors, i);
      if (i === this.bays.length - 1 || this.bays[i + 1].x0 !== bay.x1) this.lashing(ctx, iso, c, bay.x1 - 0.3);
    }
    const [fx0, fx1] = this.parts.funnel;
    if (want(fx0)) this.funnel(ctx, iso, c, dark, fx0, fx1);
    const [rx0, rx1] = this.parts.bridge;
    if (want(rx0)) this.bridge(ctx, iso, c, dark, rx0, rx1);
  }

  hull(ctx, iso, c, dark) {
    const deck = this.outline(DECK_Z), water = this.outline(WATER_Z), boot = this.outline(WATER_Z + 3.4);
    const hullColor = c.hullSide;
    /* 侧壁：逐段四边形，按法线受光；背向镜头的面剔除 */
    const faces = [];
    for (let i = 0; i < deck.length; i++) {
      const k = (i + 1) % deck.length;
      const ex = deck[k][0] - deck[i][0], ey = deck[k][1] - deck[i][1], len = Math.hypot(ex, ey) || 1;
      const nx = ey / len, ny = -ex / len;
      if (nx + ny <= 0.01) continue;
      faces.push({ i, k, nx, ny, depth: deck[i][0] + deck[i][1] + deck[k][0] + deck[k][1] });
    }
    faces.sort((a, b) => a.depth - b.depth);
    for (const f of faces) {
      const s = faceShade(f.nx, f.ny);
      iso.poly(ctx, [[...water[f.i], WATER_Z], [...water[f.k], WATER_Z], [...deck[f.k], DECK_Z], [...deck[f.i], DECK_Z]], tone(hullColor, s));
      iso.poly(ctx, [[...water[f.i], WATER_Z], [...water[f.k], WATER_Z], [...boot[f.k], WATER_Z + 3.4], [...boot[f.i], WATER_Z + 3.4]], tone(c.hullRed, s + 0.05));
    }
    /* 舷墙顶线与水线泡沫：只沿海侧 (面向镜头) 从艏尖走到艉部 */
    iso.line(ctx, seaEdge(deck).map(([x, y]) => [x, y, DECK_Z]), dark ? alpha("#c9d6cf", 0.2) : alpha("#ffffff", 0.75), 0.6);
    iso.line(ctx, seaEdge(water).map(([x, y]) => [x, y + 0.5, WATER_Z]), dark ? alpha("#9fc0c4", 0.25) : alpha(c.foam, 0.85), 0.8);
    /* 吃水标尺 */
    for (const x of [SHIP.x0 + 30, SHIP.x1 - 70]) for (let z = WATER_Z + 1; z < DECK_Z - 6; z += 2.4) iso.line(ctx, [[x, Y1 - 0.2, z], [x + 1.6, Y1 - 0.2, z]], alpha("#ffffff", dark ? 0.15 : 0.55), 0.35);
    /* 甲板 + 舱口盖 */
    iso.poly(ctx, deck.map(([x, y]) => [x, y, DECK_Z]), c.deck);
    for (const bay of this.bays) iso.box(ctx, bay.x0 + 0.8, ROW0 - 1.5, DECK_Z, BAY - 1.6, ROWS * ROW_PITCH + 3, 2.5, c.hatch);
    /* 系泊缆：从艏艉与舯部拉向码头系船柱 */
    const lineColor = dark ? alpha("#9fb3b2", 0.3) : alpha("#3d4b50", 0.42);
    for (const [sx, qx] of [[SHIP.x1 - 14, SHIP.x1 + 34], [SHIP.x1 - 22, SHIP.x1 - 60], [SHIP.x0 + 8, SHIP.x0 - 40], [SHIP.x0 + 16, SHIP.x0 + 60], [-40, -90], [-60, -10]]) {
      const pts = [];
      for (let t = 0; t <= 1; t += 0.125) pts.push([sx + (qx - sx) * t, Y0 + 2 + (318 - Y0 - 2) * t, DECK_Z + (2 - DECK_Z) * t - Math.sin(t * Math.PI) * 3]);
      iso.line(ctx, pts, lineColor, 0.3);
    }
  }

  forecastle(ctx, iso, c, dark) {
    const [x0] = this.parts.bow;
    const deck = this.outline(DECK_Z).filter(([x]) => x >= x0 - 1);
    iso.prism(ctx, deck, DECK_Z, DECK_Z + 4, c.hullSide, { top: c.deck, faces: (nx, ny) => tone(c.hullSide, faceShade(nx, ny)) });
    /* 防浪板 V 形 */
    iso.poly(ctx, [[x0 + 6, Y0 + 6, DECK_Z + 4], [x0 + 14, YC, DECK_Z + 4], [x0 + 14, YC, DECK_Z + 10], [x0 + 6, Y0 + 6, DECK_Z + 10]], tone(c.superstructure, 0.8));
    iso.poly(ctx, [[x0 + 14, YC, DECK_Z + 4], [x0 + 6, Y1 - 6, DECK_Z + 4], [x0 + 6, Y1 - 6, DECK_Z + 10], [x0 + 14, YC, DECK_Z + 10]], tone(c.superstructure, 0.9));
    for (const y of [YC - 14, YC + 10]) iso.box(ctx, x0 + 22, y, DECK_Z + 4, 6, 4, 3, c.metal);
    iso.line(ctx, [[x0 + 32, YC, DECK_Z + 4], [x0 + 32, YC, DECK_Z + 26]], c.superstructure, 1);
    iso.box(ctx, x0 + 31, YC - 1, DECK_Z + 22, 2, 2, 1.5, c.metal);
    /* 锚链筒与锚 */
    iso.poly(ctx, [[SHIP.x1 - 22, Y1 - 9, DECK_Z - 4], [SHIP.x1 - 17, Y1 - 7.4, DECK_Z - 4], [SHIP.x1 - 17, Y1 - 7.4, DECK_Z - 9], [SHIP.x1 - 22, Y1 - 9, DECK_Z - 9]], c.tire);
  }

  sternDeck(ctx, iso, c, dark, x0, x1) {
    iso.box(ctx, x0 + 6, YC - 12, DECK_Z, 6, 5, 3, c.metal);
    iso.box(ctx, x0 + 6, YC + 8, DECK_Z, 6, 5, 3, c.metal);
    /* 自由降落救生艇 */
    iso.box(ctx, x0 + 2, YC - 4, DECK_Z + 4, 3, 10, 6, c.metal);
    iso.box(ctx, x0 + 3, YC - 3, DECK_Z + 6, 13, 8, 5, c.orange, { top: tone(c.orange, 1.08) });
    iso.line(ctx, [[x0 + 1, YC, DECK_Z], [x0 + 1, YC, DECK_Z + 18]], c.metal, 0.5);
  }

  lashing(ctx, iso, c, x) {
    iso.box(ctx, x - 0.4, ROW0 - 1, DECK_Z + 2.5, 0.8, ROWS * ROW_PITCH + 2, 10.5, mix(c.steel, c.deck, 0.3), { side: tone(c.steel, 0.78), end: tone(c.steel, 0.66) });
    iso.line(ctx, [[x, ROW0 - 1, DECK_Z + 13.4], [x, Y1 - 4, DECK_Z + 13.4]], c.yellow, 0.45);
  }

  bay(ctx, iso, c, dark, colors, i) {
    const bay = this.bays[i], cells = this.cells[i], next = this.cells[i + 1] && this.bays[i + 1].x0 === bay.x1 ? this.cells[i + 1] : null;
    for (let j = 0; j < ROWS; j++) {
      const stack = cells[j], y = ROW0 + j * ROW_PITCH + 0.1;
      for (let k = 0; k < stack.length; k++) {
        const side = !(cells[j + 1] && cells[j + 1].length > k);
        const end = !(next && next[j].length > k);
        container(ctx, iso, c, dark, bay.x0 + 0.3, y, DECK_Z + 2.5 + k * TEU.h, TEU.l, TEU.w, TEU.h - 0.12, colors.box[stack[k]], false, side, end, k === stack.length - 1);
      }
    }
  }

  funnel(ctx, iso, c, dark, x0, x1) {
    iso.box(ctx, x0 + 1, YC - 20, DECK_Z, x1 - x0 - 2, 40, 28, c.superstructure, { side: tone(c.superstructure, 0.86), end: tone(c.superstructure, 0.72) });
    iso.box(ctx, x0 + 3, YC - 11, DECK_Z + 28, x1 - x0 - 6, 22, 14, c.superstructure, { side: tone(c.superstructure, 0.86), end: tone(c.superstructure, 0.72) });
    iso.box(ctx, x0 + 3, YC - 11, DECK_Z + 36, x1 - x0 - 6, 22, 4, c.orange);
    iso.box(ctx, x0 + 3, YC - 11, DECK_Z + 42, x1 - x0 - 6, 22, 1.4, c.dark);
    for (const y of [YC - 6, YC + 4]) iso.box(ctx, x0 + 6, y, DECK_Z + 43.4, 3, 3, 2.5, c.dark);
  }

  bridge(ctx, iso, c, dark, x0, x1) {
    const s = c.superstructure, H = 52;
    /* 生活区塔楼 */
    iso.box(ctx, x0 + 3, YC - 24, DECK_Z, x1 - x0 - 6, 48, H, s, { side: tone(s, 0.86), end: tone(s, 0.72), rim: dark ? undefined : alpha("#ffffff", 0.6) });
    for (let z = DECK_Z + 5; z < DECK_Z + H - 3; z += 6.4) {
      for (let y = YC - 21; y < YC + 21; y += 4.4) iso.poly(ctx, [[x1 - 3 + 0.1, y, z], [x1 - 3 + 0.1, y + 2.6, z], [x1 - 3 + 0.1, y + 2.6, z + 2.4], [x1 - 3 + 0.1, y, z + 2.4]], dark && (y * 7 + z) % 5 < 3 ? c.lit : dark ? "#1b2b31" : c.glassDark);
      for (let x = x0 + 5; x < x1 - 4; x += 4.4) iso.poly(ctx, [[x, YC + 24 + 0.1, z], [x + 2.6, YC + 24 + 0.1, z], [x + 2.6, YC + 24 + 0.1, z + 2.4], [x, YC + 24 + 0.1, z + 2.4]], dark && (x * 5 + z) % 7 < 3 ? c.lit : dark ? "#1b2b31" : c.glassDark);
    }
    /* 驾驶台：两翼伸到舷外，前窗连续玻璃带 */
    iso.box(ctx, x0 + 1, Y0 + 1, DECK_Z + H, x1 - x0 - 2, Y1 - Y0 - 2, 7, s, { side: tone(s, 0.86), end: tone(s, 0.72) });
    iso.poly(ctx, [[x1 - 1 + 0.1, YC - 22, DECK_Z + H + 2.5], [x1 - 1 + 0.1, YC + 22, DECK_Z + H + 2.5], [x1 - 1 + 0.1, YC + 22, DECK_Z + H + 5.6], [x1 - 1 + 0.1, YC - 22, DECK_Z + H + 5.6]], dark ? tone(c.lit, 0.8) : "#3f5d69");
    iso.box(ctx, x0 + 3, YC - 22, DECK_Z + H + 7, x1 - x0 - 6, 44, 1.2, tone(s, 0.95));
    /* 雷达桅 */
    const mx = (x0 + x1) / 2;
    iso.box(ctx, mx - 1.2, YC - 1.2, DECK_Z + H + 8, 2.4, 2.4, 11, c.superstructure);
    iso.line(ctx, [[mx, YC - 9, DECK_Z + H + 17], [mx, YC + 9, DECK_Z + H + 17]], c.metal, 0.9);
    iso.box(ctx, mx - 0.6, YC - 6, DECK_Z + H + 19.5, 1.2, 12, 0.8, c.dark);
  }

  /* ─── 白天：船体与货物投在水面的软影；烘焙到地面层 ─── */
  shadow(ctx, iso, c) {
    const deck = seaEdge(this.outline(DECK_Z));
    const h = DECK_Z + 4 * TEU.h - WATER_Z;
    ctx.save();
    iso.poly(ctx, [...deck.map(([x, y]) => [x, y, WATER_Z]), ...deck.slice().reverse().map(([x, y]) => [x + h * SUN.x, y + h * SUN.y, WATER_Z])], alpha(c.shadowSoft, 0.28));
    ctx.restore();
  }

  /* ─── 夜间：甲板泛光、驾驶台与航行灯 (随精灵烘焙) ─── */
  lights(ctx, iso) {
    const [bx0, bx1] = this.parts.bridge;
    for (const x of [SHIP.x0 + 40, SHIP.x0 + 140, bx0 - 30, bx1 + 60, SHIP.x1 - 60]) iso.glow(ctx, x, YC, DECK_Z + 30, 40, "#ffe1a2", 0.12, 0.6);
    iso.glow(ctx, (bx0 + bx1) / 2, Y1, DECK_Z + 56, 10, "#5dff8c", 0.45, 1);
    iso.glow(ctx, (bx0 + bx1) / 2, YC, DECK_Z + 72, 8, "#fff6dc", 0.5, 1);
    iso.glow(ctx, SHIP.x1 - 8, YC, DECK_Z + 26, 8, "#fff6dc", 0.5, 1);
    iso.glow(ctx, SHIP.x0 + 1, YC, DECK_Z + 18, 7, "#fff6dc", 0.45, 1);
  }

  bounds() {
    return [SHIP.x0 - 2, Y0 - 12, WATER_Z, SHIP.x1 + 2, Y1 + 2, DECK_Z + 80];
  }
}
