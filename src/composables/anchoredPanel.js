const DEFAULT_GAP = 10;
const DEFAULT_MARGIN = 12;

export const isDesktopPanelViewport = (breakpoint = 768) => {
  if (typeof window === "undefined") return false;
  return window.innerWidth > breakpoint;
};

export const getAnchoredPanelStyle = ({
  triggerEl,
  panelEl,
  align = "end",
  gap = DEFAULT_GAP,
  margin = DEFAULT_MARGIN,
}) => {
  if (!triggerEl || !panelEl || typeof window === "undefined") return {};

  const triggerRect = triggerEl.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const naturalWidth = Math.ceil(panelEl.offsetWidth || panelEl.getBoundingClientRect().width || 0);
  const naturalHeight = Math.ceil(panelEl.offsetHeight || panelEl.getBoundingClientRect().height || 0);
  const width = Math.min(naturalWidth || 0, Math.max(0, viewportWidth - margin * 2));
  const maxHeight = Math.max(120, viewportHeight - margin * 2);

  const belowTop = triggerRect.bottom + gap;
  const aboveTop = triggerRect.top - gap - naturalHeight;
  const spaceBelow = viewportHeight - belowTop - margin;
  const spaceAbove = triggerRect.top - gap - margin;
  const placeAbove = spaceBelow < naturalHeight && spaceAbove > spaceBelow;

  let top = placeAbove ? aboveTop : belowTop;
  top = Math.max(margin, Math.min(top, viewportHeight - margin - Math.min(naturalHeight, maxHeight)));

  let left;
  if (align === "start") {
    left = triggerRect.left;
  } else if (align === "center") {
    left = triggerRect.left + (triggerRect.width - width) / 2;
  } else {
    left = triggerRect.right - width;
  }
  left = Math.max(margin, Math.min(left, viewportWidth - margin - width));

  return {
    position: "fixed",
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
    width: `${Math.round(width)}px`,
    maxHeight: `${Math.round(maxHeight)}px`,
    overflowY: "auto",
  };
};
