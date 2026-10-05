/**
 * [INPUT]: 依赖项目索引、项目封面资源和 React 媒体查询生命周期
 * [OUTPUT]: 对外提供 AboutProjectsCarousel，展示桌面轮播与移动项目横滑
 * [POS]: 关于页的伙伴案例区，隔离定时轮播状态并在卸载时清理媒体监听
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useMemo, useRef, useState, type TransitionEvent } from "react";
import { Link } from "react-router-dom";
import { projectList } from "../../data/projects";

type Project = {
  id: string;
  title?: string;
  tag?: string;
  year?: string;
  yearLabel?: string;
  cover: string;
  coverSrcSet?: string;
};

const projects = projectList as Project[];
const coverList = projects.length >= 4 ? projects : [...projects, ...projects, ...projects].slice(0, Math.max(4, projects.length));

function meta(item: Project) {
  return { primary: item.tag || "", secondary: item.yearLabel || item.year || "" };
}

function ProjectCard({ item, className = "" }: { item: Project; className?: string }) {
  const itemMeta = meta(item);
  return (
    <Link to={`/project/${item.id}`} className={`group block min-w-0 ${className}`}>
      <div className="aspect-square w-full overflow-hidden rounded-sm">
        <img
          src={item.cover}
          srcSet={item.coverSrcSet || undefined}
          sizes="(max-width: 768px) 72vw, (max-width: 1280px) 33vw, 26vw"
          alt={item.title || "项目"}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="pt-3 text-left">
        <div className="text-lg font-medium leading-[1.3] text-primary max-md:text-base">{item.title || "项目"}</div>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="font-medium text-primary">{itemMeta.primary}</span>
          <span className="text-secondary">{itemMeta.secondary}</span>
        </div>
      </div>
    </Link>
  );
}

export function AboutProjectsCarousel() {
  const [baseStep, setBaseStep] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const flippedRef = useRef(false);
  const resettingRef = useRef(false);
  const slots = useMemo(() => Array.from({ length: 4 }, (_, slotIndex) => ({
    current: coverList[(baseStep + slotIndex) % coverList.length],
    next: coverList[(baseStep + slotIndex + 1) % coverList.length],
  })), [baseStep]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    let timer: number | null = null;
    const start = () => {
      if (timer !== null || !mediaQuery.matches) return;
      timer = window.setInterval(() => {
        if (flippedRef.current || resettingRef.current) return;
        flippedRef.current = true;
        setIsFlipped(true);
      }, 3500);
    };
    const stop = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };
    const onMediaChange = (event: MediaQueryListEvent) => (event.matches ? start() : stop());
    mediaQuery.addEventListener("change", onMediaChange);
    start();
    return () => {
      stop();
      mediaQuery.removeEventListener("change", onMediaChange);
    };
  }, []);

  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>, slotIndex: number) => {
    if (!isFlipped || slotIndex !== 3 || !["transform", "opacity"].includes(event.propertyName)) return;
    resettingRef.current = true;
    flippedRef.current = false;
    setIsResetting(true);
    setBaseStep((step) => step + 1);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      resettingRef.current = false;
      setIsResetting(false);
    }));
    setIsFlipped(false);
  };

  return (
    <section className="w-full max-md:mt-6">
      <div className="mx-auto hidden w-full max-w-360 px-6 py-14 md:block lg:px-14">
        <div className="mb-8 text-center"><h2 className="text-lg font-medium tracking-[-0.02em] text-primary md:text-3xl">信任我们的企业与伙伴</h2></div>
        <div className="grid min-w-0 grid-cols-4 gap-6 max-lg:grid-cols-2">
          {slots.map((slot, index) => (
            <Link key={index} to={`/project/${slot.current.id}`} className="group block min-w-0">
              <div className="relative min-w-0 overflow-hidden">
                <div className="invisible aspect-square w-full" aria-hidden="true" />
                <div className="invisible h-[5.5rem]" aria-hidden="true" />
                <Cover face={slot.current} active={!isFlipped} resetting={isResetting} delay={index * 0.12} onTransitionEnd={(event) => onTransitionEnd(event, index)} />
                <Cover face={slot.next} active={isFlipped} resetting={isResetting} delay={Math.max(0, index * 0.12 - 0.06)} />
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="-mt-4 w-full md:hidden">
        <div className="mx-auto mt-10 w-full max-w-360 self-stretch overflow-x-hidden">
          <div className="flex w-full items-center justify-between px-5"><h2 className="text-lg font-medium">信任我们的企业与伙伴</h2><Link className="btn-text text-sm" to="/projects">查看全部</Link></div>
          <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-20 pl-5 pr-6 pt-6">
            {projects.slice(0, 3).map((item) => <ProjectCard key={item.id} item={item} className="w-[72%] shrink-0 snap-start" />)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Cover({ face, active, resetting, delay, onTransitionEnd }: { face: Project; active: boolean; resetting: boolean; delay: number; onTransitionEnd?: (event: TransitionEvent<HTMLDivElement>) => void }) {
  const itemMeta = meta(face);
  return (
    <div
      className={`absolute inset-0 flex flex-col transition-[transform,opacity] duration-500 ease-in-out ${active ? "translate-y-0 opacity-100" : "translate-y-[18%] opacity-0"} ${resetting ? "!transition-none" : ""}`}
      style={{ transitionDelay: `${delay}s` }}
      onTransitionEnd={onTransitionEnd}
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-sm"><img src={face.cover} srcSet={face.coverSrcSet || undefined} alt={face.title || "项目"} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" loading="lazy" decoding="async" /></div>
      <div className="shrink-0 pt-3 text-left"><div className="text-lg font-medium leading-[1.3] text-primary">{face.title || "项目"}</div><div className="mt-4 flex items-center gap-2 text-sm"><span className="font-medium text-primary">{itemMeta.primary}</span><span className="text-secondary">{itemMeta.secondary}</span></div></div>
    </div>
  );
}
