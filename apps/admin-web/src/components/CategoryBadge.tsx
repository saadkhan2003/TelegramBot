import React from 'react';
import {
  Sparkles,
  Code2,
  Film,
  Tv,
  ShieldCheck,
  Gamepad2,
  KeyRound,
  Layers,
  Cpu,
  Globe,
  LucideIcon,
} from 'lucide-react';

interface CategoryBadgeProps {
  name?: string;
  className?: string;
  size?: 'sm' | 'md';
}

interface CategoryStyle {
  icon: LucideIcon;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export function getCategoryStyle(name: string = ''): CategoryStyle {
  const lower = name.toLowerCase();

  if (lower.includes('ai') || lower.includes('intelligence') || lower.includes('gpt')) {
    return {
      icon: Sparkles,
      textColor: 'text-[#0078d4]',
      bgColor: 'bg-[#eff6fc]',
      borderColor: 'border-[#c7e0f4]',
    };
  }
  if (lower.includes('dev') || lower.includes('code') || lower.includes('tool') || lower.includes('terminal')) {
    return {
      icon: Code2,
      textColor: 'text-[#5c2d91]',
      bgColor: 'bg-[#f4edf9]',
      borderColor: 'border-[#e2d5ef]',
    };
  }
  if (lower.includes('entertain') || lower.includes('stream') || lower.includes('movie') || lower.includes('video')) {
    return {
      icon: Film,
      textColor: 'text-[#8a3707]',
      bgColor: 'bg-[#fff4ce]',
      borderColor: 'border-[#fed9cc]',
    };
  }
  if (lower.includes('game') || lower.includes('gaming') || lower.includes('steam')) {
    return {
      icon: Gamepad2,
      textColor: 'text-[#b146c2]',
      bgColor: 'bg-[#fce8e6]',
      borderColor: 'border-[#fad2cf]',
    };
  }
  if (lower.includes('security') || lower.includes('vpn') || lower.includes('privacy') || lower.includes('shield')) {
    return {
      icon: ShieldCheck,
      textColor: 'text-[#107c10]',
      bgColor: 'bg-[#dff6dd]',
      borderColor: 'border-[#a8e5a3]',
    };
  }
  if (lower.includes('key') || lower.includes('license') || lower.includes('activation')) {
    return {
      icon: KeyRound,
      textColor: 'text-[#004e8c]',
      bgColor: 'bg-[#deecf9]',
      borderColor: 'border-[#71afe5]',
    };
  }

  // Fallback
  return {
    icon: Layers,
    textColor: 'text-[#323130]',
    bgColor: 'bg-[#f3f2f1]',
    borderColor: 'border-[#edebe9]',
  };
}

export default function CategoryBadge({ name = 'General', className = '', size = 'sm' }: CategoryBadgeProps) {
  const style = getCategoryStyle(name);
  const Icon = style.icon;

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-[3px] border transition-colors ${style.bgColor} ${style.borderColor} ${style.textColor} ${
        isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${className}`}
    >
      <Icon className={isSmall ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
      <span>{name}</span>
    </span>
  );
}
