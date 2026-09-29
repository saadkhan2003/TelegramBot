'use client';

import React, { useState, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  Heading,
  Square,
  ListOrdered,
  List,
  Minus,
  MoveVertical,
  Info,
  Columns,
  Grid3X3,
  Eye,
  Layers,
  Image as ImageIcon,
  Quote,
  AlertTriangle,
  HelpCircle,
  Share2,
} from 'lucide-react';
import { BotComponent } from '../../lib/botBuilderTypes';
import TelegramPreview from './TelegramPreview';

interface CanvasProps {
  components: BotComponent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (sourceIndex: number, destIndex: number) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  storeName?: string;
}

function getComponentIcon(type: BotComponent['type'], isBold?: boolean) {
  if (type === 'text') {
    return isBold ? <Heading className="h-3.5 w-3.5 text-[#0078d4]" /> : <Type className="h-3.5 w-3.5 text-[#605e5c]" />;
  }
  if (type === 'image') return <ImageIcon className="h-3.5 w-3.5 text-[#8764b8]" />;
  if (type === 'quote') return <Quote className="h-3.5 w-3.5 text-[#5288c1]" />;
  if (type === 'field') return <Square className="h-3.5 w-3.5 text-[#107c41]" />;
  if (type === 'info_box') return <Info className="h-3.5 w-3.5 text-[#005a9e]" />;
  if (type === 'alert_banner') return <AlertTriangle className="h-3.5 w-3.5 text-[#d83b01]" />;
  if (type === 'faq_item') return <HelpCircle className="h-3.5 w-3.5 text-[#0078d4]" />;
  if (type === 'social_links') return <Share2 className="h-3.5 w-3.5 text-[#107c41]" />;
  if (type === 'numbered_list') return <ListOrdered className="h-3.5 w-3.5 text-[#8764b8]" />;
  if (type === 'bullet_list') return <List className="h-3.5 w-3.5 text-[#8764b8]" />;
  if (type === 'divider') return <Minus className="h-3.5 w-3.5 text-[#8a8886]" />;
  if (type === 'spacer') return <MoveVertical className="h-3.5 w-3.5 text-[#a19f9d]" />;
  if (type === 'button') return <Square className="h-3.5 w-3.5 text-[#d83b01]" />;
  if (type === 'button_row') return <Columns className="h-3.5 w-3.5 text-[#d83b01]" />;
  if (type === 'button_grid') return <Grid3X3 className="h-3.5 w-3.5 text-[#d83b01]" />;
  return <Layers className="h-3.5 w-3.5 text-[#605e5c]" />;
}

