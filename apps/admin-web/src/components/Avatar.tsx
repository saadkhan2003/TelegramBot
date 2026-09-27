'use client';

import React, { useState } from 'react';
import { getNotionistAvatarUrl } from '../lib/avatar';

interface AvatarProps {
  name?: string | null;
  email?: string | null;
  seed?: string | null;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnline?: boolean;
  alt?: string;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-12 w-12 text-base',
};

const badgeSizeClasses = {
  xs: 'h-1.5 w-1.5 border-[1px]',
  sm: 'h-2 w-2 border-[1.5px]',
  md: 'h-2.5 w-2.5 border-2',
  lg: 'h-3 w-3 border-2',
  xl: 'h-3.5 w-3.5 border-2',
};

export function Avatar({
  name,
  email,
  seed,
  src,
  size = 'md',
  className = '',
  showOnline = false,
  alt,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const effectiveSeed = seed || email || name || 'delux_user';
  const avatarUrl = src || getNotionistAvatarUrl(effectiveSeed);
  const displayName = name || email || seed || 'User';

  const initials = (name || email || 'U')
    .replace(/[^\w\s]/g, '')
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`relative inline-block shrink-0 select-none ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-[#f1f5f9] border border-[#e2e8f0] shadow-2xs flex items-center justify-center transition-transform`}
      >
        {!hasError ? (
          <img
            src={avatarUrl}
            alt={alt || displayName}
            loading="lazy"
            decoding="async"
            onError={() => setHasError(true)}
            className="h-full w-full object-cover rounded-full"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-tr from-[#0f172a] via-[#1e293b] to-[#334155] text-white flex items-center justify-center font-bold tracking-wider">
            {initials}
          </div>
        )}
      </div>

      {showOnline && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full bg-[#107c10] border-white ${badgeSizeClasses[size]}`}
          title="Active Session"
        />
      )}
    </div>
  );
}
