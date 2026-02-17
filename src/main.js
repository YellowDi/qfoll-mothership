import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import "./styles/remixicon-used.css";
import { useTheme } from "./composables/useTheme";

useTheme().initTheme();
createApp(App).use(router).mount("#app");
