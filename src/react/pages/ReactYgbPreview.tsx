/**
 * [INPUT]: 依赖共享 ReactYgbHero 的首页预览模式与 React Router
 * [OUTPUT]: 对外提供 ReactYgbPreview
 * [POS]: 首页云柜宝入口，仅包装跳转；视觉与原版专题 Hero 同源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { Link } from "react-router-dom";
import { ReactYgbHero } from "./ReactYgbHero";
export function ReactYgbPreview() {
  return <Link to="/ygb" className="block rounded-md"><ReactYgbHero homePreview /></Link>;
}
