const MISANS_STYLESHEET_URLS = [
  "/fonts/misans-normal/MiSans-Regular.min.css",
  "/fonts/misans-normal/MiSans-Medium.min.css",
];

const MI_SANS_LINK_FLAG = "data-misans-font";
const MI_SANS_PRELOAD_FLAG = "data-misans-preload";

const hasFontLink = (attrName, href) => {
  return Boolean(document.head.querySelector(`link[${attrName}="true"][href="${href}"]`));
};

const appendPreloadThenStylesheet = (href) => {
  if (hasFontLink(MI_SANS_LINK_FLAG, href) || hasFontLink(MI_SANS_PRELOAD_FLAG, href)) {
    return;
  }

  const preload = document.createElement("link");
  preload.rel = "preload";
  preload.as = "style";
  preload.href = href;
  preload.setAttribute(MI_SANS_PRELOAD_FLAG, "true");
  preload.onload = () => {
    preload.rel = "stylesheet";
    preload.removeAttribute("as");
    preload.setAttribute(MI_SANS_LINK_FLAG, "true");
    preload.removeAttribute(MI_SANS_PRELOAD_FLAG);
  };

  preload.onerror = () => {
    preload.rel = "stylesheet";
    preload.removeAttribute("as");
    preload.setAttribute(MI_SANS_LINK_FLAG, "true");
    preload.removeAttribute(MI_SANS_PRELOAD_FLAG);
  };

  document.head.appendChild(preload);
};

const scheduleLoad = (task) => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(task, { timeout: 1200 });
    return;
  }

  window.setTimeout(task, 120);
};

export const loadMiSansFonts = () => {
  scheduleLoad(() => {
    MISANS_STYLESHEET_URLS.forEach(appendPreloadThenStylesheet);
  });
};
