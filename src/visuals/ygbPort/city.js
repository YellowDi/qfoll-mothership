/**
 * [INPUT]: 依赖 ./layout 的 cityBlocks/街网常量，./roads 的 TRUCK_PARK，./structures 的建筑工厂，./vehicles 的停放车辆
 * [OUTPUT]: 对外提供 buildCity()，返回街坊地面 (人行道/出入口/场地) 绘制函数与静态物件、塔顶航标
 * [POS]: visuals/ygbPort 的城区编排者；自港向城密度递增：物流园 → 办公 → 高层城区
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { alpha, mix, rng } from "./iso";
import { cityBlocks } from "./layout";
import { TRUCK_PARK } from "./roads";
import { canopy, fence, shed, slab, streetLamp, tank, tower, tree, warehouse, booth } from "./structures";
import { parkedVehicle } from "./vehicles";
import { BOX_WEIGHTS, CAR_WEIGHTS, pick } from "./palette";

const SIDEWALK = 7;
const KIND = {
  "0:4": "logistics", "0:5": "truckPark", "0:6": "gas", "0:7": "logistics2", "0:8": "office", "0:9": "cold", "0:10": "tanks",
  "1:4": "residential", "1:5": "office", "1:6": "residential", "1:7": "towers", "1:8": "park", "1:9": "towers", "1:10": "office",
};

export function buildCity() {
  const objects = [], surfaces = [], blocks = [];
  const R = rng(20261005);
  const add = (o) => (Array.isArray(o) ? objects.push(...o) : objects.push(o));
  const parked = (x, y, h, type, extra = {}) => add(parkedVehicle({ x, y, h, type, cargo: type === "truck" && R() < 0.7 ? pick(R, BOX_WEIGHTS) : null, color: pick(R, CAR_WEIGHTS), cab: Math.floor(R() * 5), ...extra }));

  for (const b of cityBlocks) {
    const key = `${b.row}:${b.col}`;
    let kind = KIND[key];
    if (!kind) {
      const r = R();
      kind = b.row === 0 ? (r < 0.5 ? "logistics" : r < 0.8 ? "logistics2" : "cold") : b.row === 1 ? (r < 0.4 ? "office" : r < 0.75 ? "residential" : "towers") : r < 0.42 ? "towers" : r < 0.78 ? "residential" : r < 0.9 ? "office" : "park";
    }
    const block = { ...b, kind, drives: [], lot: "land" };
    blocks.push(block);
    const ix0 = b.x0 + SIDEWALK, ix1 = b.x1 - SIDEWALK, iy0 = b.y0 + SIDEWALK, iy1 = b.y1 - SIDEWALK;
    const seed = Math.floor(R() * 1e6);
    const S = rng(seed);

    /* ═══ 街坊内容 ═══ */
    if (kind === "logistics") {
      block.lot = "parking";
      block.drives.push({ side: "S", at: b.x0 + 190, w: 26 });
      add(warehouse({ x: ix0 + 14, y: iy0 + 16, w: ix1 - ix0 - 28, d: 146, h: 26, seed }));
      add(shed({ x: ix0 + 10, y: iy1 - 44, w: 46, d: 34, h: 18, color: "wall" }));
      for (let x = ix0 + 30; x < ix1 - 30; x += 15) if (S() < 0.55) parked(x, iy0 + 16 + 146 + 20, Math.PI / 2, "truck");
      for (let x = ix0 + 80; x < ix1 - 20; x += 28) add(tree(x, iy1 - 6, 0.85));
    } else if (kind === "logistics2") {
      block.lot = "parking";
      block.drives.push({ side: "S", at: b.x0 + 70, w: 24 });
      const w1 = (ix1 - ix0 - 40) * 0.46;
      add(warehouse({ x: ix0 + 12, y: iy0 + 14, w: w1, d: 128, h: 22, seed }));
      add(warehouse({ x: ix0 + 28 + w1, y: iy0 + 14, w: ix1 - ix0 - 40 - w1, d: 156, h: 27, seed: seed + 1, solar: true }));
      for (let x = ix0 + 22; x < ix0 + w1; x += 15) if (S() < 0.5) parked(x, iy0 + 14 + 128 + 20, Math.PI / 2, "truck");
      for (let x = ix0 + 40 + w1; x < ix1 - 14; x += 15) if (S() < 0.5) parked(x, iy0 + 14 + 156 + 20, Math.PI / 2, "truck");
    } else if (kind === "cold") {
      block.lot = "parking";
      block.drives.push({ side: "S", at: b.x0 + 200, w: 24 });
      add(warehouse({ x: ix0 + 16, y: iy0 + 14, w: 160, d: 118, h: 34, seed, docks: true }));
      add(shed({ x: ix0 + 196, y: iy0 + 30, w: 50, d: 60, h: 20, color: "white" }));
      for (let x = ix0 + 28; x < ix0 + 170; x += 15) if (S() < 0.6) parked(x, iy0 + 14 + 118 + 20, Math.PI / 2, "truck", { cargo: 2 });
    } else if (kind === "tanks") {
      block.lot = "pad";
      const t = [[ix0 + 50, iy0 + 60, 32, 40], [ix0 + 135, iy0 + 62, 30, 36], [ix0 + 215, iy0 + 60, 26, 34], [ix0 + 70, iy0 + 168, 26, 30], [ix0 + 150, iy0 + 172, 30, 38]];
      for (const [x, y, r, h] of t) add(tank({ x, y, r, h }));
      add(shed({ x: ix1 - 54, y: iy1 - 60, w: 40, d: 30, h: 14, color: "wall" }));
      surfaces.push((ctx, iso, c) => {
        for (const [x, y, r] of t) iso.line(ctx, [[x - r - 8, y - r - 8], [x + r + 8, y - r - 8], [x + r + 8, y + r + 8], [x - r - 8, y + r + 8], [x - r - 8, y - r - 8]], c.curb, 1.6);
        iso.line(ctx, [[ix0 + 10, iy0 + 118], [ix1 - 10, iy0 + 118]], c.metal, 1.2);
      });
    } else if (kind === "truckPark") {
      buildTruckPark(block, add, parked, surfaces, S);
    } else if (kind === "gas") {
      block.lot = "parking";
      block.drives.push({ side: "S", at: -232, w: 22 }, { side: "S", at: -110, w: 22 });
      add(canopy({ x: -214, y: -394, w: 100, d: 42, h: 15, band: "orange", columns: 3 }));
      for (const px of [-196, -164, -132]) add(shed({ x: px - 2, y: -380, w: 4, d: 14, h: 1.2, color: "curb", roof: "curb" }), shed({ x: px - 1.5, y: -376, w: 3, d: 6, h: 5.5, color: "white", roof: "orange" }));
      parked(-180, -358, 0, "truck");
      parked(-148, -386, 0, "car");
      add(shed({ x: -230, y: -458, w: 56, d: 30, h: 12, color: "white", roof: "roof" }));
      add(warehouse({ x: ix0 + 10, y: iy0 + 12, w: 150, d: 92, h: 20, seed, docks: true }));
      for (let x = ix0 + 22; x < ix0 + 150; x += 15) if (S() < 0.45) parked(x, iy0 + 12 + 92 + 20, Math.PI / 2, "truck");
      add(shed({ x: -98, y: -352, w: 3, d: 7, h: 28, color: "orange", roof: "white" }));
      for (let y = iy0 + 20; y < iy1 - 60; y += 26) add(tree(ix1 - 8, y, 0.9));
    } else if (kind === "office") {
      block.lot = "grass";
      block.drives.push({ side: "W", at: b.y1 - 70, w: 22 });
      const h1 = 40 + S() * 30;
      add(tower({ x: ix0 + 18, y: iy0 + 16, w: 72, d: 60, h: h1, seed, podium: 8, tint: 0.15 }));
      add(tower({ x: ix0 + 112, y: iy0 + 22, w: 96, d: 50, h: 30 + S() * 14, seed: seed + 2, podium: 6 }));
      add(slab({ x: ix1 - 74, y: iy0 + 100, w: 60, d: 76, h: 22, seed: seed + 3 }));
      surfaces.push((ctx, iso, c) => carPark(ctx, iso, c, ix0 + 10, iy1 - 110, ix0 + 170, iy1 - 10));
      for (let x = ix0 + 22; x < ix0 + 160; x += 12) for (const [y, h] of [[iy1 - 88, Math.PI / 2], [iy1 - 30, -Math.PI / 2]]) if (S() < 0.7) parked(x, y, h, "car");
      for (let x = ix0 + 190; x < ix1 - 10; x += 22) add(tree(x, iy1 - 30 - (x % 3) * 10, 0.9));
    } else if (kind === "park") {
      block.lot = "park";
      surfaces.push((ctx, iso, c, dark) => {
        const w = ix1 - ix0, d = iy1 - iy0;
        iso.line(ctx, [[ix0 + w * 0.08, iy1 - d * 0.1], [ix0 + w * 0.42, iy0 + d * 0.55], [ix0 + w * 0.58, iy0 + d * 0.32], [ix1 - w * 0.06, iy0 + d * 0.12]], c.path, 6);
        iso.line(ctx, [[ix0 + w * 0.12, iy0 + d * 0.2], [ix0 + w * 0.5, iy0 + d * 0.46], [ix1 - w * 0.1, iy1 - d * 0.14]], c.path, 4);
        const pond = [];
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2, r = 1 + 0.18 * Math.sin(a * 3 + 1);
          pond.push([ix0 + w * 0.68 + Math.cos(a) * w * 0.15 * r, iy0 + d * 0.62 + Math.sin(a) * d * 0.12 * r]);
        }
        iso.poly(ctx, pond, dark ? "#28556a" : "#75aab1");
        iso.line(ctx, [...pond, pond[0]], dark ? alpha("#9fd3d5", 0.2) : alpha("#e6f3ec", 0.7), 0.9);
      });
      for (let i = 0; i < 26; i++) {
        const x = ix0 + 14 + S() * (ix1 - ix0 - 28), y = iy0 + 14 + S() * (iy1 - iy0 - 28);
        if (Math.hypot((x - (ix0 + (ix1 - ix0) * 0.68)) / 1.3, y - (iy0 + (iy1 - iy0) * 0.62)) < 48) continue;
        add(tree(x, y, 0.85 + S() * 0.4));
      }
      add(shed({ x: ix0 + 40, y: iy0 + 40, w: 18, d: 18, h: 7, color: "white", roof: "orange" }));
    } else if (kind === "towers") {
      block.lot = "plaza";
      const n = 2 + Math.floor(S() * 2);
      const cells = n === 2 ? [[0, 0, 0.5, 0.55], [0.5, 0.35, 1, 1]] : [[0, 0, 0.5, 0.5], [0.5, 0, 1, 0.5], [0.15, 0.55, 0.7, 1]];
      cells.forEach(([u0, v0, u1, v1], i) => {
        const W = ix1 - ix0, D = iy1 - iy0, cx0 = ix0 + u0 * W + 10, cy0 = iy0 + v0 * D + 10, cw = (u1 - u0) * W - 20, cd = (v1 - v0) * D - 20;
        const w = Math.min(cw, 56 + S() * 30), d = Math.min(cd, 50 + S() * 26);
        add(tower({ x: cx0 + (cw - w) * S(), y: cy0 + (cd - d) * S(), w, d, h: 70 + S() * 110 - b.row * 0, seed: seed + i, podium: 8 + S() * 6, tint: S() * 0.3 }));
      });
      for (let x = ix0 + 16; x < ix1 - 10; x += 30) add(tree(x, iy1 - 10, 0.85));
    } else if (kind === "residential") {
      block.lot = "grass";
      const rows = 3;
      for (let i = 0; i < rows; i++) {
        const y = iy0 + 18 + i * ((iy1 - iy0 - 36) / rows);
        const w = (ix1 - ix0 - 50) / 2;
        add(slab({ x: ix0 + 14, y, w, d: 20, h: 36 + S() * 40, seed: seed + i }));
        add(slab({ x: ix0 + 34 + w, y: y + 6, w, d: 20, h: 36 + S() * 40, seed: seed + i + 10 }));
        for (let x = ix0 + 20; x < ix1 - 14; x += 26) if (S() < 0.6) add(tree(x, y + 44 + S() * 14, 0.8 + S() * 0.3));
      }
    }

    /* ═══ 行道树与路灯：沿人行道，避开转角与出入口 ═══ */
    const blocked = (side, v) => block.drives.some((d) => d.side === side && Math.abs(d.at - v) < d.w / 2 + 8);
    for (let x = b.x0 + 20; x < b.x1 - 16; x += 34) {
      if (!blocked("S", x)) add(tree(x, b.y1 - 3.5, 0.82));
      if (!blocked("N", x)) add(tree(x, b.y0 + 3.5, 0.82));
    }
    for (let y = b.y0 + 22; y < b.y1 - 16; y += 34) {
      if (!blocked("E", y)) add(tree(b.x1 - 3.5, y, 0.82));
      if (!blocked("W", y)) add(tree(b.x0 + 3.5, y, 0.82));
    }
    for (let x = b.x0 + 36; x < b.x1 - 20; x += 72) {
      if (!blocked("S", x)) add(streetLamp(x, b.y1 - 1.5, 0, 6));
      if (!blocked("N", x + 36)) add(streetLamp(x + 36, b.y0 + 1.5, 0, -6));
    }
    for (let y = b.y0 + 54; y < b.y1 - 20; y += 72) {
      if (!blocked("E", y)) add(streetLamp(b.x1 - 1.5, y, 6, 0));
      if (!blocked("W", y + 36)) add(streetLamp(b.x0 + 1.5, y + 36, -6, 0));
    }
  }

  /* ═══ 地面：路缘 → 人行道 → 场地 → 出入口 → 场地细节 ═══ */
  const paintBlocks = (ctx, iso, c, dark) => {
    for (const b of blocks) {
      iso.roundRect(ctx, b.x0, b.y0, b.x1, b.y1, 9, c.curb);
      iso.roundRect(ctx, b.x0 + 1.2, b.y0 + 1.2, b.x1 - 1.2, b.y1 - 1.2, 8, c.sidewalk);
      const lot = { land: c.land, parking: mix(c.parking, c.sidewalk, 0.35), grass: c.grass, park: c.park, plaza: mix(c.sidewalk, c.roof, 0.25), pad: mix(c.concrete, c.land, 0.4) }[b.lot];
      iso.roundRect(ctx, b.x0 + SIDEWALK, b.y0 + SIDEWALK, b.x1 - SIDEWALK, b.y1 - SIDEWALK, 3, lot);
      for (const d of b.drives) driveway(ctx, iso, c, b, d);
    }
    for (const s of surfaces) s(ctx, iso, c, dark);
  };
  return { objects, paintBlocks, blocks };
}

