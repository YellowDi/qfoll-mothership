import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../views/HomePage.vue";
import ProjectPage from "../views/ProjectPage.vue";
import ProjectsPage from "../views/ProjectsPage.vue";
import YgbPage from "../views/YgbPage.vue";
import ContactPage from "../views/ContactPage.vue";
import DesignSpecPage from "../views/DesignSpecPage.vue";
import PricingPage from "../views/PricingPage.vue";
import CareersPage from "../views/CareersPage.vue";

const routes = [
  { path: "/", name: "home", component: HomePage },
  { path: "/projects", name: "projects", component: ProjectsPage },
  { path: "/project/:id", name: "project", component: ProjectPage },
  { path: "/company", redirect: "/contact" },
  { path: "/ygb", name: "ygb", component: YgbPage },
  { path: "/cloud-cabinet", redirect: "/ygb" },
  { path: "/contact", name: "contact", component: ContactPage },
  { path: "/pricing", name: "pricing", component: PricingPage },
  { path: "/careers", name: "careers", component: CareersPage },
  { path: "/design-spec", name: "design-spec", component: DesignSpecPage },
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

export default router;
