'use client';

import { useEffect, useState } from 'react';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function WalletsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');

  // Form
  const [adjustForm, setAdjustForm] = useState({
    userId: '',
    direction: 'CREDIT',
    amount: 10.0,
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchApi('/admin/wallets/transactions'), fetchApi('/admin/customers')])
      .then(([txRes, custRes]) => {
        setTransactions(txRes?.data || []);
        setCustomers(custRes?.data || []);
      })
      .catch((e) => {
        console.error(e);
        showToast('Failed to load ledger', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchApi('/admin/wallets/adjust', {
        method: 'POST',
        body: JSON.stringify({
          ...adjustForm,
          amount: Number(adjustForm.amount),
        }),
      });
      showToast('✓ Wallet adjustment ledger transaction executed successfully!');
      setShowAdjustModal(false);
      setAdjustForm({ userId: '', direction: 'CREDIT', amount: 10.0, reason: '' });
      loadData();
    } catch (err: any) {
      showToast(`Adjustment error: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase();
    const username = tx.wallet?.user?.telegramUsername?.toLowerCase() || '';
    const firstName = tx.wallet?.user?.firstName?.toLowerCase() || '';
    const desc = tx.description?.toLowerCase() || '';
    const type = tx.type?.toLowerCase() || '';

    const matchesSearch = username.includes(q) || firstName.includes(q) || desc.includes(q) || type.includes(q);
    const matchesDirection = directionFilter ? tx.direction === directionFilter : true;
    return matchesSearch && matchesDirection;
  });

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#201f1e]">Wallet Ledger & Accounting</h2>
          <p className="text-xs text-[#605e5c] mt-0.5">
            Auditable double-entry ledger tracking deposits, purchases, refunds, and adjustments.
          </p>
        </div>
        <button
          onClick={() => {
            if (customers.length > 0 && !adjustForm.userId) {
              setAdjustForm((prev) => ({ ...prev, userId: customers[0].id }));
            }
            setShowAdjustModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white font-medium text-xs shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          Manual Adjustment
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-[4px] border border-[#edebe9] shadow-sm">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8886]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, transaction type, or note..."
            className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-9 pr-3 py-1.5 text-xs text-[#201f1e] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4]"
          />
        </div>

        <select
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value)}
          className="bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-3 py-1.5 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
        >
          <option value="">All Directions ({transactions.length})</option>
          <option value="CREDIT">Credit (+ Inflow to User)</option>
          <option value="DEBIT">Debit (- Outflow from User)</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-[#edebe9] rounded-[4px] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#faf9f8] text-[#605e5c] uppercase tracking-wider border-b border-[#edebe9] text-[11px]">
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
          <tbody className="divide-y divide-[#edebe9] text-[#201f1e]">
            {filtered.length > 0 ? (
              filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#faf9f8] transition">
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[10px] font-bold border ${
                        tx.direction === 'CREDIT'
                          ? 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]'
                          : 'bg-[#fde7e9] text-[#d13438] border-[#f8bbd0]'
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
                  <td className="px-6 py-4 text-[#201f1e]">
                    {tx.wallet?.user?.telegramUsername
                      ? `@${tx.wallet.user.telegramUsername}`
                      : tx.wallet?.user?.firstName || 'User'}
                  </td>
                  <td
                    className={`px-6 py-4 font-bold ${
                      tx.direction === 'CREDIT' ? 'text-[#107c10]' : 'text-[#d13438]'
                    }`}
                  >
                    {tx.direction === 'CREDIT' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-[#605e5c]">${Number(tx.balanceBefore).toFixed(2)}</td>
                  <td className="px-6 py-4 font-semibold text-[#201f1e]">${Number(tx.balanceAfter).toFixed(2)}</td>
                  <td className="px-6 py-4 text-[#605e5c] max-w-xs truncate">{tx.description}</td>
                  <td className="px-6 py-4 text-[#605e5c] text-[11px]">
                    {tx.createdAt ? tx.createdAt.slice(0, 10) : '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-[#605e5c]">
                  No ledger transactions match your search or filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#edebe9] rounded-[4px] p-6 max-w-sm w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#201f1e]">Manual Ledger Adjustment</h3>
                <p className="text-xs text-[#605e5c] mt-0.5">Debit or credit a customer wallet balance</p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdjust} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Customer</label>
                <select
                  required
                  value={adjustForm.userId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, userId: e.target.value })}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
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
                <label className="text-[#201f1e] block mb-1 font-semibold">Direction</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-[#201f1e] cursor-pointer">
                    <input
                      type="radio"
                      name="direction"
                      checked={adjustForm.direction === 'CREDIT'}
                      onChange={() => setAdjustForm({ ...adjustForm, direction: 'CREDIT' })}
                    />
                    <span className="font-medium text-[#107c10]">Credit (+ Balance)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[#201f1e] cursor-pointer">
                    <input
                      type="radio"
                      name="direction"
                      checked={adjustForm.direction === 'DEBIT'}
                      onChange={() => setAdjustForm({ ...adjustForm, direction: 'DEBIT' })}
                    />
                    <span className="font-medium text-[#d13438]">Debit (- Balance)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Amount ($ USD)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.10"
                  value={adjustForm.amount}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] font-bold text-sm focus:bg-white focus:outline-none focus:border-[#0078d4]"
                />
              </div>

              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Reason / Note</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Promotional grant, manual compensation"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#edebe9]">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#201f1e] text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || adjustForm.amount <= 0 || !adjustForm.userId}
                  className="px-4 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] disabled:bg-[#c7e0f4] text-white font-medium text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>{isSubmitting ? 'Executing...' : 'Execute Adjustment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-xs font-semibold px-4 py-3 rounded-[4px] shadow-fluentModal flex items-center gap-2 animate-in slide-in-from-bottom-2 ${
            toast.type === 'error' ? 'bg-[#a4262c]' : 'bg-[#107c10]'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-white shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
