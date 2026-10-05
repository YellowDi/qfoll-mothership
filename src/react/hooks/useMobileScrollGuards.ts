/**
 * [INPUT]: 依赖侧栏与遮罩 DOM 引用、导航开关及移动端媒体查询
 * [OUTPUT]: 对外提供 useMobileScrollGuards，阻止背景滚动与侧栏边界滚动穿透
 * [POS]: 应用外壳的触摸事件适配层，所有监听在关闭、跨断点与卸载时释放
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, type RefObject } from "react";
import { mobileNavMediaQuery } from "../navigation";

export function useMobileScrollGuards(
  open: boolean,
  sidebarRef: RefObject<HTMLElement | null>,
  overlayRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia(mobileNavMediaQuery);
    const overlay = overlayRef.current;
    let lastTouchY = 0;
    const preventScroll = (event: Event) => event.preventDefault();
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length) lastTouchY = event.touches[0].clientY;
    };
    const onTouchMove = (event: TouchEvent) => {
      const panel = sidebarRef.current;
      const touch = event.touches[0];
      if (!panel || !touch || !(event.target instanceof Node) || !panel.contains(event.target)) {
        event.preventDefault();
        return;
      }
      const deltaY = touch.clientY - lastTouchY;
      lastTouchY = touch.clientY;
      const maxScrollTop = panel.scrollHeight - panel.clientHeight;
      if (maxScrollTop <= 0 || (deltaY > 0 && panel.scrollTop <= 0) || (deltaY < 0 && panel.scrollTop >= maxScrollTop)) {
        event.preventDefault();
      }
    };
    const removeGuards = () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      overlay?.removeEventListener("wheel", preventScroll);
    };
    const syncGuards = () => {
      removeGuards();
      if (!media.matches) return;
      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      overlay?.addEventListener("wheel", preventScroll, { passive: false });
    };
    syncGuards();
    media.addEventListener("change", syncGuards);
    return () => {
      removeGuards();
      media.removeEventListener("change", syncGuards);
    };
  }, [open, sidebarRef, overlayRef]);
}