/* 出入口：路缘开口带喇叭口，铺装延伸进场地，像真实的车行坡道 */
function driveway(ctx, iso, c, b, d) {
  const h = d.w / 2, flare = 5, depth = SIDEWALK + 8;
  let pts;
  if (d.side === "S") pts = [[d.at - h - flare, b.y1], [d.at - h, b.y1 - flare], [d.at - h, b.y1 - depth], [d.at + h, b.y1 - depth], [d.at + h, b.y1 - flare], [d.at + h + flare, b.y1]];
  else if (d.side === "N") pts = [[d.at - h - flare, b.y0], [d.at - h, b.y0 + flare], [d.at - h, b.y0 + depth], [d.at + h, b.y0 + depth], [d.at + h, b.y0 + flare], [d.at + h + flare, b.y0]];
  else if (d.side === "W") pts = [[b.x0, d.at - h - flare], [b.x0 + flare, d.at - h], [b.x0 + depth, d.at - h], [b.x0 + depth, d.at + h], [b.x0 + flare, d.at + h], [b.x0, d.at + h + flare]];
  else pts = [[b.x1, d.at - h - flare], [b.x1 - flare, d.at - h], [b.x1 - depth, d.at - h], [b.x1 - depth, d.at + h], [b.x1 - flare, d.at + h], [b.x1, d.at + h + flare]];
  iso.poly(ctx, pts, c.roadHi);
  iso.line(ctx, [pts[0], pts[1], pts[2]], c.curb, 0.9);
  iso.line(ctx, [pts[3], pts[4], pts[5]], c.curb, 0.9);
}

