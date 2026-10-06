/**
 * [INPUT]: 依赖 ./layout 的堆场/闸口/港界常量，./structures 的建筑与照明工厂，./vehicles 的停放车辆，./palette 的箱色权重
 * [OUTPUT]: 对外提供 buildTerminal()，返回堆场箱区 (按贝切块)、RTG、闸口雨棚与岗亭、港务配套与围网、地面标线绘制函数，以及 Terminal/YardBlockData/BoxCell 类型与 container 箱体绘制
 * [POS]: visuals/ygbPort 的港内编排者；箱区按贝切块参与深度排序，保证集卡在箱区之间穿行时遮挡正确
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { alpha, mix, rng, tone, type Ctx, type Iso } from "./iso";
import { BAY, FENCE_Y, GATE, PERIMETER, TEU, WORLD_X, yardBlocks, type YardBlock } from "./layout";
import { BOX_WEIGHTS, pick, type Palette, type ThemeColors } from "./palette";
import { boxShadow, booth, canopy, controlTower, fence, highMast, shed, slab, tree, warehouse } from "./structures";
import { parkedVehicle } from "./vehicles";
import type { AddItem, StaticItem, SurfacePainter } from "./types";

export type YardKind = "empty" | "reefer" | "laden";

/* 箱位里的一只箱：色索引与是否拆成两个 20 尺 */
export interface BoxCell {
  color: number;
  split: boolean;
}

/* grid[贝][列] 为自下而上的箱层 */
export interface YardBlockData extends YardBlock {
  bx0: number;
  nBays: number;
  grid: BoxCell[][][];
  kind: YardKind;
}

export interface Terminal {
  objects: StaticItem[];
  surfaces: SurfacePainter[];
  blocks: YardBlockData[];
}

const ROWS = 6, ROW_PITCH = 5.5, TIER = TEU.h;

