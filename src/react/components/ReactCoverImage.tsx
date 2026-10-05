/**
 * [INPUT]: 依赖封面图片、可选视频和图标类名
 * [OUTPUT]: 对外提供 ReactCoverImage，统一渲染加载、视频预览和图标降级
 * [POS]: React 内容卡片与首页媒体的共享展示边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState } from "react";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoPaused, setVideoPaused] = useState(true);
  const imageSource = imageUrl(String(src).trim());
  const hasVideo = enableVideoCover && Boolean(videoSrc);

  useEffect(() => {
    if (!hasVideo || !videoRef.current || !rootRef.current) return undefined;
    const video = videoRef.current;
    const root = rootRef.current;
    const play = () => {
      void video.play().then(() => setVideoPaused(false)).catch(() => undefined);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) play();
      else {
        video.pause();
        setVideoPaused(true);
      }
    }, { threshold: 0.1 });
    observer.observe(root);
    return () => observer.disconnect();
  }, [hasVideo]);

  const toggleVideo = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().then(() => setVideoPaused(false)).catch(() => undefined);
    } else {
      video.pause();
      setVideoPaused(true);
    }
  };

  return (
    <div ref={rootRef} className={`react-cover-media group relative h-full w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800/35 ${className}`}>
      {!imageLoaded && !imageError && <div className="absolute inset-0 animate-pulse bg-zinc-100/75 dark:bg-zinc-700/40" aria-hidden="true" />}
      {imageSource && (
        <img
          src={imageSource}
          srcSet={srcSet || undefined}
          sizes={sizes || undefined}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${imageLoaded && !imageError ? "opacity-100" : "opacity-0"} ${imageClassName}`}
        />
      )}
      {hasVideo && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={imageSource || undefined}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${videoReady ? "opacity-100" : "opacity-0"}`}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onLoadedMetadata={() => setVideoReady(true)}
        />
      )}
      {iconClass && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white" style={{ "--cover-icon-scale": iconScale } as React.CSSProperties} aria-hidden="true">
          <i className={`${iconClass} react-cover-icon`} />
        </div>
      )}
      {hasVideo && videoReady && (
        <button type="button" className="react-cover-play absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-black/20 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 focus:opacity-100" onClick={toggleVideo} aria-label={videoPaused ? "播放封面视频" : "暂停封面视频"}>
          <i className={videoPaused ? "ri-play-fill" : "ri-pause-fill"} />
        </button>
      )}
    </div>
  );
}
