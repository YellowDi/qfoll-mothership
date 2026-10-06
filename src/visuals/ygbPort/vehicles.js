/**
 * [INPUT]: 依赖 ./iso 的 obox/tone/alpha，./palette 的集装箱与车身配色索引
 * [OUTPUT]: 对外提供 VEHICLE 尺寸表、drawVehicle 绘制函数与 parkedVehicle 静态物件工厂 (保留 vehicle 数据供车队/派单配图读取)
 * [POS]: visuals/ygbPort 的车辆外观库；行驶车辆 (traffic) 与停放车辆 (city/terminal) 共用同一外观
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { alpha, tone } from "./iso";

/* 局部坐标：+lx 车头方向，+ly 车身右侧；参考点为货箱中心附近 */
export const VEHICLE = {
  truck: { half: 18, width: 5.4, cargo: -5.2 },
  tractor: { half: 16, width: 5, cargo: -3.5 },
  car: { half: 4.6, width: 4.2 },
  van: { half: 5.6, width: 4.6 },
  stacker: { half: 9, width: 5.4 },
};

/*
 * v: { type, x, y, h (朝向弧度), cargo (集装箱色索引|null), color (车身色索引), cab (车头色索引), braking }
 * colors: { box: [], car: [], cab: [] } 当前主题的索引表
 */
export function drawVehicle(ctx, iso, c, colors, v, dark) {
  const cos = Math.cos(v.h), sin = Math.sin(v.h);
  const B = (lx0, lx1, ly0, ly1, z0, z1, color, o) => iso.obox(ctx, v.x, v.y, cos, sin, lx0, lx1, ly0, ly1, z0, z1, color, o);
  const L = (lx, ly) => [v.x + lx * cos - ly * sin, v.y + lx * sin + ly * cos];
  const spec = VEHICLE[v.type];
  /* 接触影 */
  const hl = spec.half, hw = spec.width / 2;
  iso.poly(ctx, [[...L(-hl, -hw)], [...L(hl, -hw)], [...L(hl + 2, hw + 1.5)], [...L(-hl + 2, hw + 1.5)]], dark ? alpha("#03101a", 0.5) : alpha(c.shadow, 0.24));
  const lit = dark && !v.parked;
  if (lit) headlights(ctx, iso, L, hl, v.type === "car" ? 1.6 : 2.2);

  if (v.type === "truck" || v.type === "tractor") {
    const truck = v.type === "truck";
    const front = truck ? 18 : 16, back = -hl;
    const cabColor = colors.cab[v.cab ?? 0];
    for (const lx of truck ? [-15, -11.5, 4, 13.5] : [-13, -9.5, 11.5]) for (const ly of [-2.7, 2.1]) B(lx - 1.2, lx + 1.2, ly, ly + 0.6, 0, 2.4, "#26343b");
    B(back, truck ? 11 : 9.5, -2.3, 2.3, 1.8, 3, "#3e555d");
    if (v.cargo != null) {
      const box = colors.box[v.cargo], cx = spec.cargo;
      B(cx - 12.2, cx + 12.2, -2.45, 2.45, 3, 8.2, box);
      ribs(ctx, iso, L, cx, box, dark);
    }
    if (truck) {
      B(10.6, 17.6, -2.7, 2.7, 2.4, 11, cabColor);
      B(17.6, 18.1, -2.2, 2.2, 6.6, 10, dark ? "#2c4a55" : "#5d7f8e");
      B(11.4, 16.8, -2.4, 2.4, 11, 12.4, tone(cabColor, 0.9));
    } else {
      B(9.6, 15.6, -2.6, 0.6, 2, 9, cabColor);
      B(15.6, 16, -2.2, 0.3, 5, 8.4, dark ? "#2c4a55" : "#5d7f8e");
      B(12, 13, 1, 2, 2, 7.5, "#3e555d");
    }
    lamps(ctx, iso, L, front, back, 2, lit, v.braking);
    return;
  }
  if (v.type === "stacker") {
    for (const lx of [-6, 5]) for (const ly of [-3, 2.2]) B(lx - 1.8, lx + 1.8, ly, ly + 0.8, 0, 3.6, "#26343b");
    B(-9, 7, -2.6, 2.6, 1.5, 6, c.orange);
    B(-6, 0, -2, 2, 6, 11, c.orange, { faces: (nx, ny) => tone(c.orange, 0.8 + 0.06 * (ny - nx)) });
    B(-5, -1, -1.8, 1.8, 11, 12, c.metal);
    B(2, 4, -0.8, 0.8, 6, 30, c.crane);
    return;
  }
  /* 小汽车 / 厢式货车 */
  const body = colors.car[v.color ?? 0], van = v.type === "van";
  for (const lx of van ? [-3.8, 3.6] : [-3, 2.9]) for (const ly of [-2.2, 1.7]) B(lx - 1, lx + 1, ly, ly + 0.5, 0, 1.5, "#22303a");
  if (van) {
    B(-5.6, 5.6, -2.3, 2.3, 0.9, 6.4, body);
    B(4.2, 5.62, -2.1, 2.1, 3.6, 5.8, dark ? "#29424c" : "#5d7f8e");
  } else {
    B(-4.6, 4.6, -2.1, 2.1, 0.8, 2.9, body);
    B(-2.6, 1.9, -1.8, 1.8, 2.9, 4.6, body, { faces: () => (dark ? "#29424c" : "#5d7f8e"), top: tone(body, 0.94) });
  }
  lamps(ctx, iso, L, spec.half, -spec.half, van ? 3 : 2, lit, v.braking);
}

