import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';

interface ProcessingNode {
  id: string;
  type: 'input' | 'processing' | 'output';
  label: string;
  x: number;
  y: number;
  active: boolean;
  progress: number;
}

interface DataFlow {
  from: string;
  to: string;
  progress: number;
  active: boolean;
}

export const AIProcessingVisualization: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [nodes, setNodes] = useState<ProcessingNode[]>([]);
  const [flows, setFlows] = useState<DataFlow[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize processing pipeline
  useEffect(() => {
    const initialNodes: ProcessingNode[] = [
      { id: 'input', type: 'input', label: 'User Input', x: 50, y: 200, active: false, progress: 0 },
      { id: 'nlp', type: 'processing', label: 'NLP Processing', x: 200, y: 150, active: false, progress: 0 },
      { id: 'context', type: 'processing', label: 'Context Analysis', x: 200, y: 250, active: false, progress: 0 },
      { id: 'prediction', type: 'processing', label: 'Task Prediction', x: 350, y: 120, active: false, progress: 0 },
      { id: 'generation', type: 'processing', label: 'Content Gen', x: 350, y: 200, active: false, progress: 0 },
      { id: 'optimization', type: 'processing', label: 'Optimization', x: 350, y: 280, active: false, progress: 0 },
      { id: 'output', type: 'output', label: 'AI Response', x: 500, y: 200, active: false, progress: 0 }
    ];

    const initialFlows: DataFlow[] = [
      { from: 'input', to: 'nlp', progress: 0, active: false },
      { from: 'input', to: 'context', progress: 0, active: false },
      { from: 'nlp', to: 'prediction', progress: 0, active: false },
      { from: 'nlp', to: 'generation', progress: 0, active: false },
      { from: 'context', to: 'generation', progress: 0, active: false },
      { from: 'context', to: 'optimization', progress: 0, active: false },
      { from: 'prediction', to: 'output', progress: 0, active: false },
      { from: 'generation', to: 'output', progress: 0, active: false },
      { from: 'optimization', to: 'output', progress: 0, active: false }
    ];

    setNodes(initialNodes);
    setFlows(initialFlows);
  }, []);

  const startProcessingAnimation = () => {
    setIsAnimating(true);
    
    // Reset all nodes and flows
    setNodes(prev => prev.map(node => ({ ...node, active: false, progress: 0 })));
    setFlows(prev => prev.map(flow => ({ ...flow, active: false, progress: 0 })));

    // Simulate processing pipeline
    setTimeout(() => activateNode('input'), 100);
    setTimeout(() => activateFlow('input', 'nlp'), 300);
    setTimeout(() => activateFlow('input', 'context'), 400);
    setTimeout(() => activateNode('nlp'), 600);
    setTimeout(() => activateNode('context'), 700);
    setTimeout(() => activateFlow('nlp', 'prediction'), 1000);
    setTimeout(() => activateFlow('nlp', 'generation'), 1100);
    setTimeout(() => activateFlow('context', 'generation'), 1200);
    setTimeout(() => activateFlow('context', 'optimization'), 1300);
    setTimeout(() => activateNode('prediction'), 1500);
    setTimeout(() => activateNode('generation'), 1600);
    setTimeout(() => activateNode('optimization'), 1700);
    setTimeout(() => activateFlow('prediction', 'output'), 2000);
    setTimeout(() => activateFlow('generation', 'output'), 2100);
    setTimeout(() => activateFlow('optimization', 'output'), 2200);
    setTimeout(() => activateNode('output'), 2500);
    setTimeout(() => setIsAnimating(false), 3000);
  };

  const activateNode = (nodeId: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, active: true, progress: 100 } : node
    ));
  };

  const activateFlow = (fromId: string, toId: string) => {
    setFlows(prev => prev.map(flow => 
      flow.from === fromId && flow.to === toId 
        ? { ...flow, active: true, progress: 100 } 
        : flow
    ));
  };

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      flows.forEach(flow => {
        const fromNode = nodes.find(n => n.id === flow.from);
        const toNode = nodes.find(n => n.id === flow.to);
        
        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x + 40, fromNode.y + 20);
          ctx.lineTo(toNode.x, toNode.y + 20);
          ctx.strokeStyle = flow.active ? '#3B82F6' : '#374151';
          ctx.lineWidth = flow.active ? 3 : 1;
          ctx.stroke();

          // Draw flow animation
          if (flow.active && flow.progress > 0) {
            const progress = (flow.progress / 100);
            const x = fromNode.x + 40 + (toNode.x - fromNode.x - 40) * progress;
            const y = fromNode.y + 20 + (toNode.y - fromNode.y) * progress;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#60A5FA';
            ctx.fill();
          }
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const color = node.type === 'input' ? '#10B981' : 
                     node.type === 'output' ? '#F59E0B' : '#8B5CF6';
        
        ctx.beginPath();
        ctx.roundRect(node.x, node.y, 80, 40, 8);
        ctx.fillStyle = node.active ? color : '#374151';
        ctx.fill();
        ctx.strokeStyle = node.active ? '#FFFFFF' : '#6B7280';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw progress bar
        if (node.progress > 0) {
          ctx.beginPath();
          ctx.roundRect(node.x + 5, node.y + 30, (70 * node.progress / 100), 5, 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        }

        // Draw label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x + 40, node.y + 18);
      });
    };

    draw();
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, flows]);

  return (
    <Card className="bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">AI Processing Pipeline</h3>
          <button
            onClick={startProcessingAnimation}
            disabled={isAnimating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            {isAnimating ? 'Processing...' : 'Start Demo'}
          </button>
        </div>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full h-64 bg-slate-100 dark:bg-slate-900/50 rounded-lg"
          />
          
          {/* Processing Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-green-600 dark:text-green-400 font-bold">Input Layer</div>
              <div className="text-slate-600 dark:text-slate-400">Voice, Text, Gesture</div>
            </div>
            <div className="text-center">
              <div className="text-purple-600 dark:text-purple-400 font-bold">Processing</div>
              <div className="text-slate-600 dark:text-slate-400">NLP, Context, ML Models</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-600 dark:text-yellow-400 font-bold">Output</div>
              <div className="text-slate-600 dark:text-slate-400">Predictions, Content, Actions</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};