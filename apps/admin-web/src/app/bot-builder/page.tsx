'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Search,
  BookOpen,
  X,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import {
  DEFAULT_SCREENS,
  BotScreen,
  BotComponent,
  uid,
} from '../../lib/botBuilderTypes';
import ComponentPalette from '../../components/bot-builder/ComponentPalette';
import Canvas from '../../components/bot-builder/Canvas';
import Inspector from '../../components/bot-builder/Inspector';

export default function BotBuilderPage() {
  const [screensList, setScreensList] = useState<BotScreen[]>(() => DEFAULT_SCREENS);
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

  // New Screen Modal State
  const [isNewScreenModalOpen, setIsNewScreenModalOpen] = useState(false);
  const [newScreenKey, setNewScreenKey] = useState('');
  const [newScreenLabel, setNewScreenLabel] = useState('');
  const [newScreenIcon, setNewScreenIcon] = useState('✨');
  const [newScreenCategory, setNewScreenCategory] = useState<BotScreen['category']>('custom');
  const [newScreenTemplate, setNewScreenTemplate] = useState('empty');

  // Screen Search
  const [screenSearch, setScreenSearch] = useState('');

  // Load existing saved screens from API
  useEffect(() => {
    async function loadScreens() {
      try {
        setIsLoading(true);
        const saved = await fetchApi<Record<string, { components: BotComponent[]; meta?: any }>>(
          '/admin/bot-screens',
        );

        if (saved && typeof saved === 'object') {
          const loadedScreens: BotScreen[] = [...DEFAULT_SCREENS];
          const loadedData: Record<string, BotComponent[]> = {};

          DEFAULT_SCREENS.forEach((s) => {
            loadedData[s.key] = s.components;
          });

          Object.entries(saved).forEach(([key, val]) => {
            if (val && Array.isArray(val.components)) {
              loadedData[key] = val.components;

              // If it's a custom screen not in DEFAULT_SCREENS, add it to screensList
              const existingIdx = loadedScreens.findIndex((s) => s.key === key);
              if (existingIdx >= 0) {
                if (val.meta?.label) loadedScreens[existingIdx].label = val.meta.label;
                if (val.meta?.icon) loadedScreens[existingIdx].icon = val.meta.icon;
              } else {
                loadedScreens.push({
                  key,
                  label: val.meta?.label || key.replace('_', ' '),
                  icon: val.meta?.icon || '📄',
                  description: val.meta?.description || 'Custom configured bot screen',
                  category: val.meta?.category || 'custom',
                  isCustom: true,
                  components: val.components,
                });
              }
            }
          });

          setScreensList(loadedScreens);
          setScreensData(loadedData);
        }
      } catch (err: any) {
        console.error('Failed to load bot screens:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadScreens();
  }, []);

  const activeScreen = screensList.find((s) => s.key === activeScreenKey) || screensList[0];
  const activeComponents = screensData[activeScreenKey] || [];
  const selectedComponent =
    activeComponents.find((c) => c.id === selectedComponentId) || null;

  // Filtered screens for switcher
  const filteredScreens = screensList.filter(
    (s) =>
      s.label.toLowerCase().includes(screenSearch.toLowerCase()) ||
      s.key.toLowerCase().includes(screenSearch.toLowerCase()),
  );

  // Save current active screen layout
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setStatusMessage(null);

      await fetchApi(`/admin/bot-screens/${activeScreenKey}`, {
        method: 'PUT',
        body: JSON.stringify({
          components: activeComponents,
          meta: {
            label: activeScreen.label,
            icon: activeScreen.icon,
            description: activeScreen.description,
            category: activeScreen.category,
            isCustom: activeScreen.isCustom,
          },
        }),
      });

      setIsDirty(false);
      setStatusMessage({
        type: 'success',
        text: `✓ Screen "${activeScreen.label}" saved and live on Telegram!`,
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

  // Create new custom screen
  const handleCreateScreen = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = newScreenKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    if (!cleanKey) {
      alert('Please enter a valid screen ID');
      return;
    }

    if (screensList.some((s) => s.key === cleanKey)) {
      alert(`A screen with ID "${cleanKey}" already exists!`);
      return;
    }

    // Determine starting components
    let initialComps: BotComponent[] = [];
    if (newScreenTemplate !== 'empty') {
      const templateScreen = DEFAULT_SCREENS.find((s) => s.key === newScreenTemplate);
      if (templateScreen) {
        initialComps = JSON.parse(JSON.stringify(templateScreen.components));
      }
    } else {
      initialComps = [
        {
          id: uid(),
          type: 'text',
          content: `${newScreenIcon} ${newScreenLabel || cleanKey}`,
          bold: true,
        },
        {
          id: uid(),
          type: 'text',
          content: 'Add your custom content and interactive buttons here.',
        },
        { id: uid(), type: 'divider' },
        {
          id: uid(),
          type: 'button',
          label: '🏠 Main Menu',
          buttonType: 'callback',
          action: 'nav_main',
        },
      ];
    }

    const newScreenObj: BotScreen = {
      key: cleanKey,
      label: newScreenLabel.trim() || cleanKey,
      icon: newScreenIcon.trim() || '📄',
      description: 'Custom created bot screen',
      category: newScreenCategory || 'custom',
      isCustom: true,
      components: initialComps,
    };

    setScreensList((prev) => [...prev, newScreenObj]);
    setScreensData((prev) => ({ ...prev, [cleanKey]: initialComps }));
    setActiveScreenKey(cleanKey);
    setSelectedComponentId(null);
    setIsDirty(true);
    setIsNewScreenModalOpen(false);

    // Reset modal form
    setNewScreenKey('');
    setNewScreenLabel('');
    setNewScreenIcon('✨');
    setNewScreenTemplate('empty');

    setStatusMessage({
      type: 'success',
      text: `Created new screen "${newScreenObj.label}"! Click "Save Layout" to publish to Telegram.`,
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Delete custom screen
  const handleDeleteScreen = async (screenToDelete: BotScreen) => {
    if (!screenToDelete.isCustom) {
      alert('System preset screens cannot be deleted. You can reset them anytime.');
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to permanently delete the screen "${screenToDelete.label}" (${screenToDelete.key})?`,
      )
    ) {
      try {
        await fetchApi(`/admin/bot-screens/${screenToDelete.key}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('API screen deletion notice:', err);
      }

      setScreensList((prev) => prev.filter((s) => s.key !== screenToDelete.key));
      setScreensData((prev) => {
        const next = { ...prev };
        delete next[screenToDelete.key];
        return next;
      });

      if (activeScreenKey === screenToDelete.key) {
        setActiveScreenKey('welcome');
      }

      setStatusMessage({
        type: 'success',
        text: `Screen "${screenToDelete.label}" deleted.`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Reset active screen to default template
  const handleResetToDefault = () => {
    const def = DEFAULT_SCREENS.find((s) => s.key === activeScreenKey);
    if (!def) {
      alert('This is a custom screen without a default preset.');
      return;
    }

    if (
      window.confirm(
        `Reset "${activeScreen.label}" to original default template? All customizations will be reset.`,
      )
    ) {
      const cloned = JSON.parse(JSON.stringify(def.components));
      setScreensData((prev) => ({
        ...prev,
        [activeScreenKey]: cloned,
      }));
      setSelectedComponentId(null);
      setIsDirty(true);
      setStatusMessage({
        type: 'success',
        text: `Reset "${activeScreen.label}" to default template.`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
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
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-white overflow-hidden select-none">
      {/* Top Application Bar */}
      <header className="bg-white border-b border-[#edebe9] px-4 py-2.5 flex items-center justify-between shrink-0 z-10 shadow-xs">
        {/* Left: Brand + Screen Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-[#0078d4] to-[#2b88d8] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="hidden lg:block">
              <h1 className="text-sm font-bold text-[#201f1e] leading-none">Universal Bot Studio</h1>
              <p className="text-[11px] text-[#605e5c] leading-tight mt-0.5">
                Visual Flow & Message Builder for Telegram
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-[#edebe9] hidden sm:block" />

          {/* Screen Tabs with Horizontal Scroll & Search */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-xl scrollbar-none">
            {filteredScreens.map((screen) => {
              const isActive = screen.key === activeScreenKey;
              return (
                <div key={screen.key} className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveScreenKey(screen.key);
                      setSelectedComponentId(null);
                    }}
                    className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#0078d4] text-white shadow-xs'
                        : 'text-[#605e5c] hover:text-[#201f1e] hover:bg-[#f3f2f1] border border-transparent'
                    }`}
                  >
                    <span>{screen.icon}</span>
                    <span>{screen.label}</span>
                  </button>

                  {/* Delete button for custom screens */}
                  {screen.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScreen(screen);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#d83b01] text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                      title="Delete screen"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}

            {/* + Add New Screen Button */}
            <button
              type="button"
              onClick={() => setIsNewScreenModalOpen(true)}
              className="px-2.5 py-1.5 rounded-[4px] border border-dashed border-[#0078d4] text-[#0078d4] bg-[#eff6fc] hover:bg-[#ddeeff] text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 shadow-xs"
              title="Create a new custom bot screen"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Screen</span>
            </button>
          </div>
        </div>

        {/* Right: Actions (Status, Reset, Save) */}
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <span className="hidden xl:flex items-center gap-1 text-[11px] text-[#d83b01] font-semibold bg-[#fdf3f2] px-2.5 py-1 rounded border border-[#fad8d6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d83b01] animate-pulse" />
              Unsaved Changes
            </span>
          )}

          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="px-2.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#323130] text-xs font-medium transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Reset active screen to template"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#605e5c]" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Publishing...</span>
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
          <div className="flex items-center gap-2 font-medium">
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
            availableScreens={screensList.map((s) => ({ key: s.key, label: s.label, icon: s.icon }))}
            onChange={handleUpdateComponent}
            onDelete={() => selectedComponentId && handleDeleteComponent(selectedComponentId)}
          />
        </aside>
      </div>

      {/* Create New Screen Modal */}
      {isNewScreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-[#edebe9] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#edebe9] flex items-center justify-between bg-[#faf9f8]">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <div>
                  <h3 className="text-sm font-bold text-[#201f1e]">Create New Bot Screen</h3>
                  <p className="text-[11px] text-[#605e5c]">Add a custom page or flow for your Telegram bot</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewScreenModalOpen(false)}
                className="text-[#605e5c] hover:text-[#201f1e] p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateScreen} className="p-4 space-y-3.5">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-1">Emoji</label>
                  <input
                    type="text"
                    required
                    value={newScreenIcon}
                    onChange={(e) => setNewScreenIcon(e.target.value)}
                    className="w-full text-center text-lg p-1.5 border border-[#d2d0ce] rounded bg-[#faf9f8]"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-1">Screen Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Club or Pricing Tiers"
                    value={newScreenLabel}
                    onChange={(e) => {
                      setNewScreenLabel(e.target.value);
                      if (!newScreenKey) {
                        setNewScreenKey(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, '_')
                            .slice(0, 20),
                        );
                      }
                    }}
                    className="w-full text-xs p-2 border border-[#d2d0ce] rounded bg-[#faf9f8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-1">
                  Screen ID / Slug (Internal unique identifier)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. vip_club or pricing"
                  value={newScreenKey}
                  onChange={(e) => setNewScreenKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  className="w-full text-xs font-mono p-2 border border-[#d2d0ce] rounded bg-[#faf9f8]"
                />
                <span className="text-[10px] text-[#8a8886]">
                  Action code for buttons: <code className="bg-[#f3f2f1] px-1 rounded">screen_{newScreenKey || 'id'}</code>
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-1">Category</label>
                <select
                  value={newScreenCategory}
                  onChange={(e) => setNewScreenCategory(e.target.value as any)}
                  className="w-full text-xs p-2 border border-[#d2d0ce] rounded bg-[#faf9f8]"
                >
                  <option value="custom">✨ Custom User Screen</option>
                  <option value="agency">💼 Agency & Services</option>
                  <option value="saas">🚀 SaaS & Web App</option>
                  <option value="community">🌐 Community & Socials</option>
                  <option value="support">💬 Support & Knowledge Base</option>
                  <option value="store">🛍 Commerce & Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-1">Starting Template</label>
                <select
                  value={newScreenTemplate}
                  onChange={(e) => setNewScreenTemplate(e.target.value)}
                  className="w-full text-xs p-2 border border-[#d2d0ce] rounded bg-[#faf9f8]"
                >
                  <option value="empty">📄 Blank Slate (Header + Text + Back Button)</option>
                  <option value="services">💼 Agency Services & Pricing Preset</option>
                  <option value="web_app">⚡ Telegram Mini App Launcher Preset</option>
                  <option value="faq">❓ FAQ & Knowledge Base Preset</option>
                  <option value="community">🌐 Community & Social Channels Preset</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#edebe9]">
                <button
                  type="button"
                  onClick={() => setIsNewScreenModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#605e5c] hover:bg-[#f3f2f1] rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs font-bold rounded shadow-xs cursor-pointer"
                >
                  Create Screen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