function ribs(ctx, iso, L, cx, box, dark) {
  const col = dark ? alpha("#ffffff", 0.08) : alpha(tone(box, 1.12), 0.6);
  for (let a = -10.5; a <= 10.5; a += 3) {
    for (const ly of [2.46, -2.46]) {
      const p = L(cx + a, ly);
      iso.line(ctx, [[p[0], p[1], 3.6], [p[0], p[1], 7.8]], col, 0.32);
    }
  }
}

/* 夜间：车头光锥以 screen 合成铺在路面上 */
function headlights(ctx, iso, L, front, spread) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const ly of [-spread, spread]) {
    const a = L(front, ly), b = L(front + 40, ly * 3.4), b1 = L(front + 44, ly * 3.4 - 8), b2 = L(front + 44, ly * 3.4 + 8);
    const g = ctx.createLinearGradient(iso.X(a[0], a[1]), iso.Y(a[0], a[1]), iso.X(b[0], b[1]), iso.Y(b[0], b[1]));
    g.addColorStop(0, "rgba(255,241,194,0.36)");
    g.addColorStop(0.45, "rgba(255,241,194,0.12)");
    g.addColorStop(1, "rgba(255,241,194,0)");
    iso.poly(ctx, [[...L(front, ly - 0.8), 0.5], [...b1, 0.5], [...b2, 0.5], [...L(front, ly + 0.8), 0.5]], g);
  }
  ctx.restore();
}
function lamps(ctx, iso, L, front, back, z, dark, braking) {
  for (const ly of [-1.6, 1.6]) {
    const f = L(front + 0.2, ly), r = L(back - 0.2, ly);
    iso.dot(ctx, f[0], f[1], z + 1.2, dark ? 0.75 : 0.45, dark ? "#fff2cf" : "#f5f4e6");
    iso.dot(ctx, r[0], r[1], z + 1, braking ? 0.85 : 0.5, braking ? "#ff6a4a" : dark ? "#f27550" : "#b94f35");
    if (dark) iso.glow(ctx, f[0], f[1], z + 1.2, 3.5, "#fff1c2", 0.5, 1);
    if (dark && braking) iso.glow(ctx, r[0], r[1], z + 1, 4, "#ff5a3c", 0.45, 1);
  }
}

/* 停放车辆：静态物件，复用行驶车辆外观 */
export function parkedVehicle(v) {
  const r = VEHICLE[v.type].half + 2;
  return {
    x0: v.x - r, y0: v.y - r, z0: 0, x1: v.x + r, y1: v.y + r, z1: 13, depth: v.x + v.y, vehicle: v,
    draw: (ctx, iso, c, dark, colors) => drawVehicle(ctx, iso, c, colors, { ...v, parked: true }, dark),
  };
}
