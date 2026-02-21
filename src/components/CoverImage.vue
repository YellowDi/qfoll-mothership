<template>
  <div
    ref="rootRef"
    class="cover-media group relative h-full w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/35"
    @contextmenu="handleSurfaceContextMenu"
  >
    <div
      v-if="showSkeleton"
      aria-hidden="true"
      class="absolute inset-0 animate-pulse bg-zinc-100/70 transition-opacity duration-300 dark:bg-zinc-700/40"
    ></div>
    <img
      v-if="imageSrc"
      :src="imageSrc"
      :srcset="imageSrcSet || undefined"
      :sizes="imageSizes || undefined"
      :alt="alt"
      loading="lazy"
      decoding="async"
      class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
      :class="[imageClass, showImage ? 'opacity-100' : 'opacity-0']"
      @load="handleLoad"
      @error="handleError"
    />
    <video
      v-if="shouldRenderVideo"
      ref="videoRef"
      class="absolute inset-0 h-full w-full object-cover"
      :src="normalizedVideoSrc"
      :poster="imageSrc || undefined"
      muted
      loop
      playsinline
      preload="metadata"
      disablepictureinpicture
      controlslist="nodownload nofullscreen noplaybackrate noremoteplayback"
      aria-hidden="true"
      @loadedmetadata="syncPlaybackState"
      @error="handleVideoError"
      @contextmenu.prevent
    />
    <div
      v-if="resolvedIconClass"
      class="cover-icon-wrap pointer-events-none absolute inset-0 flex items-center justify-center text-white"
      :style="iconWrapStyle"
      aria-hidden="true"
    >
      <i :class="resolvedIconClass" class="cover-icon leading-none transition-transform duration-500 ease-out group-hover:scale-[1.03]"></i>
    </div>
    <button
      v-if="shouldRenderVideo"
      type="button"
      class="cover-play-btn absolute inline-flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus:opacity-100"
      :aria-label="isVideoPaused ? '播放封面视频' : '暂停封面视频'"
      @click.stop.prevent="toggleManualPlayback"
    >
      <i :class="isVideoPaused ? 'ri-play-fill' : 'ri-pause-fill'" class="leading-none"></i>
    </button>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const AVAILABLE_COVER_ICONS = new Set([
  "ri-android-fill",
  "ri-arrow-down-s-line",
  "ri-arrow-left-line",
  "ri-arrow-left-s-line",
  "ri-arrow-right-line",
  "ri-arrow-right-s-fill",
  "ri-arrow-right-s-line",
  "ri-arrow-right-up-line",
  "ri-arrow-up-line",
  "ri-arrow-up-s-line",
  "ri-check-line",
  "ri-close-line",
  "ri-download-2-line",
  "ri-equalizer-2-line",
  "ri-fullscreen-exit-line",
  "ri-fullscreen-line",
  "ri-grid-fill",
  "ri-layout-left-2-line",
  "ri-list-check-2",
  "ri-map-pin-fill",
  "ri-markdown-fill",
  "ri-moon-clear-line",
  "ri-more-2-fill",
  "ri-notification-2-line",
  "ri-pause-fill",
  "ri-play-fill",
  "ri-share-box-line",
  "ri-share-line",
  "ri-shield-check-fill",
  "ri-shining-line",
  "ri-star-line",
  "ri-sun-line",
  "ri-time-line",
  "ri-truck-fill",
  "ri-volume-mute-fill",
  "ri-volume-up-fill",
]);

