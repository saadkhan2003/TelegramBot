'use client';

import React from 'react';
import {
  Type,
  Heading,
  ListOrdered,
  Minus,
  MoveVertical,
  Info,
  Square,
  Columns,
  Grid3X3,
  Plus,
} from 'lucide-react';
import { ComponentType, BotComponent } from '../../lib/botBuilderTypes';

interface ComponentPaletteProps {
  onAdd: (component: BotComponent) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

interface PaletteItem {
  type: ComponentType;
  title: string;
  description: string;
  icon: React.ElementType;
  create: () => BotComponent;
}

const PALETTE_GROUPS: { group: string; items: PaletteItem[] }[] = [
  {
    group: 'Text & Content',
    items: [
      {
        type: 'text',
        title: 'Text Block',
        description: 'Formatted message text',
        icon: Type,
        create: () => ({
          id: uid(),
          type: 'text',
          content: 'Add your message text here...',
          bold: false,
        }),
      },
      {
        type: 'text',
        title: 'Header Text',
        description: 'Bold title banner',
        icon: Heading,
        create: () => ({
          id: uid(),
          type: 'text',
          content: '✨ Section Title',
          bold: true,
        }),
      },
      {
        type: 'field',
        title: 'Key-Value Field',
        description: 'Emoji, label & dynamic value',
        icon: Square,
        create: () => ({
          id: uid(),
          type: 'field',
          emoji: '📌',
          label: 'Status',
          value: 'Active',
        }),
      },
      {
        type: 'info_box',
        title: 'Info Box',
        description: 'Highlighted callout message',
        icon: Info,
        create: () => ({
          id: uid(),
          type: 'info_box',
          header: '📌 Note',
          body: 'Instructions or important notice for the customer.',
        }),
      },
      {
        type: 'numbered_list',
        title: 'Numbered List',
        description: 'Step-by-step instructions',
        icon: ListOrdered,
        create: () => ({
          id: uid(),
          type: 'numbered_list',
          items: ['Step 1: Choose item', 'Step 2: Send payment', 'Step 3: Receive delivery'],
        }),
      },
    ],
  },
  {
    group: 'Spacing & Dividers',
    items: [
      {
        type: 'divider',
        title: 'Divider Line',
        description: 'Horizontal separator line',
        icon: Minus,
        create: () => ({
          id: uid(),
          type: 'divider',
        }),
      },
      {
        type: 'spacer',
        title: 'Vertical Spacer',
        description: 'Blank line spacing',
        icon: MoveVertical,
        create: () => ({
          id: uid(),
          type: 'spacer',
        }),
      },
    ],
  },
  {
    group: 'Interactive Buttons',
    items: [
      {
        type: 'button',
        title: 'Single Button',
        description: 'One inline callback button',
        icon: Square,
        create: () => ({
          id: uid(),
          type: 'button',
          label: '🔘 Click Here',
          action: 'nav_main',
        }),
      },
      {
        type: 'button_row',
        title: 'Button Row (2x)',
        description: 'Two side-by-side action buttons',
        icon: Columns,
        create: () => ({
          id: uid(),
          type: 'button_row',
          buttons: [
            { id: uid(), label: '✅ Accept', action: 'nav_main' },
            { id: uid(), label: '❌ Cancel', action: 'nav_main' },
          ],
        }),
      },
      {
        type: 'button_grid',
        title: 'Button Grid / Menu',
        description: 'Multi-button keyboard layout',
        icon: Grid3X3,
        create: () => ({
          id: uid(),
          type: 'button_grid',
          buttons: [
            { id: uid(), label: '🛒 Browse Products', action: 'nav_buy', fullWidth: true },
            { id: uid(), label: '💰 Wallet', action: 'nav_wallet' },
            { id: uid(), label: '👤 Profile', action: 'nav_profile' },
          ],
        }),
      },
    ],
  },
];

export default function ComponentPalette({ onAdd }: ComponentPaletteProps) {
  return (
    <aside className="w-64 bg-white border-r border-[#edebe9] flex flex-col h-full select-none shrink-0">
      <div className="p-3 border-b border-[#edebe9]">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#323130]">Components</h2>
        <p className="text-[11px] text-[#605e5c] mt-0.5">Click to add to message canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {PALETTE_GROUPS.map((group) => (
          <div key={group.group}>
            <div className="text-[10px] font-bold text-[#8a8886] uppercase tracking-wider mb-1.5 px-1">
              {group.group}
            </div>
            <div className="space-y-1">
              {group.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onAdd(item.create())}
                    className="w-full flex items-center justify-between p-2 rounded-[4px] border border-transparent hover:border-[#c7e0f4] hover:bg-[#f3f9fd] text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-[4px] bg-[#f3f2f1] group-hover:bg-[#0078d4]/10 text-[#605e5c] group-hover:text-[#0078d4] flex items-center justify-center shrink-0 transition">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#201f1e] group-hover:text-[#0078d4] truncate transition">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-[#8a8886] truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-[#8a8886] opacity-0 group-hover:opacity-100 group-hover:text-[#0078d4] transition shrink-0 ml-1" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
