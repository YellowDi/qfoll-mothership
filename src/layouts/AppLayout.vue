<template>
  <div class="min-h-screen bg-bg text-ink transition-colors duration-300">
    <aside
      :class="[
        'fixed left-0 top-0 bottom-0 z-30 w-50 overflow-y-auto bg-bg transition-transform duration-300 ease-out',
        'max-md:w-[334px] max-md:max-w-[90vw]',
        mobileNavOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
        desktopCollapsed ? 'md:-translate-x-[110%]' : 'md:translate-x-0',
      ]"
    >
      <div class="flex w-full flex-col gap-6 px-4 py-6 md:mt-46.75 max-md:mt-0">
        <div class="relative w-full">
          <div
            class="transition-all duration-300 ease-out"
            :class="
              navLevel === 'root'
                ? 'translate-x-0 opacity-100 pointer-events-auto'
                : '-translate-x-full opacity-0 pointer-events-none'
            "
          >
            <nav class="flex flex-col gap-2 text-sm font-medium">
              <button
                type="button"
                :class="rootButtonClass(route.path.startsWith('/project') || route.path === '/projects')"
                @click="goProjects"
              >
                <span class="flex items-center justify-between">
                  <span>客户案例</span>
                  <i class="ri-arrow-right-line text-sm" :class="arrowClass(route.path.startsWith('/project') || route.path === '/projects')"></i>
                </span>
              </button>
              <RouterLink to="/ygb" :class="rootLinkClass(route.path === '/ygb')">
                <span class="flex items-center justify-between">
                  <span>云柜宝</span>
                  <i class="ri-arrow-right-line text-sm" :class="arrowClass(route.path === '/ygb')"></i>
                </span>
              </RouterLink>
              <button
                type="button"
                :class="rootButtonClass(isCompanyRoute(route.path))"
                @click="goCompany"
              >
                <span class="flex items-center justify-between">
                  <span>公司</span>
                  <i class="ri-arrow-right-line text-sm" :class="arrowClass(isCompanyRoute(route.path))"></i>
                </span>
              </button>
            </nav>
          </div>
          <div
            class="absolute left-full top-0 w-full transition-transform duration-300 ease-out"
            :class="navLevel !== 'root' ? '-translate-x-full opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'"
          >
            <div class="flex flex-col gap-4">
              <button
                class="flex w-40 items-center gap-2 px-3 text-left text-sm font-medium text-muted"
                type="button"
                @click="goRoot"
              >
                <i class="ri-arrow-left-line text-base"></i>
                返回
              </button>
              <nav v-if="navLevel === 'projects'" class="flex flex-col gap-2 text-sm font-medium">
                <RouterLink
                  v-for="item in sidebarProjectList"
                  :key="item.id"
                  :to="`/project/${item.id}`"
                  :class="projectLinkClass(route.params.id === item.id)"
                >
                  <span class="flex items-center justify-between">
                    <span class="truncate">{{ item.sidebarTitle }}</span>
                    <i class="ri-arrow-right-line text-sm opacity-0 transition-opacity group-hover:opacity-100"></i>
                  </span>
                </RouterLink>
              </nav>
              <nav v-else-if="navLevel === 'company'" class="flex flex-col gap-2 text-sm font-medium">
                <RouterLink
                  v-for="item in companyMenu"
                  :key="item.path"
                  :to="item.path"
                  :class="submenuLinkClass(route.path === item.path)"
                >
                  <span class="flex items-center justify-between">
                    <span>{{ item.label }}</span>
                    <i class="ri-arrow-right-line text-sm opacity-0 transition-opacity group-hover:opacity-100"></i>
                  </span>
                </RouterLink>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <HeaderBar :on-toggle="toggleNav" :on-toggle-theme="toggleTheme" :is-dark="isDark" />
    <div
      class="fixed inset-0 z-20 hidden bg-black/35 opacity-0 pointer-events-none transition-opacity duration-300 max-md:block"
      :class="{ 'opacity-100 pointer-events-auto': mobileNavOpen }"
      @click="closeNav"
    />

    <main
      class="min-h-screen bg-bg transition-[margin-left] duration-300"
      :class="[desktopCollapsed ? 'md:ml-0' : 'md:ml-50', route.path === '/' ? 'overflow-visible' : 'overflow-x-hidden']"
    >
      <div
        class="flex flex-col items-center transition-transform duration-300 max-md:items-start"
        :class="mobileNavOpen ? 'max-md:translate-x-83.5' : ''"
      >
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { projectList } from "../data/projects";
import HeaderBar from "../components/HeaderBar.vue";
import { useTheme } from "../composables/useTheme";

