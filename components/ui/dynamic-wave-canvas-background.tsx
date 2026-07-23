"use client";

import { useEffect, useRef } from "react";

const TABLE_SIZE = 1024;
const TABLE_MASK = TABLE_SIZE - 1;
const TAU = Math.PI * 2;
const FRAME_INTERVAL = 1000 / 24;

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export default function DynamicWaveCanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const bufferCanvas = document.createElement("canvas");
    const bufferContext = bufferCanvas.getContext("2d", { alpha: false });
    if (!bufferContext) return;

    const sinTable = new Float32Array(TABLE_SIZE);
    const cosTable = new Float32Array(TABLE_SIZE);
    for (let index = 0; index < TABLE_SIZE; index += 1) {
      const angle = (index / TABLE_SIZE) * TAU;
      sinTable[index] = Math.sin(angle);
      cosTable[index] = Math.cos(angle);
    }

    const fastSin = (value: number) => sinTable[Math.floor((value / TAU) * TABLE_SIZE) & TABLE_MASK];
    const fastCos = (value: number) => cosTable[Math.floor((value / TAU) * TABLE_SIZE) & TABLE_MASK];

    let width = 1;
    let height = 1;
    let imageData = bufferContext.createImageData(width, height);
    let pixels = imageData.data;
    let animationFrame = 0;
    let lastFrame = 0;
    let isVisible = true;
    const startedAt = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderFrame = (timestamp: number) => {
      const time = reducedMotion ? 0.75 : (timestamp - startedAt) * 0.00034;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const unitX = (2 * x - width) / height;
          const unitY = (2 * y - height) / height;
          let a = 0;
          let d = 0;

          for (let iteration = 0; iteration < 4; iteration += 1) {
            a += fastCos(iteration - d + time - a * unitX);
            d += fastSin(iteration * unitY + a);
          }

          const wave = (fastSin(a) + fastCos(d)) * 0.5;
          const field = 0.5 + 0.5 * fastCos(unitX * 0.72 + unitY * 0.58 + time * 0.46);
          const ridge = Math.pow(Math.max(0, fastSin(a * 1.45 + d * 0.34 + time)), 6);
          const lift = clamp(0.045 + (wave + 1) * 0.09 + field * 0.055 + ridge * 0.23, 0.03, 0.42);

          const baseRed = 6 + 11 * field;
          const baseGreen = 20 - 2 * field;
          const baseBlue = 38 - 25 * field;
          const pixelIndex = (y * width + x) * 4;

          pixels[pixelIndex] = baseRed + (191 - baseRed) * lift * 0.66;
          pixels[pixelIndex + 1] = baseGreen + (210 - baseGreen) * lift * 0.78;
          pixels[pixelIndex + 2] = baseBlue + (227 - baseBlue) * lift;
          pixels[pixelIndex + 3] = 255;
        }
      }

      bufferContext.putImageData(imageData, 0, 0);
      context.imageSmoothingEnabled = true;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bufferCanvas, 0, 0, width, height, 0, 0, canvas.width, canvas.height);
    };

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const resolutionDivider = bounds.width < 760 ? 5 : 4;

      canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));
      width = Math.max(1, Math.floor(bounds.width / resolutionDivider));
      height = Math.max(1, Math.floor(bounds.height / resolutionDivider));
      bufferCanvas.width = width;
      bufferCanvas.height = height;
      imageData = bufferContext.createImageData(width, height);
      pixels = imageData.data;
      renderFrame(performance.now());
    };

    const animate = (timestamp: number) => {
      if (isVisible && timestamp - lastFrame >= FRAME_INTERVAL) {
        renderFrame(timestamp);
        lastFrame = timestamp;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    intersectionObserver.observe(canvas);

    resizeCanvas();
    if (!reducedMotion) animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="footer-wave-canvas" aria-hidden="true" />;
}
