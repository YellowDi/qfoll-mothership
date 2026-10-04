/**
 * [INPUT]: 依赖 Vue 响应式引用
 * [OUTPUT]: 对外提供顶栏详情标题的共享读写状态
 * [POS]: HeaderBar 与详情页之间的轻量状态桥接
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { readonly, ref } from "vue";

const detailTitle = ref("");
const shouldShowDetailTitle = ref(false);
const tocItems = ref([]);
const activeTocId = ref("");
const tocOpen = ref(false);
let onTocNavigate = null;

export const useHeaderBarDetailTitle = () => ({
  detailTitle: readonly(detailTitle),
  shouldShowDetailTitle: readonly(shouldShowDetailTitle),
  tocItems: readonly(tocItems),
  activeTocId: readonly(activeTocId),
  tocOpen: readonly(tocOpen),
});

export const setHeaderBarDetailTitle = ({ title = "", show = false } = {}) => {
  detailTitle.value = title;
  shouldShowDetailTitle.value = Boolean(title) && Boolean(show);
  if (!shouldShowDetailTitle.value) {
    tocOpen.value = false;
  }
};

export const setHeaderBarDetailToc = ({
  items = [],
  activeId = "",
  onNavigate = null,
} = {}) => {
  tocItems.value = Array.isArray(items) ? items : [];
  activeTocId.value = activeId || "";
  onTocNavigate = typeof onNavigate === "function" ? onNavigate : null;
  if (!tocItems.value.length) {
    tocOpen.value = false;
  }
};

export const setHeaderBarActiveTocId = (id = "") => {
  activeTocId.value = id || "";
};

export const toggleHeaderBarToc = () => {
  if (!tocItems.value.length || !shouldShowDetailTitle.value) return;
  tocOpen.value = !tocOpen.value;
};

export const closeHeaderBarToc = () => {
  tocOpen.value = false;
};

export const navigateHeaderBarToc = (id) => {
  if (!id || typeof onTocNavigate !== "function") return;
  onTocNavigate(id);
  tocOpen.value = false;
};

export const clearHeaderBarDetailTitle = () => {
  detailTitle.value = "";
  shouldShowDetailTitle.value = false;
  tocItems.value = [];
  activeTocId.value = "";
  tocOpen.value = false;
  onTocNavigate = null;
};
