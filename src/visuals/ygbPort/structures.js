/**
 * [INPUT]: 依赖 ./iso 的投影原语、tone/mix/alpha 与种子随机
 * [OUTPUT]: 对外提供静态物件工厂：warehouse/tower/slab/controlTower/shed/canopy/tank/tree/streetLamp/highMast/fence/booth
 * [POS]: visuals/ygbPort 的建筑与街道家具库；city/terminal 只负责摆放，物件外观在此统一
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { SUN, alpha, mix, rng, tone } from "./iso";

/*
 * 静态物件契约：
 *   { x0,y0,z0,x1,y1,z1 世界包围盒, depth 排序深度, draw(ctx,iso,c,dark,colors), shadow?(ctx,iso,c), light?(ctx,iso,c), beacon?[x,y,z] }
 * shadow 在白天烘焙到地面层；light 在夜间以 screen 合成烘焙为灯池。
 */
const item = (x0, y0, z0, x1, y1, z1, draw, extra) => ({ x0, y0, z0, x1, y1, z1, depth: (x0 + x1) / 2 + (y0 + y1) / 2, draw, ...extra });

/* 太阳投影：盒体底面沿 SUN 方向拉伸成软影 */
export function boxShadow(ctx, iso, c, x, y, w, d, h, a = 0.23) {
  const dx = h * SUN.x, dy = h * SUN.y;
  ctx.save();
  ctx.filter = `blur(${1.6 * iso.s}px)`;
  iso.poly(ctx, [[x, y + d], [x + w, y + d], [x + w, y], [x + w + dx, y + dy], [x + w + dx, y + d + dy], [x + dx, y + d + dy]], alpha(c.shadowSoft, a));
  ctx.restore();
  iso.poly(ctx, [[x + 1, y + 1], [x + w + 2, y + 1], [x + w + 2, y + d + 2.5], [x + 1, y + d + 2.5]], alpha(c.shadow, 0.16));
}

/* ─── 仓库：屋面肋条与采光带，南立面装卸月台 ─── */
export function warehouse({ x, y, w, d, h = 22, seed = 1, docks = true, solar = false }) {
  const R = rng(seed);
  const units = Array.from({ length: 2 + Math.floor(R() * 3) }, () => [x + 10 + R() * (w - 30), y + 8 + R() * (d - 24)]);
  return item(x, y, 0, x + w, y + d, h + 6, (ctx, iso, c, dark) => {
    iso.box(ctx, x, y, 0, w, d, h, c.roof, { side: c.wall, end: c.shade, rim: dark ? alpha("#b2d1d7", 0.1) : alpha("#ffffff", 0.55) });
    /* 女儿墙与屋脊 */
    iso.line(ctx, [[x + w / 2, y + 2, h + 0.1], [x + w / 2, y + d - 2, h + 0.1]], dark ? alpha("#c2dade", 0.08) : alpha("#8faaa6", 0.32), 0.8);
    for (let a = 9; a < w - 4; a += 9) iso.line(ctx, [[x + a, y + 3, h + 0.1], [x + a, y + d - 3, h + 0.1]], dark ? alpha("#c2dade", 0.05) : alpha("#8faaa6", 0.2), 0.5);
    if (solar) {
      for (let a = 8; a < w - 20; a += 22) for (let b = 8; b < d - 12; b += 13) iso.rect(ctx, x + a, y + b, x + a + 18, y + b + 9, dark ? "#1d3440" : "#5b7f93", h + 0.3);
    } else {
      for (let a = 14; a < w - 14; a += 26) iso.rect(ctx, x + a, y + d * 0.3, x + a + 8, y + d * 0.7, dark ? "#2a4651" : mix(c.glass, c.roof, 0.35), h + 0.2);
    }
    for (const [ux, uy] of units) iso.box(ctx, ux, uy, h, 9, 7, 3.2, c.wall, { end: c.shade });
    if (docks) {
      for (let a = 8; a < w - 10; a += 15) {
        iso.poly(ctx, [[x + a, y + d + 0.1, 0], [x + a + 9, y + d + 0.1, 0], [x + a + 9, y + d + 0.1, 9], [x + a, y + d + 0.1, 9]], dark ? "#13232a" : c.glassDark);
        iso.box(ctx, x + a - 1, y + d, 10, 11, 2.4, 0.8, c.metal);
        if (dark) iso.line(ctx, [[x + a + 2, y + d + 0.3, 10.5], [x + a + 7, y + d + 0.3, 10.5]], alpha("#f6dda6", 0.7), 1.2);
      }
    } else {
      for (let a = 10; a < w - 8; a += 18) iso.poly(ctx, [[x + a, y + d + 0.1, h * 0.55], [x + a + 10, y + d + 0.1, h * 0.55], [x + a + 10, y + d + 0.1, h * 0.75], [x + a, y + d + 0.1, h * 0.75]], dark ? alpha(c.lit, 0.55) : c.glass);
    }
    /* 东立面小门与雨棚 */
    iso.poly(ctx, [[x + w + 0.1, y + d * 0.35, 0], [x + w + 0.1, y + d * 0.35 + 8, 0], [x + w + 0.1, y + d * 0.35 + 8, 8], [x + w + 0.1, y + d * 0.35, 8]], dark ? "#13232a" : c.glassDark);
  }, {
    shadow: (ctx, iso, c) => boxShadow(ctx, iso, c, x, y, w, d, h),
    light: docks ? (ctx, iso) => { for (let a = 12; a < w - 10; a += 30) iso.pool(ctx, x + a, y + d + 9, 0, 18, "#ffd89a", 0.3); } : undefined,
  });
}

