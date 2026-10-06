/**
 * [INPUT]: 依赖 ./layout 的道路坐标常量
 * [OUTPUT]: 对外提供 network (节点/路段/信号/让行/闸口)、routes 车辆线路 (含追踪运单的固定终点 waypoints)、buildPath 车道级路径、sample 路径采样、signalAt 信号相位、CRANE_LOOP/TRUCK_PARK 场站坐标
 * [POS]: visuals/ygbPort 的交通拓扑；ground 依它画路面与标线，traffic 依它跑车，二者同源不漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import {
  AISLES, AISLE_HALF, BACK_ROAD, CRANE_LANE_Y, GATE, MAIN_ROAD, PERIMETER, STREET_HALF,
  STREET_X, STREET_Y, CITY_TOP, WORLD_X, YARD_LANES, YARD_LANE_HALF,
} from "./layout";

/* ════════════════════════════════════════════════════════════════════
 * 路段规格：half 为半幅宽，lanes 为行车方向右侧的车道中心偏移
 * ════════════════════════════════════════════════════════════════════ */
const SPEC = {
  arterial: { kind: "arterial", half: MAIN_ROAD.half, lanes: [7.5, 16.5], speed: 44, public: true },
  street: { kind: "street", half: STREET_HALF, lanes: [6], speed: 32, public: true },
  gate: { kind: "gate", half: GATE.half, lanes: [6.5, 19.5], speed: 20, public: true },
  yard: { kind: "yard", half: YARD_LANE_HALF, lanes: [6], speed: 24 },
  aisle: { kind: "yard", half: AISLE_HALF, lanes: [6], speed: 22 },
  back: { kind: "yard", half: BACK_ROAD.half, lanes: [6], speed: 26 },
  apron: { kind: "apron", half: 6, lanes: [0], speed: 18, oneway: true },
  transfer: { kind: "apron", half: 7, lanes: [0], speed: 14, oneway: true },
  drive: { kind: "lot", half: 8, lanes: [4], speed: 12 },
};

const roads = [];
const road = (a, b, spec) => roads.push({ a, b, spec });

/* 疏港主干道 + 城市方格网 */
road([WORLD_X[0], MAIN_ROAD.y], [WORLD_X[1], MAIN_ROAD.y], SPEC.arterial);
for (const x of STREET_X) road([x, MAIN_ROAD.y], [x, CITY_TOP], SPEC.street);
for (const y of STREET_Y) road([WORLD_X[0], y], [WORLD_X[1], y], SPEC.street);
/* 闸口道路连接主干道与港内环路 */
road([GATE.x, MAIN_ROAD.y], [GATE.x, PERIMETER.y], SPEC.gate);
/* 港内：环路、堆场车道、纵向过道、码头后方道路 */
road([WORLD_X[0], PERIMETER.y], [WORLD_X[1], PERIMETER.y], SPEC.yard);
for (const y of YARD_LANES) road([AISLES[0], y], [AISLES[AISLES.length - 1], y], SPEC.yard);
for (const x of AISLES) road([x, PERIMETER.y], [x, BACK_ROAD.y], SPEC.aisle);
road([WORLD_X[0], BACK_ROAD.y], [WORLD_X[1], BACK_ROAD.y], SPEC.back);
/* 岸桥作业车道：单向，自西向东穿过所有岸桥门腿之间 */
export const CRANE_LOOP = { west: -540, east: 760 };
road([CRANE_LOOP.west, BACK_ROAD.y], [CRANE_LOOP.west, CRANE_LANE_Y], SPEC.transfer);
road([CRANE_LOOP.west, CRANE_LANE_Y], [CRANE_LOOP.east, CRANE_LANE_Y], SPEC.apron);
road([CRANE_LOOP.east, CRANE_LANE_Y], [CRANE_LOOP.east, BACK_ROAD.y], SPEC.transfer);
/* 集卡停车场：主干道右进 → 场内通道 → 东侧街道右出 */
export const TRUCK_PARK = { entryX: -560, aisleY: -470, exitX: -392, gateY: -352 };
road([TRUCK_PARK.entryX, MAIN_ROAD.y], [TRUCK_PARK.entryX, TRUCK_PARK.aisleY], SPEC.drive);
road([TRUCK_PARK.entryX, TRUCK_PARK.aisleY], [STREET_X[6], TRUCK_PARK.aisleY], SPEC.drive);

