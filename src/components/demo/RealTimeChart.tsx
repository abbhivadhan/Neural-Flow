import React, { useRef, useEffect, useState } from 'react';

interface DataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

interface RealTimeChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  gradientColor?: string;
  maxPoints?: number;
  animate?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  yAxisLabel?: string;
  className?: string;
}

export const RealTimeChart: React.FC<RealTimeChartProps> = ({
  data,
  width = 400,
  height = 200,
  color = '#3B82F6',
  gradientColor = '#3B82F6',
  maxPoints = 50,
  animate = true,
  showGrid = true,
  showLabels = true,
  yAxisLabel,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [animatedData, setAnimatedData] = useState<DataPoint[]>([]);

  // Animate data points
  useEffect(() => {
    if (!animate) {
      setAnimatedData(data);
      return;
    }

    const targetData = data.slice(-maxPoints);
    let currentIndex = 0;

    const animatePoints = () => {
      if (currentIndex < targetData.length) {
        setAnimatedData(prev => {
          const newData = [...prev];
          if (currentIndex < targetData.length) {
            newData[currentIndex] = targetData[currentIndex];
          }
          return newData.slice(-maxPoints);
        });
        currentIndex++;
        animationRef.current = requestAnimationFrame(animatePoints);
      }
    };

    setAnimatedData(new Array(targetData.length).fill({ timestamp: 0, value: 0 }));
    animationRef.current = requestAnimationFrame(animatePoints);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, animate, maxPoints]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const chartData = animatedData.filter(d => d.value !== undefined);
    if (chartData.length < 2) return;

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Calculate bounds
    const minValue = Math.min(...chartData.map(d => d.value));
    const maxValue = Math.max(...chartData.map(d => d.value));
    const valueRange = maxValue - minValue || 1;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 4; i++) {
        const x = padding + (chartWidth / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }

    // Create gradient
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, `${gradientColor}80`);
    gradient.addColorStop(1, `${gradientColor}10`);

    // Draw area under curve
    ctx.beginPath();
    chartData.forEach((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, height - padding);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(padding + chartWidth, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    chartData.forEach((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw data points
    ctx.fillStyle = color;
    chartData.forEach((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    if (showLabels) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';

      // Y-axis labels
      for (let i = 0; i <= 4; i++) {
        const value = minValue + (valueRange / 4) * (4 - i);
        const y = padding + (chartHeight / 4) * i;
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(1), padding - 10, y + 4);
      }

      // Y-axis title
      if (yAxisLabel) {
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(yAxisLabel, 0, 0);
        ctx.restore();
      }
    }

    // Draw current value indicator
    if (chartData.length > 0) {
      const lastPoint = chartData[chartData.length - 1];
      const x = padding + chartWidth;
      const y = padding + chartHeight - ((lastPoint.value - minValue) / valueRange) * chartHeight;

      // Pulsing dot
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = `${color}40`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Current value label
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 10, y - 15, 60, 20);
      ctx.strokeStyle = color;
      ctx.strokeRect(x + 10, y - 15, 60, 20);
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(lastPoint.value.toFixed(1), x + 40, y - 2);
    }

  }, [animatedData, width, height, color, gradientColor, showGrid, showLabels, yAxisLabel]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="rounded-lg"
      />
    </div>
  );
};