/**
 * [INPUT]: 依赖 Showcase 数据索引、React 交互状态和展示轮播样式
 * [OUTPUT]: 对外提供 ReactShowcasePage，展示原型与技术实验入口
 * [POS]: Showcase 内容列表页面，自动横向轮播并在聚焦/悬停时暂停
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { showcaseList } from "../../data/showcase";
import styles from "./ReactShowcasePage.module.css";

type Showcase = { id: string; title: string; shortDesc: string; cover: string; coverSrcSet?: string };
const demos = showcaseList as Showcase[];

export function ReactShowcasePage() {
  const [paused, setPaused] = useState(false);
  const marquee = [...demos, ...demos];
  return <section className={styles.page}>
    <div className={styles.hero}><div className="mx-auto w-full max-w-360 px-6 pb-10 pt-20 md:px-14 md:pt-24"><div className="mx-auto w-full max-w-208 text-center"><h1 className="text-[clamp(2rem,4vw+1.5rem,4rem)] font-medium leading-[1.15] tracking-[-0.03em]">Showcase</h1><p className="mt-3 text-base leading-[1.6] text-primary/85">在这里体验我们的原型与技术实验，探索新的交互方式与工程实现。</p></div></div></div>
    <section className={styles.marquee} aria-label="Showcase 列表"><div className={styles.viewport}><div className={`${styles.track} ${paused ? styles.paused : ""}`}>{marquee.map((demo, index) => <Link key={`${demo.id}-${index}`} to={`/showcase/${demo.id}`} className={styles.card} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}><div className={styles.cover}><img src={demo.cover} srcSet={demo.coverSrcSet || undefined} alt={demo.title} loading="lazy" decoding="async" /></div><div className={styles.cardTitle}>{demo.title}</div><p className={styles.cardDesc}>{demo.shortDesc}</p></Link>)}</div></div></section>
    <p className="mx-auto w-full max-w-360 px-6 pb-8 pt-6 text-center text-sm leading-relaxed text-secondary md:px-14">这些演示项目主要用于技术探索与概念验证，其功能与表现形式可能随时调整，不代表最终产品形态。</p>
  </section>;
}
