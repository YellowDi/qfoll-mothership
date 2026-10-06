/**
 * [INPUT]: 无运行时依赖，仅描述 Markdown 内容域的数据形状
 * [OUTPUT]: 对外提供 Frontmatter、CoverAsset、CarouselSlide、CustomCarousel、ParsedMarkdown、ContentBase、ProjectEntry、NewsEntry 类型
 * [POS]: data 层的类型边界；解析器、项目与新闻索引共享，React 页面据此消费而无需各自重声明
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* 自研 frontmatter 解析器只会产出字符串、字符串数组与「键值对象数组」 */
export type FrontmatterValue = string | Array<string | Record<string, string>>;

/* 已知字段声明为 string；索引签名兜住未来新增的任意字段 */
export interface Frontmatter {
  id?: string;
  title?: string;
  sidebarTitle?: string;
  publishedAt?: string;
  year?: string;
  startMonth?: string;
  category?: string;
  company?: string;
  tag?: string;
  lead?: string;
  cover?: string;
  coverVideo?: string;
  coverIcon?: string;
  primaryButtonText?: string;
  primaryButtonUrl?: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  infoTags?: string[];
  [key: string]: FrontmatterValue | undefined;
}

export interface CoverAsset {
  src: string;
  srcSet: string;
}

export interface CarouselSlide {
  image?: string;
  video?: string;
  caption?: string;
}

export interface CustomCarousel {
  id: string;
  slides: CarouselSlide[];
}

export interface ParsedMarkdown {
  id: string;
  data: Frontmatter;
  coverAsset: CoverAsset;
  infoPanelHtml: string;
  customCarousels: CustomCarousel[];
  bodyHtml: string;
}

/* 项目与新闻共有的内容字段；各自域再扩展差异字段 */
export interface ContentBase {
  id: string;
  title: string;
  sidebarTitle: string;
  startMonth: string;
  tag: string;
  lead: string;
  cover: string;
  coverSrcSet: string;
  coverVideo: string;
  coverIcon: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  infoTags: string[];
  infoPanelHtml: string;
  customCarousels: CustomCarousel[];
  bodyHtml: string;
}

export interface ProjectEntry extends ContentBase {
  year: string;
  yearLabel: string;
  company: string;
}

export interface NewsEntry extends ContentBase {
  publishedAt: string;
  publishedAtRaw: string;
  publishedTimestamp: number;
  year: string;
  category: string;
}
