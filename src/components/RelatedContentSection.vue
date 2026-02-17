<template>
  <div class="w-full max-w-360 self-stretch mx-auto mt-10 overflow-x-hidden max-md:max-w-none max-md:w-screen max-md:ml-[calc(50%-50vw)] max-md:mr-[calc(50%-50vw)]">
    <div class="mx-auto flex w-full items-center justify-between px-16 max-xl:px-6 max-md:px-5">
      <h3 class="text-lg font-medium">{{ title }}</h3>
      <RouterLink class="text-[13px] text-muted transition-colors hover:text-ink" :to="viewAllTo">
        查看全部
      </RouterLink>
    </div>
    <div class="mx-auto w-full px-16 pb-20 pt-6 max-xl:px-6 max-md:pl-5 max-md:pr-0">
      <div class="no-scrollbar grid grid-cols-3 gap-6 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:gap-4 max-md:overflow-x-auto max-md:pb-4 max-md:pr-6 max-md:scroll-pl-5 max-md:scroll-pr-6 max-md:-ml-5 max-md:pl-5">
        <RouterLink
          v-for="item in items"
          :key="item.id"
          class="group overflow-hidden rounded-md max-md:snap-start max-md:min-w-[72%] max-md:flex-shrink-0"
          :class="itemClass"
          :to="itemTo(item)"
        >
          <div class="aspect-square w-full overflow-hidden rounded-md">
            <CoverImage
              class="h-full w-full rounded-md"
              :src="item.cover"
              :src-set="item.coverSrcSet"
              sizes="(max-width: 768px) 72vw, (max-width: 1280px) 33vw, 26vw"
              :alt="item.title"
              image-class="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          </div>
          <div class="pt-4 text-left">
            <div class="text-xl leading-[1.3] font-medium text-ink max-md:text-lg">{{ item.title }}</div>
            <div class="mt-4 flex items-center gap-2 text-sm">
              <span class="font-medium text-ink">{{ primaryMeta(item) }}</span>
              <span class="text-muted">{{ secondaryMeta(item) }}</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import CoverImage from "./CoverImage.vue";

defineProps({
  title: {
    type: String,
    default: "",
  },
  viewAllTo: {
    type: [String, Object],
    default: "/",
  },
  items: {
    type: Array,
    default: () => [],
  },
  itemTo: {
    type: Function,
    required: true,
  },
  primaryMeta: {
    type: Function,
    required: true,
  },
  secondaryMeta: {
    type: Function,
    required: true,
  },
  itemClass: {
    type: String,
    default: "",
  },
});
</script>
