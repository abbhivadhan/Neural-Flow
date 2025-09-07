/**
 * Animation utilities for Neural Flow
 * Provides smooth transitions, easing functions, and animation helpers
 */

export type EasingFunction = (t: number) => number;

// Easing functions for smooth animations
export const easing = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOut: (t: number) => t * (2 - t),
  easeIn: (t: number) => t * t,
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
  elastic: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const p = 0.3;
    const s = p / 4;
    return -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
  }
};

// Animation frame utilities
export const animate = (
  duration: number,
  callback: (progress: number) => void,
  easingFn: EasingFunction = easing.easeInOut
): Promise<void> => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const frame = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      
      callback(easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    };
    
    requestAnimationFrame(frame);
  });
};

// Stagger animation utility
export const staggerAnimation = async (
  elements: HTMLElement[],
  animationFn: (element: HTMLElement, index: number) => Promise<void>,
  staggerDelay: number = 100
): Promise<void> => {
  const promises = elements.map((element, index) => 
    new Promise<void>((resolve) => {
      setTimeout(() => {
        animationFn(element, index).then(resolve);
      }, index * staggerDelay);
    })
  );
  
  await Promise.all(promises);
};

// Page transition utilities
export const pageTransitions = {
  fadeIn: (element: HTMLElement, duration: number = 300) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    
    return animate(duration, (progress) => {
      element.style.opacity = progress.toString();
      element.style.transform = `translateY(${20 * (1 - progress)}px)`;
    });
  },
  
  slideIn: (element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'up', duration: number = 400) => {
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    };
    
    element.style.transform = transforms[direction];
    element.style.opacity = '0';
    
    return animate(duration, (progress) => {
      const easedProgress = easing.easeOut(progress);
      element.style.opacity = progress.toString();
      
      switch (direction) {
        case 'left':
          element.style.transform = `translateX(${-100 * (1 - easedProgress)}%)`;
          break;
        case 'right':
          element.style.transform = `translateX(${100 * (1 - easedProgress)}%)`;
          break;
        case 'up':
          element.style.transform = `translateY(${-100 * (1 - easedProgress)}%)`;
          break;
        case 'down':
          element.style.transform = `translateY(${100 * (1 - easedProgress)}%)`;
          break;
      }
    });
  },
  
  scaleIn: (element: HTMLElement, duration: number = 300) => {
    element.style.transform = 'scale(0.8)';
    element.style.opacity = '0';
    
    return animate(duration, (progress) => {
      const easedProgress = easing.bounce(progress);
      element.style.opacity = progress.toString();
      element.style.transform = `scale(${0.8 + 0.2 * easedProgress})`;
    });
  }
};

// Micro-interaction utilities
export const microInteractions = {
  pulse: (element: HTMLElement, intensity: number = 1.05, duration: number = 200) => {
    return animate(duration, (progress) => {
      const scale = 1 + (intensity - 1) * Math.sin(progress * Math.PI);
      element.style.transform = `scale(${scale})`;
    });
  },
  
  shake: (element: HTMLElement, intensity: number = 5, duration: number = 300) => {
    return animate(duration, (progress) => {
      const shake = intensity * Math.sin(progress * Math.PI * 8) * (1 - progress);
      element.style.transform = `translateX(${shake}px)`;
    });
  },
  
  glow: (element: HTMLElement, color: string = '#3b82f6', duration: number = 400) => {
    return animate(duration, (progress) => {
      const intensity = Math.sin(progress * Math.PI);
      element.style.boxShadow = `0 0 ${20 * intensity}px ${color}40`;
    });
  },
  
  morphButton: (element: HTMLElement, duration: number = 200) => {
    return animate(duration, (progress) => {
      const easedProgress = easing.easeOut(progress);
      element.style.transform = `scale(${1 - 0.05 * easedProgress})`;
      element.style.filter = `brightness(${1 + 0.1 * easedProgress})`;
    });
  }
};