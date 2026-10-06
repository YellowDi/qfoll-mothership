/**
 * [INPUT]: 依赖 ./iso 的投影/色彩/随机/SUN 光照，./ship 的 DECK_Z 与船位，./layout 的船位，./sea 的样条航线
 * [OUTPUT]: 对外提供 Sky：低空巡航直升机 (近距地影 + 旋翼 + 夜间航灯/探照灯)、海鸥盘旋、烟囱尾烟、日间云影漂移、塔顶航标；FUNNEL_TOP 烟囱顶位置
 * [POS]: visuals/ygbPort 的最上层动态；全部绘制在场景物件之后，只叠加不遮挡交通逻辑
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { SUN, alpha, rng, tone, type Ctx, type Iso, type OboxOpts, type Pt } from "./iso";
import { SHIP } from "./layout";
import type { Palette } from "./palette";
import { DECK_Z, type Ship } from "./ship";
import { at, spline } from "./sea";

type Pt3 = [number, number, number];

interface Puff {
  x: number;
  y: number;
  z: number;
  age: number;
  r: number;
}

interface Bird {
  cx: number;
  cy: number;
  r: number;
  z: number;
  w: number;
  phase: number;
  flap: number;
}

interface Heli {
  /* 沿航线的里程 */
  s: number;
  x: number;
  y: number;
  h: number;
  rotor: number;
}

interface Cloud {
  x: number;
  y: number;
  blobs: Pt3[];
}

/* 云影预渲染贴图：相对云心的屏幕偏移 (l, t) 与尺寸 (w, h) */
interface CloudSprite {
  cv: HTMLCanvasElement;
  l: number;
  t: number;
  w: number;
  h: number;
}

const WIND = { x: 7, y: 2.4 };
/*
 * 直升机：正交视图里高空物体缺少纵深线索，会被读成"停在地上的玩具"；
 * 低空 (z≈56) 巡航让地影紧贴机身，高度一眼可读。航线南段在外海、北段在物流园上空，
 * 只在远离岸桥的东西两端穿越码头，避免与大梁产生错误遮挡。
 */
const HELI_Z = 56;
const HELI_PATH = spline([[-1700, 620], [-900, 640], [-200, 600], [500, 650], [1200, 700], [1650, 300], [1550, -150], [1100, -430], [400, -450], [-300, -430], [-1000, -440], [-1600, -150], [-1800, 300]], 6);

export class Sky {
  time: number;
  funnel: Pt3;
  puffs: Puff[];
  emit: number;
  birds: Bird[];
  heli: Heli;
  clouds: Cloud[];
  cloudSprites?: CloudSprite[];
  constructor(funnel: Pt3) {
    this.time = 0;
    const R = rng(311);
    this.funnel = funnel;
    this.puffs = [];
    this.emit = 0;
    this.birds = Array.from({ length: 7 }, (_, i) => ({ cx: -160 + R() * 260, cy: 340 + R() * 140, r: 26 + R() * 40, z: 46 + R() * 50, w: (0.18 + R() * 0.16) * (i % 3 ? 1 : -1), phase: R() * 6.28, flap: 5 + R() * 3 }));
    this.heli = { s: 0.32 * HELI_PATH.length, x: 0, y: 0, h: 0, rotor: 0 };
    this.clouds = Array.from({ length: 4 }, (_, i) => ({ x: -1400 + i * 760 + R() * 200, y: -900 + R() * 1300, blobs: Array.from({ length: 5 }, (): Pt3 => [R() * 220 - 110, R() * 120 - 60, 60 + R() * 70]) }));
    for (let i = 0; i < 60; i++) this.update(0.2);
  }

