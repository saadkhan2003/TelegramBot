'use client';

import React from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import {
  BotComponent,
  BotButton,
  BOT_ACTIONS,
  TEMPLATE_VARIABLES,
} from '../../lib/botBuilderTypes';

interface InspectorProps {
  component: BotComponent | null;
  onChange: (updated: BotComponent) => void;
  onDelete: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const inputClass =
  'w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-2 py-1.5 text-xs text-[#1b1a19] focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] transition';

const labelClass = 'block text-[10px] font-bold text-[#605e5c] uppercase tracking-wide mb-1';

export default function Inspector({ component, onChange, onDelete }: InspectorProps) {
  if (!component) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <div className="text-4xl mb-3">👆</div>
        <p className="text-xs text-[#8a8886] font-medium">Click a component in the canvas to edit its properties</p>
      </div>
    );
  }

  const update = (patch: Partial<BotComponent>) => onChange({ ...component, ...patch });

  const VarChips = ({ field }: { field: keyof BotComponent }) => (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {TEMPLATE_VARIABLES.map((v) => (
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
  );

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[#edebe9] flex items-center justify-between bg-[#faf9f8]">
        <div>
          <p className="text-xs font-bold text-[#1b1a19] capitalize">
            {component.type.replace(/_/g, ' ')}
          </p>
          <p className="text-[10px] text-[#8a8886]">Component Properties</p>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-[4px] hover:bg-[#fdf6f6] text-[#a4262c] transition cursor-pointer"
          title="Delete component"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* TEXT */}
        {component.type === 'text' && (
          <>
            <div>
              <label className={labelClass}>Content</label>
              <textarea
                className={`${inputClass} h-24 resize-none`}
                value={component.content || ''}
                onChange={(e) => update({ content: e.target.value })}
                placeholder="Enter message text..."
              />
              <VarChips field="content" />
            </div>
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!component.bold}
                  onChange={(e) => update({ bold: e.target.checked })}
                  className="rounded"
                />
                <span className="text-xs font-medium text-[#1b1a19]">Bold</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!component.italic}
                  onChange={(e) => update({ italic: e.target.checked })}
                  className="rounded"
                />
                <span className="text-xs font-medium text-[#1b1a19]">Italic</span>
              </label>
            </div>
          </>
        )}

        {/* FIELD */}
        {component.type === 'field' && (
          <>
            <div>
              <label className={labelClass}>Emoji</label>
              <input
                type="text"
                className={inputClass}
                value={component.emoji || ''}
                onChange={(e) => update({ emoji: e.target.value })}
                placeholder="e.g. 🏷"
                maxLength={4}
              />
            </div>
            <div>
              <label className={labelClass}>Label</label>
              <input
                type="text"
                className={inputClass}
                value={component.label || ''}
                onChange={(e) => update({ label: e.target.value })}
                placeholder="e.g. Account Number"
              />
            </div>
            <div>
              <label className={labelClass}>Value</label>
              <input
                type="text"
                className={inputClass}
                value={component.value || ''}
                onChange={(e) => update({ value: e.target.value })}
                placeholder="e.g. {accountNumber}"
              />
              <VarChips field="value" />
            </div>
          </>
        )}

        {/* INFO BOX */}
        {component.type === 'info_box' && (
          <>
            <div>
              <label className={labelClass}>Header</label>
              <input
                type="text"
                className={inputClass}
                value={component.header || ''}
                onChange={(e) => update({ header: e.target.value })}
                placeholder="e.g. 📌 Instructions"
              />
            </div>
            <div>
              <label className={labelClass}>Body</label>
              <textarea
                className={`${inputClass} h-28 resize-none`}
                value={component.body || ''}
                onChange={(e) => update({ body: e.target.value })}
                placeholder="Info box content..."
              />
              <VarChips field="body" />
            </div>
          </>
        )}

        {/* NUMBERED LIST */}
        {component.type === 'numbered_list' && (
          <div>
            <label className={labelClass}>Steps</label>
            <div className="space-y-1.5">
              {(component.items || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#8a8886] font-mono w-4 shrink-0">{idx + 1}.</span>
                  <input
                    type="text"
                    className={`${inputClass} flex-1`}
                    value={item}
                    onChange={(e) => {
                      const items = [...(component.items || [])];
                      items[idx] = e.target.value;
                      update({ items });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = (component.items || []).filter((_, i) => i !== idx);
                      update({ items });
                    }}
                    className="p-1 hover:text-[#a4262c] text-[#8a8886] transition cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => update({ items: [...(component.items || []), ''] })}
                className="text-xs text-[#0078d4] hover:underline flex items-center gap-1 mt-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Step
              </button>
            </div>
          </div>
        )}

        {/* SINGLE BUTTON */}
        {component.type === 'button' && (
          <>
            <div>
              <label className={labelClass}>Button Label</label>
              <input
                type="text"
                className={inputClass}
                value={component.label || ''}
                onChange={(e) => update({ label: e.target.value })}
                placeholder="e.g. ← Back"
              />
            </div>
            <div>
              <label className={labelClass}>Action</label>
              <select
                className={inputClass}
                value={component.action || ''}
                onChange={(e) => update({ action: e.target.value })}
              >
                <option value="">Select action…</option>
                {BOT_ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* BUTTON ROW / BUTTON GRID */}
        {(component.type === 'button_row' || component.type === 'button_grid') && (
          <div>
            <label className={labelClass}>Buttons</label>
            <div className="space-y-2">
              {(component.buttons || []).map((btn, idx) => (
                <div
                  key={btn.id}
                  className="bg-[#faf9f8] border border-[#edebe9] rounded-[4px] p-2 space-y-1.5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[#8a8886]">Button {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const buttons = (component.buttons || []).filter((_, i) => i !== idx);
                        update({ buttons });
                      }}
                      className="p-0.5 hover:text-[#a4262c] text-[#8a8886] cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <input
                    type="text"
                    className={inputClass}
                    value={btn.label}
                    onChange={(e) => {
                      const buttons = [...(component.buttons || [])];
                      buttons[idx] = { ...btn, label: e.target.value };
                      update({ buttons });
                    }}
                    placeholder="Button label"
                  />
                  <select
                    className={inputClass}
                    value={btn.action}
                    onChange={(e) => {
                      const buttons = [...(component.buttons || [])];
                      buttons[idx] = { ...btn, action: e.target.value };
                      update({ buttons });
                    }}
                  >
                    <option value="">Select action…</option>
                    {BOT_ACTIONS.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                  {component.type === 'button_grid' && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!btn.fullWidth}
                        onChange={(e) => {
                          const buttons = [...(component.buttons || [])];
                          buttons[idx] = { ...btn, fullWidth: e.target.checked };
                          update({ buttons });
                        }}
                        className="rounded"
                      />
                      <span className="text-[10px] text-[#1b1a19]">Full width row</span>
                    </label>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const buttons = [
                    ...(component.buttons || []),
                    { id: uid(), label: 'New Button', action: 'nav_main' },
                  ];
                  update({ buttons });
                }}
                className="text-xs text-[#0078d4] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Button
              </button>
            </div>
          </div>
        )}

        {/* DIVIDER / SPACER - no properties */}
        {(component.type === 'divider' || component.type === 'spacer') && (
          <div className="text-center py-4">
            <p className="text-xs text-[#8a8886]">
              {component.type === 'divider'
                ? '━━━━━━━━━━ Divider line (no properties) ━━━━━━━━━━'
                : '↕ Empty spacer line (no properties)'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
