/**
 * [INPUT]: 依赖品牌图标资源与首页局部视觉样式
 * [OUTPUT]: 对外提供 ReactAboutSection，呈现品牌介绍和特性列表
 * [POS]: 首页与关于页共享的品牌首屏区块，保留点阵背景与内联品牌图标
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import logoImage from "../../assets/logo.webp";
import huasenIcon from "../../assets/huasen.webp";
import yunguibaoIcon from "../../assets/yunguibao.webp";
import budongIcon from "../../assets/budong-music.webp";
import "./ReactAboutSection.css";

const features = [
  ["战略性设计思维", "我们在设计时会考虑到您的商业目标，确保能取得显著成效。"],
  ["协作流程", "我们会与您紧密合作，将您的愿景与我们的创意专长相融合。"],
  ["可靠的业绩记录", "我们的成功体现在那些感到满意的客户所取得的成就之中。"],
  ["端到端的服务方案", "从品牌塑造到产品发布，我们满足您所有的设计需求。"],
  ["创新驱动的方法", "我们利用最新的趋势，让您的品牌领先于潮流。"],
];

export function ReactAboutSection() {
  return (
    <section className="react-about relative -mx-14 w-auto overflow-hidden max-lg:-mx-6 max-md:-mx-5">
      <div className="react-about-grid" aria-hidden="true" />
      <div className="react-about-fades pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-290 px-14 py-18 pb-16 max-md:px-5 max-md:py-11">
        <div className="max-w-245 px-1 select-none">
          <p className="react-about-copy font-medium tracking-[0.2px] text-[42px] leading-[1.22] text-primary max-md:text-[28px] max-md:leading-[1.26]">
            我们是企丰科技
            <InlineIcon src={logoImage} className="react-inline-icon--qf" alt="企丰科技" />
            一家以技术驱动为核心，专注企业信息化系统开发与技术服务的团队。深耕软件研发多年，服务多家企业与品牌
            <span className="inline-flex -translate-y-0.5 items-center -space-x-2.5 overflow-visible mx-1.5 align-middle max-md:mx-1.25 max-md:-space-x-2">
              <InlineIcon src={huasenIcon} className="react-inline-icon--a" alt="华森" />
              <InlineIcon src={yunguibaoIcon} className="react-inline-icon--b" alt="云柜宝" />
              <InlineIcon src={budongIcon} className="react-inline-icon--c" alt="布咚音乐" />
            </span>
            。无论是初创企业开拓市场，还是成熟品牌系统升级，我们以创意融合技术，助力商业持续增长。
          </p>
        </div>
        <div className="mt-13 max-w-245 px-1">
          {features.map(([title, description]) => (
            <div key={title} className="flex flex-wrap items-baseline gap-3.5 border-b border-black/5 py-4.5 last:border-0 dark:border-white/6">
              <span className="whitespace-nowrap text-[19px] font-medium leading-[1.32] text-primary max-md:text-base">{title}</span>
              <span className="text-[15px] font-normal leading-[1.64] text-secondary max-md:text-sm">{description}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InlineIcon({ src, alt, className }: { src: string; alt: string; className: string }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`react-inline-icon ${className}`} />;
}
