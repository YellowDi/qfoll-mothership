/**
 * [INPUT]: 无外部依赖，纯数值计算
 * [OUTPUT]: 对外提供 createWaveField(cols, rows, cellAspect)，返回 { cols, rows, read, step, drop }
 * [POS]: dotRipple 的物理层：网格上的二维波动方程，不碰 DOM 与 Canvas；index.js 读它的高度场来决定每格画什么字符
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ------------------------------------------------------------------
 * 离散波动方程  h' = (2h - h_prev + a·∇²h) · damping
 * 字符格子是瘦高的 (宽 1 : 高 cellAspect)，若按方形格子算，涟漪会被压成椭圆。
 * 因此纵向拉普拉斯项按物理间距加权 wy = 1/cellAspect²，圆环才是圆的。
 * 稳定条件 a·(1+wy) ≤ 1，step 里把 speed∈(0,1] 归一化到该边界以内。
 * 边界格恒为 0 (固定端)，让波在画面边缘反射并随阻尼消散。
 * ------------------------------------------------------------------ */
export function createWaveField(cols, rows, cellAspect) {
  let cur = new Float32Array(cols * rows);
  let prev = new Float32Array(cols * rows);
  const wy = 1 / (cellAspect * cellAspect);

  const step = (speed, damping) => {
    const a = speed / (1 + wy);
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1, i = y * cols + 1; x < cols - 1; x++, i++) {
        const c = cur[i];
        const lap = cur[i - 1] + cur[i + 1] - 2 * c + wy * (cur[i - cols] + cur[i + cols] - 2 * c);
        prev[i] = (2 * c - prev[i] + a * lap) * damping;
      }
    }
    [cur, prev] = [prev, cur];
  };

  /* 高斯水滴：在物理空间 (横向 1 单位 = 1 格宽) 内叠加位移，radius 单位为格宽 */
  const drop = (cx, cy, amp, radius) => {
    const reachX = Math.ceil(radius * 2.5), reachY = Math.ceil((radius * 2.5) / cellAspect);
    const x0 = Math.max(1, Math.floor(cx - reachX)), x1 = Math.min(cols - 2, Math.ceil(cx + reachX));
    const y0 = Math.max(1, Math.floor(cy - reachY)), y1 = Math.min(rows - 2, Math.ceil(cy + reachY));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = (y - cy) * cellAspect;
        cur[y * cols + x] += amp * Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius));
      }
    }
  };

  return { cols, rows, read: () => cur, step, drop };
}
