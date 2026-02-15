import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../views/HomePage.vue";
import ProjectPage from "../views/ProjectPage.vue";
import ProjectsPage from "../views/ProjectsPage.vue";
import YgbPage from "../views/YgbPage.vue";
import ContactPage from "../views/ContactPage.vue";
import DesignSpecPage from "../views/DesignSpecPage.vue";
import PricingPage from "../views/PricingPage.vue";
import CareersPage from "../views/CareersPage.vue";
import { projects } from "../data/projects";

const routes = [
  { path: "/", name: "home", component: HomePage, meta: { title: "企丰科技" } },
  { path: "/projects", name: "projects", component: ProjectsPage, meta: { title: "客户案例" } },
  { path: "/project/:id", name: "project", component: ProjectPage },
  { path: "/company", redirect: "/contact" },
  { path: "/ygb", name: "ygb", component: YgbPage, meta: { title: "云柜宝" } },
  { path: "/cloud-cabinet", redirect: "/ygb" },
  { path: "/contact", name: "contact", component: ContactPage, meta: { title: "联系我们" } },
  { path: "/pricing", name: "pricing", component: PricingPage, meta: { title: "定价" } },
  { path: "/careers", name: "careers", component: CareersPage, meta: { title: "工作机会" } },
  { path: "/design-spec", name: "design-spec", component: DesignSpecPage, meta: { title: "设计规范" } },
  { path: "/resources", redirect: "/design-spec" },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.afterEach((to) => {
  if (to.name === "project") {
    const projectId = String(to.params.id || "");
    const projectTitle = projects[projectId]?.title;
    document.title = projectTitle || "客户案例";
    return;
  }
  document.title = to.meta.title || "企丰科技";
});

export default router;
