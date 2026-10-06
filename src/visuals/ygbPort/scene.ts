/**
 * [INPUT]: 依赖本目录全部模块：iso/palette/layout/ground/city/terminal/ship/cranes/traffic/sea/sky
 * [OUTPUT]: 对外提供 PortScene：画布生命周期、静态烘焙 (动态占用扫描)、精灵图集、船体分段精灵、分层逐帧绘制、主题/暂停/倍速、镜头设定与覆盖镜头飞行 (快照交叉淡化)、帧订阅与事件总线 (gate/arrive)、画质档位 (飞行临时降档 + 帧耗时自动降档)；PortCamera 镜头类型
 * [POS]: visuals/ygbPort 的总装与渲染调度；所有绘制顺序约定集中于此，模块之间不互相调用绘制
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Iso, type Ctx, type Pt, type ScreenBounds } from "./iso";
import { boxColors, cabColors, carColors, palettes, type Palette, type ThemeColors } from "./palette";
import { CRANES, QUAY_Y } from "./layout";
import { paintGround } from "./ground";
import { buildCity } from "./city";
import { buildTerminal, container } from "./terminal";
import { Ship } from "./ship";
import { Crane, CraneWork } from "./cranes";
import { Traffic, type TrafficEvents } from "./traffic";
import { Sea, type SeaLight } from "./sea";
import { FUNNEL_TOP, Sky } from "./sky";
import type { City } from "./city";
import type { Terminal } from "./terminal";
import type { DynamicItem, ParkedVehicle, StaticItem } from "./types";

/* 镜头：把世界点 (x, y) 放在画面 (ax, ay) 比例处，s 为缩放；null 为默认全景构图 */
export interface PortCamera {
  s: number;
  x: number;
  y: number;
  ax?: number;
  ay?: number;
}

/* 屏幕视图：缩放与世界原点的屏幕位置 */
interface View {
  s: number;
  cx: number;
  cy: number;
}

/* 视图矩形：画面中心对准的世界点 (px, py)、缩放 s 与半宽/半高 (世界单位) */
interface Rect {
  s: number;
  px: number;
  py: number;
  hw: number;
  hh: number;
}

/* 精灵：图集页 (或独立画布) 中的一块，以及它在屏幕上的位置与排序深度 */
interface Sprite {
  canvas: HTMLCanvasElement;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  l: number;
  t: number;
  w: number;
  h: number;
  depth: number;
}

/* 能画进精灵的物件 */
type Drawable = Pick<StaticItem, "draw" | "depth">;

/* 前沿深度排序中的一项：动态物件，或岸桥吊具 */
type ApronItem = Pick<DynamicItem, "depth" | "draw"> & Partial<DynamicItem>;

type FrameListener = (scene: PortScene) => void;
type EventHandler = (event: TrafficEvents[keyof TrafficEvents]) => void;

const APRON_Y = 246;
const ATLAS = 2048, GUTTER = 2;
/*
 * 画质档位：静止时保持设备像素比 (上限 2) 的完整清晰度。
 * 镜头飞行途中画面本就在被缩放，临时用 1.5 渲染、到站恢复；
 * 静止时若连续约 2 秒平均帧耗时超过 20ms (低于 50fps)，本次会话降到 1.5。
 */
const FULL_DPR = 2, LOW_DPR = 1.5, SLOW_FRAME_MS = 20, PROBE_FRAMES = 120, SETTLE_FRAMES = 45;
/* 飞行降档要额外重建一次，只在大舞台 (约 250 万物理像素以上) 才划算；手机小舞台上反而多一次主线程阻塞 */
const FLIGHT_LOW_MIN_PIXELS = 2.5e6;
const CELL = 16;

/*
 * 绘制分层 (自后向前)：
 *   地面层(烘焙) → 岸桥投影/灯池 → 追踪路线 → 水面粼光与尾迹
 *   → 陆域深度排序 (静态精灵 + 车辆 + 信号 + 道闸)
 *   → 前沿：陆侧门腿 → 前沿车辆/陆侧吊具 → 门框与海侧门腿
 *   → 船体后段 → 海侧吊具 → 船体前段 → 岸桥上部结构 → 海上船只 → 云影/飞机/海鸥/尾烟 → 环境光
 */
