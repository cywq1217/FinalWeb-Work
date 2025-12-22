import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
}

export default function AudioVisualizer({ isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 初始化柱状图数据
    const barCount = 64;
    if (barsRef.current.length === 0) {
      barsRef.current = Array(barCount).fill(0).map(() => Math.random() * 0.3);
    }

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount;
      const gap = 2;

      barsRef.current.forEach((bar, i) => {
        // 模拟音频数据变化
        if (isPlaying) {
          const target = Math.random() * 0.8 + 0.2;
          barsRef.current[i] = bar + (target - bar) * 0.15;
        } else {
          barsRef.current[i] = bar * 0.95;
        }

        const barHeight = barsRef.current[i] * height * 0.8;
        const x = i * barWidth;
        const y = height - barHeight;

        // 渐变色
        const gradient = ctx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, `rgba(168, 85, 247, ${0.8 + barsRef.current[i] * 0.2})`);
        gradient.addColorStop(0.5, `rgba(236, 72, 153, ${0.6 + barsRef.current[i] * 0.3})`);
        gradient.addColorStop(1, `rgba(251, 146, 60, ${0.4 + barsRef.current[i] * 0.2})`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + gap / 2, y, barWidth - gap, barHeight, [4, 4, 0, 0]);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={100}
      className="w-full h-24 opacity-60"
    />
  );
}