/* ─── 写字楼：裙房 + 玻璃幕墙塔身 + 设备层冠顶 ─── */
export function tower({ x, y, w, d, h, seed = 1, podium = 10, tint = 0 }) {
  const R = rng(seed);
  const inset = 5 + Math.floor(R() * 4), crown = 6 + R() * 6;
  const litMap = Array.from({ length: 400 }, () => R() < 0.42);
  const tx = x + inset, ty = y + inset, tw = w - inset * 2, td = d - inset * 2;
  return item(x, y, 0, x + w, y + d, h + crown + 10, (ctx, iso, c, dark) => {
    const glass = tint ? mix(c.glass, c.cyan, tint) : c.glass;
    iso.box(ctx, x, y, 0, w, d, podium, c.wall, { top: c.roof, side: c.wall, end: c.shade });
    for (let a = 4; a < w - 3; a += 7) iso.poly(ctx, [[x + a, y + d + 0.1, 2], [x + a + 5, y + d + 0.1, 2], [x + a + 5, y + d + 0.1, podium - 2], [x + a, y + d + 0.1, podium - 2]], dark ? alpha(c.lit, 0.62) : mix(glass, c.wall, 0.3));
    const body = h - podium;
    iso.box(ctx, tx, ty, podium, tw, td, body, mix(c.roof, c.wall, 0.4), { side: dark ? "#1d333c" : mix(glass, c.wall, 0.25), end: dark ? "#16282f" : tone(glass, 0.82) });
    /* 幕墙：楼层线 + 竖梃，夜间随机亮窗 */
    let k = 0;
    for (let z = podium + 4; z < h - 2; z += 5.5) {
      for (let a = 2; a < tw - 2; a += 5) {
        const on = dark && litMap[k++ % litMap.length];
        if (on) iso.poly(ctx, [[tx + a, ty + td + 0.1, z], [tx + a + 3.6, ty + td + 0.1, z], [tx + a + 3.6, ty + td + 0.1, z + 3], [tx + a, ty + td + 0.1, z + 3]], c.lit);
      }
      for (let b = 2; b < td - 2; b += 5) {
        const on = dark && litMap[k++ % litMap.length];
        if (on) iso.poly(ctx, [[tx + tw + 0.1, ty + b, z], [tx + tw + 0.1, ty + b + 3.6, z], [tx + tw + 0.1, ty + b + 3.6, z + 3], [tx + tw + 0.1, ty + b, z + 3]], tone(c.lit, 0.82));
      }
      iso.line(ctx, [[tx, ty + td + 0.15, z - 0.8], [tx + tw, ty + td + 0.15, z - 0.8], [tx + tw, ty, z - 0.8]], dark ? alpha("#9fc2cb", 0.08) : alpha("#ffffff", 0.32), 0.45);
    }
    if (!dark) for (let a = 5; a < tw; a += 10) iso.line(ctx, [[tx + a, ty + td + 0.15, podium + 1], [tx + a, ty + td + 0.15, h - 1]], alpha("#ffffff", 0.16), 0.4);
    /* 冠顶设备层 */
    iso.box(ctx, tx + 3, ty + 3, h, tw - 6, td - 6, crown, c.wall, { top: c.roof, end: c.shade });
    iso.box(ctx, tx + tw * 0.3, ty + td * 0.3, h + crown, 6, 6, 3, c.metal);
    iso.line(ctx, [[tx + tw * 0.62, ty + td * 0.5, h + crown], [tx + tw * 0.62, ty + td * 0.5, h + crown + 10]], c.metal, 0.6);
  }, {
    shadow: (ctx, iso, c) => { boxShadow(ctx, iso, c, x, y, w, d, podium); boxShadow(ctx, iso, c, tx, ty, tw, td, h + crown, 0.2); },
    beacon: [tx + tw * 0.62, ty + td * 0.5, h + crown + 10],
  });
}

