/**
 * [INPUT]: 依赖项目、新闻索引、React 内容媒体和首页品牌区块
 * [OUTPUT]: 对外提供 ReactHomePage，复刻首页品牌、案例、动态和标签舞台
 * [POS]: 根路由首页编排边界，保持 Vue 首页的信息密度与视觉层级
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Link } from "react-router-dom";
import { newsList } from "../../data/news";
import { projectList } from "../../data/projects";
import { ReactCoverImage } from "../components/ReactCoverImage";
import { ReactAboutSection } from "./ReactAboutSection";
import { ReactTagMarqueeSection } from "./ReactTagMarqueeSection";
import { ReactYgbPreview } from "./ReactYgbPreview";
import "./ReactHomePage.css";

const toNumber = (value: unknown, fallback: number) => {
  const number = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(number) ? number : fallback;
};

export function ReactHomePage() {
  const sortedProjects = [...projectList].sort((a, b) => toNumber(b.year, -Infinity) - toNumber(a.year, -Infinity) || toNumber(b.startMonth, 0) - toNumber(a.startMonth, 0) || String(a.title).localeCompare(String(b.title), "zh-Hans-CN"));
  const sideProjects = sortedProjects.filter((item) => item.id !== "ygb").slice(0, 3);
  const latestNews = [...newsList].sort((a, b) => b.publishedTimestamp - a.publishedTimestamp).slice(0, 6);

  return (
    <div className="w-full px-14 pb-20 pt-14 max-lg:px-6 max-md:px-5 max-md:pb-12 max-md:pt-14">
      <h1 className="sr-only">企丰科技</h1>
      <ReactAboutSection />

      <section className="mx-auto mt-16 w-full max-w-360">
        <div className="flex w-full items-center justify-between"><h2 className="text-lg font-medium">客户案例</h2><Link className="btn-text text-sm" to="/projects">查看全部</Link></div>
        <div className="w-full pb-10 pt-6 max-md:pb-8">
          <div className="grid grid-cols-12 gap-6 max-md:gap-4">
            <div className="col-span-12 self-start min-[1280px]:sticky min-[1280px]:top-17 min-[1280px]:col-span-8"><ReactYgbPreview /></div>
            <div className="col-span-12 hidden grid-cols-3 gap-6 max-[1279px]:grid min-[1280px]:col-span-4 min-[1280px]:flex min-[1280px]:flex-col max-md:hidden">
              {sideProjects.map((item) => <ProjectCard key={item.id} item={item} />)}
            </div>
          </div>
          <div className="mt-4 hidden grid-cols-1 gap-6 max-md:grid">{sideProjects.map((item) => <ProjectCard key={`mobile-${item.id}`} item={item} />)}</div>
          <div className="mt-16 flex justify-center max-md:mt-6"><Link to="/projects" className="btn-neutral btn-neutral-primary">查看更多</Link></div>
        </div>
      </section>

      <section className="mx-auto mt-16 w-full max-w-360">
        <div className="flex w-full items-center justify-between"><h2 className="text-lg font-medium">最新动态</h2><Link className="btn-text btn-text-primary text-sm" to="/news">查看更多</Link></div>
        <div className="w-full pt-6">
          <div className="grid grid-flow-row grid-cols-1 gap-y-6 lg:grid-cols-2 lg:gap-x-6 xl:gap-x-10 xl:gap-y-8">
            {latestNews.map((item) => <NewsCard key={item.id} item={item} />)}
          </div>
          <div className="mt-6 flex justify-center xl:mt-16"><Link to="/news" className="btn-neutral btn-neutral-primary">查看更多</Link></div>
        </div>
      </section>

      <ReactTagMarqueeSection />
    </div>
  );
}

type CardItem = (typeof projectList)[number];
function ProjectCard({ item }: { item: CardItem }) {
  return <Link to={`/project/${item.id}`} className="group block"><div className="aspect-square overflow-hidden rounded-md"><ReactCoverImage src={item.cover} srcSet={item.coverSrcSet} videoSrc={item.coverVideo} iconClass={item.coverIcon} enableVideoCover className="rounded-md" sizes="(max-width: 768px) 72vw, (max-width: 1280px) 33vw, 26vw" alt={item.title} imageClassName="transition-transform duration-500 ease-out group-hover:scale-[1.03]" /></div><div className="pt-3 text-left"><div className="text-xl font-medium leading-[1.3] text-primary max-md:text-lg">{item.title}</div><div className="mt-4 flex items-center gap-2 text-sm"><span className="font-medium text-primary">{item.tag}</span><span className="text-secondary">{item.yearLabel || item.year}</span></div></div></Link>;
}

type NewsItem = (typeof newsList)[number];
function NewsCard({ item }: { item: NewsItem }) {
  return <Link to={`/news/${item.id}`} className="group grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-2 lg:grid-cols-[minmax(0,12rem)_1fr] lg:gap-4"><div className="aspect-square overflow-hidden rounded-md"><ReactCoverImage src={item.cover} srcSet={item.coverSrcSet} videoSrc={item.coverVideo} iconClass={item.coverIcon} enableVideoCover className="rounded-md" sizes="(max-width: 1023px) 9rem, 12rem" alt={item.title} imageClassName="transition-transform duration-500 ease-out group-hover:scale-[1.03]" /></div><div className="flex min-h-full flex-col justify-center py-1.5 pl-2 pr-6 text-left lg:max-w-[36rem] lg:py-2 lg:pl-4 lg:pr-8 xl:pr-10"><div className="text-base font-medium leading-[1.3] text-primary lg:text-lg">{item.title}</div><div className="mt-4 flex items-center gap-2 text-sm"><span className="font-medium text-primary">{item.category}</span><span className="text-secondary">{item.publishedAt}</span></div></div></Link>;
}