export function buildTerminal(): Terminal {
  const objects: StaticItem[] = [], surfaces: SurfacePainter[] = [], blocks: YardBlockData[] = [];
  const R = rng(7341);
  const add: AddItem = (o) => (Array.isArray(o) ? objects.push(...o) : objects.push(o));

  /* ═══ 箱区：每格记录层数、箱色与 20/40 尺 ═══ */
  for (const yb of yardBlocks) {
    const nBays = Math.floor((yb.x1 - yb.x0 - 12) / BAY);
    const bx0 = yb.x0 + (yb.x1 - yb.x0 - nBays * BAY) / 2;
    const r = R();
    const kind = yb.row === 4 && yb.col % 3 === 1 ? "empty" : yb.row === 3 && yb.col === 6 ? "reefer" : "laden";
    const fill = kind === "empty" ? 0.8 : 0.3 + R() * 0.45;
    const maxTier = kind === "empty" ? 6 : kind === "reefer" ? 3 : 4;
    const grid: BoxCell[][][] = [];
    for (let i = 0; i < nBays; i++) {
      const bayBias = (R() - 0.5) * 2.2 + (r < 0.18 && i > nBays * 0.6 ? -4 : 0) + (R() < 0.1 ? -6 : 0);
      grid.push(Array.from({ length: ROWS }, (_, j) => {
        const tiers = Math.max(0, Math.min(maxTier, Math.round(fill * maxTier + bayBias + (R() - 0.5) * 1.6 - (j === 0 ? 0.6 : 0))));
        const base = kind === "reefer" ? 2 : kind === "empty" ? [0, 3, 5, 1][Math.floor(R() * 4)] : -1;
        return Array.from({ length: tiers }, () => ({
          color: base >= 0 ? (R() < 0.8 ? base : pick(R, BOX_WEIGHTS)) : pick(R, BOX_WEIGHTS),
          split: kind === "laden" && R() < 0.22,
        }));
      }));
    }
    const block: YardBlockData = { ...yb, bx0, nBays, grid, kind };
    blocks.push(block);
    const rowY = (j: number) => yb.y0 + 6 + j * ROW_PITCH;
    for (let i = 0; i < nBays; i++) {
      const x = bx0 + i * BAY;
      const top = Math.max(0, ...grid[i].map((s) => s.length)) * TIER;
      if (!top) continue;
      add({
        x0: x, y0: rowY(0), z0: 0, x1: x + BAY, y1: rowY(ROWS), z1: top, depth: x + BAY / 2 + (rowY(0) + rowY(ROWS)) / 2,
        draw: (ctx, iso, c, dark, colors) => drawBay(ctx, iso, c, dark, colors, block, i, x, rowY),
        shadow: (ctx, iso, c) => boxShadow(ctx, iso, c, x, rowY(0), BAY - 0.6, ROWS * ROW_PITCH, top, 0.16),
      });
    }
    if (kind === "reefer") add(reeferRacks(block, rowY));
  }

  /* ═══ RTG：静置于部分箱区，跨 6 列 + 作业车道 ═══ */
  for (const block of blocks) {
    if (block.kind === "empty" || (block.row + block.col) % 3 !== 0) continue;
    const bay = 1 + Math.floor(R() * (block.nBays - 2));
    add(rtg(block.bx0 + bay * BAY - 7, block.y0 + 1.5, block.y1 - 1.5));
  }
  /* 空箱区配正面吊 */
  for (const block of blocks) if (block.kind === "empty") add(parkedVehicle({ type: "stacker", x: block.x1 + 2, y: block.y0 + 24, h: Math.PI, color: 0 }));

  /* ═══ 高杆灯：箱区端部错位布置 ═══ */
  for (const block of blocks) if ((block.row + block.col) % 2 === 0) add(highMast(block.x0 + 5, (block.y0 + block.y1) / 2));

  /* ═══ 港务配套：闸口、控制塔、维修车间、CFS 仓库、办公与停车 ═══ */
  const gx0 = GATE.x - GATE.half, gx1 = GATE.x + GATE.half;
  add(canopy({ x: gx0 - 4, y: GATE.canopy[0], w: gx1 - gx0 + 8, d: GATE.canopy[1] - GATE.canopy[0], h: 17, band: "orange", columns: 5, lightRows: 3 }));
  for (const ix of [GATE.x - 13, GATE.x + 13]) add(booth(ix - 2, GATE.y - 8, 4, 6));
  add(booth(GATE.x - 2, GATE.y - 2, 4, 4));
  add(controlTower({ x: -214, y: -250 }));
  add(warehouse({ x: -660, y: -258, w: 170, d: 62, h: 24, seed: 41, docks: true }));
  add(warehouse({ x: -70, y: -258, w: 210, d: 54, h: 20, seed: 42, docks: true }));
  for (let x = -60; x < 130; x += 15) if (R() < 0.6) add(parkedVehicle({ type: "truck", x, y: -258 + 54 + 20, h: Math.PI / 2, cargo: pick(R, BOX_WEIGHTS), cab: Math.floor(R() * 5) }));
  add(shed({ x: 220, y: -258, w: 100, d: 50, h: 30, color: "wall" }));
  for (let x = 372; x < 480; x += 11) for (const [y, h] of [[-238, Math.PI / 2], [-206, -Math.PI / 2]]) if (R() < 0.7) add(parkedVehicle({ type: "car", x, y, h, color: Math.floor(R() * 7) }));
  for (let x = -980; x < -720; x += 30) add(parkedVehicle({ type: "stacker", x, y: -232, h: Math.PI / 2, color: 0 }));
  add(shed({ x: 560, y: -252, w: 40, d: 40, h: 14, color: "white" }), shed({ x: 610, y: -252, w: 26, d: 40, h: 10, color: "white" }));
  /* 海关 H986 查验通道：屏蔽墙 + 顶板，内有正在扫描的集卡 */
  add(xrayPortal(-324, -252, 62, 52));
  add(parkedVehicle({ type: "truck", x: -290, y: -226, h: 0, cargo: pick(R, BOX_WEIGHTS), cab: 2 }));
  /* 港内拖车停放区 */
  for (let i = 0; i < 5; i++) add(parkedVehicle({ type: "tractor", x: -462 + i * 14, y: -226, h: Math.PI / 2, cab: 0 }));
  /* 员工楼 + 小停车场 */
  add(slab({ x: -182, y: -260, w: 70, d: 30, h: 17, seed: 77 }));
  for (let x = -176; x < -104; x += 10) if (R() < 0.75) add(parkedVehicle({ type: "car", x, y: -206, h: -Math.PI / 2, color: Math.floor(R() * 7) }));
  /* 变电所：变压器 + 围网 */
  for (const [x, y] of [[156, -248], [172, -248], [156, -230]]) add(shed({ x, y, w: 10, d: 12, h: 8, color: "metal", roof: "steel" }));
  add(fence(148, -256, 196, -256, 5), fence(148, -212, 196, -212, 5));
  /* 港界围网与绿化带 */
  add(fence(WORLD_X[0], FENCE_Y, gx0 - 6, FENCE_Y));
  add(fence(gx1 + 6, FENCE_Y, WORLD_X[1], FENCE_Y));
  for (let x = WORLD_X[0] + 20; x < WORLD_X[1]; x += 30) if (x < gx0 - 16 || x > gx1 + 16) add(tree(x, FENCE_Y - 5, 0.78));

  /* ═══ 地面：箱位线、车道线、闸口标线 ═══ */
  surfaces.push((ctx, iso, c, dark) => {
    const line = dark ? alpha("#8fa7ab", 0.22) : alpha(c.paint, 0.75);
    for (const b of blocks) {
      const y0 = b.y0 + 6, y1 = y0 + ROWS * ROW_PITCH;
      iso.rect(ctx, b.x0, b.y0, b.x1, b.y1, c.pad);
      iso.line(ctx, [[b.x0 + 2, b.y0 + 2], [b.x1 - 2, b.y0 + 2], [b.x1 - 2, b.y1 - 2], [b.x0 + 2, b.y1 - 2], [b.x0 + 2, b.y0 + 2]], alpha(c.yellow, dark ? 0.35 : 0.8), 0.7);
      for (let i = 0; i <= b.nBays; i++) iso.line(ctx, [[b.bx0 + i * BAY, y0], [b.bx0 + i * BAY, y1]], line, 0.4);
      for (let j = 0; j <= ROWS; j++) iso.line(ctx, [[b.bx0, y0 + j * ROW_PITCH], [b.bx0 + b.nBays * BAY, y0 + j * ROW_PITCH]], line, 0.4);
      iso.line(ctx, [[b.bx0, y1 + 6.5], [b.bx0 + b.nBays * BAY, y1 + 6.5]], alpha(c.paint, dark ? 0.15 : 0.55), 0.5, [5, 4]);
    }
    /* 闸口：车道分隔、导流岛、停车线 */
    for (const ix of [GATE.x - 13, GATE.x, GATE.x + 13]) iso.roundRect(ctx, ix - 2.2, GATE.canopy[0] - 2, ix + 2.2, GATE.canopy[1] + 2, 2, c.curb);
    for (const ix of [GATE.x - 13, GATE.x + 13]) {
      iso.line(ctx, [[ix, PERIMETER.y - 14], [ix, GATE.canopy[0] - 4]], c.paint, 0.6, [5, 5]);
      iso.line(ctx, [[ix, GATE.canopy[1] + 4], [ix, -282]], c.paint, 0.6, [5, 5]);
    }
    for (let x = gx0 + 2; x < gx1 - 1; x += 3) iso.line(ctx, [[x, -270], [x, -262]], alpha(c.paint, 0.9), 1.2);
    iso.line(ctx, [[gx0, GATE.canopy[0] - 8], [GATE.x, GATE.canopy[0] - 8]], c.paint, 1.1);
    iso.line(ctx, [[GATE.x, GATE.canopy[1] + 8], [gx1, GATE.canopy[1] + 8]], c.paint, 1.1);
    /* 地磅：进港车道上的钢板 */
    for (const lx of [GATE.x - 19.5, GATE.x - 6.5]) iso.rect(ctx, lx - 4, GATE.canopy[1] + 12, lx + 4, GATE.canopy[1] + 26, dark ? "#3a4a50" : "#9aa9ac");
    /* 查验通道与拖车停放区标线 */
    iso.rect(ctx, -330, -240, -256, -212, dark ? "#2a3a40" : mix(c.concrete, c.road, 0.25));
    for (let x = -468; x < -390; x += 14) iso.line(ctx, [[x, -246], [x, -206]], c.paint, 0.5);
    iso.rect(ctx, -184, -214, -100, -196, c.parking);
    for (let x = -181; x < -100; x += 10) iso.line(ctx, [[x, -214], [x, -198]], c.paint, 0.45);
    /* 员工停车场 */
    iso.rect(ctx, 362, -252, 486, -192, c.parking);
    for (let x = 366; x < 484; x += 11) {
      iso.line(ctx, [[x, -250], [x, -226]], c.paint, 0.5);
      iso.line(ctx, [[x, -218], [x, -194]], c.paint, 0.5);
    }
  });

  return { objects, surfaces, blocks };
}

