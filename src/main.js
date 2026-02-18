import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import "./styles/misans-split-local.css";
import "./styles/remixicon-used.css";
import { useTheme } from "./composables/useTheme";

const applyPlatformClass = () => {
  const ua = navigator.userAgent || "";
  const platform = navigator.userAgentData?.platform || navigator.platform || "";
  const isMac = /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac|iPhone|iPad|iPod/i.test(ua);
  const isWindows = /Win/i.test(platform) || /Windows/i.test(ua);
  const root = document.documentElement;
  const body = document.body;

  root.classList.remove("is-mac", "is-windows");
  body.classList.remove("is-mac", "is-windows");

  if (isMac) {
    root.classList.add("is-mac");
    body.classList.add("is-mac");
    return;
  }

  if (isWindows) {
    root.classList.add("is-windows");
    body.classList.add("is-windows");
  }
};

applyPlatformClass();
useTheme().initTheme();
createApp(App).use(router).mount("#app");
