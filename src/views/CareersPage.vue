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
          工作机会
        </h1>
        <p class="text-primary mt-6 text-center text-base leading-[1.8]">
          我们在寻找对产品体验与工程质量有要求的伙伴，一起构建可持续演进的软件产品
        </p>
      </div>

      <article class="mx-auto mt-10 w-full max-w-[50%] overflow-x-clip font-sans text-base leading-relaxed text-primary max-lg:max-w-full">
        <div class="markdown-body detail-markdown-body">
          <p>
            在企丰科技，我们的工作并不是短期拼接功能，而是为客户建设真正可维护、可演进、可持续运转的系统。我们相信，好的数字化项目不只是上线那一刻的完成，而是在多年之后依然稳定运行，能够随着业务发展不断扩展与优化。系统的价值来自长期可用性，而不是短期速度。
          </p>
          <p>
            每一个项目开始之前，我们都会花时间理解问题本身。需求阶段并不是简单的功能罗列，而是由产品、设计、研发、测试与项目管理共同参与，对齐目标、边界与优先级。我们强调结构清晰、逻辑明确，而不是带着模糊理解进入开发。进入迭代阶段后，我们关注的不只是功能完成，而是可验证的结果。每一轮交付都强调质量标准与责任边界，避免“上线即返工”。工程质量与交付节奏同样重要。
          </p>
          <p>
            我们期待的伙伴，能够独立拆解问题并推动落地，而不是等待指令。我们重视代码质量与产品体验，也重视跨角色协作中的沟通与复盘。在这里，你可能会参与复杂系统的结构设计，面对真实业务场景与多角色协同的挑战。我们不追求功能堆叠，而是追求系统长期稳定运行的能力建设。优秀的成员不仅完成自己的模块，也会对整体结果负责。
          </p>
          <p>
            我们采用线下协作的工作方式。面对面的讨论让问题更快被拆解，方案更快形成共识，也更容易在关键节点形成高质量决策。项目推进过程中，产品、设计与研发保持高频沟通，问题在日常交流中被及时暴露与解决，而不是在上线后集中返工。稳定的线下协作环境，使团队节奏更加清晰，也让复杂系统的建设更加扎实。团队内部定期进行技术分享与项目复盘，讨论真实问题与改进方案。我们鼓励导师反馈与跨角色学习，也支持成员持续提升专业能力。成长不是职位变化，而是在真实项目中不断提升判断力与解决复杂问题的能力。
          </p>
          <h3>重点开放岗位</h3>
          <p>
            具体岗位职责与要求已在BOSS直聘发布，点击下方按钮，即可查看最新岗位信息并进行投递。欢迎按你的能力方向和项目经验投递。若岗位匹配，我们会尽快安排沟通
          </p>
          <p class="mt-[clamp(18px,2vw,22px)] text-center">
            <a
              href="https://www.zhipin.com/gongsi/job/50c5ce276b775c5a1XR-2dy0GFI~.html?ka=company-jobs"
              target="_blank"
              rel="noreferrer"
              class="btn-neutral"
            >
              前往 BOSS 直聘查看岗位
            </a>
          </p>

          <h3>招聘流程</h3>
          <p>
            招聘流程通常包括简历投递、初步沟通、专业评估与结果反馈。我们会尽量在每个阶段给出清晰说明，帮助你了解进度与岗位匹配情况。双向选择同样重要，我们尊重每一次认真准备的申请。如果你希望参与长期系统建设，而不仅是短期功能实现；如果你愿意在真实业务中打磨判断力与工程能力；如果你对质量与协作有清晰标准，欢迎通过上方按钮查看最新岗位并投递。
          </p>
        </div>
      </article>
    </section>
  </AppLayout>
</template>

<script setup>
import AppLayout from "../layouts/AppLayout.vue";
import "../styles/markdown-media.css";
</script>
