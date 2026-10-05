/**
 * [INPUT]: 依赖云柜宝图片资源、产品文案、滚动观察器与浏览器可见性事件
 * [OUTPUT]: 对外提供 ReactYgbPage，展示云柜宝产品能力和 App 下载区
 * [POS]: 产品专题路由 /ygb 的 React 页面边界，承接 Hero、能力说明和截图轮播
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState } from "react";

import dashboardImage from "../../assets/ygb-assets/dashboard.webp";
import governanceImage from "../../assets/ygb-assets/governance.webp";
import app01 from "../../assets/ygb-assets/app-01-d.webp";
import app01Mobile from "../../assets/ygb-assets/app-01-m.webp";
import app02 from "../../assets/ygb-assets/app-02-d.webp";
import app02Mobile from "../../assets/ygb-assets/app-02-m.webp";
import app03 from "../../assets/ygb-assets/app-03-d.webp";
import app03Mobile from "../../assets/ygb-assets/app-03-m.webp";
import app04 from "../../assets/ygb-assets/app-04-d.webp";
import app04Mobile from "../../assets/ygb-assets/app-04-m.webp";
import app05 from "../../assets/ygb-assets/app-05-d.webp";
import app05Mobile from "../../assets/ygb-assets/app-05-m.webp";
import { ReactYgbHero } from "./ReactYgbHero";
import "./ReactYgbPage.css";

const summaryCards = [
  ["智能运力网络", "9,600+ 注册司机 · 1,200+ 优选线路", "构建覆盖多区域的运力网络，结合实时、精准的车辆 GPS 定位与轨迹可视化能力，持续追踪运输状态，帮助调度人员快速响应异常，保障运输高效可控。", "ri-map-pin-fill"],
  ["智能调度与高效履约", "380,000+ 累计订单完成", "基于订单特征、司机状态与线路偏好进行智能匹配与动态调度，有效降低空驶率，提升运力利用率与整体运输时效，持续优化平台履约能力。", "ri-truck-fill"],
  ["全链路物流保障体系", "全流程节点自动记录", "从提箱、到场、装货、在途到签收，关键节点自动记录，形成完整运输回溯链路，支撑结算、监管与风控管理，构建可追溯、可监管的物流生态。", "ri-shield-check-fill"],
];
const opsFeatures = [
  ["ri-share-box-line", "业务状态实时更新", "货物流转信息等可在线即时查询，确保信息透明可控"],
  ["ri-star-line", "专属管家服务", "一对一订单管理，提高物流管理效率"],
  ["ri-time-line", "精确时间管理", "自动记录提箱、到场等时间节点，确保货物流转高效可视化"],
  ["ri-notification-2-line", "消息及时通知", "多种消息推送机制，确保信息及时传达"],
];
const screenshots = [
  { src: app01, mobile: app01Mobile, title: "司机端首页", desc: "接单、进度与消息总览" },
  { src: app02, mobile: app02Mobile, title: "在途任务", desc: "关键节点与轨迹可视化" },
  { src: app03, mobile: app03Mobile, title: "异常处理", desc: "上报、回传与处理闭环" },
  { src: app04, mobile: app04Mobile, title: "回执签收", desc: "电子回单与签收上传" },
  { src: app05, mobile: app05Mobile, title: "运单详情", desc: "多维字段与状态同步" },
];

export function ReactYgbPage() {
  const downloadRef = useRef<HTMLElement>(null);
  const [activeShot, setActiveShot] = useState(0);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  useEffect(() => {
    const node = downloadRef.current;
    if (!node || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), { threshold: 0.15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
  useEffect(() => {
    if (!inView || !pageVisible) return;
    const timer = window.setInterval(() => setActiveShot((value) => (value - 1 + screenshots.length) % screenshots.length), 3500);
    return () => window.clearInterval(timer);
  }, [inView, pageVisible]);
  const shiftShot = (step: number) => setActiveShot((value) => (value + step + screenshots.length) % screenshots.length);
  const stageSlot = (index: number) => (index - activeShot + screenshots.length * 2 - 1) % screenshots.length;
  const stageClass = (index: number) => {
    const slot = stageSlot(index);
    if (slot === 0) return "w-[11.6rem] opacity-72 max-md:w-[7.8rem]";
    if (slot === 1) return "w-[13.8rem] opacity-80 max-md:w-[9.4rem]";
    if (slot === 2) return "w-[16.2rem] opacity-88 max-md:w-44";
    if (slot === 3) return "w-[18.2rem] opacity-94 max-md:w-[12.2rem]";
    return "w-[19.8rem] opacity-100 max-md:w-[13.2rem]";
  };
  const shot = screenshots[activeShot];
  return <div className="w-full bg-bg pb-16">
    <ReactYgbHero />
    <section className="mx-auto mt-8 w-full max-w-360 px-6 md:px-14"><div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {summaryCards.map(([title, stats, desc, icon]) => <article key={title} className="group relative overflow-hidden rounded-lg border border-edge bg-surface p-4 shadow-[0_1px_0_rgba(17,17,17,0.02)] transition-[background-color,border-color] duration-300 hover:border-orange-400 hover:bg-orange-400 dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-[radial-gradient(115%_105%_at_0%_0%,rgba(254,131,72,0.26),rgba(254,131,72,0.14)_34%,rgba(254,131,72,0.05)_64%,transparent)] transition-opacity duration-300 group-hover:opacity-0" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[52%] bg-[linear-gradient(90deg,rgba(254,131,72,0.16)_1px,transparent_1px),linear-gradient(0deg,rgba(254,131,72,0.12)_1px,transparent_1px)] bg-size-[18px_18px] opacity-35 transition-opacity duration-300 group-hover:opacity-0" />
        <div className="relative flex items-center gap-3"><span className="relative inline-flex h-13 w-13 shrink-0 items-center justify-center"><span className="absolute inset-0 rounded-full bg-orange-400/30 blur-[9px] transition-opacity duration-300 group-hover:opacity-0" /><span className="relative inline-flex h-13 w-13 items-center justify-center rounded-full border border-white/88 bg-white/96 text-3xl text-orange-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.88),inset_0_-10px_18px_rgba(254,131,72,0.16),0_4px_12px_rgba(17,17,17,0.12)] transition-colors duration-300 group-hover:border-white/68 group-hover:bg-white/12 group-hover:text-on-dark"><i className={icon} aria-hidden="true" /></span></span><div className="min-w-0"><h2 className="text-lg font-medium tracking-[-0.015em] group-hover:text-on-dark">{title}</h2><div className="mt-1 text-sm font-medium text-secondary group-hover:text-on-dark">{stats}</div></div></div>
        <p className="relative mt-3 text-sm leading-[1.75] text-secondary group-hover:text-on-dark">{desc}</p>
      </article>)}
    </div></section>
    <section id="dashboard" className="mx-auto mt-12 w-full max-w-360 px-6 md:px-14"><div className="grid grid-cols-12 gap-10 md:gap-6"><div className="col-span-12 lg:col-span-5"><span className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface/90 px-3 py-1 text-sm text-secondary"><i className="ri-shining-line" aria-hidden="true" />运输作业管理</span><h2 className="mt-5 text-[clamp(1.65rem,2.7vw,2.9rem)] font-medium leading-[1.08] tracking-[-0.03em]">订单统一管理<br />调度井然有序</h2><div className="relative mt-7 grid grid-cols-1 sm:grid-cols-2">{opsFeatures.map(([icon, title, desc], index) => <article key={title} className={`py-4 sm:min-h-44 ${index % 2 ? "sm:pl-8" : "sm:pr-8"} ${index >= 2 ? "sm:pt-6" : "sm:pb-6"} ${index > 0 ? "border-t border-zinc-200/60 sm:border-t-0 dark:border-white/8" : ""}`}><i className={`${icon} text-[1.95rem] leading-none ${index === 0 ? "text-red-500" : index === 1 ? "text-violet-500" : index === 2 ? "text-green-500" : "text-orange-500"}`} aria-hidden="true" /><h3 className="mt-3 text-[clamp(1.06rem,1.35vw,1.32rem)] font-medium">{title}</h3><p className="mt-1.5 text-[15px] leading-[1.72] text-secondary">{desc}</p></article>)}</div></div><div className="col-span-12 lg:col-span-7"><div className="relative overflow-hidden rounded-lg"><img src={dashboardImage} alt="云柜宝运输作业管理主界面" className="block w-full object-contain shadow-[0_10px_22px_rgba(28,38,52,0.14)] dark:shadow-[0_12px_24px_rgba(0,0,0,0.35)]" loading="lazy" /><div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-linear-to-b from-transparent via-bg/60 to-bg" /></div></div></div></section>
    <section id="governance" className="mx-auto mt-12 w-full max-w-360 px-6 md:px-14"><div className="grid grid-cols-12 items-center gap-8 md:gap-5"><div className="order-2 col-span-12 lg:order-1 lg:col-span-6"><div className="relative overflow-hidden rounded-lg"><img src={governanceImage} alt="政府监管平台数据界面" className="block w-full object-contain shadow-[0_10px_22px_rgba(28,38,52,0.14)] dark:shadow-[0_12px_24px_rgba(0,0,0,0.35)]" loading="lazy" /><div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-linear-to-b from-transparent via-bg/60 to-bg" /></div></div><div className="order-1 col-span-12 lg:order-2 lg:col-span-6"><span className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface/90 px-3 py-1 text-sm text-secondary"><i className="ri-shining-line" aria-hidden="true" />政府监管</span><h2 className="mt-5 text-[clamp(1.65rem,2.95vw,3.35rem)] font-medium leading-[1.06] tracking-[-0.03em]">平台对接政府系统，<br />数据共享与监管支持</h2><p className="mt-5 text-[clamp(.94rem,1.04vw,1.1rem)] leading-[1.86]">云柜宝通过对接网络货运接口，实现了与政府部门的数据共享，保证了数据的真实性、准确性、及时性，符合政府监管要求。平台还可以根据政府部门的需求，随时为政府提供数据与业务支持，包括运输信息、运费结算、安全监控等方面，协助政府部门进行有效的监管和管理。</p><ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5">{["运输信息", "运费结算", "安全监控", "大数据分析"].map((item) => <li key={item} className="flex items-center gap-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gray-800 text-on-dark"><i className="ri-check-line text-sm" aria-hidden="true" /></span><span className="font-medium">{item}</span></li>)}</ul></div></div></section>
    <section id="download" ref={downloadRef} className="mx-auto mt-12 w-full max-w-360 px-6 max-lg:px-6 max-md:px-5 md:px-14"><div className="relative overflow-hidden rounded-lg bg-neutral-900 p-5 text-on-dark dark:bg-zinc-900 md:p-8"><div className="download-material pointer-events-none absolute inset-0 z-0" /><div className="relative z-20 max-w-136 lg:max-w-none lg:pr-88"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm"><i className="ri-shining-line" aria-hidden="true" />应用下载</span><h2 className="mt-4 text-[clamp(1.7rem,2.4vw,2.6rem)] font-medium">下载云柜宝 App</h2><p className="mt-4 max-w-136 text-[15px] leading-[1.9]">支持 iOS、Android 与微信小程序。司机端可实时接单、反馈状态，管理端可同步查看车辆轨迹、回执与异常信息。</p><div className="relative mt-4 flex items-start justify-between gap-3 lg:pr-88 lg:static max-lg:gap-2"><div className="min-w-0 flex-1"><a href="https://yunguibao-1321524436.cos.ap-shanghai.myqcloud.com/images/45c957800a8760898ce846ba89dc46ef.apk" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-white px-5 text-sm font-medium text-primary"><i className="ri-android-fill" aria-hidden="true" /><span className="max-md:hidden">下载云柜宝司机版</span><span className="hidden max-md:inline">下载司机端</span><i className="ri-download-2-line" aria-hidden="true" /></a><div className="mt-2 text-sm">或搜索小程序「云柜宝」</div></div><div className="w-[19.8rem] shrink-0 max-md:w-[13.2rem] lg:absolute lg:right-0 lg:top-0"><div className="flex items-center justify-center gap-2"><button type="button" className="btn-icon btn-icon-sm border border-white/16 text-on-dark" onClick={() => shiftShot(-1)} aria-label="上一张截图"><i className="ri-arrow-left-s-line" aria-hidden="true" /></button><button type="button" className="btn-icon btn-icon-sm border border-white/16 text-on-dark" onClick={() => shiftShot(1)} aria-label="下一张截图"><i className="ri-arrow-right-s-line" aria-hidden="true" /></button></div><div className="mt-2 text-center"><div className="text-sm font-medium">{shot.title}</div><div className="mt-0.5 text-sm leading-[1.55]">{shot.desc}</div></div></div></div></div><div className="relative z-10 -mt-32 -mx-8 -mb-1 max-lg:-mt-8 max-md:-mt-12 max-md:-mx-5 max-md:-mb-1"><div className="mt-4 flex h-[41rem] items-end justify-end gap-3 overflow-visible px-8 max-lg:mt-12 max-md:h-128 max-md:gap-2 max-md:px-5">{screenshots.map((item, index) => <article key={item.src} className={`relative flex-none origin-bottom transition-all duration-500 ease-out ${stageClass(index)}`} style={{ order: stageSlot(index) }}><img src={item.src} srcSet={`${item.mobile} 320w, ${item.src} 450w`} sizes="(max-width: 768px) 132px, 320px" alt={item.title} loading={index === activeShot ? "eager" : "lazy"} fetchPriority={index === activeShot ? "high" : "low"} decoding="async" width="450" height="920" className="h-auto w-full object-contain object-bottom" /></article>)}</div></div></div></section>
  </div>;
}
