/**
 * [INPUT]: 依赖企业微信二维码资源、指针事件和减少动画偏好
 * [OUTPUT]: 对外提供 QrContactCard，支持桌面端二维码倾斜与高光反馈
 * [POS]: 关于页联系区的局部交互组件，所有 rAF 与媒体状态在卸载时释放
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import qrCode from "../../assets/wecom-qrcode.webp";
import styles from "./AboutPage.module.css";

type QrStyle = CSSProperties & Record<`--${string}`, string>;
const initialStyle: QrStyle = { transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)", "--glare-x": "50%", "--glare-y": "50%", "--glare-opacity": "0" };

export function QrContactCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<QrStyle | null>(null);
  const [style, setStyle] = useState<QrStyle>(initialStyle);
  const canAnimateRef = useRef(false);

  useEffect(() => {
    canAnimateRef.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!canAnimateRef.current || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    pendingRef.current = {
      transform: `perspective(900px) rotateX(${((0.5 - py) * 16).toFixed(2)}deg) rotateY(${((px - 0.5) * 18).toFixed(2)}deg) scale(1.045)`,
      "--glare-x": `${(px * 100).toFixed(2)}%`, "--glare-y": `${(py * 100).toFixed(2)}%`, "--glare-opacity": "0.95",
    };
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => { frameRef.current = null; if (pendingRef.current) { setStyle(pendingRef.current); pendingRef.current = null; } });
  };

  const reset = () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    pendingRef.current = null;
    setStyle(initialStyle);
  };

  return <div ref={cardRef} className={`${styles.qrTiltCard} mx-auto w-full max-w-72`} style={style} onPointerMove={onPointerMove} onPointerLeave={reset}>
    <img src={qrCode} alt="企业微信二维码" className="block h-auto w-full rounded-xl border border-edge bg-white p-3" />
    <span className={styles.qrTiltGlare} aria-hidden="true" />
  </div>;
}
