<template>
  <AppLayout>
    <div class="mx-auto w-full max-w-360 px-14 pt-24 pb-10 max-lg:px-6 max-md:px-5 max-md:pt-20 max-md:pb-8">
      <div ref="titleSectionRef" class="mx-auto w-full max-w-208">
        <div class="mb-8 flex items-center justify-center gap-4 text-sm">
          <time
            class="font-medium text-primary"
            :datetime="article.publishedAtRaw || undefined"
          >
            {{ article.publishedAt }}
          </time>
          <span class="text-secondary">{{ article.category || "最新动态" }}</span>
        </div>
        <h1
          class="text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),4rem)] leading-[clamp(2.28rem,calc(2.28rem+1.72*((100vw-23.4375rem)/66.5625)),4rem)] tracking-[-0.03em] font-medium text-center"
        >
          {{ article.title }}
        </h1>
        <p class="text-primary mt-6 text-center text-base leading-[1.8]">
          {{ article.lead }}
        </p>
        <div v-if="article.primaryButtonText || article.secondaryButtonText" class="mt-5 flex items-center justify-center gap-1.5">
          <a
            v-if="article.primaryButtonText && article.primaryButtonUrl"
            class="btn-primary btn-sm"
            :href="article.primaryButtonUrl"
            :target="linkTarget(article.primaryButtonUrl)"
            :rel="linkRel(article.primaryButtonUrl)"
          >
            {{ article.primaryButtonText }}
          </a>
          <a
            v-if="article.secondaryButtonText && article.secondaryButtonUrl"
            class="btn-secondary btn-sm gap-1"
            :href="article.secondaryButtonUrl"
            :target="linkTarget(article.secondaryButtonUrl)"
            :rel="linkRel(article.secondaryButtonUrl)"
          >
            {{ article.secondaryButtonText }}
            <i class="ri-arrow-right-s-fill text-sm" aria-hidden="true"></i>
          </a>
        </div>
      </div>
      <div class="pt-20 w-full">
        <div class="mx-auto w-full max-w-[40rem]">
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
                class="absolute left-1/2 top-full z-20 mt-2 inline-flex min-w-21 -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-xl border border-edge bg-surface px-4 py-3 text-sm font-medium leading-none text-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
              >
                已复制
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <article ref="articleContentRef" class="mx-auto w-full max-w-full overflow-x-clip px-0 pb-20 pt-6 font-sans text-base leading-relaxed text-primary" aria-label="文章正文">
      <div
        class="markdown-body detail-markdown-body"
        v-html="article.bodyHtml"
        ref="markdownRef"
      ></div>
    </article>

    <DetailMetaCard
      :info-tag-links="infoTagLinks"
      :company="article.company"
      :info-panel-html="article.infoPanelHtml"
    />

    <RelatedContentSection
      title="继续阅读"
      view-all-to="/news"
      :items="relatedArticles"
      :item-to="articleRelatedTo"
      :primary-meta="articleRelatedPrimaryMeta"
      :secondary-meta="articleRelatedSecondaryMeta"
      item-class="max-md:w-[72%] max-md:basis-[72%]"
    />
  </AppLayout>
</template>

<script setup>
import {
  computed,
  defineAsyncComponent,
  ref,
} from "vue";
import { useRoute } from "vue-router";
import AppLayout from "../layouts/AppLayout.vue";
import DetailMetaCard from "../components/DetailMetaCard.vue";
import RelatedContentSection from "../components/RelatedContentSection.vue";
import { newsArticles, newsList } from "../data/news";
import { initInlineVideoPlayers } from "../composables/useInlineVideoPlayers";
import { useDetailPageInteractions } from "../composables/useDetailPageInteractions";
import { mapInfoTagsToLinks } from "../composables/useInfoTagLinks";
import { useDetailHeaderBarToc } from "../composables/useDetailHeaderBarToc";
import "../styles/markdown-media.css";

const ArticleSpeechPlayer = defineAsyncComponent(() =>
  import("../components/ArticleSpeechPlayer.vue")
);

const route = useRoute();
const titleSectionRef = ref(null);
const article = computed(() => newsArticles[route.params.id] || newsList[0]);
const relatedArticles = computed(() => {
  const current = article.value;
  const excludeCurrent = (list) =>
    list.filter((item) => item.id !== current.id);
  const byNewest = (a, b) => (b.publishedTimestamp ?? 0) - (a.publishedTimestamp ?? 0);

  const sameCategory = excludeCurrent(newsList)
    .filter((item) => item.category === current.category)
    .sort(byNewest);
  const fallback = excludeCurrent(newsList)
    .filter((item) => !sameCategory.some((p) => p.id === item.id))
    .sort(byNewest);

  return [...sameCategory, ...fallback].slice(0, 3);
});
const infoTagLinks = computed(() =>
  mapInfoTagsToLinks(article.value.infoTags, "/news")
);
const articleRelatedTo = (item) => `/news/${item.id}`;
const articleRelatedPrimaryMeta = (item) => item.tag;
const articleRelatedSecondaryMeta = (item) => item.publishedAt;
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

useDetailHeaderBarToc({
  watchSource: () => route.params.id,
  pageTitle: computed(() => article.value.title),
  titleSectionRef,
  contentRootRef: markdownRef,
});
</script>
