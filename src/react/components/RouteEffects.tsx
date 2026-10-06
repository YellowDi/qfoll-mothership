/**
 * [INPUT]: 依赖 React Router 位置与导航类型、共享标题解析及浏览器历史和 DOM
 * [OUTPUT]: 对外提供 RouteEffects，同步页面标题、hash 定位与前进后退滚动恢复
 * [POS]: 常驻路由副作用边界，跨外壳重挂载保留历史条目的滚动位置；hash 定位与前进后退恢复共用 trackUntilSettled：内容晚到时随 DOM/尺寸变化重试 (hash 持续校准目标位置)，用户滚动或超时放弃；顶栏避让由根 scroll-padding 负责
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { decodeHash, documentTitleForPath } from "../navigation";

/* ==================== 等内容到齐再定位 ==================== */
// 目标页的内容常晚于路由提交：正文 HTML 由 effect 注入、标题 id 由目录 hook 补写、图片随后撑高。
// 过早定位会被钳到短页面底部 (随后滚动锚定把位置推到新底部)，或平滑滚动途中目标被上方内容推走。
// 所以先走一步，不成则随 DOM 变化与尺寸变化再走；step 返回 true 即完成，用户主动滚动或超时即放弃，不与用户抢滚动。
const RETRY_TIMEOUT = 2500;
const USER_SCROLL_INTENTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

function trackUntilSettled(step: () => boolean): () => void {
  if (step()) return () => {};
  let done = false;
  const run = () => { if (!done && step()) stop(); };
  const mutations = new MutationObserver(run);
  const resizes = new ResizeObserver(run);
  const timer = window.setTimeout(() => stop(), RETRY_TIMEOUT);
  function stop() {
    if (done) return;
    done = true;
    mutations.disconnect();
    resizes.disconnect();
    window.clearTimeout(timer);
    USER_SCROLL_INTENTS.forEach((type) => window.removeEventListener(type, stop));
  }
  // id 属性必须一起监听：详情页标题 id 由目录 hook 在挂载后补写，只看节点增删永远等不到目标
  mutations.observe(document.getElementById("app") ?? document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["id"] });
  resizes.observe(document.body);
  USER_SCROLL_INTENTS.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  return stop;
}

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
    if (saved) {
      // 前进后退：页面撑到足够高、位置真正落到记录值才算完成
      return trackUntilSettled(() => {
        window.scrollTo(saved);
        return document.documentElement.scrollHeight - window.innerHeight >= saved.top - 1;
      });
    }
    window.scrollTo({ top: 0, left: 0 });
    if (!location.hash) return;
    // hash：目标在文档中的位置一变就重新瞄准，直到超时或用户接管；只认位置变化，页面自身的高频 DOM 动画不会反复重启平滑滚动
    const id = decodeHash(location.hash);
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    let aimedTop: number | null = null;
    return trackUntilSettled(() => {
      const target = document.getElementById(id);
      if (!target) return false;
      const top = target.getBoundingClientRect().top + window.scrollY;
      if (aimedTop === null || Math.abs(top - aimedTop) > 1) {
        aimedTop = top;
        target.scrollIntoView({ behavior });
      }
      return false;
    });
  }, [location.key, location.pathname, location.search, location.hash, navigationType]);
  return null;
}
