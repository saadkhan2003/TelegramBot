'use client';

import React from 'react';
import { BotComponent, BotButton } from '../../lib/botBuilderTypes';

interface TelegramPreviewProps {
  components: BotComponent[];
  storeName?: string;
}

const SAMPLE_VARS: Record<string, string> = {
  storeName: 'Delux Store',
  balance: '24.50',
  deposited: '50.00',
  spent: '25.50',
  username: 'ahmed_hassan',
  firstName: 'Ahmed',
  orderNumber: '10042',
  productName: 'Netflix Premium 1 Month',
  unitPrice: '4.99',
  total: '4.99',
  afterBalance: '19.51',
  quantity: '1',
  price: '4.99',
  stock: '12',
  deliveryType: 'Instant',
  warranty: '30 days',
  networkName: 'EasyPaisa (Pakistan)',
  accountTitle: 'Delux Store / Saad',
  accountNumber: '03451234567',
  minDeposit: 'Rs. 300 PKR (~$1.07 USD)',
  exchangeRate: '280',
  referralLink: 'https://t.me/DeluxBot?start=ref_123',
  commissionRate: '10',
  telegramId: '617559388',
  memberSince: 'Jan 2026',
  referrals: '3',
  orders: '8',
  referralEarnings: '2.40',
};

function interpolate(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
    text,
  );
}

function renderText(text: string): React.ReactNode[] {
  // Parse *bold*, _italic_, `mono` formatting
  const parts = text.split(/(\*[^*]+\*|_[^_]+_|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={i} className="font-bold">{part.slice(1, -1)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-white/10 rounded px-0.5 font-mono text-[#6bc5f8]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function buildButtonGrid(buttons: BotButton[]): BotButton[][] {
  const rows: BotButton[][] = [];
  let currentRow: BotButton[] = [];

  for (const btn of buttons) {
    if (btn.fullWidth) {
      if (currentRow.length) { rows.push(currentRow); currentRow = []; }
      rows.push([btn]);
    } else {
      currentRow.push(btn);
      if (currentRow.length === 2) { rows.push(currentRow); currentRow = []; }
    }
  }
  if (currentRow.length) rows.push(currentRow);
  return rows;
}

export default function TelegramPreview({ components, storeName = 'Delux Store' }: TelegramPreviewProps) {
  const vars = { ...SAMPLE_VARS, storeName };

  const renderComponent = (comp: BotComponent) => {
    switch (comp.type) {
      case 'text': {
        const txt = interpolate(comp.content || '', vars);
        return (
          <p className={`text-[13px] leading-[1.4] text-[#e8e8e8] whitespace-pre-line ${comp.bold ? 'font-bold' : ''}`}>
            {renderText(txt)}
          </p>
        );
      }

      case 'field': {
        const val = interpolate(comp.value || '', vars);
        return (
          <p className="text-[13px] leading-[1.4] text-[#e8e8e8]">
            {comp.emoji && <span className="mr-1">{comp.emoji}</span>}
            <strong className="font-semibold text-white">{comp.label}:</strong>{' '}
            <code className="text-[#6bc5f8] font-mono text-[12px]">{val}</code>
          </p>
        );
      }

      case 'numbered_list': {
        const items = comp.items || [];
        return (
          <div className="space-y-0.5">
            {items.map((item, i) => (
              <p key={i} className="text-[13px] leading-[1.4] text-[#e8e8e8]">
                {i + 1}. {interpolate(item, vars)}
              </p>
            ))}
          </div>
        );
      }

      case 'divider':
        return <p className="text-[#605e5c] text-[12px] tracking-wider">━━━━━━━━━━━━━━━━━━━━</p>;

      case 'spacer':
        return <div className="h-2" />;

      case 'info_box': {
        const bodyText = interpolate(comp.body || '', vars);
        return (
          <div>
            <p className="text-[13px] font-bold text-white">{interpolate(comp.header || '', vars)}</p>
            <p className="text-[13px] leading-[1.4] text-[#e8e8e8] whitespace-pre-line mt-0.5">
              {renderText(bodyText)}
            </p>
          </div>
        );
      }

      case 'button': {
        return (
          <div className="mt-1">
            <button className="w-full bg-[#2b5278] hover:bg-[#3a6b9e] text-white text-[13px] py-2 px-3 rounded-[6px] transition font-medium">
              {interpolate(comp.label || '', vars)}
            </button>
          </div>
        );
      }

      case 'button_row': {
        const btns = comp.buttons || [];
        return (
          <div className="mt-1 flex gap-1">
            {btns.map((btn) => (
              <button
                key={btn.id}
                className="flex-1 bg-[#2b5278] hover:bg-[#3a6b9e] text-white text-[12px] py-2 px-2 rounded-[6px] transition font-medium"
              >
                {interpolate(btn.label, vars)}
              </button>
            ))}
          </div>
        );
      }

      case 'button_grid': {
        const btns = comp.buttons || [];
        const rows = buildButtonGrid(btns);
        return (
          <div className="mt-1 space-y-1">
            {rows.map((row, ri) => (
              <div key={ri} className="flex gap-1">
                {row.map((btn) => (
                  <button
                    key={btn.id}
                    className="flex-1 bg-[#2b5278] hover:bg-[#3a6b9e] text-white text-[12px] py-2 px-2 rounded-[6px] transition font-medium"
                  >
                    {interpolate(btn.label, vars)}
                  </button>
                ))}
              </div>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  const hasButtons = components.some((c) =>
    ['button', 'button_row', 'button_grid'].includes(c.type),
  );

  const textComponents = hasButtons
    ? components.filter((c) => !['button', 'button_row', 'button_grid'].includes(c.type))
    : components;
  const buttonComponents = hasButtons
    ? components.filter((c) => ['button', 'button_row', 'button_grid'].includes(c.type))
    : [];

  return (
    <div className="flex flex-col gap-1 w-full max-w-[360px] mx-auto">
      {/* Bot message bubble */}
      {textComponents.length > 0 && (
        <div
          className="rounded-[12px] rounded-tl-[4px] px-3 py-2.5 space-y-1.5"
          style={{ backgroundColor: '#1e3a5f', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
        >
          {textComponents.map((comp, idx) => (
            <div key={comp.id || idx}>{renderComponent(comp)}</div>
          ))}

          {/* Timestamp */}
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-[#8ab4d0]">
              {new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      )}

      {/* Buttons below message */}
      {buttonComponents.map((comp, idx) => (
        <div key={comp.id || idx}>{renderComponent(comp)}</div>
      ))}
    </div>
  );
}
