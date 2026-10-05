/**
 * [INPUT]: 依赖项目/新闻索引、React Router 查询参数和列表卡片数据契约
 * [OUTPUT]: 对外提供 ReactProjectsPage 与 ReactNewsPage，统一筛选、排序和布局切换
 * [POS]: 内容列表页共享编排层，保持 Vue 列表的查询同步规则并隔离浏览器监听
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { projectList } from "../../data/projects";
import { newsList } from "../../data/news";

type ListItem = {
  id: string;
  title?: string;
  lead?: string;
  tag?: string;
  category?: string;
  year?: string;
  yearLabel?: string;
  startMonth?: string;
  publishedAt?: string;
  publishedTimestamp?: number;
  cover?: string;
  coverSrcSet?: string;
};
type ListKind = "projects" | "news";

const projects = projectList as ListItem[];
const news = newsList as ListItem[];

function readList(value: string | null) {
  return value?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
}
function yearsFor(items: ListItem[]) {
  return [...new Set(items.map((item) => Number(item.year)).filter(Number.isFinite))].sort((a, b) => b - a);
}
function yearValue(item: ListItem) { const value = Number.parseInt(String(item.year ?? ""), 10); return Number.isFinite(value) ? value : -Infinity; }
function monthValue(item: ListItem) { const value = Number.parseInt(String(item.startMonth ?? ""), 10); return Number.isFinite(value) ? value : 0; }

export function ReactProjectsPage() {
  return <ReactListPage kind="projects" title="客户案例" items={projects} />;
}
export function ReactNewsPage() {
  return <ReactListPage kind="news" title="最新动态" items={news} />;
}

function ReactListPage({ kind, title, items }: { kind: ListKind; title: string; items: ListItem[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryKey = searchParams.toString();
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sortMode, setSortMode] = useState<"最新" | "最早">("最新");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("全部");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const categoryRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const [categoryFade, setCategoryFade] = useState({ left: false, right: false });
  const tags = useMemo(() => [...new Set(items.map((item) => kind === "projects" ? item.tag : item.category).filter(Boolean) as string[])], [items, kind]);
  const years = useMemo(() => yearsFor(items), [items]);
  const filterTabs = ["全部", ...tags];
  const hasFilters = selectedTags.length > 0 || selectedYears.length > 0;
  const filterText = hasFilters ? [...selectedTags, ...selectedYears.map((year) => `${year}年`)].slice(0, 2).join(" · ") + ([...selectedTags, ...selectedYears].length > 2 ? ` +${[...selectedTags, ...selectedYears].length - 2}` : "") : "筛选";

  useEffect(() => {
    setActiveFilter(searchParams.get("filter") || "全部");
    setSelectedTags(readList(searchParams.get("tags")));
    setSelectedYears(readList(searchParams.get("years")));
  }, [queryKey]);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !filterRef.current?.contains(event.target) && !sortRef.current?.contains(event.target)) { setFilterOpen(false); setSortOpen(false); }
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setFilterOpen(false); setSortOpen(false); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, []);
  useEffect(() => {
    const update = () => { const node = categoryRef.current; if (!node) return; const max = node.scrollWidth - node.clientWidth; setCategoryFade({ left: node.scrollLeft > 1, right: node.scrollLeft < max - 1 }); };
    update(); window.addEventListener("resize", update); categoryRef.current?.addEventListener("scroll", update, { passive: true });
    return () => { window.removeEventListener("resize", update); categoryRef.current?.removeEventListener("scroll", update); };
  }, [tags.length]);

  const replaceQuery = (next: { filter?: string; tags?: string[]; years?: string[] }) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("filter"); nextParams.delete("tags"); nextParams.delete("years");
    if (next.filter && next.filter !== "全部") nextParams.set("filter", next.filter);
    if (next.tags?.length) nextParams.set("tags", next.tags.join(","));
    if (next.years?.length) nextParams.set("years", next.years.join(","));
    setSearchParams(nextParams, { replace: true });
  };
  const toggleTag = (event: ChangeEvent<HTMLInputElement>) => { const values = event.target.checked ? [...selectedTags, event.target.value] : selectedTags.filter((item) => item !== event.target.value); replaceQuery({ filter: activeFilter, tags: values, years: selectedYears }); };
  const toggleYear = (event: ChangeEvent<HTMLInputElement>) => { const values = event.target.checked ? [...selectedYears, event.target.value] : selectedYears.filter((item) => item !== event.target.value); replaceQuery({ filter: activeFilter, tags: selectedTags, years: values }); };
  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const value = kind === "projects" ? item.tag || "" : item.category || "";
      return (activeFilter === "全部" || value.includes(activeFilter)) && (!selectedTags.length || selectedTags.some((tag) => value.includes(tag))) && (!selectedYears.length || selectedYears.includes(String(item.year)));
    });
    return filtered.sort((a, b) => {
      if (kind === "news") { const delta = (a.publishedTimestamp || -Infinity) - (b.publishedTimestamp || -Infinity); return sortMode === "最早" ? delta || String(a.title).localeCompare(String(b.title), "zh-Hans-CN") : -delta || String(a.title).localeCompare(String(b.title), "zh-Hans-CN"); }
      const delta = (yearValue(a) - yearValue(b)) || (monthValue(a) - monthValue(b));
      return (sortMode === "最早" ? delta : -delta) || String(a.title).localeCompare(String(b.title), "zh-Hans-CN");
    });
  }, [activeFilter, items, kind, selectedTags, selectedYears, sortMode]);

  return <section className="mx-auto w-full max-w-360 px-6 pb-20 pt-24 md:px-14">
    <div className="mb-6 flex items-center justify-between"><h1 className="text-4xl font-medium tracking-tight">{title}</h1></div>
    <div className="relative"><div className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <div className="relative min-w-0 max-md:w-full"><div ref={categoryRef} className="no-scrollbar flex items-center gap-6 overflow-x-auto whitespace-nowrap" role="group" aria-label={kind === "projects" ? "案例分类" : "动态分类"}>{filterTabs.map((item) => <button key={item} type="button" className={`shrink-0 transition-colors ${activeFilter === item ? "font-medium text-primary" : "text-secondary hover:text-primary"}`} aria-pressed={activeFilter === item} onClick={() => replaceQuery({ filter: item, tags: selectedTags, years: selectedYears })}>{item}</button>)}</div>{categoryFade.left && <span className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r from-bg to-transparent" aria-hidden="true" />}{categoryFade.right && <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-bg to-transparent" aria-hidden="true" />}</div>
      <div className="flex items-center gap-5 text-sm text-secondary">
        <div ref={filterRef} className="relative"><button type="button" className="btn-text" aria-label="打开筛选选项" aria-haspopup="dialog" aria-expanded={filterOpen} onClick={() => { setFilterOpen((value) => !value); setSortOpen(false); }}><span className="font-medium text-primary">{filterText}</span><i className={filterOpen ? "ri-close-line text-base" : "ri-equalizer-2-line text-base"} aria-hidden="true" /></button>{filterOpen && <FilterPanel tags={tags} years={years} selectedTags={selectedTags} selectedYears={selectedYears} onTag={toggleTag} onYear={toggleYear} hasFilters={hasFilters} onClear={() => replaceQuery({ filter: activeFilter })} />}</div>
        <div ref={sortRef} className="relative"><button type="button" className="btn-text" aria-label="打开排序选项" aria-haspopup="menu" aria-expanded={sortOpen} onClick={() => { setSortOpen((value) => !value); setFilterOpen(false); }}><span className="font-medium text-primary">排序</span><i className={sortOpen ? "ri-arrow-up-s-line text-base" : "ri-arrow-down-s-line text-base"} aria-hidden="true" /></button>{sortOpen && <div className="absolute right-0 z-30 mt-3 w-44 rounded-md border border-edge bg-zinc-100 px-5 py-4 text-[15px] text-primary shadow-sm dark:border-white/10 dark:bg-zinc-900" role="menu" aria-label="排序"><SortOption label="最新 → 最旧" checked={sortMode === "最新"} onClick={() => { setSortMode("最新"); setSortOpen(false); }} /><SortOption label="最旧 → 最新" checked={sortMode === "最早"} onClick={() => { setSortMode("最早"); setSortOpen(false); }} /></div>}</div>
        <div className="flex items-center gap-1"><button type="button" className={`p-2.5 ${layout === "grid" ? "text-primary" : "text-secondary"}`} aria-label="网格视图" aria-pressed={layout === "grid"} onClick={() => setLayout("grid")}><i className="ri-grid-fill text-lg" aria-hidden="true" /></button><button type="button" className={`p-2.5 ${layout === "list" ? "text-primary" : "text-secondary"}`} aria-label="列表视图" aria-pressed={layout === "list"} onClick={() => setLayout("list")}><i className="ri-list-check-2 text-lg" aria-hidden="true" /></button></div>
      </div>
    </div></div>
    {layout === "grid" ? <div className="mt-8 grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">{visibleItems.map((item) => <GridCard key={item.id} item={item} kind={kind} />)}</div> : <div className="mt-8 border-y border-line">{visibleItems.map((item) => <ListRow key={item.id} item={item} kind={kind} />)}</div>}
    {visibleItems.length === 0 && <p className="py-20 text-center text-secondary">没有符合条件的内容</p>}
  </section>;
}

function FilterPanel({ tags, years, selectedTags, selectedYears, onTag, onYear, hasFilters, onClear }: { tags: string[]; years: number[]; selectedTags: string[]; selectedYears: string[]; onTag: (event: ChangeEvent<HTMLInputElement>) => void; onYear: (event: ChangeEvent<HTMLInputElement>) => void; hasFilters: boolean; onClear: () => void }) {
  return <div className="absolute right-0 z-30 mt-3 w-90 max-w-[calc(100vw-2rem)] rounded-md border border-edge bg-zinc-100 px-6 py-5 text-[15px] text-primary shadow-sm dark:border-white/10 dark:bg-zinc-900" role="dialog" aria-label="筛选选项"><div className="grid grid-cols-2 gap-6 max-md:grid-cols-1"><CheckGroup title="主题" options={tags} selected={selectedTags} onChange={onTag} /><CheckGroup title="年份" options={years.map(String)} selected={selectedYears} onChange={onYear} suffix=" 年" /></div><div className="mt-5 flex justify-end"><button type="button" className="text-[15px] font-medium text-primary" onClick={onClear}>{hasFilters ? "清除筛选" : "取消"}</button></div></div>;
}
function CheckGroup({ title, options, selected, onChange, suffix = "" }: { title: string; options: string[]; selected: string[]; onChange: (event: ChangeEvent<HTMLInputElement>) => void; suffix?: string }) { return <div><div className="mb-3 text-sm text-secondary">{title}</div><div className="max-h-55 space-y-2 overflow-auto pr-2">{options.map((option) => <label key={option} className="flex items-center gap-3 text-[15px]"><input type="checkbox" className="h-4 w-4 rounded border-edge bg-transparent text-primary" value={option} checked={selected.includes(option)} onChange={onChange} /><span>{option}{suffix}</span></label>)}</div></div>; }
function SortOption({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) { return <button type="button" className="flex w-full items-center gap-3 py-1.5" role="menuitemradio" aria-checked={checked} onClick={onClick}><span className="flex h-4 w-4 items-center justify-center rounded-full border border-edge"><span className={checked ? "h-2.5 w-2.5 rounded-full bg-ink" : ""} /></span>{label}</button>; }
function GridCard({ item, kind }: { item: ListItem; kind: ListKind }) { const primary = kind === "projects" ? item.tag : item.category; const secondary = kind === "projects" ? item.yearLabel || item.year : item.publishedAt; return <Link to={`/${kind === "projects" ? "project" : "news"}/${item.id}`} className="group"><div className="overflow-hidden rounded-sm"><img src={item.cover} srcSet={item.coverSrcSet || undefined} alt={item.title || "内容"} className="aspect-square w-full rounded-sm object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" loading="lazy" decoding="async" /></div><div className="pt-3 text-left"><div className="text-lg font-medium leading-[1.3] text-primary max-md:text-base">{item.title}</div><div className="mt-4 flex items-center gap-2 text-sm"><span className="font-medium text-primary">{primary}</span><span className="text-secondary">{secondary}</span></div></div></Link>; }
function ListRow({ item, kind }: { item: ListItem; kind: ListKind }) { const primary = kind === "projects" ? item.tag || "客户案例" : item.category || "最新动态"; const secondary = kind === "projects" ? item.yearLabel || item.year : item.publishedAt; return <Link to={`/${kind === "projects" ? "project" : "news"}/${item.id}`} className="group grid grid-cols-12 gap-6 border-b border-line py-7 transition-colors hover:border-primary/55 hover:text-primary"><div className="col-span-12 text-sm text-secondary md:col-span-3"><div className="text-[15px] font-medium text-primary">{primary}</div><div className="mt-2 text-sm text-secondary">{secondary}</div></div><div className="col-span-12 md:col-span-9"><div className="text-[17px] font-medium text-primary">{item.title}</div><div className="mt-2 text-sm text-secondary">{item.lead}</div></div></Link>; }