function carPark(ctx, iso, c, x0, y0, x1, y1) {
  iso.rect(ctx, x0, y0, x1, y1, c.parking);
  for (let x = x0 + 6; x < x1 - 4; x += 12) {
    iso.line(ctx, [[x, y0 + 4], [x, y0 + 32]], c.paint, 0.55);
    iso.line(ctx, [[x, y1 - 32], [x, y1 - 4]], c.paint, 0.55);
  }
  iso.line(ctx, [[x0 + 4, (y0 + y1) / 2], [x1 - 4, (y0 + y1) / 2]], alpha(c.paint, 0.5), 0.6, [4, 5]);
}

/* ════════════════════════════════════════════════════════════════════
 * 集卡停车场：主干道右进 (道闸) → 场内主通道 → 东侧街道右出 (道闸)
 * ════════════════════════════════════════════════════════════════════ */
function buildTruckPark(block, add, parked, surfaces, S) {
  const P = TRUCK_PARK;
  block.lot = "parking";
  block.drives.push({ side: "S", at: P.entryX, w: 24 }, { side: "E", at: P.aisleY, w: 22 });
  const x0 = block.x0 + SIDEWALK, x1 = block.x1 - SIDEWALK, y0 = block.y0 + SIDEWALK, y1 = block.y1 - SIDEWALK;
  /* 车位：北侧两排背靠背，南侧一排；车头朝通道 */
  const stalls = [];
  for (let x = x0 + 12; x < x1 - 30; x += 11.5) {
    stalls.push([x, P.aisleY - 30, Math.PI / 2]);
    stalls.push([x, P.aisleY - 72, -Math.PI / 2]);
    if (Math.abs(x - P.entryX) > 22) stalls.push([x, P.aisleY + 30, -Math.PI / 2]);
    if (x > P.entryX + 22 && x < x1 - 30) stalls.push([x, P.aisleY + 74, Math.PI / 2]);
  }
  for (const [x, y, h] of stalls) if (S() < 0.72) parked(x, y, h, "truck");
  add(booth(P.entryX - 18, P.gateY - 4));
  add(booth(P.exitX - 2, P.aisleY - 14, 5, 4));
  add(shed({ x: x0 + 8, y: y1 - 52, w: 44, d: 26, h: 10, color: "white", roof: "roof" }));
  add(fence(x0 + 2, y1 - 2, P.entryX - 16, y1 - 2));
  add(fence(P.entryX + 16, y1 - 2, x1 - 2, y1 - 2));
  add(fence(x1 - 2, y0 + 2, x1 - 2, P.aisleY - 14));
  add(fence(x1 - 2, P.aisleY + 14, x1 - 2, y1 - 2));
  surfaces.push((ctx, iso, c) => {
    /* 场内通道与入口车道 */
    iso.rect(ctx, P.entryX - 9, P.aisleY - 9, x1, P.aisleY + 9, c.roadHi);
    iso.rect(ctx, P.entryX - 9, P.aisleY, P.entryX + 9, y1, c.roadHi);
    iso.rect(ctx, x0 + 6, P.aisleY - 104, x1 - 30, P.aisleY - 90, c.roadHi);
    iso.line(ctx, [[P.entryX + 30, P.aisleY], [x1 - 6, P.aisleY]], c.paint, 0.6, [6, 6]);
    /* 车位线 */
    for (let x = x0 + 6; x < x1 - 24; x += 11.5) {
      iso.line(ctx, [[x, P.aisleY - 12], [x, P.aisleY - 48]], c.paint, 0.55);
      iso.line(ctx, [[x, P.aisleY - 54], [x, P.aisleY - 90]], c.paint, 0.55);
      if (Math.abs(x - P.entryX) > 16) iso.line(ctx, [[x, P.aisleY + 12], [x, P.aisleY + 48]], c.paint, 0.55);
      if (x > P.entryX + 16) iso.line(ctx, [[x, P.aisleY + 56], [x, P.aisleY + 92]], c.paint, 0.55);
    }
    /* 入口导向箭头与停止线 */
    iso.line(ctx, [[P.entryX - 8, P.gateY + 8], [P.entryX + 8, P.gateY + 8]], c.paint, 1);
    arrow(ctx, iso, c, P.entryX + 4, P.gateY + 26, 0, -1);
    arrow(ctx, iso, c, x1 - 22, P.aisleY + 4, 1, 0);
  });
}

export function arrow(ctx, iso, c, x, y, dx, dy, color) {
  const px = -dy, py = dx, L = 7;
  iso.poly(ctx, [
    [x - dx * L - px * 0.7, y - dy * L - py * 0.7], [x + dx * 1 - px * 0.7, y + dy * 1 - py * 0.7], [x + dx * 1 - px * 2, y + dy * 1 - py * 2],
    [x + dx * 4, y + dy * 4], [x + dx * 1 + px * 2, y + dy * 1 + py * 2], [x + dx * 1 + px * 0.7, y + dy * 1 + py * 0.7], [x - dx * L + px * 0.7, y - dy * L + py * 0.7],
  ], color ?? c.paint);
}

