'use client';

import { useEffect, useState } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function WalletsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  const [adjustForm, setAdjustForm] = useState({
    userId: '',
    direction: 'CREDIT',
    amount: 10.0,
    reason: '',
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchApi('/admin/wallets/transactions'), fetchApi('/admin/customers')])
      .then(([txRes, custRes]) => {
        setTransactions(txRes.data || []);
        setCustomers(custRes.data || []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/admin/wallets/adjust', {
        method: 'POST',
        body: JSON.stringify(adjustForm),
      });
      alert('Wallet adjustment ledger transaction executed successfully!');
      setShowAdjustModal(false);
      setAdjustForm({ userId: '', direction: 'CREDIT', amount: 10.0, reason: '' });
      loadData();
    } catch (err: any) {
      alert(`Adjustment error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Wallet Ledger & Accounting</h2>
          <p className="text-xs text-slate-400 mt-1">
            Auditable double-entry ledger tracking deposits, purchases, refunds, and adjustments.
          </p>
        </div>
        <button
          onClick={() => setShowAdjustModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition"
        >
          <Plus className="h-4 w-4" />
          Manual Adjustment
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
            <tr>
              <th className="px-6 py-3 font-semibold">Type</th>
              <th className="px-6 py-3 font-semibold">Customer</th>
              <th className="px-6 py-3 font-semibold">Amount</th>
              <th className="px-6 py-3 font-semibold">Balance Before</th>
              <th className="px-6 py-3 font-semibold">Balance After</th>
              <th className="px-6 py-3 font-semibold">Description</th>
              <th className="px-6 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.direction === 'CREDIT'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {tx.direction === 'CREDIT' ? (
                      <ArrowDownLeft className="h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="h-3 w-3" />
                    )}
                    {tx.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-300">
                  {tx.wallet?.user?.telegramUsername
                    ? `@${tx.wallet.user.telegramUsername}`
                    : tx.wallet?.user?.firstName || 'User'}
                </td>
                <td
                  className={`px-6 py-4 font-bold ${
                    tx.direction === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {tx.direction === 'CREDIT' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-slate-400">${Number(tx.balanceBefore).toFixed(2)}</td>
                <td className="px-6 py-4 font-medium text-white">${Number(tx.balanceAfter).toFixed(2)}</td>
                <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{tx.description}</td>
                <td className="px-6 py-4 text-slate-400 text-[11px]">{tx.createdAt.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-white">Manual Ledger Adjustment</h3>
            <form onSubmit={handleAdjust} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Customer</label>
                <select
                  required
                  value={adjustForm.userId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, userId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} (@{c.telegramUsername || c.telegramUserId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Direction</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="direction"
                      checked={adjustForm.direction === 'CREDIT'}
                      onChange={() => setAdjustForm({ ...adjustForm, direction: 'CREDIT' })}
                    />
                    Credit (+ Balance)
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="direction"
                      checked={adjustForm.direction === 'DEBIT'}
                      onChange={() => setAdjustForm({ ...adjustForm, direction: 'DEBIT' })}
                    />
                    Debit (- Balance)
                  </label>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Amount ($ USD)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={adjustForm.amount}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, amount: parseFloat(e.target.value) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Reason / Note</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Promotional grant, manual compensation"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold"
                >
                  Execute Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