/* ════════════════════════════════════════════════════════════════════
 * 拓扑构建：轴对齐路段相交/相接处自动打断成节点
 * ════════════════════════════════════════════════════════════════════ */
const key = (x, y) => `${x},${y}`;
const nodes = new Map();
const edges = new Map();
const nodeAt = (x, y) => {
  const k = key(x, y);
  if (!nodes.has(k)) nodes.set(k, { k, x, y, edges: [], signal: false, yield: false, phase: 0 });
  return nodes.get(k);
};
for (const r of roads) {
  const horizontal = r.a[1] === r.b[1];
  const lo = horizontal ? Math.min(r.a[0], r.b[0]) : Math.min(r.a[1], r.b[1]);
  const hi = horizontal ? Math.max(r.a[0], r.b[0]) : Math.max(r.a[1], r.b[1]);
  const fixed = horizontal ? r.a[1] : r.a[0];
  const cuts = new Set([lo, hi]);
  for (const o of roads) {
    if (o === r || (o.a[1] === o.b[1]) === horizontal) continue;
    const of = horizontal ? o.a[0] : o.a[1];
    const olo = horizontal ? Math.min(o.a[1], o.b[1]) : Math.min(o.a[0], o.b[0]);
    const ohi = horizontal ? Math.max(o.a[1], o.b[1]) : Math.max(o.a[0], o.b[0]);
    if (of >= lo && of <= hi && fixed >= olo && fixed <= ohi) cuts.add(of);
  }
  const sorted = [...cuts].sort((p, q) => p - q);
  const forward = horizontal ? r.b[0] > r.a[0] : r.b[1] > r.a[1];
  for (let i = 0; i < sorted.length - 1; i++) {
    const p = horizontal ? [sorted[i], fixed] : [fixed, sorted[i]];
    const q = horizontal ? [sorted[i + 1], fixed] : [fixed, sorted[i + 1]];
    const [a, b] = forward ? [p, q] : [q, p];
    const na = nodeAt(a[0], a[1]), nb = nodeAt(b[0], b[1]);
    const edge = { a: na, b: nb, spec: r.spec, horizontal };
    edges.set(`${na.k}|${nb.k}`, edge);
    edges.set(`${nb.k}|${na.k}`, edge);
    na.edges.push(edge);
    nb.edges.push(edge);
  }
}
/* 信号与让行：公共道路三岔以上设灯，港内交叉与场站出入口让行 */
for (const n of nodes.values()) {
  if (n.edges.length < 3) continue;
  const allPublic = n.edges.every((e) => e.spec.public);
  if (allPublic) {
    n.signal = true;
    n.phase = ((n.x * 0.021 + n.y * 0.013) % 32 + 32) % 32;
  } else n.yield = true;
}
/* 闸口/停车场道闸：在既有路段中插入节点，车辆在栏杆前停靠核验 */
function insertNode(x, y) {
  for (const e of new Set(edges.values())) {
    const lo = e.horizontal ? Math.min(e.a.x, e.b.x) : Math.min(e.a.y, e.b.y), hi = e.horizontal ? Math.max(e.a.x, e.b.x) : Math.max(e.a.y, e.b.y);
    const on = e.horizontal ? e.a.y === y && x > lo && x < hi : e.a.x === x && y > lo && y < hi;
    if (!on) continue;
    const mid = nodeAt(x, y);
    edges.delete(`${e.a.k}|${e.b.k}`);
    edges.delete(`${e.b.k}|${e.a.k}`);
    e.a.edges = e.a.edges.filter((o) => o !== e);
    e.b.edges = e.b.edges.filter((o) => o !== e);
    for (const [a, b] of [[e.a, mid], [mid, e.b]]) {
      const part = { a, b, spec: e.spec, horizontal: e.horizontal };
      edges.set(`${a.k}|${b.k}`, part);
      edges.set(`${b.k}|${a.k}`, part);
      a.edges.push(part);
      b.edges.push(part);
    }
    return mid;
  }
  throw new Error(`no edge at ${x},${y}`);
}
const gates = [insertNode(GATE.x, GATE.y), insertNode(TRUCK_PARK.entryX, TRUCK_PARK.gateY), insertNode(TRUCK_PARK.exitX, TRUCK_PARK.aisleY)];
for (const g of gates) g.gate = true;

