import { createRouter, createWebHistory } from "vue-router";
import { projects } from "../data/projects";
import { newsArticles } from "../data/news";

const routes = [
  { path: "/", name: "home", component: () => import("../views/HomePage.vue"), meta: { title: "企丰科技" } },
  { path: "/projects", name: "projects", component: () => import("../views/ProjectsPage.vue"), meta: { title: "客户案例" } },
  { path: "/project/:id", name: "project", component: () => import("../views/ProjectPage.vue") },
  { path: "/news", name: "news", component: () => import("../views/NewsPage.vue"), meta: { title: "最新动态" } },
  { path: "/news/:id", name: "news-article", component: () => import("../views/NewsArticlePage.vue") },
  { path: "/company", redirect: "/about" },
  { path: "/ygb", name: "ygb", component: () => import("../views/YgbPage.vue"), meta: { title: "云柜宝" } },
  { path: "/water-env", name: "water-env", component: () => import("../views/WaterEnvPage.vue"), meta: { title: "水环境智慧监控" } },
  { path: "/cloud-cabinet", redirect: "/ygb" },
  { path: "/about", name: "about", component: () => import("../views/AboutPage.vue"), meta: { title: "关于我们" } },
  { path: "/contact", name: "contact", component: () => import("../views/ContactPage.vue"), meta: { title: "联系我们" } },
  { path: "/pricing", name: "pricing", component: () => import("../views/PricingPage.vue"), meta: { title: "定价" } },
  { path: "/careers", name: "careers", component: () => import("../views/CareersPage.vue"), meta: { title: "工作机会" } },
  { path: "/design-spec", name: "design-spec", component: () => import("../views/DesignSpecPage.vue"), meta: { title: "设计规范" } },
  { path: "/resources", redirect: "/design-spec" },
  { path: "/:pathMatch(.*)*", name: "not-found", component: () => import("../views/NotFoundPage.vue"), meta: { title: "页面不存在" } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  const brand = "企丰科技";
  const withBrandSuffix = (title) =>
    title && title !== brand ? `${title}｜${brand}` : brand;

  if (to.name === "home") {
    document.title = brand;
    return;
  }

  if (to.name === "project") {
    const projectId = String(to.params.id || "");
    const projectTitle = projects[projectId]?.title;
    document.title = withBrandSuffix(projectTitle || "客户案例");
    return;
  }

  if (to.name === "news-article") {
    const articleId = String(to.params.id || "");
    const articleTitle = newsArticles[articleId]?.title;
    document.title = withBrandSuffix(articleTitle || "最新动态");
    return;
  }

  document.title = withBrandSuffix(to.meta.title || brand);
});

export default router;