export class PortScene {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dark: boolean;
  iso: Iso;
  ground: HTMLCanvasElement;
  lightmap: HTMLCanvasElement;
  dprCap: number;
  flightLow: boolean;
  paused: boolean;
  speed: number;
  frame: number;
  last: number;
  visibleInViewport: boolean;
  city: City;
  terminal: Terminal;
  statics: StaticItem[];
  ship: Ship;
  cranes: Crane[];
  work: CraneWork;
  traffic: Traffic;
  handlers: Map<keyof TrafficEvents, Set<EventHandler>>;
  sea: Sea;
  sky: Sky;
  beacons: Array<[number, number, number]>;
  motion: MediaQueryList;
  resizeObserver: ResizeObserver;
  intersection: IntersectionObserver;
  onVisibility: () => void;
  /* 以下在首次 resize()/rebuild() 时建立；在此之前 w 为空，draw 直接返回 */
  w!: number;
  h!: number;
  dpr!: number;
  probe!: number[];
  settle!: number;
  c!: Palette;
  sprites!: Sprite[];
  pages!: HTMLCanvasElement[];
  pack!: { page: number; x: number; y: number; row: number };
  shipKey!: string;
  shipParts!: Sprite[] | null;
  camera?: PortCamera | null;
  ghost?: HTMLCanvasElement;
  ghostTimer?: ReturnType<typeof setTimeout>;
  flight!: number;
  flightState!: { R: Rect; V: Rect } | null;
  listeners?: Set<FrameListener>;
  /* 配图 (figures/common) 缓存的停放集卡 */
  parkedCache?: ParkedVehicle[];
  constructor(canvas: HTMLCanvasElement, dark: boolean) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.dark = dark;
    this.iso = new Iso();
    this.ground = document.createElement("canvas");
    this.lightmap = document.createElement("canvas");
    this.dprCap = FULL_DPR;
    this.flightLow = false;
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
    const active = this.cranes.find((c) => c.mode === "active")!;
    const c2 = this.ship.bayIndexAt(active.x);
    this.work = new CraneWork(active, this.ship, [c2, c2 + 1, c2 + 2]);
    this.traffic = new Traffic(this.work);
    /* 事件总线：集卡闸口核验 (进港/出港/入场/出场)、运单节点抵达；配图与监管上报流订阅这里 */
    this.handlers = new Map();
    const emit: Traffic["emit"] = (type, data) => {
      const list = this.handlers.get(type);
      if (list) for (const fn of list) fn({ ...data, t: this.traffic.time } as TrafficEvents[typeof type]);
    };
    this.traffic.emit = emit;
    this.sea = new Sea();
    this.sky = new Sky(FUNNEL_TOP(this.ship));
    this.beacons = this.statics.filter((o) => o.beacon).map((o) => o.beacon!);
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

  get colors(): ThemeColors {
    const k = this.dark ? "night" : "day";
    return { box: boxColors[k], car: carColors[k], cab: cabColors[k] };
  }

  resize() {
    /* clientWidth 不受飞行动画的 CSS transform 影响 */
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.w = w;
    this.h = h;
    this.dpr = Math.min(devicePixelRatio || 1, FULL_DPR, this.dprCap, this.flightLow ? LOW_DPR : FULL_DPR);
    this.probe = [];
    this.settle = SETTLE_FRAMES;
    for (const cv of [this.canvas, this.ground]) {
      cv.width = Math.round(this.w * this.dpr);
      cv.height = Math.round(this.h * this.dpr);
    }
    /* 正交镜头只随镜头参数变化，不随车辆或指针摇晃 */
    const v = this.view(this.camera);
    this.iso.set(v.s, v.cx, v.cy, this.w, this.h);
    this.rebuild();
  }

  /* ════════════════════════════════════════════════════════════════════
   * 重建：地面 + 阴影/灯池 + 静态物件烘焙或精灵化
   * ════════════════════════════════════════════════════════════════════ */
  rebuild() {
    if (!this.w) return;
    const iso = this.iso, dark = this.dark, c = (this.c = palettes[dark ? "night" : "day"]), colors = this.colors;
    const g = this.ground.getContext("2d")!;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);
    paintGround(g, iso, c, dark, { city: this.city, terminal: this.terminal, w: this.w, h: this.h });

