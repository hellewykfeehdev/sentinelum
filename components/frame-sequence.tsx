'use client';

import { useEffect, useRef } from 'react';

const frameCount = 150;
const frames = Array.from(
  { length: frameCount },
  (_, index) => `/frames/certificate/ezgif-frame-${String(index + 1).padStart(3, '0')}.jpg`
);

export function FrameSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const images: Array<HTMLImageElement | undefined> = [];
    const loaded = new Set<number>();
    let frame = 0;
    let raf = 0;
    let last = 0;
    let mounted = true;
    let visible = true;
    let lastDrawableFrame = 0;
    let preloadCursor = 0;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * scale));
      canvas.height = Math.max(1, Math.floor(rect.height * scale));
    }

    function loadFrame(index: number) {
      if (images[index]) return;

      const image = new Image();
      image.decoding = 'async';
      image.onload = () => loaded.add(index);
      image.src = frames[index];
      images[index] = image;
    }

    function preloadChunk(count: number) {
      for (let i = 0; i < count; i += 1) {
        loadFrame(preloadCursor % frames.length);
        preloadCursor += 1;
      }
    }

    function drawImage(index: number) {
      if (!ctx || !canvas) return false;
      const image = images[index];
      if (!image || !image.complete || !image.naturalWidth) return false;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ratio = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      const width = image.naturalWidth * ratio;
      const height = image.naturalHeight * ratio;
      ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      return true;
    }

    function draw(time = 0) {
      if (!mounted || !ctx || !canvas) return;

      if (visible && (!last || time - last > 41)) {
        const drawn = drawImage(frame);

        if (drawn) {
          lastDrawableFrame = frame;
          if (!prefersReducedMotion) frame = (frame + 1) % frames.length;
          preloadChunk(2);
        } else {
          drawImage(lastDrawableFrame);
          loadFrame(frame);
        }

        last = time;
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    preloadChunk(18);
    window.addEventListener('resize', resize);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(canvas);

    raf = requestAnimationFrame(draw);

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Looping digital certificate preview"
      className="h-full min-h-[420px] w-full rounded-lg object-cover sm:min-h-[520px]"
    />
  );
}
