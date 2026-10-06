/**
 * [INPUT]: 依赖 data/waterEnvFeatures 的 waterEnvStory 叙事数据，依赖 public/water-env 的视频和首帧封面，依赖 ReactDotRippleBg 点阵涟漪与 useTextExclusions 避让采集
 * [OUTPUT]: 对外提供 ReactWaterEnvPage：居中视频 Hero (叠加鼠标点阵涟漪 + 首张大幅地图，视频高度实测延伸至首图中线) → 地图总览 → 闭环四步 → 核心能力陈列 → 八模块 → 收束标语
 * [POS]: 产品专题路由 /water-env 的 React 页面边界，负责 Hero 可见性播放、视频高度对齐首图与内容区编排；文案全部来自 waterEnvStory，页面不持有内容
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, type ReactNode } from "react";
import { waterEnvStory } from "../../data/waterEnvFeatures";
import { useTextExclusions } from "../hooks/useTextExclusions";
import { ReactDotRippleBg } from "./ReactDotRippleBg";
import "./ReactWaterEnvPage.css";

const { overview, loop, showcase, modules, closing } = waterEnvStory;
type Screen = { image: string; imageDark?: string };

export function ReactWaterEnvPage() {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const leadRef = useRef<HTMLElement>(null);
  const excludeRects = useTextExclusions(heroRef);

  // ---- 视频高度跟随首图：实测首图垂直中线写入 --water-hero-height，CSS 的 clamp 只作首帧兜底 ----
  useEffect(() => {
    const hero = heroRef.current;
    const lead = leadRef.current;
    if (!hero || !lead) return;

    const syncHeight = () => {
      const frame = lead.firstElementChild ?? lead;
      const heroTop = hero.getBoundingClientRect().top;
      const { top, height } = frame.getBoundingClientRect();
      hero.style.setProperty("--water-hero-height", `${Math.round(top - heroTop + height / 2)}px`);
    };
    const observer = new ResizeObserver(syncHeight);
    observer.observe(lead);
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const video = videoRef.current;
    if (!hero || !video) return;

    // ---- 可见性播放：离屏与后台暂停，回到 Hero 后继续循环 ----
    let inView = false;
    const syncPlayback = () => {
      if (inView && !document.hidden) void video.play().catch(() => undefined);
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      syncPlayback();
    });
    observer.observe(hero);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      video.pause();
    };
  }, []);

  return (
    <div className="water-page w-full">
      {/* 移动端顶栏 fixed 且布局不留位：pt-26 = 顶栏 pt-14 + 原留白 12，视频仍从 0 起铺到顶栏背后 */}
      <section ref={heroRef} className="react-water-hero relative flex flex-col items-center overflow-hidden pb-12 pt-26 md:py-20">
        <video
          ref={videoRef}
          className="react-water-hero-video"
          src="/water-env/floral_a.mp4"
          poster="/water-env/floral_a-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
        />
        {/* 涟漪层与视频同高 (--water-hero-height)，夹在视频与正文之间；底部页面背景渐变 (::after, z-1) 会自然把它盖掉 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[var(--water-hero-height)]" aria-hidden="true"><ReactDotRippleBg excludeRects={excludeRects} /></div>
        <div className="react-water-hero-content relative z-10 mx-auto w-full max-w-240 px-6">
          <div data-dot-avoid className="react-water-hero-kicker inline-flex items-center gap-2 rounded-full border border-zinc-300/50 bg-white/60 px-3 py-1 text-sm text-secondary dark:border-white/20 dark:bg-white/10 dark:text-on-dark">
            <i className="ri-drop-line text-sky-500" aria-hidden="true" />
            统一数据平台 · 动态预警 · 污染源追溯
          </div>
          <h1 data-dot-avoid className="react-water-hero-title mt-7 text-[clamp(3rem,7vw,6.5rem)] font-medium leading-[.98] tracking-[-0.06em]">
            <span className="text-sky-500">水环境</span>
            <br />
            智慧监控平台
          </h1>
          <p data-dot-avoid className="mx-auto mt-6 max-w-180 text-[clamp(1.15rem,2vw,1.8rem)] font-medium leading-tight">
            面向排水管网全生命周期管理的数字化监测与预警
          </p>
          <p data-dot-avoid className="mx-auto mt-4 max-w-160 text-sm leading-relaxed text-secondary md:text-base">
            以统一的数据体系连接分散的监测节点，让排水管网从「看不见」走向「可感知、可分析、可预警」。
          </p>
        </div>
        {/* 首张地图是 Hero 的收尾：页面背景渐变在它中段收束，整块标记为涟漪禁区 */}
        <figure ref={leadRef} id={overview.id} data-dot-block className="water-lead relative z-2 mx-auto mt-20 w-full max-w-360 px-6 md:px-14 lg:mt-28">
          <Shot screen={overview} alt="水环境监控平台站点地图" eager className="water-lead-frame" />
        </figure>
        <Overview />
      </section>

      <Loop />
      <Showcase />
      <Modules />
      <Closing />
    </div>
  );
}

