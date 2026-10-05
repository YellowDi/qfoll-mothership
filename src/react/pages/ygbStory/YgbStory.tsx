/**
 * [INPUT]: 依赖 visuals/ygbPort 的 mountYgbPort 港区引擎、./storyFigures 的实时配图与手机展台、ThemeProvider 主题
 * [OUTPUT]: 对外提供 YgbStory：滚动驱动的六章杂志式介绍 (实色面板左右交替 + 同一港区世界的镜头飞行)
 * [POS]: react/pages/ygbStory 的编排入口；章节文案与镜头落点集中在 CHAPTERS，STACKED 与 CSS 竖排查询同源，横排镜头随视口宽度等比缩放
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { mountYgbPort } from "../../../visuals/ygbPort";
import { useTheme } from "../../providers/ThemeProvider";
import { DispatchFigure, FleetFigure, JourneyFigure, PhoneShowcase, TrackerFigure, UplinkFigure, type PortScene } from "./storyFigures";
import "./YgbStory.css";

type Camera = { s: number; x: number; y: number; ax?: number; ay?: number } | null;
interface Chapter {
  side: "left" | "right";
  kicker: string;
  label: string;
  title: [string, string];
  desc: ReactNode;
  facts?: [string, string][];
  numbered?: boolean;
  stat?: [string, string];
  feats?: [string, string][];
  checks?: string[];
  actions?: boolean;
  figure: (scene: PortScene | null, active: boolean) => ReactNode;
  caption: [string, string];
  cam: Camera;
  mobile: Camera;
}

/*
 * 分镜：云柜宝的主角是社会集卡，港口只出现进港/出港节点。
 * 每章镜头落在面板对侧，配图都订阅同一个场景实例，讲的是同一批车。
 */
