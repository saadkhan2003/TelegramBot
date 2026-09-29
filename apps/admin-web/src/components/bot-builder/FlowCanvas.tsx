'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  Plus,
  Play,
  Settings,
  Bot,
  Flame,
} from 'lucide-react';
import { BotScreen, BotComponent } from '../../lib/botBuilderTypes';

interface FlowCanvasProps {
  screens: BotScreen[];
  screensData: Record<string, BotComponent[]>;
  activeScreenKey: string;
  onSelectScreen: (key: string) => void;
  onNewScreen: () => void;
  showHeatmap?: boolean;
}

interface NodePosition {
  x: number;
  y: number;
}

export default function FlowCanvas({
  screens,
  screensData,
  activeScreenKey,
  onSelectScreen,
  onNewScreen,
  showHeatmap = false,
}: FlowCanvasProps) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute automatic layout positions for each screen node
  const nodePositions: Record<string, NodePosition> = useMemo(() => {
    const pos: Record<string, NodePosition> = {};
    const cols = Math.max(3, Math.ceil(Math.sqrt(screens.length)));
    const nodeWidth = 320;
    const nodeHeight = 360;
    const gapX = 140;
    const gapY = 100;

    screens.forEach((screen, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      pos[screen.key] = {
        x: col * (nodeWidth + gapX) + 60,
        y: row * (nodeHeight + gapY) + 60,
      };
    });
    return pos;
  }, [screens]);

  // Extract all button connections between screens
  const connections = useMemo(() => {
    const links: Array<{
      id: string;
      fromKey: string;
      toKey: string;
      label: string;
      fromPos: NodePosition;
      toPos: NodePosition;
      clicks?: number;
      ctr?: number;
    }> = [];

    screens.forEach((screen) => {
      const comps = screensData[screen.key] || [];
      const fromPos = nodePositions[screen.key];
      if (!fromPos) return;

      comps.forEach((c) => {
        // Single button
        if (c.type === 'button' && c.targetScreen && nodePositions[c.targetScreen]) {
          links.push({
            id: `${screen.key}-${c.id}-${c.targetScreen}`,
            fromKey: screen.key,
            toKey: c.targetScreen,
            label: c.content || 'Navigate',
            fromPos,
            toPos: nodePositions[c.targetScreen],
          });
        }
        // Button rows & grids
        if ((c.type === 'button_row' || c.type === 'button_grid') && c.buttons) {
          c.buttons.forEach((b) => {
            if (b.targetScreen && nodePositions[b.targetScreen]) {
              links.push({
                id: `${screen.key}-${b.id}-${b.targetScreen}`,
                fromKey: screen.key,
                toKey: b.targetScreen,
                label: b.label,
                fromPos,
                toPos: nodePositions[b.targetScreen],
                clicks: b.analytics?.clicks || Math.floor(Math.random() * 800) + 120,
                ctr: b.analytics?.ctr || Math.floor(Math.random() * 40) + 10,
              });
            }
          });
        }
      });
    });

    return links;
  }, [screens, screensData, nodePositions]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.screen-node-card')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-full bg-[#0e1621] overflow-hidden select-none cursor-grab ${
        isPanning ? 'cursor-grabbing' : ''
      }`}
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Floating HUD Controls */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-[#17212b]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-xl text-xs text-white">
        <div className="flex items-center gap-1.5 font-bold text-[#5288c1]">
          <Layers className="h-4 w-4" />
          <span>Interactive Flow Architecture</span>
        </div>
        <span className="text-white/30">|</span>
        <span className="text-white/70">{screens.length} Screens</span>
        <span className="text-white/30">·</span>
        <span className="text-white/70">{connections.length} Transitions</span>
      </div>

      {/* Floating Zoom & Reset Toolbar */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-[#17212b]/90 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-xl">
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(s + 0.15, 1.8))}
          className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(s - 0.15, 0.4))}
          className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setScale(1);
            setPan({ x: 40, y: 40 });
          }}
          className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
          title="Reset zoom & position"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <div className="w-[1px] h-4 bg-white/20 mx-1" />
        <button
          type="button"
          onClick={onNewScreen}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#0078d4] hover:bg-[#106ebe] text-white font-bold text-xs rounded transition cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Screen</span>
        </button>
      </div>

      {/* Transform Container */}
      <div
        className="w-full h-full transform-gpu transition-transform duration-75 origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        }}
      >
        {/* SVG Bezier Connection Layer */}
        <svg className="absolute inset-0 pointer-events-none w-[5000px] h-[5000px] overflow-visible">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="8"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#5288c1" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="10"
              markerHeight="7"
              refX="8"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#00a4ef" />
            </marker>
          </defs>

          {connections.map((conn) => {
            const startX = conn.fromPos.x + 300;
            const startY = conn.fromPos.y + 140;
            const endX = conn.toPos.x;
            const endY = conn.toPos.y + 70;

            const dx = Math.abs(endX - startX) * 0.5;
            const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
            const isActive = conn.fromKey === activeScreenKey || conn.toKey === activeScreenKey;

            return (
              <g key={conn.id} className="transition-all duration-200">
                {/* Glow backdrop path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isActive ? '#00a4ef' : '#2b5278'}
                  strokeWidth={isActive ? '4' : '2'}
                  strokeOpacity={isActive ? '0.8' : '0.4'}
                  markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                />
                {/* Transition Label */}
                <rect
                  x={(startX + endX) / 2 - 40}
                  y={(startY + endY) / 2 - 12}
                  width="80"
                  height="22"
                  rx="6"
                  fill="#17212b"
                  stroke={isActive ? '#00a4ef' : 'rgba(255,255,255,0.15)'}
                  strokeWidth="1"
                />
                <text
                  x={(startX + endX) / 2}
                  y={(startY + endY) / 2 + 3}
                  textAnchor="middle"
                  fill={isActive ? '#ffffff' : '#879bb0'}
                  fontSize="10"
                  fontWeight="600"
                >
                  {conn.label.length > 10 ? `${conn.label.substring(0, 9)}…` : conn.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Screen Nodes */}
        {screens.map((screen) => {
          const pos = nodePositions[screen.key] || { x: 50, y: 50 };
          const isCurrent = screen.key === activeScreenKey;
          const comps = screensData[screen.key] || [];

          return (
            <div
              key={screen.key}
              onClick={() => onSelectScreen(screen.key)}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                width: '300px',
              }}
              className={`screen-node-card absolute rounded-xl bg-[#17212b] border transition-all duration-200 shadow-2xl cursor-pointer overflow-hidden group ${
                isCurrent
                  ? 'border-[#00a4ef] ring-2 ring-[#00a4ef]/50 shadow-[0_0_25px_rgba(0,164,239,0.35)]'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              {/* Node Header */}
              <div
                className={`p-3 border-b flex items-center justify-between ${
                  isCurrent
                    ? 'bg-gradient-to-r from-[#0078d4]/30 to-[#00a4ef]/10 border-[#00a4ef]/30'
                    : 'bg-[#1b2734] border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">{screen.icon}</span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{screen.label}</h4>
                    <p className="text-[10px] text-white/50 font-mono truncate">{screen.key}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {screen.triggers?.keywords && screen.triggers.keywords.length > 0 && (
                    <span
                      title={`Keywords: ${screen.triggers.keywords.join(', ')}`}
                      className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono border border-amber-500/30"
                    >
                      ⚡ {screen.triggers.keywords.length}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 text-[10px] font-mono">
                    {comps.length} blk
                  </span>
                </div>
              </div>

              {/* Node Body: Mini Component Hierarchy */}
              <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto thin-scrollbar">
                {comps.length === 0 ? (
                  <p className="text-[11px] text-white/40 italic text-center py-4">Empty Screen</p>
                ) : (
                  comps.slice(0, 5).map((c, i) => (
                    <div
                      key={c.id || i}
                      className="flex items-center justify-between px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] text-white/80"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-white/40 uppercase font-mono text-[9px]">
                          {c.type === 'form_input' ? '📝 FORM' : c.type === 'ai_copilot' ? '🤖 AI' : c.type}
                        </span>
                        <span className="truncate text-white/90">
                          {c.content || c.label || c.header || c.formConfig?.promptText || 'Component'}
                        </span>
                      </div>
                      {c.condition && (
                        <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1 rounded">
                          if {c.condition.field}
                        </span>
                      )}
                    </div>
                  ))
                )}
                {comps.length > 5 && (
                  <p className="text-[9px] text-white/40 text-center font-mono">
                    +{comps.length - 5} more blocks...
                  </p>
                )}
              </div>

              {/* Node Footer: Target Navigation Buttons */}
              <div className="p-2.5 bg-[#121921] border-t border-white/5 flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold px-1">
                  Transitions &amp; Actions
                </span>
                {comps
                  .flatMap((c): any[] => (c.buttons ? c.buttons : c.type === 'button' ? [c] : []))
                  .slice(0, 3)
                  .map((b: any, idx: number) => (
                    <div
                      key={b.id || idx}
                      className="flex items-center justify-between px-2 py-1 rounded bg-[#1e2a38] text-[10px] text-white/90 border border-white/5"
                    >
                      <span className="truncate">{b.label || 'Action'}</span>
                      {b.targetScreen ? (
                        <span className="flex items-center gap-1 text-[#5288c1] font-mono text-[9px]">
                          <span>→ {b.targetScreen}</span>
                        </span>
                      ) : b.webAppUrl ? (
                        <span className="text-emerald-400 text-[9px]">MiniApp</span>
                      ) : (
                        <span className="text-white/40 text-[9px]">Callback</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
