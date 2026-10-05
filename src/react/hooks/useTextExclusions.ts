/**
 * [INPUT]: 依赖 visuals/textExclusions 的 collectTextExclusions，依赖 ResizeObserver 与窗口 resize，依赖 ReactTwinkleDotMatrixBg 导出的 DotExclusion 类型
 * [OUTPUT]: 对外提供 useTextExclusions(rootRef, selector)，返回相对 root 左上角的文字避让矩形
 * [POS]: 点阵类背景 (dotRipple 等) 的文字避让采集适配器；以 data 属性标记需避让的元素，页面无需持有一堆 ref
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useState, type RefObject } from "react";
import { collectTextExclusions } from "../../visuals/textExclusions";
import type { DotExclusion } from "../pages/ReactTwinkleDotMatrixBg";

export function useTextExclusions(rootRef: RefObject<HTMLElement | null>, selector = "[data-dot-avoid]") {
  const [rects, setRects] = useState<DotExclusion[]>([]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const targets = () => Array.from(root.querySelectorAll<HTMLElement>(selector));
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = collectTextExclusions(root, targets());
        setRects((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(root);
    targets().forEach((element) => observer.observe(element));
    window.addEventListener("resize", update, { passive: true });
    update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", update); };
  }, [rootRef, selector]);
  return rects;
}