const CHAPTERS: Chapter[] = [
  {
    side: "left", kicker: "CAPACITY NETWORK", label: "智能运力网络", title: ["在途车辆，", "实时可见"],
    desc: <>覆盖多区域的运力网络，结合实时、精准的 GPS 定位与轨迹可视化，<strong>持续追踪运输状态</strong>，帮助调度人员快速响应异常。</>,
    facts: [["注册司机", "9,600+"], ["优选线路", "1,200+"], ["定位方式", "GPS 实时"]],
    figure: (scene) => <TrackerFigure scene={scene} />, caption: ["图 01", "在途追踪 · 与背景同一辆集卡实时联动"],
    cam: { s: 1.02, x: -150, y: 60, ax: 0.74, ay: 0.56 }, mobile: { s: 0.72, x: -150, y: -60, ax: 0.5, ay: 0.22 },
  },
  {
    side: "right", kicker: "SMART DISPATCH", label: "智能调度与高效履约", title: ["智能调度，", "高效履约"],
    desc: <>基于订单特征、司机状态与线路偏好进行智能匹配与动态调度，<strong>降低空驶率</strong>，提升运力利用率与整体运输时效。</>,
    stat: ["380,000+", "累计订单完成"], facts: [["订单特征匹配", "01"], ["司机状态与线路偏好", "02"], ["动态调度降低空驶", "03"]], numbered: true,
    figure: (scene) => <DispatchFigure scene={scene} />, caption: ["图 02", "智能派单 · 候选集卡按距离与空重实时打分"],
    cam: { s: 2.3, x: -505, y: -462, ax: 0.28, ay: 0.54 }, mobile: { s: 1.45, x: -505, y: -462, ax: 0.5, ay: 0.2 },
  },
  {
    side: "left", kicker: "END-TO-END ASSURANCE", label: "全链路物流保障体系", title: ["全链路节点，", "自动记录"],
    desc: <>从提箱、进港、交箱、出港到回单，关键节点<strong>到达即自动记录</strong>，形成完整运输回溯链路，支撑结算、监管与风控。</>,
    facts: [["关键节点", "5 个"], ["记录方式", "自动采集"], ["用途", "结算 · 监管 · 风控"]],
    figure: (scene) => <JourneyFigure scene={scene} />, caption: ["图 03", "运单链路 · 节点随集卡真实到达逐个点亮"],
    cam: { s: 2.2, x: -360, y: -250, ax: 0.74, ay: 0.56 }, mobile: { s: 1.4, x: -360, y: -250, ax: 0.5, ay: 0.2 },
  },
  {
    side: "right", kicker: "OPERATIONS", label: "运输作业管理", title: ["订单统一管理，", "调度井然有序"],
    desc: <>管理端统一查看订单、车辆与司机，<strong>车辆状态实时汇总</strong>，进出闸口与时间节点自动留痕。</>,
    feats: [["业务状态实时更新", "货物流转在线即时查询"], ["专属管家服务", "一对一订单管理"], ["精确时间管理", "自动记录提箱、到场等节点"], ["消息及时通知", "多种推送机制及时触达"]],
    figure: (scene) => <FleetFigure scene={scene} />, caption: ["图 04", "车队看板 · 每辆集卡的状态由位置、速度与空重推断"],
    cam: { s: 1.9, x: -60, y: -470, ax: 0.28, ay: 0.55 }, mobile: { s: 1.3, x: -60, y: -470, ax: 0.5, ay: 0.2 },
  },
  {
    side: "left", kicker: "REGULATORY", label: "政府监管", title: ["对接政府系统，", "数据共享与监管"],
    desc: <>通过对接网络货运接口与政府部门共享数据，<strong>真实、准确、及时</strong>，按需提供运输、结算与安全数据支持。</>,
    checks: ["运输信息", "运费结算", "安全监控", "大数据分析"],
    figure: (scene) => <UplinkFigure scene={scene} />, caption: ["图 05", "监管上报 · 集卡运单、轨迹与进出港数据实时校验"],
    cam: { s: 1.6, x: 100, y: -770, ax: 0.74, ay: 0.62 }, mobile: { s: 1.05, x: 100, y: -770, ax: 0.5, ay: 0.24 },
  },
  {
    side: "right", kicker: "DOWNLOAD", label: "应用下载", title: ["下载云柜宝，", "全程在掌握"],
    desc: <>支持 iOS、Android 与微信小程序。司机端实时接单、反馈状态，管理端同步查看<strong>轨迹、回执与异常</strong>。</>,
    actions: true,
    figure: (_scene, active) => <PhoneShowcase active={active} />, caption: ["图 06", "司机端 · 自动轮播，可手动切换"],
    cam: { s: 0.74, x: -260, y: -120, ax: 0.3, ay: 0.5 }, mobile: { s: 0.6, x: -260, y: -120, ax: 0.5, ay: 0.22 },
  },
];
/* 竖排布局判定：与 YgbStory.css 的竖排媒体查询逐字一致 */
const STACKED = "(max-width:760px),(max-width:1100px) and (max-aspect-ratio:1/1)";
/* 横排镜头按视口宽度等比放大：分镜在 1440–1680 宽度下调校，大屏上保持同样的取景比例 */
const fit = (cam: Camera): Camera => (cam ? { ...cam, s: cam.s * Math.min(1.5, Math.max(1, window.innerWidth / 1680)) } : cam);
const APK = "https://yunguibao-1321524436.cos.ap-shanghai.myqcloud.com/images/45c957800a8760898ce846ba89dc46ef.apk";
const pad2 = (n: number) => String(n).padStart(2, "0");

function Side({ chapter }: { chapter: Chapter }) {
  if (chapter.stat || chapter.facts) return <div className="ys-facts">
    {chapter.stat && <div className="ys-stat"><b>{chapter.stat[0]}</b><span>{chapter.stat[1]}</span></div>}
    {chapter.facts?.map(([k, v]) => <div key={k} className="ys-fact">{chapter.numbered ? <span><i>{v}</i>{k}</span> : <><span>{k}</span><b>{v}</b></>}</div>)}
  </div>;
  if (chapter.checks) return <ul className="ys-checks">{chapter.checks.map((t) => <li key={t}><i>✓</i>{t}</li>)}</ul>;
  if (chapter.actions) return <div className="ys-actions"><a href={APK} target="_blank" rel="noreferrer"><i className="ri-android-fill" aria-hidden="true" />下载云柜宝司机版</a><span>iOS 与 Android · 或搜索小程序「云柜宝」</span></div>;
  return <div />;
}

