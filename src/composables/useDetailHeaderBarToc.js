import { nextTick, onBeforeUnmount, watch } from "vue";
import {
  clearHeaderBarDetailTitle,
  closeHeaderBarToc,
  setHeaderBarActiveTocId,
  setHeaderBarDetailTitle,
  setHeaderBarDetailToc,
} from "./useHeaderBarDetailTitle";

const HEADER_OFFSET = 72;
const HEADING_SELECTOR = "h2, h3";

const normalizeHeadingText = (value) => String(value || "").trim();

const toHeadingId = (text, index, usedIds) => {
  const base =
    normalizeHeadingText(text)
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || `section-${index + 1}`;
  let id = base;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
};

export const useDetailHeaderBarToc = ({
  watchSource,
  pageTitle,
  titleSectionRef,
  contentRootRef,
}) => {
  let titleObserver = null;
  let headingNodes = [];
  let headerHidden = false;
  let activeHeadingId = "";
  let scrollRaf = null;

  const getPageTitle = () => normalizeHeadingText(pageTitle?.value);

  const getActiveHeading = () => {
    if (!headingNodes.length) return null;
    let current = null;
    for (const heading of headingNodes) {
      const rect = heading.getBoundingClientRect();
      if (rect.top <= HEADER_OFFSET) {
        current = heading;
      } else {
        break;
      }
    }
    return current;
  };

  const syncHeaderTitle = () => {
    const activeHeading = getActiveHeading();
    const title = normalizeHeadingText(activeHeading?.textContent) || getPageTitle();
    setHeaderBarDetailTitle({
      title,
      show: headerHidden,
    });
    const nextId = activeHeading?.id || "";
    if (nextId !== activeHeadingId) {
      activeHeadingId = nextId;
      setHeaderBarActiveTocId(activeHeadingId);
    }
  };

  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = null;
      syncHeaderTitle();
    });
  };

  const disposeTitleObserver = () => {
    if (titleObserver) {
      titleObserver.disconnect();
      titleObserver = null;
    }
  };

  const disposeScrollListeners = () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    if (scrollRaf) {
      window.cancelAnimationFrame(scrollRaf);
      scrollRaf = null;
    }
  };

  const scrollToHeading = (id) => {
    const target = document.getElementById(id);
    if (!(target instanceof HTMLElement)) return;
    const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    if (window.history?.replaceState) {
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  const collectHeadings = () => {
    const root = contentRootRef?.value;
    if (!(root instanceof HTMLElement)) {
      headingNodes = [];
      setHeaderBarDetailToc({ items: [], activeId: "", onNavigate: null });
      return;
    }
    const nodes = Array.from(root.querySelectorAll(HEADING_SELECTOR)).filter(
      (node) => node instanceof HTMLElement
    );
    const usedIds = new Set();
    headingNodes = nodes;
    const items = headingNodes
      .map((node, index) => {
        const text = normalizeHeadingText(node.textContent);
        if (!text) return null;
        const level = Number(node.tagName.slice(1)) || 2;
        let id = node.id || "";
        if (!id || usedIds.has(id)) {
          id = toHeadingId(text, index, usedIds);
        } else {
          usedIds.add(id);
        }
        node.id = id;
        return { id, text, level };
      })
      .filter(Boolean);
    setHeaderBarDetailToc({
      items,
      activeId: activeHeadingId,
      onNavigate: scrollToHeading,
    });
  };

  const setupTitleObserver = () => {
    disposeTitleObserver();
    const titleSection = titleSectionRef?.value;
    if (!(titleSection instanceof HTMLElement) || !("IntersectionObserver" in window)) return;
    titleObserver = new IntersectionObserver(
      ([entry]) => {
        headerHidden = !(entry?.isIntersecting ?? true);
        if (!headerHidden) {
          closeHeaderBarToc();
        }
        syncHeaderTitle();
      },
      { threshold: 0 }
    );
    titleObserver.observe(titleSection);
  };

  const setup = async () => {
    headerHidden = false;
    activeHeadingId = "";
    setHeaderBarDetailTitle({ title: getPageTitle(), show: false });
    setHeaderBarDetailToc({ items: [], activeId: "", onNavigate: null });
    await nextTick();
    collectHeadings();
    setupTitleObserver();
    disposeScrollListeners();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    syncHeaderTitle();
  };

  watch(watchSource, setup, { immediate: true });

  onBeforeUnmount(() => {
    disposeTitleObserver();
    disposeScrollListeners();
    clearHeaderBarDetailTitle();
  });
};
