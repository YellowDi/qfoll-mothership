/**
 * [INPUT]: 依赖项目、新闻与 Showcase 的既有内容索引
 * [OUTPUT]: 对外提供页面元数据、标题解析、导航归属与项目排序
 * [POS]: React 路由与侧栏的共享语义边界，保持 URL 和内容事实来源一致
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { projects, projectList } from "../data/projects";
import { newsArticles } from "../data/news";

export const brand = "企丰科技";
export const mobileNavMediaQuery = "(max-width: 767.98px)";
export const headerOffset = 72;
export const staticPages = [
  { path: "/", title: brand },
  { path: "/projects", title: "客户案例" },
  { path: "/news", title: "最新动态" },
  { path: "/ygb", title: "云柜宝" },
  { path: "/water-env", title: "水环境智慧监控" },
  { path: "/about", title: "关于我们" },
  { path: "/pricing", title: "定价" },
  { path: "/careers", title: "工作机会" },
  { path: "/design-spec", title: "设计规范" },
];
export const companyMenu = [
  { path: "/about", label: "关于我们" },
  { path: "/pricing", label: "定价" },
  { path: "/careers", label: "工作机会" },
];
export type NavLevel = "root" | "projects" | "company";
export const isCompanyRoute = (path: string) =>
  companyMenu.some((item) => item.path === path) || path === "/design-spec";
export const isProjectRoute = (path: string) => path === "/projects" || path.startsWith("/project/");
export const isAutoHideSidebarRoute = (path: string) => path === "/ygb" || path === "/water-env";
export const navLevelForPath = (path: string): NavLevel =>
  isProjectRoute(path) ? "projects" : isCompanyRoute(path) ? "company" : "root";

export function decodeHash(hash: string): string {
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
}

export function resolvePageTitle(pathname: string): string {
  const path = pathname.replace(/\/$/, "") || "/";
  const exactTitle = staticPages.find((page) => page.path === path.toLowerCase())?.title;
  if (exactTitle) return exactTitle;
  const detail = /^\/(project|news)\/([^/]+)$/i.exec(path);
  if (!detail) return "页面不存在";
  const domain = detail[1].toLowerCase();
  let id = detail[2];
  try { id = decodeURIComponent(id); } catch { /* 保留无效编码，使用领域标题兜底。 */ }
  const index: Record<string, { title?: string }> =
    domain === "project" ? projects : newsArticles;
  const fallback = domain === "project" ? "客户案例" : "最新动态";
  return Object.hasOwn(index, id) ? index[id]?.title || fallback : fallback;
}
export const documentTitleForPath = (path: string) => {
  const title = resolvePageTitle(path);
  return title === brand ? brand : `${title}｜${brand}`;
};

const yearValue = (value: unknown) => {
  const year = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(year) ? year : -Infinity;
};
const monthValue = (value: unknown) => {
  const month = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(month) ? Math.min(12, Math.max(1, month)) : 0;
};
export const sidebarProjects = [...projectList].sort((a, b) => {
  const byYear = yearValue(b.year) - yearValue(a.year);
  if (byYear !== 0 && !Number.isNaN(byYear)) return byYear;
  const byMonth = monthValue(b.startMonth) - monthValue(a.startMonth);
  return byMonth || String(a.title || "").localeCompare(String(b.title || ""), "zh-Hans-CN");
});
