import { onMounted, onUnmounted, ref } from "vue";

const RATE_OPTIONS = [0.5, 1, 1.5, 2];
const RATE_STORAGE_KEY = "qfoll.article.speech.rate";
const PARAGRAPH_GAP_MS = 520;

const normalizeText = (text) => String(text || "").replace(/\s+/g, " ").trim();

const pickPreferredVoice = (voiceList) => {
  if (!voiceList.length) return null;
  const matchBy = (pattern) => voiceList.find((voice) => pattern.test(String(voice.lang || "")));
  return (
    matchBy(/^zh-CN$/i) ||
    matchBy(/^zh-CN-/i) ||
    matchBy(/^zh-(TW|HK)$/i) ||
    matchBy(/^zh-(TW|HK)-/i) ||
    matchBy(/^zh/i) ||
    voiceList.find((voice) => voice.default) ||
    voiceList[0]
  );
};

export const useSpeechSynthesis = ({ containerRef } = {}) => {
  const isSupported = ref(
    typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window
  );
  const isPlaying = ref(false);
  const isPaused = ref(false);
  const currentParagraphIndex = ref(-1);
  const rate = ref(1);
  const pitch = ref(1);
  const volume = ref(1);
  const voices = ref([]);
  const currentVoice = ref(null);
  const isVoicesReady = ref(false);

  let queue = [];
  let cachedParagraphs = [];
  let cachedContainer = null;
  let voiceListener = null;
  let voiceReadyTimer = null;
  let idleInitTimer = null;
  let isVoiceInitBound = false;
  let nextParagraphTimer = null;
  let pendingNextIndex = null;
  let sessionToken = 0;

  const resolveContainer = () => {
    const root = containerRef?.value;
    if (!(root instanceof HTMLElement)) {
      return document.querySelector("article") || document.querySelector(".prose");
    }
    if (root.matches("article") || root.matches(".prose")) {
      return root;
    }
    return root.querySelector("article") || root.querySelector(".prose") || root;
  };

  const extractParagraphQueue = ({ force = false } = {}) => {
    const container = resolveContainer();
    if (!container) return [];
    if (!force && cachedContainer === container && cachedParagraphs.length) {
      return cachedParagraphs;
    }

    const candidateNodes = Array.from(
      container.querySelectorAll("p, li, blockquote, h2, h3, h4, h5, h6")
    ).filter(
      (node) =>
        !node.closest(
          "nav,aside,footer,header,button,[role='button'],pre,code,.md-media,.md-carousel-controls"
        )
    );

    const mapped = candidateNodes
      .map((node) => ({ text: normalizeText(node.innerText), node }))
      .filter((item) => item.text);
    if (mapped.length) {
      cachedContainer = container;
      cachedParagraphs = mapped;
      return mapped;
    }

    // Fallback for non-p content: keep only readable text blocks and skip code/navigation nodes.
    const clone = container.cloneNode(true);
    clone
      .querySelectorAll(
        "nav,aside,footer,header,button,[role='button'],pre,code,.md-media,.md-carousel-controls"
      )
      .forEach((node) => node.remove());
    const fallback = String(clone.innerText || "")
      .split(/\n{2,}/)
      .map(normalizeText)
      .filter(Boolean)
      .map((text) => ({ text, node: null }));
    cachedContainer = container;
    cachedParagraphs = fallback;
    return fallback;
  };

  const loadVoices = () => {
    if (!isSupported.value) return;
    const list = window.speechSynthesis.getVoices() || [];
    voices.value = list;
    if (!list.length) return;

    isVoicesReady.value = true;
    if (!currentVoice.value) {
      currentVoice.value = pickPreferredVoice(list);
      return;
    }

    const matched = list.find(
      (voice) =>
        voice.name === currentVoice.value?.name &&
        String(voice.lang || "") === String(currentVoice.value?.lang || "")
    );
    currentVoice.value = matched || pickPreferredVoice(list);
  };

  const estimateDurationSeconds = () => {
    const paragraphs = extractParagraphQueue();
    if (!paragraphs.length) return 0;
    const totalChars = paragraphs.reduce((sum, item) => sum + item.text.length, 0);
    const baseCharsPerSecond = 4.5;
    const speed = Number(rate.value) > 0 ? Number(rate.value) : 1;
    return Math.max(1, Math.ceil(totalChars / (baseCharsPerSecond * speed)));
  };

  const invalidateContentCache = () => {
    cachedParagraphs = [];
    cachedContainer = null;
    queue = [];
  };

  const finishPlayback = () => {
    if (nextParagraphTimer) {
      window.clearTimeout(nextParagraphTimer);
      nextParagraphTimer = null;
    }
    pendingNextIndex = null;
    isPlaying.value = false;
    isPaused.value = false;
    currentParagraphIndex.value = -1;
    queue = [];
  };

  const stop = ({ keepQueue = false, keepIndex = false } = {}) => {
    sessionToken += 1;
    if (nextParagraphTimer) {
      window.clearTimeout(nextParagraphTimer);
      nextParagraphTimer = null;
    }
    pendingNextIndex = null;
    if (isSupported.value) {
      window.speechSynthesis.cancel();
    }
    isPlaying.value = false;
    isPaused.value = false;
    if (!keepQueue) queue = [];
    if (!keepIndex) currentParagraphIndex.value = -1;
  };

  const speakFrom = (index, token) => {
    if (!isSupported.value || token !== sessionToken) return;
    if (index >= queue.length) {
      finishPlayback();
      return;
    }

    const next = queue[index];
    if (!next?.text) {
      speakFrom(index + 1, token);
      return;
    }

    currentParagraphIndex.value = index;
    const utterance = new SpeechSynthesisUtterance(next.text);
    utterance.lang = currentVoice.value?.lang || "zh-CN";
    if (currentVoice.value) {
      utterance.voice = currentVoice.value;
    }
    utterance.rate = rate.value;
    utterance.pitch = pitch.value;
    utterance.volume = volume.value;
    const queueNextParagraph = () => {
      pendingNextIndex = index + 1;
      if (nextParagraphTimer) {
        window.clearTimeout(nextParagraphTimer);
      }
      nextParagraphTimer = window.setTimeout(() => {
        if (token !== sessionToken || isPaused.value) return;
        const nextIndex = pendingNextIndex;
        pendingNextIndex = null;
        nextParagraphTimer = null;
        speakFrom(nextIndex, token);
      }, PARAGRAPH_GAP_MS);
    };
    utterance.onend = () => {
      if (token !== sessionToken) return;
      queueNextParagraph();
    };
    utterance.onerror = () => {
      if (token !== sessionToken) return;
      queueNextParagraph();
    };
    window.speechSynthesis.speak(utterance);
  };

  const restartFromCurrent = () => {
    if (!queue.length) return;
    const nextIndex = Math.max(0, currentParagraphIndex.value);
    stop({ keepQueue: true, keepIndex: true });
    isPlaying.value = true;
    isPaused.value = false;
    sessionToken += 1;
    speakFrom(nextIndex, sessionToken);
  };

  const play = () => {
    if (!isSupported.value) return;
    // Safari 长文本一次性 speak 容易不稳定，这里固定按段落队列朗读。
    queue = extractParagraphQueue();
    if (!queue.length) {
      stop();
      return;
    }
    stop({ keepQueue: true, keepIndex: true });
    isPlaying.value = true;
    isPaused.value = false;
    currentParagraphIndex.value = 0;
    sessionToken += 1;
    speakFrom(0, sessionToken);
  };

  const pause = () => {
    if (!isSupported.value || !isPlaying.value || isPaused.value) return;
    if (nextParagraphTimer) {
      window.clearTimeout(nextParagraphTimer);
      nextParagraphTimer = null;
    }
    window.speechSynthesis.pause();
    isPaused.value = true;
  };

  const resume = () => {
    if (!isSupported.value || !isPlaying.value || !isPaused.value) return;
    window.speechSynthesis.resume();
    isPaused.value = false;
    if (pendingNextIndex !== null && !window.speechSynthesis.speaking) {
      const token = sessionToken;
      const nextIndex = pendingNextIndex;
      pendingNextIndex = null;
      speakFrom(nextIndex, token);
    }
  };

  const setRate = (nextRate) => {
    if (!RATE_OPTIONS.includes(nextRate)) return;
    rate.value = nextRate;
    try {
      localStorage.setItem(RATE_STORAGE_KEY, String(nextRate));
    } catch {}
    if (isPlaying.value || isPaused.value) {
      // Chromium/Safari: restart current paragraph to apply rate immediately.
      restartFromCurrent();
    }
  };

  const setVoice = (voiceName) => {
    const selected = voices.value.find((voice) => voice.name === voiceName);
    if (!selected) return;
    currentVoice.value = selected;
    if (isPlaying.value || isPaused.value) {
      restartFromCurrent();
    }
  };

  onMounted(() => {
    try {
      const savedRate = Number(localStorage.getItem(RATE_STORAGE_KEY));
      if (RATE_OPTIONS.includes(savedRate)) {
        rate.value = savedRate;
      }
    } catch {}

    if (!isSupported.value) return;
    const initVoicesAsync = () => {
      if (isVoiceInitBound) return;
      isVoiceInitBound = true;
      loadVoices();
      voiceReadyTimer = window.setTimeout(() => {
        if (!isVoicesReady.value) {
          isVoicesReady.value = true;
        }
      }, 1200);
      voiceListener = () => loadVoices();
      if (typeof window.speechSynthesis.addEventListener === "function") {
        window.speechSynthesis.addEventListener("voiceschanged", voiceListener);
      } else {
        window.speechSynthesis.onvoiceschanged = voiceListener;
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => initVoicesAsync(), { timeout: 1200 });
    } else {
      idleInitTimer = window.setTimeout(() => initVoicesAsync(), 180);
    }
  });

  onUnmounted(() => {
    stop();
    if (idleInitTimer) {
      window.clearTimeout(idleInitTimer);
      idleInitTimer = null;
    }
    if (voiceReadyTimer) {
      window.clearTimeout(voiceReadyTimer);
      voiceReadyTimer = null;
    }
    if (isSupported.value && voiceListener) {
      if (typeof window.speechSynthesis.removeEventListener === "function") {
        window.speechSynthesis.removeEventListener("voiceschanged", voiceListener);
      } else if (window.speechSynthesis.onvoiceschanged === voiceListener) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    }
  });

  return {
    play,
    pause,
    resume,
    stop,
    isSupported,
    isPlaying,
    isPaused,
    currentParagraphIndex,
    rate,
    setRate,
    pitch,
    volume,
    voices,
    currentVoice,
    setVoice,
    isVoicesReady,
    estimateDurationSeconds,
    invalidateContentCache,
  };
};
