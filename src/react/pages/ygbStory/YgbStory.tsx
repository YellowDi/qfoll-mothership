/**
 * [INPUT]: 依赖 visuals/ygbPort 的 mountYgbPort 港区引擎、./storyFigures 的实时配图与手机展台、hooks/useTypedPain、ThemeProvider 主题
 * [OUTPUT]: 对外提供 YgbStory：封面 (品牌标题/入口/目录) + 滚动驱动的六章杂志式介绍 (实色面板左右交替 + 同一港区世界的镜头飞行)，每章锚点 #network/#dispatch/#assurance/#dashboard/#governance/#download
 * [POS]: react/pages/ygbStory 的编排入口；章节文案与镜头落点集中在 CHAPTERS，STACKED 与 CSS 竖排查询同源，横排镜头随视口宽度等比缩放
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { mountYgbPort } from "../../../visuals/ygbPort";
import { useTypedPain } from "../../hooks/useTypedPain";
import { useTheme } from "../../providers/ThemeProvider";
import { DispatchFigure, FleetFigure, JourneyFigure, noteScroll, PhoneShowcase, TrackerFigure, UplinkFigure, type PortScene } from "./storyFigures";
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
  /* 页面锚点：封面目录据此跳转；#dashboard/#governance/#download 沿用原页面锚点 */
  anchor: string;
}

/*
 * 分镜：云柜宝的主角是社会集卡，港口只出现进港/出港节点。
 * 封面 (第 0 格) 占左侧开场，此后各章左右交替；镜头落在面板对侧，配图都订阅同一个场景实例，讲的是同一批车。
 */
