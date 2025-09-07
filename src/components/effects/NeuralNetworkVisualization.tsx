import React, { useEffect, useRef, useState } from 'react';

interface Neuron {
  x: number;
  y: number;
  activation: number;
  layer: number;
  index: number;
  pulsePhase: number;
}

interface Connection {
  from: Neuron;
  to: Neuron;
  weight: number;
  activity: number;
}

interface NeuralNetworkVisualizationProps {
  width?: number;
  height?: number;
  layers?: number[];
  className?: string;
  animated?: boolean;
  theme?: 'light' | 'dark';
}

export const NeuralNetworkVisualization: React.FC<NeuralNetworkVisualizationProps> = ({
  width = 600,
  height = 400,
  layers = [4, 6, 6, 3],
  className = '',
  animated = true,
  theme = 'dark'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const neuronsRef = useRef<Neuron[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const colors = {
    light: {
      neuron: '#3b82f6',
      connection: '#6b7280',
      active: '#10b981',
      background: '#f8fafc'
    },
    dark: {
      neuron: '#60a5fa',
      connection: '#4b5563',
      active: '#34d399',
      background: '#0f172a'
    }
  };

  const currentColors = colors[theme];

  // Initialize neural network structure
  const initializeNetwork = () => {
    const neurons: Neuron[] = [];
    const connections: Connection[] = [];

    // Create neurons
    layers.forEach((layerSize, layerIndex) => {
      const layerX = (width / (layers.length - 1)) * layerIndex;
      
      for (let i = 0; i < layerSize; i++) {
        const neuronY = (height / (layerSize + 1)) * (i + 1);
        
        neurons.push({
          x: layerX,
          y: neuronY,
          activation: Math.random(),
          layer: layerIndex,
          index: i,
          pulsePhase: Math.random() * Math.PI * 2
        });
      }
    });

    // Create connections between adjacent layers
    for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
      const currentLayerNeurons = neurons.filter(n => n.layer === layerIndex);
      const nextLayerNeurons = neurons.filter(n => n.layer === layerIndex + 1);

      currentLayerNeurons.forEach(fromNeuron => {
        nextLayerNeurons.forEach(toNeuron => {
          connections.push({
            from: fromNeuron,
            to: toNeuron,
            weight: (Math.random() - 0.5) * 2,
            activity: 0
          });
        });
      });
    }

    neuronsRef.current = neurons;
    connectionsRef.current = connections;
  };

  // Simulate neural network activity
  const updateNetwork = (time: number) => {
    // Update neuron activations with wave-like patterns
    neuronsRef.current.forEach((neuron, index) => {
      const baseActivation = 0.3 + 0.4 * Math.sin(time * 0.002 + neuron.pulsePhase);
      const layerOffset = neuron.layer * 0.5;
      neuron.activation = Math.max(0, Math.min(1, baseActivation + 0.2 * Math.sin(time * 0.003 + layerOffset)));
      
      // Update pulse phase for smooth animation
      neuron.pulsePhase += 0.02;
    });

    // Update connection activities based on neuron activations
    connectionsRef.current.forEach(connection => {
      const fromActivation = connection.from.activation;
      const weightedSignal = fromActivation * Math.abs(connection.weight);
      connection.activity = Math.max(0, Math.min(1, weightedSignal));
    });
  };

  // Render the neural network
  const render = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    connectionsRef.current.forEach(connection => {
      const opacity = animated ? connection.activity * 0.8 + 0.1 : 0.3;
      const lineWidth = animated ? 1 + connection.activity * 2 : 1;
      
      ctx.beginPath();
      ctx.moveTo(connection.from.x, connection.from.y);
      ctx.lineTo(connection.to.x, connection.to.y);
      
      // Color based on weight (positive = blue, negative = red)
      const color = connection.weight > 0 ? currentColors.neuron : '#ef4444';
      ctx.strokeStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Add flowing animation along connections
      if (animated && connection.activity > 0.5) {
        const progress = (time * 0.005) % 1;
        const x = connection.from.x + (connection.to.x - connection.from.x) * progress;
        const y = connection.from.y + (connection.to.y - connection.from.y) * progress;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = currentColors.active;
        ctx.fill();
      }
    });

    // Draw neurons
    neuronsRef.current.forEach(neuron => {
      const baseRadius = 8;
      const pulseRadius = animated ? baseRadius + neuron.activation * 4 : baseRadius;
      
      // Outer glow
      if (animated && neuron.activation > 0.6) {
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, pulseRadius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `${currentColors.active}20`;
        ctx.fill();
      }

      // Main neuron body
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, pulseRadius, 0, Math.PI * 2);
      
      // Create gradient based on activation
      const gradient = ctx.createRadialGradient(
        neuron.x, neuron.y, 0,
        neuron.x, neuron.y, pulseRadius
      );
      
      const activationColor = animated 
        ? `rgba(${neuron.activation > 0.7 ? '52, 211, 153' : '59, 130, 246'}, ${0.8 + neuron.activation * 0.2})`
        : currentColors.neuron;
      
      gradient.addColorStop(0, activationColor);
      gradient.addColorStop(1, `${currentColors.neuron}40`);
      
      ctx.fillStyle = gradient;
      ctx.fill();

      // Border
      ctx.strokeStyle = currentColors.neuron;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Activation indicator (small dot in center)
      if (animated && neuron.activation > 0.8) {
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });

    // Add layer labels
    layers.forEach((layerSize, layerIndex) => {
      const x = (width / (layers.length - 1)) * layerIndex;
      const y = height - 20;
      
      ctx.fillStyle = currentColors.neuron;
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Layer ${layerIndex + 1}`, x, y);
    });
  };

  // Animation loop
  const animate = (time: number) => {
    if (!isVisible) return;
    
    if (animated) {
      updateNetwork(time);
    }
    render(time);
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
      initializeNetwork();
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, animated]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg"
        style={{ 
          background: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)',
          backdropFilter: 'blur(10px)'
        }}
      />
      
      {/* Control overlay */}
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          onClick={() => initializeNetwork()}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default NeuralNetworkVisualization;