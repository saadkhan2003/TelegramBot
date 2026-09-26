'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ExternalLink,
  ArrowUpRight,
  Bot,
  Globe,
  Layers,
  Shield,
  Zap,
  CheckCircle2,
  Send,
  MessageSquare,
  Check,
  Terminal,
  Cpu,
  Monitor,
  Database,
  Lock,
  CheckCheck,
  Building2,
  Code2,
  Wrench,
  Clock,
  Briefcase,
  Star,
  Users,
  ChevronRight,
  PhoneCall,
  Mail,
  HelpCircle,
} from 'lucide-react';

export default function StackAndScalePartnerShowcase() {
  const [inquirySent, setInquirySent] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    telegram: '',
    service: 'Telegram Bot & E-Commerce',
    budget: '$5,000 – $15,000',
    details: '',
  });

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySent(true);
    setTimeout(() => {
      setInquirySent(false);
      setFormState({
        name: '',
        email: '',
        telegram: '',
        service: 'Telegram Bot & E-Commerce',
        budget: '$5,000 – $15,000',
        details: '',
      });
    }, 4000);
  };

  // What Stack & Scale offers (Services Catalog for Prospective Clients)
  const softwareServices = [
    {
      id: 'bot-commerce',
      title: 'Telegram Bots & Automated Commerce',
      category: 'BOTS & AUTOMATION',
      badge: 'Signature Specialty',
      highlight: true,
      description:
        'High-throughput Telegram bots with interactive web apps, catalog browsing, instant product dispatch, multi-currency crypto & fiat payments, and 24/7 automated order fulfillment.',
      deliverables: [
        'Instant digital order dispatch & license key delivery',
        'Multi-currency crypto (USDT, BTC, TON) & fiat payment gateways',
        'Interactive Telegram WebApp (TMA) mini-apps & rich inline keyboards',
        'Automated broadcasts, user balance ledgers & admin bot controls',
      ],
      pricing: 'From $4,500',
      timeframe: '2 – 3 Weeks',
    },
    {
      id: 'web-platforms',
      title: 'Full-Stack Web Apps & SaaS Dashboards',
      category: 'WEB ENGINEERING',
      badge: 'Enterprise Grade',
      highlight: false,
      description:
        'Modern, lightning-fast web applications built on Next.js, React, Node.js, and TypeScript. Engineered with high-density distraction-free UI, instant navigation, and complete security.',
      deliverables: [
        'Next.js 15 & React 19 server-side rendered web applications',
        'Enterprise management consoles, double-entry financial ledgers & analytics',
        'Role-Based Access Control (RBAC) with granular operator permissions',
        'Real-time WebSocket event feeds & automated notifications',
      ],
      pricing: 'From $6,500',
      timeframe: '3 – 4 Weeks',
    },
    {
      id: 'local-first-pos',
      title: 'Local-First Retail & POS Software',
      category: 'RETAIL & HARDWARE',
      badge: 'Zero Outages',
      highlight: true,
      description:
        'Cashier and shop floor systems that commit transactions to local embedded SQLite in under 1.2ms. Your counters keep scanning even during complete Wi-Fi blackouts.',
      deliverables: [
        'Zero freeze during Internet cuts (auto-reconciles deltas to cloud master)',
        'Touch-screen cash register, 2D barcode scanner & cash drawer pairing',
        'Offline ESC/POS thermal receipt printing over USB, Serial & LAN',
        'Multi-location real-time inventory and supplier purchase order sync',
      ],
      pricing: 'From $8,000',
      timeframe: '3 – 5 Weeks',
    },
    {
      id: 'sovereignty-migration',
      title: 'Cloud Sovereignty & Private VPC Setup',
      category: 'INFRASTRUCTURE',
      badge: 'Zero SaaS Tax',
      highlight: false,
      description:
        'Eliminate recurring per-seat SaaS charges by bringing operational software onto your own bare-metal servers or private VPC. You own 100% of your code and data.',
      deliverables: [
        '$0 per user / month forever (unlimited operators & terminals)',
        'Complete database custody (PostgreSQL, Redis, MinIO S3 object vault)',
        'Self-hosted Keycloak OIDC with MFA & FIDO2 WebAuthn passkeys',
        'Automated ClamAV antivirus file scanning sandbox on all uploads',
      ],
      pricing: 'From $7,500',
      timeframe: '2 – 4 Weeks',
    },
    {
      id: 'systems-discovery',
      title: 'Systems Discovery & Architecture RFCs',
      category: 'SYSTEMS STRATEGY',
      badge: 'Strategic Planning',
      highlight: false,
      description:
        'Deep technical discovery to map transaction flows, identify bottleneck latency, and produce detailed RFC specifications, data contracts, and rapid prototypes.',
      deliverables: [
        'Operational workflow & latency bottleneck audits',
        'Technical RFC specifications & database schema architecture',
        'Clickable high-fidelity interactive prototypes',
        'Capacity planning & disaster recovery runbooks',
      ],
      pricing: 'From $3,500',
      timeframe: '1 – 2 Weeks',
    },
    {
      id: 'sre-partnership',
      title: '24/7 Dedicated Engineering & 99.999% SLA',
      category: 'MAINTENANCE & SRE',
      badge: 'Continuous Peace of Mind',
      highlight: true,
      description:
        'Hands-on engineering partnership with continuous observability, automated database backups, security patching, and guaranteed uptime incident response.',
      deliverables: [
        'Prometheus & Loki real-time telemetry streaming and alerts',
        'Guaranteed 99.999% operational uptime agreement',
        '1-hour priority emergency incident response',
        'Bi-weekly feature sprints & dedicated systems architect',
      ],
      pricing: 'From $2,500 / mo',
      timeframe: 'Continuous Retainer',
    },
  ];

  // Systems built by Stack & Scale
  const portfolioHighlights = [
    {
      title: 'Delux Store Fleet & Telegram Bot Ecosystem',
      client: 'Delux Store (This Platform)',
      badge: 'Live Case Study',
      description:
        'The very software system you are currently using! A high-frequency Telegram e-commerce bot paired with a Microsoft Fluent admin console, double-entry financial ledger, and instant automated digital fulfillment.',
      metrics: [
        { label: 'Platform SLA', value: '99.999%' },
        { label: 'Settlement Speed', value: '< 2.1s' },
        { label: 'SaaS License Fee', value: '$0 / mo' },
      ],
      stack: ['NestJS', 'Next.js 15', 'PostgreSQL', 'Prisma', 'GrammY', 'Redis'],
    },
    {
      title: 'ALX Connect Digital Signage Fleet Mesh',
      client: 'ALX Media Canada Inc.',
      badge: '1,000+ Commercial Displays',
      description:
        'Enterprise DOOH orchestration operating across 1,000+ restaurant screens across Canada. Store-and-forward media pipeline pre-caches all video assets, guaranteeing zero black screens during internet outages.',
      metrics: [
        { label: 'Active Displays', value: '1,000+' },
        { label: 'Fleet Sync', value: '< 2.4s' },
        { label: 'Outage Downtime', value: '0 sec' },
      ],
      stack: ['Angular 17', 'Flutter', 'SQLite', 'RxJS', 'WebSockets'],
    },
    {
      title: 'Servr Restaurant OS & Local SQLite POS',
      client: 'Servr Hospitality Group',
      badge: 'High-Volume POS',
      description:
        'Offline-resilient restaurant register system that commits orders locally to embedded SQLite in under 1ms, eliminating cashier stalls during lunch rush hours and auto-syncing to cloud master.',
      metrics: [
        { label: 'Local Commit', value: '0.8ms' },
        { label: 'Offline Ready', value: '100%' },
        { label: 'Hardware', value: 'ESC/POS' },
      ],
      stack: ['Tauri', 'Rust', 'SQLite', 'TypeScript', 'Tailwind'],
    },
  ];

  const categories = ['ALL', 'BOTS & AUTOMATION', 'WEB ENGINEERING', 'RETAIL & HARDWARE', 'INFRASTRUCTURE'];

  const filteredServices = softwareServices.filter(
    (s) => activeCategory === 'ALL' || s.category === activeCategory,
  );

  return (
    <div className="space-y-8 max-w-7xl pb-16 font-sans">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: OFFICIAL SOFTWARE HOUSE ADVERTISEMENT                     */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-[#faf9f8] to-[#eff6fc] border border-[#c7e0f4] p-6 sm:p-10 shadow-[0_4px_24px_rgba(0,120,212,0.08)]">
        {/* Soft background glow decoration */}
        <div className="absolute -top-12 -right-12 w-96 h-96 bg-[#0078d4]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-[#80ddd1]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Row: Attribution Badge & External Links */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#c7e0f4] text-xs font-semibold text-[#0078d4] shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-[#0078d4]" />
              <span>OFFICIAL DEVELOPMENT AGENCY &amp; PLATFORM CREATOR</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://stackandscale.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs font-semibold shadow-xs transition"
              >
                <span>Visit stackandscale.org</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>

              <a
                href="#contact-agency"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-[#edebe9] hover:bg-[#faf9f8] text-[#201f1e] text-xs font-semibold shadow-2xs transition"
              >
                <MessageSquare className="h-3.5 w-3.5 text-[#0078d4]" />
                <span>Hire Us</span>
              </a>
            </div>
          </div>

          {/* Main Brand Section with Horizontal Logo */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-2">
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center gap-3">
                <img
                  src="/brand/stack-and-scale-horizontal.png"
                  alt="Stack & Scale"
                  className="h-11 sm:h-13 w-auto object-contain filter drop-shadow-xs"
                />
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1b1a19] tracking-tight leading-tight">
                The Engineering Software House Behind Delux Store.
              </h1>

              <p className="text-sm sm:text-base text-[#605e5c] leading-relaxed font-normal">
                This entire e-commerce ecosystem, automated Telegram bot fleet, and double-entry ledger were designed, built, and launched by <strong className="text-[#1b1a19] font-semibold">Stack &amp; Scale</strong>. We engineer high-performance custom software, retail POS systems, and intelligent bots for growing businesses worldwide.
              </p>

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#edebe9] font-medium text-[#201f1e] shadow-2xs">
                  <Bot className="h-3.5 w-3.5 text-[#0078d4]" /> Telegram Bot Specialists
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#edebe9] font-medium text-[#201f1e] shadow-2xs">
                  <Globe className="h-3.5 w-3.5 text-[#107c10]" /> Full-Stack Next.js &amp; NestJS
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#edebe9] font-medium text-[#201f1e] shadow-2xs">
                  <Zap className="h-3.5 w-3.5 text-[#d83b01]" /> Sub-Millisecond Speed
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-[#edebe9] font-medium text-[#201f1e] shadow-2xs">
                  <Shield className="h-3.5 w-3.5 text-[#5c2d91]" /> 100% Owned Source Code
                </span>
              </div>
            </div>

            {/* Delux Store Endorsement Card */}
            <div className="lg:w-88 p-5 rounded-xl bg-white border border-[#c7e0f4] shadow-sm space-y-3 shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#eff6fc] rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] font-mono font-semibold text-[#107c10] bg-[#dff6dd] px-2 py-0.5 rounded-full border border-[#a8e5a3]">
                  Verified Client
                </span>
              </div>

              <blockquote className="text-xs text-[#323130] leading-relaxed italic">
                “Stack &amp; Scale engineered our entire Telegram digital store bot and management hub from scratch. Orders process in seconds, the financial ledger is rock-solid, and our staff operates seamlessly with zero lag.”
              </blockquote>

              <div className="pt-2 border-t border-[#edebe9] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#1b1a19]">M. Saad</p>
                  <p className="text-[10px] text-[#605e5c]">Founder &amp; Owner, Delux Store</p>
                </div>
                <div className="h-7 w-7 rounded-[6px] bg-[#051329] p-1 border border-[#0078d4]/30 overflow-hidden shrink-0">
                  <img src="/icons/icon-192.png" alt="Delux Store" className="h-full w-full object-cover rounded-[4px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LIVE PROOF OF WORK: WHAT STACK & SCALE BUILT FOR DELUX STORE           */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0078d4]">
              <Sparkles className="h-3.5 w-3.5" /> In-Action Demonstration
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#1b1a19]">
              What We Engineered For Delux Store
            </h2>
          </div>
          <span className="text-xs text-[#605e5c] hidden sm:inline">
            Turnkey enterprise delivery in under 4 weeks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white border border-[#edebe9] hover:border-[#c7e0f4] hover:shadow-xs transition space-y-3">
            <div className="h-10 w-10 rounded-lg bg-[#eff6fc] border border-[#c7e0f4] flex items-center justify-center text-[#0078d4]">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1b1a19]">Telegram Commerce Bot</h3>
            <p className="text-xs text-[#605e5c] leading-relaxed">
              Automated Telegram store bot handling customer browsing, instant checkout, and automatic delivery of digital products.
            </p>
            <div className="text-[11px] font-mono text-[#0078d4] font-semibold pt-1">
              ✓ GrammY · NestJS · Redis Queue
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#edebe9] hover:border-[#c7e0f4] hover:shadow-xs transition space-y-3">
            <div className="h-10 w-10 rounded-lg bg-[#dff6dd] border border-[#a8e5a3] flex items-center justify-center text-[#107c10]">
              <Monitor className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1b1a19]">Enterprise Admin Console</h3>
            <p className="text-xs text-[#605e5c] leading-relaxed">
              Microsoft Fluent-styled web dashboard with bulk product actions, inventory controls, order tracking, and live audit trails.
            </p>
            <div className="text-[11px] font-mono text-[#107c10] font-semibold pt-1">
              ✓ Next.js 15 · Tailwind · PWA
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#edebe9] hover:border-[#c7e0f4] hover:shadow-xs transition space-y-3">
            <div className="h-10 w-10 rounded-lg bg-[#f4edf9] border border-[#e2d5ef] flex items-center justify-center text-[#5c2d91]">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1b1a19]">Double-Entry Ledger</h3>
            <p className="text-xs text-[#605e5c] leading-relaxed">
              Financial accounting ledger with multi-currency wallets, automated deposit reviews, manual adjustments, and zero balance drift.
            </p>
            <div className="text-[11px] font-mono text-[#5c2d91] font-semibold pt-1">
              ✓ PostgreSQL · Decimal Math · Audits
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#edebe9] hover:border-[#c7e0f4] hover:shadow-xs transition space-y-3">
            <div className="h-10 w-10 rounded-lg bg-[#fff4ce] border border-[#fed9cc] flex items-center justify-center text-[#8a3707]">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1b1a19]">Sovereign Cloud &amp; Security</h3>
            <p className="text-xs text-[#605e5c] leading-relaxed">
              Self-hosted on owned VPC infrastructure with zero monthly per-seat license taxes and automated ClamAV antivirus file scanning.
            </p>
            <div className="text-[11px] font-mono text-[#8a3707] font-semibold pt-1">
              ✓ Docker · ClamAV · Zero Lock-In
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SOFTWARE HOUSE SERVICES CATALOG (WHAT WE CAN BUILD FOR YOU)           */}
      {/* ========================================================================= */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#edebe9] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0078d4]">
              <Wrench className="h-3.5 w-3.5" /> Capabilities &amp; Offerings
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#1b1a19]">
              Software Development Services For Your Business
            </h2>
            <p className="text-xs text-[#605e5c] mt-0.5">
              Looking for custom engineering? Here is what our software house can build for your brand.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#0078d4] text-white font-semibold shadow-xs'
                    : 'bg-white border border-[#edebe9] text-[#605e5c] hover:text-[#201f1e] hover:bg-[#faf9f8]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`p-6 rounded-xl bg-white border transition-all duration-200 flex flex-col justify-between ${
                service.highlight
                  ? 'border-[#0078d4]/40 shadow-xs hover:border-[#0078d4] hover:shadow-md'
                  : 'border-[#edebe9] hover:border-[#c7e0f4] hover:shadow-xs'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0078d4] bg-[#eff6fc] px-2 py-0.5 rounded-[4px] border border-[#c7e0f4]">
                    {service.category}
                  </span>
                  <span className="text-[10px] font-semibold text-[#107c10] bg-[#dff6dd] px-2 py-0.5 rounded-full border border-[#a8e5a3]">
                    {service.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#1b1a19] tracking-tight">
                  {service.title}
                </h3>

                <p className="text-xs text-[#605e5c] leading-relaxed">
                  {service.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-[#edebe9]">
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8a8886]">
                    Included Deliverables
                  </div>
                  <ul className="space-y-1.5">
                    {service.deliverables.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#323130]">
                        <Check className="h-3.5 w-3.5 text-[#107c10] shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-[#edebe9] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#8a8886] uppercase font-mono">Investment</div>
                  <div className="text-xs font-bold text-[#1b1a19] font-mono mt-0.5">{service.pricing}</div>
                  <div className="text-[10px] text-[#605e5c]">{service.timeframe}</div>
                </div>

                <a
                  href="#contact-agency"
                  onClick={() => setFormState((prev) => ({ ...prev, service: service.title }))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#eff6fc] hover:bg-[#0078d4] text-[#0078d4] hover:text-white text-xs font-semibold border border-[#c7e0f4] transition"
                >
                  <span>Request Quote</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. OTHER CLIENT SYSTEMS ENGINEERED BY STACK & SCALE                       */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0078d4]">
              <Briefcase className="h-3.5 w-3.5" /> Proven Track Record
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#1b1a19]">
              Other Production Systems Built By Stack &amp; Scale
            </h2>
          </div>
          <a
            href="https://stackandscale.org/work"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#0078d4] hover:underline flex items-center gap-1"
          >
            <span>View All Case Studies</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {portfolioHighlights.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl bg-white border border-[#edebe9] hover:border-[#c7e0f4] hover:shadow-xs transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0078d4] bg-[#eff6fc] px-2 py-0.5 rounded-[4px] border border-[#c7e0f4]">
                  {item.badge}
                </span>

                <h3 className="text-base font-bold text-[#1b1a19] tracking-tight">
                  {item.title}
                </h3>
                <p className="text-[11px] font-semibold text-[#8a8886]">
                  Client: {item.client}
                </p>

                <p className="text-xs text-[#605e5c] leading-relaxed">
                  {item.description}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-lg bg-[#faf9f8] border border-[#edebe9]">
                  {item.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="text-center">
                      <div className="text-[9px] text-[#8a8886] uppercase font-mono">{m.label}</div>
                      <div className="text-xs font-bold text-[#1b1a19] font-mono mt-0.5">{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div className="pt-3 border-t border-[#edebe9] flex flex-wrap gap-1">
                {item.stack.map((t, tIdx) => (
                  <span
                    key={tIdx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f3f2f1] text-[#605e5c] border border-[#e1dfdd]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE INQUIRY FORM: HIRE THE SOFTWARE HOUSE                      */}
      {/* ========================================================================= */}
      <div id="contact-agency" className="scroll-mt-8 pt-4">
        <div className="rounded-2xl border border-[#c7e0f4] bg-white p-6 sm:p-10 shadow-[0_4px_24px_rgba(0,120,212,0.06)] relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Software House Pitch & Direct Links */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff6fc] border border-[#c7e0f4] text-xs font-semibold text-[#0078d4]">
                <Sparkles className="h-3.5 w-3.5" /> Start Your Project
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1b1a19] tracking-tight">
                Ready to build custom software or an automated bot?
              </h2>

              <p className="text-xs sm:text-sm text-[#605e5c] leading-relaxed">
                Connect directly with the software architects behind Delux Store. We turn ambitious digital concepts into reliable, production-ready systems.
              </p>

              {/* Direct Channels */}
              <div className="space-y-3 pt-2">
                <a
                  href="https://t.me/stackandscale"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#faf9f8] border border-[#edebe9] hover:border-[#c7e0f4] hover:bg-[#eff6fc] transition group"
                >
                  <div className="h-9 w-9 rounded-lg bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#1b1a19] group-hover:text-[#0078d4]">
                      Telegram Direct Channel
                    </div>
                    <div className="text-[11px] text-[#605e5c]">@stackandscale · Instant chat</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[#8a8886] group-hover:text-[#0078d4]" />
                </a>

                <a
                  href="mailto:contact@stackandscale.org"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#faf9f8] border border-[#edebe9] hover:border-[#c7e0f4] hover:bg-[#eff6fc] transition group"
                >
                  <div className="h-9 w-9 rounded-lg bg-[#107c10]/10 text-[#107c10] flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#1b1a19] group-hover:text-[#0078d4]">
                      Official Agency Email
                    </div>
                    <div className="text-[11px] text-[#605e5c]">contact@stackandscale.org</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[#8a8886] group-hover:text-[#0078d4]" />
                </a>

                <a
                  href="https://stackandscale.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#faf9f8] border border-[#edebe9] hover:border-[#c7e0f4] hover:bg-[#eff6fc] transition group"
                >
                  <div className="h-9 w-9 rounded-lg bg-[#0078d4]/10 text-[#0078d4] flex items-center justify-center shrink-0">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#1b1a19] group-hover:text-[#0078d4]">
                      Official Agency Website
                    </div>
                    <div className="text-[11px] text-[#605e5c]">https://stackandscale.org</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[#8a8886] group-hover:text-[#0078d4]" />
                </a>
              </div>
            </div>

            {/* Right Column: Project Inquiry Form */}
            <div className="lg:col-span-7 bg-[#faf9f8] border border-[#edebe9] rounded-xl p-6 sm:p-8">
              {inquirySent ? (
                <div className="py-12 text-center space-y-3 animate-in fade-in duration-200">
                  <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCheck className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1b1a19]">Inquiry Dispatched Successfully!</h3>
                  <p className="text-xs text-[#605e5c] max-w-md mx-auto leading-relaxed">
                    Thank you! Your project inquiry has been delivered directly to the Stack &amp; Scale software engineering team. A lead architect will review your requirements and follow up within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div className="border-b border-[#edebe9] pb-3 mb-2">
                    <h3 className="text-sm font-bold text-[#1b1a19]">Direct Project Consultation Request</h3>
                    <p className="text-[11px] text-[#605e5c]">Fill out this brief form to receive an engineering proposal</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#323130] mb-1">Your Full Name</label>
                      <input
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        placeholder="e.g. Alex Henderson"
                        className="w-full bg-white border border-[#d2d0ce] rounded-lg px-3 py-1.5 text-xs text-[#201f1e] focus:outline-none focus:border-[#0078d4]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#323130] mb-1">Company / Project Name</label>
                      <input
                        type="text"
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        placeholder="e.g. Retail Corp / Startup"
                        className="w-full bg-white border border-[#d2d0ce] rounded-lg px-3 py-1.5 text-xs text-[#201f1e] focus:outline-none focus:border-[#0078d4]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#323130] mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="alex@company.com"
                        className="w-full bg-white border border-[#d2d0ce] rounded-lg px-3 py-1.5 text-xs text-[#201f1e] focus:outline-none focus:border-[#0078d4]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#323130] mb-1">Telegram Handle (Optional)</label>
                      <input
                        type="text"
                        value={formState.telegram}
                        onChange={(e) => setFormState({ ...formState, telegram: e.target.value })}
                        placeholder="@username"
                        className="w-full bg-white border border-[#d2d0ce] rounded-lg px-3 py-1.5 text-xs text-[#201f1e] focus:outline-none focus:border-[#0078d4]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#323130] mb-1">Service Needed</label>
                      <select
                        value={formState.service}
                        onChange={(e) => setFormState({ ...formState, service: e.target.value })}
                        className="w-full bg-white border border-[#d2d0ce] rounded-lg px-3 py-1.5 text-xs text-[#201f1e] focus:outline-none focus:border-[#0078d4]"
                      >
                        <option value="Telegram Bot & E-Commerce">Telegram Bot &amp; E-Commerce</option>
                        <option value="Full-Stack Web App / SaaS">Full-Stack Web App / SaaS</option>
                        <option value="Local-First Retail & POS">Local-First Retail &amp; POS</option>
                        <option value="Cloud Sovereignty Migration">Cloud Sovereignty Migration</option>
                        <option value="Systems Discovery & Architecture">Systems Discovery &amp; Architecture</option>
                        <option value="24/7 Dedicated SRE Retainer">24/7 Dedicated SRE Retainer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#323130] mb-1">Target Budget</label>
                      <select
                        value={formState.budget}
                        onChange={(e) => setFormState({ ...formState, budget: e.target.value })}
                        className="w-full bg-white border border-[#d2d0ce] rounded-lg px-3 py-1.5 text-xs text-[#201f1e] focus:outline-none focus:border-[#0078d4]"
                      >
                        <option value="$3,500 – $7,500">$3,500 – $7,500</option>
                        <option value="$7,500 – $15,000">$7,500 – $15,000</option>
                        <option value="$15,000+ Enterprise">$15,000+ Enterprise</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#323130] mb-1">Project Scope &amp; Requirements</label>
                    <textarea
                      rows={3}
                      value={formState.details}
                      onChange={(e) => setFormState({ ...formState, details: e.target.value })}
                      placeholder="Briefly describe what you would like Stack & Scale to engineer for you..."
                      className="w-full bg-white border border-[#d2d0ce] rounded-lg p-2.5 text-xs text-[#201f1e] focus:outline-none focus:border-[#0078d4]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] text-[#8a8886]">
                      🔒 Confidential &amp; Protected by NDA
                    </span>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Project Inquiry</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
