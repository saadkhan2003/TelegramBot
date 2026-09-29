'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ArrowLeft,
  LayoutGrid,
  Sliders,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  GitFork,
  Zap,
  Flame,
  Activity,
  Hash,
  MessageSquare,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { fetchApi } from '../../lib/api';
import {
  DEFAULT_SCREENS,
  BotScreen,
  BotComponent,
  ScreenTriggers,
  uid,
} from '../../lib/botBuilderTypes';
import ComponentPalette from '../../components/bot-builder/ComponentPalette';
import Canvas from '../../components/bot-builder/Canvas';
import Inspector from '../../components/bot-builder/Inspector';
import FlowCanvas from '../../components/bot-builder/FlowCanvas';

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
  const [activeLeftTab, setActiveLeftTab] = useState<'elements' | 'inspector'>('elements');
  const { isSidebarCollapsed, toggleSidebarCollapse } = useNavigation();
  const [isStudioPanelCollapsed, setIsStudioPanelCollapsed] = useState<boolean>(false);

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Screen Switcher Dropdown State
  const [isScreenDropdownOpen, setIsScreenDropdownOpen] = useState(false);
  const [screenSearch, setScreenSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New Screen Modal State
  const [isNewScreenModalOpen, setIsNewScreenModalOpen] = useState(false);
  const [newScreenKey, setNewScreenKey] = useState('');
  const [newScreenLabel, setNewScreenLabel] = useState('');
  const [newScreenIcon, setNewScreenIcon] = useState('✨');
  const [newScreenCategory, setNewScreenCategory] = useState<BotScreen['category']>('custom');
  const [newScreenTemplate, setNewScreenTemplate] = useState('empty');

  // Templates Modal State
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  // Flow Canvas & Studio View Switcher State
  const [viewMode, setViewMode] = useState<'studio' | 'flow'>('studio');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);

  // Screen Triggers & Automation Modal State
  const [isTriggersModalOpen, setIsTriggersModalOpen] = useState(false);
  const [triggerKeywords, setTriggerKeywords] = useState('');
  const [triggerSlashCommands, setTriggerSlashCommands] = useState('');
  const [triggerEvent, setTriggerEvent] = useState<ScreenTriggers['event']>('none');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsScreenDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load existing saved screens from API
  useEffect(() => {
    async function loadScreens() {
      try {
        setIsLoading(true);
        const saved = await fetchApi<Record<string, { components: BotComponent[]; meta?: any; triggers?: ScreenTriggers }>>(
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

              const existingIdx = loadedScreens.findIndex((s) => s.key === key);
              const triggers = (val as any).triggers || val.meta?.triggers;
              if (existingIdx >= 0) {
                if (val.meta?.label) loadedScreens[existingIdx].label = val.meta.label;
                if (val.meta?.icon) loadedScreens[existingIdx].icon = val.meta.icon;
                if (triggers) loadedScreens[existingIdx].triggers = triggers;
              } else {
                loadedScreens.push({
                  key,
                  label: val.meta?.label || key.replace('_', ' '),
                  icon: val.meta?.icon || '📄',
                  description: val.meta?.description || 'Custom configured bot screen',
                  category: val.meta?.category || 'custom',
                  isCustom: true,
                  components: val.components,
                  triggers,
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

  // Sync triggers state whenever active screen changes
  useEffect(() => {
    if (activeScreen) {
      setTriggerKeywords((activeScreen.triggers?.keywords || []).join(', '));
      setTriggerSlashCommands((activeScreen.triggers?.slashCommands || []).join(', '));
      setTriggerEvent(activeScreen.triggers?.event || 'none');
    }
  }, [activeScreenKey, screensList]);

  // Filter screens in dropdown
  const filteredScreens = screensList.filter(
    (s) =>
      s.label.toLowerCase().includes(screenSearch.toLowerCase()) ||
      s.key.toLowerCase().includes(screenSearch.toLowerCase()),
  );

  // When a component is selected, auto-switch left tab to inspector
  const handleSelectComponent = (id: string) => {
    setSelectedComponentId(id);
    setActiveLeftTab('inspector');
  };

  // Save current active screen layout & triggers
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setStatusMessage(null);

      await fetchApi(`/admin/bot-screens/${activeScreenKey}`, {
        method: 'PUT',
        body: JSON.stringify({
          components: activeComponents,
          triggers: activeScreen.triggers,
          meta: {
            label: activeScreen.label,
            icon: activeScreen.icon,
            description: activeScreen.description,
            category: activeScreen.category,
            isCustom: activeScreen.isCustom,
            triggers: activeScreen.triggers,
          },
        }),
      });

      setIsDirty(false);
      setStatusMessage({
        type: 'success',
        text: `✓ Screen "${activeScreen.label}" published live to Telegram!`,
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

  // Save triggers from modal
  const handleSaveTriggers = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const keywords = triggerKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    const slashCommands = triggerSlashCommands
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s.startsWith('/') ? s : `/${s}`));

    const newTriggers: ScreenTriggers = {
      keywords,
      slashCommands,
      event: triggerEvent,
    };

    setScreensList((prev) =>
      prev.map((s) => (s.key === activeScreenKey ? { ...s, triggers: newTriggers } : s)),
    );
    setIsDirty(true);
    setIsTriggersModalOpen(false);
    setStatusMessage({
      type: 'success',
      text: `⚡ Triggers updated for "${activeScreen.label}"! Click "Save Layout" to publish.`,
    });
    setTimeout(() => setStatusMessage(null), 4000);
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

    setNewScreenKey('');
    setNewScreenLabel('');
    setNewScreenIcon('✨');
    setNewScreenTemplate('empty');

    setStatusMessage({
      type: 'success',
      text: `Created new screen "${newScreenObj.label}"! Click "Save Layout" to publish.`,
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

  // Apply a template to active screen
  const handleApplyTemplate = (templateKey: string) => {
    const t = DEFAULT_SCREENS.find((s) => s.key === templateKey);
    if (!t) return;
    if (
      window.confirm(
        `Load the "${t.label}" layout into "${activeScreen.label}"? This will replace current components.`,
      )
    ) {
      const cloned = JSON.parse(JSON.stringify(t.components));
      setScreensData((prev) => ({
        ...prev,
        [activeScreenKey]: cloned,
      }));
      setSelectedComponentId(null);
      setIsDirty(true);
      setIsTemplatesModalOpen(false);
      setStatusMessage({
        type: 'success',
        text: `Loaded "${t.label}" template. Click "Save Layout" to publish.`,
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
    setActiveLeftTab('inspector');
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
      setActiveLeftTab('elements');
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
    <div className="-m-3.5 sm:-m-6 lg:-m-8 h-[calc(100vh-4rem)] flex flex-col bg-[#f8f9fa] overflow-hidden select-none font-sans">
      {/* Elementor-Style Studio Top Bar */}
      <header className="bg-white border-b border-[#edebe9] px-4 py-2 flex items-center justify-between shrink-0 z-30 shadow-xs">
        {/* Left: Screen Selector Dropdown + Actions */}
        <div className="flex items-center gap-3">
          {/* Active Screen Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsScreenDropdownOpen(!isScreenDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-[#f3f2f1] hover:bg-[#edebe9] rounded-md font-semibold text-xs border border-[#d2d0ce] transition cursor-pointer shadow-xs"
            >
              <span className="text-base">{activeScreen.icon}</span>
              <span className="font-bold text-[#201f1e]">{activeScreen.label}</span>
              <span className="text-[10px] text-[#605e5c] font-mono bg-white px-1.5 py-0.5 rounded border border-[#edebe9] hidden sm:inline">
                {activeScreen.key}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[#605e5c] ml-1" />
            </button>

            {/* Dropdown Menu */}
            {isScreenDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-lg shadow-xl border border-[#edebe9] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Search */}
                <div className="px-3 pb-2 border-b border-[#edebe9]">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-[#8a8886] absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search screens..."
                      value={screenSearch}
                      onChange={(e) => setScreenSearch(e.target.value)}
                      className="w-full pl-8 pr-2 py-1 text-xs border border-[#d2d0ce] rounded bg-[#faf9f8] focus:outline-none focus:border-[#0078d4]"
                    />
                  </div>
                </div>

                {/* Screens List */}
                <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
                  {filteredScreens.map((s) => {
                    const isSelected = s.key === activeScreenKey;
                    return (
                      <div
                        key={s.key}
                        onClick={() => {
                          setActiveScreenKey(s.key);
                          setSelectedComponentId(null);
                          setIsScreenDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition text-xs ${
                          isSelected ? 'bg-[#eff6fc] text-[#0078d4] font-bold' : 'hover:bg-[#f3f2f1] text-[#201f1e]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span>{s.icon}</span>
                          <span className="truncate">{s.label}</span>
                          {s.isCustom && (
                            <span className="text-[9px] bg-[#f3f2f1] text-[#605e5c] px-1 rounded">custom</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#0078d4]" />}
                          {s.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteScreen(s);
                              }}
                              className="text-[#a19f9d] hover:text-[#a80000] p-1"
                              title="Delete screen"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dropdown Footer: + New Screen */}
                <div className="px-2 pt-1.5 border-t border-[#edebe9]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsScreenDropdownOpen(false);
                      setIsNewScreenModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#eff6fc] hover:bg-[#ddeeff] text-[#0078d4] rounded text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create New Screen</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Buttons */}
          <button
            type="button"
            onClick={() => setIsNewScreenModalOpen(true)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded bg-white hover:bg-[#f3f2f1] text-[#0078d4] border border-[#c7e0f4] text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Screen</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTemplatesModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-white hover:bg-[#f3f2f1] text-[#323130] border border-[#d2d0ce] text-xs font-medium transition cursor-pointer shadow-2xs"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#605e5c]" />
            <span>Templates</span>
          </button>

          {/* Toggle Main Navigation Sidebar */}
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-white hover:bg-[#f3f2f1] text-[#323130] border border-[#d2d0ce] text-xs font-medium transition cursor-pointer shadow-2xs"
            title={isSidebarCollapsed ? "Expand navigation sidebar (Ctrl+B)" : "Collapse navigation sidebar for maximum width (Ctrl+B)"}
          >
            {isSidebarCollapsed ? (
              <>
                <PanelLeftOpen className="h-3.5 w-3.5 text-[#0078d4]" />
                <span className="hidden md:inline font-bold text-[#0078d4]">Expand Menu</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="h-3.5 w-3.5 text-[#605e5c]" />
                <span className="hidden md:inline">Collapse Menu</span>
              </>
            )}
          </button>

          {/* Toggle Left Studio Tools Panel (Only in Studio mode) */}
          {viewMode === 'studio' && (
            <button
              type="button"
              onClick={() => setIsStudioPanelCollapsed((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium border transition cursor-pointer shadow-2xs ${
                isStudioPanelCollapsed
                  ? 'bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4] font-bold'
                  : 'bg-white hover:bg-[#f3f2f1] text-[#323130] border-[#d2d0ce]'
              }`}
              title={isStudioPanelCollapsed ? "Show Studio Elements & Tools panel" : "Hide Studio Tools to maximize preview canvas"}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isStudioPanelCollapsed ? 'Show Tools' : 'Hide Tools'}</span>
            </button>
          )}

          {/* View Mode Switcher: Studio Canvas vs ManyChat Flow Blueprint */}
          <div className="flex items-center bg-[#f3f2f1] p-0.5 rounded-md border border-[#d2d0ce] ml-1">
            <button
              type="button"
              onClick={() => setViewMode('studio')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition cursor-pointer ${
                viewMode === 'studio'
                  ? 'bg-white text-[#0078d4] shadow-xs'
                  : 'text-[#605e5c] hover:text-[#201f1e]'
              }`}
              title="Elementor-style 2-zone Canvas Studio"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flow')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded transition cursor-pointer ${
                viewMode === 'flow'
                  ? 'bg-white text-purple-600 shadow-xs'
                  : 'text-[#605e5c] hover:text-[#201f1e]'
              }`}
              title="ManyChat-style Visual Flow Blueprint"
            >
              <GitFork className="h-3.5 w-3.5 text-purple-600" />
              <span>Flow Graph</span>
            </button>
          </div>

          {/* Screen Triggers & Keywords Button */}
          <button
            type="button"
            onClick={() => {
              setTriggerKeywords((activeScreen.triggers?.keywords || []).join(', '));
              setTriggerSlashCommands((activeScreen.triggers?.slashCommands || []).join(', '));
              setTriggerEvent(activeScreen.triggers?.event || 'none');
              setIsTriggersModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white hover:bg-[#fff9e6] text-[#b25e00] border border-[#f9df99] text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Configure Keyword Triggers, Slash Commands, and Lifecycle Sequences"
          >
            <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
            <span className="hidden sm:inline">Triggers</span>
            {(activeScreen.triggers?.keywords?.length || 0) > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-mono font-bold">
                {activeScreen.triggers?.keywords?.length}
              </span>
            )}
          </button>

          {/* Button Click & CTR Heatmap Toggle */}
          <button
            type="button"
            onClick={() => setShowHeatmap((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-bold transition cursor-pointer border shadow-2xs ${
              showHeatmap
                ? 'bg-amber-500 text-black border-amber-600'
                : 'bg-white hover:bg-[#f3f2f1] text-[#323130] border-[#d2d0ce]'
            }`}
            title="Toggle live button click counts and CTR heatmaps"
          >
            <Flame className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Heatmap</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="hidden md:flex items-center gap-1.5 text-[11px] text-[#d83b01] font-semibold bg-[#fdf3f2] px-2.5 py-1 rounded border border-[#fad8d6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d83b01] animate-pulse" />
              Unsaved
            </span>
          )}

          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="px-2.5 py-1.5 rounded border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#323130] text-xs font-medium transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
            title="Reset to default preset"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#605e5c]" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
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

      {/* Screen Ribbon: Directly Visible Screens Across Top */}
      <div className="bg-[#f0f2f5] border-b border-[#e1dfdd] px-4 py-1.5 flex items-center gap-2 overflow-x-auto thin-scrollbar shrink-0">
        <div className="flex items-center gap-1 text-[11px] font-bold text-[#605e5c] uppercase tracking-wider shrink-0 mr-1">
          <Layers className="h-3.5 w-3.5 text-[#0078d4]" />
          <span>Screens:</span>
        </div>
        {screensList.map((s) => {
          const isSelected = s.key === activeScreenKey;
          const count = (screensData[s.key] || []).length;
          const hasTriggers = Boolean(s.triggers?.keywords?.length || s.triggers?.slashCommands?.length);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setActiveScreenKey(s.key);
                setSelectedComponentId(null);
              }}
              className={`group flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all shrink-0 cursor-pointer shadow-2xs ${
                isSelected
                  ? 'bg-[#0078d4] text-white font-bold shadow-xs'
                  : 'bg-white hover:bg-[#f3f2f1] text-[#201f1e] border border-[#d2d0ce]'
              }`}
            >
              <span className="text-sm">{s.icon}</span>
              <span className="font-medium">{s.label}</span>
              {hasTriggers && (
                <span className="text-amber-500 font-bold text-[11px]" title={`Triggers: ${s.triggers?.keywords?.join(', ')}`}>
                  ⚡
                </span>
              )}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? 'bg-white/25 text-white font-bold'
                    : 'bg-[#edebe9] text-[#605e5c]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setIsNewScreenModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-[#eff6fc] text-[#0078d4] border border-dashed border-[#0078d4]/40 hover:border-[#0078d4] text-xs font-semibold transition shrink-0 cursor-pointer"
        >
          <Plus className="h-3 w-3" />
          <span>Add Screen</span>
        </button>
      </div>

      {/* Notification banner */}
      {statusMessage && (
        <div
          className={`px-4 py-1.5 text-xs flex items-center justify-between shrink-0 transition-all ${
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

      {/* Main Workspace Mode: Flow Canvas (Blueprint) or 2-Zone Studio Canvas */}
      {viewMode === 'flow' ? (
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          <FlowCanvas
            screens={screensList}
            screensData={screensData}
            activeScreenKey={activeScreenKey}
            onSelectScreen={(key) => {
              setActiveScreenKey(key);
              setViewMode('studio');
            }}
            onNewScreen={() => setIsNewScreenModalOpen(true)}
            showHeatmap={showHeatmap}
          />
        </div>
      ) : (
        /* 2-Zone Spacious Studio (Elementor Architecture: Left Tool Panel + Spacious Workspace) */
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Floating Re-open Button when Left Studio Panel is collapsed */}
          {isStudioPanelCollapsed && (
            <button
              type="button"
              onClick={() => setIsStudioPanelCollapsed(false)}
              className="absolute left-3 top-3 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#eff6fc] text-[#0078d4] font-bold text-xs rounded-lg shadow-md border border-[#c7e0f4] cursor-pointer transition animate-in fade-in"
              title="Open elements & tools panel"
            >
              <PanelLeftOpen className="h-4 w-4" />
              <span>Show Elements &amp; Inspector</span>
            </button>
          )}

          {/* Zone 1: Unified Left Studio Panel holding Elements & Inspector */}
          <aside
            className={`bg-white border-r border-[#edebe9] flex flex-col h-full shrink-0 shadow-xs z-20 transition-all duration-300 ease-in-out ${
              isStudioPanelCollapsed
                ? 'w-0 opacity-0 pointer-events-none border-r-0 overflow-hidden'
                : 'w-80 sm:w-[340px] opacity-100'
            }`}
          >
            {/* Sub-tabs header: [+ Elements] vs [⚙ Edit Block] */}
            <div className="bg-[#faf9f8] border-b border-[#edebe9] p-1.5 flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveLeftTab('elements')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded transition cursor-pointer ${
                  activeLeftTab === 'elements'
                    ? 'bg-white text-[#0078d4] shadow-xs'
                    : 'text-[#605e5c] hover:text-[#201f1e]'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>+ Elements</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveLeftTab('inspector')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded transition cursor-pointer relative ${
                  activeLeftTab === 'inspector'
                    ? 'bg-white text-[#0078d4] shadow-xs'
                    : 'text-[#605e5c] hover:text-[#201f1e]'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>⚙ Edit Block</span>
                {selectedComponent && (
                  <span className="w-2 h-2 rounded-full bg-[#0078d4] absolute top-1 right-2" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsStudioPanelCollapsed(true)}
                className="p-1 rounded text-[#605e5c] hover:text-[#201f1e] hover:bg-[#edebe9] transition cursor-pointer ml-0.5"
                title="Collapse studio panel"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {activeLeftTab === 'elements' ? (
                <ComponentPalette onAdd={handleAddComponent} />
              ) : (
                <div className="h-full flex flex-col">
                  <div className="px-3 py-1.5 bg-[#eff6fc] border-b border-[#c7e0f4] flex items-center justify-between text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveLeftTab('elements')}
                      className="text-[#0078d4] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Back to Elements</span>
                    </button>
                    <span className="text-[10px] text-[#605e5c] font-medium">Click any block to switch</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Inspector
                      component={selectedComponent}
                      availableScreens={screensList.map((s) => ({ key: s.key, label: s.label, icon: s.icon }))}
                      onChange={handleUpdateComponent}
                      onDelete={() => selectedComponentId && handleDeleteComponent(selectedComponentId)}
                    />
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Zone 2: Spacious Main Workspace (Flex-1) */}
          <main className="flex-1 flex flex-col h-full bg-[#f0f2f5] overflow-hidden min-w-0">
            <Canvas
              components={activeComponents}
              selectedId={selectedComponentId}
              onSelect={handleSelectComponent}
              onReorder={handleReorder}
              onDelete={handleDeleteComponent}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              storeName="Delux Store"
            />
          </main>
        </div>
      )}

      {/* Create New Screen Modal */}
      {isNewScreenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#edebe9] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
                  Button jump code: <code className="bg-[#f3f2f1] px-1 rounded">screen_{newScreenKey || 'id'}</code>
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

      {/* Templates Library Modal */}
      {isTemplatesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-[#edebe9] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#edebe9] flex items-center justify-between bg-[#faf9f8]">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#0078d4]" />
                <div>
                  <h3 className="text-sm font-bold text-[#201f1e]">Industry Template Presets</h3>
                  <p className="text-[11px] text-[#605e5c]">Load professionally crafted layouts for any bot use case</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplatesModalOpen(false)}
                className="text-[#605e5c] hover:text-[#201f1e] p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {DEFAULT_SCREENS.map((preset) => (
                <div
                  key={preset.key}
                  className="border border-[#edebe9] hover:border-[#0078d4] rounded-lg p-3 bg-white hover:bg-[#f3f9fd] transition cursor-pointer flex flex-col justify-between group"
                  onClick={() => handleApplyTemplate(preset.key)}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{preset.icon}</span>
                      <h4 className="text-xs font-bold text-[#201f1e] group-hover:text-[#0078d4]">
                        {preset.label}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#605e5c] leading-relaxed line-clamp-2">
                      {preset.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#edebe9] flex items-center justify-between text-[10px] text-[#8a8886]">
                    <span>{preset.components.length} components</span>
                    <span className="text-[#0078d4] font-bold group-hover:underline">Apply Template →</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#faf9f8] border-t border-[#edebe9] flex justify-end">
              <button
                type="button"
                onClick={() => setIsTemplatesModalOpen(false)}
                className="px-4 py-1.5 text-xs text-[#605e5c] hover:bg-[#f3f2f1] rounded font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen Triggers & Automation Modal */}
      {isTriggersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-[#edebe9] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#edebe9] flex items-center justify-between bg-[#fffcf5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#201f1e] flex items-center gap-1.5">
                    <span>Screen Automation &amp; Triggers:</span>
                    <span className="text-[#0078d4]">{activeScreen.icon} {activeScreen.label}</span>
                  </h3>
                  <p className="text-[11px] text-[#605e5c]">
                    Trigger ID: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#edebe9]">{activeScreen.key}</code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTriggersModalOpen(false)}
                className="text-[#605e5c] hover:text-[#201f1e] p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTriggers} className="p-4 space-y-4">
              {/* 1. Intelligent Keyword Listeners */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#201f1e] flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-[#0078d4]" />
                    <span>Intelligent Keyword Listeners</span>
                  </label>
                  <span className="text-[10px] text-[#605e5c]">Auto-routes customer chat</span>
                </div>
                <p className="text-[11px] text-[#605e5c] mb-2 leading-relaxed">
                  When a customer types any of these words in Telegram, the bot immediately opens this screen.
                </p>
                <input
                  type="text"
                  placeholder="e.g. price, pricing, discount, quote, cost, help"
                  value={triggerKeywords}
                  onChange={(e) => setTriggerKeywords(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#d2d0ce] rounded-lg bg-[#faf9f8] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                />
                {/* Keyword quick suggestions */}
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#8a8886]">Suggestions:</span>
                  {['price', 'support', 'human', 'agent', 'discount', 'help', 'quote'].map((sug) => {
                    const currentList = triggerKeywords
                      .split(',')
                      .map((s) => s.trim().toLowerCase())
                      .filter(Boolean);
                    const isAdded = currentList.includes(sug);
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          if (isAdded) return;
                          setTriggerKeywords((prev) =>
                            prev ? `${prev.trim()}, ${sug}` : sug,
                          );
                        }}
                        disabled={isAdded}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                          isAdded
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default'
                            : 'bg-white hover:bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4]'
                        }`}
                      >
                        +{sug}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Slash Commands */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#201f1e] flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-purple-600" />
                    <span>Telegram Slash Commands</span>
                  </label>
                  <span className="text-[10px] text-[#605e5c]">Direct bot commands</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. /services, /pricing, /vip"
                  value={triggerSlashCommands}
                  onChange={(e) => setTriggerSlashCommands(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 border border-[#d2d0ce] rounded-lg bg-[#faf9f8] focus:bg-white focus:outline-none focus:border-purple-600"
                />
                <span className="text-[10px] text-[#8a8886] mt-1 block">
                  Commands listed with forward slash, separated by commas.
                </span>
              </div>

              {/* 3. Automated Lifecycle Sequences & Events */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#201f1e] flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span>Automated Lifecycle Event</span>
                  </label>
                  <span className="text-[10px] text-[#605e5c]">Automated drip &amp; triggers</span>
                </div>
                <select
                  value={triggerEvent || 'none'}
                  onChange={(e) => setTriggerEvent(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-[#d2d0ce] rounded-lg bg-[#faf9f8]"
                >
                  <option value="none">⚪ Standard Manual Navigation (Buttons only)</option>
                  <option value="first_deposit">🎉 First Deposit: Trigger onboarding &amp; VIP claim</option>
                  <option value="order_completed">📦 Order Completed: Post-purchase satisfaction review</option>
                  <option value="abandoned_cart">⏰ Abandoned Checkout: 30-min follow-up with 10% coupon</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#edebe9]">
                <button
                  type="button"
                  onClick={() => setIsTriggersModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-[#605e5c] hover:bg-[#f3f2f1] rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                  <span>Save Automation Triggers</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
