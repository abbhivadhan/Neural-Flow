import React, { useEffect, useRef, useState } from 'react';
import { pageTransitions } from '../../utils/animations';

interface PageTransitionProps {
  children: React.ReactNode;
  transitionKey: string;
  type?: 'fade' | 'slide' | 'scale' | 'neural';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  transitionKey,
  type = 'fade',
  direction = 'up',
  duration = 300,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentKey, setCurrentKey] = useState(transitionKey);

  useEffect(() => {
    if (transitionKey !== currentKey) {
      setIsTransitioning(true);
      
      const container = containerRef.current;
      if (!container) return;

      // Exit animation
      const exitAnimation = async () => {
        switch (type) {
          case 'fade':
            container.style.opacity = '0';
            container.style.transform = 'translateY(20px)';
            break;
          case 'slide':
            const exitTransforms = {
              left: 'translateX(-100%)',
              right: 'translateX(100%)',
              up: 'translateY(-100%)',
              down: 'translateY(100%)'
            };
            container.style.transform = exitTransforms[direction];
            container.style.opacity = '0';
            break;
          case 'scale':
            container.style.transform = 'scale(0.8)';
            container.style.opacity = '0';
            break;
          case 'neural':
            container.style.transform = 'scale(0.95) rotateX(10deg)';
            container.style.opacity = '0';
            container.style.filter = 'blur(5px)';
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, duration / 2));
      };

      // Enter animation
      const enterAnimation = async () => {
        setCurrentKey(transitionKey);
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        switch (type) {
          case 'fade':
            await pageTransitions.fadeIn(container, duration / 2);
            break;
          case 'slide':
            await pageTransitions.slideIn(container, direction, duration / 2);
            break;
          case 'scale':
            await pageTransitions.scaleIn(container, duration / 2);
            break;
          case 'neural':
            container.style.transform = 'scale(1) rotateX(0deg)';
            container.style.opacity = '1';
            container.style.filter = 'blur(0px)';
            break;
        }
        
        setIsTransitioning(false);
      };

      exitAnimation().then(enterAnimation);
    }
  }, [transitionKey, currentKey, type, direction, duration]);

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-${duration} ${className}`}
      style={{
        transitionProperty: 'opacity, transform, filter',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {children}
    </div>
  );
};

interface RouteTransitionProps {
  children: React.ReactNode;
  location: string;
  className?: string;
}

export const RouteTransition: React.FC<RouteTransitionProps> = ({
  children,
  location,
  className = ''
}) => {
  return (
    <PageTransition
      transitionKey={location}
      type="neural"
      duration={400}
      className={`min-h-screen ${className}`}
    >
      {children}
    </PageTransition>
  );
};

interface StaggeredEntranceProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  animationType?: 'fade' | 'slide' | 'scale';
  className?: string;
}

export const StaggeredEntrance: React.FC<StaggeredEntranceProps> = ({
  children,
  staggerDelay = 100,
  animationType = 'fade',
  className = ''
}) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const showItems = async () => {
      for (let i = 0; i < children.length; i++) {
        await new Promise(resolve => setTimeout(resolve, staggerDelay));
        setVisibleItems(prev => [...prev, i]);
      }
    };

    showItems();
  }, [children.length, staggerDelay]);

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={`transition-all duration-500 ${
            visibleItems.includes(index)
              ? 'opacity-100 translate-y-0 scale-100'
              : animationType === 'fade'
              ? 'opacity-0 translate-y-4'
              : animationType === 'slide'
              ? 'opacity-0 translate-x-8'
              : 'opacity-0 scale-95'
          }`}
          style={{
            transitionDelay: `${index * 50}ms`
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default { PageTransition, RouteTransition, StaggeredEntrance };