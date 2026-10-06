/**
 * [INPUT]: 依赖设计规范图片、原始文案和共享详情媒体 hook
 * [OUTPUT]: 对外提供 ReactDesignSpecPage，保留图文轮播与内联视频控制
 * [POS]: 公司设计规范路由，沿用原内容结构和宽媒体布局
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useRef } from "react";
import designSpecScreen01 from "../../assets/design-images/screen-01.webp";
import designSpecScreen02 from "../../assets/design-images/test-1.png";
import designSpecScreen03 from "../../assets/design-images/test-2.png";
import { useReactDetailPageInteractions } from "../hooks/useReactDetailPageInteractions";
import "./ReactDesignSpecPage.css";

export function ReactDesignSpecPage() {
  const markdownRef = useRef<HTMLDivElement>(null);
  useReactDetailPageInteractions({ markdownRef, contentKey: "design-spec" });
  return (

  <div className="design-spec-page">
    <section className="mx-auto w-full max-w-360 px-14 pt-10 pb-20 max-lg:px-6">
      <div className="mx-auto w-full max-w-208">
        <div className="mb-8 flex items-center justify-center text-sm">
          <span className="text-secondary">公司</span>
        </div>
        <h1
          className="text-[clamp(2rem,calc(2rem+2*((100vw-23.4375rem)/66.5625)),4rem)] leading-[clamp(2.28rem,calc(2.28rem+1.72*((100vw-23.4375rem)/66.5625)),4rem)] tracking-[-0.03em] font-medium text-center"
        >
          我们如何设计产品 UI
        </h1>
        <p className="text-primary mt-6 text-center text-base leading-[1.8]">
          从人机交互原则出发，构建可长期维护的界面语言
        </p>
      </div>
    </section>

    <article className="mx-auto w-full max-w-full overflow-x-clip px-0 pb-20 pt-10 font-sans text-base leading-relaxed text-primary">
        <div className="markdown-body detail-markdown-body" ref={markdownRef}>
          <p>
            在企丰科技，产品界面从来不是视觉包装的最后一步，而是产品能力本身的外在表达。我们更关心界面是否降低了理解成本，是否让业务流程更顺畅，是否能够在长期迭代中保持一致与可维护。这些判断标准既来自行业成熟的人机交互方法论，也来自我们在企业级项目中的长期实践。苹果在 Human Interface Guidelines 中提出的 Clarity、Deference 与 Depth，让我们意识到界面的首要任务是帮助用户理解内容，而不是制造视觉存在感；Google 在 Material Design 中强调设计系统与可实现性，则让我们更加坚定 UI 必须与工程实现保持同一套语言。因此我们在设计时首先关注信息结构与交互逻辑，而不是风格表达，优先建立稳定的栅格体系与组件模型，用可复用的设计单元替代一次性的页面视觉，从一开始就让界面具备可扩展能力。
          </p>

          <div className="md-media design-spec-media" data-carousel-id="carousel-design-spec">
            <div className="md-carousel-controls">
              <button className="md-carousel-btn inline-flex btn-icon btn-icon-sm btn-icon-muted" data-action="prev" type="button" aria-label="上一张">
                <i className="ri-arrow-left-line" aria-hidden="true" />
              </button>
              <button className="md-carousel-btn inline-flex btn-icon btn-icon-sm btn-icon-muted" data-action="next" type="button" aria-label="下一张">
                <i className="ri-arrow-right-line" aria-hidden="true" />
              </button>
            </div>
            <div className="md-carousel-track" data-carousel-track="true">
              <div className="md-carousel-card is-landscape">
                <div
                  className="md-carousel-item rounded-md"
                  data-carousel-id="carousel-design-spec"
                  data-index="0"
                >
                  <img
                    src={designSpecScreen01}
                    alt="设计规范示意图"
                    className="md-carousel-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="md-item-caption">组件与布局规范示意图</div>
              </div>
              <div className="md-carousel-card is-portrait">
                <div
                  className="md-carousel-item rounded-md"
                  data-carousel-id="carousel-design-spec"
                  data-index="1"
                >
                  <img
                    src={designSpecScreen02}
                    alt="设计规范示意图"
                    className="md-carousel-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="md-item-caption">组件与布局规范示意图</div>
              </div>
              <div className="md-carousel-card is-portrait">
                <div
                  className="md-carousel-item rounded-md"
                  data-carousel-id="carousel-design-spec"
                  data-index="2"
                >
                  <img
                    src={designSpecScreen03}
                    alt="设计规范示意图"
                    className="md-carousel-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="md-item-caption">组件与布局规范示意图</div>
              </div>
            </div>
          </div>

          <p>
            对于企业软件而言，UI 的生命周期往往会持续多年，如果缺乏统一规范，随着功能增长界面必然迅速失控。因此我们在设计阶段就同步构建设计系统，通过统一的间距节奏、字号体系、色彩语义、组件结构与状态规则，保证不同模块在持续演进过程中仍然保持一致体验。这种方式带来的价值不仅是视觉层面的统一，更是研发效率与产品稳定性的提升：新功能可以直接接入既有组件体系，前端实现不需要重复造轮子，产品在多次版本迭代后依然保持清晰的结构。我们很少做纯视觉改版，因为真正的升级来自设计系统本身的演进，而不是界面表层的变化。
          </p>

          <p>
            我们所服务的大多数产品属于管理系统、数据平台与业务工具，这类软件的核心不在于展示情绪，而在于高效传递信息。因此在界面决策中我们始终坚持信息优先于风格：先保证信息密度与可读性，再讨论视觉表现；先保证操作路径清晰，再优化动效与氛围；先确保真实业务场景可用，再考虑展示层面的设计感。视觉语言的存在是为了帮助用户理解系统，而不是让界面本身成为关注焦点。当用户能够凭借经验完成新的任务，而不需要重新学习界面时，这套 UI 才真正建立起了价值。
          </p>

          <p>
            我们始终认为一致性高于所谓的设计感。单个页面的精致并不能代表系统层面的优秀，真正重要的是同一种操作在不同模块中的行为是否一致，同一类信息是否始终以相同方式呈现，用户是否可以在新的功能中复用既有认知完成操作。当界面不再需要被刻意关注，而是成为用户完成工作的自然媒介时，UI 才达到了理想状态。基于这一点，我们所有的设计方案都会在阶段早期同步考虑前端实现方式，包括组件结构、响应式规则、暗黑模式映射策略以及动效的性能成本，因为设计稿从来不是最终交付物，可运行的界面才是。
          </p>

          <p>
            企业软件不会停留在某一个版本，因此我们在设计之初就会思考未来三到五年的演进路径：当新的业务模块接入时结构是否依然稳定，是否能够自然扩展到多端形态，是否可以承载新的数据模型与交互方式。界面的价值不在上线那一刻，而在多年之后仍然不需要被推翻重做。也正因如此，我们将 UI 视为产品能力的一部分，而不是视觉层面的附属；将设计视为系统构建，而不是风格输出；将规范视为支持长期进化的基础，而不是限制创造力的边界。这些标准与坚持，构成了我们设计每一个产品界面的出发点。
          </p>

          <div className="md-media design-spec-media" data-carousel-id="carousel-design-spec">
            <div className="md-carousel-track" data-carousel-track="true">
              <div className="md-carousel-card is-landscape">
                <div
                  className="md-carousel-item md-carousel-item-video"
                  data-carousel-id="carousel-design-spec"
                  data-index="0"
                >
                  <video
                    className="md-carousel-video"
                    data-inline-video="true"
                    data-video-id="carousel-design-spec-1"
                    data-src="https://video.cdn.queniuqe.com/store_trailers/256878929/movie_max_vp9.webm"
                    muted
                    playsInline
                    preload="none"
                  ></video>
                </div>
                <div className="md-item-caption">交互流程演示视频</div>
              </div>
            </div>
          </div>

        </div>
      </article>
  </div>

  );
}
