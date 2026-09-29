'use client';

import React from 'react';
import {
  Type,
  Heading,
  Quote,
  ListOrdered,
  List,
  Minus,
  MoveVertical,
  Info,
  Square,
  Columns,
  Grid3X3,
  Image as ImageIcon,
  AlertTriangle,
  HelpCircle,
  Share2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { ComponentType, BotComponent, uid } from '../../lib/botBuilderTypes';

interface ComponentPaletteProps {
  onAdd: (component: BotComponent) => void;
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
    group: 'Media & Announcements',
    items: [
      {
        type: 'image',
        title: 'Image / Banner Header',
        description: 'Photo header with optional caption',
        icon: ImageIcon,
        create: () => ({
          id: uid(),
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop',
          caption: '✨ Exclusive announcement from {storeName}',
        }),
      },
      {
        type: 'alert_banner',
        title: 'Alert Callout Banner',
        description: 'Notice, discount or warning box',
        icon: AlertTriangle,
        create: () => ({
          id: uid(),
          type: 'alert_banner',
          alertVariant: 'info',
          header: '📢 Special Announcement',
          body: 'Add your high-priority notice or limited promo offer here.',
        }),
      },
      {
        type: 'info_box',
        title: 'Information Box',
        description: 'Card with accent border',
        icon: Info,
        create: () => ({
          id: uid(),
          type: 'info_box',
          header: '📌 Quick Note',
          body: 'Important guidelines or instructions for your customers.',
        }),
      },
    ],
  },
  {
    group: 'Text & Typography',
    items: [
      {
        type: 'text',
        title: 'Section Header',
        description: 'Bold title text line',
        icon: Heading,
        create: () => ({
          id: uid(),
          type: 'text',
          content: '🚀 Section Title',
          bold: true,
        }),
      },
      {
        type: 'text',
        title: 'Text Block',
        description: 'Formatted message text',
        icon: Type,
        create: () => ({
          id: uid(),
          type: 'text',
          content: 'Customize your message content here. Supports {username}, {storeName}, etc.',
          bold: false,
        }),
      },
      {
        type: 'quote',
        title: 'Telegram Quote Block',
        description: 'Blockquote with accent left bar',
        icon: Quote,
        create: () => ({
          id: uid(),
          type: 'quote',
          content: '"Quality is not an act, it is a habit."',
          author: 'Customer Experience Team',
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
          emoji: '💎',
          label: 'Status',
          value: 'Active / Verified',
        }),
      },
    ],
  },
  {
    group: 'Lists & Knowledge',
    items: [
      {
        type: 'bullet_list',
        title: 'Bullet Points List',
        description: 'Key features or benefit highlights',
        icon: List,
        create: () => ({
          id: uid(),
          type: 'bullet_list',
          items: [
            '✨ Instant automated delivery within 30 seconds',
            '🛡 Verified warranty and money-back guarantee',
            '⚡ 24/7 dedicated Telegram customer assistance',
          ],
        }),
      },
      {
        type: 'numbered_list',
        title: 'Numbered Steps',
        description: 'Step 1, Step 2 workflow instructions',
        icon: ListOrdered,
        create: () => ({
          id: uid(),
          type: 'numbered_list',
          items: [
            'Select your desired plan or service',
            'Complete payment via wallet or instant transfer',
            'Receive confirmation and access details immediately',
          ],
        }),
      },
      {
        type: 'faq_item',
        title: 'FAQ Question & Answer',
        description: 'Q&A knowledge base block',
        icon: HelpCircle,
        create: () => ({
          id: uid(),
          type: 'faq_item',
          question: 'How do I get started with {storeName}?',
          answer: 'Simply choose a service from the menu, or contact our support team directly for custom inquiries.',
        }),
      },
    ],
  },
  {
    group: 'AI & Automation Engine',
    items: [
      {
        type: 'form_input',
        title: 'Interactive Intake Form',
        description: 'Ask user for email, screenshot or details',
        icon: Plus,
        create: () => ({
          id: uid(),
          type: 'form_input',
          formConfig: {
            promptText: 'Please reply with your account email or transaction ID:',
            fieldType: 'text',
            variableName: 'custom_user_input',
            actionOnSubmit: 'save_variable',
          },
        }),
      },
      {
        type: 'ai_copilot',
        title: 'AI Copilot Assistant',
        description: 'Gemini intelligent answering with human fallback',
        icon: Sparkles,
        create: () => ({
          id: uid(),
          type: 'ai_copilot',
          aiConfig: {
            instruction: 'You are the intelligent assistant for {storeName}. Help answer questions concisely and guide users to explore services or contact support.',
            knowledgeContext: 'general',
            handoffButtonLabel: '💬 Speak with Human Operator',
            temperature: 0.7,
          },
        }),
      },
    ],
  },
  {
    group: 'Rich Media & Native Commerce',
    items: [
      {
        type: 'carousel',
        title: 'Product Carousel Slider',
        description: 'Multi-slide catalog with ⬅️ / ➡️ paging',
        icon: Columns,
        create: () => ({
          id: uid(),
          type: 'carousel',
          carouselSlides: [
            {
              id: uid(),
              title: '⭐ Premium Membership',
              description: 'Unlimited access to all VIP tools and sovereign features.',
              price: '$29 / mo',
              buttonLabel: '⚡ Upgrade Now',
              buttonScreen: 'services',
            },
            {
              id: uid(),
              title: '🚀 Enterprise Node',
              description: 'Dedicated infrastructure with 99.99% uptime guarantee.',
              price: '$99 / mo',
              buttonLabel: '💼 Order Node',
              buttonScreen: 'services',
            },
          ],
        }),
      },
      {
        type: 'video_note',
        title: 'Round Video Note',
        description: 'Telegram native circular video bubble',
        icon: ImageIcon,
        create: () => ({
          id: uid(),
          type: 'video_note',
          imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop',
          caption: '🎥 Video message from the founder',
          mediaDurationSec: 15,
        }),
      },
      {
        type: 'audio',
        title: 'Voice / Audio Note',
        description: 'Recorded audio message with waveform',
        icon: Info,
        create: () => ({
          id: uid(),
          type: 'audio',
          caption: '🎙 Audio briefing & instructions',
          mediaDurationSec: 45,
        }),
      },
      {
        type: 'stars_invoice',
        title: 'Telegram Stars Invoice',
        description: 'Native in-app Stars & digital payments',
        icon: Square,
        create: () => ({
          id: uid(),
          type: 'stars_invoice',
          invoiceConfig: {
            title: 'Digital Service Pass',
            description: 'Instant unlocking of your selected service tier.',
            priceStars: 250,
            currency: 'XTR',
            payload: 'service_pass_v1',
          },
        }),
      },
    ],
  },
  {
    group: 'Buttons & Navigation',
    items: [
      {
        type: 'button',
        title: 'Single Action Button',
        description: 'Callback, URL, Mini App, or Screen jump',
        icon: Square,
        create: () => ({
          id: uid(),
          type: 'button',
          label: '🔘 Primary Action',
          buttonType: 'callback',
          action: 'nav_main',
        }),
      },
      {
        type: 'button_row',
        title: 'Two Buttons Row',
        description: 'Two side-by-side action buttons',
        icon: Columns,
        create: () => ({
          id: uid(),
          type: 'button_row',
          buttons: [
            { id: uid(), label: '✅ Accept', type: 'callback', action: 'nav_main' },
            { id: uid(), label: '❌ Decline', type: 'callback', action: 'nav_main' },
          ],
        }),
      },
      {
        type: 'button_grid',
        title: 'Button Grid / Keyboard',
        description: 'Multi-row responsive menu keyboard',
        icon: Grid3X3,
        create: () => ({
          id: uid(),
          type: 'button_grid',
          buttons: [
            { id: uid(), label: '🌟 Explore Options', type: 'callback', action: 'nav_buy', fullWidth: true },
            { id: uid(), label: '👤 Profile', type: 'callback', action: 'nav_profile' },
            { id: uid(), label: '💬 Support', type: 'callback', action: 'nav_support' },
          ],
        }),
      },
      {
        type: 'social_links',
        title: 'Community & Social Links',
        description: 'Official Telegram channels & socials',
        icon: Share2,
        create: () => ({
          id: uid(),
          type: 'social_links',
          links: [
            { id: uid(), platform: 'Telegram Channel', label: 'Announcements Channel', url: 'https://t.me', emoji: '📢' },
            { id: uid(), platform: 'Support Chat', label: 'Support Agent Desk', url: 'https://t.me', emoji: '💬' },
            { id: uid(), platform: 'Website', label: 'Official Website', url: 'https://google.com', emoji: '🌐' },
          ],
        }),
      },
    ],
  },
  {
    group: 'Spacing & Separators',
    items: [
      {
        type: 'divider',
        title: 'Divider Line',
        description: 'Clean horizontal rule',
        icon: Minus,
        create: () => ({
          id: uid(),
          type: 'divider',
        }),
      },
      {
        type: 'spacer',
        title: 'Vertical Spacer',
        description: 'Empty spacing line',
        icon: MoveVertical,
        create: () => ({
          id: uid(),
          type: 'spacer',
        }),
      },
    ],
  },
];

export default function ComponentPalette({ onAdd }: ComponentPaletteProps) {
  return (
    <aside className="w-64 bg-white border-r border-[#edebe9] flex flex-col h-full select-none shrink-0">
      <div className="p-3 border-b border-[#edebe9] bg-[#faf9f8]">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#323130]">Element Library</h2>
        <p className="text-[11px] text-[#605e5c] mt-0.5">Click any block to insert into canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {PALETTE_GROUPS.map((group) => (
          <div key={group.group}>
            <div className="text-[10px] font-bold text-[#8a8886] uppercase tracking-wider mb-1 px-1">
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
