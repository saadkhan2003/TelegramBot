'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ArrowDownCircle,
  Check,
  ExternalLink,
  Coins,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Copy,
  Trash2,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { Pagination } from '../../components/Pagination';
import { SearchableSelect } from '../../components/SearchableSelect';
import { Modal } from '../../components/Modal';

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Approve modal state
  const [approveModal, setApproveModal] = useState<{
    open: boolean;
    depositId?: string;
    depositNumber?: string;
    reportedAmount?: number;
    customer?: string;
    network?: string;
    txHash?: string;
    pkrAmount?: number;
    pkrRate?: number;
    method?: string;
  }>({ open: false });
  const [creditAmount, setCreditAmount] = useState<number>(10);
  const [creditNotes, setCreditNotes] = useState('Approved via admin control panel');
  const [isCrediting, setIsCrediting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadDeposits = () => {
    setLoading(true);
    fetchApi('/admin/deposits')
      .then((res) => setDeposits(res?.data || []))
      .catch((e) => {
        console.error(e);
        showToast('Failed to load deposits', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const openApprove = (d: any) => {
    const vData = d.verificationData || {};
    const pkrRate = Number(vData.pkrRate || 280);
    let calculatedUsd = Number(d.verifiedAmount || d.reportedAmount || 0);

    if (!calculatedUsd && vData.pkrAmount) {
      calculatedUsd = Number((Number(vData.pkrAmount) / pkrRate).toFixed(2));
    }
    if (!calculatedUsd || calculatedUsd <= 0) {
      calculatedUsd = 10;
    }

    setApproveModal({
      open: true,
      depositId: d.id,
      depositNumber: d.depositNumber,
      reportedAmount: calculatedUsd,
      customer: d.user?.telegramUsername ? `@${d.user.telegramUsername}` : d.user?.firstName || 'User',
      network: d.network?.name,
      txHash: d.transactionHash,
      pkrAmount: vData.pkrAmount ? Number(vData.pkrAmount) : undefined,
      pkrRate,
      method: d.network?.name,
    });
    setCreditAmount(calculatedUsd);
    setCreditNotes(`Approved ${d.network?.name || 'Local'} deposit #${d.depositNumber}`);
  };

  const handleManualCredit = async () => {
    if (!approveModal.depositId) return;
    setIsCrediting(true);
    try {
      await fetchApi(`/admin/deposits/${approveModal.depositId}/credit`, {
        method: 'POST',
        body: JSON.stringify({ amount: Number(creditAmount), notes: creditNotes }),
      });
      showToast(`✓ $${Number(creditAmount).toFixed(2)} successfully credited to customer wallet!`);
      setApproveModal({ open: false });
      loadDeposits();
    } catch (err: any) {
      showToast(`Failed to credit deposit: ${err.message}`, 'error');
    } finally {
      setIsCrediting(false);
    }
  };

  const copyHash = (hash: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(hash);
      setCopiedId(id);
      showToast('✓ Transaction hash copied!');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filtered = deposits.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (d.depositNumber?.toLowerCase() || '').includes(q) ||
      (d.user?.telegramUsername?.toLowerCase() || '').includes(q) ||
      (d.transactionHash?.toLowerCase() || '').includes(q);

    const matchesStatus = statusFilter ? d.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const paginatedDeposits = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Selection helpers
  const allFilteredSelected = filtered.length > 0 && filtered.every((d) => selectedIds.has(d.id));
  const someFilteredSelected = filtered.some((d) => selectedIds.has(d.id));
  const toggleSelectAll = () => { if (allFilteredSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(filtered.map((d) => d.id))); };
  const toggleSelect = (id: string) => { setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };

  const statusFilterOptions = useMemo(
    () => [
      { value: '', label: `All Statuses (${deposits.length})` },
      { value: 'MANUAL_REVIEW', label: '⚠️ MANUAL_REVIEW (Needs Approval)', badge: 'Review', badgeColor: 'bg-[#fff4ce] text-[#8a3707] border-[#fed9cc]' },
      { value: 'CREDITED', label: 'CREDITED (Approved)', badge: 'Approved', badgeColor: 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]' },
      { value: 'EXPIRED', label: 'EXPIRED', badge: 'Expired', badgeColor: 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]' },
      { value: 'FAILED', label: 'FAILED', badge: 'Failed', badgeColor: 'bg-[#fde7e9] text-[#a4262c] border-[#f8d2d4]' },
    ],
    [deposits.length]
  );

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#201f1e]">Deposits & Payment Verification</h2>
        <p className="text-xs text-[#605e5c] mt-0.5">
          Verify and credit customer deposits: JazzCash, EasyPaisa, Pakistani Banks (Raast), and Cryptocurrency on-chain ledger.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-[4px] border border-[#edebe9] shadow-sm">
        <div className="relative flex-1 min-w-0">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8886]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by deposit number, username, or tx hash..."
            className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-9 pr-3 py-1.5 text-xs text-[#201f1e] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4]"
          />
        </div>

        <SearchableSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusFilterOptions}
          searchable={false}
          className="w-full sm:w-64 shrink-0"
        />
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-[#eff6fc] border border-[#c7e0f4] rounded-[4px] px-4 py-2.5 shadow-sm animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#0078d4]">{selectedIds.size} deposit{selectedIds.size > 1 ? 's' : ''} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-[11px] text-[#605e5c] hover:text-[#201f1e] underline underline-offset-2">Clear selection</button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#a4262c] hover:bg-[#8b2025] text-white text-xs font-semibold shadow-xs transition">
            <Trash2 className="h-3.5 w-3.5" /> Delete Selected
          </button>
        </div>
      )}

      {/* Deposits Table */}
      <div className="bg-white border border-[#edebe9] rounded-[4px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-[#faf9f8] text-[#605e5c] uppercase tracking-wider border-b border-[#edebe9] text-[11px]">
            <tr>
              <th className="px-3 py-3 w-10">
                <input type="checkbox" checked={allFilteredSelected} ref={(el) => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }} onChange={toggleSelectAll} className="h-3.5 w-3.5 rounded-[2px] border-[#8a8886] text-[#0078d4] focus:ring-[#0078d4] cursor-pointer accent-[#0078d4]" />
              </th>
              <th className="px-4 py-3 font-semibold">Deposit ID</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Network</th>
              <th className="px-4 py-3 font-semibold">Transaction Hash</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edebe9] text-[#201f1e]">
            {paginatedDeposits.length > 0 ? (
              paginatedDeposits.map((d) => (
                <tr key={d.id} className={`hover:bg-[#faf9f8] transition ${selectedIds.has(d.id) ? 'bg-[#eff6fc]' : ''}`}>
                  <td className="px-3 py-4">
                    <input type="checkbox" checked={selectedIds.has(d.id)} onChange={() => toggleSelect(d.id)} className="h-3.5 w-3.5 rounded-[2px] border-[#8a8886] text-[#0078d4] focus:ring-[#0078d4] cursor-pointer accent-[#0078d4]" />
                  </td>
                  <td className="px-6 py-4 font-mono font-medium text-[#0078d4]">
                    #{d.depositNumber}
                  </td>
                  <td className="px-6 py-4 text-[#201f1e]">
                    {d.user?.telegramUsername ? `@${d.user.telegramUsername}` : d.user?.firstName || 'User'}
                  </td>
                  <td className="px-6 py-4">
                    {d.network?.chain === 'JAZZCASH' || d.network?.name?.includes('JazzCash') ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#fdf3f2] border border-[#f8d2d4] text-[#d13438] font-bold text-[11px]">
                        <span>📱</span>
                        <span>JazzCash</span>
                      </span>
                    ) : d.network?.chain === 'EASYPAISA' || d.network?.name?.includes('EasyPaisa') ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#dff6dd] border border-[#b4e6b2] text-[#107c10] font-bold text-[11px]">
                        <span>🟢</span>
                        <span>EasyPaisa</span>
                      </span>
                    ) : d.network?.chain === 'BANK_PK' || d.network?.name?.includes('Bank') ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#eff6fc] border border-[#c7e0f4] text-[#0078d4] font-bold text-[11px]">
                        <span>🏦</span>
                        <span>Bank / Raast</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#eff6fc] border border-[#c7e0f4] text-[#0078d4] font-semibold text-[11px]">
                        <Coins className="h-3 w-3" />
                        <span>{d.network?.name || 'Crypto'}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-[#0078d4]">
                    <div className="flex items-center gap-1.5">
                      <span title={d.transactionHash} className="font-semibold text-[#201f1e]">
                        {d.transactionHash && d.transactionHash.length > 20
                          ? `${d.transactionHash.slice(0, 8)}...${d.transactionHash.slice(-6)}`
                          : d.transactionHash || '—'}
                      </span>
                      {d.transactionHash && (
                        <button
                          onClick={() => copyHash(d.transactionHash, d.id)}
                          className="p-1 rounded-[4px] hover:bg-[#eff6fc] text-[#605e5c] hover:text-[#0078d4]"
                          title="Copy TID"
                        >
                          {copiedId === d.id ? (
                            <Check className="h-3 w-3 text-[#107c10]" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const vData = d.verificationData || {};
                      const pkrAmount = vData.pkrAmount;
                      const usdAmount = Number(d.verifiedAmount ?? d.reportedAmount ?? 0);

                      if (d.status === 'CREDITED') {
                        return (
                          <div>
                            <span className="font-bold text-[#107c10]">${usdAmount.toFixed(2)} USD</span>
                            {pkrAmount && (
                              <span className="text-[11px] text-[#605e5c] block font-normal">
                                Rs. {Number(pkrAmount).toLocaleString()} PKR
                              </span>
                            )}
                          </div>
                        );
                      }

                      if (pkrAmount) {
                        return (
                          <div>
                            <span className="font-bold text-[#201f1e]">Rs. {Number(pkrAmount).toLocaleString()} PKR</span>
                            <span className="text-[11px] text-[#0078d4] block font-medium">
                              ~${usdAmount > 0 ? usdAmount.toFixed(2) : (Number(pkrAmount) / 280).toFixed(2)} USD
                            </span>
                          </div>
                        );
                      }

                      if (usdAmount > 0) {
                        return <span className="font-bold text-[#201f1e]">${usdAmount.toFixed(2)} USD</span>;
                      }

                      return (
                        <div>
                          <span className="inline-flex px-1.5 py-0.5 rounded-[2px] bg-[#fff4ce] text-[#8a3707] font-semibold text-[10px]">
                            Pending Review
                          </span>
                          <span className="text-[10px] text-[#605e5c] block mt-0.5">Verify TID amount</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-[2px] text-[11px] font-semibold border ${
                        d.status === 'CREDITED'
                          ? 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]'
                          : d.status === 'MANUAL_REVIEW'
                          ? 'bg-[#fff4ce] text-[#8a3707] border-[#fed9cc] animate-pulse'
                          : 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {d.status !== 'CREDITED' ? (
                      <button
                        onClick={() => openApprove(d)}
                        className="px-2.5 py-1 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white text-[11px] font-medium inline-flex items-center gap-1 shadow-xs transition"
                      >
                        <Check className="h-3 w-3" />
                        <span>Approve Credit</span>
                      </button>
                    ) : (
                      <span className="text-[#107c10] font-medium text-[11px]">✓ Settled</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-[#605e5c]">
                  No deposits match your search or filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="deposits"
        />
      </div>

      {/* Approve Deposit Modal */}
      <Modal isOpen={approveModal.open} onClose={() => setApproveModal({ open: false })}>
        <div className="bg-white border border-[#edebe9] rounded-[4px] p-6 max-w-sm w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#201f1e]">Approve Deposit #{approveModal.depositNumber}</h3>
                <p className="text-xs text-[#605e5c] mt-0.5">
                  Customer: <span className="font-semibold text-[#0078d4]">{approveModal.customer}</span> ({approveModal.network})
                </p>
                {approveModal.txHash && (
                  <p className="text-[11px] font-mono text-[#605e5c] mt-1">
                    TID: <strong className="text-[#201f1e]">{approveModal.txHash}</strong>
                  </p>
                )}
              </div>
              <button
                onClick={() => setApproveModal({ open: false })}
                className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {approveModal.pkrAmount && (
                <div className="p-2.5 rounded-[4px] bg-[#eff6fc] border border-[#c7e0f4] flex items-center justify-between text-xs">
                  <span className="text-[#0078d4] font-semibold">Customer Paid (Reported):</span>
                  <span className="font-bold text-[#201f1e]">
                    Rs. {approveModal.pkrAmount.toLocaleString()} PKR{' '}
                    <span className="text-[#107c10] font-medium">
                      (~${(approveModal.pkrAmount / (approveModal.pkrRate || 280)).toFixed(2)} USD)
                    </span>
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#201f1e] font-semibold">Amount to Credit ($ USD)</label>
                  <span className="text-[10px] text-[#605e5c]">Rate: ~280 PKR = $1.00</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] font-bold text-sm focus:bg-white focus:outline-none focus:border-[#0078d4]"
                />
              </div>

              {/* Quick PKR conversion buttons */}
              <div>
                <span className="text-[10px] text-[#605e5c] block mb-1">Quick PKR Presets:</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setCreditAmount(1.07)}
                    className="px-2 py-0.5 rounded-[2px] bg-[#f3f2f1] hover:bg-[#edebe9] text-[10px] font-semibold text-[#201f1e]"
                  >
                    Rs. 300 ($1.07)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditAmount(1.79)}
                    className="px-2 py-0.5 rounded-[2px] bg-[#f3f2f1] hover:bg-[#edebe9] text-[10px] font-semibold text-[#201f1e]"
                  >
                    Rs. 500 ($1.79)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditAmount(3.57)}
                    className="px-2 py-0.5 rounded-[2px] bg-[#f3f2f1] hover:bg-[#edebe9] text-[10px] font-semibold text-[#201f1e]"
                  >
                    Rs. 1,000 ($3.57)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditAmount(5.00)}
                    className="px-2 py-0.5 rounded-[2px] bg-[#f3f2f1] hover:bg-[#edebe9] text-[10px] font-semibold text-[#201f1e]"
                  >
                    Rs. 1,400 ($5.00)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditAmount(10.00)}
                    className="px-2 py-0.5 rounded-[2px] bg-[#f3f2f1] hover:bg-[#edebe9] text-[10px] font-semibold text-[#201f1e]"
                  >
                    Rs. 2,800 ($10.00)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[#605e5c] block mb-1 font-medium">Approval Notes</label>
                <input
                  type="text"
                  value={creditNotes}
                  onChange={(e) => setCreditNotes(e.target.value)}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#edebe9]">
              <button
                type="button"
                onClick={() => setApproveModal({ open: false })}
                className="px-3.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#201f1e] text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualCredit}
                disabled={isCrediting || creditAmount <= 0}
                className="px-4 py-1.5 rounded-[4px] bg-[#107c10] hover:bg-[#0b5a0b] disabled:bg-[#a8e5a3] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
              >
                {isCrediting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>{isCrediting ? 'Crediting...' : 'Credit Wallet'}</span>
              </button>
            </div>
          </div>
      </Modal>

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
