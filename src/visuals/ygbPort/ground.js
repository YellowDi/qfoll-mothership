/**
 * [INPUT]: 依赖 ./layout 的分区常量、./roads 的 network 拓扑、./city 与 ./terminal 的地块绘制函数
 * [OUTPUT]: 对外提供 paintGround()，在静态地面层绘制海陆、港内铺装、公共道路、路口标线、码头前沿与岸壁
 * [POS]: visuals/ygbPort 的地面画家；只画 z≈0 的平面信息，立体物件交给场景深度排序
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { alpha, mix, tone } from "./iso";
import {
  APRON_LANES, BACK_ROAD, CITY_TOP, FENCE_Y, GATE, MAIN_ROAD, PERIMETER, QUAY_Y, RAIL_LAND, RAIL_SEA, WATER_Z, WORLD_X,
} from "./layout";
import { network } from "./roads";
import { arrow } from "./city";

const [WX0, WX1] = WORLD_X;

export function paintGround(ctx, iso, c, dark, { city, terminal, w, h }) {
  /* ─── 1. 底色：全画幅铺陆地，画面边界不露空白 ─── */
  const land = ctx.createLinearGradient(0, 0, w, h);
  land.addColorStop(0, c.landHi);
  land.addColorStop(1, c.land);
  ctx.fillStyle = land;
  ctx.fillRect(0, 0, w, h);

  /* ─── 2. 海面：深浅渐变 + 静态细浪 ─── */
  const sea = ctx.createLinearGradient(0, h * 0.35, w * 0.5, h);
  sea.addColorStop(0, c.water);
  sea.addColorStop(1, c.waterDeep);
  iso.poly(ctx, [[WX0 - 4000, QUAY_Y, WATER_Z], [WX1 + 4000, QUAY_Y, WATER_Z], [WX1 + 4000, 6000, WATER_Z], [WX0 - 4000, 6000, WATER_Z]], sea);
  for (let y = QUAY_Y + 30; y < 2200; y += 22) {
    for (let x = -2400 + ((y * 7) % 60); x < 2000; x += 78) {
      if (!iso.visible(x, y, 40)) continue;
      iso.line(ctx, [[x, y, WATER_Z], [x + 14 + ((x * 13 + y) % 11), y, WATER_Z]], dark ? alpha("#68858b", 0.08) : alpha("#d8ecdf", 0.16), 0.6);
    }
  }

  /* ─── 3. 港区铺装：堆场混凝土 + 前沿新浇混凝土 ─── */
  iso.rect(ctx, WX0, FENCE_Y, WX1, QUAY_Y, c.concrete);
  iso.rect(ctx, WX0, BACK_ROAD.y + BACK_ROAD.half, WX1, QUAY_Y, c.concreteHi);
  for (let x = WX0; x < WX1; x += 40) iso.line(ctx, [[x, BACK_ROAD.y + BACK_ROAD.half + 1], [x, QUAY_Y - 1]], dark ? alpha("#000000", 0.08) : alpha("#9aa8a3", 0.18), 0.35);

  /* ─── 4. 城区沥青 + 主干道 + 闸口道路 ─── */
  iso.rect(ctx, WX0, CITY_TOP, WX1, MAIN_ROAD.y + MAIN_ROAD.half, c.road);
  iso.rect(ctx, WX0, MAIN_ROAD.y + MAIN_ROAD.half, WX1, FENCE_Y, c.sidewalk);
  iso.line(ctx, [[WX0, MAIN_ROAD.y + MAIN_ROAD.half], [WX1, MAIN_ROAD.y + MAIN_ROAD.half]], c.curb, 1.3);
  iso.rect(ctx, GATE.x - GATE.half, MAIN_ROAD.y, GATE.x + GATE.half, PERIMETER.y + PERIMETER.half, c.road);
  city.paintBlocks(ctx, iso, c, dark);

  /* ─── 5. 港内道路：环路、堆场车道、过道、后方道路 ─── */
  const yardRoad = mix(c.road, c.concrete, dark ? 0.3 : 0.42);
  const internal = [];
  for (const e of new Set(network.edges.values())) {
    if (e.spec.public || e.spec.kind === "lot" || e.spec.kind === "apron") continue;
    internal.push(e);
    const hw = e.spec.half;
    if (e.horizontal) iso.rect(ctx, Math.min(e.a.x, e.b.x) - hw, e.a.y - hw, Math.max(e.a.x, e.b.x) + hw, e.a.y + hw, yardRoad);
    else iso.rect(ctx, e.a.x - hw, Math.min(e.a.y, e.b.y) - hw, e.a.x + hw, Math.max(e.a.y, e.b.y) + hw, yardRoad);
  }
  for (const s of terminal.surfaces) s(ctx, iso, c, dark);

  /* ─── 6. 中央分隔带：路口处断开，端头圆角 ─── */
  const streetX = [...new Set([...network.nodes.values()].filter((n) => n.y === MAIN_ROAD.y && n.edges.length >= 3 && n.edges.every((e) => e.spec.public)).map((n) => n.x))].sort((a, b) => a - b);
  const cuts = [WX0 - 100, ...streetX, WX1 + 100];
  for (let i = 0; i < cuts.length - 1; i++) {
    const x0 = cuts[i] + 34, x1 = cuts[i + 1] - 34;
    if (x1 - x0 < 20) continue;
    iso.roundRect(ctx, x0, MAIN_ROAD.y - MAIN_ROAD.median, x1, MAIN_ROAD.y + MAIN_ROAD.median, 3, c.curb);
    iso.roundRect(ctx, x0 + 1, MAIN_ROAD.y - MAIN_ROAD.median + 1, x1 - 1, MAIN_ROAD.y + MAIN_ROAD.median - 1, 2, c.hedge);
  }

  /* ─── 7. 标线 ─── */
  publicMarkings(ctx, iso, c, dark);
  internalMarkings(ctx, iso, c, dark, internal);

  /* ─── 8. 码头前沿：轨道、作业车道、安全线、系船柱、岸壁与护舷 ─── */
  quayEdge(ctx, iso, c, dark);
}