function renderComponentPreview(comp: BotComponent) {
  switch (comp.type) {
    case 'text':
      return (
        <div className="text-xs text-[#323130] truncate max-w-[280px] sm:max-w-md font-sans">
          {comp.bold ? <strong className="font-semibold">{comp.content || '(empty header)'}</strong> : comp.content || '(empty text)'}
        </div>
      );
    case 'image':
      return (
        <div className="text-xs text-[#323130] flex items-center gap-1.5 truncate">
          <span className="font-semibold text-[#8764b8]">Photo Banner:</span>
          <span className="text-[#605e5c] truncate text-[11px]">{comp.caption || comp.imageUrl || 'Image'}</span>
        </div>
      );
    case 'quote':
      return (
        <div className="text-xs text-[#5288c1] italic truncate">
          &ldquo;{comp.content || 'Quote'}&rdquo; {comp.author ? `— ${comp.author}` : ''}
        </div>
      );
    case 'field':
      return (
        <div className="text-xs text-[#323130] flex items-center gap-1.5 truncate">
          <span>{comp.emoji || '📌'}</span>
          <span className="font-semibold text-[#605e5c]">{comp.label || 'Field'}:</span>
          <span className="font-mono text-[#0078d4] text-[11px] truncate">{comp.value || '{value}'}</span>
        </div>
      );
    case 'bullet_list':
      return (
        <div className="text-xs text-[#605e5c] truncate">
          <span className="font-semibold">{comp.items?.length || 0} bullets: </span>
          <span className="italic">{comp.items?.[0] || 'No items'}...</span>
        </div>
      );
    case 'numbered_list':
      return (
        <div className="text-xs text-[#605e5c] truncate">
          <span className="font-semibold">{comp.items?.length || 0} steps: </span>
          <span className="italic">{comp.items?.[0] || 'No items'}...</span>
        </div>
      );
    case 'info_box':
      return (
        <div className="text-xs text-[#323130] truncate">
          <span className="font-semibold text-[#005a9e]">{comp.header || 'Info'}: </span>
          <span className="text-[#605e5c] truncate">{comp.body || 'Callout text'}</span>
        </div>
      );
    case 'alert_banner':
      return (
        <div className="text-xs text-[#d83b01] truncate flex items-center gap-1">
          <span className="font-bold">[{comp.alertVariant || 'info'} alert]:</span>
          <span className="text-[#323130] truncate">{comp.header || 'Notice'}</span>
        </div>
      );
    case 'faq_item':
      return (
        <div className="text-xs text-[#323130] truncate">
          <span className="font-bold text-[#0078d4]">Q: {comp.question || 'FAQ'}: </span>
          <span className="text-[#605e5c] truncate">{comp.answer || ''}</span>
        </div>
      );
    case 'social_links':
      return (
        <div className="text-xs text-[#107c41] truncate font-medium">
          🌐 {comp.links?.length || 0} Social / Channel link(s)
        </div>
      );
    case 'divider':
      return <div className="text-[11px] text-[#8a8886] italic tracking-wide">── Horizontal Line Separator ──</div>;
    case 'spacer':
      return <div className="text-[11px] text-[#a19f9d] italic">↕ Vertical Spacing (Empty Line)</div>;
    case 'button': {
      const typeLabel = comp.buttonType === 'url' ? '↗ URL' : comp.buttonType === 'web_app' ? '⚡ WebApp' : comp.buttonType === 'screen' ? '➔ Screen' : '⚡ Action';
      return (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#f3f2f1] text-[#323130] text-[11px] rounded border border-[#d2d0ce] font-medium">
            {comp.label || 'Button'}
          </span>
          <span className="text-[10px] text-[#8a8886] font-mono">{typeLabel}</span>
        </div>
      );
    }
    case 'button_row':
      return (
        <div className="flex items-center gap-1.5 overflow-hidden">
          {comp.buttons?.map((b) => (
            <span
              key={b.id}
              className="px-2 py-0.5 bg-[#f3f2f1] text-[#323130] text-[10px] rounded border border-[#d2d0ce] font-medium truncate max-w-[120px]"
            >
              {b.label}
            </span>
          ))}
        </div>
      );
    case 'button_grid':
      return (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[11px] font-semibold text-[#605e5c] mr-1">
            Keyboard ({comp.buttons?.length || 0} buttons):
          </span>
          {comp.buttons?.slice(0, 3).map((b) => (
            <span
              key={b.id}
              className="px-1.5 py-0.5 bg-[#f3f2f1] text-[#323130] text-[10px] rounded border border-[#d2d0ce] truncate max-w-[100px]"
            >
              {b.label}
            </span>
          ))}
          {(comp.buttons?.length || 0) > 3 && (
            <span className="text-[10px] text-[#8a8886]">+{comp.buttons!.length - 3} more</span>
          )}
        </div>
      );
    default:
      return <div className="text-xs text-[#605e5c]">{comp.type}</div>;
  }
}

export default function Canvas({
  components,
  selectedId,
  onSelect,
  onReorder,
  onDelete,
  onMoveUp,
  onMoveDown,
  storeName,
}: CanvasProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'structure' | 'preview'>('split');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    onReorder(result.source.index, result.destination.index);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#faf9f8] overflow-hidden min-w-0">
      {/* Canvas Sub-Header with View Mode Tabs */}
      <div className="bg-white border-b border-[#edebe9] px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#323130]">Message Canvas</span>
          <span className="text-[11px] px-2 py-0.5 bg-[#f3f2f1] text-[#605e5c] rounded-full font-medium">
            {components.length} {components.length === 1 ? 'component' : 'components'}
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-[#f3f2f1] p-0.5 rounded-[4px] border border-[#edebe9]">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 text-xs font-medium rounded-[3px] transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'split' ? 'bg-white text-[#0078d4] shadow-xs' : 'text-[#605e5c] hover:text-[#323130]'
            }`}
          >
            <Columns className="h-3 w-3" />
            <span className="hidden sm:inline">Split View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('structure')}
            className={`px-2.5 py-1 text-xs font-medium rounded-[3px] transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'structure' ? 'bg-white text-[#0078d4] shadow-xs' : 'text-[#605e5c] hover:text-[#323130]'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Structure</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 text-xs font-medium rounded-[3px] transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'preview' ? 'bg-white text-[#0078d4] shadow-xs' : 'text-[#605e5c] hover:text-[#323130]'
            }`}
          >
            <Eye className="h-3 w-3" />
            <span>Live Telegram</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Half: Structure / Reorder List */}
        {(viewMode === 'split' || viewMode === 'structure') && (
          <div
            className={`h-full overflow-y-auto p-4 flex flex-col ${
              viewMode === 'split' ? 'w-full lg:w-1/2 border-r border-[#edebe9]' : 'w-full max-w-2xl mx-auto'
            }`}
          >
            <div className="text-[11px] text-[#8a8886] mb-3 flex items-center justify-between">
              <span>Drag components by ⠿ handle to reorder, click to customize.</span>
            </div>

            {components.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#d2d0ce] rounded-lg p-8 text-center bg-white my-auto">
                <div className="w-10 h-10 rounded-full bg-[#f3f9fd] text-[#0078d4] flex items-center justify-center mb-3">
                  <Layers className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold text-[#323130]">No components yet</h4>
                <p className="text-xs text-[#8a8886] mt-1 max-w-xs">
                  Click any element in the left palette to start building your message layout.
                </p>
              </div>
            ) : isMounted ? (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="bot-canvas-droppable">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 pb-6 min-h-[150px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-[#f3f9fd]/50 rounded-lg p-1' : ''
                      }`}
                    >
                      {components.map((comp, index) => {
                        const isSelected = comp.id === selectedId;
                        return (
                          <Draggable key={comp.id} draggableId={comp.id} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                onClick={() => onSelect(comp.id)}
                                className={`group flex items-center gap-2.5 p-2.5 rounded-md border text-left transition cursor-pointer select-none bg-white ${
                                  isSelected
                                    ? 'border-[#0078d4] ring-2 ring-[#0078d4]/20 shadow-xs'
                                    : 'border-[#edebe9] hover:border-[#c7e0f4] hover:shadow-xs'
                                } ${dragSnapshot.isDragging ? 'shadow-lg border-[#0078d4] opacity-90' : ''}`}
                              >
                                {/* Drag Handle */}
                                <div
                                  {...dragProvided.dragHandleProps}
                                  className="text-[#a19f9d] group-hover:text-[#605e5c] cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[#f3f2f1]"
                                  title="Drag to reorder"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>

                                {/* Component Type Icon */}
                                <div
                                  className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                                    isSelected ? 'bg-[#eff6fc]' : 'bg-[#f3f2f1]'
                                  }`}
                                >
                                  {getComponentIcon(comp.type, comp.bold)}
                                </div>

                                {/* Preview Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[10px] font-bold text-[#8a8886] uppercase tracking-wider">
                                      {comp.type.replace('_', ' ')}
                                    </span>
                                  </div>
                                  {renderComponentPreview(comp)}
                                </div>

                                {/* Nudge Arrows & Delete Action */}
                                <div
                                  className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => onMoveUp(index)}
                                    className="p-1 rounded text-[#605e5c] hover:text-[#0078d4] hover:bg-[#f3f2f1] disabled:opacity-20 disabled:hover:bg-transparent"
                                    title="Move up"
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === components.length - 1}
                                    onClick={() => onMoveDown(index)}
                                    className="p-1 rounded text-[#605e5c] hover:text-[#0078d4] hover:bg-[#f3f2f1] disabled:opacity-20 disabled:hover:bg-transparent"
                                    title="Move down"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDelete(comp.id)}
                                    className="p-1 rounded text-[#a19f9d] hover:text-[#a80000] hover:bg-[#fdf3f2] transition ml-1"
                                    title="Delete component"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              /* Fallback static render before mount to prevent SSR hydration flicker */
              <div className="space-y-2">
                {components.map((comp) => (
                  <div
                    key={comp.id}
                    className="flex items-center gap-2 p-2.5 rounded-md border border-[#edebe9] bg-white"
                  >
                    <div className="w-6 h-6 rounded bg-[#f3f2f1] flex items-center justify-center shrink-0">
                      {getComponentIcon(comp.type, comp.bold)}
                    </div>
                    <div className="flex-1 min-w-0">{renderComponentPreview(comp)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right Half: Live Telegram Preview */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div
            className={`h-full overflow-y-auto p-4 flex flex-col items-center justify-start bg-[#17212b]/5 ${
              viewMode === 'split' ? 'w-full lg:w-1/2' : 'w-full'
            }`}
          >
            <div className="w-full max-w-sm sticky top-0">
              <div className="text-[11px] font-semibold text-[#605e5c] uppercase tracking-wider mb-2 text-center">
                Live Telegram Preview
              </div>
              <TelegramPreview components={components} storeName={storeName} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
