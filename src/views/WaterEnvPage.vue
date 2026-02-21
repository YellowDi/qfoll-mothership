<template>
  <AppLayout>
    <div class="w-full bg-bg pt-14 pb-16">
      <WaterEnvHeroSection />

      <section
        v-for="(item, idx) in featureSections"
        :key="item.id"
        :id="item.id"
        class="water-env-section mx-auto w-full max-w-360 px-14 max-lg:px-6 max-md:px-5"
        :class="idx === 0 ? 'mt-12' : 'mt-20 lg:mt-28'"
      >
        <div
          class="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14"
        >
          <div
            class="order-1 min-w-0"
            :class="[idx % 2 === 1 ? 'lg:order-2' : 'lg:order-1']"
          >
            <div
              class="inline-flex items-center gap-2 rounded-full border border-edge bg-surface/90 px-3 py-1.5 text-sm text-secondary"
            >
              <i :class="[item.icon, 'text-base']"></i>
              {{ item.chip }}
            </div>
            <h2 class="mt-5 text-[clamp(1.5rem,2.5vw,2.25rem)] font-medium leading-[1.15] tracking-[-0.03em] text-primary">
              {{ item.title }}
            </h2>
            <p class="mt-5 text-[clamp(0.9375rem,1.05vw,1.0625rem)] leading-[1.75] text-secondary">
              {{ item.desc }}
            </p>
          </div>
          <div
            class="order-2 min-w-0"
            :class="[idx % 2 === 1 ? 'lg:order-1' : 'lg:order-2']"
          >
            <div class="water-env-section-media overflow-hidden rounded-2xl border border-zinc-200/80 bg-surface shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:border-white/12 dark:shadow-[0_8px_32px_rgba(0,0,0,0.28)]">
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.title"
                class="block h-auto w-full object-cover"
                loading="lazy"
              />
              <div
                v-else
                class="flex aspect-video items-center justify-center bg-linear-to-br from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-800/20"
              >
                <i :class="[item.icon, 'text-6xl text-sky-400/60 dark:text-sky-500/50']"></i>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import AppLayout from "../layouts/AppLayout.vue";
import WaterEnvHeroSection from "../components/WaterEnvHeroSection.vue";

const featureSections = [
  {
    id: "monitoring",
    chip: "实时监测",
    icon: "ri-line-chart-line",
    title: "多维度水质数据采集与实时展示",
    desc: "融合物联网传感器与边缘计算，对 pH、溶解氧、浊度、氨氮等关键指标进行 24 小时连续采集。数据实时上传至云端，支持大屏可视化展示与历史回溯，为环保部门提供可靠的数据支撑。",
    image: null,
  },
  {
    id: "alert",
    chip: "智能预警",
    icon: "ri-alarm-warning-line",
    title: "异常自动告警与处置闭环",
    desc: "基于阈值与算法模型，当水质指标超标或出现异常波动时，系统自动触发多级告警，并通过短信、APP、大屏等渠道通知相关人员。支持告警工单流转与处置记录，形成闭环管理。",
    image: null,
  },
  {
    id: "visualization",
    chip: "数据可视化",
    icon: "ri-dashboard-3-line",
    title: "大屏展示与报表分析",
    desc: "提供 GIS 地图、趋势图、热力图等多种可视化组件，支持按区域、时间、指标灵活筛选与钻取。内置报表模板，可一键导出 PDF、Excel，满足日常巡查与汇报需求。",
    image: null,
  },
  {
    id: "integration",
    chip: "系统对接",
    icon: "ri-link-m",
    title: "与政府平台及第三方系统对接",
    desc: "支持与国家、省、市水质监管平台的数据对接，符合环保部门数据上报规范。可与现有业务系统、GIS 平台等打通，实现数据共享与业务协同。",
    image: null,
  },
];
</script>
