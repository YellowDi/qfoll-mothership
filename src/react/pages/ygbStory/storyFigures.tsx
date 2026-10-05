/**
 * [INPUT]: 依赖 visuals/ygbPort 的 mountTracker/mountDispatch/mountJourney/mountFleet/mountUplink 与 FLEET_STATES，云柜宝司机端截图
 * [OUTPUT]: 对外提供 TrackerFigure/DispatchFigure/JourneyFigure/FleetFigure/UplinkFigure 五个实时配图与 PhoneShowcase 手机展台
 * [POS]: react/pages/ygbStory 的配图层；状态全部来自同一港区世界里的社会集卡，组件只负责排版呈现
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FLEET_STATES, mountDispatch, mountFleet, mountJourney, mountTracker, mountUplink, type mountYgbPort } from "../../../visuals/ygbPort";
import app01 from "../../../assets/ygb-assets/app-01-m.webp";
import app02 from "../../../assets/ygb-assets/app-02-m.webp";
import app03 from "../../../assets/ygb-assets/app-03-m.webp";
import app04 from "../../../assets/ygb-assets/app-04-m.webp";
import app05 from "../../../assets/ygb-assets/app-05-m.webp";

export type PortScene = ReturnType<typeof mountYgbPort>["scene"];
type Mount<T> = (scene: PortScene, onState: (state: T) => void) => () => void;
type CanvasMount<T> = (canvas: HTMLCanvasElement, scene: PortScene, onState: (state: T) => void) => () => void;

/* 订阅一个配图状态源；场景就绪后挂载，卸载时清理 */
function useFigure<T>(scene: PortScene | null, mount: Mount<T>) {
  const [state, setState] = useState<T | null>(null);
  useEffect(() => (scene ? mount(scene, setState) : undefined), [scene, mount]);
  return state;
}
function useCanvasFigure<T>(scene: PortScene | null, mount: CanvasMount<T>) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<T | null>(null);
  useEffect(() => (scene && ref.current ? mount(ref.current, scene, setState) : undefined), [scene, mount]);
  return [ref, state] as const;
}
const cssVar = (name: string, value: string) => ({ [name]: value }) as CSSProperties;

/* ═══ 01 在途追踪 ═══ */
interface TrackInfo { zone: string; speed: number; heading: string; status: string; time: string; dest: string | null; remain: string | null; events: { time: string; text: string }[] }
export function TrackerFigure({ scene }: { scene: PortScene | null }) {
  const [ref, info] = useCanvasFigure<TrackInfo>(scene, mountTracker);
  const cell = (k: string, v?: string | null) => <div><span className="ys-k">{k}</span><b className="ys-v">{v ?? "—"}</b></div>;
  return <div className="ys-frame ys-trk">
    <div className="ys-trk-bar"><span>运单 <b className="ys-mono">YS3280 4238 0235</b>{info?.dest && <em> → {info.dest}</em>}</span><span className="ys-chip" data-on={info?.status === "行驶中"}>{info?.status ?? "定位中"}{info && ` · ${info.time}`}</span></div>
    <div className="ys-trk-cells">{cell("位置", info?.zone)}{cell("时速", info && `${info.speed} 公里/小时`)}{cell("方向", info?.heading)}{cell("剩余", info?.remain && `${info.remain} 公里`)}</div>
    <div className="ys-trk-body"><canvas ref={ref} className="ys-map" aria-hidden="true" />
      {!!info?.events.length && <ol className="ys-card ys-log">{info.events.map((e) => <li key={e.time + e.text}><time>{e.time}</time>{e.text}</li>)}</ol>}
    </div>
  </div>;
}

/* ═══ 02 智能派单 ═══ */
interface DispatchInfo { no: string; box: string; origin: string; dest: string; phase: string; eta: number; candidates: { plate: string; status: string; km: string; score: number; chosen: boolean }[] }
export function DispatchFigure({ scene }: { scene: PortScene | null }) {
  const [ref, info] = useCanvasFigure<DispatchInfo>(scene, mountDispatch);
  const assigned = info?.phase === "已派单";
  return <div className="ys-frame"><canvas ref={ref} className="ys-map" aria-hidden="true" />
    {info && <div className="ys-card ys-order">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><b className="ys-mono">{info.no}</b><span className="ys-chip" data-on={assigned}>{info.phase}</span></div>
      <div className="ys-order-route">{info.box} · {info.origin} → {info.dest}</div>
      {assigned && <div style={{ marginTop: 6, fontWeight: 600, color: "var(--ys-accent)" }}>预计 {info.eta} 分钟到场</div>}
    </div>}
    {info && <div className="ys-card ys-cands">{info.candidates.map((c) => <div key={c.plate} className="ys-cand" data-chosen={c.chosen} data-dim={assigned && !c.chosen}>
      <b className="ys-mono">{c.plate}</b><span className="ys-k" style={{ marginTop: 0 }}>{c.status}</span><span className="ys-mono">{c.km} km</span>
      <div className="ys-score"><i style={{ width: `${c.score}%` }} /></div><span className="ys-cand-tag">{c.chosen ? "派单" : c.score ? `${c.score}` : ""}</span>
    </div>)}</div>}
  </div>;
}

