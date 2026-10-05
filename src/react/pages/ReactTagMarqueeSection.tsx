/**
 * [INPUT]: 依赖品牌标签、关于页跳转和 CSS 轨道动画
 * [OUTPUT]: 对外提供 ReactTagMarqueeSection，呈现标签舞台和品牌收束文案
 * [POS]: React 首页底部品牌展示区域，复刻 Vue 标签墙的信息密度与斜向运动
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Link } from "react-router-dom";
import "./ReactTagMarqueeSection.css";

const tags = ["远程监控", "SaaS", "货运管理", "水站监控", "数据大屏", "产品目录", "在线表单", "设备巡检", "在线教育", "品牌升级", "仓管系统", "在线商城", "车辆轨迹", "票务核销", "场景模板", "会员体系", "大数据分析", "微信小程序", "兑换核销", "在线视频", "企业管理", "设计框架", "流程引擎", "可视化报表"];
const stripes = [0, 1, 2, 3, 4, 5].map((index) => ({
  index,
  direction: index % 2 ? "reverse" : "normal",
  duration: `${540 + index * 28}s`,
  words: [...tags.slice(index * 3), ...tags.slice(0, index * 3)],
}));

export function ReactTagMarqueeSection() {
  return (
    <section className="react-tilt-wall-section relative -mx-14 mt-14 w-auto overflow-hidden max-lg:-mx-6 max-md:-mx-5 max-md:mt-10">
      <div className="react-tilt-wall">
        <div className="react-tilt-scene" aria-hidden="true">
          {stripes.map((stripe) => (
            <div key={stripe.index} className="react-tilt-stripe" style={{ "--stripe-index": stripe.index, "--tilt-duration": stripe.duration, "--tilt-direction": stripe.direction } as React.CSSProperties}>
              <div className="react-tilt-track">
                {[...stripe.words, ...stripe.words].map((word, index) => <span key={`${stripe.index}-${index}`} className="react-tilt-word">{word}</span>)}
              </div>
            </div>
          ))}
          <div className="react-tilt-grain" />
        </div>
        <div className="react-tilt-edge" />
        <div className="react-tilt-content">
          <div className="mx-auto w-full max-w-245 text-left">
            <p className="react-tilt-title-muted text-[44px] font-medium leading-[1.18] max-md:text-[clamp(1.32rem,6.8vw,2.05rem)]">每个专业领域都各有特色，</p>
            <p className="react-tilt-title-main mt-3 text-[44px] font-medium leading-[1.18] max-md:text-[clamp(1.32rem,6.8vw,2.05rem)]">您的想法，我们心领神会</p>
            <p className="react-tilt-body mt-10 text-lg leading-[1.88] max-md:mt-7 max-md:text-base">
              以智能化与标准化为底座，我们为企业构建更高效、更低成本的数字运营体系。<br />
              聚焦 <strong>数智水利 · 智慧交通 · 网络货运 · 在线教育与商城独立站</strong> 四大方向，持续输出可落地的数字化能力。
            </p>
            <Link to="/about" className="btn-primary btn-md pointer-events-auto mt-8 inline-flex gap-2 px-5 max-md:mt-6">了解更多 <i className="ri-arrow-right-line" aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