/* ─── 住宅板楼：窗格 + 阳台横线 ─── */
export function slab({ x, y, w, d, h, seed = 1 }) {
  const R = rng(seed);
  const litMap = Array.from({ length: 300 }, () => R() < 0.5);
  return item(x, y, 0, x + w, y + d, h + 4, (ctx, iso, c, dark) => {
    iso.box(ctx, x, y, 0, w, d, h, c.roof, { side: mix(c.wall, c.white, 0.25), end: c.shade, rim: dark ? undefined : alpha("#ffffff", 0.5) });
    let k = 0;
    for (let z = 4; z < h - 2; z += 4.6) {
      for (let a = 3; a < w - 2; a += 6) {
        const on = dark && litMap[k++ % litMap.length];
        iso.poly(ctx, [[x + a, y + d + 0.1, z], [x + a + 3, y + d + 0.1, z], [x + a + 3, y + d + 0.1, z + 2.6], [x + a, y + d + 0.1, z + 2.6]], on ? c.lit : dark ? "#1b2f37" : mix(c.glass, c.wall, 0.4));
      }
      iso.line(ctx, [[x, y + d + 0.4, z - 0.6], [x + w, y + d + 0.4, z - 0.6]], dark ? alpha("#9fb5b8", 0.08) : alpha("#ffffff", 0.45), 0.5);
    }
    for (let a = 10; a < w - 8; a += 22) iso.box(ctx, x + a, y + 2, h, 6, d - 4, 3, c.wall, { end: c.shade });
  }, { shadow: (ctx, iso, c) => boxShadow(ctx, iso, c, x, y, w, d, h) });
}

