import { readonly, ref } from "vue";

const detailTitle = ref("");
const shouldShowDetailTitle = ref(false);

export const useHeaderBarDetailTitle = () => ({
  detailTitle: readonly(detailTitle),
  shouldShowDetailTitle: readonly(shouldShowDetailTitle),
});

export const setHeaderBarDetailTitle = ({ title = "", show = false } = {}) => {
  detailTitle.value = title;
  shouldShowDetailTitle.value = Boolean(title) && Boolean(show);
};

export const clearHeaderBarDetailTitle = () => {
  detailTitle.value = "";
  shouldShowDetailTitle.value = false;
};
