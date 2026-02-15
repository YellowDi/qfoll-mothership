<template>
  <AppLayout>
    <section class="mx-auto w-full max-w-360 px-14 pt-24 pb-20 max-lg:px-6">
      <div class="mx-auto w-full max-w-208">
        <div class="mb-8 flex items-center justify-center text-[13px]">
          <span class="text-muted">公司</span>
        </div>
        <h1
          class="text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),4rem)] leading-[clamp(2.28rem,calc(2.28rem+1.72*((100vw-23.4375rem)/66.5625)),4rem)] tracking-[-0.03em] font-medium text-center"
        >
          联系我们
        </h1>
        <p class="mt-6 text-center text-base leading-[1.8] text-muted">
          欢迎通过以下方式与我们取得联系，我们会尽快回复您。
        </p>
      </div>

      <article class="mx-auto mt-10 w-full max-w-[50%] overflow-x-clip font-sans text-base leading-relaxed text-ink max-lg:max-w-full">
        <div class="markdown-body">
          <p>
            感谢你关注企丰科技。无论你是希望咨询项目合作、了解产品方案，还是希望讨论长期技术支持，我们都欢迎你随时联系我们。我们重视每一次沟通，会尽快响应并给出明确反馈。
          </p>
          <p>
            扫码添加企业微信，可快速发起项目咨询并获取合作支持。若你已有明确需求，也可以直接留言项目背景、目标与时间计划，便于我们更高效地对接。
          </p>

          <img
            :src="wecomQrCode"
            alt="企业微信二维码"
            class="mx-auto block h-auto w-full max-w-72 rounded-xl border border-line/15 bg-white p-3"
          />
        </div>
      </article>
    </section>
  </AppLayout>
</template>

<script setup>
import AppLayout from "../layouts/AppLayout.vue";
import wecomQrCode from "../assets/wecom-qrcode.webp";
</script>
