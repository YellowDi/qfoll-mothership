/**
 * [INPUT]: 依赖 React Router 位置与导航类型、共享标题解析及浏览器历史和 DOM
 * [OUTPUT]: 对外提供 RouteEffects，同步页面标题、hash 定位与前进后退滚动恢复
 * [POS]: 常驻路由副作用边界，跨外壳重挂载保留历史条目的滚动位置；hash 定位用原生 scrollIntoView，顶栏避让由根 scroll-padding 负责，等待目标时兼听节点挂载与 id 补写
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { decodeHash, documentTitleForPath } from "../navigation";

export function RouteEffects() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, { left: number; top: number }>());
  const currentKey = useRef<string | null>(null);
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    // 位置随滚动实时记在当前历史条目上；不在 effect 清理时补记，
    // 否则 StrictMode 重放或依赖重跑会伪造一个"离开时位置"，命中 saved 分支并掐断 hash 平滑滚动
    const record = () => { if (currentKey.current) positions.current.set(currentKey.current, { left: window.scrollX, top: window.scrollY }); };
    window.addEventListener("scroll", record, { passive: true });
    return () => {
      window.history.scrollRestoration = previous;
      window.removeEventListener("scroll", record);
    };
  }, []);
  useLayoutEffect(() => {
    document.title = documentTitleForPath(location.pathname);
    currentKey.current = location.key;
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
        // 详情页标题 id 由目录 hook 在挂载后补写，必须同时监听 id 属性，否则文章内 hash 永远找不到目标
        if (root) observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["id"] });
      });
    } else {
      window.scrollTo({ top: 0, left: 0 });
    }
    return () => {
      observer?.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [location.key, location.pathname, location.search, location.hash, navigationType]);
  return null;
}