    /* 可见静态物件 + 屏幕包围盒 */
    const vis: Array<{ o: StaticItem; b: ScreenBounds }> = [];
    for (const o of this.statics) {
      const b = iso.bounds(o.x0, o.y0, o.z0, o.x1, o.y1, o.z1, o.pad ?? 3);
      if (b.r < -20 || b.l > this.w + 20 || b.b < -20 || b.t > this.h + 20) continue;
      vis.push({ o, b });
    }
    vis.sort((p, q) => p.o.depth - q.o.depth);
    /* 光照图按需分配：白天只在重建时充当阴影草稿层，用完即释放；夜间逐帧叠加，常驻 */
    this.sizeCanvas(this.lightmap, true);
    if (!dark) {
      /* 所有阴影先锐利地画进同一层，再整体模糊一次合成；避免逐物件 blur 带来的上百次滤镜开销 */
      const l = this.lightmap.getContext("2d")!;
      l.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      l.clearRect(0, 0, this.w, this.h);
      for (const { o } of vis) o.shadow?.(l, iso, c);
      this.ship.shadow(l, iso, c);
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.filter = `blur(${1.8 * iso.s * this.dpr}px)`;
      g.drawImage(this.lightmap, 0, 0);
      g.restore();
      this.sizeCanvas(this.lightmap, false);
    } else {
      /* 夜间光照图：灯池叠加在地面与物件之上 (lighter)，集装箱与立面也会被照亮 */
      const l = this.lightmap.getContext("2d")!;
      l.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      l.clearRect(0, 0, this.w, this.h);
      for (const { o } of vis) o.light?.(l, iso, c);
    }