  update(dt: number, isVisible: (x: number, y: number, z: number) => boolean = () => true) {
    this.time += dt;
    const hp = this.heli;
    hp.s = (hp.s + 34 * dt * (isVisible(hp.x, hp.y, HELI_Z) ? 1 : 4)) % HELI_PATH.length;
    const p = at(HELI_PATH, hp.s);
    hp.x = p.x; hp.y = p.y; hp.h = p.h;
    hp.rotor += dt * 13;
    /* 尾烟：烟囱顶周期性喷出，随风漂移、上升、扩散 */
    this.emit -= dt;
    if (this.emit <= 0) {
      this.emit = 0.55;
      this.puffs.push({ x: this.funnel[0], y: this.funnel[1], z: this.funnel[2], age: 0, r: 2.4 });
    }
    for (const p of this.puffs) {
      p.age += dt;
      p.x += WIND.x * 0.55 * dt;
      p.y += WIND.y * 0.55 * dt;
      p.z += 3.2 * dt;
      p.r += 1.6 * dt;
    }
    this.puffs = this.puffs.filter((p) => p.age < 9);
    for (const cl of this.clouds) {
      cl.x += WIND.x * dt;
      cl.y += WIND.y * dt;
      if (cl.x > 1900) { cl.x -= 3400; cl.y -= 900; }
      if (cl.y > 1500) cl.y -= 2400;
    }
  }