const CHAPTERS: Chapter[] = [
  {
    side: "right", kicker: "CAPACITY NETWORK", label: "智能运力网络", title: ["在途车辆，", "实时可见"],
    desc: <>覆盖多区域的运力网络，结合实时、精准的 GPS 定位与轨迹可视化，<strong>持续追踪运输状态</strong>，帮助调度人员快速响应异常。</>,
    facts: [["注册司机", "9,600+"], ["优选线路", "1,200+"], ["定位方式", "GPS 实时"]],
    figure: (scene, active) => <TrackerFigure scene={scene} active={active} />, caption: ["图 01", "在途追踪 · 与背景同一辆集卡实时联动"], anchor: "network",
    cam: { s: 1.02, x: -150, y: 60, ax: 0.26, ay: 0.56 }, mobile: { s: 0.72, x: -150, y: -60, ax: 0.5, ay: 0.22 },
  },
  {
    side: "left", kicker: "SMART DISPATCH", label: "智能调度与高效履约", title: ["智能调度，", "高效履约"],
    desc: <>基于订单特征、司机状态与线路偏好进行智能匹配与动态调度，<strong>降低空驶率</strong>，提升运力利用率与整体运输时效。</>,
    stat: ["380,000+", "累计订单完成"], facts: [["订单特征匹配", "01"], ["司机状态与线路偏好", "02"], ["动态调度降低空驶", "03"]], numbered: true,
    figure: (scene, active) => <DispatchFigure scene={scene} active={active} />, caption: ["图 02", "智能派单 · 候选集卡按距离与空重实时打分"], anchor: "dispatch",
    cam: { s: 2.3, x: -505, y: -462, ax: 0.72, ay: 0.54 }, mobile: { s: 1.45, x: -505, y: -462, ax: 0.5, ay: 0.2 },
  },
  {
    side: "right", kicker: "END-TO-END ASSURANCE", label: "全链路物流保障体系", title: ["全链路节点，", "自动记录"],
    desc: <>从提箱、进港、交箱、出港到回单，关键节点<strong>到达即自动记录</strong>，形成完整运输回溯链路，支撑结算、监管与风控。</>,
    facts: [["关键节点", "5 个"], ["记录方式", "自动采集"], ["用途", "结算 · 监管 · 风控"]],
    figure: (scene, active) => <JourneyFigure scene={scene} active={active} />, caption: ["图 03", "运单链路 · 节点随集卡真实到达逐个点亮"], anchor: "assurance",
    cam: { s: 2.2, x: -360, y: -250, ax: 0.26, ay: 0.56 }, mobile: { s: 1.4, x: -360, y: -250, ax: 0.5, ay: 0.2 },
  },
  {
    side: "left", kicker: "OPERATIONS", label: "运输作业管理", title: ["订单统一管理，", "调度井然有序"],
    desc: <>管理端统一查看订单、车辆与司机，<strong>车辆状态实时汇总</strong>，进出闸口与时间节点自动留痕。</>,
    feats: [["业务状态实时更新", "货物流转在线即时查询"], ["专属管家服务", "一对一订单管理"], ["精确时间管理", "自动记录提箱、到场等节点"], ["消息及时通知", "多种推送机制及时触达"]],
    figure: (scene, active) => <FleetFigure scene={scene} active={active} />, caption: ["图 04", "车队看板 · 每辆集卡的状态由位置、速度与空重推断"], anchor: "dashboard",
    cam: { s: 1.9, x: -60, y: -470, ax: 0.72, ay: 0.55 }, mobile: { s: 1.3, x: -60, y: -470, ax: 0.5, ay: 0.2 },
  },
  {
    side: "right", kicker: "REGULATORY", label: "政府监管", title: ["对接政府系统，", "数据共享与监管"],
    desc: <>通过对接网络货运接口与政府部门共享数据，<strong>真实、准确、及时</strong>，按需提供运输、结算与安全数据支持。</>,
    checks: ["运输信息", "运费结算", "安全监控", "大数据分析"],
    figure: (scene, active) => <UplinkFigure scene={scene} active={active} />, caption: ["图 05", "监管上报 · 集卡运单、轨迹与进出港数据实时校验"], anchor: "governance",
    cam: { s: 1.6, x: 100, y: -770, ax: 0.26, ay: 0.62 }, mobile: { s: 1.05, x: 100, y: -770, ax: 0.5, ay: 0.24 },
  },
  {
    side: "left", kicker: "DOWNLOAD", label: "应用下载", title: ["下载云柜宝，", "全程在掌握"],
    desc: <>支持 iOS、Android 与微信小程序。司机端实时接单、反馈状态，管理端同步查看<strong>轨迹、回执与异常</strong>。</>,
    actions: true,
    figure: (_scene, active) => <PhoneShowcase active={active} />, caption: ["图 06", "司机端 · 自动轮播，可手动切换"], anchor: "download",
    cam: { s: 0.74, x: -260, y: -120, ax: 0.7, ay: 0.5 }, mobile: { s: 0.6, x: -260, y: -120, ax: 0.5, ay: 0.22 },
  },
];
/* 竖排布局判定：与 YgbStory.css 的竖排媒体查询逐字一致 */
const STACKED = "(max-width:760px),(max-width:1100px) and (max-aspect-ratio:1/1)";
/* 横排镜头按故事宽度等比放大：分镜在 1440–1680 宽度下调校，大屏上保持同样的取景比例 */
const fit = (cam: Camera, width: number): Camera => (cam ? { ...cam, s: cam.s * Math.min(1.5, Math.max(1, width / 1680)) } : cam);
/* 滚动格：第 0 格是封面，第 i+1 格是第 i 章；每格 110vh，外加 40vh 收尾；锚点落在每格滚动区间正中 */
const SLOTS = CHAPTERS.length + 1;
const SECTION_VH = SLOTS * 110 + 40;
/*
 * 吸顶区间 = 故事高度 − 舞台高度 (100svh − 顶栏)。iOS 滚动时地址栏伸缩会改变 innerHeight，
 * 章节判定与锚点都只用这条稳定的长度，否则章节边界会在手指下来回移动，镜头被反复打断。
 */
