/**
 * [INPUT]: 依赖 Vue 应用、根组件、路由、全局样式与主题初始化器
 * [OUTPUT]: 对外启动并挂载 Vue 应用
 * [POS]: 运行时入口，负责初始化主题、插件和 #app 挂载
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";
import "./styles/remixicon-used.css";
import { useTheme } from "./composables/useTheme";
useTheme().initTheme();
createApp(App).use(router).mount("#app");