/* 节点处被横向道路占用的半宽 */
const perpHalf = (node, horizontal) => {
  let h = 0;
  for (const e of node.edges) if (e.horizontal !== horizontal) h = Math.max(h, e.spec.half);
  return h;
};

function publicMarkings(ctx, iso, c, dark) {
  const white = dark ? alpha("#9fb2b5", 0.55) : c.mark, yellow = dark ? alpha("#c9ad6a", 0.45) : c.yellow;
  for (const e of new Set(network.edges.values())) {
    if (!e.spec.public) continue;
    const H = e.horizontal, a = e.a, b = e.b;
    const along = (n) => (H ? n.x : n.y);
    const lo = along(a) < along(b) ? a : b, hi = lo === a ? b : a;
    const clear = (n) => (n.signal ? perpHalf(n, H) + 12 : perpHalf(n, H) ? perpHalf(n, H) + 3 : 0);
    const s0 = along(lo) + clear(lo), s1 = along(hi) - clear(hi);
    if (s1 - s0 < 6) continue;
    const P = (s, o) => (H ? [s, a.y + o] : [a.x + o, s]);
    const seg = (o, color, width, dash, from = s0, to = s1) => iso.line(ctx, [P(from, o), P(to, o)], color, width, dash);
    if (e.spec.kind === "street") {
      /* 双向两车道：路口前 28 单位黄实线禁止跨越，其余黄虚线 */
      const solid = 28;
      if (s1 - s0 > solid * 2 + 10) {
        seg(0, yellow, 0.75, null, s0, s0 + solid);
        seg(0, yellow, 0.75, [8, 9], s0 + solid, s1 - solid);
        seg(0, yellow, 0.75, null, s1 - solid, s1);
      } else seg(0, yellow, 0.75);
    } else if (e.spec.kind === "arterial") {
      for (const o of [-12, 12]) seg(o, white, 0.6, [8, 10]);
      for (const o of [-19.6, 19.6]) seg(o, white, 0.55);
    } else if (e.spec.kind === "gate") {
      for (const o of [-13, 13]) seg(o, white, 0.6, [6, 7]);
      seg(-0.8, yellow, 0.55);
      seg(0.8, yellow, 0.55);
    }
  }
  /* 信号路口：人行横道、停止线、导向箭头 */
  for (const n of network.nodes.values()) {
    if (!n.signal) continue;
    for (const e of n.edges) {
      const other = e.a === n ? e.b : e.a;
      const d = { x: Math.sign(other.x - n.x), y: Math.sign(other.y - n.y) };
      const half = e.spec.half, h = perpHalf(n, d.y === 0);
      const at = (s, o) => [n.x + d.x * s - d.y * o, n.y + d.y * s + d.x * o];
      /* 斑马线：条纹平行于车流方向 */
      for (let o = -half + 2; o <= half - 2; o += 3.2) iso.line(ctx, [at(h + 3, o), at(h + 9.5, o)], white, 1.4);
      /* 停止线覆盖驶入方向半幅：驶入车辆右侧在 (d.y, -d.x) 方向 */
      const inner = e.spec.kind === "arterial" ? MAIN_ROAD.median : e.spec.kind === "gate" ? 1.5 : 0.6;
      iso.line(ctx, [[n.x + d.x * (h + 12) + d.y * inner, n.y + d.y * (h + 12) - d.x * inner], [n.x + d.x * (h + 12) + d.y * (half - 1), n.y + d.y * (h + 12) - d.x * (half - 1)]], white, 1.1);
      if (e.spec.lanes.length > 1) for (const o of e.spec.lanes) arrow(ctx, iso, c, n.x + d.x * (h + 30) + d.y * o, n.y + d.y * (h + 30) - d.x * o, -d.x, -d.y, white);
    }
  }
}

