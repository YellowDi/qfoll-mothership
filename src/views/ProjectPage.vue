<template>
  <AppLayout>
    <div class="mx-auto w-full max-w-360 px-14 pt-24 pb-10 max-lg:px-6 max-md:px-5 max-md:pt-20 max-md:pb-8">
      <div class="mx-auto w-full max-w-208">
        <div class="mb-8 flex items-center justify-center gap-4 text-sm">
          <span class="font-medium text-primary">{{ project.yearLabel || project.year }}</span>
          <span class="text-secondary">{{ project.tag || "客户案例" }}</span>
        </div>
        <h1
          class="text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),4rem)] leading-[clamp(2.28rem,calc(2.28rem+1.72*((100vw-23.4375rem)/66.5625)),4rem)] tracking-[-0.03em] font-medium text-center"
        >
          {{ project.title }}
        </h1>
        <p class="mt-6 text-center text-base leading-[1.8] text-secondary">
          {{ project.lead }}
        </p>
        <div v-if="project.primaryButtonText || project.secondaryButtonText" class="mt-5 flex items-center justify-center gap-1.5">
          <a
            v-if="project.primaryButtonText && project.primaryButtonUrl"
            class="btn-primary btn-sm"
            :href="project.primaryButtonUrl"
            :target="linkTarget(project.primaryButtonUrl)"
            :rel="linkRel(project.primaryButtonUrl)"
          >
            {{ project.primaryButtonText }}
          </a>
          <a
            v-if="project.secondaryButtonText && project.secondaryButtonUrl"
            class="btn-secondary btn-sm gap-1"
            :href="project.secondaryButtonUrl"
            :target="linkTarget(project.secondaryButtonUrl)"
            :rel="linkRel(project.secondaryButtonUrl)"
          >
            {{ project.secondaryButtonText }}
            <i class="ri-arrow-right-s-fill text-sm" aria-hidden="true"></i>
          </a>
        </div>
      </div>
      <div class="pt-20 w-full">
        <div class="mx-auto w-full max-w-[50%] max-md:max-w-full">
          <div class="flex w-full items-center justify-between gap-4 border-t border-line pt-3 max-md:flex-wrap">
            <ArticleSpeechPlayer :container-ref="articleContentRef" :content-key="route.params.id" />
            <button
              class="btn-base relative gap-2 px-2 py-1 text-primary hover:text-secondary"
              type="button"
              aria-label="复制当前页面链接"
              @click="copyShareLink"
            >
              <i class="ri-share-line text-base" aria-hidden="true"></i>
              分享
              <span
                v-if="copiedVisible"
                role="status"
                aria-live="polite"
                class="absolute left-1/2 top-full z-20 mt-2 inline-flex min-w-21 -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium leading-none text-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
              >
                已复制
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <article ref="articleContentRef" class="mx-auto w-full max-w-full overflow-x-clip px-0 pb-20 pt-6 font-sans text-base leading-relaxed text-primary" aria-label="项目正文">
      <div
        class="markdown-body detail-markdown-body"
        v-html="project.bodyHtml"
        ref="markdownRef"
      ></div>
    </article>

    <DetailMetaCard
      :info-tag-links="infoTagLinks"
      :company="project.company"
      :info-panel-html="project.infoPanelHtml"
    />

    <RelatedContentSection
      title="更多项目"
      view-all-to="/projects"
      :items="relatedProjects"
      :item-to="projectRelatedTo"
      :primary-meta="projectRelatedPrimaryMeta"
      :secondary-meta="projectRelatedSecondaryMeta"
    />
  </AppLayout>
</template>

<script setup>
import { computed, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "../layouts/AppLayout.vue";
import DetailMetaCard from "../components/DetailMetaCard.vue";
import RelatedContentSection from "../components/RelatedContentSection.vue";
import { projects, projectList } from "../data/projects";
import { initInlineVideoPlayers } from "../composables/useInlineVideoPlayers";
import { useDetailPageInteractions } from "../composables/useDetailPageInteractions";
import { mapInfoTagsToLinks } from "../composables/useInfoTagLinks";
import "../styles/markdown-media.css";

const ArticleSpeechPlayer = defineAsyncComponent(() =>
  import("../components/ArticleSpeechPlayer.vue")
);

const route = useRoute();
const project = computed(() => projects[route.params.id] || projects.hzhst);
const relatedProjects = computed(() =>
  projectList.filter((item) => item.id !== project.value.id).slice(0, 3)
);
const infoTagLinks = computed(() =>
  mapInfoTagsToLinks(project.value.infoTags, "/projects")
);
const projectRelatedTo = (item) => `/project/${item.id}`;
const projectRelatedPrimaryMeta = (item) => item.tag;
const projectRelatedSecondaryMeta = (item) => item.yearLabel || item.year;
const {
  markdownRef,
  articleContentRef,
  copiedVisible,
  copyShareLink,
} = useDetailPageInteractions({
  watchSource: () => route.params.id,
  initInlineVideoPlayers,
});

const isExternalLink = (url) => /^https?:\/\//i.test(url || "");
const linkTarget = (url) => (isExternalLink(url) ? "_blank" : "_self");
const linkRel = (url) => (isExternalLink(url) ? "noreferrer" : undefined);
</script>
