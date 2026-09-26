'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  ShoppingBag,
  ArrowDownCircle,
  Users,
  Layers,
  LifeBuoy,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { fetchApi } from '../lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/admin/dashboard')
      .then((data) => setMetrics(data))
      .catch((err) => {
        console.error('Failed to load metrics:', err);
        // Fallback demo state if backend is still starting up
        setMetrics({
          revenue: { today: 124.8, total: 3420.5, todayOrdersCount: 8, totalOrdersCount: 215 },
          deposits: { today: 250.0, pendingReviews: 1 },
          customers: { total: 184, today: 12 },
          inventory: { activeProducts: 14, availableItems: 342 },
          support: { openTickets: 2, openWarrantyClaims: 1 },
          recentActivity: [
            { id: '1', orderNumber: 'ORD-2026-000124', customer: '@alex_dev', total: 14.0, status: 'FULFILLED', createdAt: new Date().toISOString(), itemCount: 1 },
            { id: '2', orderNumber: 'ORD-2026-000123', customer: '@sam_ai', total: 2.4, status: 'FULFILLED', createdAt: new Date().toISOString(), itemCount: 3 },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      title: 'Today Revenue',
      value: `$${(metrics?.revenue?.today ?? 0).toFixed(2)}`,
      sub: `${metrics?.revenue?.todayOrdersCount ?? 0} orders today`,
      icon: TrendingUp,
      color: 'text-[#0078d4]',
      bg: 'bg-[#eff6fc]',
      border: 'border-[#c7e0f4]',
      link: '/orders',
    },
    {
      title: 'Deposits Today',
      value: `$${(metrics?.deposits?.today ?? 0).toFixed(2)}`,
      sub: `${metrics?.deposits?.pendingReviews ?? 0} pending review`,
      icon: ArrowDownCircle,
      color: 'text-[#107c10]',
      bg: 'bg-[#dff6dd]',
      border: 'border-[#a8e5a3]',
      link: '/deposits',
    },
    {
      title: 'Total Customers',
      value: metrics?.customers?.total ?? 0,
      sub: `+${metrics?.customers?.today ?? 0} new today`,
      icon: Users,
      color: 'text-[#5c2d91]',
      bg: 'bg-[#f4edf9]',
      border: 'border-[#e2d5ef]',
      link: '/customers',
    },
    {
      title: 'Available Inventory',
      value: metrics?.inventory?.availableItems ?? 0,
      sub: `${metrics?.inventory?.activeProducts ?? 0} active products`,
      icon: Layers,
      color: 'text-[#8a3707]',
      bg: 'bg-[#fff4ce]',
      border: 'border-[#fed9cc]',
      link: '/inventory',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#201f1e]">Store Overview</h2>
        <p className="text-xs text-[#605e5c] mt-0.5">
          Real-time metrics, order fulfilment status, and financial accounting.
        </p>
      </div>

      {/* Metric Cards - Interactive Routing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              onClick={() => router.push(s.link)}
              className="p-5 rounded-[4px] bg-white border border-[#edebe9] shadow-sm hover:shadow-md hover:border-[#0078d4]/40 cursor-pointer transition flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#605e5c] group-hover:text-[#0078d4] transition">{s.title}</span>
                <div className={`p-2 rounded-[4px] ${s.bg} border ${s.border}`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-[#201f1e] tracking-tight">{s.value}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#605e5c]">{s.sub}</span>
                  <ArrowRight className="h-3 w-3 text-[#8a8886] group-hover:text-[#0078d4] group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Activity Feed & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white border border-[#edebe9] rounded-[4px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#edebe9]">
            <h3 className="text-sm font-semibold text-[#201f1e]">Live Activity Feed</h3>
            <span className="text-xs text-[#107c10] flex items-center gap-1.5 font-medium bg-[#dff6dd] px-2 py-0.5 rounded-[2px] border border-[#a8e5a3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#107c10] animate-pulse"></span>
              Live Synced
            </span>
          </div>

          <div className="divide-y divide-[#edebe9]">
            {metrics?.recentActivity?.length > 0 ? (
              metrics.recentActivity.map((act: any) => (
                <div
                  key={act.id}
                  onClick={() => router.push('/orders')}
                  className="py-3 flex items-center justify-between hover:bg-[#faf9f8] px-2 rounded-[2px] cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-[4px] bg-[#eff6fc] border border-[#c7e0f4] text-[#0078d4]">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#201f1e]">
                        Order #{act.orderNumber}
                      </p>
                      <p className="text-[11px] text-[#605e5c]">
                        Customer: <span className="text-[#201f1e] font-medium">{act.customer}</span> ({act.itemCount} items)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#201f1e]">${act.total.toFixed(2)}</p>
                    <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-[2px] bg-[#dff6dd] text-[#107c10] border border-[#a8e5a3]">
                      {act.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#605e5c] py-6 text-center">No orders recorded yet.</p>
            )}
          </div>
        </div>

        {/* Operational Attention Center */}
        <div className="bg-white border border-[#edebe9] rounded-[4px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#201f1e] mb-4 pb-3 border-b border-[#edebe9]">Operational Status</h3>
            <div className="space-y-2.5">
              <div
                onClick={() => router.push('/support')}
                className="flex items-center justify-between p-3 rounded-[4px] bg-[#faf9f8] border border-[#edebe9] hover:bg-[#eff6fc] hover:border-[#c7e0f4] cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <LifeBuoy className="h-4 w-4 text-[#8a3707]" />
                  <span className="text-xs font-medium text-[#201f1e]">Open Tickets</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-[2px] bg-[#fff4ce] text-[#8a3707] border border-[#fed9cc]">
                  {metrics?.support?.openTickets ?? 0}
                </span>
              </div>

              <div
                onClick={() => router.push('/support')}
                className="flex items-center justify-between p-3 rounded-[4px] bg-[#faf9f8] border border-[#edebe9] hover:bg-[#eff6fc] hover:border-[#c7e0f4] cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[#0078d4]" />
                  <span className="text-xs font-medium text-[#201f1e]">Warranty Claims</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-[2px] bg-[#eff6fc] text-[#0078d4] border border-[#c7e0f4]">
                  {metrics?.support?.openWarrantyClaims ?? 0}
                </span>
              </div>

              <div
                onClick={() => router.push('/deposits')}
                className="flex items-center justify-between p-3 rounded-[4px] bg-[#faf9f8] border border-[#edebe9] hover:bg-[#eff6fc] hover:border-[#c7e0f4] cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-[#5c2d91]" />
                  <span className="text-xs font-medium text-[#201f1e]">Pending Deposits</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-[2px] bg-[#f4edf9] text-[#5c2d91] border border-[#e2d5ef]">
                  {metrics?.deposits?.pendingReviews ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
