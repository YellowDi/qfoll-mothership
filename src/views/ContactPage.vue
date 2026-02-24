<template>
  <AppLayout>
    <section class="mx-auto w-full max-w-360 px-14 pt-24 pb-20 max-lg:px-6">
      <div class="mx-auto w-full max-w-208">
        <div class="mb-8 flex items-center justify-center text-sm">
          <span class="text-secondary">公司</span>
        </div>
        <h1
          class="text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),4rem)] leading-[clamp(2.28rem,calc(2.28rem+1.72*((100vw-23.4375rem)/66.5625)),4rem)] tracking-[-0.03em] font-medium text-center"
        >
          联系我们
        </h1>
        <p class="text-primary mt-6 text-center text-base leading-[1.8]">
          欢迎通过以下方式与我们取得联系，我们会尽快回复您。
        </p>
      </div>

      <article class="mx-auto mt-10 w-full max-w-[40rem] overflow-x-clip font-sans text-base leading-relaxed text-primary">
        <div class="markdown-body detail-markdown-body contact-markdown">
          <p>
            感谢你关注企丰科技。无论你是希望咨询项目合作、了解产品方案，还是希望讨论长期技术支持，我们都欢迎你随时联系我们。我们重视每一次沟通，会尽快响应并给出明确反馈。
          </p>
          <p>
            扫码添加企业微信，可快速发起项目咨询并获取合作支持。若你已有明确需求，也可以直接留言项目背景、目标与时间计划，便于我们更高效地对接。
          </p>

          <div
            ref="qrCardRef"
            class="qr-tilt-card mx-auto w-full max-w-72"
            :style="qrCardStyle"
            @pointermove="handleQrPointerMove"
            @pointerleave="resetQrTilt"
          >
            <img
              :src="wecomQrCode"
              alt="企业微信二维码"
              class="block h-auto w-full rounded-xl border border-edge bg-white p-3"
            />
            <span class="qr-tilt-glare" aria-hidden="true"></span>
          </div>
        </div>
      </article>
    </section>
  </AppLayout>
</template>

<script setup>
import { ref } from "vue";
import AppLayout from "../layouts/AppLayout.vue";
import "../styles/markdown-media.css";
import wecomQrCode from "../assets/wecom-qrcode.webp";

const qrCardRef = ref(null);
const qrCardStyle = ref({
  transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)",
  "--glare-x": "50%",
  "--glare-y": "50%",
  "--glare-opacity": "0",
});

const canAnimateQr = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const handleQrPointerMove = (event) => {
  if (!canAnimateQr() || !qrCardRef.value) return;
  const rect = qrCardRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const px = x / rect.width;
  const py = y / rect.height;
  const rotateX = (0.5 - py) * 16;
  const rotateY = (px - 0.5) * 18;
  qrCardStyle.value = {
    transform: `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.045)`,
    "--glare-x": `${(px * 100).toFixed(2)}%`,
    "--glare-y": `${(py * 100).toFixed(2)}%`,
    "--glare-opacity": "0.95",
  };
};

const resetQrTilt = () => {
  qrCardStyle.value = {
    transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)",
    "--glare-x": "50%",
    "--glare-y": "50%",
    "--glare-opacity": "0",
  };
};

</script>

<style scoped>
.qr-tilt-card {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 180ms ease, filter 220ms ease;
  will-change: transform;
  filter: drop-shadow(0 10px 24px rgb(17 17 17 / 0.2));
}

.qr-tilt-glare {
  pointer-events: none;
  position: absolute;
  inset: 0;
  border-radius: 0.8rem;
  background: radial-gradient(
    170px circle at var(--glare-x) var(--glare-y),
    rgb(255 255 255 / calc(0.45 * var(--glare-opacity))),
    rgb(255 255 255 / calc(0.12 * var(--glare-opacity))) 38%,
    transparent 72%
  );
  transition: opacity 180ms ease;
}

.contact-markdown {
  overflow: visible;
}

@media (prefers-reduced-motion: reduce), (hover: none), (pointer: coarse) {
  .qr-tilt-card {
    transform: none !important;
    transition: none;
    filter: none;
  }

  .qr-tilt-glare {
    display: none;
  }
}
</style>