export const network = { nodes, edges };

/* 信号相位：32s 周期，x 向与 y 向交替放行，含黄灯与全红清空 */
const SIGNAL_CYCLE = 32;
export function signalAt(node, t, axis) {
  const p = ((t + node.phase) % SIGNAL_CYCLE + SIGNAL_CYCLE) % SIGNAL_CYCLE;
  if (axis === "x") return p < 13 ? "g" : p < 15.5 ? "y" : "r";
  return p >= 16 && p < 29 ? "g" : p >= 29 && p < 31.5 ? "y" : "r";
}

/* ════════════════════════════════════════════════════════════════════
 * 线路：节点闭环；车辆只在车道中心线上行驶，转弯走路缘半径弧线
 * ════════════════════════════════════════════════════════════════════ */
const [X960, X660, X360, X60, X240, X540, X840] = [STREET_X[4], STREET_X[5], STREET_X[6], STREET_X[7], STREET_X[8], STREET_X[9], STREET_X[10]];
const [Y620, Y920, Y1220] = STREET_Y;
const M = MAIN_ROAD.y, P = PERIMETER.y;
export const routes = {
  /* 主干道东行 + 城区北环 (左转环) */
  cityEast: { nodes: [[X960, M], [X540, M], [X540, Y620], [X960, Y620]], prefer: 0, fleet: ["car", "truck", "car", "van", "car", "truck"] },
  /* 主干道西行 + 城区右转环 */
  cityWest: { nodes: [[X840, M], [X660, M], [X660, Y620], [X840, Y620]], prefer: 1, fleet: ["truck", "car", "car", "truck", "van", "car"] },
  /* 城区内环 */
  cityInner: { nodes: [[X60, Y620], [X60, Y1220], [X540, Y1220], [X540, Y620]], prefer: 0, fleet: ["car", "car", "van", "car"] },
  /* 外集卡：城区 → 闸口进港 → 堆场 → 闸口出港 → 城区 */
  gateTrucks: {
    nodes: [[X660, Y620], [X660, M], [X360, M], [GATE.x, GATE.y], [X360, P], [AISLES[5], P], [AISLES[5], YARD_LANES[1]], [AISLES[4], YARD_LANES[1]], [AISLES[4], P], [GATE.x, GATE.y], [X360, M], [X360, Y620]],
    prefer: 0, fleet: ["truck", "truck", "truck", "truck"], tracked: 0,
    /* 运单固定终点：去程到堆场交箱，回程到物流园提箱；追踪路线只画到下一个终点 */
    waypoints: [{ role: "drop", at: [-220, YARD_LANES[1]], label: "堆场交箱点", arrive: "抵达堆场 · 交箱" }, { role: "pickup", at: [-500, Y620], label: "物流园提箱点", arrive: "抵达物流园 · 提箱" }],
  },
  /* 停车场集卡：主干道右进、场内通道、东侧街道右出 */
  truckPark: {
    nodes: [[TRUCK_PARK.entryX, M], [TRUCK_PARK.entryX, TRUCK_PARK.aisleY], [X360, TRUCK_PARK.aisleY], [X360, M]],
    prefer: 1, fleet: ["truck", "truck"],
  },
  /* 岸桥作业环：后方道路西行 → 下穿过渡道 → 岸桥车道东行 */
  crane: { nodes: [[CRANE_LOOP.west, BACK_ROAD.y], [CRANE_LOOP.west, CRANE_LANE_Y], [CRANE_LOOP.east, CRANE_LANE_Y], [CRANE_LOOP.east, BACK_ROAD.y]], prefer: 0, fleet: ["tractor", "tractor", "tractor", "tractor", "tractor"] },
  /* 堆场水平运输 */
  yardA: { nodes: [[AISLES[3], YARD_LANES[0]], [AISLES[6], YARD_LANES[0]], [AISLES[6], YARD_LANES[3]], [AISLES[3], YARD_LANES[3]]], prefer: 0, fleet: ["tractor", "tractor"] },
  yardB: { nodes: [[AISLES[8], YARD_LANES[2]], [AISLES[5], YARD_LANES[2]], [AISLES[5], YARD_LANES[0]], [AISLES[8], YARD_LANES[0]]], prefer: 0, fleet: ["tractor", "tractor"] },
};
nodes.get(key(X360, TRUCK_PARK.aisleY)).yield = true;

