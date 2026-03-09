'use client';

import { useEffect, useRef, useState } from 'react';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  color: string;
  type: 'center' | 'dex' | 'wallet' | 'exchange';
  volume?: number;
}

interface Edge {
  from: string;
  to: string;
  value: number;
  color: string;
}

interface BubbleMapProps {
  tokenSymbol?: string;
  tokenAddress?: string;
  chain?: string;
}

function generateNodes(symbol: string): { nodes: Node[]; edges: Edge[] } {
  const center: Node = {
    id: 'center',
    label: symbol,
    x: 300, y: 220,
    r: 32,
    color: '#9945FF',
    type: 'center',
  };

  const dexes = [
    { id: 'raydium', label: 'Raydium', x: 160, y: 120, r: 20, color: '#00C874', volume: 2.4e6 },
    { id: 'jupiter', label: 'Jupiter', x: 440, y: 100, r: 18, color: '#00E5FF', volume: 1.8e6 },
    { id: 'orca',    label: 'Orca',    x: 500, y: 260, r: 15, color: '#FF6B35', volume: 900_000 },
    { id: 'pumpfun', label: 'Pump',    x: 420, y: 360, r: 14, color: '#FF3A80', volume: 650_000 },
    { id: 'meteora', label: 'Meteora', x: 180, y: 340, r: 12, color: '#FFD23F', volume: 400_000 },
    { id: 'mango',   label: 'Mango',   x: 80,  y: 220, r: 11, color: '#8C8DFC', volume: 280_000 },
  ];

  const wallets = [
    { id: 'w1', label: 'Whale 1', x: 80,  y: 80,  r: 8, color: '#00E5FF80' },
    { id: 'w2', label: 'MM',      x: 520, y: 160, r: 7, color: '#00E5FF80' },
    { id: 'w3', label: 'Smart',   x: 560, y: 340, r: 9, color: '#00C87480' },
    { id: 'w4', label: 'Bot',     x: 200, y: 400, r: 6, color: '#FF6B3580' },
    { id: 'w5', label: 'Whale 2', x: 100, y: 360, r: 8, color: '#FFD23F80' },
  ];

  const nodes: Node[] = [
    center,
    ...dexes.map(d => ({ ...d, type: 'dex' as const })),
    ...wallets.map(w => ({ ...w, type: 'wallet' as const })),
  ];

  const edges: Edge[] = [
    ...dexes.map(d => ({
      from: 'center', to: d.id,
      value: d.volume ?? 0,
      color: d.color + '50',
    })),
    { from: 'w1', to: 'raydium', value: 500_000, color: '#00E5FF30' },
    { from: 'w2', to: 'jupiter', value: 300_000, color: '#00E5FF30' },
    { from: 'w3', to: 'orca',    value: 280_000, color: '#00C87430' },
    { from: 'w4', to: 'pumpfun', value: 180_000, color: '#FF6B3530' },
    { from: 'w5', to: 'meteora', value: 120_000, color: '#FFD23F30' },
  ];

  return { nodes, edges };
}

function getNode(nodes: Node[], id: string): Node | undefined {
  return nodes.find(n => n.id === id);
}

function formatVol(v: number): string {
  if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v/1e3).toFixed(0)}K`;
  return `$${v}`;
}

export default function BubbleMap({ tokenSymbol = 'TOKEN', tokenAddress, chain }: BubbleMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [{ nodes, edges }] = useState(() => generateNodes(tokenSymbol));
  const animRef = useRef<number>(0);
  const tickRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function draw() {
      if (!canvas || !ctx) return;
      tickRef.current += 0.015;
      const t = tickRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid dots
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let x = 20; x < canvas.width; x += 40) {
        for (let y = 20; y < canvas.height; y += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw edges with animated particles
      edges.forEach((edge) => {
        const fromNode = getNode(nodes, edge.from);
        const toNode = getNode(nodes, edge.to);
        if (!fromNode || !toNode) return;

        // Line
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = edge.color;
        ctx.lineWidth = Math.max(0.5, Math.log10(edge.value / 1000) * 0.5);
        ctx.stroke();

        // Animated particle along edge
        const progress = (t * 0.4 + nodes.indexOf(fromNode) * 0.3) % 1;
        const px = fromNode.x + (toNode.x - fromNode.x) * progress;
        const py = fromNode.y + (toNode.y - fromNode.y) * progress;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = edge.color.replace('30', 'CC').replace('50', 'CC');
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach((node) => {
        const pulse = node.type === 'center' ? Math.sin(t * 2) * 3 : 0;
        const r = node.r + pulse;
        const isHovered = hoveredNode?.id === node.id;

        // Outer glow
        const grd = ctx.createRadialGradient(node.x, node.y, r * 0.3, node.x, node.y, r * 2.5);
        grd.addColorStop(0, node.color + '40');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Circle fill
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = node.color + (isHovered ? 'FF' : '30');
        ctx.fill();

        // Circle border
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = node.color + (isHovered ? 'FF' : '80');
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        // Label
        if (node.type === 'center' || node.type === 'dex' || isHovered) {
          ctx.fillStyle = isHovered ? '#FFFFFF' : node.color;
          ctx.font = `bold ${node.type === 'center' ? 11 : 9}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.label, node.x, node.y);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes, edges, hoveredNode]);

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const hit = nodes.find(n => {
      const dx = n.x - mx;
      const dy = n.y - my;
      return Math.sqrt(dx * dx + dy * dy) <= n.r + 6;
    });
    setHoveredNode(hit ?? null);
  }

  return (
    <div className="relative w-full bg-[#0A0E1A] rounded-xl overflow-hidden border border-white/8">
      <div className="px-4 py-3 border-b border-white/6 flex items-center justify-between">
        <div className="text-[13px] font-semibold text-white">Swap Flow Map</div>
        <div className="text-[11px] text-white/30">Live · Solana</div>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={440}
        className="w-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
      />
      {hoveredNode && (
        <div
          className="absolute pointer-events-none bg-[#12172A] border border-white/15 rounded-xl px-3 py-2 text-[12px] text-white shadow-xl"
          style={{ left: hoveredNode.x / 600 * 100 + '%', top: hoveredNode.y / 440 * 100 + '%', transform: 'translate(-50%, -120%)' }}
        >
          <div className="font-bold">{hoveredNode.label}</div>
          {hoveredNode.volume && <div className="text-white/50">{formatVol(hoveredNode.volume)} vol</div>}
          <div className="text-white/35 capitalize">{hoveredNode.type}</div>
        </div>
      )}
      {/* Legend */}
      <div className="px-4 py-2.5 border-t border-white/6 flex items-center gap-4 text-[11px] text-white/30">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#9945FF] inline-block" /> Token</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00C874] inline-block" /> DEX</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00E5FF] inline-block" /> Wallet</span>
        <span className="ml-auto">Streaming</span>
      </div>
    </div>
  );
}
