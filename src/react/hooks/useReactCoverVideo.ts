/**
 * [INPUT]: 依赖封面视频地址、宿主节点和媒体可见性
 * [OUTPUT]: 对外提供视频 ref、加载状态、播放状态和手动切换能力
 * [POS]: ReactCoverImage 的媒体生命周期适配器，隔离 IntersectionObserver 与播放策略
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState, type MouseEvent } from "react";

export function useReactCoverVideo(videoSrc: string, rootRef: React.RefObject<HTMLDivElement | null>) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoPaused, setVideoPaused] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const root = rootRef.current;
    if (!videoSrc || !video || !root) return undefined;
    const play = () => { void video.play().then(() => setVideoPaused(false)).catch(() => undefined); };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) play();
      else { video.pause(); setVideoPaused(true); }
    }, { threshold: 0.1 });
    observer.observe(root);
    return () => observer.disconnect();
  }, [rootRef, videoSrc]);

  const toggleVideo = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().then(() => setVideoPaused(false)).catch(() => undefined);
    else { video.pause(); setVideoPaused(true); }
  };

  return { videoRef, videoReady, videoPaused, setVideoReady, toggleVideo };
}
