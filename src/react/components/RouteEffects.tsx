/**
 * [INPUT]: 依赖 React Router 位置与导航类型、共享标题解析及浏览器历史和 DOM
 * [OUTPUT]: 对外提供 RouteEffects，同步页面标题、hash 定位与前进后退滚动恢复
 * [POS]: 常驻路由副作用边界，跨外壳重挂载保留历史条目的滚动位置
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { decodeHash, documentTitleForPath } from "../navigation";

export function RouteEffects() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, { left: number; top: number }>());
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  useLayoutEffect(() => {
    document.title = documentTitleForPath(location.pathname);
    const saved = navigationType === "POP" ? positions.current.get(location.key) : undefined;
    let observer: MutationObserver | null = null;
    let frame: number | null = null;
    if (saved) {
      window.scrollTo(saved);
    } else if (location.hash) {
      const id = decodeHash(location.hash);
      const scrollToHash = () => {
        const target = document.getElementById(id);
        if (!target) return false;
        const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        target.scrollIntoView({ behavior });
        return true;
      };
      window.scrollTo({ top: 0, left: 0 });
      frame = window.requestAnimationFrame(() => {
        frame = null;
        if (scrollToHash()) return;
        observer = new MutationObserver(() => {
          if (scrollToHash()) { observer?.disconnect(); observer = null; }
        });
        const root = document.getElementById("app");
        if (root) observer.observe(root, { childList: true, subtree: true });
      });
    } else {
      window.scrollTo({ top: 0, left: 0 });
    }
    const entryKey = location.key;
    const savedPositions = positions.current;
    return () => {
      savedPositions.set(entryKey, { left: window.scrollX, top: window.scrollY });
      observer?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [location.key, location.pathname, location.search, location.hash, navigationType]);
  return null;
}
