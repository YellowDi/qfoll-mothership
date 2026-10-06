/**
 * [INPUT]: 无外部依赖；接收 Canvas 2D 上下文与港区世界坐标 (x 向东, y 向海, z 向上)
 * [OUTPUT]: 对外提供 Iso 投影/绘制原语 (含缓存光斑印章)、tone/alpha/mix 色彩工具、SUN/faceShade 光照约定、rng 种子随机、smooth 缓动
 * [POS]: visuals/ygbPort 的几何地基；所有物件共用同一投影、同一光源和同一背面剔除规则
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ════════════════════════════════════════════════════════════════════
 * 色彩：所有派生色都回到 #rrggbb，允许 tone(tone(c)) 链式推导并缓存
 * ════════════════════════════════════════════════════════════════════ */
const cache = new Map();
const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
const rgbOf = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export function tone(hex, f) {
  const key = `t${hex}${f}`;
  let out = cache.get(key);
  if (!out) {
    const [r, g, b] = rgbOf(hex);
    out = `#${hex2(r * f)}${hex2(g * f)}${hex2(b * f)}`;
    cache.set(key, out);
  }
  return out;
}
export function mix(a, b, t) {
  const key = `m${a}${b}${t}`;
  let out = cache.get(key);
  if (!out) {
    const x = rgbOf(a), y = rgbOf(b);
    out = `#${hex2(x[0] + (y[0] - x[0]) * t)}${hex2(x[1] + (y[1] - x[1]) * t)}${hex2(x[2] + (y[2] - x[2]) * t)}`;
    cache.set(key, out);
  }
  return out;
}
export function alpha(hex, a) {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}

/* 光斑印章：按颜色与渐变剖面缓存 */
const GLOW = [[0, 1], [0.38, 0.36], [1, 0]];
const POOL = [[0, 1], [0.45, 0.62], [0.8, 0.16], [1, 0]];
const stamps = new Map();
function stampOf(color, stops) {
  const key = color + (stops === POOL ? "p" : "g");
  let cv = stamps.get(key);
  if (!cv) {
    cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g2 = cv.getContext("2d"), g = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [o, k] of stops) g.addColorStop(o, alpha(color, k));
    g2.fillStyle = g;
    g2.fillRect(0, 0, 128, 128);
    stamps.set(key, cv);
  }
  return cv;
}

/* 太阳位于画面上方 (-x,-y)：+y 立面偏亮、+x 立面偏暗，与旧场景的明暗关系一致 */
export const SUN = { x: 0.63, y: 0.42 };
export const faceShade = (nx, ny) => 0.75 + 0.08 * (ny - nx);

/* 确定性随机：布局、集装箱配色与车辆编组每次重建保持一致 */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/* ════════════════════════════════════════════════════════════════════
 * 投影：正交二测；镜头固定，只随画幅缩放
 * ════════════════════════════════════════════════════════════════════ */
export class Iso {
  constructor() {
    this.s = 1;
    this.cx = 0;
    this.cy = 0;
    this.w = 0;
    this.h = 0;
  }
  set(s, cx, cy, w, h) {
    this.s = s;
    this.cx = cx;
    this.cy = cy;
    this.w = w;
    this.h = h;
  }
  /* 屏幕可见性：margin 为屏幕像素外扩，z 为物件高度 */
  visible(x, y, margin = 60, z = 0) {
    const X = this.X(x, y), Y = this.Y(x, y, z);
    return X > -margin && X < this.w + margin && Y > -margin && Y < this.h + margin;
  }
  X(x, y) { return this.cx + (x - y) * 0.74 * this.s; }
  Y(x, y, z = 0) { return this.cy + ((x + y) * 0.365 - z) * this.s; }

