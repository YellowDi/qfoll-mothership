/**
 * [INPUT]: 依赖本目录全部模块：iso/palette/layout/ground/city/terminal/ship/cranes/traffic/sea/sky
 * [OUTPUT]: 对外提供 PortScene：画布生命周期、静态烘焙 (动态占用扫描)、船体分段精灵、分层逐帧绘制、主题/暂停/倍速
 * [POS]: visuals/ygbPort 的总装与渲染调度；所有绘制顺序约定集中于此，模块之间不互相调用绘制
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Iso } from "./iso";
import { boxColors, cabColors, carColors, palettes } from "./palette";
import { CRANES, QUAY_Y } from "./layout";
import { paintGround } from "./ground";
import { buildCity } from "./city";
import { buildTerminal, container } from "./terminal";
import { Ship } from "./ship";
import { Crane, CraneWork } from "./cranes";
import { Traffic } from "./traffic";
import { Sea } from "./sea";
import { FUNNEL_TOP, Sky } from "./sky";

const APRON_Y = 246;
const CELL = 16;

/*
 * 绘制分层 (自后向前)：
 *   地面层(烘焙) → 岸桥投影/灯池 → 追踪路线 → 水面粼光与尾迹
 *   → 陆域深度排序 (静态精灵 + 车辆 + 信号 + 道闸)
 *   → 前沿：陆侧门腿 → 前沿车辆/陆侧吊具 → 门框与海侧门腿
 *   → 船体后段 → 海侧吊具 → 船体前段 → 岸桥上部结构 → 海上船只 → 云影/飞机/海鸥/尾烟 → 环境光
 */
export class PortScene {
  constructor(canvas, dark) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dark = dark;
    this.iso = new Iso();
    this.ground = document.createElement("canvas");
    this.lightmap = document.createElement("canvas");
    this.paused = false;
    this.speed = 1;
    this.frame = 0;
    this.last = 0;
    this.visibleInViewport = true;

    /* ─── 世界：确定性构建一次，主题/尺寸变化只重绘不重建 ─── */
    this.city = buildCity();
    this.terminal = buildTerminal();
    this.statics = [...this.city.objects, ...this.terminal.objects];
    this.ship = new Ship();
    this.cranes = CRANES.map((c) => new Crane(c));
    const active = this.cranes.find((c) => c.mode === "active");
    const c2 = this.ship.bayIndexAt(active.x);
    this.work = new CraneWork(active, this.ship, [c2, c2 + 1, c2 + 2]);
    this.traffic = new Traffic(this.work);
    this.sea = new Sea();
    this.sky = new Sky(FUNNEL_TOP(this.ship));
    this.beacons = this.statics.filter((o) => o.beacon).map((o) => o.beacon);
    for (let i = 0; i < 260; i++) {
      this.work.update(0.1);
      this.traffic.update(0.1, false);
    }

