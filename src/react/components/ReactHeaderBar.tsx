/**
 * [INPUT]: 依赖 React Router、主题 Props、详情标题/目录 Provider 与品牌 Logo
 * [OUTPUT]: 对外提供 ReactHeaderBar，包含品牌链接、导航开关与目录联动
 * [POS]: 应用外壳顶栏，消费详情快照并管理菜单关闭与键盘交互
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import logoImage from "../../assets/logo.webp";
import { useDetailHeaderController, useHeaderBarDetailTitle } from "../providers/DetailHeaderProvider";
import styles from "./ReactHeaderBar.module.css";

type Props = {
  isDark: boolean;
  sidebarCollapsed: boolean;
  onToggleNav: () => void;
  onToggleTheme: () => void;
};
export function ReactHeaderBar({ isDark, sidebarCollapsed, onToggleNav, onToggleTheme }: Props) {
  const detail = useHeaderBarDetailTitle();
  const controller = useDetailHeaderController();
  const rootRef = useRef<HTMLElement>(null);
  const hasToc = detail.items.length > 0;
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) controller.close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      controller.close();
      const header = rootRef.current;
      if (header && event.target instanceof Element && event.target.closest('[role="menu"]')) {
        const trigger = Array.from(header.querySelectorAll<HTMLButtonElement>('[aria-haspopup="menu"]')).find((node) => node.getClientRects().length);
        trigger?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [controller]);
  const renderDetailTitle = (mobile: boolean) => (
    <div
      className={`${styles.title} ${detail.show ? styles.visible : ""} ${mobile
        ? "relative px-3 py-1.5 md:hidden"
        : `absolute hidden text-sm text-primary md:flex md:items-center -translate-x-1/2 max-w-[56vw] ${sidebarCollapsed ? "left-1/2" : "left-1/2 md:left-[calc(50%+6.25rem)]"}`}`}
      aria-hidden={!detail.show}
      inert={!detail.show}
    >
      {hasToc ? (
        <button
          className={mobile
            ? "inline-flex w-full items-center justify-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primary"
            : "inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-black/5 dark:hover:bg-white/8"}
          type="button"
          aria-haspopup="menu"
          aria-controls={mobile ? "header-toc-mobile" : "header-toc-desktop"}
          aria-expanded={detail.open}
          onClick={controller.toggle}
        >
          <span className="truncate">{detail.title}</span>
          <i className={`ri-arrow-down-s-line text-base transition-transform duration-200 ${detail.open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      ) : <div className={`truncate px-2 py-1 text-sm font-medium text-primary ${mobile ? "text-center" : "max-w-full"}`}>{detail.title}</div>}
      <div
        id={mobile ? "header-toc-mobile" : "header-toc-desktop"}
        className={`${styles.toc} ${detail.open && hasToc ? styles.visible : ""} ${mobile
          ? "absolute left-0 right-0 top-full max-h-[58vh] w-screen overflow-auto border-b border-black/8 bg-bg p-2 shadow-xs dark:border-white/12"
          : "absolute left-1/2 top-full mt-2 max-h-[58vh] w-[min(38rem,72vw)] -translate-x-1/2 overflow-auto rounded-md bg-white p-2 shadow-xs dark:bg-zinc-900"}`}
        role="menu"
        aria-label="文章目录"
        aria-hidden={!detail.open || !hasToc}
        inert={!detail.open || !hasToc}
        onKeyDown={(event) => {
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]'));
          const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
          const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : event.key === "ArrowDown" ? (current + 1) % buttons.length : (current - 1 + buttons.length) % buttons.length;
          buttons[next]?.focus();
        }}
      >
        {detail.items.map((item) => (
          <button key={item.id} type="button" role="menuitem"
            className={`flex w-full items-center rounded-md py-2 pr-3 text-left text-sm transition-colors ${item.level >= 3 ? "pl-8" : "pl-3"} ${item.id === detail.activeId ? "bg-black/8 text-primary dark:bg-white/12" : "text-primary hover:bg-black/5 dark:hover:bg-white/8"}`}
            aria-current={item.id === detail.activeId ? "location" : undefined}
            onClick={() => controller.navigate(item.id)}>{item.text}</button>
        ))}
      </div>
    </div>
  );
  return (
    <header ref={rootRef} className="fixed left-0 right-0 top-0 z-40 bg-bg">
      <div className="relative flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Link to="/" aria-label="返回首页" className="flex items-center gap-2">
              <img src={logoImage} alt="企丰科技" className="h-8 w-8 rounded-sm object-cover" />
              <span className="select-none text-sm font-medium">企丰科技</span>
            </Link>
          </div>
          <button className="hidden btn-icon btn-icon-md btn-icon-muted md:inline-flex" type="button" onClick={onToggleNav} aria-label="切换侧边导航">
            <i className="ri-layout-left-2-line text-lg" aria-hidden="true" />
          </button>
        </div>
        {renderDetailTitle(false)}
        <div className="flex items-center gap-1">
          <button className="inline-flex btn-icon btn-icon-md btn-icon-muted" type="button" onClick={onToggleTheme} aria-label={isDark ? "切换到浅色模式" : "切换到深色模式"}>
            <i className={isDark ? "ri-sun-line text-lg" : "ri-moon-clear-line text-lg"} aria-hidden="true" />
          </button>
          <button className="inline-flex btn-icon btn-icon-md btn-icon-muted md:hidden" type="button" onClick={onToggleNav} aria-label="切换侧边导航">
            <i className="ri-layout-left-2-line text-lg" aria-hidden="true" />
          </button>
        </div>
      </div>
      {renderDetailTitle(true)}
    </header>
  );
}
