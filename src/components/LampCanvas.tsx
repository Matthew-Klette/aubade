"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import type { BaseId, FinishId, SizeId } from "@/lib/catalog";
import { createLampScene, type LampScene } from "@/lib/lampScene";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type LampHandle = {
  /** Drive the light without a React render: used by scroll-scrubbed scenes. */
  setLight(hex: string, intensity: number): void;
};

type LampCanvasProps = {
  readonly label: string;
  readonly light: string;
  readonly intensity: number;
  readonly finish?: FinishId;
  readonly base?: BaseId;
  readonly size?: SizeId;
  readonly halo?: boolean;
  readonly framing?: number;
  readonly className?: string;
  readonly ref?: Ref<LampHandle>;
};

/** Max frame delta, so a backgrounded tab doesn't jump the easing on return. */
const MAX_DELTA_SECONDS = 0.05;

export function LampCanvas({
  label,
  light,
  intensity,
  finish = "brass",
  base = "travertine",
  size = "petite",
  halo = true,
  framing = 1.2,
  className = "",
  ref,
}: LampCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<LampScene | null>(null);
  const reducedMotion = useReducedMotion();
  const [failed, setFailed] = useState(false);

  // Latest props, read when the scene is (re)created; live changes flow through the setters below.
  const latest = useRef({ light, intensity, finish, base, size, halo, framing });
  // Read per frame rather than as an effect dependency: hydration flips this once, and a
  // dependency would tear down and rebuild the whole WebGL scene.
  const reducedMotionRef = useRef(reducedMotion);
  useEffect(() => {
    latest.current = { light, intensity, finish, base, size, halo, framing };
    reducedMotionRef.current = reducedMotion;
  });

  useImperativeHandle(ref, () => ({
    setLight: (hex, value) => sceneRef.current?.setLight(hex, value),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let scene: LampScene;
    try {
      scene = createLampScene(canvas, latest.current);
    } catch (error) {
      console.error("Aubade: WebGL lamp unavailable, showing static fallback.", error);
      // Rendering a fallback is the only recovery once WebGL creation throws.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
      return;
    }
    sceneRef.current = scene;

    const resize = () => scene.resize(canvas.clientWidth, canvas.clientHeight);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    let visible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibilityObserver.observe(canvas);

    const onPointer = (event: PointerEvent) => {
      scene.setPointer((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const tick = (_time: number, deltaMs: number) => {
      if (visible) scene.frame(Math.min(deltaMs / 1000, MAX_DELTA_SECONDS), !reducedMotionRef.current);
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onPointer);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => sceneRef.current?.setLight(light, intensity), [light, intensity]);
  useEffect(() => sceneRef.current?.setFinish(finish), [finish]);
  useEffect(() => sceneRef.current?.setBase(base), [base]);
  useEffect(() => sceneRef.current?.setSize(size), [size]);

  if (failed) {
    return (
      <div role="img" aria-label={label} className={`grid place-items-center ${className}`}>
        <div
          className="aspect-square w-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, ${light} 0%, ${light}55 35%, transparent 70%)` }}
        />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={`lamp-canvas block h-full w-full ${halo ? "lamp-canvas--feather" : ""} ${className}`}
    />
  );
}