const route = useRoute();
const router = useRouter();
const isCompanyRoute = (path) =>
  path === "/contact" ||
  path === "/pricing" ||
  path === "/careers" ||
  path === "/design-spec";
const desktopCollapsed = ref(route.path === "/");
const mobileNavOpen = ref(false);
const { isDark, toggleTheme } = useTheme();
const navLevel = ref(
  route.path.startsWith("/project") || route.path === "/projects"
    ? "projects"
    : isCompanyRoute(route.path)
    ? "company"
    : "root"
);
const companyMenu = [
  { path: "/contact", label: "联系我们" },
  { path: "/pricing", label: "定价" },
  { path: "/careers", label: "工作机会" },
  { path: "/design-spec", label: "设计规范" },
];
const toYearValue = (item) => {
  const year = Number.parseInt(String(item?.year ?? ""), 10);
  return Number.isFinite(year) ? year : -Infinity;
};
const toMonthValue = (item) => {
  const month = Number.parseInt(String(item?.startMonth ?? ""), 10);
  if (!Number.isFinite(month)) return 0;
  return Math.min(12, Math.max(1, month));
};
const sidebarProjectList = computed(() =>
  [...projectList].sort((a, b) => {
    const byYear = toYearValue(b) - toYearValue(a);
    if (byYear !== 0) return byYear;
    const byMonth = toMonthValue(b) - toMonthValue(a);
    if (byMonth !== 0) return byMonth;
    return String(a.title || "").localeCompare(String(b.title || ""), "zh-Hans-CN");
  })
);

const toggleNav = () => {
  if (window.matchMedia("(max-width: 768px)").matches) {
    mobileNavOpen.value = !mobileNavOpen.value;
    return;
  }
  desktopCollapsed.value = !desktopCollapsed.value;
};

const closeNav = () => {
  mobileNavOpen.value = false;
};

const rootBase =
  "group rounded-md px-3 py-2 text-sm font-medium transition-colors text-left w-40";
const rootLinkClass = (active) =>
  `${rootBase} ${
    active
      ? "bg-black/8 text-ink dark:bg-white/10"
      : "text-ink hover:bg-black/6 dark:hover:bg-white/8"
  }`;
const rootButtonClass = (active) =>
  `${rootBase} ${
    active
      ? "bg-black/8 text-ink dark:bg-white/10"
      : "text-ink hover:bg-black/6 dark:hover:bg-white/8"
  }`;
const arrowClass = (active) =>
  active ? "opacity-0" : "opacity-0 transition-opacity group-hover:opacity-100";
const projectLinkClass = (active) =>
  `group rounded-md px-3 py-2 text-sm font-medium transition-colors w-40 ${
    active
      ? "bg-black/8 text-ink dark:bg-white/10"
      : "text-ink hover:bg-black/6 dark:hover:bg-white/8"
  }`;
const submenuLinkClass = (active) =>
  `group rounded-md px-3 py-2 text-sm font-medium transition-colors w-40 ${
    active
      ? "bg-black/8 text-ink dark:bg-white/10"
      : "text-ink hover:bg-black/6 dark:hover:bg-white/8"
  }`;

const goProjects = () => {
  navLevel.value = "projects";
  if (route.path !== "/projects") {
    router.push("/projects");
  }
};

const goCompany = () => {
  navLevel.value = "company";
  if (!isCompanyRoute(route.path)) {
    router.push("/contact");
  }
};

const goRoot = () => {
  navLevel.value = "root";
};

watch(
  () => route.fullPath,
  () => {
    mobileNavOpen.value = false;
    desktopCollapsed.value = route.path === "/";
    if (route.path.startsWith("/project") || route.path === "/projects") {
      navLevel.value = navLevel.value === "root" ? "projects" : navLevel.value;
      return;
    }
    if (isCompanyRoute(route.path)) {
      navLevel.value = navLevel.value === "root" ? "company" : navLevel.value;
      return;
    }
    navLevel.value = "root";
  }
);
</script>
