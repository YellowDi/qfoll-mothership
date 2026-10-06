/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供港区空间常量 (岸线/轨道/车道/堆场行列/城市街网/闸口/船位/岸桥)、cityBlocks/yardBlocks 地块表与 CityBlock/YardBlock/CraneSpec 类型
 * [POS]: visuals/ygbPort 的空间宪法；道路、物件、车辆与动画全部从这里取坐标，杜绝魔法数字分散
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/*
 * 世界坐标约定 (1 单位 ≈ 0.5 m)：x 沿岸线向东，y 指向海面，z 向上。
 * 自海向陆的真实港区分层：
 *   海面 → 码头前沿/岸桥轨道 → 港内后方道路 → RTG 集装箱堆场 → 闸口与港务配套
 *   → 围网 → 疏港主干道 → 物流园/停车场 → 城市街区
 */

export type CraneMode = "parked" | "raised" | "working" | "active";

export interface CraneSpec {
  x: number;
  mode: CraneMode;
}

export interface YardBlock {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  row: number;
  col: number;
}

export interface CityBlock extends YardBlock {
  cx: number;
}

/* ─── 码头前沿 ─── */
export const QUAY_Y = 322;
export const WATER_Z = -7;
export const RAIL_LAND = 252;
export const RAIL_SEA = 310;
export const APRON_LANES = [260, 272, 284, 296];
export const CRANE_LANE_Y = 272;
export const BACK_ROAD = { y: 219, half: 15 };

/* ─── 堆场：块沿岸线纵向排布，RTG 跨 6 列箱位 + 1 条作业车道 ─── */
export const YARD_LANES = [134, 58, -18, -94];
export const YARD_LANE_HALF = 12;
export const YARD_ROWS = [[146, 204], [70, 122], [-6, 46], [-82, -30], [-158, -106]];
export const AISLES = [-1480, -1200, -920, -640, -360, -80, 200, 480, 760, 1040, 1320];
export const AISLE_HALF = 14;
export const PERIMETER = { y: -170, half: 12 };
export const BAY = 25;
export const TEU = { l: 24.4, w: 4.9, h: 5.2, l20: 12 };

/* ─── 港界与疏港主干道 ─── */
export const FENCE_Y = -268;
export const MAIN_ROAD = { y: -300, half: 21, median: 3 };
export const GATE = { x: -360, y: -226, half: 24, canopy: [-242, -210] };

/* ─── 城市街网：疏港路以北为物流园与城区 ─── */
export const STREET_HALF = 12;
export const STREET_X = [-2160, -1860, -1560, -1260, -960, -660, -360, -60, 240, 540, 840, 1140, 1440, 1740];
export const STREET_Y = [-620, -920, -1220, -1520, -1820, -2120];
export const CITY_TOP = -2400;
export const WORLD_X = [-2600, 2600];

/* ─── 泊位：船首朝东，岸桥避开驾驶台与烟囱 ─── */
export const SHIP = { x0: -360, x1: 120, y0: 328, y1: 408 };
export const CRANES: CraneSpec[] = [
  { x: -690, mode: "parked" },
  { x: -460, mode: "raised" },
  { x: -207.5, mode: "working" },
  { x: -132.5, mode: "working" },
  { x: -33.5, mode: "active" },
  { x: 120, mode: "parked" },
  { x: 290, mode: "raised" },
  { x: 470, mode: "parked" },
];

/* ─── 城市地块：街道之间的圆角街坊，含人行道 ─── */
export const cityBlocks: CityBlock[] = [];
{
  const rows: Array<[number, number]> = [[MAIN_ROAD.y - MAIN_ROAD.half, STREET_Y[0] + STREET_HALF]];
  for (let i = 0; i < STREET_Y.length; i++) rows.push([STREET_Y[i] - STREET_HALF, (STREET_Y[i + 1] ?? CITY_TOP) + STREET_HALF]);
  rows.forEach(([y1, y0], row) => {
    for (let i = 0; i < STREET_X.length - 1; i++) {
      cityBlocks.push({ x0: STREET_X[i] + STREET_HALF, x1: STREET_X[i + 1] - STREET_HALF, y0, y1, row, col: i, cx: (STREET_X[i] + STREET_X[i + 1]) / 2 });
    }
  });
}

/* ─── 堆场地块：过道之间、车道之间 ─── */
export const yardBlocks: YardBlock[] = [];
for (let r = 0; r < YARD_ROWS.length; r++) {
  for (let i = 0; i < AISLES.length - 1; i++) {
    const [y0, y1] = YARD_ROWS[r];
    yardBlocks.push({ x0: AISLES[i] + AISLE_HALF, x1: AISLES[i + 1] - AISLE_HALF, y0, y1, row: r, col: i });
  }
}
