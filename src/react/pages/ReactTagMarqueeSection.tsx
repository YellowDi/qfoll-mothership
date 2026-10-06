/**
 * [INPUT]: 依赖品牌标签、关于页跳转、主题上下文和原版标签墙轨道配置
 * [OUTPUT]: 对外提供 ReactTagMarqueeSection，呈现标签舞台和品牌收束文案
 * [POS]: React 首页底部品牌展示区域
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Link } from "react-router-dom";
import { useTheme } from "../providers/ThemeProvider";
import "./ReactTagMarqueeSection.css";

const baseWords = [
  "远程监控", "SaaS", "货运管理", "水站监控", "数据大屏", "产品目录", "在线表单", "设备巡检",
  "在线教育", "品牌升级", "仓管系统", "在线商城", "车辆轨迹", "票务核销", "场景模板", "会员体系",
  "大数据分析", "微信小程序", "兑换核销", "在线视频", "企业管理", "设计框架", "流程引擎", "可视化报表",
];
const stripeConfigs = [
  { index: 0, duration: "540s", direction: "normal" },
  { index: 1, duration: "620s", direction: "reverse" },
  { index: 2, duration: "580s", direction: "normal" },
  { index: 3, duration: "660s", direction: "reverse" },
  { index: 4, duration: "520s", direction: "normal" },
  { index: 5, duration: "700s", direction: "reverse" },
];

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed(items: string[], seed: number) {
  const next = [...items];
  const random = mulberry32(seed);
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

const stripes = stripeConfigs.map((stripe, stripeIndex) => {
  const words = shuffleWithSeed(baseWords, 20260213 + stripeIndex * 97);
  const offset = (stripeIndex * 3) % words.length;
  const rotated = [...words.slice(offset), ...words.slice(0, offset)];
  const ordered = stripeIndex % 2 === 0 ? rotated : [...rotated].reverse();
  const phase = mulberry32(8800 + stripeIndex * 71)();
  const seconds = Number.parseFloat(stripe.duration);
  return { ...stripe, words: ordered, delay: `-${(seconds * phase).toFixed(1)}s` };
});

export function ReactTagMarqueeSection() {
  const { isDark } = useTheme();

  return (
    <section className="tilt-wall-section relative -mx-14 mt-14 w-auto overflow-hidden max-lg:-mx-6 max-md:-mx-5 max-md:mt-10">
      <div className="relative w-full pb-16 max-md:pb-11">
        <div className={`tilt-wall${isDark ? " tilt-wall--dark" : ""}`}>
          <div className="tilt-wall__scene" aria-hidden="true">
            <div className="tilt-wall__text-layer">
              {stripes.map((stripe) => (
                <div key={stripe.index} className="tilt-wall__stripe" style={{ "--stripe-index": stripe.index } as React.CSSProperties}>
                  <div className="tilt-wall__track" style={{ "--tilt-duration": stripe.duration, "--tilt-direction": stripe.direction, "--tilt-delay": stripe.delay } as React.CSSProperties}>
                    {[...stripe.words, ...stripe.words].map((word, index) => <span key={`${stripe.index}-${index}`} className="tilt-wall__word">{word}</span>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="tilt-wall__grain" />
          </div>
          <div className="tilt-wall__edge-blend" />
          <div className="tilt-wall__content">
            <div className="tilt-wall__content-inner">
              <div className="tilt-wall__headline mx-auto w-full max-w-245 text-left">
                <p className="tilt-wall__title-muted tilt-wall__title-line text-[44px] font-medium leading-[1.18] max-md:text-[clamp(1.32rem,6.8vw,2.05rem)]">每个专业领域都各有特色，</p>
                <p className="tilt-wall__title-main tilt-wall__title-line mt-3 text-[44px] font-medium leading-[1.18] max-md:text-[clamp(1.32rem,6.8vw,2.05rem)]">您的想法，我们心领神会</p>
              </div>
              <div className="mx-auto mt-10 w-full max-w-245 text-left max-md:mt-7">
                <p className="tilt-wall__body text-lg leading-[1.88] max-md:text-base">以智能化与标准化为底座，我们为企业构建更高效、更低成本的数字运营体系。<br />聚焦 <span className="tilt-wall__body-strong font-medium">数智水利 · 智慧交通 · 网络货运 · 在线教育与商城独立站</span> 四大方向，持续输出可落地的数字化能力。</p>
                <Link to="/about" className="pointer-events-auto mt-8 btn-primary btn-md inline-flex gap-2 px-5 max-md:mt-6">了解更多<i className="ri-arrow-right-line text-base" aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