/* ─── 单贝箱垛：逐箱绘制，邻格遮挡的面直接剔除 ─── */
function drawBay(ctx: Ctx, iso: Iso, c: Palette, dark: boolean, colors: ThemeColors, block: YardBlockData, i: number, x: number, rowY: (j: number) => number) {
  const bay = block.grid[i], next = block.grid[i + 1];
  for (let j = 0; j < ROWS; j++) {
    const stack = bay[j], y = rowY(j);
    for (let k = 0; k < stack.length; k++) {
      const cell = stack[k], color = colors.box[cell.color], z = k * TIER;
      const showSide = !(bay[j + 1] && bay[j + 1].length > k);
      const showEnd = !(next && next[j] && next[j].length > k);
      const showTop = k === stack.length - 1;
      container(ctx, iso, c, dark, x + 0.3, y + 0.3, z, TEU.l, TEU.w, TIER - 0.15, color, cell.split, showSide, showEnd, showTop);
    }
  }
}

export function container(ctx: Ctx, iso: Iso, c: Palette, dark: boolean, x: number, y: number, z: number, l: number, w: number, h: number, color: string, split: boolean, side: boolean, end: boolean, top: boolean) {
  const parts: Array<[number, number]> = split ? [[x, TEU.l20], [x + l - TEU.l20, TEU.l20]] : [[x, l]];
  for (const [px, pl] of parts) {
    const z1 = z + h;
    if (side) {
      iso.poly(ctx, [[px, y + w, z], [px + pl, y + w, z], [px + pl, y + w, z1], [px, y + w, z1]], tone(color, 0.83));
      const rib = dark ? alpha("#ffffff", 0.05) : alpha(tone(color, 1.14), 0.55);
      for (let a = 1.6; a < pl - 1; a += 2.4) iso.line(ctx, [[px + a, y + w + 0.05, z + 0.5], [px + a, y + w + 0.05, z1 - 0.5]], rib, 0.3);
    }
    if (end || (split && px === x)) {
      iso.poly(ctx, [[px + pl, y, z], [px + pl, y + w, z], [px + pl, y + w, z1], [px + pl, y, z1]], tone(color, 0.67));
      iso.line(ctx, [[px + pl + 0.05, y + w / 2, z + 0.4], [px + pl + 0.05, y + w / 2, z1 - 0.4]], alpha(tone(color, 0.5), 0.8), 0.3);
    }
    if (top) iso.poly(ctx, [[px, y, z1], [px + pl, y, z1], [px + pl, y + w, z1], [px, y + w, z1]], tone(color, 1.03));
  }
}