function Panel({ chapter, index, active, scene }: { chapter: Chapter; index: number; active: boolean; scene: PortScene | null }) {
  let d = 0;
  const r = () => ({ "data-r": true, style: { "--d": d++ } as CSSProperties });
  const n = pad2(index + 1);
  return <article className="ys-panel" data-side={chapter.side} data-active={active} aria-hidden={!active}>
    <div className="ys-folio" {...r()}><b>{chapter.kicker}</b><span>云柜宝 · {n} / {pad2(CHAPTERS.length)}</span></div>
    <div className="ys-head" {...r()}><div className="ys-num">{n[0]}<em>{n[1]}</em></div><h2 className="ys-title">{chapter.title[0]}<br />{chapter.title[1]}</h2></div>
    <div className="ys-body" {...r()}><p className="ys-desc"><strong>{chapter.label}</strong><br />{chapter.desc}</p><Side chapter={chapter} /></div>
    {chapter.feats && <div className="ys-feats" {...r()}>{chapter.feats.map(([t, x]) => <div key={t}><b>{t}</b><span>{x}</span></div>)}</div>}
    <figure className="ys-figure" {...r()}>{chapter.figure(scene, active)}<figcaption className="ys-cap"><b>{chapter.caption[0]}</b><span>{chapter.caption[1]}</span></figcaption></figure>
  </article>;
}

export function YgbStory({ isDark }: { isDark?: boolean }) {
  const theme = useTheme();
  const dark = isDark ?? theme.isDark;
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const portRef = useRef<ReturnType<typeof mountYgbPort> | null>(null);
  const [scene, setScene] = useState<PortScene | null>(null);
  const [active, setActive] = useState(-1);
  const [stacked, setStacked] = useState(() => window.matchMedia(STACKED).matches);

  useEffect(() => {
    if (!canvasRef.current) return;
    const port = mountYgbPort(canvasRef.current, { dark });
    portRef.current = port;
    setScene(port.scene);
    return () => {
      port.dispose();
      portRef.current = null;
    };
  }, []);
  useEffect(() => portRef.current?.setTheme(dark), [dark]);
  /* 舞台吸顶前不出面板；吸顶后按滚动进度切换分镜 */
  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect(), top = rect.top - 56, span = rect.height - window.innerHeight;
      if (top > 2) return setActive(-1);
      const p = span > 0 ? Math.min(0.999, Math.max(0, -top / span)) : 0;
      setActive(Math.floor(p * CHAPTERS.length));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  /* 旋转或改变窗口导致布局翻转时，镜头随之换到对应构图 */
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const query = window.matchMedia(STACKED), onChange = () => setStacked(query.matches);
    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => setWidth(window.innerWidth), 200); };
    query.addEventListener("change", onChange);
    window.addEventListener("resize", onResize);
    return () => {
      query.removeEventListener("change", onChange);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    const chapter = CHAPTERS[active];
    portRef.current?.flyTo(chapter ? (stacked ? chapter.mobile : fit(chapter.cam)) : null, chapter ? 1400 : 1000);
  }, [active, stacked, width]);

  return <section ref={sectionRef} className="ys" style={{ height: `${CHAPTERS.length * 110 + 40}vh` }} aria-label="云柜宝功能介绍">
    <div className="ys-stage">
      <canvas ref={canvasRef} aria-hidden="true" />
      {CHAPTERS.map((chapter, i) => <Panel key={chapter.kicker} chapter={chapter} index={i} active={i === active} scene={scene} />)}
    </div>
  </section>;
}
