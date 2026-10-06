/**
 * [INPUT]: 依赖内容标签和路由映射约定
 * [OUTPUT]: 对外提供详情元信息标签链接派生逻辑
 * [POS]: 详情元数据展示的纯数据适配工具
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const parseYearTag = (tag) => {
  const match = String(tag || "").trim().match(/^(\d{4})\s*年?$/);
  return match ? Number(match[1]) : null;
};

const resolveTagTarget = (basePath, tag) => {
  const text = String(tag || "").trim();
  if (!text) return { path: basePath };
  const year = parseYearTag(text);
  if (year) {
    return { path: basePath, query: { years: String(year) } };
  }
  return { path: basePath, query: { tags: text } };
};

export const mapInfoTagsToLinks = (infoTags, basePath) =>
  (infoTags || []).map((tag) => ({
    label: tag,
    to: resolveTagTarget(basePath, tag),
  }));
