'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Check,
  Trash2,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Quick Adjustment Modal state
  const [adjustTarget, setAdjustTarget] = useState<any | null>(null);
  const [adjustDirection, setAdjustDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('Manual compensation');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCustomers = () => {
    setLoading(true);
    fetchApi('/admin/customers')
      .then((res) => setCustomers(res?.data || []))
      .catch((e) => {
        console.error(e);
        showToast('Failed to load customers', 'error');
      })
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
      showToast(`✓ Customer account status set to ${newStatus}!`);
      loadCustomers();
    } catch (err: any) {
      showToast(`Could not update status: ${err.message}`, 'error');
    }
  };

  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setIsAdjusting(true);
    try {
      await fetchApi('/admin/wallets/adjust', {
        method: 'POST',
        body: JSON.stringify({
          userId: adjustTarget.id,
          direction: adjustDirection,
          amount: Number(adjustAmount),
          reason: adjustReason,
        }),
      });
      showToast(`✓ Wallet adjusted: ${adjustDirection === 'CREDIT' ? '+' : '-'}$${Number(adjustAmount).toFixed(2)} to ${adjustTarget.firstName}!`);
      setAdjustTarget(null);
      loadCustomers();
    } catch (err: any) {
      showToast(`Adjustment failed: ${err.message}`, 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  const filtered = customers.filter((c) => {
    const matchSearch = c.telegramUsername?.toLowerCase().includes(search.toLowerCase()) ||
      c.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      c.telegramUserId?.includes(search);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Selection helpers
  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const someFilteredSelected = filtered.some((c) => selectedIds.has(c.id));
  const toggleSelectAll = () => { if (allFilteredSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(filtered.map((c) => c.id))); };
  const toggleSelect = (id: string) => { setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map((id) => fetchApi(`/admin/customers/${id}`, { method: 'DELETE' })));
      showToast(`✓ ${ids.length} customer(s) removed!`);
      setSelectedIds(new Set()); setShowBulkDeleteConfirm(false); loadCustomers();
    } catch (err: any) { showToast(`Bulk delete failed: ${err.message}`, 'error'); } finally { setBulkDeleting(false); }
  };

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#201f1e]">Customer Accounts</h2>
        <p className="text-xs text-[#605e5c] mt-0.5">
          Telegram user identities, wallet balances, order frequency, and account freeze protections.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white p-3 rounded-[4px] border border-[#edebe9] shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8886]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username (@...), Telegram numeric ID, or first name..."
            className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-9 pr-3 py-1.5 text-xs text-[#201f1e] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-3 py-1.5 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="FROZEN">Frozen</option>
        </select>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-[#eff6fc] border border-[#c7e0f4] rounded-[4px] px-4 py-2.5 shadow-sm animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#0078d4]">{selectedIds.size} customer{selectedIds.size > 1 ? 's' : ''} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-[11px] text-[#605e5c] hover:text-[#201f1e] underline underline-offset-2">Clear selection</button>
          </div>
          <button onClick={() => setShowBulkDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#a4262c] hover:bg-[#8b2025] text-white text-xs font-semibold shadow-xs transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete Selected
          </button>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-white border border-[#edebe9] rounded-[4px] overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-[#faf9f8] text-[#605e5c] uppercase tracking-wider border-b border-[#edebe9] text-[11px]">
            <tr>
              <th className="px-3 py-3 w-10">
                <input type="checkbox" checked={allFilteredSelected} ref={(el) => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }} onChange={toggleSelectAll} className="h-3.5 w-3.5 rounded-[2px] border-[#8a8886] text-[#0078d4] focus:ring-[#0078d4] cursor-pointer accent-[#0078d4]" />
              </th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Telegram ID</th>
              <th className="px-4 py-3 font-semibold">Wallet Balance</th>
              <th className="px-4 py-3 font-semibold">Total Spent</th>
              <th className="px-4 py-3 font-semibold">Orders Placed</th>
              <th className="px-4 py-3 font-semibold">Account Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edebe9] text-[#201f1e]">
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <tr key={c.id} className={`hover:bg-[#faf9f8] transition ${selectedIds.has(c.id) ? 'bg-[#eff6fc]' : ''}`}>
                  <td className="px-3 py-4">
                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} className="h-3.5 w-3.5 rounded-[2px] border-[#8a8886] text-[#0078d4] focus:ring-[#0078d4] cursor-pointer accent-[#0078d4]" />
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#201f1e]">
                    {c.firstName} {c.lastName}{' '}
                    {c.telegramUsername && (
                      <span className="text-[#0078d4] font-medium">(@{c.telegramUsername})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-[#0078d4]">{c.telegramUserId}</td>
                  <td className="px-6 py-4 font-bold text-[#107c10]">
                    ${Number(c.wallet?.cachedBalance ?? 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-[#605e5c]">
                    ${Number(c.wallet?.totalSpent ?? 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-[#605e5c] font-semibold">{c._count?.orders ?? 0}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-[2px] text-[11px] font-semibold border ${
                        c.status === 'ACTIVE'
                          ? 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]'
                          : 'bg-[#fde7e9] text-[#d13438] border-[#f8bbd0]'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setAdjustTarget(c);
                          setAdjustAmount(10);
                          setAdjustDirection('CREDIT');
                        }}
                        className="px-2.5 py-1 rounded-[4px] bg-[#eff6fc] border border-[#c7e0f4] hover:bg-[#dbeafe] text-[#0078d4] text-[11px] font-medium inline-flex items-center gap-1 shadow-xs transition"
                        title="Adjust balance"
                      >
                        <Wallet className="h-3 w-3" />
                        <span>Adjust</span>
                      </button>

                      <button
                        onClick={() => toggleStatus(c.id, c.status)}
                        className={`px-2.5 py-1 rounded-[4px] text-[11px] font-medium inline-flex items-center gap-1 shadow-xs transition ${
                          c.status === 'ACTIVE'
                            ? 'bg-white border border-[#d2d0ce] hover:bg-[#fde7e9] text-[#605e5c] hover:text-[#d13438]'
                            : 'bg-[#dff6dd] text-[#107c10] border border-[#a8e5a3] hover:bg-[#c7e0f4]'
                        }`}
                      >
                        {c.status === 'ACTIVE' ? (
                          <>
                            <ShieldAlert className="h-3 w-3 text-[#d13438]" />
                            <span>Freeze</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3 w-3 text-[#107c10]" />
                            <span>Unfreeze</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-[#605e5c]">
                  No customers found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Balance Adjustment Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#edebe9] rounded-[4px] p-6 max-w-sm w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#201f1e]">Adjust Balance</h3>
                <p className="text-xs text-[#605e5c] mt-0.5">
                  Customer: <span className="font-semibold text-[#0078d4]">{adjustTarget.firstName}</span> (Balance: ${Number(adjustTarget.wallet?.cachedBalance ?? 0).toFixed(2)})
                </p>
              </div>
              <button
                onClick={() => setAdjustTarget(null)}
                className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Direction</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-[#201f1e] cursor-pointer">
                    <input
                      type="radio"
                      name="direction"
                      checked={adjustDirection === 'CREDIT'}
                      onChange={() => setAdjustDirection('CREDIT')}
                    />
                    <span className="font-medium text-[#107c10]">Credit (+ Add Funds)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[#201f1e] cursor-pointer">
                    <input
                      type="radio"
                      name="direction"
                      checked={adjustDirection === 'DEBIT'}
                      onChange={() => setAdjustDirection('DEBIT')}
                    />
                    <span className="font-medium text-[#d13438]">Debit (- Deduct)</span>
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
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] font-bold text-sm focus:bg-white focus:outline-none focus:border-[#0078d4]"
                />
              </div>

              <div>
                <label className="text-[#605e5c] block mb-1 font-medium">Reason / Note</label>
                <input
                  required
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#edebe9]">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="px-3.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#201f1e] text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting || adjustAmount <= 0}
                  className="px-4 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] disabled:bg-[#c7e0f4] text-white font-medium text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  {isAdjusting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>{isAdjusting ? 'Processing...' : 'Apply Ledger Adjustment'}</span>
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
