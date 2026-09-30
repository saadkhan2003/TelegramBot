'use client';

import React from 'react';
import {
  ExternalLink,
  Zap,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowLeft,
  MoreVertical,
  Wifi,
  Battery,
  Signal,
} from 'lucide-react';
import { BotComponent, BotButton } from '../../lib/botBuilderTypes';

interface TelegramPreviewProps {
  components: BotComponent[];
  storeName?: string;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showDeviceFrame?: boolean;
  showHeatmap?: boolean;
}

const SAMPLE_VARS: Record<string, string> = {
  storeName: 'Your Store',
  storeTagline: 'Premier Cloud & Digital Services',
  botUsername: '@yourbot',
  supportUsername: '@support',
  channelLink: 'https://t.me/yournews',
  websiteUrl: 'https://yourstore.io',
  operationalHours: '24/7 Automated',
  balance: '45.50',
  balancePkr: '12,740',
  currency: 'USD',
  currencySymbol: '$',
  deposited: '150.00',
  spent: '104.50',
  username: 'ahmed_hassan',
  firstName: 'Ahmed',
  lastName: 'Hassan',
  vipTier: 'Gold VIP',
  isVip: '1',
  language: 'en',
  orderNumber: '10042',
  productName: 'ChatGPT Enterprise 1-Year',
  unitPrice: '14.99',
  quantity: '1',
  total: '14.99',
  afterBalance: '30.51',
  lastOrderStatus: 'DELIVERED',
  price: '14.99',
  stock: '12',
  deliveryType: 'Instant',
  warranty: '30 Days Instant Replacement',
  networkName: 'EasyPaisa / USDT',
  accountTitle: 'Your Store',
  accountNumber: '03451234567',
  minDeposit: '$1.00',
  exchangeRate: '280',
  referralLink: 'https://t.me/YourBot?start=ref_123',
  commissionRate: '10%',
  telegramId: '617559388',
  memberSince: '2026-01-15',
  referrals: '3',
  orders: '12',
  referralEarnings: '18.20',
  // VPS & Cloud Hosting
  'vps.ip': '185.192.110.42',
  'vps.os': 'Ubuntu 24.04 LTS',
  'vps.ram': '8GB DDR5 ECC',
  'vps.cpu': '4 vCPU (AMD EPYC)',
  'vps.bandwidth': '10TB Unmetered',
  'vps.location': 'Frankfurt, Germany',
  'vps.status': 'RUNNING',
  'vps.expiryDate': '2026-10-29',
  // AI & Software Licenses
  'license.key': 'GPT-PRO-9821-XKQW-2026',
  'license.plan': 'Claude 3.5 Sonnet Pro',
  'license.expiry': '2027-01-01',
  'license.devices': '3 Concurrent Devices',
  'api.quota_left': '450,000 credits',
  // Crypto & FX
  'crypto.btc_rate': '68,450',
  'crypto.eth_rate': '3,520',
  'crypto.ton_rate': '5.20',
  'crypto.usdt_rate': '1.00',
  'fx.usd_to_pkr': '280.00',
  // Catalog & Inventory
  'inventory.in_stock_count': '342',
  'inventory.total_products': '28',
  'inventory.stock': '15',
  // Support & System
  'support.open_tickets': '0',
  ticketNumber: 'TCK-8921',
  userName: 'ahmed_hassan',
  'date.today': 'Sep 29, 2026',
  'time.now': '21:05 UTC',
  year: '2026',
};

function interpolate(text: string, vars: Record<string, string>): string {
  if (!text) return '';
  let result = text;
  for (const [k, v] of Object.entries(vars)) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`\\{${escaped}\\}`, 'gi'), v);
  }
  return result;
}