  trace(ctx, pts) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], X = this.X(p[0], p[1]), Y = this.Y(p[0], p[1], p[2] || 0);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
  }
  poly(ctx, pts, fill) {
    this.trace(ctx, pts);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }
  line(ctx, pts, color, width = 1, dash) {
    this.trace(ctx, pts);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * this.s;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (dash) ctx.setLineDash(dash.map((d) => d * this.s));
    ctx.stroke();
    if (dash) ctx.setLineDash([]);
  }
  /* 地面矩形：道路、场地与标线的基本单元 */
  rect(ctx, x0, y0, x1, y1, fill, z = 0) {
    this.poly(ctx, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], fill);
  }
  /* 圆角地块：街坊人行道与路缘转角半径由此统一 */
  roundRect(ctx, x0, y0, x1, y1, r, fill, z = 0) {
    const pts = [];
    const corner = (cx, cy, a0) => {
      for (let i = 0; i <= 6; i++) {
        const a = a0 + (i / 6) * Math.PI / 2;
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]);
      }
    };
    corner(x1 - r, y0 + r, -Math.PI / 2);
    corner(x1 - r, y1 - r, 0);
    corner(x0 + r, y1 - r, Math.PI / 2);
    corner(x0 + r, y0 + r, Math.PI);
    this.poly(ctx, pts, fill);
  }

  /* 轴对齐盒体：先铺剪影再盖三面，消除相邻面之间的抗锯齿缝 */
  box(ctx, x, y, z, w, d, h, color, o) {
    const top = o?.top ?? color, side = o?.side ?? tone(color, 0.83), end = o?.end ?? tone(color, 0.67);
    const z1 = z + h;
    this.poly(ctx, [[x, y + d, z], [x + w, y + d, z], [x + w, y, z], [x + w, y, z1], [x, y, z1], [x, y + d, z1]], side);
    this.poly(ctx, [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z1], [x + w, y, z1]], end);
    this.poly(ctx, [[x, y, z1], [x + w, y, z1], [x + w, y + d, z1], [x, y + d, z1]], top);
    if (o?.rim) this.line(ctx, [[x, y + d, z1], [x, y, z1], [x + w, y, z1]], o.rim, 0.5);
  }

  /* 有朝向的盒体：车辆、拖船等转向物件按法线剔除背面并统一受光 */
  obox(ctx, px, py, cos, sin, lx0, lx1, ly0, ly1, z0, z1, color, o) {
    const c = (lx, ly, z) => [px + lx * cos - ly * sin, py + lx * sin + ly * cos, z];
    const faces = [
      [cos, sin, [c(lx1, ly0, z0), c(lx1, ly1, z0), c(lx1, ly1, z1), c(lx1, ly0, z1)]],
      [-cos, -sin, [c(lx0, ly1, z0), c(lx0, ly0, z0), c(lx0, ly0, z1), c(lx0, ly1, z1)]],
      [-sin, cos, [c(lx1, ly1, z0), c(lx0, ly1, z0), c(lx0, ly1, z1), c(lx1, ly1, z1)]],
      [sin, -cos, [c(lx0, ly0, z0), c(lx1, ly0, z0), c(lx1, ly0, z1), c(lx0, ly0, z1)]],
    ];
    for (const [nx, ny, pts] of faces) {
      if (nx + ny <= 0.001) continue;
      this.poly(ctx, pts, o?.faces ? o.faces(nx, ny) : tone(color, faceShade(nx, ny)));
    }
    this.poly(ctx, [c(lx0, ly0, z1), c(lx1, ly0, z1), c(lx1, ly1, z1), c(lx0, ly1, z1)], o?.top ?? color);
  }

  /* 任意平面轮廓的直棱柱：船体、油罐、塔楼等曲面外形共用 */
  prism(ctx, outline, z0, z1, color, o) {
    let area = 0;
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i], b = outline[(i + 1) % outline.length];
      area += a[0] * b[1] - b[0] * a[1];
    }
    const sign = area > 0 ? 1 : -1, faces = [];
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i], b = outline[(i + 1) % outline.length];
      let nx = (b[1] - a[1]) * sign, ny = -(b[0] - a[0]) * sign;
      const len = Math.hypot(nx, ny) || 1;
      nx /= len; ny /= len;
      if (nx + ny <= 0.001) continue;
      faces.push({ depth: a[0] + a[1] + b[0] + b[1], nx, ny, a, b });
    }
    faces.sort((p, q) => p.depth - q.depth);
    const zb = o?.zb, zt = o?.zt;
    for (const f of faces) {
      const a0 = zb ? zb(f.a) : z0, b0 = zb ? zb(f.b) : z0, a1 = zt ? zt(f.a) : z1, b1 = zt ? zt(f.b) : z1;
      this.poly(ctx, [[f.a[0], f.a[1], a0], [f.b[0], f.b[1], b0], [f.b[0], f.b[1], b1], [f.a[0], f.a[1], a1]], o?.faces ? o.faces(f.nx, f.ny) : tone(color, faceShade(f.nx, f.ny)));
    }
    if (o?.top !== false) this.poly(ctx, outline.map((p) => [p[0], p[1], zt ? zt(p) : z1]), o?.top ?? color);
  }

  /*
   * 柔光与灯池：径向渐变预渲染成单色印章并缓存，逐帧只做一次 drawImage；
   * 夜间每帧数百个灯点不再反复创建渐变对象。合成模式由调用方决定。
   */
  glow(ctx, x, y, z, r, color, a = 0.3, flat = 1) {
    this.stamp(ctx, x, y, z, r, color, a, flat, GLOW);
  }
  pool(ctx, x, y, z, r, color, a = 0.4) {
    this.stamp(ctx, x, y, z, r, color, a, 0.5, POOL);
  }
  stamp(ctx, x, y, z, r, color, a, flat, stops) {
    const R = r * this.s;
    if (R < 0.3 || a <= 0) return;
    const img = stampOf(color, stops), X = this.X(x, y), Y = this.Y(x, y, z);
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * Math.min(1, a);
    ctx.drawImage(img, X - R, Y - R * flat, R * 2, R * 2 * flat);
    ctx.globalAlpha = prev;
  }
  dot(ctx, x, y, z, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.X(x, y), this.Y(x, y, z), Math.max(0.35, r * this.s), 0, Math.PI * 2);
    ctx.fill();
  }

  /* 世界包围盒 → 屏幕包围盒：精灵裁切、可见性与动态占用都基于它 */
  bounds(x0, y0, z0, x1, y1, z1, pad = 0) {
    const l = this.X(x0, y1), r = this.X(x1, y0);
    const t = this.Y(x0, y0, z1), b = this.Y(x1, y1, z0);
    const p = pad * this.s;
    return { l: l - p, t: t - p, r: r + p, b: b + p };
  }
}
