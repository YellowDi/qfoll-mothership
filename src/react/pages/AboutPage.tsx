/**
 * [INPUT]: 依赖关于页图片资源、项目索引、项目轮播和二维码交互组件
 * [OUTPUT]: 对外提供 AboutPage，完整呈现公司介绍与联系区
 * [POS]: 公司信息路由的 React 页面编排边界，复用 React 外壳并保持 Vue 页面信息架构
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import heroImage from "../../assets/about-01.webp";
import introImage1 from "../../assets/about-02.webp";
import introImage2 from "../../assets/about-03.webp";
import introImage3 from "../../assets/about-04.webp";
import { AboutProjectsCarousel } from "./AboutProjectsCarousel";
import { QrContactCard } from "./QrContactCard";

export function AboutPage() {
  return <>
    <section className="mx-auto w-full max-w-360 px-6 pb-10 pt-6 md:px-14 md:pb-16 md:pt-10">
      <div className="flex w-full flex-col items-end gap-10 md:flex-row md:gap-8 lg:gap-12 xl:gap-x-16">
        <div className="order-1 flex min-w-0 flex-col md:flex-1 md:justify-end">
          <div className="mb-5 text-sm"><span className="text-secondary">关于我们</span></div>
          <h1 className="max-w-[28em] text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),3.75rem)] font-medium leading-[1.2] tracking-[-0.03em] text-primary">以技术驱动，<br />助力企业数字化</h1>
          <p className="mt-4 text-base leading-[1.72] text-primary/80">我们是企丰科技，专注企业信息化系统开发与技术服务，用创意融合技术，助力商业持续增长。</p>
          <div className="mt-8 flex flex-wrap items-center gap-3"><Link to="/projects" className="btn-primary btn-md gap-2 px-5">客户案例<i className="ri-arrow-right-line text-base" aria-hidden="true" /></Link><Link to="/careers" className="btn-secondary btn-md gap-2 px-5">加入我们</Link></div>
        </div>
        <div className="order-2 flex w-full justify-center md:min-w-0 md:flex-1 xl:max-w-[min(58%,864px)] xl:flex-[1.15]"><div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[rgb(var(--color-line)/0.08)]"><img src={heroImage} alt="企丰科技团队与产品" className="absolute inset-0 h-full w-full object-cover object-bottom" loading="eager" decoding="async" /></div></div>
      </div>
    </section>

    <AboutProjectsCarousel />

    <section className="mx-auto w-full max-w-[72rem] px-6 lg:px-14" aria-labelledby="about-intro-heading">
      <AboutBlock title="以技术驱动为核心" image={introImage1} imageAlt="企丰科技产品与方案" imageFirst={false}>
        企丰科技专注企业信息化系统开发与技术服务，深耕软件研发多年，服务多家企业与品牌，涵盖企业级后台、数据平台、智能硬件与物联网、以及面向 C 端的应用与小程序。我们相信，好的数字化项目不只是上线那一刻的完成，而是在多年之后依然稳定运行，能够随着业务发展不断扩展与优化。
      </AboutBlock>
      <AboutBlock title="理解问题，对齐目标" image={introImage2} imageAlt="企丰科技项目协作" imageFirst>
        在每一个项目开始之前，我们都会花时间理解问题本身。需求阶段由产品、设计、研发、测试与项目管理共同参与，对齐目标、边界与优先级。我们强调结构清晰、逻辑明确，进入迭代后关注可验证的结果与质量标准。我们交付的不只是代码，而是一套真正能够运转的系统、一份稳定可靠的技术支持。
      </AboutBlock>
      <AboutBlock title="长期可用，持续演进" image={introImage3} imageAlt="企丰科技自研产品" imageFirst={false} last>
        <p>无论是云柜宝、水环境智慧监控等自研产品，还是为客户定制的信息化系统，我们始终坚持以长期可用性为前提，用工程能力与产品思维助力企业数字化落地。</p>
        <div className="mt-8 flex flex-col items-start gap-3"><Link to="/ygb" className="btn-text btn-text-primary text-base md:text-lg">云柜宝<i className="ri-arrow-right-line text-sm" aria-hidden="true" /></Link><Link to="/water-env" className="btn-text btn-text-primary text-base md:text-lg">水环境智慧监控<i className="ri-arrow-right-line text-sm" aria-hidden="true" /></Link></div>
      </AboutBlock>
    </section>

    <section id="contact" className="mx-auto w-full max-w-360 py-10">
      <div className="mx-auto w-full px-5 xl:px-16"><div className="rounded-md bg-black/4.5 px-3 py-6 dark:bg-white/6 md:py-24"><div className="mx-auto flex w-full max-w-[40rem] flex-col gap-8"><h2 className="text-center text-2xl font-medium tracking-[-0.02em] text-primary md:text-4xl">联系我们</h2><article className="font-sans text-base leading-relaxed text-primary"><div className="contact-markdown flex flex-col gap-6"><p>扫码添加企业微信，可快速发起项目咨询并获取合作支持。无论你是希望咨询项目合作、了解产品方案，还是希望讨论长期技术支持，我们都欢迎你随时联系我们。我们重视每一次沟通，会尽快响应并给出明确反馈。若你已有明确需求，也可以直接留言项目背景、目标与时间计划，便于我们更高效地对接。</p><QrContactCard /></div></article></div></div></div>
    </section>
  </>;
}

function AboutBlock({ title, image, imageAlt, imageFirst, last = false, children }: { title: string; image: string; imageAlt: string; imageFirst: boolean; last?: boolean; children: ReactNode }) {
  return <div className={`pt-10 md:pt-20 ${last ? "pb-4" : ""}`}><div className="flex flex-col items-center gap-10 md:flex-row md:gap-14 lg:gap-20"><div className={`order-2 min-w-0 md:max-w-[28rem] md:shrink-0 ${imageFirst ? "md:order-2" : "md:order-1"}`}><h2 className="mb-6 text-2xl font-medium tracking-[-0.02em] text-primary md:text-3xl">{title}</h2><div className="text-base leading-[1.8] text-primary md:text-lg">{children}</div></div><div className={`order-1 min-w-0 flex-1 ${imageFirst ? "md:order-1" : "md:order-2"}`}><div className="group relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[rgb(var(--color-line)/0.06)]"><img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" loading="lazy" decoding="async" /></div></div></div></div>;
}
