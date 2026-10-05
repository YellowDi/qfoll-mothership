/**
 * [INPUT]: 依赖云柜宝 Hero 图片、路线图 Canvas、首页预览布局和 React Router
 * [OUTPUT]: 对外提供 ReactYgbPreview，展示首页客户案例主卡
 * [POS]: React 首页客户案例区的主视觉，复用云柜宝产品语义但不耦合专题页状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import hero01 from "../../assets/ygb-assets/hero-01.webp";
import hero02 from "../../assets/ygb-assets/hero-02.webp";
import hero03 from "../../assets/ygb-assets/hero-03.webp";
import { ReactYgbRoadMapBg } from "./ReactYgbRoadMapBg";

const heroCards = [
  {
    badge: "全流程可视化管理",
    title: "智能系统追踪，实时掌控业务状态",
    desc: "实时、精准的车辆 GPS 定位，确保运输透明可控。用户可查询货物流转，系统自动记录关键节点，实时定位车辆，并智能校正数据，提升运营效率。",
    image: hero01,
  },
  {
    badge: "数据驱动智能调度",
    title: "智能调度，高效匹配",
    desc: "云柜宝小程序通过强大的数据分析能力，结合集卡车辆定位信息，实现科学的车货匹配，优化运输路径，从而有效降低空载率，提高运输效率。",
    image: hero02,
  },
  {
    badge: "运输安全与责任保障体系",
    title: "全链路物流保障，构建更完善的物流生态",
    desc: "云柜宝专注运输环节优化，延伸港口与堆场协同服务并提供全程物流责任险，最大限度保障货物安全。",
    image: hero03,
  },
];

export function ReactYgbPreview() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % heroCards.length), 4200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Link to="/ygb" className="react-ygb-preview group block rounded-md">
      <div className="relative overflow-hidden rounded-md border border-edge bg-bg/95 p-8 select-none max-md:p-5">
        <div className="react-ygb-roadmap pointer-events-none" aria-hidden="true"><ReactYgbRoadMapBg /></div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(246,245,244,0.08),rgba(246,245,244,0.02)_40%,rgba(246,245,244,0.08)_100%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015)_40%,rgba(255,255,255,0.03)_100%)]" />
        <div className="relative z-10 grid min-h-128 gap-8 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)] lg:items-end">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-edge bg-surface/90 px-3 py-1 text-sm text-secondary">
              <i className="ri-shining-line text-sm" aria-hidden="true" />车货智能匹配 · 全球定位 · 实时预警
            </div>
            <p className="mt-5 text-[clamp(2rem,3.4vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.03em] text-orange-400">云柜宝</p>
            <h3 className="mt-1 whitespace-nowrap text-[clamp(2rem,3.4vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.03em]">智能集卡物流平台</h3>
            <p className="mt-3 whitespace-nowrap text-[clamp(1.15rem,1.9vw,1.8rem)] font-medium leading-tight">让运输管理更简单、更高效</p>
            <p className="mt-1 text-[clamp(1rem,1.9vw,1.8rem)] font-medium leading-tight">物流运输管理再也不会 <span className="bg-linear-to-r from-[#ff6f5f] via-[#fe8348] to-[#8f48ff] bg-clip-text text-transparent">效率低下</span></p>
            <p className="mt-4 max-w-136 text-sm leading-relaxed text-primary/80">云柜宝立足国际物流运输场景，融合物流网络与大数据技术，围绕车货匹配、在途监管、时间节点记录和异常预警，构建一体化运输管理能力。</p>
            <span className="btn-primary btn-md mt-7 inline-flex gap-2 px-5">了解更多 <i className="ri-arrow-right-line" aria-hidden="true" /></span>
          </div>

          <div className="relative min-h-104 overflow-hidden rounded-t-2xl">
            {heroCards.map((card, index) => {
              const offset = (index - active + heroCards.length) % heroCards.length;
              return (
                <article key={card.title} className={`react-ygb-card ${offset === 0 ? "is-active" : offset === 1 ? "is-next" : "is-last"}`}>
                  <div className="flex items-center justify-between border-b border-line bg-black/3 px-4 py-2 text-sm font-medium dark:bg-white/6"><span>{card.badge}</span><i className="ri-arrow-right-up-line text-secondary" aria-hidden="true" /></div>
                  <div className="px-4 pt-3"><h4 className="text-lg font-medium leading-[1.28]">{card.title}</h4><p className="mt-1 text-sm leading-[1.7] text-secondary">{card.desc}</p></div>
                  <div className="p-4"><img src={card.image} alt={card.title} className="block w-full rounded-lg border border-edge" loading="lazy" /></div>
                </article>
              );
            })}
            <div className="absolute bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-edge bg-surface/95 px-2 py-1 shadow-lg">
              {heroCards.map((card, index) => <button key={card.title} type="button" className={`h-1.5 rounded-full transition-all ${active === index ? "w-5 bg-ink/85" : "w-2 bg-ink/24"}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setActive(index); }} aria-label={`切换到第 ${index + 1} 张`} />)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
