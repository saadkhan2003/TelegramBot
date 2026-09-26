'use client';

import { useEffect, useState } from 'react';
import { Users, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadCustomers = () => {
    setLoading(true);
    fetchApi('/admin/customers')
      .then((res) => setCustomers(res.data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    try {
      await fetchApi(`/admin/customers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadCustomers();
    } catch (err: any) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.telegramUsername?.toLowerCase().includes(search.toLowerCase()) ||
      c.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      c.telegramUserId?.includes(search),
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Customer Accounts</h2>
        <p className="text-xs text-slate-400 mt-1">
          Telegram user identities, wallet balances, order frequencies, and account freeze protections.
        </p>
      </div>

      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, Telegram ID, or first name..."
          className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
        />
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
            <tr>
              <th className="px-6 py-3 font-semibold">Customer</th>
              <th className="px-6 py-3 font-semibold">Telegram ID</th>
              <th className="px-6 py-3 font-semibold">Balance</th>
              <th className="px-6 py-3 font-semibold">Total Spent</th>
              <th className="px-6 py-3 font-semibold">Orders</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/30 transition">
                <td className="px-6 py-4 font-medium text-white">
                  {c.firstName} {c.lastName}{' '}
                  {c.telegramUsername && (
                    <span className="text-emerald-400 font-normal">(@{c.telegramUsername})</span>
                  )}
                </td>
                <td className="px-6 py-4 font-mono text-slate-400">{c.telegramUserId}</td>
                <td className="px-6 py-4 font-bold text-emerald-400">
                  ${Number(c.wallet?.cachedBalance ?? 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-slate-300">
                  ${Number(c.wallet?.totalSpent ?? 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-slate-400">{c._count?.orders ?? 0}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => toggleStatus(c.id, c.status)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                  >
                    {c.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
