import { computed, ref } from "vue";

const storageKey = "qf-theme";
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
  const saved = window.localStorage.getItem(storageKey);
  applyTheme(saved === "dark" || saved === "light" ? saved : getPreferredTheme());
};

const setTheme = (value) => {
  applyTheme(value);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, theme.value);
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