  /* ─── 地面层之上：云影 + 直升机地影 ─── */
  /* 云影印章：每次重建按当前缩放模糊渲染一次，逐帧只平移贴图 */
  bake(iso: Iso, c: Palette, dpr: number) {
    const s = iso.s, pad = 40 * s;
    this.cloudSprites = this.clouds.map((cl) => {
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
      const pts = cl.blobs.map(([bx, by, rr]) => {
        const X = (bx - by) * 0.74 * s, Y = (bx + by) * 0.365 * s;
        l = Math.min(l, X - rr * s); r = Math.max(r, X + rr * s); t = Math.min(t, Y - rr * s * 0.5); b = Math.max(b, Y + rr * s * 0.5);
        return [X, Y, rr] as Pt3;
      });
      l -= pad; t -= pad; r += pad; b += pad;
      const cv = document.createElement("canvas");
      cv.width = Math.ceil((r - l) * dpr);
      cv.height = Math.ceil((b - t) * dpr);
      const g = cv.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, -l * dpr, -t * dpr);
      g.filter = `blur(${18 * s}px)`;
      g.fillStyle = alpha(c.shadowSoft, 0.06);
      for (const [X, Y, rr] of pts) {
        g.beginPath();
        g.ellipse(X, Y, rr * s * 0.95, rr * s * 0.48, 0, 0, Math.PI * 2);
        g.fill();
      }
      return { cv, l, t, w: r - l, h: b - t };
    });
  }
  shadows(ctx: Ctx, iso: Iso, c: Palette, dark: boolean) {
    if (dark) return;
    this.clouds.forEach((cl, i) => {
      const sp = this.cloudSprites?.[i];
      if (!sp) return;
      const X = iso.X(cl.x, cl.y) + sp.l, Y = iso.Y(cl.x, cl.y) + sp.t;
      if (X > iso.w || Y > iso.h || X + sp.w < 0 || Y + sp.h < 0) return;
      ctx.drawImage(sp.cv, X, Y, sp.w, sp.h);
    });
    const hp = this.heli, sx = hp.x + HELI_Z * SUN.x, sy = hp.y + HELI_Z * SUN.y;
    if (iso.visible(sx, sy, 80)) this.heliShadow(ctx, iso, c, sx, sy, hp.h);
  }

  /* ─── 顶层：尾烟、海鸥、飞机、塔顶航标 ─── */
  draw(ctx: Ctx, iso: Iso, c: Palette, dark: boolean, beacons: Pt3[]) {
    const t = this.time;
    for (const p of this.puffs) {
      if (!iso.visible(p.x, p.y, 40)) continue;
      const a = Math.min(1, p.age * 2) * (1 - p.age / 9) * (dark ? 0.12 : 0.22);
      ctx.fillStyle = alpha(dark ? "#9aa7aa" : "#eef0ea", a);
      ctx.beginPath();
      ctx.arc(iso.X(p.x, p.y), iso.Y(p.x, p.y, p.z), p.r * iso.s, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of this.birds) {
      const a = b.phase + t * b.w, x = b.cx + Math.cos(a) * b.r, y = b.cy + Math.sin(a) * b.r * 0.7, z = b.z + Math.sin(t * 0.4 + b.phase) * 6;
      if (!iso.visible(x, y, 40)) continue;
      const X = iso.X(x, y), Y = iso.Y(x, y, z), s = iso.s, flap = Math.sin(t * b.flap + b.phase) * 1.4, dir = b.w > 0 ? 1 : -1;
      const hx = -Math.sin(a) * dir, span = 3.2 * s;
      ctx.strokeStyle = dark ? alpha("#c8d4d2", 0.45) : alpha("#fbfbf6", 0.95);
      ctx.lineWidth = 0.9 * s;
      ctx.beginPath();
      ctx.moveTo(X - span, Y - flap * s);
      ctx.quadraticCurveTo(X - span * 0.4, Y - 1.3 * s - flap * 0.3 * s, X + hx * 0.4, Y);
      ctx.quadraticCurveTo(X + span * 0.4, Y - 1.3 * s - flap * 0.3 * s, X + span, Y - flap * s);
      ctx.stroke();
      if (!dark) {
        ctx.fillStyle = alpha(c.shadow, 0.08);
        ctx.beginPath();
        ctx.ellipse(iso.X(x + z * SUN.x, y + z * SUN.y), iso.Y(x + z * SUN.x, y + z * SUN.y), 2 * s, 0.8 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (iso.visible(this.heli.x, this.heli.y, 80, HELI_Z)) this.helicopter(ctx, iso, c, dark, t);
    if (dark) {
      for (const [x, y, z] of beacons) {
        if ((t * 0.9 + x * 0.01) % 2 > 0.5 || !iso.visible(x, y, 30, z)) continue;
        iso.dot(ctx, x, y, z, 0.7, "#ff5745");
        iso.glow(ctx, x, y, z, 8, "#ff5745", 0.55, 1);
      }
    }
  }

  /* ─── 直升机：橙白涂装港务机，主旋翼半透明桨盘 + 两片桨叶，尾桨、滑橇 ─── */
  helicopter(ctx: Ctx, iso: Iso, c: Palette, dark: boolean, t: number) {
    const hp = this.heli, z = HELI_Z + Math.sin(t * 0.7) * 1.2, cos = Math.cos(hp.h), sin = Math.sin(hp.h);
    const P = (lx: number, ly: number, lz: number): Pt3 => [hp.x + lx * cos - ly * sin, hp.y + lx * sin + ly * cos, z + lz];
    const B = (lx0: number, lx1: number, ly0: number, ly1: number, z0: number, z1: number, color: string, o?: OboxOpts) => iso.obox(ctx, hp.x, hp.y, cos, sin, lx0, lx1, ly0, ly1, z + z0, z + z1, color, o);
    if (dark) {
      /* 探照灯：斜向前下方打到地面 */
      const gx = hp.x + cos * 24 + HELI_Z * 0.08, gy = hp.y + sin * 24;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createLinearGradient(iso.X(hp.x, hp.y), iso.Y(hp.x, hp.y, z), iso.X(gx, gy), iso.Y(gx, gy));
      g.addColorStop(0, "rgba(255,246,220,0.22)");
      g.addColorStop(1, "rgba(255,246,220,0.04)");
      iso.poly(ctx, [P(4, -0.6, 0), [gx - sin * 9, gy + cos * 9, 0], [gx + sin * 9, gy - cos * 9, 0], P(4, 0.6, 0)], g);
      iso.glow(ctx, gx, gy, 0, 16, "#fff6dc", 0.4, 0.5);
      ctx.restore();
    }
    const orange = c.orange, white = dark ? tone(c.white, 1.05) : "#f4f3ec";
    /* 滑橇 */
    for (const ly of [-2.5, 2.5]) {
      iso.line(ctx, [P(-3.6, ly, -1.1), P(4.4, ly, -1.1), P(5.2, ly, -0.5)], c.dark, 0.45);
      for (const lx of [-2, 2.6]) iso.line(ctx, [P(lx, ly, -1.1), P(lx, ly * 0.8, 0.6)], c.dark, 0.35);
    }
    /* 尾梁、平尾、垂尾 */
    B(-15, -3.5, -0.55, 0.55, 2.4, 3.5, orange);
    iso.poly(ctx, [P(-12.4, -2.6, 3), P(-11, -2.6, 3), P(-11, 2.6, 3), P(-12.4, 2.6, 3)], tone(orange, 0.85));
    iso.poly(ctx, [P(-15.2, 0, 3), P(-13.4, 0, 3), P(-14.2, 0, 7.2), P(-15.6, 0, 7.2)], tone(orange, 0.9));
    /* 机身：下橙上白，前风挡 */
    B(-4.2, 4.6, -2.3, 2.3, 0.4, 2.4, orange);
    B(-4.2, 3.6, -2.2, 2.2, 2.4, 4.6, white);
    B(3.6, 6.4, -1.9, 1.9, 0.8, 3.9, dark ? tone(c.lit, 0.7) : "#4f7383", { top: dark ? tone(c.lit, 0.8) : "#6d93a1" });
    B(-2.6, 1.6, -1.3, 1.3, 4.6, 5.8, white);
    iso.line(ctx, [P(-0.4, 0, 5.8), P(-0.4, 0, 6.8)], c.dark, 0.6);
    /* 尾桨：竖直平面内旋转 */
    const ta = hp.rotor * 2.3;
    iso.line(ctx, [P(-14.6 + Math.cos(ta) * 2, 0.7, 5 + Math.sin(ta) * 2), P(-14.6 - Math.cos(ta) * 2, 0.7, 5 - Math.sin(ta) * 2)], dark ? alpha("#c8d4d2", 0.6) : alpha(c.dark, 0.6), 0.35);
    /* 主旋翼：桨盘 + 桨叶 */
    const disc = Array.from({ length: 24 }, (_, i): Pt => { const a = (i / 24) * Math.PI * 2; return [hp.x + Math.cos(a) * 12.5, hp.y + Math.sin(a) * 12.5, z + 6.9]; });
    iso.poly(ctx, disc, dark ? alpha("#c8d4d2", 0.06) : alpha("#33454c", 0.1));
    for (const k of [0, Math.PI / 2]) {
      const a = hp.rotor + k, dx = Math.cos(a) * 12.5, dy = Math.sin(a) * 12.5;
      iso.line(ctx, [[hp.x - dx, hp.y - dy, z + 6.9], [hp.x + dx, hp.y + dy, z + 6.9]], dark ? alpha("#c8d4d2", 0.45) : alpha("#2b383e", 0.55), 0.5);
    }
    if (dark) {
      const blink = (t * 1.1) % 1.1 < 0.15;
      if (blink) iso.glow(ctx, ...P(-0.4, 0, 6.2), 9, "#ff4f3f", 0.8, 1);
      iso.glow(ctx, ...P(0, -2.4, 2), 4, "#ff4f3f", 0.6, 1);
      iso.glow(ctx, ...P(0, 2.4, 2), 4, "#45e08f", 0.6, 1);
      iso.glow(ctx, ...P(-15, 0, 3), 4, "#fff6dc", 0.6, 1);
    }
  }
  /* 地影：机身 + 尾梁剪影与淡淡的桨盘阴影 */
  heliShadow(ctx: Ctx, iso: Iso, c: Palette, x: number, y: number, h: number) {
    const cos = Math.cos(h), sin = Math.sin(h), P = (lx: number, ly: number): Pt3 => [x + lx * cos - ly * sin, y + lx * sin + ly * cos, 0];
    iso.poly(ctx, [P(6.4, -1.6), P(6.4, 1.6), P(-4.2, 2.3), P(-4.2, 0.6), P(-15, 0.5), P(-15, -0.5), P(-4.2, -0.6), P(-4.2, -2.3)], alpha(c.shadow, 0.18));
    const disc = Array.from({ length: 20 }, (_, i): Pt => { const a = (i / 20) * Math.PI * 2; return [x + Math.cos(a) * 12.5, y + Math.sin(a) * 12.5, 0]; });
    iso.poly(ctx, disc, alpha(c.shadow, 0.06));
  }
}

export const FUNNEL_TOP = (ship: Ship): Pt3 => {
  const [x0, x1] = ship.parts.funnel;
  return [(x0 + x1) / 2, (SHIP.y0 + SHIP.y1) / 2, DECK_Z + 45];
};
