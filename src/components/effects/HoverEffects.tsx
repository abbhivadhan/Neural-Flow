import React, { useRef, useState, useEffect } from 'react';
import { microInteractions } from '../../utils/animations';

interface HoverEffectProps {
  children: React.ReactNode;
  effect?: 'glow' | 'lift' | 'tilt' | 'neural' | 'pulse' | 'magnetic' | 'quickstart';
  intensity?: 'subtle' | 'medium' | 'strong';
  color?: string;
  className?: string;
  disabled?: boolean;
}

export const HoverEffect: React.FC<HoverEffectProps> = ({
  children,
  effect = 'glow',
  intensity = 'medium',
  color = '#3b82f6',
  className = '',
  disabled = false
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const intensityValues = {
    subtle: 0.5,
    medium: 1,
    strong: 1.5
  };

  const currentIntensity = intensityValues[intensity];

  const handleMouseEnter = async () => {
    if (disabled) return;
    setIsHovered(true);
    
    const element = elementRef.current;
    if (!element) return;

    switch (effect) {
      case 'glow':
        element.style.boxShadow = `0 0 ${20 * currentIntensity}px ${color}40, 0 0 ${40 * currentIntensity}px ${color}20`;
        element.style.transform = `translateY(-${2 * currentIntensity}px)`;
        break;
      case 'lift':
        element.style.transform = `translateY(-${8 * currentIntensity}px) scale(${1 + 0.02 * currentIntensity})`;
        element.style.boxShadow = `0 ${10 * currentIntensity}px ${30 * currentIntensity}px rgba(0,0,0,0.1)`;
        break;
      case 'pulse':
        await microInteractions.pulse(element, 1 + 0.05 * currentIntensity);
        break;
      case 'neural':
        element.style.transform = `scale(${1 + 0.03 * currentIntensity})`;
        element.style.filter = `brightness(${1 + 0.1 * currentIntensity}) saturate(${1 + 0.2 * currentIntensity})`;
        element.style.boxShadow = `0 0 ${15 * currentIntensity}px ${color}30`;
        break;
      case 'quickstart':
        // Only set initial hover state, mouse move will handle the tilt
        element.style.boxShadow = `0 0 ${25 * currentIntensity}px ${color}50, 0 0 ${50 * currentIntensity}px ${color}30, 0 ${15 * currentIntensity}px ${40 * currentIntensity}px rgba(0,0,0,0.15)`;
        element.style.filter = `brightness(${1 + 0.15 * currentIntensity}) saturate(${1 + 0.3 * currentIntensity})`;
        if (!isHovered) {
          element.style.transform = `translateY(-${4 * currentIntensity}px) scale(${1 + 0.05 * currentIntensity})`;
        }
        break;
    }
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setIsHovered(false);
    
    const element = elementRef.current;
    if (!element) return;

    element.style.transform = '';
    element.style.boxShadow = '';
    element.style.filter = '';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled || (effect !== 'tilt' && effect !== 'magnetic' && effect !== 'quickstart')) return;
    
    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    setMousePosition({ x, y });

    if (effect === 'tilt') {
      const tiltX = (y / rect.height) * 20 * currentIntensity;
      const tiltY = -(x / rect.width) * 20 * currentIntensity;
      
      element.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${1 + 0.02 * currentIntensity})`;
    } else if (effect === 'magnetic') {
      const magnetX = x * 0.1 * currentIntensity;
      const magnetY = y * 0.1 * currentIntensity;
      
      element.style.transform = `translate(${magnetX}px, ${magnetY}px) scale(${1 + 0.02 * currentIntensity})`;
    } else if (effect === 'quickstart') {
      const tiltX = (y / rect.height) * 8 * currentIntensity;
      const tiltY = -(x / rect.width) * 8 * currentIntensity;
      
      element.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-${4 * currentIntensity}px) scale(${1 + 0.05 * currentIntensity})`;
    }
  };

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-300 ease-out ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        transformStyle: 'preserve-3d',
        cursor: disabled ? 'default' : 'pointer'
      }}
    >
      {children}
      
      {/* Magnetic trail effect */}
      {effect === 'magnetic' && isHovered && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            width: '4px',
            height: '4px',
            backgroundColor: color,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.6,
            transition: 'all 0.1s ease-out'
          }}
        />
      )}
    </div>
  );
};

interface FloatingElementProps {
  children: React.ReactNode;
  amplitude?: number;
  frequency?: number;
  className?: string;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  amplitude = 10,
  frequency = 2000,
  className = ''
}) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const y = Math.sin(elapsed / frequency * Math.PI * 2) * amplitude;
      
      element.style.transform = `translateY(${y}px)`;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [amplitude, frequency]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};

interface ParallaxElementProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const ParallaxElement: React.FC<ParallaxElementProps> = ({
  children,
  speed = 0.5,
  className = ''
}) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallax = scrolled * speed;
      
      element.style.transform = `translateY(${parallax}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};

interface GlitchEffectProps {
  children: React.ReactNode;
  intensity?: number;
  className?: string;
  trigger?: 'hover' | 'always' | 'click';
}

export const GlitchEffect: React.FC<GlitchEffectProps> = ({
  children,
  intensity = 1,
  className = '',
  trigger = 'hover'
}) => {
  const [isActive, setIsActive] = useState(trigger === 'always');

  const glitchKeyframes = `
    @keyframes glitch {
      0% { transform: translate(0); }
      20% { transform: translate(-${2 * intensity}px, ${2 * intensity}px); }
      40% { transform: translate(-${2 * intensity}px, -${2 * intensity}px); }
      60% { transform: translate(${2 * intensity}px, ${2 * intensity}px); }
      80% { transform: translate(${2 * intensity}px, -${2 * intensity}px); }
      100% { transform: translate(0); }
    }
  `;

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = glitchKeyframes;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [intensity]);

  const handleInteraction = () => {
    if (trigger === 'click') {
      setIsActive(true);
      setTimeout(() => setIsActive(false), 500);
    }
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => trigger === 'hover' && setIsActive(true)}
      onMouseLeave={() => trigger === 'hover' && setIsActive(false)}
      onClick={handleInteraction}
    >
      <div
        className={`${isActive ? 'animate-pulse' : ''}`}
        style={{
          animation: isActive ? 'glitch 0.3s infinite' : 'none'
        }}
      >
        {children}
      </div>
      
      {/* Glitch layers */}
      {isActive && (
        <>
          <div
            className="absolute inset-0 opacity-70"
            style={{
              color: '#ff0000',
              transform: `translate(-${1 * intensity}px, 0)`,
              mixBlendMode: 'multiply'
            }}
          >
            {children}
          </div>
          <div
            className="absolute inset-0 opacity-70"
            style={{
              color: '#00ff00',
              transform: `translate(${1 * intensity}px, 0)`,
              mixBlendMode: 'multiply'
            }}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
};

export default { HoverEffect, FloatingElement, ParallaxElement, GlitchEffect };