const anchorTop = (slot: number) => `calc((${SECTION_VH}vh - 100svh + 3.5rem) * ${((slot + 0.5) / SLOTS).toFixed(4)})`;
/* 回差：越过格边界 6% 才切换，避免停在边界附近时来回横跳 */
const HYSTERESIS = 0.06;
const COVER_CAM: Camera = { s: 0.8, x: -170, y: 30, ax: 0.72, ay: 0.52 };
const COVER_MOBILE: Camera = { s: 0.62, x: -200, y: -80, ax: 0.5, ay: 0.22 };
const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
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

/* ═══ 封面：品牌标题 + 打字机文案 + 入口 + 六章目录 (原 Hero 的职责) ═══ */
function Cover({ active }: { active: boolean }) {
  const pain = useTypedPain();
  let d = 0;
  const r = () => ({ "data-r": true, style: { "--d": d++ } as CSSProperties });
  return <article className="ys-panel ys-cover" data-side="left" data-active={active} aria-hidden={!active}>
    <div className="ys-folio" {...r()}><b>YUNGUIBAO</b><span>车货智能匹配 · 全球定位 · 实时预警</span></div>
    <h1 className="ys-cover-title" {...r()}><em>云柜宝</em><span>智能集卡物流平台</span></h1>
    <div className="ys-cover-sub" {...r()}>让运输管理更简单、更高效<br /><span style={{ whiteSpace: "nowrap" }}>物流运输管理再也不会<span className="ys-cover-pain">{pain}<i aria-hidden="true" /></span></span></div>
    <p className="ys-desc ys-cover-desc" {...r()}>云柜宝立足国际物流运输场景，融合物流网络与大数据技术，围绕车货匹配、在途监管、时间节点记录和异常预警，构建一体化运输管理能力。</p>
    <div className="ys-cover-actions" {...r()}>
      <button type="button" onClick={() => jump("download")}>下载 App<i className="ri-download-2-line" aria-hidden="true" /></button>
      <a href="https://www.ygbonline.com/admin/#/login" target="_blank" rel="noreferrer">管理后台<i className="ri-arrow-right-line" aria-hidden="true" /></a>
    </div>
    <nav className="ys-toc" aria-label="章节目录" {...r()}>
      <span className="ys-k">目录</span>
      {CHAPTERS.map((c, i) => <button key={c.anchor} type="button" onClick={() => jump(c.anchor)}><i>{pad2(i + 1)}</i><b>{c.label}</b><span>{c.title.join("")}</span></button>)}
    </nav>
  </article>;
}

