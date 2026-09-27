'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  backdropClassName?: string;
  preventBackdropClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  children,
  className = '',
  backdropClassName = '',
  preventBackdropClose = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150 select-none ${backdropClassName}`}
      onClick={(e) => {
        if (!preventBackdropClose && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`relative max-h-[92vh] overflow-y-auto thin-scrollbar select-text ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