/* ═══ 03 运单全链路 ═══ */
interface JourneyNode { label: string; place: string; time: string | null; done: boolean; eta: string | null }
interface JourneyInfo { no: string; plate: string; progress: number; stage: number; nodes: JourneyNode[]; next: { label: string; place: string; km: string }; speed: number; zone: string; moving: boolean; history: { no: string; span: string }[]; speeds: number[]; log: { time: string; text: string }[] }
/* 车速轨迹：0–80 km/h 映射到固定高度的折线与面积 */
function Spark({ values }: { values: number[] }) {
  const n = Math.max(2, values.length), pts = values.map((v, i) => `${(i / (n - 1)) * 100},${40 - Math.min(80, v) / 2}`);
  return <svg className="ys-spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
    <polyline points={`0,40 ${pts.join(" ")} 100,40`} fill="rgb(249 115 22 / .12)" stroke="none" />
    <polyline points={pts.join(" ")} fill="none" stroke="#f97316" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
  </svg>;
}
export function JourneyFigure({ scene }: { scene: PortScene | null }) {
  const info = useFigure<JourneyInfo>(scene, mountJourney);
  if (!info) return <div className="ys-frame" />;
  const pct = (info.progress / 4) * 100;
  return <div className="ys-frame ys-jny">
    <div className="ys-jny-top"><span>运单 <b className="ys-mono">{info.no}</b> · <span className="ys-mono">{info.plate}</span></span><span className="ys-chip" data-on={info.moving}>{info.moving ? `行驶中 · ${info.speed} km/h` : `停车 · ${info.zone}`}</span></div>
    <div className="ys-track"><div className="ys-track-fill" style={{ width: `${pct}%` }} />
      {info.nodes.map((n, i) => <span key={n.label} className="ys-node" style={{ left: `${i * 25}%` }} data-done={n.done || i <= info.stage} data-next={i === info.stage + 1} />)}
      <span className="ys-truck" style={{ left: `${pct}%` }}>{info.plate}</span>
    </div>
    <div className="ys-nodes">{info.nodes.map((n) => <div key={n.label}><b>{n.label}</b><span>{n.place}</span><time data-eta={!n.time && !!n.eta}>{n.time ?? (n.eta ? `预计 ${n.eta}` : "—")}</time></div>)}</div>
    <div className="ys-jny-mid">
      <div><span className="ys-k">节点记录 · 自动采集</span><ol className="ys-jlog">{info.log.length ? info.log.map((l) => <li key={l.time + l.text}><time>{l.time}</time>{l.text}</li>) : <li><time>—</time>等待下一个节点</li>}</ol></div>
      <div className="ys-speed"><span className="ys-k">实时车速</span><b className="ys-mono">{info.speed}<small> km/h</small></b><Spark values={info.speeds} /></div>
    </div>
    <div className="ys-next">
      <div className="ys-next-big"><small>下一节点</small>{info.next.label}</div>
      <div className="ys-desc" style={{ fontSize: 12, lineHeight: 1.6 }}>{info.next.place}<br />剩余 <b className="ys-mono">{info.next.km}</b> 公里 · 节点到达自动记录</div>
      <div className="ys-receipts">{info.history.length ? info.history.map((h) => <span key={h.no} className="ys-receipt"><span className="ys-mono">{h.no} · {h.span}</span><i>已回单</i></span>) : <span className="ys-receipt">本单完成后生成电子回单</span>}</div>
    </div>
  </div>;
}

/* ═══ 04 车队看板 ═══ */
const FLEET_COLORS: Record<string, string> = { 重车在途: "#f97316", 空车在途: "#3b82f6", 排队进港: "#eab308", 港区作业: "#0ea5e9", 月台装卸: "#a855f7", 路口等待: "#94a3b8", 停车场待命: "#22c55e" };
interface FleetInfo { total: number; busy: number; rate: number; counts: Record<string, number>; rows: { id: number; plate: string; state: string; zone: string; speed: number; box: string }[] }
export function FleetFigure({ scene }: { scene: PortScene | null }) {
  const info = useFigure<FleetInfo>(scene, mountFleet);
  if (!info) return <div className="ys-frame" />;
  return <div className="ys-frame ys-fleet">
    <div className="ys-kpis"><div><b>{info.total}</b><span>在线集卡</span></div><div><b>{info.busy}</b><span>运行中</span></div><div><b>{info.rate}%</b><span>运力利用率</span></div></div>
    <div className="ys-bar">{(FLEET_STATES as string[]).map((k) => <i key={k} style={{ flexGrow: info.counts[k] || 0.001, background: FLEET_COLORS[k] }} />)}</div>
    <div className="ys-legend">{(FLEET_STATES as string[]).map((k) => <span key={k} style={cssVar("--c", FLEET_COLORS[k])}>{k} {info.counts[k]}</span>)}</div>
    <div className="ys-rows">{info.rows.map((r) => <div key={r.id} className="ys-row" style={cssVar("--c", FLEET_COLORS[r.state])}>
      <b className="ys-mono">{r.plate}</b><span className="ys-row-state">{r.state}</span><span className="ys-muted">{r.zone}</span><span className="ys-mono ys-muted">{r.speed} km/h</span><span className="ys-muted">{r.box}</span>
    </div>)}</div>
  </div>;
}

