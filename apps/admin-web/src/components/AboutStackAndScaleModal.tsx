'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Globe, X } from 'lucide-react';

interface AboutStackAndScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutStackAndScaleModal({ isOpen, onClose }: AboutStackAndScaleModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-lg rounded-xs border border-zinc-200 bg-white p-6 shadow-2xl space-y-4 text-zinc-900 animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 rounded-xs p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-3.5 text-xs text-zinc-600 leading-relaxed max-h-[75vh] overflow-y-auto pr-1.5 pt-1 thin-scrollbar">
          {/* Logo & Headline */}
          <div className="rounded-xs bg-zinc-50/80 border border-zinc-200 p-6 flex flex-col items-center justify-center text-center gap-3">
            <img
              src="/brand/stack-and-scale-logo.png"
              alt="Stack & Scale - Sovereign Software & Enterprise Systems"
              className="h-10 sm:h-12 w-auto max-w-[85%] object-contain"
            />
            <p className="text-xs text-zinc-500 font-normal max-w-sm">
              Software built for store floors, warehouses, and real operations.
            </p>
          </div>

          {/* Executive & Company Info */}
          <div className="rounded-xs border border-zinc-200 bg-zinc-50/50 p-3 flex items-center justify-between gap-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                FOUNDER &amp; CEO
              </span>
              <span className="font-semibold text-zinc-900 text-sm">
                Muhammad Saad Khan
              </span>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                OFFICIAL PORTAL
              </span>
              <a
                href="https://stackandscale.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-zinc-800 hover:text-black hover:underline text-xs"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                <span>stackandscale.org</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </div>

          {/* 4 Core Pillars from stackandscale.org */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xs border border-zinc-200 p-3 bg-white space-y-1">
              <div className="font-semibold text-zinc-900 text-xs">100% Sovereignty</div>
              <p className="text-[11px] text-zinc-500">
                Self-hosted, air-gapped ready architecture with complete local data custody and zero vendor lock-in.
              </p>
            </div>
            <div className="rounded-xs border border-zinc-200 p-3 bg-white space-y-1">
              <div className="font-semibold text-zinc-900 text-xs">Zero Per-Seat SaaS Tax</div>
              <p className="text-[11px] text-zinc-500">
                Unlimited cashiers, staff members, and devices. Never pay arbitrary recurring per-user penalties.
              </p>
            </div>
            <div className="rounded-xs border border-zinc-200 p-3 bg-white space-y-1">
              <div className="font-semibold text-zinc-900 text-xs">Sub-Second Offline Engine</div>
              <p className="text-[11px] text-zinc-500">
                Terminals commit sales to local SQLite in under 1.2ms without freezes during internet outages.
              </p>
            </div>
            <div className="rounded-xs border border-zinc-200 p-3 bg-white space-y-1">
              <div className="font-semibold text-zinc-900 text-xs">Enterprise Security</div>
              <p className="text-[11px] text-zinc-500">
                Native Rust engine, scrypt cryptographic key derivation, local audit ledger, and strict privacy.
              </p>
            </div>
          </div>

          {/* Services & Deployment Models */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider block">
              Services &amp; Solutions We Provide
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="rounded-xs border border-zinc-200 bg-white p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-zinc-900 text-xs font-semibold">Self-Hosted Deployments</strong>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                    On-Premise
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  100% offline local hardware or private VPC. Air-gapped reliability, zero downtime during internet drops, full database custody, and zero per-seat SaaS fees.
                </p>
              </div>

              <div className="rounded-xs border border-zinc-200 bg-white p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-zinc-900 text-xs font-semibold">SaaS &amp; Managed Cloud</strong>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Cloud Apps
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Cloud apps &amp; managed infrastructure. Multi-branch real-time sync, centralized head-office analytics, automated remote backups, and 99.999% SLA uptime.
                </p>
              </div>
            </div>

            {/* Custom Enterprise Engineering & Hardware */}
            <div className="rounded-xs bg-zinc-50 border border-zinc-200 p-3 space-y-1.5 text-[11px]">
              <strong className="text-zinc-900 font-semibold block">Custom Enterprise Engineering &amp; Hardware</strong>
              <div className="grid grid-cols-2 gap-2 text-zinc-500 text-[10.5px]">
                <div>• Hardware: Thermal printers, barcode scanners &amp; cash drawers</div>
                <div>• Modules: Tailored ledgers, wholesale &amp; installment pipelines</div>
                <div>• Multi-Store: Edge replication &amp; branch consolidation</div>
                <div>• Delivery: White-glove legacy migration &amp; 24/7 technical support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar: Visit Link + Black Close Button */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-200">
          <a
            href="https://stackandscale.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:underline"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            Visit stackandscale.org
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-5 bg-black hover:bg-zinc-800 text-white font-normal text-xs rounded-xs shadow-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