function renderText(text: string): React.ReactNode[] {
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

export default function TelegramPreview({
  components,
  storeName = 'Your Store',
  selectedId,
  onSelect,
  showDeviceFrame = true,
  showHeatmap = false,
}: TelegramPreviewProps) {
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
                className="w-full max-h-44 object-cover"
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
          <div className="bg-[#242f3d] rounded p-2.5 border border-white/5 space-y-1">
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
          <div className="space-y-1.5">
            {(comp.links || []).map((link) => (
              <div
                key={link.id}
                className="bg-[#242f3d] hover:bg-[#2c3847] px-3 py-2 rounded-lg flex items-center justify-between text-[11.5px] text-white/90 border border-white/5 shadow-xs"
              >
                <span className="flex items-center gap-2 font-medium">
                  <span>{link.emoji || '🔗'}</span>
                  <span>{interpolate(link.label || link.platform, vars)}</span>
                </span>
                <ExternalLink className="h-3 w-3 text-neutral-400" />
              </div>
            ))}
          </div>
        );
      }

      case 'button': {
        const clicks = comp.buttons?.[0]?.analytics?.clicks || 480;
        const ctr = comp.buttons?.[0]?.analytics?.ctr || 32;
        return (
          <div className="pt-1">
            <div className="bg-[#2b3a4a] hover:bg-[#344659] text-white text-xs font-semibold py-2.5 px-3 rounded-lg text-center cursor-pointer transition select-none flex items-center justify-center gap-1.5 shadow-xs border border-white/5 relative">
              <span>{interpolate(comp.label || 'Action Button', vars)}</span>
              {renderButtonIcon(comp as any)}
              {showHeatmap && (
                <span className="ml-1.5 text-[9px] font-mono bg-amber-500/30 text-amber-200 px-1.5 py-0.2 rounded border border-amber-500/40">
                  🔥 {clicks} ({ctr}%)
                </span>
              )}
            </div>
          </div>
        );
      }

      case 'button_row': {
        const btns = comp.buttons || [];
        return (
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {btns.map((btn) => (
              <div
                key={btn.id}
                className="bg-[#2b3a4a] hover:bg-[#344659] text-white text-xs font-semibold py-2.5 px-2 rounded-lg text-center cursor-pointer transition select-none truncate flex items-center justify-center gap-1 shadow-xs border border-white/5 relative"
              >
                <span className="truncate">{interpolate(btn.label, vars)}</span>
                {renderButtonIcon(btn)}
                {showHeatmap && (
                  <span className="ml-1 text-[8px] font-mono bg-amber-500/30 text-amber-200 px-1 py-0.2 rounded">
                    🔥 {btn.analytics?.ctr || 24}%
                  </span>
                )}
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
                    className="bg-[#2b3a4a] hover:bg-[#344659] text-white text-xs font-semibold py-2.5 px-2 rounded-lg text-center cursor-pointer transition select-none truncate flex items-center justify-center gap-1 shadow-xs border border-white/5 relative"
                  >
                    <span className="truncate">{interpolate(btn.label, vars)}</span>
                    {renderButtonIcon(btn)}
                    {showHeatmap && (
                      <span className="ml-1 text-[8px] font-mono bg-amber-500/30 text-amber-200 px-1 py-0.2 rounded">
                        🔥 {btn.analytics?.clicks || 140}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }

      case 'form_input': {
        const cfg = comp.formConfig;
        return (
          <div className="bg-[#1e2a38] border border-blue-500/30 rounded-xl p-3 space-y-2 text-white">
            <div className="flex items-center justify-between text-[11px] font-bold text-blue-400">
              <span className="flex items-center gap-1.5">
                <span>📝</span>
                <span>User Input Intake</span>
              </span>
              <span className="font-mono text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                Type: {cfg?.fieldType || 'text'}
              </span>
            </div>
            <p className="text-[12px] text-white/90 leading-relaxed font-medium">
              {interpolate(cfg?.promptText || 'Please reply with your info:', vars)}
            </p>
            <div className="bg-[#121921] rounded-lg p-2 flex items-center justify-between border border-white/10 text-white/40 text-xs">
              <span>✍️ Reply awaiting user input...</span>
              <span className="font-mono text-[10px] text-blue-300 bg-blue-900/40 px-1 rounded">
                {`{${cfg?.variableName || 'input'}}`}
              </span>
            </div>
          </div>
        );
      }

      case 'ai_copilot': {
        const ai = comp.aiConfig;
        return (
          <div className="bg-gradient-to-br from-[#1d2333] to-[#171f2c] border border-indigo-500/40 rounded-xl p-3 space-y-2.5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <span className="text-sm">✨</span>
                <span>Gemini Sovereign AI Copilot</span>
              </div>
              <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">
                Context: {ai?.knowledgeContext || 'catalog'}
              </span>
            </div>
            <p className="text-[11px] text-white/70 italic">
              &ldquo;Ask any question. The bot will answer intelligently using live catalog knowledge.&rdquo;
            </p>
            <div className="pt-1">
              <div className="bg-white/10 hover:bg-white/15 text-white text-xs font-semibold py-2 px-3 rounded-lg text-center cursor-pointer transition select-none flex items-center justify-center gap-1.5 border border-white/10">
                <span>{ai?.handoffButtonLabel || '💬 Speak with Human Operator'}</span>
              </div>
            </div>
          </div>
        );
      }

      case 'carousel': {
        const slides = comp.carouselSlides || [];
        const slide = slides[0];
        return (
          <div className="bg-[#1b2633] border border-white/10 rounded-xl overflow-hidden space-y-2">
            {slide?.imageUrl && (
              <img src={slide.imageUrl} alt={slide.title} className="w-full h-32 object-cover" />
            )}
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">{slide?.title || 'Featured Slide'}</h4>
                {slide?.price && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                    {slide.price}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed">{slide?.description}</p>
              {slide?.buttonLabel && (
                <div className="pt-1">
                  <div className="bg-[#2b3a4a] text-white text-xs font-semibold py-2 rounded-lg text-center cursor-pointer">
                    {slide.buttonLabel}
                  </div>
                </div>
              )}
            </div>
            {/* Carousel navigation pills */}
            <div className="flex items-center justify-between px-3 pb-2 text-[10px] text-white/50">
              <span className="cursor-pointer hover:text-white">⬅️ Prev</span>
              <span className="font-mono">1 / {Math.max(1, slides.length)}</span>
              <span className="cursor-pointer hover:text-white">Next ➡️</span>
            </div>
          </div>
        );
      }

      case 'video_note': {
        return (
          <div className="flex flex-col items-center py-2 space-y-1.5">
            <div className="w-24 h-24 rounded-full border-2 border-[#5288c1] overflow-hidden relative shadow-lg bg-black flex items-center justify-center">
              {comp.imageUrl ? (
                <img src={comp.imageUrl} alt="Video note" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🎥</span>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-xl text-white">▶</span>
              </div>
            </div>
            <span className="text-[10px] text-white/50 font-mono">
              Round Video Note · {comp.mediaDurationSec || 15}s
            </span>
          </div>
        );
      }

      case 'audio': {
        return (
          <div className="bg-[#242f3d] rounded-xl p-2.5 border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#5288c1] flex items-center justify-center text-white text-sm shadow-xs shrink-0 cursor-pointer">
              ▶
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-white font-medium">
                <span className="truncate">{comp.caption || 'Voice Message'}</span>
                <span className="text-white/40 text-[10px] font-mono">0:{comp.mediaDurationSec || 45}</span>
              </div>
              {/* Simulated waveform bars */}
              <div className="flex items-center gap-0.5 h-3">
                {[12, 24, 16, 28, 8, 20, 14, 26, 18, 10, 22, 16, 30, 14, 8, 24, 18].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-white/40 rounded-full"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'stars_invoice': {
        const inv = comp.invoiceConfig;
        return (
          <div className="bg-gradient-to-r from-[#2a2415] to-[#1e1c22] border border-amber-500/40 rounded-xl p-3 space-y-2 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <span>⭐</span>
                <span>{inv?.title || 'Telegram Stars Invoice'}</span>
              </div>
              <span className="text-xs font-extrabold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                {inv?.priceStars || 250} Stars
              </span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              {inv?.description || 'Instant in-app checkout with official Telegram Stars.'}
            </p>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-extrabold text-xs py-2 rounded-lg text-center cursor-pointer transition select-none flex items-center justify-center gap-1.5 shadow-sm">
              <span>⭐ Pay {inv?.priceStars || 250} Stars</span>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // In Telegram messages: content blocks go inside the message bubble,
  // while button blocks (action buttons, button rows, button grids) form the attached inline keyboard at the bottom.
  const contentComponents = components.filter(
    (c) => !['button', 'button_row', 'button_grid'].includes(c.type)
  );
  const buttonComponents = components.filter((c) =>
    ['button', 'button_row', 'button_grid'].includes(c.type)
  );

  const bubbleContent = (
    <div className="space-y-2">
      {/* Telegram Message Bubble */}
      <div className="bg-[#182533] rounded-2xl p-3.5 space-y-2.5 text-white/90 shadow-md border border-white/5">
        {contentComponents.length === 0 && buttonComponents.length === 0 ? (
          <div className="text-center py-10 text-xs text-white/30 italic">
            Canvas is empty. Click elements on the left to start building.
          </div>
        ) : contentComponents.length === 0 ? (
          <div className="text-xs text-white/60 italic py-1">
            (No text content in message)
          </div>
        ) : (
          contentComponents.map((comp) => {
            const isSelected = comp.id === selectedId;
            return (
              <div
                key={comp.id}
                onClick={(e) => {
                  if (onSelect) {
                    e.stopPropagation();
                    onSelect(comp.id);
                  }
                }}
                className={`rounded-lg p-1.5 transition cursor-pointer relative group ${
                  isSelected
                    ? 'ring-2 ring-[#0078d4] bg-white/5'
                    : 'hover:bg-white/[0.04] hover:ring-1 hover:ring-white/20'
                }`}
              >
                {renderComponent(comp)}
                {isSelected && (
                  <span className="absolute -top-2 right-2 bg-[#0078d4] text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs">
                    Active
                  </span>
                )}
              </div>
            );
          })
        )}

        {/* Timestamp inside bubble */}
        <div className="text-right text-[10px] text-white/40 pt-1 font-mono">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
        </div>
      </div>

      {/* Telegram Attached Inline Keyboard (Always below message bubble) */}
      {buttonComponents.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          {buttonComponents.map((comp) => {
            const isSelected = comp.id === selectedId;
            return (
              <div
                key={comp.id}
                onClick={(e) => {
                  if (onSelect) {
                    e.stopPropagation();
                    onSelect(comp.id);
                  }
                }}
                className={`rounded-lg p-1 transition cursor-pointer relative group ${
                  isSelected
                    ? 'ring-2 ring-[#0078d4] bg-white/5'
                    : 'hover:bg-white/[0.04] hover:ring-1 hover:ring-white/20'
                }`}
              >
                {renderComponent(comp)}
                {isSelected && (
                  <span className="absolute -top-2 right-2 bg-[#0078d4] text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs z-10">
                    Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (!showDeviceFrame) {
    return (
      <div className="w-full select-none font-sans">
        <div className="bg-[#0e1621] p-4 rounded-xl border border-white/10 shadow-lg">
          {bubbleContent}
        </div>
      </div>
    );
  }

  // Realistic Smartphone Device Chassis
  return (
    <div className="w-[360px] sm:w-[380px] bg-[#1a1c22] rounded-[44px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border-4 border-[#2f323a] select-none mx-auto">
      {/* Phone Screen Glass */}
      <div className="bg-[#0e1621] rounded-[36px] overflow-hidden flex flex-col h-[650px] relative border border-black/40">
        {/* Dynamic Island / Speaker Pill */}
        <div className="pt-2 px-6 flex items-center justify-between text-white/70 text-[11px] shrink-0 z-20">
          <span className="font-semibold text-xs text-white">9:41</span>
          <div className="w-20 h-4 bg-black rounded-full mx-auto shadow-inner" />
          <div className="flex items-center gap-1.5">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <Battery className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Telegram App Navigation Bar */}
        <div className="bg-[#17212b] px-3.5 py-2.5 flex items-center justify-between border-b border-white/10 shrink-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <ArrowLeft className="h-4 w-4 text-[#5288c1] cursor-pointer" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2a9ef4] to-[#1281db] flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-xs">
              🤖
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                <span>{storeName}</span>
                <span className="text-[10px] text-[#5288c1] font-normal">bot</span>
              </p>
              <p className="text-[10px] text-[#8a8886] truncate">bot · online</p>
            </div>
          </div>
          <MoreVertical className="h-4 w-4 text-white/60 cursor-pointer" />
        </div>

        {/* Chat Message Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#0e1621] scrollbar-thin">
          {/* Date separator badge */}
          <div className="flex justify-center">
            <span className="px-2.5 py-0.5 rounded-full bg-black/40 text-white/60 text-[10px] font-medium backdrop-blur-xs">
              Today
            </span>
          </div>

          {bubbleContent}
        </div>

        {/* Bottom Telegram Mini Bar */}
        <div className="bg-[#17212b] px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-xs text-[#5288c1] font-medium shrink-0">
          <div className="flex items-center gap-2 text-white/50 text-[11px]">
            <span>⚡ Menu</span>
          </div>
          <span className="text-white/40 text-[11px]">Tap any component to edit</span>
        </div>
      </div>
    </div>
  );
}
