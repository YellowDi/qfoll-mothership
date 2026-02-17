<template>
  <div
    class="relative h-full w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/35"
  >
    <div
      v-if="showSkeleton"
      aria-hidden="true"
      class="absolute inset-0 animate-pulse bg-zinc-100/70 transition-opacity duration-300 dark:bg-zinc-700/40"
    ></div>
    <img
      v-if="imageSrc"
      :src="imageSrc"
      :alt="alt"
      loading="lazy"
      decoding="async"
      class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
      :class="[imageClass, showImage ? 'opacity-100' : 'opacity-0']"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  src: {
    type: String,
    default: "",
  },
  alt: {
    type: String,
    default: "",
  },
  imageClass: {
    type: String,
    default: "",
  },
});

const imageLoaded = ref(false);
const imageError = ref(false);

const imageSrc = computed(() => {
  const raw = String(props.src || "").trim();
  if (!raw) return "";
  const urlMatches = [...raw.matchAll(/url\((['"]?)(.*?)\1\)/g)];
  if (urlMatches.length) {
    return String(urlMatches[urlMatches.length - 1][2] || "").trim();
  }
  if (raw.includes("gradient(")) return "";
  return raw;
});

const showImage = computed(
  () => Boolean(imageSrc.value) && imageLoaded.value && !imageError.value
);
const showSkeleton = computed(() => !showImage.value);

const resetState = () => {
  imageLoaded.value = false;
  imageError.value = false;
};

const handleLoad = () => {
  imageLoaded.value = true;
};

const handleError = () => {
  imageError.value = true;
};

watch(
  () => props.src,
  () => {
    resetState();
  },
  { immediate: true }
);
</script>
