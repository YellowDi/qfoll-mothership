/**
 * [INPUT]: 依赖 ./common 的时钟/车牌；订阅 PortScene 帧与 gate/arrive 事件
 * [OUTPUT]: 对外提供 mountUplink(scene, onState)：集卡运单/轨迹/进出港/结算数据向监测平台上报的数据包与校验记录；UplinkInfo 载荷类型
 * [POS]: 杂志第 05 章"政府监管"配图的状态源；每条记录都来自世界里真实发生的集卡事件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { PortScene } from "../scene";
import { clock, plateOf } from "./common";

interface UplinkRecord {
  id: number;
  /* 记录产生时的交通时钟，据此计算数据包在途进度 */
  born: number;
  time: string;
  kind: string;
  ref: string;
  detail: string;
  sig: string;
}

export interface UplinkInfo {
  total: number;
  latency: string;
  packets: { id: number; kind: string; p: number }[];
  rows: Array<UplinkRecord & { ok: boolean }>;
}

const FLIGHT = 1.4;

export function mountUplink(scene: PortScene, onState: (state: UplinkInfo) => void): () => void {
  const records: UplinkRecord[] = [];
  let serial = 0, lastTrack = scene.traffic.time, last = 0;
  const hash = (n: number) => ((n * 2654435761) >>> 0).toString(16).padStart(8, "0").slice(0, 8).toUpperCase();
  const push = (t: number, kind: string, ref: string, detail: string) => {
    serial++;
    records.unshift({ id: serial, born: t, time: clock(t), kind, ref, detail, sig: hash(serial + 977) });
    if (records.length > 24) records.length = 24;
  };
  const offs = [
    scene.on("gate", (e) => {
      if (e.gate === "港区闸口") push(e.t, "进出港", e.plate, `${e.dir} · ${e.cargo == null ? "空车" : "重车"}`);
      else push(e.t, "运单", e.plate, `停车场${e.dir}`);
    }),
    scene.on("arrive", (e) => {
      push(e.t, "运单", e.plate, e.text);
      if (e.role === "pickup") push(e.t + 0.2, "结算", e.plate, "运费结算 · 回单确认");
    }),
  ];
  const off = scene.subscribe((sc) => {
    const t = sc.traffic.time;
    /* 追踪集卡的 GPS 轨迹点按固定频率批量上报 */
    if (t - lastTrack > 3.2) {
      lastTrack = t;
      const v = sc.traffic.vehicles.find((o) => o.tracked);
      if (v) push(t, "轨迹", plateOf(v.id), `GPS ×8 · ${Math.round(v.v * 1.8)} km/h`);
    }
    const now = performance.now();
    if (now - last < 90) return;
    last = now;
    const packets = records.filter((r) => t - r.born < FLIGHT).map((r) => ({ id: r.id, kind: r.kind, p: (t - r.born) / FLIGHT }));
    onState({
      total: 12860 + serial,
      latency: (0.6 + ((serial * 37) % 30) / 100).toFixed(2),
      packets,
      rows: records.slice(0, 12).map((r) => ({ ...r, ok: t - r.born >= FLIGHT })),
    });
  });
  return () => {
    off();
    offs.forEach((f) => f());
  };
}