/* ─── 查验通道：后墙 → (车) → 前墙 → 顶板，拆成三个深度件 ─── */
function xrayPortal(x: number, y: number, w: number, d: number): StaticItem[] {
  const H = 15, T = 4;
  const wall = (wy: number, depth: number): StaticItem => ({
    x0: x, y0: wy, z0: 0, x1: x + w, y1: wy + T, z1: H, depth,
    draw: (ctx, iso, c) => iso.box(ctx, x, wy, 0, w, T, H, c.wall, { top: c.roof, side: tone(c.wall, 0.92), end: c.shade }),
  });
  return [
    wall(y, x + w / 2 + y),
    wall(y + d - T, x + w / 2 + y + d),
    {
      x0: x - 2, y0: y - 2, z0: H, x1: x + w + 2, y1: y + d + 2, z1: H + 4, depth: x + w + y + d + 2,
      draw: (ctx, iso, c, dark) => {
        iso.box(ctx, x - 2, y - 2, H, w + 4, d + 4, 3, c.roof, { side: c.orange, end: tone(c.orange, 0.8) });
        iso.box(ctx, x + w * 0.3, y + d * 0.25, H + 3, 14, 10, 3, c.metal);
        if (dark) iso.line(ctx, [[x + 4, y + d + 2.1, H + 1.5], [x + w - 4, y + d + 2.1, H + 1.5]], alpha("#ffcf8a", 0.8), 1);
      },
      shadow: (ctx, iso, c) => boxShadow(ctx, iso, c, x, y, w, d, H + 3, 0.18),
    },
  ];
}

