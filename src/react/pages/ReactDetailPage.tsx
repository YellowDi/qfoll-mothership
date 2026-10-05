/**
 * [INPUT]: 依赖项目/新闻数据索引、详情交互 hooks、元信息与相关内容组件
 * [OUTPUT]: 对外提供 ReactProjectDetailPage、ReactNewsDetailPage
 * [POS]: 项目与新闻详情的共享页面骨架，保持标题、Markdown、标签和推荐内容同构
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useMemo, useRef, type RefObject } from "react";
import { useParams } from "react-router-dom";
import { newsArticles, newsList } from "../../data/news";
import { projects, projectList } from "../../data/projects";
import { mapInfoTagsToLinks } from "../../composables/useInfoTagLinks";
import { useDetailHeaderBarToc } from "../hooks/useDetailHeaderBarToc";
import { useReactDetailPageInteractions } from "../hooks/useReactDetailPageInteractions";
import { ReactArticleSpeechPlayer } from "../components/ReactArticleSpeechPlayer";
import { ReactDetailMetaCard } from "../components/ReactDetailMetaCard";
import { ReactRelatedContentSection } from "../components/ReactRelatedContentSection";

type Article = { id: string; title: string; lead?: string; bodyHtml?: string; year?: string | number; yearLabel?: string; tag?: string; category?: string; publishedAt?: string; publishedAtRaw?: string; publishedTimestamp?: number; company?: string; infoTags?: string[]; infoPanelHtml?: string; primaryButtonText?: string; primaryButtonUrl?: string; secondaryButtonText?: string; secondaryButtonUrl?: string };
type DetailKind = "project" | "news";
type TagLink = { label: string; to: { path: string; query?: Record<string, string> } };

const linkProps = (url: string) => /^https?:\/\//i.test(url) ? { target: "_blank", rel: "noreferrer" } : {};

function DetailActionLinks({ item }: { item: Article }) {
  const hasActions = Boolean((item.primaryButtonText && item.primaryButtonUrl) || (item.secondaryButtonText && item.secondaryButtonUrl));
  if (!hasActions) return null;
  return <div className="mt-5 flex items-center justify-center gap-1.5">{item.primaryButtonText && item.primaryButtonUrl && <a className="btn-primary btn-sm" href={item.primaryButtonUrl} {...linkProps(item.primaryButtonUrl)}>{item.primaryButtonText}</a>}{item.secondaryButtonText && item.secondaryButtonUrl && <a className="btn-secondary btn-sm gap-1" href={item.secondaryButtonUrl} {...linkProps(item.secondaryButtonUrl)}>{item.secondaryButtonText}<i className="ri-arrow-right-s-fill text-sm" aria-hidden="true" /></a>}</div>;
}

function DetailHero({ item, kind, titleRef }: { item: Article; kind: DetailKind; titleRef: RefObject<HTMLDivElement | null> }) {
  const isNews = kind === "news";
  return <div ref={titleRef} className="mx-auto w-full max-w-208"><div className="mb-8 flex items-center justify-center gap-4 text-sm"><span className="font-medium text-primary">{isNews ? <time dateTime={item.publishedAtRaw || undefined}>{item.publishedAt}</time> : item.yearLabel || item.year}</span><span className="text-secondary">{isNews ? item.category || "最新动态" : item.tag || "客户案例"}</span></div><h1 className="text-center text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),4rem)] font-medium leading-[clamp(2.28rem,calc(2.28rem+1.72*((100vw-23.4375rem)/66.5625)),4rem)] tracking-[-0.03em]">{item.title}</h1>{item.lead && <p className="mt-6 text-center text-base leading-[1.8] text-primary">{item.lead}</p>}<DetailActionLinks item={item} /></div>;
}

function DetailToolbar({ articleRef, contentKey, copiedVisible, onShare }: { articleRef: RefObject<HTMLDivElement | null>; contentKey: string; copiedVisible: boolean; onShare: () => void }) {
  return <div className="w-full pt-20"><div className="mx-auto w-full max-w-[40rem]"><div className="flex w-full items-center justify-between gap-4 border-t border-line pt-3 max-md:flex-wrap"><ReactArticleSpeechPlayer containerRef={articleRef} contentKey={contentKey} /><button className="btn-base relative gap-2 px-2 py-1 text-primary hover:text-secondary" type="button" aria-label="复制当前页面链接" onClick={onShare}><i className="ri-share-line text-base" aria-hidden="true" />分享{copiedVisible && <span role="status" aria-live="polite" className="absolute left-1/2 top-full z-20 mt-2 inline-flex min-w-21 -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-xl border border-edge bg-surface px-4 py-3 text-sm font-medium leading-none text-primary shadow-sm">已复制</span>}</button></div></div></div>;
}

function sameTagScore(item: Article, current: Article) { return Number(Boolean(item.tag && item.tag === current.tag)); }

function relatedFor(kind: DetailKind, current: Article) {
  const source = kind === "project" ? projectList as Article[] : newsList as Article[];
  const others = source.filter((item) => item.id !== current.id);
  if (kind === "project") return [...others].sort((a, b) => sameTagScore(b, current) - sameTagScore(a, current) || Number(b.year || 0) - Number(a.year || 0)).slice(0, 3);
  return [...others].sort((a, b) => Number(b.category === current.category) - Number(a.category === current.category) || (b.publishedTimestamp || 0) - (a.publishedTimestamp || 0)).slice(0, 3);
}

export function ReactDetailPage({ kind }: { kind: DetailKind }) {
  const { id = "" } = useParams();
  const fallback = kind === "project" ? (projects as Record<string, Article>).hzhst : (newsList as Article[])[0];
  const item = (kind === "project" ? (projects as Record<string, Article>)[id] : (newsArticles as Record<string, Article>)[id]) || fallback;
  const titleSectionRef = useRef<HTMLDivElement>(null); const articleContentRef = useRef<HTMLDivElement>(null); const markdownRef = useRef<HTMLDivElement>(null);
  const { copiedVisible, copyShareLink } = useReactDetailPageInteractions({ markdownRef, contentKey: id });
  useDetailHeaderBarToc({ pageTitle: item.title, contentKey: id, titleSectionRef, contentRootRef: markdownRef });
  const related = useMemo(() => relatedFor(kind, item), [kind, item]);
  const infoTagLinks = mapInfoTagsToLinks(item.infoTags || [], kind === "project" ? "/projects" : "/news") as TagLink[];
  const isNews = kind === "news";
  return <><div className="mx-auto w-full max-w-360 px-6 pb-10 pt-20 md:px-14 md:pt-24"><DetailHero item={item} kind={kind} titleRef={titleSectionRef} /><DetailToolbar articleRef={articleContentRef} contentKey={id} copiedVisible={copiedVisible} onShare={() => void copyShareLink()} /></div><article ref={articleContentRef} className="mx-auto w-full max-w-full overflow-x-clip px-0 pb-20 pt-6 font-sans text-base leading-relaxed text-primary" aria-label={isNews ? "文章正文" : "项目正文"}><div ref={markdownRef} className="markdown-body detail-markdown-body" dangerouslySetInnerHTML={{ __html: item.bodyHtml || "" }} /></article><ReactDetailMetaCard infoTagLinks={infoTagLinks} company={item.company} infoPanelHtml={item.infoPanelHtml} /><ReactRelatedContentSection title={isNews ? "继续阅读" : "更多项目"} viewAllTo={isNews ? "/news" : "/projects"} items={related} itemTo={(relatedItem) => `/${isNews ? "news" : "project"}/${relatedItem.id}`} primaryMeta={(relatedItem) => isNews ? relatedItem.tag || "最新动态" : relatedItem.tag || "客户案例"} secondaryMeta={(relatedItem) => isNews ? relatedItem.publishedAt || "" : relatedItem.yearLabel || relatedItem.year || ""} /></>;
}

export function ReactProjectDetailPage() { return <ReactDetailPage kind="project" />; }
export function ReactNewsDetailPage() { return <ReactDetailPage kind="news" />; }
