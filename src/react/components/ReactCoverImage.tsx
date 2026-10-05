/**
 * [INPUT]: 依赖封面图片、可选视频和图标类名
 * [OUTPUT]: 对外提供 ReactCoverImage，统一渲染加载、视频预览和图标降级
 * [POS]: React 内容卡片与首页媒体的共享展示边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useRef, useState, type CSSProperties } from "react";
import { useReactCoverVideo } from "../hooks/useReactCoverVideo";

type Props = {
  src?: string;
  srcSet?: string;
  sizes?: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  videoSrc?: string;
  iconClass?: string;
  iconScale?: number;
  enableVideoCover?: boolean;
};

const imageUrl = (value: string) => {
  const match = value.match(/url\((['"]?)(.*?)\1\)/);
  return match?.[2] || value;
};

export function ReactCoverImage({
  src = "",
  srcSet,
  sizes,
  alt = "",
  className = "",
  imageClassName = "",
  videoSrc = "",
  iconClass = "",
  iconScale = 1,
  enableVideoCover = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageSource = imageUrl(String(src).trim());
  const hasVideo = enableVideoCover && Boolean(videoSrc);
  const { videoRef, videoReady, videoPaused, setVideoReady, toggleVideo } = useReactCoverVideo(videoSrc, rootRef);

  return (
    <div ref={rootRef} className={`react-cover-media group relative h-full w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/35 ${className}`}>
      <CoverImageLayer source={imageSource} srcSet={srcSet} sizes={sizes} alt={alt} loaded={imageLoaded} errored={imageError} onLoad={() => setImageLoaded(true)} onError={() => setImageError(true)} className={imageClassName} />
      <CoverVideoLayer enabled={hasVideo} videoRef={videoRef} source={videoSrc} poster={imageSource} ready={videoReady} onReady={() => setVideoReady(true)} />
      <CoverIconLayer className={iconClass} scale={iconScale} />
      <CoverPlayButton enabled={hasVideo && videoReady} paused={videoPaused} onClick={toggleVideo} />
    </div>
  );
}

function CoverImageLayer({ source, srcSet, sizes, alt, loaded, errored, onLoad, onError, className }: { source: string; srcSet?: string; sizes?: string; alt: string; loaded: boolean; errored: boolean; onLoad: () => void; onError: () => void; className: string }) {
  if (!source) return null;
  return <><div className={`absolute inset-0 animate-pulse motion-reduce:animate-none bg-zinc-100/75 dark:bg-zinc-700/40 ${loaded || errored ? "hidden" : ""}`} aria-hidden="true" /><img src={source} srcSet={srcSet || undefined} sizes={sizes || undefined} alt={alt} loading="lazy" decoding="async" onLoad={onLoad} onError={onError} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${loaded && !errored ? "opacity-100" : "opacity-0"} ${className}`} /> </>;
}

function CoverVideoLayer({ enabled, videoRef, source, poster, ready, onReady }: { enabled: boolean; videoRef: React.RefObject<HTMLVideoElement | null>; source: string; poster: string; ready: boolean; onReady: () => void }) {
  if (!enabled) return null;
  return <video ref={videoRef} src={source} poster={poster || undefined} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`} muted loop playsInline preload="metadata" aria-hidden="true" onLoadedMetadata={onReady} />;
}

function CoverIconLayer({ className, scale }: { className: string; scale: number }) {
  if (!className) return null;
  return <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white" style={{ "--cover-icon-scale": scale } as CSSProperties} aria-hidden="true"><i className={`${className} react-cover-icon`} /></div>;
}

function CoverPlayButton({ enabled, paused, onClick }: { enabled: boolean; paused: boolean; onClick: (event: React.MouseEvent<HTMLButtonElement>) => void }) {
  if (!enabled) return null;
  return <button type="button" className="react-cover-play absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-black/20 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 focus:opacity-100" onClick={onClick} aria-label={paused ? "播放封面视频" : "暂停封面视频"}><i className={paused ? "ri-play-fill" : "ri-pause-fill"} /></button>;
}
