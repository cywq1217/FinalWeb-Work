import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, isActive: false });
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 初始化画布大小
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // 在鼠标位置创建新粒子
    const createParticle = (mx: number, my: number): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.5 + 0.5; // 降低初始速度
      const maxLife = Math.random() * 120 + 80; // 延长生命周期
      return {
        x: mx,
        y: my,
        originX: mx,
        originY: my,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        hue: Math.random() * 60 + 260,
        alpha: 1,
        life: 0,
        maxLife,
      };
    };

    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;

      // 如果鼠标活动，创建新粒子（降低生成频率）
      if (mouse.isActive && mouse.x > 0 && mouse.y > 0) {
        if (Math.random() < 0.3) { // 只有30%概率生成粒子
          particlesRef.current.push(createParticle(mouse.x, mouse.y));
        }
      }

      // 更新和绘制粒子
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life++;
        
        // 生命周期结束
        if (p.life >= p.maxLife) return false;

        // 计算透明度（渐隐效果）
        const lifeRatio = p.life / p.maxLife;
        p.alpha = 1 - lifeRatio;

        // 分散效果：粒子向外扩散（更慢的衰减）
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;

        // 鼠标吸引/排斥效果（更温和的力度）
        if (mouse.isActive) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150 && dist > 0) {
            // 近距离排斥，远距离吸引（降低力度）
            const force = dist < 50 ? -0.15 : 0.08;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // 绘制粒子
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.alpha * 0.8})`;
        ctx.fill();

        return true;
      });

      // 绘制粒子间连线
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 80) {
            const alpha = (1 - dist / 80) * Math.min(p1.alpha, p2.alpha) * 0.3;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(280, 70%, 60%, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // 限制粒子数量
      if (particlesRef.current.length > 80) {
        particlesRef.current = particlesRef.current.slice(-80);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // 鼠标移动
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, isActive: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000, isActive: false };
    };

    // 初始化
    resize();
    animate();

    // 事件监听
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}
