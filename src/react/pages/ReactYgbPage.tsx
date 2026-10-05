/**
 * [INPUT]: 依赖云柜宝图片资源、产品文案、滚动观察器与浏览器可见性事件
 * [OUTPUT]: 对外提供 ReactYgbPage，展示云柜宝产品能力和 App 下载区
 * [POS]: 产品专题路由 /ygb 的 React 页面边界，承接 Hero、能力说明和截图轮播
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState } from "react";

import "./ReactYgbPage.css";

import dashboardImage from "../../assets/ygb-assets/dashboard.webp";
import governanceImage from "../../assets/ygb-assets/governance.webp";
import app01 from "../../assets/ygb-assets/app-01-d.webp";
import app02 from "../../assets/ygb-assets/app-02-d.webp";
import app03 from "../../assets/ygb-assets/app-03-d.webp";
import app04 from "../../assets/ygb-assets/app-04-d.webp";
import app05 from "../../assets/ygb-assets/app-05-d.webp";
import hero01 from "../../assets/ygb-assets/hero-01.webp";
import hero02 from "../../assets/ygb-assets/hero-02.webp";
import hero03 from "../../assets/ygb-assets/hero-03.webp";
import { ReactYgbRoadMapBg } from "./ReactYgbRoadMapBg";

const heroCards = [
  { badge: "全流程可视化管理", title: "智能系统追踪，实时掌控业务状态", desc: "实时、精准的车辆 GPS 定位，确保运输透明可控。用户可查询货物流转，系统自动记录关键节点，实时定位车辆，并智能校正数据，提升运营效率。", image: hero01 },
  { badge: "数据驱动智能调度", title: "智能调度，高效匹配", desc: "云柜宝通过数据分析结合集卡车辆定位信息，实现科学的车货匹配，优化运输路径，降低空载率，提高运输效率。", image: hero02 },
  { badge: "运输安全与责任保障体系", title: "全链路物流保障，构建更完善的物流生态", desc: "专注运输环节优化，延伸港口与堆场协同服务并提供全程物流责任险，最大限度保障货物安全。", image: hero03 },
];
const heroPains = ["效率低下", "路线混乱", "信息滞后", "推进缓慢", "对接低效", "延误频繁"];
const summaryCards = [
  ["智能运力网络", "9,600+ 注册司机 · 1,200+ 优选线路", "构建覆盖多区域的运力网络，结合实时 GPS 定位与轨迹可视化能力，持续追踪运输状态。", "ri-map-pin-fill"],
  ["智能调度与高效履约", "380,000+ 累计订单完成", "基于订单特征、司机状态与线路偏好进行智能匹配与动态调度，提升运力利用率与运输时效。", "ri-truck-fill"],
  ["全链路物流保障体系", "全流程节点自动记录", "从提箱、到场、装货、在途到签收，关键节点自动记录，形成完整运输回溯链路。", "ri-shield-check-fill"],
];
const opsFeatures = [["ri-share-box-line", "业务状态实时更新", "货物流转信息可在线即时查询，确保信息透明可控"], ["ri-star-line", "专属管家服务", "一对一订单管理，提高物流管理效率"], ["ri-time-line", "精确时间管理", "自动记录关键时间节点，让货物流转高效可视化"], ["ri-notification-2-line", "消息及时通知", "多种消息推送机制，确保信息及时传达"]];
const screenshots = [{ src: app01, title: "司机端首页", desc: "接单、进度与消息总览" }, { src: app02, title: "在途任务", desc: "关键节点与轨迹可视化" }, { src: app03, title: "异常处理", desc: "上报、回传与处理闭环" }, { src: app04, title: "回执签收", desc: "电子回单与签收上传" }, { src: app05, title: "运单详情", desc: "多维字段与状态同步" }];

function YgbHero() {
  const [active, setActive] = useState(0); const [pain, setPain] = useState("效率低下");
  useEffect(() => { const timer = window.setInterval(() => setPain((value) => heroPains[(heroPains.indexOf(value) + 1) % heroPains.length]), 2200); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const timer = window.setInterval(() => setActive((value) => (value + 1) % heroCards.length), 4200); return () => window.clearInterval(timer); }, []);
  const positionFor = (index: number) => {
    const offset = (index - active + heroCards.length) % heroCards.length;
    return offset === 0 ? "active" : offset === 1 ? "next" : "last";
  };
  const shift = (step: number) => setActive((value) => (value + step + heroCards.length) % heroCards.length);
  return <section className="react-ygb-hero relative overflow-hidden border-b border-edge py-8 md:py-14">
    <div className="pointer-events-none absolute inset-0"><ReactYgbRoadMapBg /></div>
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(246,245,244,.1),rgba(246,245,244,.02)_40%,rgba(246,245,244,.12)_100%)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.01)_40%,rgba(255,255,255,.06)_100%)]" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(112%_92%_at_14%_8%,rgba(246,245,244,.9),rgba(246,245,244,.6)_34%,rgba(246,245,244,.18)_62%,transparent_90%)] dark:bg-[radial-gradient(112%_92%_at_14%_8%,rgba(25,24,28,.93),rgba(25,24,28,.75)_34%,rgba(25,24,28,.34)_62%,transparent_90%)]" />
    <div className="relative mx-auto grid w-full max-w-360 gap-8 px-6 lg:grid-cols-2 lg:items-end lg:px-14">
      <div className="relative z-40 lg:self-start"><div className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface/90 px-3 py-1 text-sm text-secondary"><i className="ri-shining-line" aria-hidden="true" />车货智能匹配 · 全球定位 · 实时预警</div><p className="mt-5 text-[clamp(2rem,3.4vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.03em] text-orange-400">云柜宝</p><h1 className="mt-1 whitespace-nowrap text-[clamp(2rem,3.4vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.03em]">智能集卡物流平台</h1><p className="mt-3 text-[clamp(1.15rem,1.9vw,1.8rem)] font-medium leading-tight">让运输管理更简单、更高效</p><p className="mt-1 text-[clamp(1rem,1.9vw,1.8rem)] font-medium leading-tight">物流运输管理再也不会 <span className="bg-linear-to-r from-[#ff6f5f] via-[#fe8348] to-[#8f48ff] bg-clip-text text-transparent">{pain}</span></p><p className="mt-4 max-w-136 text-sm leading-relaxed text-primary/85">云柜宝立足国际物流运输场景，融合物流网络与大数据技术，围绕车货匹配、在途监管、时间节点记录和异常预警，构建一体化运输管理能力。</p><div className="mt-7 flex flex-wrap gap-3"><button type="button" className="btn-primary btn-md gap-2 px-5" onClick={() => document.getElementById("download")?.scrollIntoView({ behavior: "smooth" })}>下载 App <i className="ri-download-2-line" aria-hidden="true" /></button><a href="https://www.ygbonline.com/admin/#/login" target="_blank" rel="noreferrer" className="btn-base btn-md gap-2 border border-edge bg-surface px-5 text-primary">管理后台 <i className="ri-arrow-right-line" aria-hidden="true" /></a></div></div>
      <div className="relative z-20 h-112 w-full min-w-0 md:h-136">
        <div className="relative h-full w-full">
          {heroCards.map((item, index) => <article key={item.title} className="react-ygb-hero-card absolute left-0 right-0 top-0 mx-auto w-full overflow-hidden rounded-t-2xl border border-edge bg-surface shadow-[0_18px_50px_rgba(17,17,17,.12)] dark:shadow-[0_18px_52px_rgba(0,0,0,.35)]" data-position={positionFor(index)}><div className="flex items-center justify-between border-b border-line bg-black/3 px-4 py-2 dark:bg-white/6"><div className="text-sm font-medium">{item.badge}</div><i className="ri-arrow-right-up-line text-sm text-secondary" aria-hidden="true" /></div><div className="px-4 pt-3 pb-2"><h2 className="text-lg font-medium leading-[1.28]">{item.title}</h2><p className="mt-1 text-sm leading-[1.7] text-secondary">{item.desc}</p></div><div className="px-4 pb-4"><div className="overflow-hidden rounded-lg border border-edge bg-black/3 dark:bg-white/5"><img src={item.image} alt={item.title} className="block h-auto w-full" loading="lazy" /></div></div></article>)}
          <div className="absolute bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-edge bg-surface/95 px-2 py-1 shadow-sm"><button type="button" className="btn-icon btn-icon-sm btn-icon-muted" onClick={() => shift(-1)} aria-label="上一张"><i className="ri-arrow-left-line" aria-hidden="true" /></button>{heroCards.map((item, index) => <button key={item.title} type="button" aria-label={`切换到第 ${index + 1} 张`} className={`h-1.5 rounded-full transition-all ${active === index ? "w-5 bg-ink/85" : "w-2 bg-ink/24"}`} onClick={() => setActive(index)} />)}<button type="button" className="btn-icon btn-icon-sm btn-icon-muted" onClick={() => shift(1)} aria-label="下一张"><i className="ri-arrow-right-line" aria-hidden="true" /></button></div>
        </div>
      </div>
    </div>
  </section>;
}

export function ReactYgbPage() {
  const downloadRef = useRef<HTMLElement>(null); const [activeShot, setActiveShot] = useState(0); const [inView, setInView] = useState(false);
  useEffect(() => { const node = downloadRef.current; if (!node || !("IntersectionObserver" in window)) { setInView(true); return; } const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), { threshold: 0.15 }); observer.observe(node); return () => observer.disconnect(); }, []);
  useEffect(() => { if (!inView) return; const timer = window.setInterval(() => setActiveShot((value) => (value + 1) % screenshots.length), 3500); return () => window.clearInterval(timer); }, [inView]);
  const shiftShot = (step: number) => setActiveShot((value) => (value + step + screenshots.length) % screenshots.length);
  const shot = screenshots[activeShot];
  return <div className="w-full pb-16"><YgbHero /><section className="mx-auto mt-8 grid w-full max-w-360 gap-4 px-6 md:grid-cols-3 md:px-14">{summaryCards.map(([title, stats, desc, icon]) => <article key={title} className="group rounded-lg border border-edge bg-surface p-4 transition-colors hover:border-orange-400 hover:bg-orange-400"><div className="flex items-center gap-3"><span className="inline-flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white text-2xl text-orange-400 shadow-md"><i className={icon} aria-hidden="true" /></span><div><h2 className="text-lg font-medium group-hover:text-on-dark">{title}</h2><div className="mt-1 text-sm text-secondary group-hover:text-on-dark">{stats}</div></div></div><p className="mt-3 text-sm leading-[1.75] text-secondary group-hover:text-on-dark">{desc}</p></article>)}</section><section id="dashboard" className="mx-auto mt-12 grid w-full max-w-360 grid-cols-12 gap-10 px-6 md:px-14"><div className="col-span-12 lg:col-span-5"><span className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface/90 px-3 py-1 text-sm text-secondary"><i className="ri-shining-line" aria-hidden="true" />运输作业管理</span><h2 className="mt-5 text-[clamp(1.65rem,2.7vw,2.9rem)] font-medium leading-[1.08] tracking-[-0.03em]">订单统一管理<br />调度井然有序</h2><div className="mt-7 grid grid-cols-1 sm:grid-cols-2">{opsFeatures.map(([icon, title, desc]) => <article key={title} className="border-line py-4 sm:min-h-44 sm:border-b sm:border-r sm:px-6 first:pt-0"><i className={`${icon} text-[1.95rem] text-orange-500`} aria-hidden="true" /><h3 className="mt-3 text-lg font-medium">{title}</h3><p className="mt-1.5 text-[15px] leading-[1.72] text-secondary">{desc}</p></article>)}</div></div><div className="col-span-12 lg:col-span-7"><img src={dashboardImage} alt="云柜宝运输作业管理主界面" className="w-full rounded-lg object-contain shadow-lg" loading="lazy" /></div></section><section id="governance" className="mx-auto mt-12 grid w-full max-w-360 grid-cols-12 items-center gap-8 px-6 md:px-14"><div className="order-2 col-span-12 lg:order-1 lg:col-span-6"><img src={governanceImage} alt="政府监管平台数据界面" className="w-full rounded-lg object-contain shadow-lg" loading="lazy" /></div><div className="order-1 col-span-12 lg:order-2 lg:col-span-6"><span className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface/90 px-3 py-1 text-sm text-secondary"><i className="ri-shining-line" aria-hidden="true" />政府监管</span><h2 className="mt-5 text-[clamp(1.65rem,2.95vw,3.35rem)] font-medium leading-[1.06] tracking-[-0.03em]">平台对接政府系统，<br />数据共享与监管支持</h2><p className="mt-5 text-base leading-[1.86]">云柜宝通过对接网络货运接口，实现与政府部门的数据共享，保证数据真实、准确、及时，符合政府监管要求。</p><ul className="mt-5 grid grid-cols-2 gap-3">{["运输信息", "运费结算", "安全监控", "大数据分析"].map((item) => <li key={item} className="flex items-center gap-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gray-800 text-on-dark"><i className="ri-check-line text-sm" aria-hidden="true" /></span><span className="font-medium">{item}</span></li>)}</ul></div></section><section id="download" ref={downloadRef} className="mx-auto mt-12 w-full max-w-360 px-6 md:px-14"><div className="relative overflow-hidden rounded-lg bg-neutral-900 p-6 text-on-dark md:p-8"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(78rem_38rem_at_-10%_-24%,rgba(255,153,74,.34),transparent_56%),radial-gradient(66rem_36rem_at_114%_-14%,rgba(98,156,255,.32),transparent_60%)]" /><div className="relative z-10"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">应用下载</span><h2 className="mt-4 text-[clamp(1.7rem,2.4vw,2.6rem)] font-medium">下载云柜宝 App</h2><p className="mt-4 max-w-136 text-[15px] leading-[1.9]">支持 iOS、Android 与微信小程序。司机端可实时接单、反馈状态，管理端可同步查看车辆轨迹、回执与异常信息。</p><div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><div><a href="https://yunguibao-1321524436.cos.ap-shanghai.myqcloud.com/images/45c957800a8760898ce846ba89dc46ef.apk" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-primary"><i className="ri-android-fill" aria-hidden="true" />下载云柜宝司机版<i className="ri-download-2-line" aria-hidden="true" /></a><div className="mt-2 text-sm">或搜索小程序「云柜宝」</div></div><div className="w-full max-w-80"><div className="flex items-center justify-between"><button type="button" className="btn-icon btn-icon-sm border border-white/16 text-on-dark" onClick={() => shiftShot(-1)} aria-label="上一张截图"><i className="ri-arrow-left-s-line" aria-hidden="true" /></button><div className="text-center"><div className="text-sm font-medium">{shot.title}</div><div className="mt-0.5 text-sm">{shot.desc}</div></div><button type="button" className="btn-icon btn-icon-sm border border-white/16 text-on-dark" onClick={() => shiftShot(1)} aria-label="下一张截图"><i className="ri-arrow-right-s-line" aria-hidden="true" /></button></div><img src={shot.src} alt={shot.title} className="mx-auto mt-3 h-96 w-auto object-contain" /></div></div></div></div></section></div>;
}