/* ─── 冷藏箱区供电架：钢平台跨在箱列之间 ─── */
function reeferRacks(block: YardBlockData, rowY: (j: number) => number): StaticItem {
  const x0 = block.bx0, x1 = block.bx0 + block.nBays * BAY;
  return {
    x0, y0: rowY(0), z0: 0, x1, y1: rowY(0) + 1, z1: 18, depth: (x0 + x1) / 2 + rowY(0) - 2,
    draw: (ctx, iso, c) => {
      for (let x = x0; x <= x1; x += BAY) iso.box(ctx, x - 0.6, rowY(0) - 2, 0, 1.2, 1.2, 18, c.yellow);
      iso.box(ctx, x0, rowY(0) - 2.4, 17, x1 - x0, 2, 1, c.yellow);
    },
  };
}

/* ─── RTG：两侧门腿与大梁拆成三个深度件，箱垛夹在中间 ─── */
function rtg(x: number, y0: number, y1: number): StaticItem[] {
  const W = 14, H = 36;
  const side = (y: number, back: boolean): StaticItem => ({
    x0: x - 3, y0: y - 1.5, z0: 0, x1: x + W + 3, y1: y + 1.5, z1: H, depth: x + W / 2 + y + (back ? -6 : 0),
    draw: (ctx, iso, c) => {
      const white = c.craneWhite;
      iso.box(ctx, x - 3, y - 1.4, 0, W + 6, 2.8, 2.8, tone(white, 0.9));
      for (const wx of [x - 2, x + W - 2]) iso.box(ctx, wx, y - 1.6, 0, 4, 3.2, 1.8, "#26343b");
      for (const lx of [x, x + W - 2]) iso.box(ctx, lx, y - 1, 2.8, 2, 2, H - 2.8, white);
      iso.line(ctx, [[x + 1, y, 4], [x + W - 1, y, H - 4]], tone(white, 0.8), 0.6);
      if (!back) iso.box(ctx, x + 3, y - 1.6, 3, W - 6, 3.2, 6, c.metal);
    },
  });
  return [
    side(y0, true),
    side(y1, false),
    {
      x0: x - 1, y0, z0: H - 4, x1: x + W + 1, y1, z1: H + 6, depth: x + W + y1 + 2,
      draw: (ctx, iso, c) => {
        for (const gx of [x, x + W - 2]) iso.box(ctx, gx, y0, H - 3, 2, y1 - y0, 3, c.crane);
        iso.box(ctx, x - 0.5, y0 + (y1 - y0) * 0.38, H, W + 1, 9, 3.6, c.craneWhite);
        iso.box(ctx, x + 2, y0 + (y1 - y0) * 0.38 + 8, H - 4, 4, 3, 3, c.glass);
        iso.line(ctx, [[x + W / 2, y0 + (y1 - y0) * 0.45, H], [x + W / 2, y0 + (y1 - y0) * 0.45, 26]], c.dark, 0.4);
        iso.box(ctx, x + 1, y0 + (y1 - y0) * 0.45 - 2.5, 25, W - 2, 5, 1.2, c.yellow);
      },
    },
  ];
}

