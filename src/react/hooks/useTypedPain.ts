/**
 * [INPUT]: 依赖 React 的 useState/useEffect 与浏览器减少动态偏好
 * [OUTPUT]: 对外提供 useTypedPain，返回打字机逐字输入/删除的运输痛点词
 * [POS]: hooks 的云柜宝品牌文案适配器；ReactYgbHero (首页预览) 与 ygbStory 封面共用同一节奏与词表
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useState } from "react";

const PAIN_TAGS = ["效率低下", "路线混乱", "信息滞后", "推进缓慢", "对接低效", "延误频繁"];

export function useTypedPain() {
  const [pain, setPain] = useState(PAIN_TAGS[0]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let index = 0, chars = PAIN_TAGS[0].length, deleting = true, timer = 0;
    const tick = () => {
      const current = PAIN_TAGS[index];
      if (!deleting) {
        if (chars < current.length) { chars += 1; setPain(current.slice(0, chars)); timer = window.setTimeout(tick, 95); return; }
        deleting = true; timer = window.setTimeout(tick, 1100); return;
      }
      if (chars > 0) { chars -= 1; setPain(current.slice(0, chars)); timer = window.setTimeout(tick, 58); return; }
      deleting = false; index = (index + 1) % PAIN_TAGS.length; timer = window.setTimeout(tick, 180);
    };
    timer = window.setTimeout(tick, 1100);
    return () => window.clearTimeout(timer);
  }, []);
  return pain;
}
