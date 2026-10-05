/**
 * [INPUT]: 依赖 ./roads 的 routes/buildPath/sample/signalAt/network，./vehicles 的尺寸与绘制，./palette 的权重，./iso 的随机与色彩
 * [OUTPUT]: 对外提供 Traffic：车辆跟驰/信号停车/让行/道闸停靠/岸桥停靠仿真，信号灯与道闸动态物件，追踪车辆路线高亮
 * [POS]: visuals/ygbPort 的交通动力学；车辆位置按时间积分，路口排队与放行自然发生，不再是固定循环
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { alpha, rng } from "./iso";
import { CRANE_LANE_Y } from "./layout";
import { BOX_WEIGHTS, CAR_WEIGHTS, pick } from "./palette";
import { buildPath, network, routes, sample, signalAt, CRANE_LOOP } from "./roads";
import { VEHICLE, drawVehicle } from "./vehicles";

const DECEL = 9, LOOK = 80;
const ACCEL = { car: 8, van: 7, truck: 4.6, tractor: 5.5 };
const LIGHT = { g: "#45e08f", y: "#ffc04a", r: "#ff4f3f" };

export class Traffic {
  constructor(craneWork) {
    this.crane = craneWork;
    this.vehicles = [];
    this.barriers = new Map();
    this.time = 0;
    const R = rng(4242);
    this.R = R;
    for (const [name, route] of Object.entries(routes)) {
      const path = buildPath(route);
      route.path = path;
      if (name === "crane") {
        /* 岸桥车道起点与东端回车点：用于动态停靠点与离屏补箱 */
        path.laneStart = path.pts.find((p) => Math.abs(p.y - CRANE_LANE_Y) < 0.5 && p.x > CRANE_LOOP.west + 6).s;
        path.laneX = path.pts.find((p) => p.s === path.laneStart).x;
        path.resetS = path.pts.filter((p) => p.x > CRANE_LOOP.east - 2 && p.y < CRANE_LANE_Y - 20)[0].s;
      }
      route.fleet.forEach((type, i) => {
        const n = route.fleet.length;
        this.vehicles.push({
          id: this.vehicles.length, type, name, route, path, cursor: { i: 0 },
          s: (i / n) * path.length + R() * 30, v: 0, half: VEHICLE[type].half,
          factor: 0.86 + R() * 0.18,
          cargo: (type === "truck" || type === "tractor") && R() < 0.6 ? pick(R, BOX_WEIGHTS) : null,
          color: pick(R, CAR_WEIGHTS), cab: Math.floor(R() * 5),
          tracked: route.tracked === i, served: false, waited: 0, dwell: 0, cleared: null, occupying: null, visible: true,
        });
      });
    }
    for (const v of this.vehicles) if (v.name === "crane") v.cargo = null;
    this.place();
  }

  place() {
    for (const v of this.vehicles) {
      const p = sample(v.path, v.s, v.cursor);
      v.x = p.x; v.y = p.y; v.h = p.h; v.lim = p.lim;
    }
  }

  /* 岸桥停靠点：随整机平移实时变化 */
  craneStopS(path) {
    const cw = this.crane;
    return path.laneStart + (cw.dockX(VEHICLE.tractor.cargo) - path.laneX);
  }

  update(dt, live = true, isVisible) {
    this.time += dt;
    const t = this.time, vs = this.vehicles;
    for (const v of vs) {
      const L = v.path.length;
      let target = Math.min(v.lim, 46) * v.factor;
      /* 1. 停止点：信号、道闸、让行、岸桥 */
      for (const st of v.path.stops) {
        const ds = (st.s - v.s + L) % L;
        if (ds > LOOK + v.half) continue;
        const gap = ds - v.half - 1;
        let blocked = false;
        if (st.kind === "signal") {
          const light = signalAt(st.node, t, st.axis);
          blocked = light === "r" || (light === "y" && gap > 7);
        } else if (st.kind === "gate") {
          if (v.cleared !== st) {
            blocked = true;
            if (gap < 1.2 && v.v < 0.4) {
              v.dwell += dt;
              if (v.dwell > 1.8) { v.cleared = st; v.dwell = 0; }
            }
          }
        } else if (st.kind === "yield") {
          const n = st.node;
          if (n.occupant && n.occupant !== v && n.occupantAxis !== st.axis && v.waited < 6) {
            blocked = true;
            if (gap < 2 && v.v < 0.3) v.waited += dt;
          }
          if (gap < 0.5 && !blocked && v.occupying?.node !== n) {
            n.occupant = v;
            n.occupantAxis = st.axis;
            v.occupying = { node: n, exitS: st.exitS };
            v.waited = 0;
          }
        }
        if (blocked) target = Math.min(target, Math.sqrt(2 * DECEL * Math.max(0, gap)));
      }
      if (v.name === "crane" && !v.served) {
        const ds = (this.craneStopS(v.path) - v.s + L) % L;
        if (ds < LOOK) {
          target = Math.min(target, Math.sqrt(2 * DECEL * Math.max(0, ds - 0.3)));
          if (ds < 1 && v.v < 0.35 && !this.crane.docked) this.crane.docked = v;
        }
      }
      /* 2. 跟驰：前方同向车辆 */
      const cos = Math.cos(v.h), sin = Math.sin(v.h);
      for (const o of vs) {
        if (o === v) continue;
        const dx = o.x - v.x, dy = o.y - v.y, along = dx * cos + dy * sin;
        if (along <= 0 || along > 70) continue;
        if (Math.abs(-dx * sin + dy * cos) > 4.2) continue;
        if (Math.cos(o.h - v.h) < 0.25) continue;
        const gap = along - v.half - o.half - 3.5;
        target = Math.min(target, gap <= 0 ? 0 : Math.sqrt(o.v * o.v + 2 * DECEL * gap) * 0.92);
      }
      /* 3. 加减速 */
      const a = ACCEL[v.type] ?? 6;
      v.braking = target < v.v - 0.4 || (v.v < 0.4 && target < 0.5);
      v.v = v.v < target ? Math.min(target, v.v + a * dt) : Math.max(target, v.v - DECEL * 1.8 * dt);
      const before = v.s;
      v.s = (v.s + v.v * dt) % L;
      /* 4. 里程事件：越过停止点后清除放行标记，离开路口释放占用 */
      if (v.cleared && (v.s - v.cleared.s + L) % L < L / 2 && (v.s - v.cleared.s + L) % L > 2) v.cleared = null;
      if (v.occupying && (v.s - v.occupying.exitS + L) % L < L / 2) {
        if (v.occupying.node.occupant === v) v.occupying.node.occupant = null;
        v.occupying = null;
      }
      if (v.name === "crane" && crossed(before, v.s, v.path.resetS, L)) {
        v.served = false;
        v.cargo = this.crane.mode === "load" ? pick(this.R, BOX_WEIGHTS) : null;
      }
      const p = sample(v.path, v.s, v.cursor);
      v.x = p.x; v.y = p.y; v.h = p.h; v.lim = p.lim;
      /* 5. 离屏换箱：画面外的集卡更换箱色/空重状态，车流不重复 */
      if (live && isVisible && v.name !== "crane" && (v.type === "truck" || v.type === "tractor")) {
        const vis = isVisible(v.x, v.y);
        if (!vis && v.visible) v.cargo = this.R() < 0.7 ? pick(this.R, BOX_WEIGHTS) : null;
        v.visible = vis;
      }
    }
    this.updateBarriers(dt);
  }

  /* ─── 道闸：车辆核验停稳后抬杆，驶离后落杆 ─── */
  updateBarriers(dt) {
    for (const v of this.vehicles) {
      for (const st of v.path.stops) {
        if (st.kind !== "gate") continue;
        const key = `${st.node.k}|${st.dir}|${st.lane}`;
        let b = this.barriers.get(key);
        if (!b) {
          const [dx, dy] = st.dir.split(",").map(Number);
          b = { node: st.node, dx, dy, lane: st.lane, open: 0, want: 0 };
          this.barriers.set(key, b);
        }
        const L = v.path.length, ds = (st.s - v.s + L) % L, past = (v.s - st.s + L) % L;
        if ((v.cleared === st && ds < 20) || past < v.half * 2 + 6 || (v.dwell > 0.9 && ds < 20)) b.want = 1;
      }
    }
    for (const b of this.barriers.values()) {
      b.open += (b.want - b.open) * Math.min(1, dt * 3.2);
      b.want = 0;
    }
  }

  /* ─── 动态物件：车辆、信号灯、道闸，交给场景按深度排序 ─── */
  items(c, dark, colors, iso) {
    const out = [];
    for (const v of this.vehicles) {
      if (!iso.visible(v.x, v.y, 60)) continue;
      out.push({ kind: "vehicle", depth: v.x + v.y, y: v.y, draw: (ctx) => drawVehicle(ctx, iso, c, colors, v, dark) });
    }
    for (const b of this.barriers.values()) {
      const n = b.node, rx = -b.dy, ry = b.dx;
      const px = n.x - b.dx * 7 + rx * (b.lane + 5), py = n.y - b.dy * 7 + ry * (b.lane + 5);
      if (!iso.visible(px, py, 40)) continue;
      out.push({
        kind: "barrier", depth: px + py, y: py, px, py,
        draw: (ctx) => {
          const ang = b.open * 1.35, len = 10.5, ex = px - rx * len * Math.cos(ang), ey = py - ry * len * Math.cos(ang), ez = 5 + len * Math.sin(ang);
          iso.box(ctx, px - 1, py - 1, 0, 2, 2, 5.6, c.white, { side: c.orange });
          iso.line(ctx, [[px, py, 5], [ex, ey, ez]], "#f3efe6", 0.75);
          iso.line(ctx, [[px, py, 5], [ex, ey, ez]], "#d1503c", 0.75, [1.6, 1.6]);
        },
      });
    }
    for (const n of network.nodes.values()) {
      if (!n.signal || !iso.visible(n.x, n.y, 80)) continue;
      for (const e of n.edges) {
        const other = e.a === n ? e.b : e.a, dx = Math.sign(other.x - n.x), dy = Math.sign(other.y - n.y);
        let h = 0;
        for (const f of n.edges) if (f.horizontal !== (dy === 0)) h = Math.max(h, f.spec.half);
        const rx = dy, ry = -dx, half = e.spec.half;
        const px = n.x + dx * (h + 11) + rx * (half + 3), py = n.y + dy * (h + 11) + ry * (half + 3);
        const axis = dy === 0 ? "x" : "y";
        out.push({
          kind: "signal", depth: px + py, y: py, px, py,
          draw: (ctx) => {
            const state = signalAt(n, this.time, axis), arm = half * 0.7, ax = px - rx * arm, ay = py - ry * arm;
            iso.line(ctx, [[px, py, 0], [px, py, 17]], dark ? "#7d969b" : "#6f858b", 0.9);
            iso.line(ctx, [[px, py, 16.5], [ax, ay, 16.5]], dark ? "#7d969b" : "#6f858b", 0.7);
            iso.box(ctx, ax - 0.9, ay - 0.9, 13.6, 1.8, 1.8, 3.4, "#2b383e");
            const z = state === "r" ? 16.2 : state === "y" ? 15.1 : 14;
            iso.dot(ctx, ax + 0.95, ay + 0.95, z, 0.55, LIGHT[state]);
            iso.glow(ctx, ax + 0.95, ay + 0.95, z, dark ? 7 : 3.5, LIGHT[state], dark ? 0.55 : 0.4, 1);
          },
        });
      }
    }
    return out;
  }

  /* ─── 追踪车辆：云柜宝 GPS 在途监管的视觉隐喻，前方路线 + 定位脉冲 ─── */
  drawTracking(ctx, iso, dark) {
    const v = this.vehicles.find((o) => o.tracked);
    if (!v) return;
    const pts = [], cursor = { i: 0 };
    for (let d = 0; d < 320; d += 6) {
      const p = sample(v.path, v.s + d, cursor);
      pts.push([p.x, p.y, 0.4]);
    }
    const col = dark ? "#f6a565" : "#dc8744";
    iso.line(ctx, pts, alpha(col, dark ? 0.22 : 0.2), 3.2);
    iso.line(ctx, pts, alpha(col, dark ? 0.75 : 0.85), 0.9, [5, 6]);
    const end = pts[pts.length - 1];
    iso.dot(ctx, end[0], end[1], 0.5, 1.6, alpha(col, 0.9));
    const pulse = (this.time * 0.8) % 1;
    ctx.save();
    ctx.translate(iso.X(v.x, v.y), iso.Y(v.x, v.y));
    ctx.scale(1, 0.5);
    ctx.strokeStyle = alpha(col, (1 - pulse) * 0.8);
    ctx.lineWidth = 1.2 * iso.s;
    ctx.beginPath();
    ctx.arc(0, 0, (8 + pulse * 22) * iso.s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

const crossed = (a, b, mark, L) => {
  const d = (b - a + L) % L;
  return (mark - a + L) % L <= d && d < L / 2;
};
