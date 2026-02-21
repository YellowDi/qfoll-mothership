<template>
  <RouterLink class="group" :to="to">
    <div class="overflow-hidden rounded-sm">
      <CoverImage
        class="aspect-square w-full rounded-sm"
        :class="coverMediaClass"
        :src="cover"
        :src-set="coverSrcSet"
        :sizes="coverSizes"
        :alt="title"
        :video-src="coverVideo"
        :icon-class="coverIcon"
        :icon-scale="coverIconScale"
        :enable-video-cover="enableVideoCover"
        image-class="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
    </div>
    <div class="pt-3 text-left">
      <div class="text-lg leading-[1.3] font-medium text-primary max-md:text-base">{{ title }}</div>
      <div class="mt-4 flex items-center gap-2 text-sm">
        <span class="font-medium text-primary">{{ primaryMeta }}</span>
        <span class="text-secondary">{{ secondaryMeta }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import CoverImage from "./CoverImage.vue";

defineProps({
  to: {
    type: [String, Object],
    default: "/",
  },
  title: {
    type: String,
    default: "",
  },
  cover: {
    type: String,
    default: "",
  },
  coverSrcSet: {
    type: String,
    default: "",
  },
  coverSizes: {
    type: String,
    default: "",
  },
  coverVideo: {
    type: String,
    default: "",
  },
  coverIcon: {
    type: String,
    default: "",
  },
  coverIconScale: {
    type: Number,
    default: 1,
  },
  coverMediaClass: {
    type: String,
    default: "",
  },
  enableVideoCover: {
    type: Boolean,
    default: false,
  },
  primaryMeta: {
    type: String,
    default: "",
  },
  secondaryMeta: {
    type: String,
    default: "",
  },
});
</script>
