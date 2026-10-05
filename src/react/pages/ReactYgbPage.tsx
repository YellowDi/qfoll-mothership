/**
 * [INPUT]: 依赖 ./ygbStory 的封面与六章杂志式介绍
 * [OUTPUT]: 对外提供 ReactYgbPage
 * [POS]: 产品专题路由 /ygb 的 React 页面边界；整页只有一个港区世界，封面承担原 Hero 的品牌标题与入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { YgbStory } from "./ygbStory/YgbStory";

/* 页面只做编排；#dashboard/#governance/#download 等锚点由 YgbStory 按章节滚动位置提供 */
export function ReactYgbPage() {
  return <div className="w-full bg-bg pt-14">
    <YgbStory />
  </div>;
}
