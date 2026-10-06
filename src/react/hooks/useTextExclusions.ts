/**
 * [INPUT]: 依赖 visuals/textExclusions 的 collectTextExclusions，依赖 ResizeObserver 与窗口 resize，依赖 ReactTwinkleDotMatrixBg 导出的 DotExclusion 类型
 * [OUTPUT]: 对外提供 useTextExclusions(rootRef, textSelector, blockSelector)，返回相对 root 左上角的避让矩形
 * [POS]: 点阵类背景 (dotRipple 等) 的避让区域采集适配器；以 data 属性标记元素，页面无需持有一堆 ref。data-dot-avoid 取文字行矩形 (逐行贴合)，data-dot-block 取整块盒子 (图片、卡片等不该被字符覆盖的区域)
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useState, type RefObject } from "react";
import { collectTextExclusions } from "../../visuals/textExclusions";
import type { DotExclusion } from "../pages/ReactTwinkleDotMatrixBg";

const collectBlocks = (root: HTMLElement, elements: HTMLElement[]): DotExclusion[] => {
  const origin = root.getBoundingClientRect();
  return elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height };
  });
};

export function useTextExclusions(rootRef: RefObject<HTMLElement | null>, textSelector = "[data-dot-avoid]", blockSelector = "[data-dot-block]") {
  const [rects, setRects] = useState<DotExclusion[]>([]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const query = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = [...collectTextExclusions(root, query(textSelector)), ...collectBlocks(root, query(blockSelector))];
        setRects((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(root);
    [...query(textSelector), ...query(blockSelector)].forEach((element) => observer.observe(element));
    window.addEventListener("resize", update, { passive: true });
    update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", update); };
  }, [rootRef, textSelector, blockSelector]);
  return rects;
}
