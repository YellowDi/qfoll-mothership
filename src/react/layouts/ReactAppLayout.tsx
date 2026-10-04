/**
 * [INPUT]: 依赖 React Router、项目数据、主题上下文、顶栏和页脚组件
 * [OUTPUT]: 对外提供 React 迁移层应用布局
 * [POS]: React 应用的公共外壳，承接侧栏、移动端遮罩、主内容和页面标题
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { projectList } from "../../data/projects";
import { ReactHeaderBar } from "../components/ReactHeaderBar";
import { ReactSiteFooter } from "../components/ReactSiteFooter";
import { useTheme } from "../providers/ThemeProvider";

const brand = "企丰科技";
const companyMenu = [
  { path: "/about", label: "关于我们" },
  { path: "/pricing", label: "定价" },
  { path: "/careers", label: "工作机会" },
];

const routeTitles: Record<string, string> = {
  "/": brand,
  "/projects": "客户案例",
  "/showcase": "Showcase",
  "/news": "最新动态",
  "/about": "关于我们",
  "/pricing": "定价",
  "/careers": "工作机会",
  "/design-spec": "设计规范",
  "/changelog": "更新日志",
  "/ygb": "云柜宝",
  "/water-env": "水环境智慧监控",
  "/internal/trash-duty-9f3k": "内部值日表",
};

const isCompanyRoute = (path: string) => companyMenu.some((item) => item.path === path);
const isAutoHideSidebarRoute = (path: string) => path === "/ygb" || path === "/water-env";
const withBrandSuffix = (title: string) => (title === brand ? brand : `${title}｜${brand}`);

export function ReactAppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() =>
    isAutoHideSidebarRoute(location.pathname),
  );
  const [navLevel, setNavLevel] = useState<"root" | "projects" | "company">(() =>
    location.pathname.startsWith("/project") || location.pathname === "/projects"
      ? "projects"
      : isCompanyRoute(location.pathname)
        ? "company"
        : "root",
  );

  const sortedProjects = useMemo(
    () =>
      [...projectList].sort((a, b) => {
        const byYear = Number(b.year || 0) - Number(a.year || 0);
        if (byYear !== 0) return byYear;
        const byMonth = Number(b.startMonth || 0) - Number(a.startMonth || 0);
        if (byMonth !== 0) return byMonth;
        return String(a.title || "").localeCompare(String(b.title || ""), "zh-Hans-CN");
      }),
    [],
  );

  useEffect(() => {
    const exactTitle = routeTitles[location.pathname];
    const fallbackTitle = location.pathname.startsWith("/project/")
      ? "客户案例"
      : location.pathname.startsWith("/news/")
        ? "最新动态"
        : location.pathname.startsWith("/showcase/")
          ? "Showcase"
          : "页面不存在";
    document.title = withBrandSuffix(exactTitle || fallbackTitle);
  }, [location.pathname]);

  const goProjects = () => {
    setNavLevel("projects");
    navigate("/projects");
  };

  const goCompany = () => {
    setNavLevel("company");
    navigate("/about");
  };

  const goNews = () => navigate("/news");

  return (
    <div className="min-h-screen bg-bg text-primary transition-colors duration-300 max-md:overflow-x-hidden">
      <aside
        aria-label="站点导航"
        className={`fixed bottom-0 left-0 top-0 z-30 w-50 overflow-y-auto overflow-x-hidden bg-bg transition-transform duration-300 ease-out max-md:w-[334px] max-md:max-w-[90vw] max-md:pb-[env(safe-area-inset-bottom)] ${
          mobileNavOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        } ${desktopCollapsed ? "md:-translate-x-[110%]" : "md:translate-x-0"}`}
      >
        <div className="flex w-full flex-col gap-6 px-4 py-6 md:mt-46.75 max-md:mt-0 max-md:pt-16">
          {navLevel === "root" ? (
            <nav className="flex flex-col gap-2 text-sm font-medium" aria-label="主导航">
              <button
                type="button"
                className="group flex min-h-9 w-full items-center justify-between rounded-md px-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/8"
                onClick={goProjects}
                aria-expanded={location.pathname.startsWith("/project") || location.pathname === "/projects"}
              >
                客户案例
                <i className="ri-arrow-right-line text-sm" aria-hidden="true" />
              </button>
              <Link className="group flex min-h-9 items-center justify-between rounded-md px-3 transition-colors hover:bg-black/5 dark:hover:bg-white/8" to="/ygb">
                云柜宝
                <i className="ri-arrow-right-line text-sm" aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="group flex min-h-9 w-full items-center justify-between rounded-md px-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/8"
                onClick={goCompany}
              >
                公司
                <i className="ri-arrow-right-line text-sm" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="group flex min-h-9 w-full items-center justify-between rounded-md px-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/8"
                onClick={goNews}
              >
                新闻
                <i className="ri-arrow-right-line text-sm" aria-hidden="true" />
              </button>
            </nav>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                className="flex min-h-9 items-center gap-2 px-3 text-left text-sm font-medium text-secondary"
                type="button"
                onClick={() => setNavLevel("root")}
              >
                <i className="ri-arrow-left-line text-base" aria-hidden="true" />
                返回
              </button>
              {navLevel === "projects" ? (
                <nav className="flex flex-col gap-2 text-sm font-medium" aria-label="项目导航">
                  {sortedProjects.map((item) => (
                    <Link
                      key={item.id}
                      className="group flex min-h-9 items-center justify-between rounded-md px-3 transition-colors hover:bg-black/5 dark:hover:bg-white/8"
                      to={`/project/${item.id}`}
                    >
                      <span className="truncate">{item.sidebarTitle}</span>
                      <i className="ri-arrow-right-line text-sm opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                    </Link>
                  ))}
                </nav>
              ) : (
                <nav className="flex flex-col gap-2 text-sm font-medium" aria-label="公司导航">
                  {companyMenu.map((item) => (
                    <Link
                      key={item.path}
                      className="group flex min-h-9 items-center justify-between rounded-md px-3 transition-colors hover:bg-black/5 dark:hover:bg-white/8"
                      to={item.path}
                    >
                      {item.label}
                      <i className="ri-arrow-right-line text-sm opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          )}
        </div>
      </aside>

      <ReactHeaderBar
        isDark={isDark}
        onToggleNav={() => {
          if (window.matchMedia("(max-width: 767.98px)").matches) {
            setMobileNavOpen((open) => !open);
          } else {
            setDesktopCollapsed((collapsed) => !collapsed);
          }
        }}
        onToggleTheme={toggleTheme}
      />
      <div
        className={`fixed inset-0 z-20 hidden bg-transparent opacity-0 transition-opacity max-md:block ${mobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none"}`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />
      <main
        className={`relative z-10 min-h-screen bg-bg transition-[margin-left] duration-300 ${desktopCollapsed ? "md:ml-0" : "md:ml-50"}`}
        onClick={() => mobileNavOpen && setMobileNavOpen(false)}
      >
        <div className={`flex min-h-screen flex-col items-center transition-transform duration-300 max-md:items-start ${mobileNavOpen ? "max-md:translate-x-[334px] max-md:blur-[3px]" : ""}`}>
          <Outlet />
          <ReactSiteFooter />
        </div>
      </main>
    </div>
  );
}
