/**
 * [INPUT]: 依赖水环境特性数据、明暗主题图片、页面背景令牌与 public/water-env 的视频和首帧封面
 * [OUTPUT]: 对外提供 ReactWaterEnvPage，展示居中视频 Hero、地图总览和水环境运维能力
 * [POS]: 产品专题路由 /water-env 的 React 页面边界，负责 Hero 可见性播放与内容区衔接
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef } from "react";
import { featureSections } from "../../data/waterEnvFeatures";
import "./ReactWaterEnvPage.css";

type FeatureSection = (typeof featureSections)[number];

export function ReactWaterEnvPage() {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    <div className="w-full pb-20">
      <section ref={heroRef} className="react-water-hero relative flex min-h-[clamp(36rem,76vh,48rem)] flex-col items-center overflow-hidden py-12 md:py-20">
        <video
          ref={videoRef}
          className="react-water-hero-video"
          src="/water-env/floral_a.mp4"
          poster="/water-env/floral_a-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="react-water-hero-content relative z-10 mx-auto w-full max-w-240 px-6">
          <div className="react-water-hero-kicker inline-flex items-center gap-2 rounded-full border border-zinc-300/50 bg-white/60 px-3 py-1 text-sm text-secondary dark:border-white/20 dark:bg-white/10 dark:text-on-dark">
            <i className="ri-drop-line text-sky-500" aria-hidden="true" />
            统一数据平台 · 动态预警 · 污染源追溯
          </div>
          <h1 className="react-water-hero-title mt-7 text-[clamp(3rem,7vw,6.5rem)] font-medium leading-[.98] tracking-[-0.06em]">
            <span className="text-sky-500">水环境</span>
            <br />
            智慧监控平台
          </h1>
          <p className="mx-auto mt-6 max-w-180 text-[clamp(1.15rem,2vw,1.8rem)] font-medium leading-tight">
            面向排水管网全生命周期管理的数字化监测与预警
          </p>
          <p className="mx-auto mt-4 max-w-160 text-sm leading-relaxed text-secondary md:text-base">
            以统一的数据体系连接分散的监测节点，让排水管网从「看不见」走向「可感知、可分析、可预警」。
          </p>
          <a href="#monitoring" className="btn-primary btn-md mt-7 inline-flex items-center gap-2 px-5">
            查看监测总览
            <i className="ri-arrow-down-line text-base" aria-hidden="true" />
          </a>
        </div>
        <FeatureSection item={featureSections[0]} index={0} />
      </section>

      {(featureSections as FeatureSection[]).slice(1).map((item, index) => (
        <FeatureSection key={item.id} item={item} index={index + 1} />
      ))}
    </div>
  );
}

function FeatureSection({ item, index }: { item: FeatureSection; index: number }) {
  const isLead = index === 0;
  return (
    <section
      id={item.id}
      className={`water-feature-section mx-auto w-full max-w-360 px-6 md:px-14 ${isLead ? "water-feature-section--lead mt-20 lg:mt-28" : `mt-20 grid grid-cols-1 items-center gap-10 md:grid-cols-5 md:gap-14 lg:mt-28`}`}
    >
      {isLead ? (
        <>
          <FeatureMedia item={item} index={index} />
          <FeatureCopy item={item} />
        </>
      ) : (
        <>
          <FeatureCopy item={item} alternate={index % 2 === 1} />
          <FeatureMedia item={item} index={index} alternate={index % 2 === 1} />
        </>
      )}
    </section>
  );
}

function FeatureCopy({ item, alternate = false }: { item: FeatureSection; alternate?: boolean }) {
  return (
    <div className={`water-feature-copy min-w-0 md:col-span-2 md:px-8 ${alternate ? "md:order-2" : ""}`}>
      <span className="inline-flex rounded-full border border-edge bg-surface/75 px-3 py-1 text-sm text-secondary">{item.chip}</span>
      <h2 className="mt-4 text-[clamp(1.75rem,3vw,3rem)] font-medium leading-[1.08] tracking-[-0.04em]">{item.title}</h2>
      <p className="mt-5 text-[clamp(.9375rem,1.05vw,1.0625rem)] leading-[1.75] text-secondary">{item.desc}</p>
    </div>
  );
}

function FeatureMedia({ item, index, alternate = false }: { item: FeatureSection; index: number; alternate?: boolean }) {
  return (
    <div className={`water-feature-media min-w-0 ${index === 0 ? "" : `md:col-span-3 ${alternate ? "md:order-1" : ""}`}`}>
      <div className="overflow-hidden rounded-md bg-surface shadow-[0_8px_40px_-12px_rgba(0,0,0,.15)] dark:shadow-[0_12px_48px_-12px_rgba(0,0,0,.4)]">
        <img src={item.image} alt={item.title} className="block h-auto w-full object-cover dark:hidden" loading={index ? "lazy" : "eager"} />
        <img src={item.imageDark || item.image} alt={item.title} className="hidden h-auto w-full object-cover dark:block" loading="lazy" />
      </div>
    </div>
  );
}
