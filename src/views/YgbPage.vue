<template>
  <AppLayout>
    <div class="w-full bg-bg pt-18 pb-16">
      <YgbHeroSection />

      <section class="mx-auto mt-6 w-full max-w-360 px-14 max-lg:px-6 max-md:px-5">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article
            v-for="card in summaryCards"
            :key="card.title"
            class="group relative overflow-hidden rounded-2xl border border-line/10 bg-surface p-4 shadow-[0_1px_0_rgba(17,17,17,0.02)] transition-[background-color,border-color] duration-300 ease-out hover:border-orange-400 hover:bg-orange-400 dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)]"
          >
            <div class="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-[radial-gradient(115%_105%_at_0%_0%,rgba(254,131,72,0.26)_0%,rgba(254,131,72,0.14)_34%,rgba(254,131,72,0.05)_64%,rgba(255,255,255,0)_100%)] transition-opacity duration-300 ease-out group-hover:opacity-0"></div>
            <div class="pointer-events-none absolute inset-y-0 left-0 w-[52%] bg-[linear-gradient(90deg,rgba(254,131,72,0.16)_1px,transparent_1px),linear-gradient(0deg,rgba(254,131,72,0.12)_1px,transparent_1px)] bg-[size:18px_18px] opacity-35 transition-opacity duration-300 ease-out group-hover:opacity-0"></div>

            <div class="relative flex items-center gap-3">
              <span class="relative inline-flex h-13 w-13 shrink-0 items-center justify-center">
                <span class="absolute inset-0 rounded-full bg-orange-400/30 blur-[9px] transition-opacity duration-300 ease-out group-hover:opacity-0"></span>
                <span class="relative inline-flex h-13 w-13 items-center justify-center rounded-full border border-white/88 bg-white/96 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.88),inset_0_-10px_18px_rgba(254,131,72,0.16),0_4px_12px_rgba(17,17,17,0.12)] transition-[background-color,border-color,box-shadow] duration-300 ease-out group-hover:border-white/68 group-hover:bg-white/12 group-hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3),inset_0_-8px_14px_rgba(255,255,255,0.12),0_2px_8px_rgba(17,17,17,0.08)] dark:border-white/78 dark:bg-white/90">
                  <i :class="[card.icon, 'text-3xl text-orange-400 transition-colors duration-300 ease-out group-hover:text-on-dark dark:group-hover:text-orange-400']"></i>
                </span>
              </span>
              <div class="min-w-0">
                <h3 class="text-lg leading-[1.2] font-medium tracking-[-0.015em] text-primary transition-colors duration-300 ease-out group-hover:text-on-dark">
                  {{ card.title }}
                </h3>
                <div class="mt-1 text-sm font-medium text-secondary transition-colors duration-300 ease-out group-hover:text-on-dark">
                  {{ card.stats }}
                </div>
              </div>
            </div>
            <p class="relative mt-3 text-sm leading-[1.75] text-secondary transition-colors duration-300 ease-out group-hover:text-on-dark">
              {{ card.desc }}
            </p>
          </article>
          </div>
      </section>

      <section id="dashboard" class="mx-auto mt-6 w-full max-w-360 px-14 max-lg:px-6 max-md:px-5">
        <div
          class="overflow-hidden bg-transparent"
        >
          <div class="grid grid-cols-12 gap-10 max-md:gap-6">
            <div class="col-span-12 xl:col-span-5">
              <div
                class="inline-flex items-center gap-2 rounded-full border border-line/10 bg-surface/90 px-3 py-1 text-sm text-secondary"
              >
                <i class="ri-shining-line text-sm"></i>
                运输作业管理
              </div>
              <h2 class="mt-5 text-[clamp(1.65rem,2.7vw,2.9rem)] leading-[1.08] tracking-[-0.03em] font-medium text-primary dark:text-primary">
                订单统一管理
                <br />
                调度井然有序
              </h2>

              <div class="relative mt-7 grid grid-cols-1 sm:grid-cols-2">
                <span class="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-zinc-200/60 sm:block dark:bg-white/8"></span>
                <span class="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 bg-zinc-200/60 sm:block dark:bg-white/8"></span>
                <article
                  v-for="(feature, idx) in opsFeatures"
                  :key="feature.title"
                  class="py-4 pr-3 sm:min-h-[10.8rem]"
                  :class="[
                    idx % 2 === 0 ? 'sm:pr-8' : 'sm:pl-8',
                    idx >= 2 ? 'sm:pt-6' : 'sm:pb-6',
                    idx > 0 ? 'border-t border-zinc-200/60 sm:border-t-0' : '',
                  ]"
                >
                  <i :class="[feature.icon, feature.iconColor, 'text-[1.95rem] leading-none']"></i>
                  <h3 class="mt-3 text-[clamp(1.06rem,1.35vw,1.32rem)] leading-[1.32] font-medium tracking-[-0.01em] text-primary dark:text-primary">
                    {{ feature.title }}
                  </h3>
                  <p class="mt-1.5 text-[15px] leading-[1.72] text-secondary dark:text-secondary">
                    {{ feature.desc }}
                  </p>
                </article>
              </div>
            </div>

            <div class="col-span-12 xl:col-span-7">
              <div class="relative">
                <div class="relative overflow-hidden rounded-lg bg-transparent">
                  <img
                    :src="dashboardImage"
                    alt="云柜宝运输作业管理主界面"
                    class="block h-auto w-full object-contain object-left-top"
                    loading="lazy"
                  />
                  <div
                    class="pointer-events-none absolute inset-0 rounded-lg border border-zinc-300 shadow-[0_10px_22px_rgba(28,38,52,0.14)] [mask-image:linear-gradient(180deg,#000_0%,#000_58%,transparent_100%)] [-webkit-mask-image:linear-gradient(180deg,#000_0%,#000_58%,transparent_100%)] dark:border-white/14 dark:shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
                  ></div>
                  <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-b from-transparent via-bg/60 to-bg"></div>
                  <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[14%] bg-bg/60 blur-[10px]"></div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="governance" class="mx-auto mt-6 w-full max-w-360 px-14 max-lg:px-6 max-md:px-5">
        <div
          class="overflow-hidden bg-transparent"
        >
          <div class="grid grid-cols-12 items-center gap-8 max-md:gap-5">
            <div class="col-span-12 order-2 xl:order-1 xl:col-span-6">
              <div class="relative overflow-hidden rounded-lg bg-transparent">
                <img
                  :src="governanceImage"
                  alt="政府监管平台数据界面"
                  class="block h-auto w-full object-contain object-left-top"
                  loading="lazy"
                />
                <div
                  class="pointer-events-none absolute inset-0 rounded-lg border border-zinc-300 shadow-[0_10px_22px_rgba(28,38,52,0.14)] [mask-image:linear-gradient(180deg,#000_0%,#000_58%,transparent_100%)] [-webkit-mask-image:linear-gradient(180deg,#000_0%,#000_58%,transparent_100%)] dark:border-white/14 dark:shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
                ></div>
                <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-b from-transparent via-bg/60 to-bg"></div>
                <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[14%] bg-bg/60 blur-[10px]"></div>
              </div>
            </div>

            <div class="col-span-12 order-1 xl:order-2 xl:col-span-6">
              <div
                class="inline-flex items-center gap-2 rounded-full border border-line/10 bg-surface/90 px-3 py-1 text-sm text-secondary"
              >
                <i class="ri-shining-line text-sm"></i>
                政府监管
              </div>
              <h2 class="mt-5 text-[clamp(1.65rem,2.95vw,3.35rem)] leading-[1.06] tracking-[-0.03em] font-medium text-primary dark:text-primary">
                平台对接政府系统，
                <br />
                数据共享与监管支持
              </h2>
              <p class="mt-5 text-[clamp(0.94rem,1.04vw,1.1rem)] leading-[1.86] text-secondary dark:text-secondary">
                云柜宝通过对接网络货运接口，实现了与政府部门的数据共享，保证了数据的真实性、准确性、及时性，符合政府监管要求。平台还可以根据政府部门的需求，随时为政府提供数据与业务支持，包括运输信息、运费结算、安全监控等方面，协助政府部门进行有效的监管和管理。
              </p>

              <ul class="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5">
                <li v-for="item in governancePoints" :key="item" class="flex items-center gap-2">
                  <span
                    class="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gray-800 text-on-dark shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_6px_12px_rgba(0,0,0,0.2)]"
                  >
                    <i class="ri-check-line text-sm"></i>
                  </span>
                  <span class="text-[clamp(0.95rem,1.02vw,1.1rem)] leading-[1.34] font-medium text-secondary dark:text-primary">
                    {{ item }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="download" ref="downloadSectionRef" class="mx-auto mt-6 w-full max-w-360 px-14 max-lg:px-6 max-md:px-5">
        <div class="relative overflow-hidden rounded-2xl bg-neutral-900 p-8 text-on-dark dark:bg-zinc-900 max-md:p-5">
          <div class="download-material pointer-events-none absolute inset-0 z-0"></div>
          <div class="relative z-20 max-w-136 lg:max-w-none xl:pr-88">
            <div
              class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-on-dark"
            >
              <i class="ri-shining-line text-sm text-on-dark"></i>
              应用下载
            </div>
            <h2 class="mt-4 text-[clamp(1.7rem,2.4vw,2.6rem)] leading-[1.15] tracking-[-0.02em] font-medium">
              下载云柜宝 App
            </h2>
            <p class="mt-4 max-w-136 text-[15px] leading-[1.9] text-on-dark">
              支持 iOS、Android 与微信小程序。司机端可实时接单、反馈状态，管理端可同步查看车辆轨迹、回执与异常信息。
            </p>
            <div class="relative mt-4 flex items-start justify-between gap-3 lg:pr-88 xl:static xl:pr-0 max-xl:gap-2">
              <div class="min-w-0 flex-1">
                <a
                  href="https://yunguibao-1321524436.cos.ap-shanghai.myqcloud.com/images/45c957800a8760898ce846ba89dc46ef.apk"
                  target="_blank"
                  rel="noreferrer"
                  class="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full bg-white px-5 text-sm font-medium text-primary transition-colors hover:bg-white/85 dark:text-zinc-900 max-md:gap-1.5 max-md:px-3.5 max-md:text-sm"
                >
                  <i class="ri-android-fill text-base"></i>
                  <span class="max-md:hidden">下载云柜宝司机版</span>
                  <span class="hidden max-md:inline">下载司机端</span>
                  <i class="ri-download-2-line text-base"></i>
                </a>
                <div class="mt-2 text-sm text-on-dark">或搜索小程序「云柜宝」</div>
              </div>
              <div class="w-[19.8rem] shrink-0 max-md:w-[13.2rem] lg:absolute lg:right-0 lg:top-0">
                <div class="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    class="inline-flex btn-icon btn-icon-sm border border-white/16 text-on-dark hover:bg-white/14"
                    @click="prevAppShot"
                    aria-label="上一张截图"
                  >
                    <i class="ri-arrow-left-s-line"></i>
                  </button>
                  <button
                    type="button"
                    class="inline-flex btn-icon btn-icon-sm border border-white/16 text-on-dark hover:bg-white/14"
                    @click="nextAppShot"
                    aria-label="下一张截图"
                  >
                    <i class="ri-arrow-right-s-line"></i>
                  </button>
                </div>
                <div class="mt-2 text-center">
                  <div class="text-sm font-medium text-on-dark">{{ appScreenshots[activeAppShot].title }}</div>
                  <div class="mt-0.5 text-sm leading-[1.55] text-on-dark">{{ appScreenshots[activeAppShot].desc }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="relative z-10 -mt-40 -mx-8 -mb-1 max-xl:-mt-8 max-md:-mt-12 max-md:-mx-5 max-md:-mb-1">
            <div class="mt-2 flex h-160 items-end justify-end gap-3 overflow-hidden px-8 pb-0 max-xl:mt-12 max-md:h-120 max-md:gap-2 max-md:px-5">
              <article
                v-for="(shot, idx) in appScreenshots"
                :key="shot.src"
                class="relative flex-none origin-bottom transition-all duration-500 ease-out"
                :style="{ order: appStageSlot(idx) }"
                :class="appStageItemClass(idx)"
              >
                <img
                  :src="shot.src"
                  :srcset="shot.srcSet"
                  :sizes="appShotSizes"
                  :alt="shot.alt"
                  :loading="idx === activeAppShot ? 'eager' : 'lazy'"
                  :fetchpriority="idx === activeAppShot ? 'high' : 'low'"
                  decoding="async"
                  width="450"
                  height="920"
                  class="h-auto w-full object-contain object-bottom"
                />
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import AppLayout from "../layouts/AppLayout.vue";
import YgbHeroSection from "../components/YgbHeroSection.vue";
import dashboardImage from "../assets/ygb-assets/dashboard.webp";
import governanceImage from "../assets/ygb-assets/governance.webp";
import app01DesktopImage from "../assets/ygb-assets/app-01-d.webp";
import app01MobileImage from "../assets/ygb-assets/app-01-m.webp";
import app02DesktopImage from "../assets/ygb-assets/app-02-d.webp";
import app02MobileImage from "../assets/ygb-assets/app-02-m.webp";
import app03DesktopImage from "../assets/ygb-assets/app-03-d.webp";
import app03MobileImage from "../assets/ygb-assets/app-03-m.webp";
import app04DesktopImage from "../assets/ygb-assets/app-04-d.webp";
import app04MobileImage from "../assets/ygb-assets/app-04-m.webp";
import app05DesktopImage from "../assets/ygb-assets/app-05-d.webp";
import app05MobileImage from "../assets/ygb-assets/app-05-m.webp";

const summaryCards = [
  {
    title: "智能运力网络",
    stats: "9,600+ 注册司机 · 1,200+ 优选线路",
    desc: "构建覆盖多区域的运力网络，结合实时、精准的车辆 GPS 定位与轨迹可视化能力，持续追踪运输状态，帮助调度人员快速响应异常，保障运输高效可控。",
    icon: "ri-map-pin-fill",
  },
  {
    title: "智能调度与高效履约",
    stats: "380,000+ 累计订单完成",
    desc: "基于订单特征、司机状态与线路偏好进行智能匹配与动态调度，有效降低空驶率，提升运力利用率与整体运输时效，持续优化平台履约能力。",
    icon: "ri-truck-fill",
  },
  {
    title: "全链路物流保障体系",
    stats: "全流程节点自动记录",
    desc: "从提箱、到场、装货、在途到签收，关键节点自动记录，形成完整运输回溯链路，支撑结算、监管与风控管理，构建可追溯、可监管的物流生态。",
    icon: "ri-shield-check-fill",
  },
];

const opsFeatures = [
  {
    icon: "ri-share-box-line",
    iconColor: "text-red-500",
    title: "业务状态实时更新",
    desc: "货物流转信息等可在线即时查询，确保信息透明可控",
  },
  {
    icon: "ri-star-line",
    iconColor: "text-violet-500",
    title: "专属管家服务",
    desc: "一对一订单管理，提高物流管理效率",
  },
  {
    icon: "ri-time-line",
    iconColor: "text-green-500",
    title: "精确时间管理",
    desc: "自动记录提箱、到场等时间节点，确保货物流转高效可视化",
  },
  {
    icon: "ri-notification-2-line",
    iconColor: "text-orange-500",
    title: "消息及时通知",
    desc: "多种消息推送机制，确保信息及时传达",
  },
];

const governancePoints = ["运输信息", "运费结算", "安全监控", "大数据分析"];

const downloadSectionRef = ref(null);
const isDownloadInView = ref(false);
const isPageVisible = ref(true);
const appScreenshots = [
  {
    src: app01DesktopImage,
    srcSet: `${app01MobileImage} 320w, ${app01DesktopImage} 450w`,
    alt: "云柜宝截图 1",
    title: "司机端首页",
    desc: "接单、进度与消息总览",
  },
  {
    src: app02DesktopImage,
    srcSet: `${app02MobileImage} 320w, ${app02DesktopImage} 450w`,
    alt: "云柜宝截图 2",
    title: "在途任务",
    desc: "关键节点与轨迹可视化",
  },
  {
    src: app03DesktopImage,
    srcSet: `${app03MobileImage} 320w, ${app03DesktopImage} 450w`,
    alt: "云柜宝截图 3",
    title: "异常处理",
    desc: "上报、回传与处理闭环",
  },
  {
    src: app04DesktopImage,
    srcSet: `${app04MobileImage} 320w, ${app04DesktopImage} 450w`,
    alt: "云柜宝截图 4",
    title: "回执签收",
    desc: "电子回单与签收上传",
  },
  {
    src: app05DesktopImage,
    srcSet: `${app05MobileImage} 320w, ${app05DesktopImage} 450w`,
    alt: "云柜宝截图 5",
    title: "运单详情",
    desc: "多维字段与状态同步",
  },
];
const appShotSizes = "(max-width: 768px) 132px, 320px";

const activeAppShot = ref(0);
const AUTO_PLAY_INTERVAL_MS = 3500;
let appShotTimer = null;
let downloadSectionObserver = null;

const shouldRunAppShotTimer = () => isDownloadInView.value && isPageVisible.value;

const stepNextAppShot = () => {
  activeAppShot.value = (activeAppShot.value - 1 + appScreenshots.length) % appScreenshots.length;
};

const stepPrevAppShot = () => {
  activeAppShot.value = (activeAppShot.value + 1) % appScreenshots.length;
};

const clearAppShotTimer = () => {
  if (!appShotTimer) return;
  clearInterval(appShotTimer);
  appShotTimer = null;
};

const startAppShotTimer = () => {
  clearAppShotTimer();
  if (!shouldRunAppShotTimer()) return;
  appShotTimer = setInterval(() => {
    stepNextAppShot();
  }, AUTO_PLAY_INTERVAL_MS);
};

const syncAppShotTimer = () => {
  if (shouldRunAppShotTimer()) {
    startAppShotTimer();
    return;
  }
  clearAppShotTimer();
};

const onDocumentVisibilityChange = () => {
  isPageVisible.value = !document.hidden;
  syncAppShotTimer();
};

const nextAppShot = () => {
  stepNextAppShot();
  startAppShotTimer();
};

const prevAppShot = () => {
  stepPrevAppShot();
  startAppShotTimer();
};

onMounted(() => {
  isPageVisible.value = !document.hidden;

  if (typeof window !== "undefined" && "IntersectionObserver" in window && downloadSectionRef.value) {
    downloadSectionObserver = new IntersectionObserver(
      ([entry]) => {
        isDownloadInView.value = entry.isIntersecting;
        syncAppShotTimer();
      },
      { threshold: 0.15 },
    );
    downloadSectionObserver.observe(downloadSectionRef.value);
  } else {
    isDownloadInView.value = true;
  }

  document.addEventListener("visibilitychange", onDocumentVisibilityChange);
  syncAppShotTimer();
});

onBeforeUnmount(() => {
  if (downloadSectionObserver) {
    downloadSectionObserver.disconnect();
    downloadSectionObserver = null;
  }
  document.removeEventListener("visibilitychange", onDocumentVisibilityChange);
  clearAppShotTimer();
});

const appStageSlot = (index) => {
  const total = appScreenshots.length;
  return (index - activeAppShot.value + total + total - 1) % total;
};

const appStageItemClass = (index) => {
  const slot = appStageSlot(index);

  if (slot === 0) return "w-[11.6rem] opacity-72 max-md:w-[7.8rem]";
  if (slot === 1) return "w-[13.8rem] opacity-80 max-md:w-[9.4rem]";
  if (slot === 2) return "w-[16.2rem] opacity-88 max-md:w-44";
  if (slot === 3) return "w-[18.2rem] opacity-94 max-md:w-[12.2rem]";
  return "w-[19.8rem] opacity-100 max-md:w-[13.2rem]";
};
</script>

<style scoped>
.download-material {
  background:
    radial-gradient(78rem 38rem at -10% -24%, rgb(255 153 74 / 0.34), transparent 56%),
    radial-gradient(66rem 36rem at 114% -14%, rgb(98 156 255 / 0.32), transparent 60%),
    radial-gradient(36rem 22rem at 52% 118%, rgb(255 255 255 / 0.14), transparent 72%),
    linear-gradient(138deg, rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.02));
}

.download-material::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(255 255 255 / 0.075) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.075) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: radial-gradient(74% 56% at 50% 42%, black 52%, transparent 100%);
  opacity: 0.48;
}

.download-material::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(92% 72% at 50% 16%, transparent 32%, rgb(0 0 0 / 0.56) 100%);
}
</style>