/* ─── 港务控制塔：竖井 + 外挑玻璃指挥室 ─── */
export function controlTower({ x, y }) {
  const w = 14, h = 62;
  return item(x - 4, y - 4, 0, x + w + 4, y + w + 4, h + 20, (ctx, iso, c, dark) => {
    iso.box(ctx, x, y, 0, w, w, h, c.white, { side: mix(c.white, c.wall, 0.4), end: c.shade });
    for (let z = 8; z < h - 4; z += 9) iso.poly(ctx, [[x + 4, y + w + 0.1, z], [x + 10, y + w + 0.1, z], [x + 10, y + w + 0.1, z + 3], [x + 4, y + w + 0.1, z + 3]], dark ? alpha(c.lit, 0.5) : c.glass);
    iso.box(ctx, x - 4, y - 4, h, w + 8, w + 8, 2, c.metal);
    iso.box(ctx, x - 3, y - 3, h + 2, w + 6, w + 6, 8, dark ? "#d9c58f" : "#88aebb", { side: dark ? "#c2ad79" : "#6f97a6", end: dark ? "#a8956a" : "#5f8696" });
    for (let a = 2; a < w + 6; a += 4) {
      iso.line(ctx, [[x - 3 + a, y + w + 3.1, h + 2], [x - 3 + a, y + w + 3.1, h + 10]], dark ? alpha("#3d3a2a", 0.5) : alpha("#e8f2f0", 0.5), 0.4);
      iso.line(ctx, [[x + w + 3.1, y - 3 + a, h + 2], [x + w + 3.1, y - 3 + a, h + 10]], dark ? alpha("#3d3a2a", 0.5) : alpha("#e8f2f0", 0.4), 0.4);
    }
    iso.box(ctx, x - 5, y - 5, h + 10, w + 10, w + 10, 1.6, c.roof, { end: c.metal });
    iso.line(ctx, [[x + 7, y + 7, h + 12], [x + 7, y + 7, h + 20]], c.metal, 0.7);
  }, { shadow: (ctx, iso, c) => boxShadow(ctx, iso, c, x, y, w, w, h + 10), beacon: [x + 7, y + 7, h + 20] });
}

/* ─── 小型构筑：门卫亭、配电房、维修棚 ─── */
export function shed({ x, y, w, d, h, color, roof }) {
  return item(x, y, 0, x + w, y + d, h + 1, (ctx, iso, c) => {
    iso.box(ctx, x, y, 0, w, d, h, roof ? c[roof] : c.roof, { side: color ? c[color] : c.wall, end: color ? tone(c[color], 0.8) : c.shade });
  }, { shadow: (ctx, iso, c) => boxShadow(ctx, iso, c, x, y, w, d, h, 0.18) });
}

/* ─── 雨棚：加油站与闸口；薄板置于立柱之上，夜间向下打光 ─── */
export function canopy({ x, y, w, d, h = 16, band = "orange", columns = 2, lightRows = 2 }) {
  return item(x, y, 0, x + w, y + d, h + 2.5, (ctx, iso, c, dark) => {
    const cols = [];
    for (let i = 0; i < columns; i++) cols.push(x + 6 + (i * (w - 12)) / Math.max(1, columns - 1));
    for (const cx of cols) for (const cy of [y + d * 0.3, y + d * 0.7]) iso.box(ctx, cx - 1, cy - 1, 0, 2, 2, h, c.steel);
    iso.box(ctx, x, y, h, w, d, 2.4, c.roof, { side: c[band], end: tone(c[band], 0.8) });
    if (dark) for (let i = 0; i < lightRows; i++) iso.line(ctx, [[x + 4, y + d * (i + 1) / (lightRows + 1), h - 0.1], [x + w - 4, y + d * (i + 1) / (lightRows + 1), h - 0.1]], alpha("#fff4d6", 0.8), 1.4);
  }, {
    depth: x + w + y + d,
    shadow: (ctx, iso, c) => {
      ctx.save();
      ctx.filter = `blur(${2 * iso.s}px)`;
      const dx = h * SUN.x, dy = h * SUN.y;
      iso.rect(ctx, x + dx, y + dy, x + w + dx, y + d + dy, alpha(c.shadowSoft, 0.2));
      ctx.restore();
    },
    light: (ctx, iso) => iso.pool(ctx, x + w / 2, y + d / 2, 0, Math.max(w, d) * 0.75, "#fff1d6", 0.5),
  });
}