/* ==================== 章节骨架：编号眉题 + 标题，五个章节共用 ==================== */
function SectionHead({ index, eyebrow, title, desc, center = false }: { index: string; eyebrow: string; title: ReactNode; desc?: string; center?: boolean }) {
  return (
    <header className={center ? "mx-auto max-w-200 text-center" : "max-w-200"}>
      <p className="water-eyebrow"><span className="text-sky-500">{index}</span> / {eyebrow}</p>
      <h2 className="mt-5 text-[clamp(2rem,3.6vw,3.5rem)] font-medium leading-[1.06] tracking-[-0.045em] text-balance">{title}</h2>
      {desc && <p className={`mt-5 max-w-160 text-[clamp(.9375rem,1.1vw,1.0625rem)] leading-[1.75] text-secondary ${center ? "mx-auto" : ""}`}>{desc}</p>}
    </header>
  );
}

function Shot({ screen, alt, eager = false, className = "" }: { screen: Screen; alt: string; eager?: boolean; className?: string }) {
  return (
    <div className={`water-shot ${className}`}>
      <img src={screen.image} alt={alt} className="block h-full w-full object-cover dark:hidden" loading={eager ? "eager" : "lazy"} />
      <img src={screen.imageDark || screen.image} alt={alt} className="hidden h-full w-full object-cover dark:block" loading="lazy" />
    </div>
  );
}

/* ---- 01 地图总览：标题与说明左右分栏，事实清单用细线分隔 ---- */
function Overview() {
  return (
    <div className="water-container relative z-2 mt-16 grid gap-10 md:mt-24 md:grid-cols-12 md:gap-14">
      <div className="md:col-span-5">
        <SectionHead index="01" eyebrow={overview.eyebrow} title={<>{overview.title[0]}<br />{overview.title[1]}</>} />
      </div>
      <div className="md:col-span-6 md:col-start-7 md:pt-11">
        <p className="text-[clamp(.9375rem,1.1vw,1.0625rem)] leading-[1.75] text-secondary">{overview.desc}</p>
        <dl className="mt-8">
          {overview.facts.map(([term, detail]) => (
            <div key={term} className="flex items-baseline justify-between gap-6 border-t border-edge py-4 text-sm last:border-b">
              <dt className="shrink-0 font-medium">{term}</dt>
              <dd className="text-right text-secondary">{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/* ---- 02 工作方式：四步沿一条横线推进，线上圆点标记节点 ---- */
function Loop() {
  return (
    <section id={loop.id} className="water-container water-section water-section--after-lead">
      <SectionHead index="02" eyebrow={loop.eyebrow} title={loop.title} desc={loop.desc} />
      <ol className="water-loop mt-14 grid gap-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-0">
        {loop.steps.map(([name, text], index) => (
          <li key={name} className="water-loop-step relative lg:pr-10">
            <span className="water-loop-dot" aria-hidden="true" />
            <p className="mt-7 font-mono text-xs tracking-[.08em] text-secondary">STEP {String(index + 1).padStart(2, "0")}</p>
            <h3 className="mt-2 text-2xl font-medium tracking-[-0.03em]">{name}</h3>
            <p className="mt-3 max-w-64 text-sm leading-[1.7] text-secondary">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---- 03 核心能力：三项能力依次陈列，桌面端文字吸顶陪截图滚过 ---- */
function Showcase() {
  return (
    <section id={showcase.id} className="water-container water-section">
      <SectionHead index="03" eyebrow={showcase.eyebrow} title={showcase.title} />
      <ol className="mt-12 flex flex-col gap-16 lg:mt-16 lg:gap-24">
        {showcase.items.map((item, index) => (
          <li key={item.id} id={item.id} className="grid gap-6 border-t border-edge pt-6 lg:grid-cols-12 lg:gap-14 lg:pt-8">
            <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
              <p className="font-mono text-xs text-sky-500">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-3 text-[clamp(1.375rem,2vw,1.75rem)] font-medium tracking-[-0.03em]">{item.label}</h3>
              <p className="mt-4 text-sm leading-[1.75] text-secondary md:text-[.9375rem]">{item.desc}</p>
            </div>
            <Shot screen={item} alt={item.label} className="lg:col-span-8" />
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---- 04 平台模块：发丝线网格，一格一个模块 ---- */
function Modules() {
  return (
    <section id={modules.id} className="water-container water-section">
      <SectionHead index="04" eyebrow={modules.eyebrow} title={modules.title} />
      <ul className="water-modules mt-12 grid grid-cols-2 lg:mt-16 lg:grid-cols-4">
        {modules.items.map(([name, text], index) => (
          <li key={name} className="flex min-h-40 flex-col justify-between gap-6 p-5 md:min-h-48 md:p-7">
            <span className="font-mono text-xs text-secondary">{String(index + 1).padStart(2, "0")}</span>
            <span>
              <span className="block text-lg font-medium tracking-[-0.02em]">{name}</span>
              <span className="mt-1.5 block text-sm leading-[1.6] text-secondary">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---- 收束：回到 Hero 的承诺，只留一句话 ---- */
function Closing() {
  return (
    <section className="water-container water-section pb-24 text-center md:pb-36">
      <h2 className="mx-auto max-w-240 text-[clamp(2.25rem,5vw,4.5rem)] font-medium leading-[1.04] tracking-[-0.05em] text-balance">
        {closing.title[0]}
        <br />
        <span className="text-sky-500">{closing.title[1]}</span>
      </h2>
    </section>
  );
}
