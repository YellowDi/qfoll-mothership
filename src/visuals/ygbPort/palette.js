/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 palettes(day/night)、集装箱/车辆配色索引表与 pick 权重抽样
 * [POS]: visuals/ygbPort 的材质表；物件只保存颜色索引，主题切换时换表不换布局
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* --- 材质：同一光源约束；日间暖阳冷影，夜间保留材质层次而非纯黑 --- */
export const palettes = {
  day: {
    land: "#cfd9d8", landHi: "#e1e5da", water: "#759da9", waterDeep: "#517e91", waterEdge: "#6a93a0",
    road: "#71878b", roadHi: "#7d9296", curb: "#abbcbf", sidewalk: "#c3cecb", mark: "#e0e5dd", yellow: "#dcc07e",
    concrete: "#c4ccc8", concreteHi: "#ced5d1", pad: "#bac4c0", paint: "#eef0e4", rail: "#5d727a",
    roof: "#eef0e6", wall: "#c4d3d1", shade: "#92abb3", glass: "#769cac", glassDark: "#5d7f8e", lit: "#f3e3b6",
    tree: "#699789", treeHi: "#85b29a", grass: "#a3bea6", park: "#7da38d", path: "#d9d9c5", hedge: "#7fa48c",
    orange: "#d98e5b", cyan: "#74a7af", white: "#dce5db", metal: "#768f99", steel: "#8ea2a8", dark: "#3b4d55",
    crane: "#d79b6f", craneWhite: "#e4e7dc", craneTie: "#5f7880",
    hull: "#3f5966", hullSide: "#4b6874", hullRed: "#b2644f", deck: "#8b9c97", hatch: "#7f918f", superstructure: "#e7e9df",
    tug: "#c26a4c", tugTop: "#ecebe1", tire: "#2c383d", foam: "#eef6f1",
    parking: "#a3afae", yard: "#b9c5bd", tank: "#c6c9b1", cab: "#f0eee1", truck: "#e87f46",
    shadow: "#3f5c59", shadowSoft: "#395967", fence: "#7b9096",
  },
  night: {
    land: "#233339", landHi: "#1c2b31", water: "#102831", waterDeep: "#0c1d27", waterEdge: "#14313b",
    road: "#304048", roadHi: "#364751", curb: "#3e545c", sidewalk: "#33464d", mark: "#6c7f85", yellow: "#8c7a4c",
    concrete: "#233238", concreteHi: "#28383e", pad: "#1f2c31", paint: "#5f7177", rail: "#4c6168",
    roof: "#4c5d62", wall: "#334b54", shade: "#243741", glass: "#203842", glassDark: "#18292f", lit: "#e9cd8e",
    tree: "#3e6659", treeHi: "#527969", grass: "#2f4a42", park: "#426859", path: "#56665d", hedge: "#3b5d50",
    orange: "#965e3e", cyan: "#3e717f", white: "#81958f", metal: "#587880", steel: "#5f7a82", dark: "#16252c",
    crane: "#946b4b", craneWhite: "#7e8f8b", craneTie: "#4a6169",
    hull: "#17262e", hullSide: "#1f323b", hullRed: "#5e3a33", deck: "#3c4c4f", hatch: "#354548", superstructure: "#6f7e7b",
    tug: "#7a4636", tugTop: "#879490", tire: "#0d171b", foam: "#7f9ea3",
    parking: "#28383c", yard: "#26383e", tank: "#68706a", cab: "#a7b8b3", truck: "#c97e4b",
    shadow: "#050e15", shadowSoft: "#050e15", fence: "#4f646b",
  },
};

/* --- 集装箱：真实港口以蓝、红、白、灰为主，橙/青保留品牌记忆 --- */
export const boxColors = {
  day: ["#d98e5b", "#74a7af", "#dce5db", "#5f7f9a", "#b5675a", "#9aa6a8", "#93aa8c", "#c7b07a"],
  night: ["#80513a", "#386370", "#6c7e79", "#344b62", "#6a423c", "#525d60", "#4e604f", "#73684f"],
};
export const BOX_WEIGHTS = [2.2, 1.8, 1.9, 2, 1.4, 1.4, 0.9, 0.6];

/* --- 车辆：社会车辆偏中性色，牵引车头与港内拖车用功能色 --- */
export const carColors = {
  day: ["#eef0ea", "#c9d1d0", "#4a5a62", "#2f3b42", "#b45b4c", "#6f8fa8", "#d7cfb8"],
  night: ["#97a6a3", "#76868a", "#26343b", "#1a252b", "#6d3e37", "#3d5367", "#857e6c"],
};
export const CAR_WEIGHTS = [3, 2.4, 1.6, 1.8, 0.7, 0.8, 0.6];
export const cabColors = {
  day: ["#e87f46", "#eef0e6", "#5f7f9a", "#c8574a", "#e0b25a"],
  night: ["#c97e4b", "#a7b8b3", "#3d5670", "#7c4038", "#8f7442"],
};

export function pick(random, weights) {
  let total = 0;
  for (const w of weights) total += w;
  let r = random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
