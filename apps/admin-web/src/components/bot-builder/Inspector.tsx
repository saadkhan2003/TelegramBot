'use client';

import React from 'react';
import { Trash2, Plus, X, ExternalLink, Zap, ArrowRight, CornerDownRight } from 'lucide-react';
import {
  BotComponent,
  BotButton,
  ButtonType,
  BOT_ACTIONS,
  TEMPLATE_VARIABLES,
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
    <div className="mt-2">
      <div className="text-[9px] font-bold text-[#8a8886] uppercase tracking-wider mb-1">Insert Variable:</div>
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
        {TEMPLATE_VARIABLES.slice(0, 10).map((v) => (
          <button
            key={v.key}
            type="button"
            title={v.desc}
            onClick={() => {
              const current = (component[field] as string) || '';
              update({ [field]: current + `{${v.key}}` } as any);
            }}
            className="text-[9px] px-1.5 py-0.5 bg-[#eff6fc] text-[#0078d4] rounded border border-[#c7e0f4] hover:bg-[#ddeeff] transition cursor-pointer font-mono"
          >
            {`{${v.key}}`}
          </button>
        ))}
      </div>
    </div>
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
                        className="rounded border-[#d2d0ce] text-[#0078d4] focus:ring-[#0078d4]"
                      />
                      <span>Full width row (occupy entire line)</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