export function YgbStory({ isDark }: { isDark?: boolean }) {
  const theme = useTheme();
  const dark = isDark ?? theme.isDark;
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const portRef = useRef<ReturnType<typeof mountYgbPort> | null>(null);
  const [scene, setScene] = useState<PortScene | null>(null);
  /* slot：0 为封面，i+1 为第 i 章 */
  const [slot, setSlot] = useState(0);
  const [stacked, setStacked] = useState(() => window.matchMedia(STACKED).matches);
  const darkRef = useRef(dark);
  darkRef.current = dark;
  const placed = useRef(false);

  /* 根元素吸附开关：只在故事挂载期间生效，离开页面即还原 */
  useEffect(() => {
    document.documentElement.classList.add("ys-snap-root");
    return () => document.documentElement.classList.remove("ys-snap-root");
  }, []);
  /*
   * 引擎延迟挂载：故事区进入前一屏才构建场景 (约 50ms 主线程)，并放到浏览器空闲时执行，
   * 不与 Hero 背景的首帧争抢；空闲回调不可用时退化为短延时。
   */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !canvasRef.current) return;
    let port: ReturnType<typeof mountYgbPort> | null = null, idle = 0, cancelled = false;
    const build = () => {
      if (cancelled || port || !canvasRef.current) return;
      port = mountYgbPort(canvasRef.current, { dark: darkRef.current });
      portRef.current = port;
      setScene(port.scene);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      io.disconnect();
      idle = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(build, { timeout: 600 }) : window.setTimeout(build, 120);
    }, { rootMargin: "100% 0px" });
    io.observe(section);
    return () => {
      cancelled = true;
      io.disconnect();
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      window.clearTimeout(idle);
      port?.dispose();
      portRef.current = null;
    };
  }, []);
  useEffect(() => portRef.current?.setTheme(dark), [dark]);
  /*
   * 滚动驱动：舞台三态定位 (before/pinned/after，直接写 DOM 属性不经 React) + 分镜切换。
   * 固定定位时舞台脱离文档流，横向位置与宽度由故事区实时同步 (侧栏展开收起也会触发)。
   */
  useEffect(() => {
    const el = sectionRef.current, stage = stageRef.current;
    if (!el || !stage) return;
    const syncBox = () => {
      const r = el.getBoundingClientRect();
      stage.style.setProperty("--ys-left", `${r.left}px`);
      stage.style.setProperty("--ys-width", `${r.width}px`);
    };
    const ro = new ResizeObserver(syncBox);
    ro.observe(el);
    syncBox();
    const onScroll = () => {
      noteScroll();
      const rect = el.getBoundingClientRect(), top = rect.top - 56, span = rect.height - stage.offsetHeight;
      const pin = top > 0 ? "before" : top < -span ? "after" : "pinned";
      if (stage.dataset.pin !== pin) stage.dataset.pin = pin;
      if (top > 2) return setSlot(0);
      const x = span > 0 ? Math.min(0.999, Math.max(0, -top / span)) * SLOTS : 0;
      setSlot((cur) => (x >= cur - HYSTERESIS && x < cur + 1 + HYSTERESIS ? cur : Math.floor(x)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  /* 旋转或改变窗口导致布局翻转时，镜头随之换到对应构图 */
  const [width, setWidth] = useState(() => window.innerWidth);
  const measure = () => sectionRef.current?.clientWidth || window.innerWidth;
  useEffect(() => {
    const query = window.matchMedia(STACKED), onChange = () => setStacked(query.matches);
    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => setWidth(measure()), 200); };
    query.addEventListener("change", onChange);
    window.addEventListener("resize", onResize);
    return () => {
      query.removeEventListener("change", onChange);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    const port = portRef.current;
    if (!port) return;
    const chapter = CHAPTERS[slot - 1];
    const cam = stacked ? (chapter ? chapter.mobile : COVER_MOBILE) : fit(chapter ? chapter.cam : COVER_CAM, measure());
    /* 场景刚挂载时直接就位 (例如经锚点跳入第 06 章)，之后的切换才飞行 */
    if (!placed.current) {
      placed.current = true;
      port.scene.setCamera(cam);
      return;
    }
    port.flyTo(cam, 1400);
  }, [slot, stacked, width, scene]);

  return <section ref={sectionRef} className="ys" style={{ height: `${SECTION_VH}vh` }} aria-label="云柜宝功能介绍">
    {/* 吸附点：封面在顶部，各章在滚动区间正中，末尾一个让出页脚；触屏上一次滑动最多走一格 */}
    <div className="ys-anchor ys-snap" style={{ top: 0 }} aria-hidden="true" />
    {CHAPTERS.map((chapter, i) => <div key={chapter.anchor} id={chapter.anchor} className="ys-anchor ys-snap" style={{ top: anchorTop(i + 1) }} aria-hidden="true" />)}
    <div className="ys-anchor ys-snap" style={{ top: "100%" }} aria-hidden="true" />
    <div ref={stageRef} className="ys-stage" data-pin="before">
      <canvas ref={canvasRef} aria-hidden="true" />
      <Cover active={slot === 0} />
      {CHAPTERS.map((chapter, i) => <Panel key={chapter.kicker} chapter={chapter} index={i} active={slot === i + 1} scene={scene} />)}
    </div>
  </section>;
}
