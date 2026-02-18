<template>
  <div class="article-speech-panel">
    <button
      class="article-speech-play-btn"
      type="button"
      :disabled="speechPrimaryDisabled"
      @click="handlePrimarySpeechAction"
      :aria-label="speechPrimaryLabel"
    >
      <i :class="speechPrimaryIcon" aria-hidden="true"></i>
    </button>
    <div class="article-speech-status">
      <div v-if="!isPlaying && !isPaused" class="article-speech-text article-speech-text--idle">
        <span class="article-speech-label">朗读本文</span>
        <span class="article-speech-separator">｜</span>
        <span class="article-speech-meta">{{ formatClock(estimatedSeconds) }}</span>
      </div>
      <div v-else class="article-speech-text article-speech-text--active">
        {{ formatClock(elapsedSeconds) }}
      </div>
    </div>
    <div
      v-if="isPlaying || isPaused"
      class="article-speech-rate"
      role="group"
      aria-label="朗读倍速"
    >
      <button
        v-for="option in rateOptions"
        :key="option"
        class="article-speech-rate-btn"
        type="button"
        :class="{ 'is-active': option === rate }"
        :disabled="speechRateDisabled"
        @click="setRate(option)"
      >
        {{ option }}x
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useSpeechSynthesis } from "../composables/useSpeechSynthesis";

const props = defineProps({
  containerRef: {
    type: Object,
    default: null,
  },
  contentKey: {
    type: [String, Number],
    default: "",
  },
});

const rateOptions = [0.5, 1, 1.5, 2];
const {
  play,
  pause,
  resume,
  stop,
  isSupported,
  isPlaying,
  isPaused,
  rate,
  setRate,
  isVoicesReady,
  estimateDurationSeconds,
  invalidateContentCache,
} = useSpeechSynthesis({
  containerRef: props.containerRef,
});
const elapsedSeconds = ref(0);
const estimatedSeconds = ref(0);
let elapsedTimer = null;
let elapsedStartAt = 0;
let elapsedBase = 0;
let estimateIdleTimer = null;

const speechPrimaryDisabled = computed(
  () => !isSupported.value || !isVoicesReady.value
);
const speechRateDisabled = computed(
  () => !isSupported.value || !isVoicesReady.value
);
const speechPrimaryLabel = computed(() => {
  if (!isSupported.value) return "当前浏览器不支持朗读";
  if (!isVoicesReady.value) return "正在加载语音";
  if (!isPlaying.value) return "开始朗读";
  return isPaused.value ? "继续朗读" : "暂停朗读";
});
const speechPrimaryIcon = computed(() => {
  if (!isPlaying.value) return "ri-play-fill";
  return isPaused.value ? "ri-play-fill" : "ri-pause-fill";
});

const handlePrimarySpeechAction = () => {
  if (!isSupported.value || !isVoicesReady.value) return;
  if (!isPlaying.value) {
    play();
    return;
  }
  if (isPaused.value) {
    resume();
    return;
  }
  pause();
};

const formatClock = (seconds) => {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const refreshEstimatedDuration = () => {
  estimatedSeconds.value = estimateDurationSeconds();
};

const scheduleEstimateRefresh = () => {
  if (estimateIdleTimer) {
    window.clearTimeout(estimateIdleTimer);
    estimateIdleTimer = null;
  }
  const run = () => refreshEstimatedDuration();
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 1200 });
  } else {
    estimateIdleTimer = window.setTimeout(run, 180);
  }
};

const stopElapsedTimer = () => {
  if (!elapsedTimer) return;
  window.clearInterval(elapsedTimer);
  elapsedTimer = null;
};

const startElapsedTimer = () => {
  stopElapsedTimer();
  elapsedStartAt = Date.now();
  elapsedTimer = window.setInterval(() => {
    elapsedSeconds.value = elapsedBase + Math.floor((Date.now() - elapsedStartAt) / 1000);
  }, 250);
};

watch(
  [isPlaying, isPaused],
  ([playing, paused]) => {
    if (playing && !paused) {
      startElapsedTimer();
      return;
    }
    if (playing && paused) {
      elapsedBase = elapsedSeconds.value;
      stopElapsedTimer();
      return;
    }
    stopElapsedTimer();
    elapsedSeconds.value = 0;
    elapsedBase = 0;
  },
  { immediate: true }
);

watch(rate, () => {
  scheduleEstimateRefresh();
});

watch(
  () => props.contentKey,
  async () => {
    stop();
    invalidateContentCache();
    elapsedSeconds.value = 0;
    elapsedBase = 0;
    stopElapsedTimer();
    await nextTick();
    scheduleEstimateRefresh();
  }
);

onMounted(() => {
  scheduleEstimateRefresh();
});

onUnmounted(() => {
  stopElapsedTimer();
  if (estimateIdleTimer) {
    window.clearTimeout(estimateIdleTimer);
    estimateIdleTimer = null;
  }
});
</script>

<style scoped>
.article-speech-panel {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  min-height: 34px;
}

.article-speech-play-btn {
  width: 34px;
  height: 34px;
  border-radius: 9999px;
  border: 0;
  background: rgb(var(--color-ink) / 0.08);
  color: rgb(var(--color-ink) / 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  position: relative;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.article-speech-play-btn > i {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  line-height: 1;
}

.article-speech-play-btn > i.ri-play-fill {
  transform: translate(-42%, -50%);
}

.article-speech-play-btn:hover:not(:disabled) {
  background: rgb(var(--color-ink) / 0.14);
}

.article-speech-play-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.article-speech-status {
  display: inline-flex;
  align-items: center;
  gap: 0;
}

.article-speech-text {
  font-size: 16px;
  color: rgb(var(--color-ink) / 1);
  letter-spacing: -0.01em;
}

.article-speech-label {
  color: rgb(var(--color-ink) / 1);
}

.article-speech-separator,
.article-speech-meta {
  color: rgb(var(--color-ink) / 0.56);
}

.article-speech-rate {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-left: 1px solid rgb(var(--color-line) / 0.12);
  padding-left: 14px;
}

.article-speech-rate-btn {
  border: 0;
  background: transparent;
  color: rgb(var(--color-ink) / 0.4);
  padding: 0 4px;
  font-size: 14px;
  line-height: 1;
  transition: color 0.2s ease;
}

.article-speech-rate-btn.is-active {
  color: rgb(var(--color-ink) / 1);
  font-weight: 600;
}

.article-speech-rate-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .article-speech-panel {
    gap: 10px;
    flex-wrap: wrap;
  }

  .article-speech-rate {
    border-left: 0;
    padding-left: 0;
  }
}
</style>
