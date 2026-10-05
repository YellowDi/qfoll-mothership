/**
 * [INPUT]: 依赖 Showcase 详情索引、详情交互 hook 和相关内容组件
 * [OUTPUT]: 对外提供 React Showcase 详情页
 * [POS]: Showcase 内容域的左右 Hero、能力说明、技术栈与相关演示渲染入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useMemo, useRef } from "react";
import { Navigate, useParams } from "react-router-dom";
import { showcaseById, showcaseList } from "../../data/showcase";
import { useDetailHeaderBarToc } from "../hooks/useDetailHeaderBarToc";
import { useReactDetailPageInteractions } from "../hooks/useReactDetailPageInteractions";
import { ReactRelatedContentSection } from "../components/ReactRelatedContentSection";

type Demo = { id: string; title: string; shortDesc: string; description: string; coreCapabilities?: { title: string; desc: string }[]; useCases?: string[]; cover?: string; coverSrcSet?: string; demoUrl?: string; repoUrl?: string; techStack: string[]; type: string };

export function ReactShowcaseDetailPage() {
  const { id = "" } = useParams();
  const demo = (showcaseById as Record<string, Demo>)[id];
  const titleSectionRef = useRef<HTMLDivElement>(null); const contentRootRef = useRef<HTMLDivElement>(null);
  const { copiedVisible, copyShareLink } = useReactDetailPageInteractions({ markdownRef: contentRootRef, contentKey: id });
  useDetailHeaderBarToc({ pageTitle: demo?.title || "Showcase", contentKey: id, titleSectionRef, contentRootRef });
  const related = useMemo(() => (showcaseList as Demo[]).filter((item) => item.id !== id).slice(0, 3), [id]);
  if (!demo) return <Navigate to="/showcase" replace />;
  return <>
    <section className="mx-auto w-full max-w-360 px-6 pb-16 pt-20 md:px-14 md:pt-24"><div className="flex w-full flex-col gap-10 md:flex-row md:items-end md:gap-12"><div ref={titleSectionRef} className="order-1 flex min-w-0 flex-col md:flex-1 md:justify-end"><div className="mb-5 flex items-center gap-4 text-sm"><span className="font-medium text-primary">Showcase</span><span className="text-secondary">{demo.type}</span></div><h1 className="max-w-[28em] text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),3.75rem)] font-medium leading-[1.2] tracking-[-0.03em]">{demo.title}</h1><p className="mt-4 text-base leading-[1.72] text-primary/80">{demo.shortDesc}</p>{(demo.demoUrl || demo.repoUrl) && <div className="mt-8 flex flex-wrap items-center gap-3">{demo.repoUrl && <a href={demo.repoUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm gap-2"><i className="ri-github-fill text-sm" aria-hidden="true" />GitHub</a>}{demo.demoUrl && <a href={demo.demoUrl} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm gap-2">访问 Demo<i className="ri-arrow-right-line text-sm" aria-hidden="true" /></a>}</div>}<div className="mt-6"><button className="btn-base relative gap-2 px-2 py-1 text-primary hover:text-secondary" type="button" aria-label="复制当前页面链接" onClick={() => void copyShareLink()}><i className="ri-share-line text-base" aria-hidden="true" />分享{copiedVisible && <span role="status" aria-live="polite" className="absolute left-1/2 top-full z-20 mt-2 inline-flex min-w-21 -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-xl border border-edge bg-surface px-4 py-3 text-sm font-medium leading-none text-primary shadow-sm">已复制</span>}</button></div></div><div className="order-2 flex justify-center md:flex-1 md:min-w-0 xl:min-w-[560px] xl:flex-[1.15]"><div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black/5 dark:bg-white/5"><img src={demo.cover} srcSet={demo.coverSrcSet || undefined} alt={`${demo.title} 截图`} className="h-full w-full object-cover" /></div></div></div></section>
    <div ref={contentRootRef} className="mx-auto mt-12 w-full max-w-360 px-6 pb-10 md:px-14"><div className="mx-auto w-full max-w-[40rem] space-y-8"><p className="text-base leading-[1.8] text-primary">{demo.description}</p>{Boolean(demo.coreCapabilities?.length) && <section className="space-y-4"><h2 className="text-lg font-medium">核心能力</h2><ul className="space-y-3">{demo.coreCapabilities?.map((cap) => <li key={cap.title} className="text-base leading-[1.8]"><span className="font-medium">{cap.title}：</span><span className="text-primary/90">{cap.desc}</span></li>)}</ul></section>}{Boolean(demo.useCases?.length) && <section className="space-y-3"><h2 className="text-lg font-medium">典型使用场景</h2><ul className="list-inside list-disc space-y-1.5 text-base leading-[1.8] text-primary/90">{demo.useCases?.map((useCase) => <li key={useCase}>{useCase}</li>)}</ul></section>}</div><div className="mx-auto w-full max-w-360 py-10"><div className="grid grid-cols-12 rounded-md bg-zinc-100 px-3 py-6 dark:bg-zinc-800/35 md:py-10"><div className="col-span-12 md:col-span-6 md:col-start-4"><h2 className="mb-3 text-sm font-medium text-secondary">技术栈</h2><ul className="flex flex-wrap gap-2">{demo.techStack.map((tech) => <li key={tech}><span className="btn-chip">{tech}</span></li>)}</ul></div></div></div><ReactRelatedContentSection title="更多演示" viewAllTo="/showcase" items={related} itemTo={(item) => `/showcase/${item.id}`} primaryMeta={(item) => item.techStack?.[0] || item.type || ""} secondaryMeta={(item) => item.type || ""} /></div>
  </>;
}
