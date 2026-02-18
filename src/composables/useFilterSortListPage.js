import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from "vue";

export const useFilterSortListPage = ({
  route,
  router,
  items,
  getFilterTag,
  getYear,
  getAnchoredPanelStyle,
  isDesktopPanelViewport,
}) => {
  const layout = ref("grid");
  const sortMode = ref("最新");
  const sortOpen = ref(false);
  const filterOpen = ref(false);
  const filterToggleRef = ref(null);
  const filterPanelRef = ref(null);
  const sortToggleRef = ref(null);
  const sortPanelRef = ref(null);
  const filterDesktopStyle = ref({});
  const sortDesktopStyle = ref({});
  const activeFilter = ref("全部");
  const selectedTags = ref([]);
  const selectedYears = ref([]);
  const syncingFromQuery = ref(false);
  const categoryNavRef = ref(null);
  const categoryCanScrollLeft = ref(false);
  const categoryCanScrollRight = ref(false);
  const mobileFilterPanel = ref(null);
  const mobileFilterHeight = ref(0);

  const listItems = computed(() => unref(items) || []);
  const filterTabs = computed(() => {
    const tags = listItems.value.map((item) => getFilterTag(item)).filter(Boolean);
    return ["全部", ...Array.from(new Set(tags))];
  });
  const tagOptions = computed(() => filterTabs.value.filter((item) => item !== "全部"));
  const yearOptions = computed(() => {
    const years = listItems.value
      .map((item) => Number(getYear(item)))
      .filter((value) => !Number.isNaN(value));
    return Array.from(new Set(years)).sort((a, b) => b - a);
  });
  const hasActiveFilters = computed(
    () => selectedTags.value.length > 0 || selectedYears.value.length > 0
  );
  const filterButtonText = computed(() => {
    const parts = [
      ...selectedTags.value.map((item) => String(item)),
      ...selectedYears.value.map((item) => `${item}年`),
    ];
    if (!parts.length) return "筛选";
    if (parts.length <= 2) return parts.join(" · ");
    return `${parts.slice(0, 2).join(" · ")} +${parts.length - 2}`;
  });
  const mobileFilterPanelStyle = computed(() => {
    if (!mobileFilterHeight.value) return {};
    return {
      minHeight: `${mobileFilterHeight.value}px`,
      maxHeight: `${mobileFilterHeight.value}px`,
    };
  });

  const toStringList = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item));
    if (value == null) return [];
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const applyQueryFilters = () => {
    syncingFromQuery.value = true;
    activeFilter.value = String(route.query.filter || "全部");
    selectedTags.value = toStringList(route.query.tags);
    selectedYears.value = toStringList(route.query.years)
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
    syncingFromQuery.value = false;
  };

  const handleDocClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (
      target.closest(".filter-panel") ||
      target.closest(".mobile-filter-panel") ||
      target.closest(".filter-toggle") ||
      target.closest(".sort-panel") ||
      target.closest(".mobile-sort-panel") ||
      target.closest(".sort-toggle")
    ) {
      return;
    }
    sortOpen.value = false;
    filterOpen.value = false;
  };

  const handleDocKeydown = (event) => {
    if (event.key !== "Escape") return;
    if (!sortOpen.value && !filterOpen.value) return;
    sortOpen.value = false;
    filterOpen.value = false;
  };

  const updateCategoryNavFades = () => {
    const el = categoryNavRef.value;
    if (!el) {
      categoryCanScrollLeft.value = false;
      categoryCanScrollRight.value = false;
      return;
    }
    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    categoryCanScrollLeft.value = el.scrollLeft > 1;
    categoryCanScrollRight.value = el.scrollLeft < maxScrollLeft - 1;
  };

  const updateDesktopPanelPosition = () => {
    if (!isDesktopPanelViewport()) {
      filterDesktopStyle.value = {};
      sortDesktopStyle.value = {};
      return;
    }
    if (filterOpen.value) {
      filterDesktopStyle.value = getAnchoredPanelStyle({
        triggerEl: filterToggleRef.value,
        panelEl: filterPanelRef.value,
        align: "end",
      });
    }
    if (sortOpen.value) {
      sortDesktopStyle.value = getAnchoredPanelStyle({
        triggerEl: sortToggleRef.value,
        panelEl: sortPanelRef.value,
        align: "end",
      });
    }
  };

  const updateMobileFilterHeight = () => {
    if (typeof window === "undefined") return;
    if (window.innerWidth > 768) {
      mobileFilterHeight.value = 0;
      return;
    }
    const panel = mobileFilterPanel.value;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const available = Math.floor(window.innerHeight - rect.top);
    mobileFilterHeight.value = Math.max(260, available);
  };

  const setMobileScrollLock = (locked) => {
    if (typeof window === "undefined") return;
    if (window.innerWidth > 768) return;
    const overflow = locked ? "hidden" : "";
    document.documentElement.style.overflow = overflow;
    document.body.style.overflow = overflow;
  };

  const clearFilters = () => {
    selectedTags.value = [];
    selectedYears.value = [];
    filterOpen.value = false;
  };

  const handleFilterAction = () => {
    if (hasActiveFilters.value) {
      clearFilters();
      return;
    }
    filterOpen.value = false;
  };

  onMounted(() => {
    applyQueryFilters();
    document.addEventListener("click", handleDocClick);
    document.addEventListener("keydown", handleDocKeydown);
    window.addEventListener("resize", updateMobileFilterHeight);
    window.addEventListener("resize", updateDesktopPanelPosition);
    window.addEventListener("resize", updateCategoryNavFades);
    window.addEventListener("scroll", updateDesktopPanelPosition, true);
    nextTick(() => {
      updateCategoryNavFades();
    });
  });

  onBeforeUnmount(() => {
    document.removeEventListener("click", handleDocClick);
    document.removeEventListener("keydown", handleDocKeydown);
    window.removeEventListener("resize", updateMobileFilterHeight);
    window.removeEventListener("resize", updateDesktopPanelPosition);
    window.removeEventListener("resize", updateCategoryNavFades);
    window.removeEventListener("scroll", updateDesktopPanelPosition, true);
    setMobileScrollLock(false);
  });

  watch(
    () => route.query,
    () => {
      applyQueryFilters();
    }
  );

  watch(
    [activeFilter, selectedTags, selectedYears],
    () => {
      if (syncingFromQuery.value) return;
      const query = {};
      if (activeFilter.value && activeFilter.value !== "全部") query.filter = activeFilter.value;
      if (selectedTags.value.length) query.tags = selectedTags.value.join(",");
      if (selectedYears.value.length) query.years = selectedYears.value.join(",");
      router.replace({ path: route.path, query });
    },
    { deep: true }
  );

  watch(filterTabs, async () => {
    await nextTick();
    updateCategoryNavFades();
  });

  watch(filterOpen, async (open) => {
    setMobileScrollLock(open);
    if (!open) {
      filterDesktopStyle.value = {};
      return;
    }
    await nextTick();
    updateMobileFilterHeight();
    updateDesktopPanelPosition();
  });

  watch(sortOpen, async (open) => {
    if (!open) {
      sortDesktopStyle.value = {};
      return;
    }
    await nextTick();
    updateDesktopPanelPosition();
  });

  return {
    layout,
    sortMode,
    sortOpen,
    filterOpen,
    filterToggleRef,
    filterPanelRef,
    sortToggleRef,
    sortPanelRef,
    filterDesktopStyle,
    sortDesktopStyle,
    filterTabs,
    activeFilter,
    selectedTags,
    selectedYears,
    tagOptions,
    yearOptions,
    categoryNavRef,
    categoryCanScrollLeft,
    categoryCanScrollRight,
    mobileFilterPanel,
    mobileFilterPanelStyle,
    hasActiveFilters,
    filterButtonText,
    updateCategoryNavFades,
    handleFilterAction,
  };
};
