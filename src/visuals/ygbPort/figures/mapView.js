/**
 * [INPUT]: 依赖 ../layout 的地块与港区常量、../roads 的 network；读取 PortScene 的 statics/traffic/dark
 * [OUTPUT]: 对外提供 MapView：俯视地图底图 (海陆/街坊/堆场/建筑/道路/车队点) 与标注原语 (线/图钉/定位点/标签)
 * [POS]: figures 的共享地图渲染器；追踪与派单两张配图共用同一底图与视觉语言
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { FENCE_Y, QUAY_Y, SHIP, cityBlocks, yardBlocks } from "../layout";
import { network } from "../roads";
import { isTruck } from "./common";

const MAP = {
  day: { land: "#eef0e8", city: "#e6e9e1", park: "#d3e3d1", port: "#e2e5df", yard: "#d8dcd5", sea: "#c9dde6", road: "#ffffff", casing: "#d3d8d2", building: "#d2d7d0", ship: "#8a9aa0", accent: "#2f6bff", fleet: "#9aa6a8", truck: "#e87f46", label: "#1f2a2e", labelBg: "rgba(255,255,255,.94)", halo: "#ffffff" },
  night: { land: "#1a2428", city: "#1f2a2f", park: "#1f3a31", port: "#1d272b", yard: "#243036", sea: "#0f2730", road: "#33454c", casing: "#141d21", building: "#2a383d", ship: "#4d5f66", accent: "#5b8cff", fleet: "#5f6f74", truck: "#c97e4b", label: "#e8ecea", labelBg: "rgba(16,24,28,.92)", halo: "#0e171b" },
};

export class MapView {
  constructor(canvas, scene) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.scene = scene;
    this.buildings = scene.statics.filter((o) => o.z1 > 12 && o.x1 - o.x0 > 12 && o.y1 - o.y0 > 12 && (o.x1 - o.x0) * (o.y1 - o.y0) > 500);
    this.roads = [...new Set(network.edges.values())];
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
  }
  resize() {
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }
  dispose() { this.ro.disconnect(); }

  /* 底图：以 (cx,cy) 为中心、px 为每单位像素；返回本帧坐标换算 */
  begin(cx, cy, px, { fleet = true } = {}) {
    const { ctx, w, h } = this, sc = this.scene, c = (this.c = MAP[sc.dark ? "night" : "day"]);
    this.cx = cx; this.cy = cy; this.px = px;
    const X = (this.X = (x) => (x - cx) * px + w / 2), Y = (this.Y = (y) => (y - cy) * px + h / 2);
    const vx0 = cx - w / 2 / px - 60, vx1 = cx + w / 2 / px + 60, vy0 = cy - h / 2 / px - 60, vy1 = cy + h / 2 / px + 60;
    const inView = (this.inView = (x0, y0, x1, y1) => x1 > vx0 && x0 < vx1 && y1 > vy0 && y0 < vy1);
    const rect = (x0, y0, x1, y1, fill) => { if (!inView(x0, y0, x1, y1)) return; ctx.fillStyle = fill; ctx.fillRect(X(x0), Y(y0), (x1 - x0) * px, (y1 - y0) * px); };
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = c.land;
    ctx.fillRect(0, 0, w, h);
    rect(-4000, FENCE_Y, 4000, QUAY_Y, c.port);
    rect(-4000, QUAY_Y, 4000, 4000, c.sea);
    for (const b of cityBlocks) rect(b.x0, b.y0, b.x1, b.y1, b.row === 1 && b.col === 8 ? c.park : c.city);
    for (const b of yardBlocks) rect(b.x0 + 4, b.y0 + 4, b.x1 - 4, b.y1 - 4, c.yard);
    for (const o of this.buildings) rect(o.x0, o.y0, o.x1, o.y1, c.building);
    rect(SHIP.x0, SHIP.y0, SHIP.x1, SHIP.y1, c.ship);
    for (const pass of [0, 1]) {
      for (const e of this.roads) {
        const x0 = Math.min(e.a.x, e.b.x), x1 = Math.max(e.a.x, e.b.x), y0 = Math.min(e.a.y, e.b.y), y1 = Math.max(e.a.y, e.b.y);
        if (!inView(x0 - 30, y0 - 30, x1 + 30, y1 + 30)) continue;
        ctx.strokeStyle = pass ? c.road : c.casing;
        ctx.lineWidth = Math.max(1.5, e.spec.half * 2 * px * (e.spec.public ? 0.9 : 0.6)) + (pass ? 0 : 1.6);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(X(e.a.x), Y(e.a.y));
        ctx.lineTo(X(e.b.x), Y(e.b.y));
        ctx.stroke();
      }
    }
    if (fleet) {
      ctx.globalAlpha = 0.75;
      for (const o of sc.traffic.vehicles) {
        if (!inView(o.x, o.y, o.x, o.y)) continue;
        this.dot(o.x, o.y, 2.2, isTruck(o) ? c.truck : c.fleet);
      }
      ctx.globalAlpha = 1;
    }
    return this;
  }

  dot(x, y, r, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.X(x), this.Y(y), r, 0, Math.PI * 2);
    ctx.fill();
  }
  line(pts, width, color, dash) {
    const ctx = this.ctx;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(this.X(p.x), this.Y(p.y)) : ctx.moveTo(this.X(p.x), this.Y(p.y))));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.setLineDash(dash || []);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  pin(x, y, color, label) {
    const ctx = this.ctx, X = this.X(x), Y = this.Y(y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(X, Y - 10, 6, Math.PI, 0);
    ctx.lineTo(X, Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(X, Y - 10, 2.2, 0, Math.PI * 2);
    ctx.fill();
    if (label) this.label(X + 9, Y - 22, label);
  }
  label(X, Y, text, color) {
    const ctx = this.ctx;
    ctx.font = "600 11px system-ui, -apple-system, sans-serif";
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = this.c.labelBg;
    ctx.fillRect(X, Y, tw + 12, 18);
    ctx.fillStyle = color ?? this.c.label;
    ctx.fillText(text, X + 6, Y + 13);
  }
  /* 定位点：脉冲圈 + 朝向楔形 */
  marker(x, y, h, color, pulse) {
    const ctx = this.ctx, X = this.X(x), Y = this.Y(y);
    if (pulse != null) {
      ctx.strokeStyle = color;
      ctx.globalAlpha = (1 - pulse) * 0.5;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(X, Y, 7 + pulse * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(X, Y);
      ctx.arc(X, Y, 22, h - 0.45, h + 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(X, Y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(X, Y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