/* ════════════════════════════════════════════════════════════════════
 * 路径构建：车道偏移 + 路口弧线 + 停止线/闸口/让行点
 * ════════════════════════════════════════════════════════════════════ */
const STEP = 3;
const unit = (a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
  return { x: dx / l, y: dy / l };
};
const right = (d) => ({ x: -d.y, y: d.x });
const turnOf = (din, dout) => {
  const dot = din.x * dout.x + din.y * dout.y;
  if (dot > 0.9) return "straight";
  if (dot < -0.9) return "u";
  return din.x * dout.y - din.y * dout.x > 0 ? "right" : "left";
};
const perpHalf = (node, d) => {
  let h = 0;
  for (const e of node.edges) if (e.horizontal !== (d.y === 0)) h = Math.max(h, e.spec.half);
  return h;
};
const laneOffset = (edge, turn, prefer) => {
  const lanes = edge.spec.lanes;
  if (lanes.length === 1) return lanes[0];
  if (turn === "right") return lanes[lanes.length - 1];
  if (turn === "left" || turn === "u") return lanes[0];
  return lanes[Math.min(prefer, lanes.length - 1)];
};

export function buildPath(route) {
  const list = route.nodes.map(([x, y]) => nodes.get(key(x, y)));
  const n = list.length;
  /* 展开中间节点：线路只列转折点，直行经过的节点在此补齐 */
  const seq = [];
  for (let i = 0; i < n; i++) {
    const a = list[i], b = list[(i + 1) % n];
    seq.push(a);
    const d = unit(a, b);
    let cur = a;
    for (;;) {
      const next = cur.edges.map((e) => (e.a === cur ? e.b : e.a)).find((m) => {
        const dm = unit(cur, m);
        return dm.x * d.x + dm.y * d.y > 0.99 && (m === b || (m.x - cur.x) * (b.x - m.x) + (m.y - cur.y) * (b.y - m.y) > 0);
      });
      if (!next || next === b) break;
      seq.push(next);
      cur = next;
    }
  }
  const m = seq.length;
  const info = seq.map((node, i) => {
    const prev = seq[(i - 1 + m) % m], next = seq[(i + 1) % m];
    const din = unit(prev, node), dout = unit(node, next);
    const turn = turnOf(din, dout);
    const ein = edges.get(`${prev.k}|${node.k}`), eout = edges.get(`${node.k}|${next.k}`);
    let rin = 0, rout = 0;
    if (turn === "straight") rin = rout = perpHalf(node, din) ? perpHalf(node, din) + 3 : 0;
    else if (turn !== "u") {
      rin = eout.spec.half + 3;
      rout = ein.spec.half + 3;
    }
    return { node, din, dout, turn, ein, eout, rin, rout };
  });
  /* 每段起止车道：起点继承上个路口转向，终点服从下个路口转向 */
  for (let i = 0; i < m; i++) {
    const cur = info[i], nxt = info[(i + 1) % m];
    cur.oStart = laneOffset(cur.eout, cur.turn, route.prefer);
    cur.oEnd = laneOffset(cur.eout, nxt.turn, route.prefer);
    nxt.oIn = cur.oEnd;
  }
  const pts = [], stops = [];
  const push = (x, y, lim) => pts.push({ x, y, lim });
  for (let i = 0; i < m; i++) {
    const c = info[i], nx = info[(i + 1) % m], node = c.node;
    const rIn = right(c.din), rOut = right(c.dout);
    const E = { x: node.x - c.din.x * c.rin + rIn.x * c.oIn, y: node.y - c.din.y * c.rin + rIn.y * c.oIn };
    const X = { x: node.x + c.dout.x * c.rout + rOut.x * c.oStart, y: node.y + c.dout.y * c.rout + rOut.y * c.oStart };
    c.entryIndex = pts.length;
    if (c.turn === "straight") push(E.x, E.y, c.ein.spec.speed);
    else if (c.turn === "u") {
      const w = (c.oIn + c.oStart) * 0.9;
      for (let j = 0; j <= 14; j++) {
        const t = j / 14, u = 1 - t;
        const p0 = E, p1 = { x: E.x + c.din.x * w, y: E.y + c.din.y * w }, p2 = { x: X.x - c.dout.x * w, y: X.y - c.dout.y * w }, p3 = X;
        push(u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y, 7);
      }
    } else {
      const C = c.din.x !== 0 ? { x: X.x, y: E.y } : { x: E.x, y: X.y };
      const lim = c.turn === "right" ? 10 : 13;
      for (let j = 0; j <= 12; j++) {
        const t = j / 12, u = 1 - t;
        push(u * u * E.x + 2 * u * t * C.x + t * t * X.x, u * u * E.y + 2 * u * t * C.y + t * t * X.y, lim);
      }
    }
    c.exitIndex = pts.length - 1;
    /* 路段：沿 dout 前进，中段平滑换道 */
    const nNode = nx.node;
    const startC = { x: node.x + c.dout.x * c.rout, y: node.y + c.dout.y * c.rout };
    const endC = { x: nNode.x - c.dout.x * nx.rin, y: nNode.y - c.dout.y * nx.rin };
    const L = Math.hypot(endC.x - startC.x, endC.y - startC.y);
    const steps = Math.max(1, Math.floor(L / STEP));
    for (let j = 1; j < steps; j++) {
      const t = j / steps, k = Math.min(1, Math.max(0, (t - 0.3) / 0.4)), o = c.oStart + (c.oEnd - c.oStart) * k * k * (3 - 2 * k);
      push(startC.x + (endC.x - startC.x) * t + rOut.x * o, startC.y + (endC.y - startC.y) * t + rOut.y * o, c.eout.spec.speed);
    }
  }
  /* 累计里程与朝向 */
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    p.s = s;
    p.h = Math.atan2(q.y - p.y, q.x - p.x);
    s += Math.hypot(q.x - p.x, q.y - p.y);
  }
  const length = s;
  /* 限速前瞻：入弯前按 8u/s² 提前减速 */
  for (let pass = 0; pass < 2; pass++) {
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i], q = pts[(i + 1) % pts.length], ds = (q.s - p.s + length) % length;
      p.lim = Math.min(p.lim, Math.sqrt(q.lim * q.lim + 2 * 8 * ds));
    }
  }
  /* 停止点：信号停止线、闸口栏杆、港内让行线 */
  for (let i = 0; i < m; i++) {
    const c = info[i], node = c.node, entryS = pts[c.entryIndex].s, exitS = pts[c.exitIndex].s;
    if (node.signal) {
      const D = perpHalf(node, c.din) + 12;
      stops.push({ kind: "signal", s: entryS - (D - c.rin), node, axis: c.din.y === 0 ? "x" : "y" });
    } else if (node.gate) {
      stops.push({ kind: "gate", s: entryS - 7, node, dir: `${c.din.x},${c.din.y}`, lane: c.oIn });
    } else if (node.yield) {
      stops.push({ kind: "yield", s: entryS - Math.max(0, perpHalf(node, c.din) + 4 - c.rin), node, exitS: exitS + 4, axis: c.din.y === 0 ? "x" : "y" });
    }
  }
  for (const st of stops) st.s = ((st.s % length) + length) % length;
  stops.sort((a, b) => a.s - b.s);
  return { pts, length, stops, info };
}

/* 路径采样：游标单调前进，避免每帧线性扫描 */
export function sample(path, s, cursor = { i: 0 }) {
  const pts = path.pts, L = path.length;
  s = ((s % L) + L) % L;
  let i = cursor.i;
  if (pts[i].s > s) i = 0;
  while (i < pts.length - 1 && pts[i + 1].s <= s) i++;
  cursor.i = i;
  const a = pts[i], b = pts[(i + 1) % pts.length];
  const seg = ((b.s - a.s + L) % L) || 1, t = (s - a.s) / seg;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, h: a.h + angleDelta(a.h, b.h) * t, lim: a.lim + (b.lim - a.lim) * t };
}
const angleDelta = (a, b) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};
