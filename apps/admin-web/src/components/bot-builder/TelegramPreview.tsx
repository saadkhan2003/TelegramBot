'use client';

import React from 'react';
import { ExternalLink, Zap, ArrowRight, Info, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { BotComponent, BotButton } from '../../lib/botBuilderTypes';

interface TelegramPreviewProps {
  components: BotComponent[];
  storeName?: string;
}

const SAMPLE_VARS: Record<string, string> = {
  storeName: 'Delux Store',
  storeTagline: 'Authorized Premium Digital Agency & Platform',
  supportUsername: '@deluxsupportbot',
  channelLink: 'https://t.me/deluxnews',
  websiteUrl: 'https://deluxstore.io',
  balance: '24.50',
  deposited: '50.00',
  spent: '25.50',
  username: 'ahmed_hassan',
  firstName: 'Ahmed',
  lastName: 'Hassan',
  orderNumber: '10042',
  productName: 'Netflix Premium 1 Month',
  unitPrice: '4.99',
  quantity: '1',
  total: '4.99',
  afterBalance: '19.51',
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
    text || '',
  );
}

function renderText(text: string): React.ReactNode[] {
  // Parse *bold*, _italic_, `mono`, and ||spoiler||
  const parts = text.split(/(\*[^*]+\*|_[^_]+_|`[^`]+`|\|\|[^|]+\|\|)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={i} className="font-bold text-white">{part.slice(1, -1)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={i} className="italic text-[#d0d0d0]">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-black/30 rounded px-1 py-0.5 font-mono text-[#6bc5f8] text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('||') && part.endsWith('||')) {
      return (
        <span key={i} className="bg-white/20 text-transparent hover:text-white rounded px-1 transition select-none cursor-pointer" title="Telegram Spoiler">
          {part.slice(2, -2)}
        </span>
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

function renderButtonIcon(btn: BotButton) {
  if (btn.type === 'url') {
    return <ExternalLink className="h-2.5 w-2.5 text-neutral-400 shrink-0 ml-1 inline" />;
  }
  if (btn.type === 'web_app') {
    return <Zap className="h-2.5 w-2.5 text-[#e5a93b] shrink-0 ml-1 inline fill-current" />;
  }
  if (btn.type === 'screen') {
    return <ArrowRight className="h-2.5 w-2.5 text-[#6bc5f8] shrink-0 ml-1 inline" />;
  }
  return null;
}

export default function TelegramPreview({ components, storeName = 'Delux Store' }: TelegramPreviewProps) {
  const vars = { ...SAMPLE_VARS, storeName };

  const renderComponent = (comp: BotComponent) => {
    switch (comp.type) {
      case 'text': {
        const txt = interpolate(comp.content || '', vars);
        return (
          <p className={`text-[12.5px] leading-[1.45] text-[#e8e8e8] whitespace-pre-line ${comp.bold ? 'font-bold text-white' : ''}`}>
            {renderText(txt)}
          </p>
        );
      }

      case 'image': {
        return (
          <div className="rounded-md overflow-hidden bg-black/30 border border-white/10 my-1">
            {comp.imageUrl ? (
              <img
                src={comp.imageUrl}
                alt="Banner preview"
                className="w-full max-h-40 object-cover"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                }}
              />
            ) : (
              <div className="h-24 bg-white/5 flex items-center justify-center text-xs text-neutral-400">
                🖼️ Image Header Preview
              </div>
            )}
            {comp.caption && (
              <div className="p-2 text-[11.5px] text-[#cfcfcf]">
                {renderText(interpolate(comp.caption, vars))}
              </div>
            )}
          </div>
        );
      }

      case 'quote': {
        const txt = interpolate(comp.content || '', vars);
        return (
          <div className="border-l-[3px] border-[#5288c1] pl-2.5 py-0.5 my-1 bg-white/[0.03] rounded-r text-[12px] text-[#d6d6d6] italic">
            <div>{renderText(txt)}</div>
            {comp.author && (
              <div className="text-[10px] text-[#8a8886] font-normal not-italic mt-0.5">
                — {interpolate(comp.author, vars)}
              </div>
            )}
          </div>
        );
      }

      case 'field': {
        const label = interpolate(comp.label || '', vars);
        const value = interpolate(comp.value || '', vars);
        return (
          <div className="flex items-baseline gap-1.5 text-[12.5px] leading-tight text-[#e8e8e8]">
            <span className="shrink-0">{comp.emoji || '📌'}</span>
            <span className="font-semibold text-white/90">{label}:</span>
            <span className="text-[#a0c8f0] font-mono text-[11.5px]">{value}</span>
          </div>
        );
      }

      case 'bullet_list': {
        return (
          <ul className="space-y-1 text-[12px] text-[#e8e8e8]">
            {(comp.items || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-[#5288c1] font-bold shrink-0">•</span>
                <span>{renderText(interpolate(item, vars))}</span>
              </li>
            ))}
          </ul>
        );
      }

      case 'numbered_list': {
        return (
          <ol className="space-y-1 text-[12px] text-[#e8e8e8]">
            {(comp.items || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-bold text-[#5288c1] shrink-0">{idx + 1}.</span>
                <span>{renderText(interpolate(item, vars))}</span>
              </li>
            ))}
          </ol>
        );
      }

      case 'divider':
        return <div className="border-t border-white/10 my-1.5" />;

      case 'spacer':
        return <div className="h-2" />;

      case 'info_box': {
        const header = interpolate(comp.header || '', vars);
        const body = interpolate(comp.body || '', vars);
        return (
          <div className="bg-[#242f3d] rounded-md p-2.5 border-l-2 border-[#5288c1] space-y-1">
            {header && <p className="text-[12px] font-bold text-white">{header}</p>}
            {body && (
              <p className="text-[11.5px] text-[#b0b8c1] leading-relaxed whitespace-pre-line">
                {renderText(body)}
              </p>
            )}
          </div>
        );
      }

      case 'alert_banner': {
        const header = interpolate(comp.header || '', vars);
        const body = interpolate(comp.body || '', vars);
        const styles = {
          success: 'bg-[#107c41]/20 border-[#107c41] text-[#a8e5a3]',
          warning: 'bg-[#d83b01]/20 border-[#d83b01] text-[#f8ba7b]',
          danger: 'bg-[#a80000]/20 border-[#a80000] text-[#f69d9d]',
          info: 'bg-[#0078d4]/20 border-[#0078d4] text-[#8ec8f6]',
        }[comp.alertVariant || 'info'];

        const Icon = {
          success: CheckCircle2,
          warning: AlertTriangle,
          danger: AlertOctagon,
          info: Info,
        }[comp.alertVariant || 'info'];

        return (
          <div className={`rounded-md p-2.5 border-l-3 space-y-0.5 ${styles}`}>
            <div className="flex items-center gap-1.5 font-bold text-[12px]">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{header || 'Notice'}</span>
            </div>
            {body && <div className="text-[11px] opacity-90 leading-relaxed pl-5">{renderText(body)}</div>}
          </div>
        );
      }

      case 'faq_item': {
        return (
          <div className="bg-[#242f3d] rounded p-2 border border-white/5 space-y-1">
            <div className="text-[12px] font-bold text-[#6bc5f8] flex items-center gap-1">
              <span>❓</span>
              <span>{interpolate(comp.question || 'Question', vars)}</span>
            </div>
            <div className="text-[11.5px] text-[#cfcfcf] pl-4">
              💡 {renderText(interpolate(comp.answer || 'Answer', vars))}
            </div>
          </div>
        );
      }

      case 'social_links': {
        return (
          <div className="space-y-1">
            {(comp.links || []).map((link) => (
              <div
                key={link.id}
                className="bg-[#242f3d] hover:bg-[#2c3847] px-2.5 py-1.5 rounded flex items-center justify-between text-[11px] text-white/90 border border-white/5"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <span>{link.emoji || '🔗'}</span>
                  <span>{interpolate(link.label || link.platform, vars)}</span>
                </span>
                <ExternalLink className="h-3 w-3 text-neutral-400" />
              </div>
            ))}
          </div>
        );
      }

      case 'button':
        return (
          <div className="pt-1">
            <div className="bg-[#2b3a4a] hover:bg-[#344659] text-white text-xs font-semibold py-2 px-3 rounded-lg text-center cursor-pointer transition select-none flex items-center justify-center gap-1.5 shadow-sm">
              <span>{interpolate(comp.label || 'Action Button', vars)}</span>
              {renderButtonIcon(comp as any)}
            </div>
          </div>
        );

      case 'button_row': {
        const btns = comp.buttons || [];
        return (
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {btns.map((btn) => (
              <div
                key={btn.id}
                className="bg-[#2b3a4a] hover:bg-[#344659] text-white text-xs font-semibold py-2 px-2 rounded-lg text-center cursor-pointer transition select-none truncate flex items-center justify-center gap-1 shadow-sm"
              >
                <span className="truncate">{interpolate(btn.label, vars)}</span>
                {renderButtonIcon(btn)}
              </div>
            ))}
          </div>
        );
      }

      case 'button_grid': {
        const rows = buildButtonGrid(comp.buttons || []);
        return (
          <div className="space-y-1.5 pt-1">
            {rows.map((row, rIdx) => (
              <div key={rIdx} className={`grid gap-1.5 ${row.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {row.map((btn) => (
                  <div
                    key={btn.id}
                    className="bg-[#2b3a4a] hover:bg-[#344659] text-white text-xs font-semibold py-2 px-2 rounded-lg text-center cursor-pointer transition select-none truncate flex items-center justify-center gap-1 shadow-sm"
                  >
                    <span className="truncate">{interpolate(btn.label, vars)}</span>
                    {renderButtonIcon(btn)}
                  </div>
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

  return (
    <div className="w-full select-none font-sans drop-shadow-md">
      {/* Telegram Message Header */}
      <div className="bg-[#17212b] rounded-t-xl px-3.5 py-2.5 flex items-center gap-2 border-b border-white/10">
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#2a9ef4] to-[#1281db] flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs">
          🤖
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate flex items-center gap-1">
            <span>{storeName}</span>
            <span className="text-[10px] text-[#5288c1] font-normal">bot</span>
          </p>
          <p className="text-[10px] text-[#8a8886] truncate">verified automated assistant</p>
        </div>
      </div>

      {/* Telegram Message Bubble */}
      <div className="bg-[#0e1621] p-3 rounded-b-xl border-x border-b border-white/10 space-y-2">
        <div className="bg-[#182533] rounded-lg p-3 space-y-2.5 max-w-full text-white/90 shadow-inner">
          {components.length === 0 ? (
            <div className="text-center py-6 text-xs text-white/30 italic">
              Canvas is empty. Add components to preview message bubble.
            </div>
          ) : (
            components.map((comp) => (
              <div key={comp.id} className="first:pt-0">
                {renderComponent(comp)}
              </div>
            ))
          )}

          {/* Timestamp */}
          <div className="text-right text-[10px] text-white/40 pt-1">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
          </div>
        </div>
      </div>
    </div>
  );
}
