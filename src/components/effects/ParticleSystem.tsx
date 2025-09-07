import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Connection {
  from: Particle;
  to: Particle;
  opacity: number;
}

interface ParticleSystemProps {
  width?: number;
  height?: number;
  particleCount?: number;
  connectionDistance?: number;
  particleSpeed?: number;
  colors?: string[];
  className?: string;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  width = 800,
  height = 600,
  particleCount = 50,
  connectionDistance = 120,
  particleSpeed = 0.5,
  colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'],
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Initialize particles
  const initializeParticles = () => {
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * particleSpeed,
      vy: (Math.random() - 0.5) * particleSpeed,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: Math.random() * 1000 + 500,
      maxLife: Math.random() * 1000 + 500
    }));
  };

  // Update particle positions and properties
  const updateParticles = () => {
    particlesRef.current.forEach(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off edges
      if (particle.x <= 0 || particle.x >= width) {
        particle.vx *= -1;
        particle.x = Math.max(0, Math.min(width, particle.x));
      }
      if (particle.y <= 0 || particle.y >= height) {
        particle.vy *= -1;
        particle.y = Math.max(0, Math.min(height, particle.y));
      }

      // Update life and opacity
      particle.life -= 1;
      particle.opacity = Math.max(0, particle.life / particle.maxLife);

      // Respawn particle if it dies
      if (particle.life <= 0) {
        particle.x = Math.random() * width;
        particle.y = Math.random() * height;
        particle.vx = (Math.random() - 0.5) * particleSpeed;
        particle.vy = (Math.random() - 0.5) * particleSpeed;
        particle.life = particle.maxLife;
        particle.opacity = Math.random() * 0.8 + 0.2;
      }
    });
  };

  // Find connections between nearby particles
  const findConnections = (): Connection[] => {
    const connections: Connection[] = [];
    
    for (let i = 0; i < particlesRef.current.length; i++) {
      for (let j = i + 1; j < particlesRef.current.length; j++) {
        const p1 = particlesRef.current[i];
        const p2 = particlesRef.current[j];
        
        const distance = Math.sqrt(
          Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
        );
        
        if (distance < connectionDistance) {
          const opacity = (1 - distance / connectionDistance) * 0.3;
          connections.push({ from: p1, to: p2, opacity });
        }
      }
    }
    
    return connections;
  };

  // Render the particle system
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    const connections = findConnections();
    connections.forEach(connection => {
      ctx.beginPath();
      ctx.moveTo(connection.from.x, connection.from.y);
      ctx.lineTo(connection.to.x, connection.to.y);
      ctx.strokeStyle = `rgba(59, 130, 246, ${connection.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw particles
    particlesRef.current.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      
      // Create gradient for particle
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      );
      gradient.addColorStop(0, `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${particle.color}00`);
      
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add glow effect
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.size * 2;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  };

  // Animation loop
  const animate = () => {
    if (!isVisible) return;
    
    updateParticles();
    render();
    animationRef.current = requestAnimationFrame(animate);
  };

  // Intersection Observer for performance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Initialize and start animation
  useEffect(() => {
    if (isVisible) {
      initializeParticles();
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`${className}`}
      style={{ 
        background: 'transparent',
        pointerEvents: 'none'
      }}
    />
  );
};

export default ParticleSystem;