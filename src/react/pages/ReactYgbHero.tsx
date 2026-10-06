/**
 * [INPUT]: 依赖原云柜宝 Hero 资源、默认共享港区背景或注入背景、hooks/useTypedPain 打字机文案与 React 生命周期
 * [OUTPUT]: 对外提供 ReactYgbHero，供专题页和首页预览共用
 * [POS]: 原 YgbHeroSection 的 React 适配；当前用于首页云柜宝预览与调试页，/ygb 专题已由 ygbStory 封面取代
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ReactYgbPortBackground } from "./ReactYgbPortBackground";
import { useTypedPain } from "../hooks/useTypedPain";
import "./ReactYgbHero.css";
import hero01Image from "../../assets/ygb-assets/hero-01.webp";
import hero02Image from "../../assets/ygb-assets/hero-02.webp";
import hero03Image from "../../assets/ygb-assets/hero-03.webp";

const heroCards = [
  {
    badge: "全流程可视化管理",
    title: "智能系统追踪，实时掌控业务状态",
    desc: "实时、精准的车辆 GPS 定位，确保运输透明可控。用户可查询货物流转，系统自动记录关键节点，实时定位车辆，并智能校正数据，提升运营效率。",
    image: hero01Image,
  },
  {
    badge: "数据驱动智能调度",
    title: "智能调度，高效匹配",
    desc: "云柜宝小程序通过强大的数据分析能力，结合集卡车辆定位信息，实现科学的车货匹配，优化运输路径，从而有效降低空载率，提高运输效率。",
    image: hero02Image,
  },
  {
    badge: "运输安全与责任保障体系",
    title: "全链路物流保障，构建更完善的物流生态",
    desc: "云柜宝不仅专注于运输环节的优化，同时提供港口与堆场的协同延伸服务和提供全程物流责任险，最大限度保障货物安全，为客户提供更加安心的服务体验。",
    image: hero03Image,
  },
];


const HERO_AUTO_PLAY_INTERVAL_MS = 4200;
const HERO_AUTO_PLAY_START_DELAY_MS = 360;

function useHeroCarousel(homePreview: boolean) {
  const stackRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<number | null>(null);
  const autoPlayDelayRef = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const clearAutoPlay = () => {
    if (autoPlayRef.current !== null) window.clearInterval(autoPlayRef.current);
    autoPlayRef.current = null;
  };
  const clearAutoPlayDelay = () => {
    if (autoPlayDelayRef.current !== null) window.clearTimeout(autoPlayDelayRef.current);
    autoPlayDelayRef.current = null;
  };
  const canAutoPlay = () => !homePreview && !hovered && inView && visible && !reducedMotion;
  const startAutoPlay = (immediate = false) => {
    clearAutoPlay();
    clearAutoPlayDelay();
    if (!canAutoPlay()) return;
    const startInterval = () => {
      autoPlayRef.current = window.setInterval(() => {
        setActive((value) => (value + 1) % heroCards.length);
      }, HERO_AUTO_PLAY_INTERVAL_MS);
    };
    if (immediate) {
      startInterval();
      return;
    }
    autoPlayDelayRef.current = window.setTimeout(() => {
      autoPlayDelayRef.current = null;
      if (canAutoPlay()) startInterval();
    }, HERO_AUTO_PLAY_START_DELAY_MS);
  };
  useEffect(() => {
    const node = stackRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), { threshold: .25, rootMargin: "0px 0px -10% 0px" });
    const onVisibility = () => setVisible(!document.hidden);
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onReducedMotionChange = () => setReducedMotion(reducedMotionQuery.matches);
    observer.observe(node);
    document.addEventListener("visibilitychange", onVisibility);
    reducedMotionQuery.addEventListener("change", onReducedMotionChange);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
      clearAutoPlay();
      clearAutoPlayDelay();
    };
  }, []);
  useEffect(() => {
    startAutoPlay();
    return () => {
      clearAutoPlay();
      clearAutoPlayDelay();
    };
  }, [homePreview, hovered, inView, visible, reducedMotion]);
  const select = (index: number) => {
    setActive(index);
    startAutoPlay(true);
  };
  const shift = (step: number) => {
    setActive((value) => (value + step + heroCards.length) % heroCards.length);
    startAutoPlay(true);
  };
  return { stackRef, active, select, shift, setHovered };
}

function heroPosition(index: number, active: number) {
  const offset = (index - active + heroCards.length) % heroCards.length;
  if (offset === 0) return "z-30 opacity-100 translate-y-[6.1rem] scale-100 md:translate-y-[7.8rem]";
  if (offset === 1) return "z-20 opacity-95 translate-y-[4.2rem] scale-[0.86] md:translate-y-[5.25rem] md:scale-[0.88]";
  return "z-10 opacity-85 translate-y-[2.45rem] scale-[0.74] md:translate-y-[3.1rem] md:scale-[0.76]";
}

export function ReactYgbHero({ homePreview = false, background }: { homePreview?: boolean; background?: ReactNode }) {
  const pain = useTypedPain();
  const { stackRef, active, select, shift, setHovered } = useHeroCarousel(homePreview);
  return <section className="w-full">
    <div className={`relative overflow-hidden bg-bg/95 select-none dark:bg-zinc-900/90 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${homePreview ? "rounded-md border border-edge p-8 max-md:p-5" : "border-0 rounded-none"}`}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.96]">{background ?? <ReactYgbPortBackground />}</div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(246,245,244,0.08),rgba(246,245,244,0.02)_40%,rgba(246,245,244,0.08)_100%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015)_40%,rgba(255,255,255,0.03)_100%)]" />
      <div className="pointer-events-none absolute inset-0 mask-[radial-gradient(88%_80%_at_15%_12%,#000_0%,rgba(0,0,0,0.92)_34%,rgba(0,0,0,0.56)_58%,rgba(0,0,0,0.2)_74%,transparent_92%)] bg-[radial-gradient(112%_92%_at_14%_8%,rgba(246,245,244,0.88)_0%,rgba(246,245,244,0.62)_34%,rgba(246,245,244,0.24)_62%,rgba(246,245,244,0)_90%)] dark:bg-[radial-gradient(112%_92%_at_14%_8%,rgba(18,18,22,0.92)_0%,rgba(18,18,22,0.72)_34%,rgba(18,18,22,0.34)_62%,rgba(18,18,22,0)_90%)]" />
      {!homePreview && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-bg to-transparent dark:from-bg" />}
      <div className={homePreview ? "w-full" : "relative mx-auto w-full max-w-360 px-14 pt-8 pb-10 max-lg:px-6 max-md:px-5 max-md:pt-5 max-md:pb-8"}>
        <div className="relative z-10 grid w-full min-w-0 max-w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:items-end">
          <div className={`relative z-20 w-full min-w-0 max-w-full ${homePreview ? "" : "lg:self-start"}`}>
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-edge bg-surface/90 px-3 py-1 text-sm text-secondary"><i className="ri-shining-line text-sm" aria-hidden="true" />车货智能匹配 · 全球定位 · 实时预警</div>
            <p className="mt-5 text-[clamp(2rem,3.4vw,3.6rem)] leading-[1.08] tracking-[-0.03em] font-medium text-orange-400">云柜宝</p>
            <h1 className="mt-1 whitespace-nowrap text-[clamp(2rem,3.4vw,3.6rem)] leading-[1.08] tracking-[-0.03em] font-medium text-primary">智能集卡物流平台</h1>
            <p className="mt-3 whitespace-nowrap text-[clamp(1.15rem,1.9vw,1.8rem)] leading-tight font-medium text-primary">让运输管理更简单、更高效</p>
            <div className="relative mt-1 flex w-full min-w-0 max-w-full flex-nowrap items-center gap-2 whitespace-nowrap text-[clamp(1.15rem,1.9vw,1.8rem)] leading-tight font-medium text-primary max-md:text-[clamp(1rem,4.4vw,1.18rem)]"><span className="shrink-0">物流运输管理再也不会</span><span className="inline-flex min-w-0 items-center bg-[linear-gradient(90deg,#ff6f5f,#fe8348,#8f48ff)] bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(143,72,255,0.15)] md:min-w-[5.8em]">{pain}<span className="ml-1 inline-block h-[1.05em] w-[2px] animate-pulse motion-reduce:animate-none rounded-full bg-violet-500/85" /></span></div>
            <p className="text-primary mt-4 w-full min-w-0 max-w-full pr-2 whitespace-normal break-all text-sm leading-relaxed md:pr-0 md:wrap-break-words lg:max-w-136">云柜宝立足国际物流运输场景，融合物流网络与大数据技术，围绕车货匹配、在途监管、时间节点记录和异常预警，构建一体化运输管理能力。</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">{homePreview ? <span className="btn-primary btn-md gap-2 px-5">了解更多<i className="ri-arrow-right-line text-base" aria-hidden="true" /></span> : <><button type="button" className="btn-primary btn-md gap-2 px-5" onClick={() => document.getElementById("download")?.scrollIntoView({ behavior: "smooth", block: "start" })}>下载 App<i className="ri-download-2-line text-base" aria-hidden="true" /></button><a href="https://www.ygbonline.com/admin/#/login" target="_blank" rel="noreferrer" className="btn-base btn-md gap-2 border border-edge bg-surface px-5 text-primary hover:bg-black/4 dark:hover:bg-white/8">管理后台<i className="ri-arrow-right-line text-base" aria-hidden="true" /></a></>}</div>
          </div>
          {!homePreview && <div className="relative z-20 w-full min-w-0 lg:self-end"><div ref={stackRef} className="relative h-[26.5rem] w-full min-w-0 md:h-[34rem]" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            {heroCards.map((card, index) => <article key={card.title} onClick={() => select(index)} className={`ygbHeroCard absolute left-0 right-0 top-0 mx-auto w-full cursor-pointer overflow-hidden rounded-t-2xl rounded-b-none border border-edge bg-surface shadow-[0_18px_50px_rgba(17,17,17,0.12)] md:left-auto md:right-0 md:mx-0 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)] ${heroPosition(index, active)} ${active !== index ? "h-[2.9rem] md:h-[3.1rem]" : ""}`}>
              <div className="flex w-full items-center justify-between border-b border-line bg-black/3 px-4 py-2 text-left dark:bg-white/6"><span className="text-sm font-medium text-primary">{card.badge}</span><i className="ri-arrow-right-up-line text-sm text-secondary" aria-hidden="true" /></div>
              <div className="px-4 pt-3 pb-2"><h3 className="text-lg leading-[1.28] font-medium text-primary max-md:text-[17px]">{card.title}</h3><p className="mt-1 text-sm leading-[1.7] text-secondary">{card.desc}</p></div>
              <div className="px-4 pb-4"><div className="overflow-hidden rounded-lg border border-edge bg-black/3 dark:bg-white/5"><img src={card.image} sizes="(max-width: 768px) 88vw, (max-width: 1280px) 52vw, 46vw" alt={card.title} className="block h-auto w-full" loading="lazy" decoding="async" /></div></div>
            </article>)}
            <div className="absolute bottom-3 left-1/2 z-70 flex -translate-x-1/2 items-center gap-2 rounded-full border border-edge bg-surface/95 px-2 py-1 shadow-[0_4px_16px_rgba(17,17,17,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.3)]"><button type="button" className="inline-flex btn-icon btn-icon-sm btn-icon-muted" onClick={() => shift(-1)} aria-label="上一张"><i className="ri-arrow-left-line" aria-hidden="true" /></button><div className="flex items-center gap-1">{heroCards.map((card, index) => <button key={card.title} type="button" className={`h-1.5 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none ${active === index ? "w-5 bg-ink/85" : "w-2 bg-ink/24 hover:bg-ink/35"}`} onClick={() => select(index)} aria-label={`切换到第 ${index + 1} 张`} />)}</div><button type="button" className="inline-flex btn-icon btn-icon-sm btn-icon-muted" onClick={() => shift(1)} aria-label="下一张"><i className="ri-arrow-right-line" aria-hidden="true" /></button></div>
          </div></div>}
        </div>
      </div>
    </div>
  </section>;
}
