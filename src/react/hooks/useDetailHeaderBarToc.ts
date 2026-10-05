/**
 * [INPUT]: 依赖详情页标题区与内容区引用、内容键及顶栏状态控制器
 * [OUTPUT]: 对外提供 useDetailHeaderBarToc，收集目录并同步滚动标题与活动项
 * [POS]: 详情页 DOM 到 DetailHeaderProvider 的适配器，卸载时清理观察器、RAF 和监听
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, type RefObject } from "react";
import { headerOffset } from "../navigation";
import { useDetailHeaderController, type TocItem } from "../providers/DetailHeaderProvider";

type Options = {
  pageTitle: string;
  contentKey: string;
  titleSectionRef: RefObject<HTMLElement | null>;
  contentRootRef: RefObject<HTMLElement | null>;
};
function headingId(text: string, index: number, used: Set<string>) {
  const base = text.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || `section-${index + 1}`;
  let id = base;
  let suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  return id;
}
export function useDetailHeaderBarToc({ pageTitle, contentKey, titleSectionRef, contentRootRef }: Options) {
  const controller = useDetailHeaderController();
  useEffect(() => {
    const titleSection = titleSectionRef.current;
    const root = contentRootRef.current;
    const headings = Array.from(root?.querySelectorAll<HTMLElement>("h2, h3") || []).filter((node) => node.textContent?.trim());
    // 先保留作者定义的锚点，再为缺失或重复项分配唯一 ID。
    const reserved = new Set(headings.map((node) => node.id).filter(Boolean));
    const used = new Set<string>();
    const items: TocItem[] = headings.map((node, index) => {
      const text = node.textContent?.trim() || "";
      const id = node.id && !used.has(node.id) ? node.id : headingId(text, index, new Set([...reserved, ...used]));
      node.id = id;
      used.add(id);
      return { id, text, level: Number(node.tagName.slice(1)) };
    });
    let frame: number | null = null;
    let headerHidden = false;
    const sync = () => {
      let active: HTMLElement | undefined;
      for (const node of headings) {
        if (node.getBoundingClientRect().top > headerOffset) break;
        active = node;
      }
      if (titleSection) headerHidden = titleSection.getBoundingClientRect().bottom <= 0;
      controller.publish({ title: active?.textContent?.trim() || pageTitle.trim(), show: headerHidden, items, activeId: active?.id || "" });
    };
    const schedule = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => { frame = null; sync(); });
    };
    const observer = titleSection && "IntersectionObserver" in window ? new IntersectionObserver(([entry]) => {
      headerHidden = !(entry?.isIntersecting ?? true);
      sync();
    }, { threshold: 0 }) : null;
    controller.registerNavigation((id) => {
      const target = headings.find((node) => node.id === id);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      window.scrollTo({ top: Math.max(0, top), behavior });
      window.history.replaceState(window.history.state, "", `#${encodeURIComponent(id)}`);
    });
    observer?.observe(titleSection!);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    sync();
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== null) window.cancelAnimationFrame(frame);
      controller.clear();
    };
  }, [pageTitle, contentKey, titleSectionRef, contentRootRef, controller]);
}
