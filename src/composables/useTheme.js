import { computed, ref } from "vue";

const userStorageKey = "qf-theme-user";
const legacyStorageKey = "qf-theme";
const theme = ref("light");
let initialized = false;

const getPreferredTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (value) => {
  const next = value === "dark" ? "dark" : "light";
  theme.value = next;
  document.documentElement.classList.toggle("dark", next === "dark");
};

const initTheme = () => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  applyTheme(getPreferredTheme());
  const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemThemeChange = (event) => {
    // System setting always has higher priority than manual choice.
    applyTheme(event.matches ? "dark" : "light");
  };
  mediaQueryList.addEventListener("change", onSystemThemeChange);
};

const setTheme = (value) => {
  applyTheme(value);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(userStorageKey, theme.value);
    window.localStorage.removeItem(legacyStorageKey);
  }
};

const toggleTheme = () => {
  setTheme(theme.value === "dark" ? "light" : "dark");
};

const isDark = computed(() => theme.value === "dark");

export const useTheme = () => ({
  theme,
  isDark,
  initTheme,
  setTheme,
  toggleTheme,
});