function internalMarkings(ctx, iso, c, dark, internal) {
  const white = dark ? alpha("#93a8ab", 0.35) : alpha(c.paint, 0.9);
  const yellow = dark ? alpha("#c9ad6a", 0.3) : alpha(c.yellow, 0.85);
  for (const e of internal) {
    const H = e.horizontal, hw = e.spec.half;
    const lo = H ? Math.min(e.a.x, e.b.x) : Math.min(e.a.y, e.b.y), hi = H ? Math.max(e.a.x, e.b.x) : Math.max(e.a.y, e.b.y);
    const s0 = lo + perpHalf(H ? (e.a.x === lo ? e.a : e.b) : (e.a.y === lo ? e.a : e.b), H) + 2;
    const s1 = hi - perpHalf(H ? (e.a.x === hi ? e.a : e.b) : (e.a.y === hi ? e.a : e.b), H) - 2;
    if (s1 - s0 < 8) continue;
    const P = (s, o) => (H ? [s, e.a.y + o] : [e.a.x + o, s]);
    iso.line(ctx, [P(s0, 0), P(s1, 0)], white, 0.55, [7, 8]);
    for (const o of [-hw + 1.2, hw - 1.2]) iso.line(ctx, [P(s0, o), P(s1, o)], yellow, 0.5);
  }
}

function quayEdge(ctx, iso, c, dark) {
  const steel = dark ? alpha("#9bb6b8", 0.42) : alpha(c.rail, 0.7);
  /* 作业车道：车道线 + 两端导向 */
  for (const y of [APRON_LANES[0] - 6, ...APRON_LANES.map((l) => l + 6)]) iso.line(ctx, [[WX0, y], [WX1, y]], dark ? alpha("#93a8ab", 0.28) : alpha(c.paint, 0.85), 0.55, y === APRON_LANES[0] - 6 ? null : [10, 6]);
  for (let x = WX0 + 60; x < WX1; x += 260) arrow(ctx, iso, c, x, APRON_LANES[1], 1, 0, dark ? alpha("#93a8ab", 0.4) : c.paint);
  /* 岸桥轨道：双轨，轨槽在混凝土上留下暗缝 */
  for (const y of [RAIL_LAND, RAIL_SEA]) {
    iso.rect(ctx, WX0, y - 1.6, WX1, y + 1.6, dark ? "#26343a" : mix(c.concreteHi, c.rail, 0.25));
    iso.line(ctx, [[WX0, y - 0.6], [WX1, y - 0.6]], steel, 0.55);
    iso.line(ctx, [[WX0, y + 0.6], [WX1, y + 0.6]], steel, 0.55);
  }
  /* 后方安全通道 */
  iso.line(ctx, [[WX0, RAIL_LAND - 8], [WX1, RAIL_LAND - 8]], dark ? alpha("#c9ad6a", 0.3) : c.yellow, 0.7, [4, 3]);
  /* 前沿警示带 */
  for (let x = WX0; x < WX1; x += 12) iso.poly(ctx, [[x, QUAY_Y - 7], [x + 5, QUAY_Y - 7], [x + 7.5, QUAY_Y - 4], [x + 2.5, QUAY_Y - 4]], dark ? alpha("#c9ad6a", 0.35) : alpha(c.yellow, 0.9));
  /* 岸壁立面 */
  iso.poly(ctx, [[WX0, QUAY_Y, 0], [WX1, QUAY_Y, 0], [WX1, QUAY_Y, WATER_Z], [WX0, QUAY_Y, WATER_Z]], dark ? "#1b2a30" : tone(c.curb, 0.82));
  iso.line(ctx, [[WX0, QUAY_Y, 0], [WX1, QUAY_Y, 0]], dark ? alpha("#b6c9c6", 0.2) : alpha("#ffffff", 0.7), 0.6);
  for (let x = WX0; x < WX1; x += 26) {
    if (!iso.visible(x, QUAY_Y, 60)) continue;
    iso.poly(ctx, [[x, QUAY_Y + 0.6, -0.6], [x + 4.5, QUAY_Y + 0.6, -0.6], [x + 4.5, QUAY_Y + 0.6, WATER_Z + 0.8], [x, QUAY_Y + 0.6, WATER_Z + 0.8]], c.tire);
    const bx = x + 13;
    iso.box(ctx, bx - 1, QUAY_Y - 3.6, 0, 2, 2, 2.2, c.dark, { top: tone(c.dark, 1.3) });
  }
}
