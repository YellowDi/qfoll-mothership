/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 PARAM_SPEC (参数元数据：键/标签/范围/默认值)、ParamKey/DotRippleParams 类型 (由 PARAM_SPEC 推出)、defaultParams()、GLYPHS (疏密字符序列)
 * [POS]: dotRipple 的调参契约，引擎取默认值，调试台据此生成滑杆，二者不各自硬编码
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* 字符疏密序列：由强度从弱到强依次落在 . : + #，品牌约定，不开放为参数 */
export const GLYPHS = [".", ":", "+", "#"];

/* as const：键与默认值保持字面量，参数类型直接由此推出，增删参数只改这一处 */
export const PARAM_SPEC = [
  { key: "cell", label: "行距 (px)", min: 10, max: 28, step: 1, value: 12 },
  { key: "gain", label: "对比度", min: 0.5, max: 6, step: 0.05, value: 1.8 },
  { key: "pointer", label: "跟随强度", min: 0, max: 3, step: 0.05, value: 1.25 },
  { key: "brush", label: "笔刷大小", min: 1, max: 6, step: 0.1, value: 4.2 },
  { key: "trailFade", label: "尾迹余晖", min: 0.85, max: 0.99, step: 0.005, value: 0.935 },
  { key: "burst", label: "点击涟漪范围", min: 0, max: 2, step: 0.05, value: 0.65 },
] as const;

export type ParamKey = (typeof PARAM_SPEC)[number]["key"];
export type DotRippleParams = Record<ParamKey, number>;

export const defaultParams = () =>
  Object.fromEntries(PARAM_SPEC.map(({ key, value }) => [key, value])) as DotRippleParams;