const props = defineProps({
  src: {
    type: String,
    default: "",
  },
  srcSet: {
    type: String,
    default: "",
  },
  sizes: {
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
  videoSrc: {
    type: String,
    default: "",
  },
  iconClass: {
    type: String,
    default: "",
  },
  iconScale: {
    type: Number,
    default: 1,
  },
  enableVideoCover: {
    type: Boolean,
    default: false,
  },
});

const rootRef = ref(null);
const videoRef = ref(null);
const imageLoaded = ref(false);
const imageError = ref(false);
const isInView = ref(false);
const isVideoPaused = ref(true);
const isManuallyPaused = ref(false);
const videoFailed = ref(false);
let visibilityObserver = null;

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
const imageSrcSet = computed(() => String(props.srcSet || "").trim());
const imageSizes = computed(() => String(props.sizes || "").trim());

const showImage = computed(
  () => Boolean(imageSrc.value) && imageLoaded.value && !imageError.value
);
const showSkeleton = computed(() => !showImage.value);

const normalizedVideoSrc = computed(() => String(props.videoSrc || "").trim());
const shouldRenderVideo = computed(
  () => props.enableVideoCover && Boolean(normalizedVideoSrc.value) && !videoFailed.value
);

const sanitizeIconClass = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (!/^ri-[a-z0-9-]+$/.test(raw)) return "ri-play-fill";
  if (!AVAILABLE_COVER_ICONS.has(raw)) return "ri-play-fill";
  return raw;
};
const resolvedIconClass = computed(() => sanitizeIconClass(props.iconClass));
const iconWrapStyle = computed(() => {
  const scale = Number.isFinite(props.iconScale) ? Math.max(0.25, props.iconScale) : 1;
  return { "--cover-icon-scale": scale };
});

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

const pauseVideo = () => {
  const video = videoRef.value;
  if (!video) return;
  video.pause();
  isVideoPaused.value = true;
};

const playVideo = async () => {
  const video = videoRef.value;
  if (!video) return;
  try {
    await video.play();
    isVideoPaused.value = false;
  } catch {
    isVideoPaused.value = true;
  }
};

const syncPlaybackState = async () => {
  if (!shouldRenderVideo.value) return;
  if (isInView.value && !isManuallyPaused.value) {
    await playVideo();
    return;
  }
  pauseVideo();
};

const toggleManualPlayback = async () => {
  isManuallyPaused.value = !isManuallyPaused.value;
  await syncPlaybackState();
};

const handleVideoError = () => {
  videoFailed.value = true;
  pauseVideo();
};

const handleSurfaceContextMenu = (event) => {
  if (!shouldRenderVideo.value) return;
  event.preventDefault();
};

const connectVisibilityObserver = async () => {
  if (typeof window === "undefined") return;
  await nextTick();
  if (!rootRef.value || !("IntersectionObserver" in window)) {
    isInView.value = true;
    await syncPlaybackState();
    return;
  }
  visibilityObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      isInView.value = entry.isIntersecting && entry.intersectionRatio >= 0.35;
      void syncPlaybackState();
    },
    {
      threshold: [0, 0.35, 0.6, 1],
    }
  );
  visibilityObserver.observe(rootRef.value);
};

onMounted(async () => {
  await connectVisibilityObserver();
});

onBeforeUnmount(() => {
  if (visibilityObserver) {
    visibilityObserver.disconnect();
    visibilityObserver = null;
  }
  pauseVideo();
});

watch(
  () => [props.src, props.srcSet],
  () => {
    resetState();
  },
  { immediate: true }
);

watch(
  () => props.videoSrc,
  async () => {
    videoFailed.value = false;
    isManuallyPaused.value = false;
    await syncPlaybackState();
  }
);

watch(shouldRenderVideo, async () => {
  await syncPlaybackState();
});
</script>

<style scoped>
/* 图标大小为封面宽度的 22%，任意尺寸封面观感一致 */
.cover-media {
  container-type: inline-size;
}
.cover-icon {
  font-size: calc(clamp(1.25rem, 50cqw, 10rem) * var(--cover-icon-scale, 1));
}
/* 暂停/播放按钮按封面尺寸比例缩放，以新闻页三列布局下的封面为基准（约 7.5cqw ≈ 32px） */
.cover-play-btn {
  right: clamp(0.5rem, 2cqw, 1rem);
  top: clamp(0.5rem, 2cqw, 1rem);
  width: clamp(1.5rem, 7.5cqw, 2.5rem);
  height: clamp(1.5rem, 7.5cqw, 2.5rem);
  font-size: clamp(0.75rem, 3.75cqw, 1.25rem);
}
</style>
