/**
 * [INPUT]: 依赖 ./common 的集卡判定/停车场范围/停放集卡/车牌/位置语义、../layout 的闸口与港界；订阅 PortScene 帧
 * [OUTPUT]: 对外提供 mountFleet(scene, onState)：全部社会集卡的实时状态分布、关键指标与车辆列表
 * [POS]: 杂志第 04 章"运输作业管理"配图的状态源；状态由每辆集卡的真实位置、速度与空重推断
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { FENCE_Y, GATE } from "../layout";
import { inTruckPark, isTruck, parkedTrucks, plateOf, zoneOf } from "./common";

export const FLEET_STATES = ["重车在途", "空车在途", "排队进港", "港区作业", "月台装卸", "路口等待", "停车场待命"];
const BOX = ["40HQ", "20GP", "40GP", "40RF", "20GP", "40HQ", "45HQ", "20TK"];

function stateOf(v) {
  if (v.parked) return v.where === "park" ? "停车场待命" : v.where === "dock" ? "月台装卸" : "港区作业";
  if (inTruckPark(v.x, v.y)) return "停车场待命";
  if (v.y > FENCE_Y) return "港区作业";
  if (Math.abs(v.x - GATE.x) < 50 && v.y > -345 && v.v < 2.5) return "排队进港";
  if (v.v < 0.6) return "路口等待";
  return v.cargo == null ? "空车在途" : "重车在途";
}

export function mountFleet(scene, onState) {
  let last = 0;
  const off = scene.subscribe((sc) => {
    const now = performance.now();
    if (now - last < 450) return;
    last = now;
    const all = [...sc.traffic.vehicles.filter(isTruck), ...parkedTrucks(sc)];
    const counts = Object.fromEntries(FLEET_STATES.map((k) => [k, 0]));
    const rows = all.map((v) => {
      const state = stateOf(v);
      counts[state]++;
      return { id: v.id, plate: plateOf(v.id), state, zone: v.parked ? { park: "集卡停车场", dock: "物流园月台", port: "港区 CFS" }[v.where] : zoneOf(v.x, v.y), speed: Math.round((v.v || 0) * 1.8), box: v.cargo == null ? "空车" : BOX[v.cargo % BOX.length], moving: !v.parked };
    });
    /* 列表：行驶中的车在前，待命车在后，同状态按车牌稳定排序 */
    rows.sort((a, b) => Number(b.moving) - Number(a.moving) || FLEET_STATES.indexOf(a.state) - FLEET_STATES.indexOf(b.state) || a.plate.localeCompare(b.plate));
    const busy = all.length - counts["停车场待命"];
    onState({ total: all.length, busy, rate: Math.round((busy / all.length) * 100), counts, rows: rows.slice(0, 7) });
  });
  return off;
}