/* ═══ 05 监管上报 ═══ */
const KIND_COLORS: Record<string, string> = { 运单: "#3b82f6", 轨迹: "#8b5cf6", 进出港: "#f97316", 结算: "#16a34a" };
interface UplinkInfo { total: number; latency: string; packets: { id: number; kind: string; p: number }[]; rows: { id: number; time: string; kind: string; ref: string; detail: string; sig: string; ok: boolean }[] }
export function UplinkFigure({ scene }: { scene: PortScene | null }) {
  const info = useFigure<UplinkInfo>(scene, mountUplink);
  if (!info) return <div className="ys-frame" />;
  return <div className="ys-frame ys-up">
    <div className="ys-link">
      <div className="ys-endpoint"><b>云柜宝平台</b><span>运单 · 轨迹 · 结算</span></div>
      <div className="ys-wire">{info.packets.map((p) => <span key={p.id} className="ys-packet" style={{ left: `${p.p * 100}%`, ...cssVar("--c", KIND_COLORS[p.kind]) }}>{p.kind}</span>)}</div>
      <div className="ys-endpoint" data-gov="true"><b>网络货运监测平台</b><span>交通运输主管部门</span></div>
    </div>
    <div className="ys-upstats"><div><b className="ys-mono">{info.total.toLocaleString()}</b><span>累计上报记录</span></div><div><b>100%</b><span>数据校验通过</span></div><div><b className="ys-mono">{info.latency}s</b><span>平均上报时延</span></div></div>
    <div className="ys-recs">{info.rows.map((r) => <div key={r.id} className="ys-rec" style={cssVar("--c", KIND_COLORS[r.kind])}>
      <span className="ys-mono">{r.time}</span><span className="ys-kind">{r.kind}</span><b className="ys-mono">{r.ref}</b><span className="ys-muted" style={{ color: "var(--ys-muted)" }}>{r.detail}</span><span className="ys-sig">SIG {r.sig}</span><span className="ys-ok" data-pending={!r.ok}>{r.ok ? "✓ 已校验" : "上报中…"}</span>
    </div>)}</div>
  </div>;
}

/* ═══ 06 手机展台：单机主视觉 + 屏幕目录 + 品牌色块 ═══ */
const SCREENS = [
  { src: app01, title: "司机端首页", desc: "接单、进度与消息总览" },
  { src: app02, title: "在途任务", desc: "关键节点与轨迹可视化" },
  { src: app03, title: "异常处理", desc: "上报、回传与处理闭环" },
  { src: app04, title: "回执签收", desc: "电子回单与签收上传" },
  { src: app05, title: "运单详情", desc: "多维字段与状态同步" },
];
const SHOW_MS = 3600;
export function PhoneShowcase({ active }: { active: boolean }) {
  const [on, setOn] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (!active || hold || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setOn((v) => (v + 1) % SCREENS.length), SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [active, hold, on]);
  const next = SCREENS[(on + 1) % SCREENS.length];
  return <div className="ys-frame ys-show" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
    <div className="ys-show-list">
      <div className="ys-show-kicker"><b>{String(SCREENS.length).padStart(2, "0")}</b><span>司机端核心界面</span></div>
      <div className="ys-show-items">{SCREENS.map((s, i) => <button key={s.title} type="button" className="ys-show-item" data-on={i === on} onClick={() => setOn(i)} style={cssVar("--dur", `${SHOW_MS}ms`)}>
        <i>{String(i + 1).padStart(2, "0")}</i><b>{s.title}</b><span>{s.desc}</span><span className="ys-show-prog"><i /></span>
      </button>)}</div>
    </div>
    <div className="ys-show-stage">
      <div className="ys-show-corner" key={on}><span className="ys-show-index" data-swap>{String(on + 1).padStart(2, "0")}</span><b data-swap>{SCREENS[on].title}</b><span className="ys-show-desc" data-swap>{SCREENS[on].desc}</span></div>
      <div className="ys-phone-ghost" aria-hidden="true"><img src={next.src} alt="" loading="lazy" decoding="async" /></div>
      <div className="ys-phone"><div className="ys-phone-body">{SCREENS.map((s, i) => <img key={s.title} src={s.src} alt={i === on ? s.title : ""} data-on={i === on} loading="lazy" decoding="async" />)}</div></div>
    </div>
  </div>;
}
