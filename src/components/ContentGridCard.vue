<template>
  <RouterLink class="group" :to="to">
    <div class="overflow-hidden rounded-sm">
      <CoverImage
        class="aspect-square w-full rounded-sm"
        :src="cover"
        :alt="title"
        image-class="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
    </div>
    <div class="pt-4 text-left">
      <div class="text-xl leading-[1.3] font-medium text-ink max-md:text-lg">{{ title }}</div>
      <div class="mt-4 flex items-center gap-2 text-sm">
        <span class="font-medium text-ink">{{ primaryMeta }}</span>
        <span class="text-muted">{{ secondaryMeta }}</span>
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
