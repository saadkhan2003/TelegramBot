'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import {
  DEFAULT_SCREENS,
  BotScreen,
  BotComponent,
} from '../../lib/botBuilderTypes';
import ComponentPalette from '../../components/bot-builder/ComponentPalette';
import Canvas from '../../components/bot-builder/Canvas';
import Inspector from '../../components/bot-builder/Inspector';

export default function BotBuilderPage() {
  const [screensData, setScreensData] = useState<Record<string, BotComponent[]>>(() => {
    const initial: Record<string, BotComponent[]> = {};
    DEFAULT_SCREENS.forEach((s) => {
      initial[s.key] = s.components;
    });
    return initial;
  });

  const [activeScreenKey, setActiveScreenKey] = useState<string>('welcome');
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Load existing saved screens from API
  useEffect(() => {
    async function loadScreens() {
      try {
        setIsLoading(true);
        const saved = await fetchApi<Record<string, { components: BotComponent[] }>>(
          '/admin/bot-screens',
        );

        if (saved && typeof saved === 'object') {
          setScreensData((prev) => {
            const next = { ...prev };
            Object.entries(saved).forEach(([key, val]) => {
              if (val && Array.isArray(val.components)) {
                next[key] = val.components;
              }
            });
            return next;
          });
        }
      } catch (err: any) {
        console.error('Failed to load bot screens:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadScreens();
  }, []);

  const activeScreen = DEFAULT_SCREENS.find((s) => s.key === activeScreenKey) || DEFAULT_SCREENS[0];
  const activeComponents = screensData[activeScreenKey] || [];
  const selectedComponent =
    activeComponents.find((c) => c.id === selectedComponentId) || null;

  // Save current active screen layout
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setStatusMessage(null);

      await fetchApi(`/admin/bot-screens/${activeScreenKey}`, {
        method: 'PUT',
        body: JSON.stringify({ components: activeComponents }),
      });

      setIsDirty(false);
      setStatusMessage({
        type: 'success',
        text: `Saved "${activeScreen.label}" layout successfully! Bot will use this layout.`,
      });

      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to save screen:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save screen layout',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset active screen to default template
  const handleResetToDefault = () => {
    if (
      window.confirm(
        `Reset "${activeScreen.label}" to default template? Any unsaved edits will be replaced.`,
      )
    ) {
      const def = DEFAULT_SCREENS.find((s) => s.key === activeScreenKey);
      if (def) {
        const cloned = JSON.parse(JSON.stringify(def.components));
        setScreensData((prev) => ({
          ...prev,
          [activeScreenKey]: cloned,
        }));
        setSelectedComponentId(null);
        setIsDirty(true);
        setStatusMessage({
          type: 'success',
          text: `Reset "${activeScreen.label}" to default layout. Click "Save Changes" to publish.`,
        });
        setTimeout(() => setStatusMessage(null), 4000);
      }
    }
  };

  // Add component
  const handleAddComponent = (newComp: BotComponent) => {
    setScreensData((prev) => ({
      ...prev,
      [activeScreenKey]: [...(prev[activeScreenKey] || []), newComp],
    }));
    setSelectedComponentId(newComp.id);
    setIsDirty(true);
  };

  // Update component from Inspector
  const handleUpdateComponent = (updated: BotComponent) => {
    setScreensData((prev) => ({
      ...prev,
      [activeScreenKey]: (prev[activeScreenKey] || []).map((c) =>
        c.id === updated.id ? updated : c,
      ),
    }));
    setIsDirty(true);
  };

  // Delete component
  const handleDeleteComponent = (id: string) => {
    setScreensData((prev) => ({
      ...prev,
      [activeScreenKey]: (prev[activeScreenKey] || []).filter((c) => c.id !== id),
    }));
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
    setIsDirty(true);
  };

  // Reorder components via drag & drop
  const handleReorder = (sourceIndex: number, destIndex: number) => {
    setScreensData((prev) => {
      const list = [...(prev[activeScreenKey] || [])];
      const [moved] = list.splice(sourceIndex, 1);
      list.splice(destIndex, 0, moved);
      return {
        ...prev,
        [activeScreenKey]: list,
      };
    });
    setIsDirty(true);
  };

  // Move up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    handleReorder(index, index - 1);
  };

  // Move down
  const handleMoveDown = (index: number) => {
    const list = screensData[activeScreenKey] || [];
    if (index >= list.length - 1) return;
    handleReorder(index, index + 1);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-white overflow-hidden">
      {/* Top Application Bar */}
      <header className="bg-white border-b border-[#edebe9] px-4 py-2.5 flex items-center justify-between shrink-0 z-10 shadow-xs">
        {/* Left: Title + Screen Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-md bg-[#eff6fc] text-[#0078d4] flex items-center justify-center border border-[#c7e0f4]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-[#201f1e] leading-none">Bot Builder</h1>
              <p className="text-[11px] text-[#605e5c] leading-tight mt-0.5">
                Elementor-style Telegram Message Studio
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-[#edebe9] hidden md:block" />

          {/* Screen Switcher Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
            {DEFAULT_SCREENS.map((screen) => {
              const isActive = screen.key === activeScreenKey;
              return (
                <button
                  key={screen.key}
                  type="button"
                  onClick={() => {
                    setActiveScreenKey(screen.key);
                    setSelectedComponentId(null);
                  }}
                  className={`px-2.5 py-1.5 rounded-[4px] text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#0078d4] text-white shadow-xs'
                      : 'text-[#605e5c] hover:text-[#201f1e] hover:bg-[#f3f2f1]'
                  }`}
                >
                  <span>{screen.icon}</span>
                  <span className="hidden md:inline">{screen.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Actions (Status, Reset, Save) */}
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="hidden lg:flex items-center gap-1 text-[11px] text-[#d83b01] font-medium bg-[#fdf3f2] px-2 py-0.5 rounded border border-[#fad8d6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d83b01] animate-pulse" />
              Unsaved Changes
            </span>
          )}

          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="px-2.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#323130] text-xs font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Reset to default template"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#605e5c]" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Layout</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Notification banner if any */}
      {statusMessage && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between shrink-0 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-[#dff6dd] text-[#107c41] border-b border-[#a8e5a3]'
              : 'bg-[#fdf3f2] text-[#a80000] border-b border-[#fad8d6]'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3-Panel Elementor Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel: Component Palette */}
        <ComponentPalette onAdd={handleAddComponent} />

        {/* Center Panel: Interactive Drag-and-Drop Canvas & Telegram Live Preview */}
        <Canvas
          components={activeComponents}
          selectedId={selectedComponentId}
          onSelect={setSelectedComponentId}
          onReorder={handleReorder}
          onDelete={handleDeleteComponent}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          storeName="Delux Store"
        />

        {/* Right Panel: Inspector Properties Panel */}
        <aside className="w-72 sm:w-80 bg-white border-l border-[#edebe9] flex flex-col h-full shrink-0 shadow-xs">
          <Inspector
            component={selectedComponent}
            onChange={handleUpdateComponent}
            onDelete={() => selectedComponentId && handleDeleteComponent(selectedComponentId)}
          />
        </aside>
      </div>
    </div>
  );
}
