'use client';

import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  X,
  ExternalLink,
  Zap,
  ArrowRight,
  CornerDownRight,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import {
  BotComponent,
  BotButton,
  ButtonType,
  BOT_ACTIONS,
  TEMPLATE_VARIABLES,
  VARIABLE_CATEGORIES,
  uid,
} from '../../lib/botBuilderTypes';

interface InspectorProps {
  component: BotComponent | null;
  availableScreens?: { key: string; label: string; icon: string }[];
  onChange: (updated: BotComponent) => void;
  onDelete: () => void;
}

const inputClass =
  'w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-2.5 py-1.5 text-xs text-[#1b1a19] focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] transition';

const labelClass = 'block text-[10px] font-bold text-[#605e5c] uppercase tracking-wide mb-1';

function CategorizedVarPicker({
  field,
  currentValue,
  onInsert,
}: {
  field: string;
  currentValue: string;
  onInsert: (newVal: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredVars = TEMPLATE_VARIABLES.filter((v) => {
    const matchesCategory = selectedCat === 'all' || v.category === selectedCat;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      v.key.toLowerCase().includes(q) ||
      v.desc.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleSelect = (key: string) => {
    onInsert((currentValue || '') + `{${key}}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1200);
  };

  const topPicks = ['username', 'firstName', 'balance', 'storeName', 'orderNumber', 'vps.ip', 'license.key'];

  return (
    <div className="mt-2.5 rounded-lg border border-[#e1dfdd] bg-[#fdfdfd] p-2.5 transition">
      {/* Header and Toggle */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#323130] uppercase tracking-wider">
          <Sparkles className="h-3 w-3 text-[#0078d4]" />
          <span>Dynamic Variables</span>
          <span className="text-[9px] font-semibold text-[#0078d4] bg-[#eff6fc] px-1.5 py-0.2 rounded-full border border-[#c7e0f4]">
            {TEMPLATE_VARIABLES.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[10px] font-semibold text-[#0078d4] hover:text-[#005a9e] flex items-center gap-1 transition cursor-pointer"
        >
          {isOpen ? (
            <>
              Collapse Library <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Explore All Categories <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      </div>

      {/* Quick Access Badges */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[9px] text-[#8a8886] font-medium mr-0.5">Quick:</span>
        {topPicks.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handleSelect(k)}
            title={`Insert {${k}}`}
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono border transition cursor-pointer flex items-center gap-1 ${
              copiedKey === k
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                : 'bg-white border-[#d2d0ce] text-[#201f1e] hover:bg-[#eff6fc] hover:border-[#0078d4] hover:text-[#0078d4]'
            }`}
          >
            {copiedKey === k ? <Check className="h-2.5 w-2.5 text-emerald-600" /> : null}
            <span>{`{${k}}`}</span>
          </button>
        ))}
      </div>

      {/* Expanded Categorized Library */}
      {isOpen && (
        <div className="mt-2.5 pt-2 border-t border-[#edebe9] space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[#8a8886] absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Search variables (e.g. btc, ram, ip, order)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#d2d0ce] rounded-[4px] pl-7 pr-2 py-1 text-xs text-[#201f1e] placeholder-[#a19f9d] focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] no-scrollbar">
            {VARIABLE_CATEGORIES.map((cat) => {
              const isSelected = selectedCat === cat.id;
              const count =
                cat.id === 'all'
                  ? TEMPLATE_VARIABLES.length
                  : TEMPLATE_VARIABLES.filter((v) => v.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-2 py-1 rounded-full shrink-0 font-medium transition cursor-pointer flex items-center gap-1 border ${
                    isSelected
                      ? 'bg-[#0078d4] border-[#0078d4] text-white shadow-2xs font-semibold'
                      : 'bg-white border-[#e1dfdd] text-[#605e5c] hover:bg-[#f3f2f1]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span
                    className={`text-[8px] px-1 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#edebe9] text-[#605e5c]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Variables List Card Container */}
          <div className="max-h-52 overflow-y-auto space-y-1 pr-1 divide-y divide-[#edebe9]">
            {filteredVars.length === 0 ? (
              <div className="text-[11px] text-[#8a8886] text-center py-4 italic">
                No variables found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredVars.map((v) => (
                <div
                  key={v.key}
                  onClick={() => handleSelect(v.key)}
                  className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 p-1.5 rounded hover:bg-[#eff6fc] transition cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-[#0078d4] group-hover:underline">
                        {`{${v.key}}`}
                      </span>
                      <span className="text-[9px] text-[#8a8886]">{v.categoryIcon}</span>
                    </div>
                    <div className="text-[10px] text-[#605e5c] truncate mt-0.5">
                      {v.desc}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <span
                      className="text-[9px] bg-[#f3f2f1] text-[#323130] px-1.5 py-0.5 rounded font-mono truncate max-w-[110px]"
                      title={`Example output: ${v.example}`}
                    >
                      {v.example}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded transition ${
                        copiedKey === v.key
                          ? 'bg-emerald-500 text-white'
                          : 'text-[#0078d4] bg-white border border-[#c7e0f4] group-hover:bg-[#0078d4] group-hover:text-white'
                      }`}
                    >
                      {copiedKey === v.key ? '✓ Added' : '+ Insert'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-[9px] text-[#8a8886] flex items-center justify-between px-1 pt-1 border-t border-[#edebe9]">
            <span>Showing {filteredVars.length} variables</span>
            <span className="text-[#0078d4]">Click any to insert</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Inspector({
  component,
  availableScreens = [],
  onChange,
  onDelete,
}: InspectorProps) {
  if (!component) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white select-none">
        <div className="w-12 h-12 rounded-full bg-[#f3f9fd] text-[#0078d4] flex items-center justify-center text-xl mb-3 shadow-xs">
          👆
        </div>
        <h4 className="text-xs font-bold text-[#323130] uppercase tracking-wider">Properties Inspector</h4>
        <p className="text-xs text-[#8a8886] mt-1 max-w-[200px]">
          Click any component on the canvas to configure its settings and content.
        </p>
      </div>
    );
  }

  const update = (patch: Partial<BotComponent>) => onChange({ ...component, ...patch });

  const VarChips = ({ field }: { field: keyof BotComponent }) => (
    <CategorizedVarPicker
      field={String(field)}
      currentValue={(component[field] as string) || ''}
      onInsert={(newVal) => update({ [field]: newVal } as any)}
    />
  );

  return (
    <div className="h-full overflow-y-auto flex flex-col bg-white">
      {/* Header */}
      <div className="p-3 border-b border-[#edebe9] flex items-center justify-between bg-[#faf9f8] shrink-0">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0078d4]">Editing Block</span>
          <h3 className="text-xs font-bold text-[#201f1e] capitalize">{component.type.replace('_', ' ')}</h3>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded text-[#a80000] hover:bg-[#fdf3f2] transition cursor-pointer flex items-center gap-1 text-[11px] font-medium"
          title="Delete component"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>

      {/* Settings Form Body */}
      <div className="p-3.5 space-y-4 flex-1">
        {/* TEXT */}
        {component.type === 'text' && (
          <>
            <div>
              <label className={labelClass}>Message Content</label>
              <textarea
                rows={4}
                className={inputClass}
                placeholder="Enter text message..."
                value={component.content || ''}
                onChange={(e) => update({ content: e.target.value })}
              />
              <VarChips field="content" />
            </div>

            <div className="space-y-1.5 pt-1 border-t border-[#edebe9]">
              <label className={labelClass}>Text Formatting</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-[#323130] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!component.bold}
                    onChange={(e) => update({ bold: e.target.checked })}
                    className="rounded border-[#d2d0ce] text-[#0078d4] focus:ring-[#0078d4]"
                  />
                  <span>Bold</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#323130] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!component.italic}
                    onChange={(e) => update({ italic: e.target.checked })}
                    className="rounded border-[#d2d0ce] text-[#0078d4] focus:ring-[#0078d4]"
                  />
                  <span>Italic</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#323130] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!component.mono}
                    onChange={(e) => update({ mono: e.target.checked })}
                    className="rounded border-[#d2d0ce] text-[#0078d4] focus:ring-[#0078d4]"
                  />
                  <span>Monospace</span>
                </label>
              </div>
            </div>
          </>
        )}

        {/* IMAGE / BANNER */}
        {component.type === 'image' && (
          <>
            <div>
              <label className={labelClass}>Image URL (HTTPS or Direct Link)</label>
              <input
                type="text"
                className={inputClass}
                placeholder="https://example.com/banner.jpg"
                value={component.imageUrl || ''}
                onChange={(e) => update({ imageUrl: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Image Caption (Optional)</label>
              <textarea
                rows={2}
                className={inputClass}
                placeholder="Caption text displayed below photo..."
                value={component.caption || ''}
                onChange={(e) => update({ caption: e.target.value })}
              />
              <VarChips field="caption" />
            </div>
          </>
        )}

        {/* QUOTE BLOCK */}
        {component.type === 'quote' && (
          <>
            <div>
              <label className={labelClass}>Quote Statement</label>
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Quote text..."
                value={component.content || ''}
                onChange={(e) => update({ content: e.target.value })}
              />
              <VarChips field="content" />
            </div>
            <div>
              <label className={labelClass}>Author / Source (Optional)</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. Delux Leadership Team"
                value={component.author || ''}
                onChange={(e) => update({ author: e.target.value })}
              />
            </div>
          </>
        )}

        {/* FIELD */}
        {component.type === 'field' && (
          <>
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <label className={labelClass}>Emoji</label>
                <input
                  type="text"
                  className={inputClass}
                  value={component.emoji || ''}
                  onChange={(e) => update({ emoji: e.target.value })}
                />
              </div>
              <div className="col-span-3">
                <label className={labelClass}>Field Label</label>
                <input
                  type="text"
                  className={inputClass}
                  value={component.label || ''}
                  onChange={(e) => update({ label: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Field Value</label>
              <input
                type="text"
                className={inputClass}
                value={component.value || ''}
                onChange={(e) => update({ value: e.target.value })}
              />
              <VarChips field="value" />
            </div>
          </>
        )}

        {/* LISTS (NUMBERED OR BULLET) */}
        {(component.type === 'numbered_list' || component.type === 'bullet_list') && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass}>List Items ({component.items?.length || 0})</label>
              <button
                type="button"
                onClick={() => update({ items: [...(component.items || []), 'New item'] })}
                className="text-[10px] text-[#0078d4] hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>
            <div className="space-y-1.5">
              {(component.items || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-[#8a8886] w-4 shrink-0 text-center">
                    {component.type === 'numbered_list' ? `${idx + 1}.` : '•'}
                  </span>
                  <input
                    type="text"
                    className={inputClass}
                    value={item}
                    onChange={(e) => {
                      const copy = [...(component.items || [])];
                      copy[idx] = e.target.value;
                      update({ items: copy });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const copy = (component.items || []).filter((_, i) => i !== idx);
                      update({ items: copy });
                    }}
                    className="text-[#a19f9d] hover:text-[#a80000] p-1 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALERT BANNER */}
        {component.type === 'alert_banner' && (
          <>
            <div>
              <label className={labelClass}>Alert Style / Variant</label>
              <select
                className={inputClass}
                value={component.alertVariant || 'info'}
                onChange={(e) => update({ alertVariant: e.target.value as any })}
              >
                <option value="info">ℹ️ Blue Info Notice</option>
                <option value="success">✅ Green Success / Special Offer</option>
                <option value="warning">⚠️ Amber Warning</option>
                <option value="danger">🚨 Red Critical / Urgent Notice</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Banner Title</label>
              <input
                type="text"
                className={inputClass}
                value={component.header || ''}
                onChange={(e) => update({ header: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Banner Body</label>
              <textarea
                rows={2}
                className={inputClass}
                value={component.body || ''}
                onChange={(e) => update({ body: e.target.value })}
              />
              <VarChips field="body" />
            </div>
          </>
        )}

        {/* INFO BOX */}
        {component.type === 'info_box' && (
          <>
            <div>
              <label className={labelClass}>Box Header</label>
              <input
                type="text"
                className={inputClass}
                value={component.header || ''}
                onChange={(e) => update({ header: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Box Body</label>
              <textarea
                rows={3}
                className={inputClass}
                value={component.body || ''}
                onChange={(e) => update({ body: e.target.value })}
              />
              <VarChips field="body" />
            </div>
          </>
        )}

        {/* FAQ ITEM */}
        {component.type === 'faq_item' && (
          <>
            <div>
              <label className={labelClass}>Question</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. How does warranty work?"
                value={component.question || ''}
                onChange={(e) => update({ question: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Answer</label>
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Explanation or policy details..."
                value={component.answer || ''}
                onChange={(e) => update({ answer: e.target.value })}
              />
              <VarChips field="answer" />
            </div>
          </>
        )}

        {/* SOCIAL LINKS */}
        {component.type === 'social_links' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass}>Social & Community Links</label>
              <button
                type="button"
                onClick={() =>
                  update({
                    links: [
                      ...(component.links || []),
                      { id: uid(), platform: 'Telegram', label: 'New Channel', url: 'https://t.me', emoji: '📢' },
                    ],
                  })
                }
                className="text-[10px] text-[#0078d4] hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Link
              </button>
            </div>
            <div className="space-y-2">
              {(component.links || []).map((link, idx) => (
                <div key={link.id} className="p-2 border border-[#edebe9] rounded bg-[#faf9f8] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#8a8886]">Link #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (component.links || []).filter((l) => l.id !== link.id);
                        update({ links: copy });
                      }}
                      className="text-[#a19f9d] hover:text-[#a80000]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <input
                      type="text"
                      className={`${inputClass} col-span-1`}
                      placeholder="Emoji"
                      value={link.emoji || ''}
                      onChange={(e) => {
                        const copy = [...(component.links || [])];
                        copy[idx] = { ...link, emoji: e.target.value };
                        update({ links: copy });
                      }}
                    />
                    <input
                      type="text"
                      className={`${inputClass} col-span-3`}
                      placeholder="Label (e.g. Channel)"
                      value={link.label || ''}
                      onChange={(e) => {
                        const copy = [...(component.links || [])];
                        copy[idx] = { ...link, label: e.target.value };
                        update({ links: copy });
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="https://..."
                    value={link.url || ''}
                    onChange={(e) => {
                      const copy = [...(component.links || [])];
                      copy[idx] = { ...link, url: e.target.value };
                      update({ links: copy });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SINGLE BUTTON */}
        {component.type === 'button' && (
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Button Label</label>
              <input
                type="text"
                className={inputClass}
                value={component.label || ''}
                onChange={(e) => update({ label: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Button Action Type</label>
              <select
                className={inputClass}
                value={component.buttonType || 'callback'}
                onChange={(e) => update({ buttonType: e.target.value as ButtonType })}
              >
                <option value="callback">⚡ Telegram Callback Action</option>
                <option value="screen">➔ Navigate to Custom Screen</option>
                <option value="url">↗ Open External Website URL</option>
                <option value="web_app">📱 Open Telegram Mini App (Web App)</option>
              </select>
            </div>

            {component.buttonType === 'screen' && (
              <div>
                <label className={labelClass}>Target Screen</label>
                <select
                  className={inputClass}
                  value={component.targetScreen || ''}
                  onChange={(e) => update({ targetScreen: e.target.value })}
                >
                  <option value="">Select target screen...</option>
                  {availableScreens.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.icon} {s.label} ({s.key})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {component.buttonType === 'url' && (
              <div>
                <label className={labelClass}>Destination URL (https://...)</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="https://yourwebsite.com"
                  value={component.url || ''}
                  onChange={(e) => update({ url: e.target.value })}
                />
              </div>
            )}

            {component.buttonType === 'web_app' && (
              <div>
                <label className={labelClass}>Mini App WebApp URL (https://...)</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="https://app.yourdomain.com"
                  value={component.webAppUrl || ''}
                  onChange={(e) => update({ webAppUrl: e.target.value })}
                />
              </div>
            )}

            {(component.buttonType === 'callback' || !component.buttonType) && (
              <div>
                <label className={labelClass}>Bot Action Trigger</label>
                <select
                  className={inputClass}
                  value={component.action || 'nav_main'}
                  onChange={(e) => update({ action: e.target.value })}
                >
                  {BOT_ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* BUTTON ROW & BUTTON GRID */}
        {(component.type === 'button_row' || component.type === 'button_grid') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Buttons ({component.buttons?.length || 0})</label>
              <button
                type="button"
                onClick={() =>
                  update({
                    buttons: [
                      ...(component.buttons || []),
                      { id: uid(), label: 'New Button', type: 'callback', action: 'nav_main' },
                    ],
                  })
                }
                className="text-[10px] text-[#0078d4] hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Button
              </button>
            </div>

            <div className="space-y-3">
              {(component.buttons || []).map((btn, idx) => (
                <div key={btn.id} className="p-2.5 border border-[#edebe9] rounded-md bg-[#faf9f8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#605e5c]">Button #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (component.buttons || []).filter((b) => b.id !== btn.id);
                        update({ buttons: copy });
                      }}
                      className="text-[#a19f9d] hover:text-[#a80000] cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className={labelClass}>Label</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={btn.label}
                      onChange={(e) => {
                        const copy = [...(component.buttons || [])];
                        copy[idx] = { ...btn, label: e.target.value };
                        update({ buttons: copy });
                      }}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Type</label>
                    <select
                      className={inputClass}
                      value={btn.type || 'callback'}
                      onChange={(e) => {
                        const copy = [...(component.buttons || [])];
                        copy[idx] = { ...btn, type: e.target.value as ButtonType };
                        update({ buttons: copy });
                      }}
                    >
                      <option value="callback">⚡ Telegram Callback</option>
                      <option value="screen">➔ Jump to Screen</option>
                      <option value="url">↗ External URL</option>
                      <option value="web_app">📱 Telegram Mini App</option>
                    </select>
                  </div>

                  {btn.type === 'screen' && (
                    <div>
                      <label className={labelClass}>Target Screen</label>
                      <select
                        className={inputClass}
                        value={btn.targetScreen || ''}
                        onChange={(e) => {
                          const copy = [...(component.buttons || [])];
                          copy[idx] = { ...btn, targetScreen: e.target.value };
                          update({ buttons: copy });
                        }}
                      >
                        <option value="">Select target screen...</option>
                        {availableScreens.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.icon} {s.label} ({s.key})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {btn.type === 'url' && (
                    <div>
                      <label className={labelClass}>Website URL</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="https://..."
                        value={btn.url || ''}
                        onChange={(e) => {
                          const copy = [...(component.buttons || [])];
                          copy[idx] = { ...btn, url: e.target.value };
                          update({ buttons: copy });
                        }}
                      />
                    </div>
                  )}

                  {btn.type === 'web_app' && (
                    <div>
                      <label className={labelClass}>Mini App WebApp URL</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="https://..."
                        value={btn.webAppUrl || ''}
                        onChange={(e) => {
                          const copy = [...(component.buttons || [])];
                          copy[idx] = { ...btn, webAppUrl: e.target.value };
                          update({ buttons: copy });
                        }}
                      />
                    </div>
                  )}

                  {(btn.type === 'callback' || !btn.type) && (
                    <div>
                      <label className={labelClass}>Action</label>
                      <select
                        className={inputClass}
                        value={btn.action || 'nav_main'}
                        onChange={(e) => {
                          const copy = [...(component.buttons || [])];
                          copy[idx] = { ...btn, action: e.target.value };
                          update({ buttons: copy });
                        }}
                      >
                        {BOT_ACTIONS.map((a) => (
                          <option key={a.value} value={a.value}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {component.type === 'button_grid' && (
                    <label className="flex items-center gap-1.5 text-xs text-[#605e5c] pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!btn.fullWidth}
                        onChange={(e) => {
                          const copy = [...(component.buttons || [])];
                          copy[idx] = { ...btn, fullWidth: e.target.checked };
                          update({ buttons: copy });
                        }}
                      />
                      <span>Full Width Button (Span 2 Columns)</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FORM INPUT */}
        {component.type === 'form_input' && (
          <div className="space-y-3">
            <div>
              <label className={labelClass}>User Prompt / Instruction</label>
              <textarea
                rows={3}
                className={inputClass}
                placeholder="Ask user for their email, screenshot or details..."
                value={component.formConfig?.promptText || ''}
                onChange={(e) =>
                  update({
                    formConfig: {
                      ...(component.formConfig || {
                        fieldType: 'text',
                        variableName: 'user_input',
                        actionOnSubmit: 'save_variable',
                      }),
                      promptText: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Expected Input Type</label>
                <select
                  className={inputClass}
                  value={component.formConfig?.fieldType || 'text'}
                  onChange={(e) =>
                    update({
                      formConfig: {
                        ...(component.formConfig || {
                          promptText: '',
                          variableName: 'user_input',
                          actionOnSubmit: 'save_variable',
                        }),
                        fieldType: e.target.value as any,
                      },
                    })
                  }
                >
                  <option value="text">Plain Text</option>
                  <option value="email">Email Address</option>
                  <option value="number">Number / Amount</option>
                  <option value="screenshot">Payment Screenshot / Photo</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Save Into Variable</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="variable_name"
                  value={component.formConfig?.variableName || ''}
                  onChange={(e) =>
                    update({
                      formConfig: {
                        ...(component.formConfig || {
                          promptText: '',
                          fieldType: 'text',
                          actionOnSubmit: 'save_variable',
                        }),
                        variableName: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Action on Submission</label>
              <select
                className={inputClass}
                value={component.formConfig?.actionOnSubmit || 'save_variable'}
                onChange={(e) =>
                  update({
                    formConfig: {
                      ...(component.formConfig || {
                        promptText: '',
                        fieldType: 'text',
                        variableName: 'user_input',
                      }),
                      actionOnSubmit: e.target.value as any,
                    },
                  })
                }
              >
                <option value="save_variable">Save to User Profile Variable</option>
                <option value="create_claim">Create Support Ticket / Claim</option>
                <option value="create_order">Create Custom Service Order</option>
                <option value="webhook">Trigger External Webhook</option>
              </select>
            </div>
          </div>
        )}

        {/* AI COPILOT */}
        {component.type === 'ai_copilot' && (
          <div className="space-y-3">
            <div>
              <label className={labelClass}>AI System Persona &amp; Instructions</label>
              <textarea
                rows={4}
                className={inputClass}
                placeholder="Give instructions to Gemini on how to answer user questions..."
                value={component.aiConfig?.instruction || ''}
                onChange={(e) =>
                  update({
                    aiConfig: {
                      ...(component.aiConfig || {}),
                      instruction: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className={labelClass}>Knowledge Base Context</label>
              <select
                className={inputClass}
                value={component.aiConfig?.knowledgeContext || 'catalog'}
                onChange={(e) =>
                  update({
                    aiConfig: {
                      ...(component.aiConfig || {}),
                      knowledgeContext: e.target.value as any,
                    },
                  })
                }
              >
                <option value="catalog">Store Products &amp; Catalog</option>
                <option value="faq">FAQ &amp; Store Policies</option>
                <option value="orders">Orders &amp; Warranty Guidelines</option>
                <option value="general">Full Sovereign Store Knowledge</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Human Support Handoff Button Label</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. 💬 Speak with Operator"
                value={component.aiConfig?.handoffButtonLabel || ''}
                onChange={(e) =>
                  update({
                    aiConfig: {
                      ...(component.aiConfig || {}),
                      handoffButtonLabel: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        )}

        {/* CAROUSEL SLIDER */}
        {component.type === 'carousel' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={labelClass}>Product Carousel Slides</label>
              <button
                type="button"
                onClick={() => {
                  const slides = component.carouselSlides || [];
                  update({
                    carouselSlides: [
                      ...slides,
                      {
                        id: uid(),
                        title: `Slide #${slides.length + 1}`,
                        description: 'Featured offering description.',
                        price: '$49',
                        buttonLabel: '⚡ Select Plan',
                      },
                    ],
                  });
                }}
                className="text-[10px] text-[#0078d4] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add Slide</span>
              </button>
            </div>

            <div className="space-y-2">
              {(component.carouselSlides || []).map((slide, idx) => (
                <div key={slide.id} className="p-2.5 bg-[#faf9f8] border border-[#edebe9] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#201f1e]">Slide {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (component.carouselSlides || []).filter((_, i) => i !== idx);
                        update({ carouselSlides: copy });
                      }}
                      className="text-red-500 hover:text-red-700 text-xs p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Slide Title"
                    value={slide.title}
                    onChange={(e) => {
                      const copy = [...(component.carouselSlides || [])];
                      copy[idx] = { ...slide, title: e.target.value };
                      update({ carouselSlides: copy });
                    }}
                  />
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Price (e.g. $29)"
                    value={slide.price || ''}
                    onChange={(e) => {
                      const copy = [...(component.carouselSlides || [])];
                      copy[idx] = { ...slide, price: e.target.value };
                      update({ carouselSlides: copy });
                    }}
                  />
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Button Label"
                    value={slide.buttonLabel || ''}
                    onChange={(e) => {
                      const copy = [...(component.carouselSlides || [])];
                      copy[idx] = { ...slide, buttonLabel: e.target.value };
                      update({ carouselSlides: copy });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIDEO NOTE & AUDIO */}
        {(component.type === 'video_note' || component.type === 'audio') && (
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Media Caption / Title</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Media description..."
                value={component.caption || ''}
                onChange={(e) => update({ caption: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Duration (Seconds)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="15"
                value={component.mediaDurationSec || 15}
                onChange={(e) => update({ mediaDurationSec: Number(e.target.value) || 15 })}
              />
            </div>
          </div>
        )}

        {/* STARS INVOICE */}
        {component.type === 'stars_invoice' && (
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Invoice Title</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Digital Pass"
                value={component.invoiceConfig?.title || ''}
                onChange={(e) =>
                  update({
                    invoiceConfig: {
                      ...(component.invoiceConfig || {
                        description: '',
                        priceStars: 250,
                        currency: 'XTR',
                        payload: 'pass_1',
                      }),
                      title: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Price (Telegram Stars ⭐)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="250"
                value={component.invoiceConfig?.priceStars || 250}
                onChange={(e) =>
                  update({
                    invoiceConfig: {
                      ...(component.invoiceConfig || {
                        title: 'Product',
                        description: '',
                        currency: 'XTR',
                        payload: 'pass_1',
                      }),
                      priceStars: Number(e.target.value) || 100,
                    },
                  })
                }
              />
            </div>
          </div>
        )}

        {/* PERSONALIZATION & VISIBILITY RULES (Point 1: Dynamic Conditionals) */}
        <div className="pt-4 border-t border-[#edebe9] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-[#605e5c] uppercase tracking-wider flex items-center gap-1.5">
              <span>👁</span>
              <span>Conditional Logic &amp; Target Rules</span>
            </label>
            {component.condition && (
              <button
                type="button"
                onClick={() => update({ condition: undefined })}
                className="text-[10px] text-red-600 hover:underline cursor-pointer"
              >
                Reset Rule
              </button>
            )}
          </div>

          <div className="bg-[#faf9f8] p-2.5 rounded-lg border border-[#edebe9] space-y-2">
            <select
              className={inputClass}
              value={component.condition?.field || 'always'}
              onChange={(e) => {
                const val = e.target.value as any;
                if (val === 'always') {
                  update({ condition: undefined });
                } else {
                  update({
                    condition: {
                      field: val,
                      operator: val === 'orders' ? 'eq' : 'gt',
                      value: val === 'orders' ? 0 : 50,
                    },
                  });
                }
              }}
            >
              <option value="always">Always Visible (All Users)</option>
              <option value="orders">New Users Only (Orders === 0)</option>
              <option value="balance">VIP Depositors (Wallet Balance &gt; X)</option>
              <option value="referrals">Affiliate Leaders (Referrals &gt; X)</option>
              <option value="vip_member">VIP Subscribed Tagged Members</option>
            </select>

            {component.condition && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-[#605e5c] font-medium">Condition:</span>
                <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                  {component.condition.field} {component.condition.operator} {component.condition.value}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
