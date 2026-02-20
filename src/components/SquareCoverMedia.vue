<template>
  <div
    ref="rootRef"
    class="group relative h-full w-full overflow-hidden rounded-sm bg-zinc-100 dark:bg-zinc-800/35"
    @contextmenu="handleSurfaceContextMenu"
  >
    <CoverImage
      class="h-full w-full"
      :src="src"
      :src-set="srcSet"
      :sizes="sizes"
      :alt="alt"
      :image-class="imageClass"
    />
    <video
      v-if="shouldRenderVideo"
      ref="videoRef"
      class="absolute inset-0 h-full w-full object-cover"
      :src="normalizedVideoSrc"
      :poster="src || undefined"
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
    ></video>
    <div
      v-if="resolvedIconClass"
      class="pointer-events-none absolute inset-0 flex items-center justify-center text-white [text-shadow:0_10px_30px_rgba(0,0,0,0.35)]"
      :style="iconScaleStyle"
      aria-hidden="true"
    >
      <img
        v-if="isMarkdownIcon"
        :src="markdownIconSrc"
        alt=""
        class="block w-[clamp(3.4rem,11vw,6.8rem)] h-auto aspect-square"
        draggable="false"
      />
      <i v-else :class="resolvedIconClass" class="text-[clamp(3.4rem,11vw,6.8rem)] leading-none"></i>
    </div>
    <button
      v-if="shouldRenderVideo"
      type="button"
      class="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/20 hover:bg-black/40backdrop-blur-sm text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus:opacity-100"
      :aria-label="isVideoPaused ? '播放封面视频' : '暂停封面视频'"
      @click.stop.prevent="toggleManualPlayback"
    >
      <i :class="isVideoPaused ? 'ri-play-fill' : 'ri-pause-fill'" class="text-lg"></i>
    </button>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import CoverImage from "./CoverImage.vue";
import markdownIconSrc from "../assets/icons/ri-markdown-fill.svg";

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
const isInView = ref(false);
const isVideoPaused = ref(true);
const isManuallyPaused = ref(false);
const videoFailed = ref(false);
let visibilityObserver = null;

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
const isMarkdownIcon = computed(() => resolvedIconClass.value === "ri-markdown-fill");
const iconScaleStyle = computed(() => {
  const scale = Number.isFinite(props.iconScale) ? Math.max(0.25, props.iconScale) : 1;
  return {
    transform: `scale(var(--cover-icon-scale, ${scale}))`,
    transformOrigin: "50% 50%",
  };
});

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