    this.motion = matchMedia("(prefers-reduced-motion: reduce)");
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersection = new IntersectionObserver(([entry]) => {
      this.visibleInViewport = entry.isIntersecting;
      this.clock();
    });
    this.intersection.observe(canvas);
    this.onVisibility = () => this.clock();
    document.addEventListener("visibilitychange", this.onVisibility);
    this.motion.addEventListener("change", this.onVisibility);
    this.resize();
    this.clock();
  }

  get colors() {
    const k = this.dark ? "night" : "day";
    return { box: boxColors[k], car: carColors[k], cab: cabColors[k] };
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.w = rect.width;
    this.h = rect.height;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    for (const cv of [this.canvas, this.ground, this.lightmap]) {
      cv.width = Math.round(this.w * this.dpr);
      cv.height = Math.round(this.h * this.dpr);
    }
    /* 正交镜头固定；画幅自适应缩放，不随车辆或指针摇晃 */
    const s = Math.max(0.64, Math.min(1.28, this.w / 1250));
    const cam = this.camera;
    if (cam) this.iso.set(cam.s, this.w / 2 - (cam.x - cam.y) * 0.74 * cam.s, this.h / 2 - (cam.x + cam.y) * 0.365 * cam.s, this.w, this.h);
    else this.iso.set(s, this.w * 0.55, this.h * 0.54, this.w, this.h);
    this.rebuild();
  }

  /* ════════════════════════════════════════════════════════════════════
   * 重建：地面 + 阴影/灯池 + 静态物件烘焙或精灵化
   * ════════════════════════════════════════════════════════════════════ */
  rebuild() {
    if (!this.w) return;
    const iso = this.iso, dark = this.dark, c = (this.c = palettes[dark ? "night" : "day"]), colors = this.colors;
    const g = this.ground.getContext("2d");
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);
    paintGround(g, iso, c, dark, { city: this.city, terminal: this.terminal, w: this.w, h: this.h });

    /* 可见静态物件 + 屏幕包围盒 */
    const vis = [];
    for (const o of this.statics) {
      const b = iso.bounds(o.x0, o.y0, o.z0, o.x1, o.y1, o.z1, 10);
      if (b.r < -20 || b.l > this.w + 20 || b.b < -20 || b.t > this.h + 20) continue;
      vis.push({ o, b });
    }
    vis.sort((p, q) => p.o.depth - q.o.depth);
    if (!dark) {
      for (const { o } of vis) o.shadow?.(g, iso, c);
      this.ship.shadow(g, iso, c);
    } else {
      /* 夜间光照图：灯池叠加在地面与物件之上 (lighter)，集装箱与立面也会被照亮 */
      const l = this.lightmap.getContext("2d");
      l.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      l.clearRect(0, 0, this.w, this.h);
      for (const { o } of vis) o.light?.(l, iso, c);
    }

    /* 动态占用：车辆路线、道闸与信号所在的屏幕格；与之重叠的静态物件必须保持为精灵 */
    const cols = Math.ceil(this.w / CELL) + 1, rows = Math.ceil(this.h / CELL) + 1;
    const occ = new Uint8Array(cols * rows);
    const mark = (l, t, r, b) => {
      const c0 = Math.max(0, Math.floor(l / CELL)), c1 = Math.min(cols - 1, Math.floor(r / CELL));
      const r0 = Math.max(0, Math.floor(t / CELL)), r1 = Math.min(rows - 1, Math.floor(b / CELL));
      for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) occ[y * cols + x] = 1;
    };
    const hit = (l, t, r, b) => {
      const c0 = Math.max(0, Math.floor(l / CELL)), c1 = Math.min(cols - 1, Math.floor(r / CELL));
      const r0 = Math.max(0, Math.floor(t / CELL)), r1 = Math.min(rows - 1, Math.floor(b / CELL));
      for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) if (occ[y * cols + x]) return true;
      return false;
    };
    const s = iso.s;
    for (const v of this.traffic.vehicles) {
      const pts = v.path.pts;
      for (let i = 0; i < pts.length; i += 2) {
        const X = iso.X(pts[i].x, pts[i].y), Y = iso.Y(pts[i].x, pts[i].y);
        if (X < -60 || X > this.w + 60 || Y < -60 || Y > this.h + 60) continue;
        mark(X - 24 * s, Y - 20 * s, X + 24 * s, Y + 12 * s);
      }
    }
    for (const it of this.traffic.items(c, dark, colors, iso)) {
      if (it.kind === "vehicle") continue;
      const X = iso.X(it.px, it.py), Y = iso.Y(it.px, it.py);
      mark(X - 30 * s, Y - 34 * s, X + 30 * s, Y + 14 * s);
    }

    /* 深度序扫描：与动态区或已精灵化物件重叠者精灵化，其余直接烘焙进地面层 */
    this.sprites = [];
    for (const { o, b } of vis) {
      if (hit(b.l, b.t, b.r, b.b)) {
        mark(b.l, b.t, b.r, b.b);
        this.sprites.push(this.sprite(o, b, c, colors));
      } else o.draw(g, iso, c, dark, colors);
    }
    this.sky.bake(iso, c, this.dpr);
    this.shipKey = "";
    this.draw();
  }

  sprite(o, b, c, colors) {
    const l = Math.floor(b.l), t = Math.floor(b.t), w = Math.ceil(b.r - l), h = Math.ceil(b.b - t);
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.ceil(w * this.dpr));
    cv.height = Math.max(1, Math.ceil(h * this.dpr));
    const ctx = cv.getContext("2d");
    ctx.setTransform(this.dpr, 0, 0, this.dpr, -l * this.dpr, -t * this.dpr);
    o.draw(ctx, this.iso, c, this.dark, colors);
    return { canvas: cv, l, t, w, h, depth: o.depth };
  }

  /* ─── 船体精灵：按作业贝切成前后两段，吊具夹在中间 ─── */
  shipSprites() {
    const bay = this.ship.bayIndexAt(this.work.crane.x);
    const split = bay >= 0 ? this.ship.bays[bay].x1 : this.work.crane.x;
    const key = `${this.ship.version}|${split}|${this.dark}|${this.w}`;
    if (key === this.shipKey) return;
    this.shipKey = key;
    const [x0, y0, z0, x1, y1, z1] = this.ship.bounds();
    const b = this.iso.bounds(x0, y0, z0, x1, y1, z1, 30);
    this.shipParts = ["back", "front"].map((part) => {
      const o = {
        depth: 0,
        draw: (ctx, iso, c, dark, colors) => {
          this.ship.draw(ctx, iso, c, dark, colors, split, part);
          if (dark && part === "front") {
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            this.ship.lights(ctx, iso);
            ctx.restore();
          }
        },
      };
      return this.sprite(o, b, this.c, this.colors);
    });
  }

  /* ════════════════════════════════════════════════════════════════════
   * 逐帧
   * ════════════════════════════════════════════════════════════════════ */
  step(dt) {
    const visible = (x, y) => this.iso.visible(x, y, 40);
    this.work.update(dt);
    this.traffic.update(dt, true, visible);
    this.sea.update(dt, visible);
    this.sky.update(dt, (x, y, z) => this.iso.visible(x, y, 60, z));
  }

  draw() {
    if (!this.w || !this.c) return;
    const ctx = this.ctx, iso = this.iso, c = this.c, dark = this.dark, colors = this.colors, t = this.traffic.time;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.drawImage(this.ground, 0, 0, this.w, this.h);
    const cranes = this.cranes.filter((cr) => {
      const [x0, y0, z0, x1, y1, z1] = cr.bounds();
      const b = iso.bounds(x0, y0, z0, x1, y1, z1);
      return b.r > 0 && b.l < this.w && b.b > 0 && b.t < this.h;
    });

    /* 地面动态：岸桥投影 / 夜间泛光、追踪路线、水面 */
    if (!dark) for (const cr of cranes) cr.shadow(ctx, iso, c);
    else {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const cr of cranes) cr.floodGround(ctx, iso);
      ctx.restore();
    }
    this.traffic.drawTracking(ctx, iso, dark);
    this.sea.surface(ctx, iso, c, dark, this.reflections());

    /* 陆域：静态精灵与动态物件按深度归并 */
    const items = this.traffic.items(c, dark, colors, iso);
    const land = [], apron = [];
    for (const it of items) (it.y >= APRON_Y ? apron : land).push(it);
    land.sort((a, b) => a.depth - b.depth);
    const sp = this.sprites;
    let i = 0;
    for (const it of land) {
      while (i < sp.length && sp[i].depth <= it.depth) this.blit(sp[i++]);
      it.draw(ctx);
    }
    while (i < sp.length) this.blit(sp[i++]);

    /* 码头前沿：陆侧门腿 → 车道上的车辆与吊具 → 门框和海侧门腿 */
    for (const cr of cranes) cr.back(ctx, iso, c, dark, t);
    for (const cr of cranes) if (!cr.hoistOverSea()) apron.push({ depth: cr.x + 280, draw: () => cr.hoist(ctx, iso, c, dark, colors, container) });
    apron.sort((a, b) => a.depth - b.depth);
    for (const it of apron) it.draw(ctx);
    for (const cr of cranes) cr.front(ctx, iso, c, dark, t);

    /* 船：后段 → 海侧吊具 → 前段 */
    this.shipSprites();
    this.blit(this.shipParts[0]);
    for (const cr of cranes) if (cr.hoistOverSea()) cr.hoist(ctx, iso, c, dark, colors, container);
    this.blit(this.shipParts[1]);
    if (dark) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.9;
      ctx.drawImage(this.lightmap, 0, 0, this.w, this.h);
      ctx.restore();
    }

    /* 岸桥上部结构位于船体之上 */
    for (const cr of cranes) cr.upper(ctx, iso, c, dark, t);
    if (dark) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const cr of cranes) cr.floodShip(ctx, iso);
      ctx.restore();
    }

    /* 海上与天空 */
    this.sea.draw(ctx, iso, c, dark);
    this.sky.shadows(ctx, iso, c, dark);
    this.sky.draw(ctx, iso, c, dark, this.beacons);

    /* 环境光与空气透视；正文保护仍由 Hero 蒙层负责 */
    const amb = ctx.createLinearGradient(0, 0, this.w, this.h);
    if (dark) { amb.addColorStop(0, "#9acde00b"); amb.addColorStop(1, "#020c161d"); }
    else { amb.addColorStop(0, "#fff8da25"); amb.addColorStop(0.55, "#fff9e30a"); amb.addColorStop(1, "#567c9812"); }
    ctx.fillStyle = amb;
    ctx.fillRect(0, 0, this.w, this.h);
  }

  blit(s) {
    if (s.l > this.w || s.t > this.h || s.l + s.w < 0 || s.t + s.h < 0) return;
    this.ctx.drawImage(s.canvas, s.l, s.t, s.w, s.h);
  }

  /* 夜间倒影光源：岸桥大梁灯、船舶甲板灯 */
  reflections() {
    if (!this.dark) return [];
    const out = [];
    for (const cr of this.cranes) if (cr.angle === 0) out.push({ x: cr.x + 6, y: 418, color: "#fff0cf", a: 0.28 });
    for (const x of [-300, -180, -60, 60]) out.push({ x, y: 410, color: "#ffe1a2", a: 0.18 });
    for (const b of this.sea.boats) out.push({ x: b.x, y: b.y + 4, color: "#fff6dc", a: 0.16 });
    return out.filter((L) => this.iso.visible(L.x, L.y, 60) && L.y > QUAY_Y);
  }

  /* ════════════════════════════════════════════════════════════════════
   * 外部控制
   * ════════════════════════════════════════════════════════════════════ */
  setTheme(dark) {
    if (this.dark === dark) return;
    this.dark = dark;
    this.rebuild();
  }
  setPaused(paused) {
    this.paused = paused;
    this.clock();
  }
  setSpeed(speed) {
    this.speed = speed;
  }
  /* 调试镜头：{ s, x, y } 把世界点放到画面中心；null 恢复默认构图 */
  setCamera(camera) {
    this.camera = camera;
    this.resize();
  }
  clock() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.last = 0;
    this.draw();
    if (this.paused || this.motion.matches || document.hidden || !this.visibleInViewport) return;
    const tick = (now) => {
      if (this.last) {
        const dt = Math.min((now - this.last) / 1000, 0.05) * this.speed;
        const n = Math.ceil(this.speed);
        for (let k = 0; k < n; k++) this.step(dt / n);
      }
      this.last = now;
      this.draw();
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.intersection.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.motion.removeEventListener("change", this.onVisibility);
    this.sprites = [];
    this.shipParts = null;
  }
}
