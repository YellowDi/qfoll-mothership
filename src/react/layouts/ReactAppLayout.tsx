/**
 * [INPUT]: 依赖 React Router、共享导航元数据、主题上下文、触摸保护、顶栏和页脚组件
 * [OUTPUT]: 对外提供 React 迁移层应用布局
 * [POS]: React 应用的公共外壳，承接侧栏、移动端遮罩和主内容，页面副作用由常驻 RouteEffects 承担
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { companyMenu, isCompanyRoute, isProjectRoute, isAutoHideSidebarRoute, mobileNavMediaQuery, navLevelForPath, sidebarProjects, type NavLevel } from "../navigation";
import { useMobileScrollGuards } from "../hooks/useMobileScrollGuards";
import { ReactHeaderBar } from "../components/ReactHeaderBar";
import { ReactSiteFooter } from "../components/ReactSiteFooter";
import { useTheme } from "../providers/ThemeProvider";

export function ReactAppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() =>
    isAutoHideSidebarRoute(location.pathname),
  );
  const [navLevel, setNavLevel] = useState<NavLevel>(() => navLevelForPath(location.pathname));
  const sidebarRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  useMobileScrollGuards(mobileNavOpen, sidebarRef, overlayRef);
  useEffect(() => {
    setMobileNavOpen(false);
    setDesktopCollapsed(isAutoHideSidebarRoute(location.pathname));
    setNavLevel(navLevelForPath(location.pathname));
  }, [location.pathname]);
  const rootBase = "group rounded-md px-3 py-2 text-sm font-medium transition-colors text-left w-40 max-md:w-full max-md:min-h-11 max-md:px-4 max-md:py-3";
  const navClass = (active: boolean) => `${rootBase} ${active ? "bg-black/8 text-primary dark:bg-white/10" : "text-primary hover:bg-black/6 dark:hover:bg-white/8"}`;
  const arrowClass = (active: boolean) => active ? "opacity-0" : "opacity-0 transition-opacity group-hover:opacity-100";

  const goProjects = () => {
    setNavLevel("projects");
    if (location.pathname !== "/projects") navigate("/projects");
  };

  const goCompany = () => {
    setNavLevel("company");
    if (!isCompanyRoute(location.pathname)) navigate("/about");
  };

  const goNews = () => {
    setNavLevel("root");
    if (location.pathname !== "/news") navigate("/news");
  };

  return (
    <div className="min-h-screen bg-bg text-primary transition-colors duration-300 max-md:overflow-x-hidden">
      <aside
        ref={sidebarRef}
        aria-label="站点导航"
        className={`fixed bottom-0 left-0 top-0 z-30 w-50 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-bg transition-transform duration-300 ease-out max-md:w-[334px] max-md:max-w-[90vw] max-md:pb-[env(safe-area-inset-bottom)] ${
          mobileNavOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        } ${desktopCollapsed ? "md:-translate-x-[110%]" : "md:translate-x-0"}`}
      >
        <div className="flex w-full flex-col gap-6 px-4 py-6 md:mt-46.75 max-md:mt-0 max-md:pt-16">
          {navLevel === "root" ? (
            <nav className="flex flex-col gap-2 text-sm font-medium" aria-label="主导航">
              <button
                type="button"
                className={`${navClass(isProjectRoute(location.pathname))} flex items-center justify-between`}
                onClick={goProjects}
                aria-controls="projects-submenu"
                aria-pressed={isProjectRoute(location.pathname)}
              >
                客户案例
                <i className={`ri-arrow-right-line text-sm ${arrowClass(isProjectRoute(location.pathname))}`} aria-hidden="true" />
              </button>
              <Link className={`${navClass(location.pathname === "/ygb")} flex items-center justify-between`} to="/ygb" aria-current={location.pathname === "/ygb" ? "page" : undefined}>
                云柜宝
                <i className={`ri-arrow-right-line text-sm ${arrowClass(location.pathname === "/ygb")}`} aria-hidden="true" />
              </Link>
              <button
                type="button"
                className={`${navClass(isCompanyRoute(location.pathname))} flex items-center justify-between`}
                aria-controls="company-submenu"
                aria-pressed={isCompanyRoute(location.pathname)}
                onClick={goCompany}
              >
                公司
                <i className={`ri-arrow-right-line text-sm ${arrowClass(isCompanyRoute(location.pathname))}`} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${navClass(location.pathname === "/news")} flex items-center justify-between`}
                aria-pressed={location.pathname === "/news"}
                onClick={goNews}
              >
                新闻
                <i className={`ri-arrow-right-line text-sm ${arrowClass(location.pathname === "/news")}`} aria-hidden="true" />
              </button>
            </nav>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                className="sidebar-back-button flex w-40 items-center gap-2 px-3 text-left text-sm font-medium text-secondary max-md:w-full max-md:min-h-11 max-md:px-4 max-md:py-3"
                type="button"
                onClick={() => setNavLevel("root")}
              >
                <i className="ri-arrow-left-line text-base" aria-hidden="true" />
                返回
              </button>
              {navLevel === "projects" ? (
                <nav id="projects-submenu" className="flex flex-col gap-2 text-sm font-medium" aria-label="项目导航">
                  {sidebarProjects.map((item) => (
                    <Link
                      key={item.id}
                      className={`${navClass(location.pathname === `/project/${item.id}`)} flex items-center justify-between`}
                      aria-current={location.pathname === `/project/${item.id}` ? "page" : undefined}
                      to={`/project/${item.id}`}
                    >
                      <span className="truncate">{item.sidebarTitle}</span>
                      <i className="ri-arrow-right-line text-sm opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                    </Link>
                  ))}
                </nav>
              ) : (
                <nav id="company-submenu" className="flex flex-col gap-2 text-sm font-medium" aria-label="公司导航">
                  {companyMenu.map((item) => (
                    <Link
                      key={item.path}
                      className={`${navClass(location.pathname === item.path)} flex items-center justify-between`}
                      aria-current={location.pathname === item.path ? "page" : undefined}
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
        sidebarCollapsed={desktopCollapsed}
        onToggleNav={() => {
          if (window.matchMedia(mobileNavMediaQuery).matches) {
            setMobileNavOpen((open) => !open);
          } else {
            setDesktopCollapsed((collapsed) => !collapsed);
          }
        }}
        onToggleTheme={toggleTheme}
      />
      <div
        ref={overlayRef}
        className={`fixed inset-0 z-20 hidden bg-transparent opacity-0 transition-opacity max-md:block max-md:touch-none ${mobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none"}`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />
      <main
        className={`relative z-10 min-h-screen bg-bg transition-[margin-left] duration-300 ${desktopCollapsed ? "md:ml-0" : "md:ml-50"} ${location.pathname === "/" ? "overflow-visible" : "overflow-x-hidden"}`}
      >
        <div className={`flex min-h-screen flex-col items-center transition-transform duration-300 max-md:items-start ${mobileNavOpen ? "max-md:translate-x-[334px] max-md:pointer-events-none max-md:pb-[env(safe-area-inset-bottom)] max-md:blur-[3px]" : ""}`}>
          <Outlet />
          <ReactSiteFooter />
        </div>
      </main>
    </div>
  );
}
