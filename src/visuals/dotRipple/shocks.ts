/**
 * [INPUT]: 无外部依赖，纯数值计算
 * [OUTPUT]: 对外提供 createShocks(cols, rows, cellAspect)，返回 { add, update, blend }；Shocks 类型由返回值推出
 * [POS]: dotRipple 的点击层：每次点击放出一组向外扩散的不规则冲击环，轮廓、偏斜、浓淡分段均随机；解析计算，与跟随尾迹的速度、尺度互不牵制；index.js 每帧把它 max 合入字符强度
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const LIFE = 2.8; // 秒
const EXPAND = 1.5; // 缓出速率：越大落点处迸得越快
const MAX_SHOCKS = 4; // 同屏上限，超出则丢弃最早的
const BINS = 180; // 角度查表分辨率
// [后缘偏移 (格), 相对振幅]：主环领头，两道余环尾随
const FRONTS = [[0, 1], [10, 0.5], [21, 0.26]];
// 轮廓谐波 [角频率 k, 振幅]：低阶决定大轮廓的凸凹，高阶给边缘一点参差
const HARMONICS = [[2, 0.2], [3, 0.15], [5, 0.1], [7, 0.07], [11, 0.04]];
const TAU = Math.PI * 2;

/* 小型确定性随机源：同一 seed 得到同一形状，减少动画偏好下的定格帧不随刷新漂移 */
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ------------------------------------------------------------------
 * 不规则的来源 (每次点击各自抽一份 shape)：
 *   1. 轮廓：半径按方向被几组谐波调制，并随时间缓慢变形 (omega)
 *   2. 偏斜：沿随机方向把距离做等面积椭圆拉伸，团块不再关于落点对称
 *   3. 浓淡：环上各弧段强弱不一，有的弧段近乎消失，才像"一团一团"
 * 角度相关量每帧只算 BINS 个并查表，逐格只需一次 atan2。
 * ------------------------------------------------------------------ */
const makeShape = (random: () => number) => ({
  harmonics: HARMONICS.map(([k, amp]) => ({ k, amp: amp * (0.6 + 0.8 * random()), phase: random() * TAU, omega: (random() - 0.5) * 1.2 })),
  skewAngle: random() * Math.PI,
  stretch: 0.72 + random() * 0.66,
  densityPhase: random() * TAU,
  densityOmega: (random() - 0.5) * 0.8,
});

type Shape = ReturnType<typeof makeShape>;
interface Shock {
  x: number;
  y: number;
  amp: number;
  t: number;
  shape: Shape;
}

export type Shocks = ReturnType<typeof createShocks>;

export function createShocks(cols: number, rows: number, cellAspect: number) {
  let list: Shock[] = [];
  const radiusScale = new Float32Array(BINS);
  const density = new Float32Array(BINS);

  const add = (x: number, y: number, amp: number, seed: number = (Math.random() * 4294967296) >>> 0) => {
    list.push({ x, y, amp, t: 0, shape: makeShape(mulberry32(seed)) });
    if (list.length > MAX_SHOCKS) list.shift();
  };

  const update = (dt: number) => { list = list.filter((s) => (s.t += dt) < LIFE); };

  const fillTables = (shape: Shape, t: number) => {
    for (let b = 0; b < BINS; b++) {
      const theta = (b / BINS) * TAU;
      let wobble = 0;
      for (const h of shape.harmonics) wobble += h.amp * Math.sin(h.k * theta + h.phase + h.omega * t);
      radiusScale[b] = Math.max(0.35, 1 + wobble);
      density[b] = 0.55 + 0.45 * Math.sin(2 * theta + shape.densityPhase + shape.densityOmega * t) * Math.cos(theta - shape.skewAngle);
    }
  };

  const blend = (out: Float32Array, reach: number) => {
    const norm = 1 - Math.exp(-EXPAND * LIFE);
    for (const s of list) {
      const radius = (reach * (1 - Math.exp(-EXPAND * s.t))) / norm;
      const fade = Math.pow(1 - s.t / LIFE, 1.6) * s.amp;
      const width = 2.6 + 0.04 * radius;
      const { skewAngle, stretch } = s.shape;
      const cosA = Math.cos(skewAngle), sinA = Math.sin(skewAngle);
      fillTables(s.shape, s.t);
      // 轮廓最远可达 radius·1.9、再被拉伸 stretch 倍，包围盒按此放宽
      const outer = (radius * 1.9 + 2.5 * width) * Math.max(stretch, 1 / stretch);
      const x0 = Math.max(0, Math.floor(s.x - outer)), x1 = Math.min(cols - 1, Math.ceil(s.x + outer));
      const y0 = Math.max(0, Math.floor(s.y - outer / cellAspect)), y1 = Math.min(rows - 1, Math.ceil(s.y + outer / cellAspect));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const dx = x - s.x, dy = (y - s.y) * cellAspect;
          const u = dx * cosA + dy * sinA, v = -dx * sinA + dy * cosA;
          const dist = Math.hypot(u / stretch, v * stretch);
          let bin = Math.floor(((Math.atan2(dy, dx) + Math.PI) / TAU) * BINS);
          if (bin >= BINS) bin = BINS - 1;
          const scale = radiusScale[bin];
          let value = 0;
          for (const [offset, weight] of FRONTS) {
            const front = (radius - offset) * scale;
            if (front <= 0) continue;
            const d = (dist - front) / width;
            if (d * d < 9) value += weight * Math.exp(-d * d);
          }
          if (!value) continue;
          const i = y * cols + x, level = Math.min(1, value) * fade * density[bin];
          if (level > out[i]) out[i] = level;
        }
      }
    }
  };

  return { add, update, blend };
}
