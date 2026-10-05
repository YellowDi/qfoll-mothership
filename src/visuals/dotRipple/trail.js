/**
 * [INPUT]: 无外部依赖，纯数值计算
 * [OUTPUT]: 对外提供 createTrail(cols, rows, cellAspect)，返回 { read, stamp, line, step }
 * [POS]: dotRipple 的跟随层：指针沿途盖下软边笔刷，随后轻微扩散并整体衰减，形成有余晖的尾迹；不碰 DOM，index.js 把它与点击冲击环合成为字符强度
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ------------------------------------------------------------------
 * 笔刷用 max 混合而非叠加：沿路径反复盖章时中心强度恒定，不会越扫越饱和。
 * 衰减前做一次五点扩散，边缘随时间变软，轮廓自然呈台阶状，
 * 再由字符档位量化成 . : + # 的疏密层次。
 * ------------------------------------------------------------------ */
export function createTrail(cols, rows, cellAspect) {
  let cur = new Float32Array(cols * rows);
  let next = new Float32Array(cols * rows);
  const DIFFUSE = 0.05;

  /* 高斯笔刷：radius 单位为格宽；纵向按格高折算，保证笔刷在屏幕上是圆的 */
  const stamp = (cx, cy, amp, radius) => {
    const reachX = Math.ceil(radius * 2.5), reachY = Math.ceil((radius * 2.5) / cellAspect);
    const x0 = Math.max(1, Math.floor(cx - reachX)), x1 = Math.min(cols - 2, Math.ceil(cx + reachX));
    const y0 = Math.max(1, Math.floor(cy - reachY)), y1 = Math.min(rows - 2, Math.ceil(cy + reachY));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = (y - cy) * cellAspect;
        const value = amp * Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius));
        const i = y * cols + x;
        if (value > cur[i]) cur[i] = value;
      }
    }
  };

  /* 两次指针事件之间按笔刷半径的一半插值盖章，快速甩动也是连续的一条 */
  const line = (x0, y0, x1, y1, amp, radius) => {
    const dx = x1 - x0, dy = (y1 - y0) * cellAspect;
    const count = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (radius * 0.5)));
    for (let n = 0; n <= count; n++) stamp(x0 + ((x1 - x0) * n) / count, y0 + ((y1 - y0) * n) / count, amp, radius);
  };

  const step = (fade) => {
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1, i = y * cols + 1; x < cols - 1; x++, i++) {
        const spread = cur[i] * (1 - 4 * DIFFUSE) + DIFFUSE * (cur[i - 1] + cur[i + 1] + cur[i - cols] + cur[i + cols]);
        next[i] = spread * fade < 0.004 ? 0 : spread * fade;
      }
    }
    [cur, next] = [next, cur];
  };

  return { read: () => cur, stamp, line, step };
}