/* ─── 储罐：环形立面按法线受光，罐顶检修平台 ─── */
export function tank({ x, y, r, h }) {
  const ring = Array.from({ length: 28 }, (_, i) => [x + Math.cos((i / 28) * Math.PI * 2) * r, y + Math.sin((i / 28) * Math.PI * 2) * r]);
  return item(x - r, y - r, 0, x + r, y + r, h + 10, (ctx, iso, c, dark) => {
    iso.prism(ctx, ring, 0, h, c.tank, { top: tone(c.tank, 1.04) });
    iso.line(ctx, ring.map(([px, py]) => [px, py, h * 0.5]), dark ? alpha("#dfd2a7", 0.12) : alpha("#ffffff", 0.35), 0.5);
    iso.line(ctx, [[x, y, h], [x, y, h + 8]], c.metal, 0.9);
    iso.box(ctx, x - 5, y - 4, h + 0.5, 10, 8, 1.6, c.metal);
    /* 盘梯 */
    for (let i = 0; i < 6; i++) {
      const a0 = 0.15 + i * 0.12, a1 = a0 + 0.12;
      iso.line(ctx, [[x + Math.cos(a0) * (r + 0.5), y + Math.sin(a0) * (r + 0.5), (i * h) / 6], [x + Math.cos(a1) * (r + 0.5), y + Math.sin(a1) * (r + 0.5), ((i + 1) * h) / 6]], c.metal, 0.6);
    }
  }, {
    shadow: (ctx, iso, c) => {
      ctx.save();
      ctx.filter = `blur(${1.8 * iso.s}px)`;
      iso.poly(ctx, ring.map(([px, py]) => [px + h * SUN.x * 0.9, py + h * SUN.y * 0.9]), alpha(c.shadowSoft, 0.22));
      ctx.restore();
    },
    light: (ctx, iso) => iso.glow(ctx, x, y, h + 1, r * 0.9, "#ffe0a0", 0.14, 0.45),
  });
}

