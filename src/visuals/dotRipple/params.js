/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 PARAM_SPEC (参数元数据：键/标签/范围/默认值)、defaultParams()、GLYPHS (疏密字符序列)
 * [POS]: dotRipple 的调参契约，引擎据此取默认值，调试台据此生成滑杆，二者不各自硬编码
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* 字符疏密序列：由波幅从弱到强依次落在 . : + #，品牌约定，不开放为参数 */
export const GLYPHS = [".", ":", "+", "#"];

export const PARAM_SPEC = [
  { key: "cell", label: "行距 (px)", min: 10, max: 28, step: 1, value: 12 },
  { key: "speed", label: "波速", min: 0.05, max: 0.95, step: 0.01, value: 0.11 },
  { key: "damping", label: "余波持续", min: 0.9, max: 0.999, step: 0.001, value: 0.95 },
  { key: "gain", label: "对比度", min: 0.5, max: 6, step: 0.05, value: 1.8 },
  { key: "pointer", label: "指针扰动", min: 0, max: 3, step: 0.05, value: 2.1 },
];

export const defaultParams = () => Object.fromEntries(PARAM_SPEC.map(({ key, value }) => [key, value]));