    /*
     * 动态占用：每个屏幕格记录经过它的动态物件的最小深度。静态物件只有"挡在某个动态物件前面"
     * (自身深度大于该格最小动态深度) 时才需要保持为精灵逐帧重画；位于所有车流之后的物件直接烘焙。
     * 前沿车道 (y ≥ APRON_Y) 的车辆在陆域之后整体绘制，不参与陆域占用。
     */
    const cols = Math.ceil(this.w / CELL) + 1, rows = Math.ceil(this.h / CELL) + 1;
    const occ = new Float32Array(cols * rows).fill(Infinity);
    const cells = (l: number, t: number, r: number, b: number, fn: (i: number) => boolean | void) => {
      const c0 = Math.max(0, Math.floor(l / CELL)), c1 = Math.min(cols - 1, Math.floor(r / CELL));
      const r0 = Math.max(0, Math.floor(t / CELL)), r1 = Math.min(rows - 1, Math.floor(b / CELL));
      for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) if (fn(y * cols + x)) return true;
      return false;
    };
    const mark = (l: number, t: number, r: number, b: number, depth: number) => cells(l, t, r, b, (i) => { if (depth < occ[i]) occ[i] = depth; });
    const inFront = (l: number, t: number, r: number, b: number, depth: number) => cells(l, t, r, b, (i) => depth > occ[i]);
    const s = iso.s;
    for (const v of this.traffic.vehicles) {
      const pts = v.path.pts;
      for (let i = 0; i < pts.length; i += 2) {
        const p = pts[i];
        if (p.y >= APRON_Y) continue;
        const X = iso.X(p.x, p.y), Y = iso.Y(p.x, p.y);
        if (X < -60 || X > this.w + 60 || Y < -60 || Y > this.h + 60) continue;
        mark(X - 24 * s, Y - 20 * s, X + 24 * s, Y + 12 * s, p.x + p.y - 26);
      }
    }
    for (const it of this.traffic.items(c, dark, colors, iso)) {
      if (it.kind === "vehicle") continue;
      const X = iso.X(it.px!, it.py!), Y = iso.Y(it.px!, it.py!);
      mark(X - 30 * s, Y - 34 * s, X + 30 * s, Y + 14 * s, it.depth - 6);
    }

    /* 深度序扫描：挡在动态物件或已精灵化物件前面的精灵化 (并登记自身深度)，其余直接烘焙 */
    const keep: Array<{ o: StaticItem; b: ScreenBounds }> = [];
    for (const { o, b } of vis) {
      if (inFront(b.l, b.t, b.r, b.b, o.depth)) {
        mark(b.l, b.t, b.r, b.b, o.depth);
        keep.push({ o, b });
      } else o.draw(g, iso, c, dark, colors);
    }
    /* 装箱按高度降序 (货架利用率高)，绘制顺序仍保持深度序 */
    this.atlasReset();
    this.sprites = new Array(keep.length);
    keep.map((k, i) => i).sort((i, j) => (keep[j].b.b - keep[j].b.t) - (keep[i].b.b - keep[i].b.t)).forEach((i) => {
      this.sprites[i] = this.atlasSprite(keep[i].o, keep[i].b, c, colors);
    });
    this.sky.bake(iso, c, this.dpr);
    this.shipKey = "";
    this.draw();
  }

  /* 独立精灵：船体这类会单独重绘的大件 */
  sprite(o: Drawable, b: ScreenBounds, c: Palette, colors: ThemeColors): Sprite {
    const l = Math.floor(b.l), t = Math.floor(b.t), w = Math.ceil(b.r - l), h = Math.ceil(b.b - t);
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.ceil(w * this.dpr));
    cv.height = Math.max(1, Math.ceil(h * this.dpr));
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, -l * this.dpr, -t * this.dpr);
    o.draw(ctx, this.iso, c, this.dark, colors);
    return { canvas: cv, sx: 0, sy: 0, sw: cv.width, sh: cv.height, l, t, w, h, depth: o.depth };
  }

  /*
   * 图集：静态精灵按行货架式装进 2048² 大页。几百张小画布各自上传纹理会在首帧卡顿数百毫秒，
   * 合并成几张大页后上传次数降到个位数，逐帧绘制也少了纹理切换。
   */
  atlasReset() {
    this.pages ??= [];
    for (const p of this.pages) p.getContext("2d")!.clearRect(0, 0, ATLAS, ATLAS);
    this.pack = { page: 0, x: 0, y: 0, row: 0 };
  }
  atlasSprite(o: Drawable, b: ScreenBounds, c: Palette, colors: ThemeColors): Sprite {
    const l = Math.floor(b.l), t = Math.floor(b.t), w = Math.ceil(b.r - l), h = Math.ceil(b.b - t);
    const sw = Math.max(1, Math.ceil(w * this.dpr)), sh = Math.max(1, Math.ceil(h * this.dpr));
    if (sw > ATLAS || sh > ATLAS) return this.sprite(o, b, c, colors);
    const P = this.pack;
    if (P.x + sw > ATLAS) { P.x = 0; P.y += P.row + GUTTER; P.row = 0; }
    if (P.y + sh > ATLAS) { P.page++; P.x = 0; P.y = 0; P.row = 0; }
    if (!this.pages[P.page]) {
      const cv = document.createElement("canvas");
      cv.width = cv.height = ATLAS;
      this.pages[P.page] = cv;
    }
    const page = this.pages[P.page], ctx = page.getContext("2d")!, sx = P.x, sy = P.y;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, sy, sw, sh);
    ctx.clip();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, sx - l * this.dpr, sy - t * this.dpr);
    o.draw(ctx, this.iso, c, this.dark, colors);
    ctx.restore();
    P.x += sw + GUTTER;
    P.row = Math.max(P.row, sh);
    return { canvas: page, sx, sy, sw, sh, l, t, w, h, depth: o.depth };
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
    this.shipParts = (["back", "front"] as const).map((part) => {
      const o: Drawable = {
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
  step(dt: number) {
    const visible = (x: number, y: number) => this.iso.visible(x, y, 40);
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
    const land: DynamicItem[] = [], apron: ApronItem[] = [];
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
    this.blit(this.shipParts![0]);
    for (const cr of cranes) if (cr.hoistOverSea()) cr.hoist(ctx, iso, c, dark, colors, container);
    this.blit(this.shipParts![1]);
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

  blit(s: Sprite) {
    if (s.l > this.w || s.t > this.h || s.l + s.w < 0 || s.t + s.h < 0) return;
    this.ctx.drawImage(s.canvas, s.sx, s.sy, s.sw, s.sh, s.l, s.t, s.w, s.h);
  }

  /* 夜间倒影光源：岸桥大梁灯、船舶甲板灯 */
  reflections(): SeaLight[] {
    if (!this.dark) return [];
    const out: SeaLight[] = [];
    for (const cr of this.cranes) if (cr.angle === 0) out.push({ x: cr.x + 6, y: 418, color: "#fff0cf", a: 0.28 });
    for (const x of [-300, -180, -60, 60]) out.push({ x, y: 410, color: "#ffe1a2", a: 0.18 });
    for (const b of this.sea.boats) out.push({ x: b.x, y: b.y + 4, color: "#fff6dc", a: 0.16 });
    return out.filter((L) => this.iso.visible(L.x, L.y, 60) && L.y > QUAY_Y);
  }

  /* ════════════════════════════════════════════════════════════════════
   * 外部控制
   * ════════════════════════════════════════════════════════════════════ */
  setTheme(dark: boolean) {
    if (this.dark === dark) return;
    this.dark = dark;
    this.rebuild();
  }
  setPaused(paused: boolean) {
    this.paused = paused;
    this.clock();
  }
  setSpeed(speed: number) {
    this.speed = speed;
  }
  /* ════════════════════════════════════════════════════════════════════
   * 镜头：{ s, x, y, ax?, ay? } 把世界点 (x,y) 放在画面 (ax,ay) 比例处；null 为默认全景构图
   * ════════════════════════════════════════════════════════════════════ */
  view(cam: PortCamera | null | undefined): View {
    if (!cam) {
      const s = Math.max(0.64, Math.min(1.28, this.w / 1250));
      return { s, cx: this.w * 0.55, cy: this.h * 0.54 };
    }
    const ax = cam.ax ?? 0.5, ay = cam.ay ?? 0.5;
    return { s: cam.s, cx: this.w * ax - (cam.x - cam.y) * 0.74 * cam.s, cy: this.h * ay - (cam.x + cam.y) * 0.365 * cam.s };
  }
  /* 把任意镜头 (含默认构图) 规范成"画面中心对准的世界点 + 缩放"，便于插值 */
  focus(cam: PortCamera | null | undefined) {
    const v = this.view(cam), u = (this.w / 2 - v.cx) / (0.74 * v.s), w = (this.h / 2 - v.cy) / (0.365 * v.s);
    return { s: v.s, x: (u + w) / 2, y: (w - u) / 2 };
  }
  setCamera(camera: PortCamera | null) {
    this.cancelFlight();
    this.camera = camera;
    this.resize();
  }
  /*
   * 镜头飞行：重建一帧要几十毫秒，不能逐帧重建；途中用 CSS transform 缩放一张已渲染画面。
   * 两个相距很远的近景之间直接平移会露出画面外的空白，所以先算出能同时框住起点与终点的
   * "覆盖镜头"并在其上渲染一帧：拉远 → 平移 → 推近全程都在已渲染像素之内。
   * 起点用快照淡出保持清晰，到站重建后再用快照把模糊帧淡入清晰帧，两端都没有跳变。
   */
  rectOf(cam: PortCamera | null | undefined): Rect {
    const v = this.view(cam);
    return { s: v.s, px: (this.w / 2 - v.cx) / v.s, py: (this.h / 2 - v.cy) / v.s, hw: this.w / 2 / v.s, hh: this.h / 2 / v.s };
  }
  cover(A: Rect, B: Rect): Rect {
    const x0 = Math.min(A.px - A.hw, B.px - B.hw), x1 = Math.max(A.px + A.hw, B.px + B.hw);
    const y0 = Math.min(A.py - A.hh, B.py - B.hh), y1 = Math.max(A.py + A.hh, B.py + B.hh);
    const s = Math.min(this.w / (x1 - x0), this.h / (y1 - y0), A.s, B.s);
    return { s, px: (x0 + x1) / 2, py: (y0 + y1) / 2, hw: this.w / 2 / s, hh: this.h / 2 / s };
  }
  /* 视图矩形 → 镜头参数 (画面中心对准的世界点) */
  camOf(P: Rect): PortCamera {
    const u = P.px / 0.74, v = P.py / 0.365;
    return { s: P.s, x: (u + v) / 2, y: (v - u) / 2 };
  }
  mapping(R: Rect, V: Rect) {
    const k = V.s / R.s;
    const tx = this.w / 2 - V.px * V.s - (this.w / 2 - R.px * R.s) * k, ty = this.h / 2 - V.py * V.s - (this.h / 2 - R.py * R.s) * k;
    return `translate(${tx}px, ${ty}px) scale(${k})`;
  }
  /* 画布显存：full 为真时按舞台像素分配，否则缩到 1×1 释放后备存储 */
  sizeCanvas(cv: HTMLCanvasElement, full: boolean) {
    const w = full ? Math.round(this.w * this.dpr) : 1, h = full ? Math.round(this.h * this.dpr) : 1;
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
  }
  /* 过渡快照只在飞行两端存在；淡出结束后释放，下次飞行由 snapshot 重新分配 */
  releaseGhost(delay: number) {
    clearTimeout(this.ghostTimer);
    this.ghostTimer = setTimeout(() => {
      if (this.ghost && !this.flight && this.ghost.style.opacity === "0") this.sizeCanvas(this.ghost, false);
    }, delay);
  }
  ghostCanvas(): HTMLCanvasElement {
    if (!this.ghost) {
      const g = document.createElement("canvas");
      g.setAttribute("aria-hidden", "true");
      g.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;transform-origin:0 0;opacity:0";
      this.canvas.after(g);
      this.ghost = g;
    }
    return this.ghost;
  }
  snapshot(transform: string) {
    const g = this.ghostCanvas();
    if (g.width !== this.canvas.width || g.height !== this.canvas.height) {
      g.width = this.canvas.width;
      g.height = this.canvas.height;
    }
    g.style.width = `${this.w}px`;
    g.style.height = `${this.h}px`;
    const x = g.getContext("2d")!;
    x.clearRect(0, 0, g.width, g.height);
    x.drawImage(this.canvas, 0, 0);
    g.style.transition = "none";
    g.style.transform = transform;
    g.style.opacity = "1";
    return g;
  }
  flyTo(camera: PortCamera | null, ms = 1300) {
    /* 被打断的飞行：从屏幕上实际呈现的插值视图起飞，而不是从渲染用的镜头起飞 */
    const prev = this.flightState;
    this.cancelFlight(true);
    if (!this.w) { this.camera = camera; return; }
    if (this.motion.matches || ms <= 0) { this.setCamera(camera); return; }
    const held = prev ? prev.R : this.rectOf(this.camera);
    const A = prev ? prev.V : held, B = this.rectOf(camera);
    const contains = (P: Rect, Q: Rect) => P.px - P.hw <= Q.px - Q.hw + 0.5 && P.px + P.hw >= Q.px + Q.hw - 0.5 && P.py - P.hh <= Q.py - Q.hh + 0.5 && P.py + P.hh >= Q.py + Q.hh - 0.5;
    /* 覆盖镜头：一端完整包含另一端时直接取该端 (省一次重建)，否则取二者并集 */
    let C = this.cover(A, B);
    const reuse = contains(held, A) && contains(held, B);
    /* 现有像素已覆盖两端：直线插值必在其凸包内；否则一端包含另一端时取该端，再否则取并集 */
    if (reuse || contains(A, B)) C = A;
    else if (contains(B, A)) C = B;
    const leg = (P: Rect, Q: Rect) => Math.abs(Math.log(P.hw / Q.hw)) + Math.hypot(P.px - Q.px, P.py - Q.py) / Math.max(P.hw, Q.hw);
    const d1 = leg(A, C), d2 = leg(C, B), m = d1 + d2 > 1e-6 ? d1 / (d1 + d2) : 0.5;
    const lerp = (P: Rect, Q: Rect, t: number): Rect => {
      const hw = P.hw + (Q.hw - P.hw) * t, s = this.w / 2 / hw;
      return { s, hw, hh: this.h / 2 / s, px: P.px + (Q.px - P.px) * t, py: P.py + (Q.py - P.py) * t };
    };
    /* 当前像素已覆盖整条路径则不重建；否则快照保持画面，在覆盖镜头 (或目标) 上重建 */
    let R = held, ghost: HTMLCanvasElement | null = null;
    /* 复用现有像素时也降到飞行档：镜头不变只降分辨率，运动中看不出差别，整段飞行都省合成开销 */
    if (reuse && !this.flightLow && this.canFlyLow()) {
      this.flightLow = true;
      this.resize();
    }
    if (!reuse) {
      ghost = this.snapshot(this.mapping(held, A));
      this.camera = C === B ? camera : this.camOf(C);
      this.canvas.style.transform = "";
      this.flightLow = this.canFlyLow();
      this.resize();
      R = C === B ? B : C;
    }
    const cv = this.canvas, start = performance.now();
    cv.style.transformOrigin = "0 0";
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const V = e < m ? lerp(A, C, m ? e / m : 1) : lerp(C, B, m < 1 ? (e - m) / (1 - m) : 1);
      cv.style.transform = this.mapping(R, V);
      if (ghost) {
        ghost.style.transform = this.mapping(held, V);
        ghost.style.opacity = String(Math.max(0, 1 - p / 0.3));
      }
      this.flightState = { R, V };
      if (p < 1) { this.flight = requestAnimationFrame(step); return; }
      this.flight = 0;
      this.flightState = null;
      const lowered = this.flightLow;
      this.flightLow = false;
      /* 到站：主画布不在目标镜头或仍是飞行低档时，快照当前画面，按完整画质重建后淡出快照 */
      if (R !== B || lowered) {
        const g = this.snapshot(cv.style.transform);
        this.camera = camera;
        cv.style.transform = "";
        this.resize();
        requestAnimationFrame(() => {
          g.style.transition = "opacity .32s ease";
          g.style.opacity = "0";
          this.releaseGhost(420);
        });
      } else {
        this.camera = camera;
        cv.style.transform = "";
        if (ghost) {
          ghost.style.opacity = "0";
          this.releaseGhost(0);
        }
      }
    };
    this.flight = requestAnimationFrame(step);
  }
  cancelFlight(keepPixels = false) {
    if (this.flight) cancelAnimationFrame(this.flight);
    this.flight = 0;
    this.flightState = null;
    if (keepPixels) return;
    this.flightLow = false;
    this.canvas.style.transform = "";
    if (this.ghost) {
      this.ghost.style.transition = "none";
      this.ghost.style.opacity = "0";
      this.releaseGhost(0);
    }
  }
  /* 事件订阅：type = gate | arrive */
  on<K extends keyof TrafficEvents>(type: K, fn: (event: TrafficEvents[K]) => void): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(fn as EventHandler);
    return () => this.handlers.get(type)?.delete(fn as EventHandler);
  }
  /* 帧订阅：配图等外部视图跟随同一世界的状态刷新 */
  subscribe(fn: FrameListener): () => void {
    this.listeners ??= new Set();
    this.listeners.add(fn);
    fn(this);
    return () => this.listeners!.delete(fn);
  }
  /* 自动降档：只统计静止画面 (非飞行、重建后稳定) 的帧间隔；单帧尖峰按 50ms 截断，避免一次 GC 误判 */
  watchFrame(ms: number) {
    if (this.flight || this.flightLow || this.dprCap <= LOW_DPR || (devicePixelRatio || 1) <= LOW_DPR) return;
    if (this.settle > 0) { this.settle--; return; }
    this.probe.push(Math.min(ms, 50));
    if (this.probe.length < PROBE_FRAMES) return;
    const avg = this.probe.reduce((a, b) => a + b, 0) / this.probe.length;
    this.probe = [];
    if (avg <= SLOW_FRAME_MS) return;
    this.dprCap = LOW_DPR;
    const g = this.snapshot("");
    this.resize();
    requestAnimationFrame(() => {
      g.style.transition = "opacity .5s ease";
      g.style.opacity = "0";
      this.releaseGhost(600);
    });
  }
  canFlyLow() {
    const dpr = Math.min(devicePixelRatio || 1, this.dprCap);
    return dpr > LOW_DPR && this.w * this.h * dpr * dpr >= FLIGHT_LOW_MIN_PIXELS;
  }
  /* 调试：当前渲染像素比与降档状态 */
  get quality() {
    return { dpr: this.dpr, cap: this.dprCap, flightLow: this.flightLow, adaptive: this.dprCap < FULL_DPR };
  }
  clock() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.last = 0;
    this.draw();
    if (this.paused || this.motion.matches || document.hidden || !this.visibleInViewport) return;
    const tick = (now: number) => {
      if (this.last) {
        const dt = Math.min((now - this.last) / 1000, 0.05) * this.speed;
        const n = Math.ceil(this.speed);
        for (let k = 0; k < n; k++) this.step(dt / n);
      }
      if (this.last) this.watchFrame(now - this.last);
      this.last = now;
      this.draw();
      if (this.listeners) for (const fn of this.listeners) fn(this);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
  dispose() {
    this.cancelFlight();
    clearTimeout(this.ghostTimer);
    this.ghost?.remove();
    this.listeners?.clear();
    this.handlers?.clear();
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.intersection.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.motion.removeEventListener("change", this.onVisibility);
    this.sprites = [];
    this.pages = [];
    this.shipParts = null;
  }
}