/* ─── 行道树：三团树冠，带接触影 ─── */
export function tree(x, y, size = 1) {
  const r = 6 * size;
  return item(x - r, y - r, 0, x + r, y + r, 20 * size, (ctx, iso, c) => {
    iso.box(ctx, x - 0.8, y - 0.8, 0, 1.6, 1.6, 9 * size, c.dark);
    for (const [dx, dy, z, rr] of [[0, 0, 14, 6.2], [-3, 2.5, 12.5, 4.6], [3, 2, 15.5, 4.4]]) {
      const X = iso.X(x + dx * size, y + dy * size), Y = iso.Y(x + dx * size, y + dy * size, z * size), R = rr * size * iso.s;
      const g = ctx.createRadialGradient(X - R * 0.3, Y - R * 0.45, 0, X, Y, R);
      g.addColorStop(0, c.treeHi);
      g.addColorStop(1, c.tree);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(X, Y, R, 0, Math.PI * 2);
      ctx.fill();
    }
  }, {
    shadow: (ctx, iso, c) => {
      const X = iso.X(x + 8 * size, y + 5 * size), Y = iso.Y(x + 8 * size, y + 5 * size);
      ctx.fillStyle = alpha(c.shadowSoft, 0.2);
      ctx.beginPath();
      ctx.ellipse(X, Y, 7 * size * iso.s, 3.6 * size * iso.s, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  });
}

/* ─── 路灯：灯臂伸向车道，夜间灯池在地面层烘焙 ─── */
export function streetLamp(x, y, ax, ay, h = 22) {
  return item(x - 2, y - 2, 0, x + 2, y + 2, h + 2, (ctx, iso, c, dark) => {
    iso.line(ctx, [[x, y, 0], [x, y, h]], dark ? "#88a1a2" : "#7b9193", 1);
    iso.line(ctx, [[x, y, h], [x + ax, y + ay, h + 1]], c.metal, 0.9);
    iso.box(ctx, x + ax - 1.6, y + ay - 1.6, h, 3.2, 3.2, 1, dark ? "#e8d9b4" : "#c5d0c9", { end: c.metal });
    if (dark) iso.glow(ctx, x + ax, y + ay, h, 9, "#ffdea4", 0.3, 1);
  }, { light: (ctx, iso) => iso.pool(ctx, x + ax * 1.4, y + ay * 1.4, 0, 30, "#ffc67c", 0.42) });
}

/* ─── 高杆灯：堆场照明，顶部环形灯盘 ─── */
export function highMast(x, y, h = 92) {
  return item(x - 6, y - 6, 0, x + 6, y + 6, h + 4, (ctx, iso, c, dark) => {
    iso.box(ctx, x - 1.5, y - 1.5, 0, 3, 3, 3, c.metal);
    iso.line(ctx, [[x, y, 0], [x, y, h]], dark ? "#7d969b" : "#7b9193", 1.6);
    iso.line(ctx, [[x - 6, y, h], [x + 6, y, h]], c.metal, 1.4);
    iso.line(ctx, [[x, y - 6, h], [x, y + 6, h]], c.metal, 1.4);
    for (const [dx, dy] of [[-5, -1], [5, 1], [-1, 5], [1, -5], [-3, 3], [3, -3]]) {
      iso.box(ctx, x + dx - 1.4, y + dy - 1.4, h - 2, 2.8, 2.8, 2, dark ? "#efe2c2" : c.roof, { end: c.metal });
      if (dark) iso.glow(ctx, x + dx, y + dy, h - 1, 8, "#fff1d0", 0.32, 1);
    }
  }, {
    shadow: (ctx, iso, c) => iso.line(ctx, [[x, y], [x + h * SUN.x, y + h * SUN.y]], alpha(c.shadowSoft, 0.18), 1.4),
    light: (ctx, iso) => iso.pool(ctx, x, y, 0, 112, "#ffd49a", 0.42),
  });
}

/* ─── 围网：按段切块，参与深度排序 ─── */
export function fence(x0, y0, x1, y1, h = 7) {
  const out = [];
  const horizontal = y0 === y1, len = horizontal ? x1 - x0 : y1 - y0;
  for (let a = 0; a < len; a += 40) {
    const b = Math.min(len, a + 40);
    const p = horizontal ? [[x0 + a, y0], [x0 + b, y0]] : [[x0, y0 + a], [x0, y0 + b]];
    out.push(item(p[0][0], p[0][1], 0, p[1][0], p[1][1], h, (ctx, iso, c, dark) => {
      const col = dark ? alpha("#8aa3a8", 0.35) : alpha(c.fence, 0.55);
      iso.poly(ctx, [[...p[0], 0], [...p[1], 0], [...p[1], h], [...p[0], h]], dark ? alpha("#8aa3a8", 0.05) : alpha(c.fence, 0.1));
      iso.line(ctx, [[...p[0], h], [...p[1], h]], col, 0.6);
      for (let t = 0; t <= b - a; t += 10) {
        const q = horizontal ? [p[0][0] + t, p[0][1]] : [p[0][0], p[0][1] + t];
        iso.line(ctx, [[...q, 0], [...q, h]], col, 0.55);
      }
    }));
  }
  return out;
}

/* ─── 岗亭：闸口与停车场出入口 ─── */
export function booth(x, y, w = 4, d = 5) {
  return item(x, y, 0, x + w, y + d, 9, (ctx, iso, c, dark) => {
    iso.box(ctx, x - 0.6, y - 0.6, 0, w + 1.2, d + 1.2, 0.8, c.yellow);
    iso.box(ctx, x, y, 0.8, w, d, 6.4, c.white, { side: dark ? alpha(c.lit, 0.9) : c.glass, end: dark ? tone(c.lit, 0.8) : c.glassDark });
    iso.box(ctx, x - 0.8, y - 0.8, 7.2, w + 1.6, d + 1.6, 1, c.orange);
  });
}

