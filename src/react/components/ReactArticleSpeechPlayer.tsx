/**
 * [INPUT]: 依赖文章容器引用与浏览器 SpeechSynthesis API
 * [OUTPUT]: 对外提供文章朗读、暂停、继续和倍速控制
 * [POS]: 项目与新闻详情工具栏的无障碍辅助播放器
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { useEffect, useRef, useState, type RefObject } from "react";

type Props = { containerRef: RefObject<HTMLElement | null>; contentKey: string };
const rates = [0.5, 1, 1.5, 2];
const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function ReactArticleSpeechPlayer({ containerRef, contentKey }: Props) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const [playing, setPlaying] = useState(false); const [paused, setPaused] = useState(false); const [rate, setRate] = useState(1); const [elapsed, setElapsed] = useState(0); const [ready, setReady] = useState(false); const [estimated, setEstimated] = useState(0); const [textQueue, setTextQueue] = useState<string[]>([]);
  const queueRef = useRef<string[]>([]); const indexRef = useRef(0); const rateRef = useRef(rate); const timerRef = useRef<number | null>(null);
  useEffect(() => { const root = containerRef.current; setTextQueue(root ? Array.from(root.querySelectorAll("p, li, blockquote, h2, h3, h4, h5, h6")).map((node) => node.textContent?.replace(/\s+/g, " ").trim() || "").filter(Boolean) : []); }, [containerRef, contentKey]);
  useEffect(() => { setEstimated(Math.max(0, Math.ceil(textQueue.join("").length / (4.5 * rate)))); }, [textQueue, rate]);
  useEffect(() => { rateRef.current = rate; }, [rate]);
  useEffect(() => { if (!supported) return; const load = () => setReady(window.speechSynthesis.getVoices().length > 0); load(); window.speechSynthesis.addEventListener?.("voiceschanged", load); return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load); }, [supported]);
  useEffect(() => () => { window.speechSynthesis?.cancel(); if (timerRef.current) window.clearInterval(timerRef.current); }, []);
  const stop = () => { if (supported) window.speechSynthesis.cancel(); setPlaying(false); setPaused(false); setElapsed(0); if (timerRef.current) window.clearInterval(timerRef.current); };
  const speakFrom = (index: number) => { if (!supported || index >= queueRef.current.length) { stop(); return; } indexRef.current = index; const utterance = new SpeechSynthesisUtterance(queueRef.current[index]); utterance.lang = "zh-CN"; utterance.rate = rateRef.current; utterance.onend = () => window.setTimeout(() => speakFrom(index + 1), 520); utterance.onerror = () => window.setTimeout(() => speakFrom(index + 1), 520); window.speechSynthesis.speak(utterance); };
  const primary = () => { if (!supported || !ready) return; if (!playing) { const root = containerRef.current; queueRef.current = root ? Array.from(root.querySelectorAll("p, li, blockquote, h2, h3, h4, h5, h6")).map((node) => node.textContent?.replace(/\s+/g, " ").trim() || "").filter(Boolean) : []; if (!queueRef.current.length) return; setPlaying(true); setPaused(false); setElapsed(0); timerRef.current = window.setInterval(() => setElapsed((value) => value + 1), 1000); speakFrom(0); } else if (paused) { window.speechSynthesis.resume(); setPaused(false); } else { window.speechSynthesis.pause(); setPaused(true); } };
  return <div className="inline-flex min-h-[34px] flex-wrap items-center gap-3"><button type="button" className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black/8 text-primary transition-colors hover:bg-black/12 dark:bg-white/14 dark:hover:bg-white/20" disabled={!supported || !ready} onClick={primary} aria-label={!supported ? "当前浏览器不支持朗读" : !ready ? "正在加载语音" : playing && !paused ? "暂停朗读" : playing ? "继续朗读" : "开始朗读"}><i className={playing && !paused ? "ri-pause-fill" : "ri-play-fill"} aria-hidden="true" /></button><span className="text-base text-primary">{playing ? clock(elapsed) : <>朗读本文 <span className="text-secondary">｜ {clock(estimated)}</span></>}</span>{playing && <span className="flex items-center gap-1 border-l border-line/15 pl-3">{rates.map((option) => <button key={option} type="button" className={`px-1 text-sm ${option === rate ? "font-semibold text-primary" : "text-secondary"}`} onClick={() => { setRate(option); stop(); }} aria-pressed={option === rate}>{option}x</button>)}</span>}</div>;
}
