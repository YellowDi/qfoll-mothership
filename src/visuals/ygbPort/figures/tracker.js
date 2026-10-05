/**
 * [INPUT]: 依赖 ./mapView 的底图、./common 的位置语义/时钟/车牌、../roads 的 sample；订阅 PortScene 帧与 arrive/gate 事件
 * [OUTPUT]: 对外提供 mountTracker(canvas, scene, onInfo)：被追踪集卡的 GPS 地图 + 位置/时速/方向/剩余里程/固定终点/节点事件
 * [POS]: 杂志第 01 章"在途追踪"配图；与背景同一辆集卡，终点锚定在运单固定场站
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { sample } from "../roads";
import { MapView } from "./mapView";
import { clock, zoneOf } from "./common";

const DIRS = ["东", "东南", "南", "西南", "西", "西北", "北", "东北"];

export function mountTracker(canvas, scene, onInfo) {
  const map = new MapView(canvas, scene);
  const events = [];
  let cam = null, lastInfo = 0, zone = null;
  const log = (t, text) => {
    events.unshift({ time: clock(t), text });
    if (events.length > 3) events.length = 3;
  };
  const isMine = (e) => e.id === scene.traffic.vehicles.find((o) => o.tracked)?.id;
  const offs = [
    scene.on("arrive", (e) => isMine(e) && log(e.t, e.text)),
    scene.on("gate", (e) => isMine(e) && e.gate === "港区闸口" && log(e.t, e.dir === "进港" ? "进港 · 闸口核验放行" : "出港 · 闸口核验放行")),
  ];

  const draw = (sc) => {
    const v = sc.traffic.vehicles.find((o) => o.tracked);
    if (!v || !map.w) return;
    cam = cam ? { x: cam.x + (v.x - cam.x) * 0.12, y: cam.y + (v.y - cam.y) * 0.12 } : { x: v.x, y: v.y };
    /* 缩放随配图尺寸：大配图看得更近，小配图保留足够路网上下文 */
    map.begin(cam.x, cam.y, Math.max(0.3, Math.min(0.56, map.w / 1300)));
    const c = map.c, leg = sc.traffic.leg(v);
    /* 轨迹：上一终点至今实线，到固定终点的规划虚线 */
    const trail = (from, to) => {
      const pts = [], cur = { i: 0 };
      for (let d = from; d < to; d += 8) pts.push(sample(v.path, v.s + d, cur));
      pts.push(sample(v.path, v.s + to, cur));
      return pts;
    };
    const past = trail(-Math.min(leg ? leg.behind : 900, 1400), 0), ahead = trail(0, leg ? leg.ahead : 760);
    map.line(past, 5, c.halo);
    map.line(past, 3, c.accent);
    map.line(ahead, 2.4, c.accent, [6, 5]);
    const dest = leg ? leg.next : ahead[ahead.length - 1];
    map.pin(dest.x, dest.y, "#e5484d", leg?.next.label);
    map.marker(v.x, v.y, v.h, c.accent, (sc.traffic.time * 0.9) % 1);

    const z = zoneOf(v.x, v.y);
    if (zone && z !== zone && !(z === "港区闸口" || zone === "港区闸口")) log(sc.traffic.time, `驶入${z}`);
    zone = z;
    const now = performance.now();
    if (now - lastInfo > 220) {
      lastInfo = now;
      const deg = ((v.h * 180) / Math.PI + 360 + 22.5) % 360;
      onInfo({
        zone: z,
        speed: Math.round(v.v * 1.8),
        heading: DIRS[Math.floor(deg / 45) % 8],
        status: v.v < 0.6 ? (z === "港区闸口" ? "闸口核验中" : "停车等待") : "行驶中",
        time: clock(sc.traffic.time),
        dest: leg?.next.label ?? null,
        remain: leg ? ((leg.ahead * 0.5) / 1000).toFixed(2) : null,
        events: [...events],
      });
    }
  };
  const off = scene.subscribe(draw);
  return () => {
    off();
    offs.forEach((f) => f());
    map.dispose();
  };
}
