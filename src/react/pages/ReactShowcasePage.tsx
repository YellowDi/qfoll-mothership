/**
 * [INPUT]: 依赖 Showcase 数据索引、ReactCoverImage 媒体边界、交互状态和展示轮播样式
 * [OUTPUT]: 对外提供 ReactShowcasePage，展示原型与技术实验入口
 * [POS]: Showcase 内容列表页面，自动横向轮播并在聚焦/悬停时暂停
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState, type MouseEvent, type TouchEvent } from "react";
import { Link } from "react-router-dom";
import { showcaseList } from "../../data/showcase";
import { ReactCoverImage } from "../components/ReactCoverImage";
import styles from "./ReactShowcasePage.module.css";

type Showcase = { id: string; title: string; shortDesc: string; cover: string; coverSrcSet?: string; coverVideo?: string; coverIcon?: string };
const demos = showcaseList as Showcase[];

export function ReactShowcasePage() {
  const [paused, setPaused] = useState(false);
  const [activeZone, setActiveZone] = useState<"left" | "right" | null>(null);
  const [zonePosition, setZonePosition] = useState<number | null>(null);
  const [touchDragging, setTouchDragging] = useState(false);
  const [touchOffset, setTouchOffset] = useState(0);
  const [animationDelay, setAnimationDelay] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<number | null>(null);
  const velocityRef = useRef(0);
  const touchRef = useRef({ startX: 0, startPosition: 0, dragged: false });
  const marquee = [...demos, ...demos].map((demo, copy) => ({ ...demo, key: `${demo.id}-${copy}` }));
  const readPosition = () => {
    const track = trackRef.current;
    if (!track) return 0;
    const transform = window.getComputedStyle(track).transform;
    const parts = transform.match(/matrix\((.+)\)/)?.[1].split(",").map(Number);
    const pixels = parts && parts.length >= 5 ? parts[4] : 0;
    return track.scrollWidth ? (pixels / track.scrollWidth) * 100 : 0;
  };
  const wrapPosition = (value: number) => { let next = value; while (next > 0) next -= 50; while (next < -50) next += 50; return next; };
  const resumeAnimation = (position: number) => {
    const progress = Math.max(0, Math.min(1, -position / 50));
    setAnimationDelay(`${-progress * 60}s`);
    setZonePosition(null);
    positionRef.current = null;
  };
  useEffect(() => {
    if (!activeZone) return;
    let frame = 0;
    const tick = () => {
      let position = positionRef.current ?? readPosition();
      velocityRef.current = activeZone === "left" ? Math.min(2.8, velocityRef.current + 0.0015) : Math.max(-2.8, velocityRef.current - 0.0015);
      position = wrapPosition(position + velocityRef.current);
      positionRef.current = position;
      setZonePosition(position);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [activeZone]);
  const onViewportMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (touchDragging || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const zoneWidth = rect.width * 0.12;
    const nextZone = x < zoneWidth ? "left" : x > rect.width - zoneWidth ? "right" : null;
    if (nextZone === activeZone) return;
    if (nextZone) {
      const position = positionRef.current ?? readPosition();
      positionRef.current = position;
      setZonePosition(position);
      velocityRef.current = nextZone === "left" ? 0.08 : -0.08;
      setActiveZone(nextZone);
    } else {
      const position = positionRef.current ?? readPosition();
      setActiveZone(null);
      resumeAnimation(position);
    }
  };
  const onViewportLeave = () => {
    if (activeZone) {
      const position = positionRef.current ?? readPosition();
      setActiveZone(null);
      resumeAnimation(position);
    }
  };
  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    const position = positionRef.current ?? readPosition();
    touchRef.current = { startX: event.touches[0].clientX, startPosition: position, dragged: false };
    setTouchDragging(true);
    setActiveZone(null);
    setZonePosition(position);
    setTouchOffset(0);
  };
  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchDragging || event.touches.length !== 1 || !trackRef.current) return;
    const delta = event.touches[0].clientX - touchRef.current.startX;
    const offset = (delta / trackRef.current.scrollWidth) * 100;
    if (Math.abs(delta) > 8) { touchRef.current.dragged = true; event.preventDefault(); }
    setTouchOffset(offset);
  };
  const onTouchEnd = () => {
    if (!touchDragging) return;
    const position = wrapPosition(touchRef.current.startPosition + touchOffset);
    positionRef.current = position;
    resumeAnimation(position);
    setTouchDragging(false);
    setTouchOffset(0);
  };
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (touchRef.current.dragged) { event.preventDefault(); event.stopPropagation(); touchRef.current.dragged = false; }
  };
  const driven = activeZone !== null || touchDragging;
  const trackStyle = driven ? { transform: `translateX(${((touchDragging ? touchRef.current.startPosition + touchOffset : zonePosition) ?? 0)}%)` } : animationDelay ? { animationDelay } : undefined;
  return <section className={styles.page}>
    <div className={styles.hero}><div className="mx-auto w-full max-w-360 px-6 pb-10 pt-20 md:px-14 md:pt-24"><div className="mx-auto w-full max-w-208 text-center"><h1 className="text-[clamp(2rem,4vw+1.5rem,4rem)] font-medium leading-[1.15] tracking-[-0.03em]">Showcase</h1><p className="mt-3 text-base leading-[1.6] text-primary/85">在这里体验我们的原型与技术实验，探索新的交互方式与工程实现。</p></div></div></div>
    <section className={styles.marquee} aria-label="Showcase 列表"><div ref={viewportRef} className={styles.viewport} role="presentation" tabIndex={-1} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") event.preventDefault(); }} onMouseMove={onViewportMouseMove} onMouseLeave={onViewportLeave} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onClickCapture={onClickCapture}><div ref={trackRef} className={`${styles.track} ${paused ? styles.paused : ""} ${driven ? styles.jsDriven : ""}`} style={trackStyle}>{marquee.map((demo) => <Link key={demo.key} to={`/showcase/${demo.id}`} className={styles.card} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}><ReactCoverImage src={demo.cover} srcSet={demo.coverSrcSet} videoSrc={demo.coverVideo} iconClass={demo.coverIcon} className={styles.cover} sizes="(max-width: 768px) 85vw, 480px" alt={demo.title} imageClassName="transition-transform duration-500 ease-out group-hover:scale-[1.02]" /><div className={styles.cardTitle}>{demo.title}</div><p className={styles.cardDesc}>{demo.shortDesc}</p></Link>)}</div></div></section>
    <p className="mx-auto w-full max-w-360 px-6 pb-8 pt-6 text-center text-sm leading-relaxed text-secondary md:px-14">这些演示项目主要用于技术探索与概念验证，其功能与表现形式可能随时调整，不代表最终产品形态。</p>
  </section>;
}
