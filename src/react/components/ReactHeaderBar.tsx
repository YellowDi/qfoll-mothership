/**
 * [INPUT]: 依赖 React Router、主题状态、品牌 Logo 和应用导航回调
 * [OUTPUT]: 对外提供 React 迁移层顶栏
 * [POS]: React 应用外壳的顶层导航组件，先承接全局导航与主题切换
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Link } from "react-router-dom";
import logoImage from "../../assets/logo.webp";

type ReactHeaderBarProps = {
  isDark: boolean;
  onToggleNav: () => void;
  onToggleTheme: () => void;
};

export function ReactHeaderBar({
  isDark,
  onToggleNav,
  onToggleTheme,
}: ReactHeaderBarProps) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 bg-bg">
      <div className="relative flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoImage} alt="企丰科技" className="h-8 w-8 rounded-sm object-cover" />
            <span className="select-none text-sm font-medium">企丰科技</span>
          </Link>
          <button
            className="hidden btn-icon btn-icon-md btn-icon-muted md:inline-flex"
            type="button"
            onClick={onToggleNav}
            aria-label="切换侧边导航"
          >
            <i className="ri-layout-left-2-line text-lg" aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="inline-flex btn-icon btn-icon-md btn-icon-muted"
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? "切换到浅色模式" : "切换到深色模式"}
          >
            <i
              className={isDark ? "ri-sun-line text-lg" : "ri-moon-clear-line text-lg"}
              aria-hidden="true"
            />
          </button>
          <button
            className="inline-flex btn-icon btn-icon-md btn-icon-muted md:hidden"
            type="button"
            onClick={onToggleNav}
            aria-label="切换侧边导航"
          >
            <i className="ri-layout-left-2-line text-lg" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
