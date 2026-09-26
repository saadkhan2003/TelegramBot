'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Search,
  RotateCcw,
  Zap,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [refundModal, setRefundModal] = useState<{ open: boolean; orderId?: string; orderNumber?: string }>({
    open: false,
  });
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  // Fulfill modal state for wholesaler on-demand workflow
  const [fulfillModal, setFulfillModal] = useState<{
    open: boolean;
    orderId?: string;
    orderNumber?: string;
    productName?: string;
    customer?: string;
  }>({ open: false });
  const [fulfillPayload, setFulfillPayload] = useState('');
  const [fulfillNotes, setFulfillNotes] = useState('');
  const [isFulfilling, setIsFulfilling] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadOrders = () => {
    setLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : '';
    fetchApi(`/admin/orders${query}`)
      .then((res) => setOrders(res?.data || []))
      .catch((e) => {
        console.error(e);
        showToast('Failed to load orders', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleRefund = async () => {
    if (!refundModal.orderId) return;
    setIsRefunding(true);
    try {
      await fetchApi(`/admin/orders/${refundModal.orderId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ reason: refundReason }),
      });
      showToast('✓ Order refunded and customer wallet balance credited!');
      setRefundModal({ open: false });
      setRefundReason('');
      loadOrders();
    } catch (err: any) {
      showToast(`Refund failed: ${err.message}`, 'error');
    } finally {
      setIsRefunding(false);
    }
  };

  const handleFulfill = async () => {
    if (!fulfillModal.orderId || !fulfillPayload.trim()) return;
    setIsFulfilling(true);
    try {
      await fetchApi(`/admin/orders/${fulfillModal.orderId}/fulfill`, {
        method: 'POST',
        body: JSON.stringify({ payload: fulfillPayload, notes: fulfillNotes }),
      });
      showToast('✓ Order fulfilled! Credentials delivered to buyer on Telegram.');
      setFulfillModal({ open: false });
      setFulfillPayload('');
      setFulfillNotes('');
      loadOrders();
    } catch (err: any) {
      showToast(`Fulfillment failed: ${err.message}`, 'error');
    } finally {
      setIsFulfilling(false);
    }
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const orderNum = o.orderNumber?.toLowerCase() || '';
    const username = o.user?.telegramUsername?.toLowerCase() || '';
    const firstName = o.user?.firstName?.toLowerCase() || '';
    return orderNum.includes(q) || username.includes(q) || firstName.includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#201f1e]">Customer Orders</h2>
        <p className="text-xs text-[#605e5c] mt-0.5">
          Wholesaler manual fulfillment queue, instant automatic key deliveries, and wallet refund management.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-[4px] border border-[#edebe9] shadow-sm">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8886]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or customer username..."
            className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-9 pr-3 py-1.5 text-xs text-[#201f1e] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-3 py-1.5 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
        >
          <option value="">All Statuses ({orders.length})</option>
          <option value="PROCESSING">⚡ PROCESSING (Wholesaler Sourcing Queue)</option>
          <option value="FULFILLED">FULFILLED (Completed & Delivered)</option>
          <option value="REFUNDED">REFUNDED</option>
          <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#edebe9] rounded-[4px] overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-[#faf9f8] text-[#605e5c] uppercase tracking-wider border-b border-[#edebe9] text-[11px]">
            <tr>
              <th className="px-6 py-3 font-semibold">Order ID</th>
              <th className="px-6 py-3 font-semibold">Customer</th>
              <th className="px-6 py-3 font-semibold">Purchased Item(s)</th>
              <th className="px-6 py-3 font-semibold">Total</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edebe9] text-[#201f1e]">
            {filtered.length > 0 ? (
              filtered.map((o) => (
                <tr key={o.id} className="hover:bg-[#faf9f8] transition">
                  <td className="px-6 py-4 font-mono font-medium text-[#0078d4]">
                    #{o.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-[#201f1e]">
                    {o.user?.telegramUsername ? `@${o.user.telegramUsername}` : o.user?.firstName || 'User'}
                  </td>
                  <td className="px-6 py-4 text-[#201f1e]">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-[#0078d4] shrink-0" />
                      <span className="font-medium">
                        {o.items?.map((i: any) => `${i.quantity}x ${i.productNameSnapshot}`).join(', ') || 'No item details'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#201f1e]">${Number(o.total).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-[2px] text-[11px] font-semibold border ${
                        o.status === 'FULFILLED'
                          ? 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]'
                          : o.status === 'PROCESSING'
                          ? 'bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4] animate-pulse'
                          : o.status === 'REFUNDED'
                          ? 'bg-[#fff4ce] text-[#8a3707] border-[#fed9cc]'
                          : 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#605e5c] text-[11px]">
                    {o.createdAt ? o.createdAt.slice(0, 10) : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedOrderDetails(o)}
                        className="p-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#605e5c] hover:text-[#201f1e] shadow-xs transition"
                        title="View Full Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      {o.status === 'PROCESSING' && (
                        <button
                          onClick={() =>
                            setFulfillModal({
                              open: true,
                              orderId: o.id,
                              orderNumber: o.orderNumber,
                              productName: o.items?.[0]?.productNameSnapshot,
                              customer: o.user?.telegramUsername
                                ? `@${o.user.telegramUsername}`
                                : o.user?.firstName,
                            })
                          }
                          className="px-2.5 py-1 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white font-medium text-[11px] inline-flex items-center gap-1 shadow-xs transition"
                        >
                          <Zap className="h-3 w-3" />
                          <span>Fulfill</span>
                        </button>
                      )}

                      {o.status === 'FULFILLED' && (
                        <button
                          onClick={() =>
                            setRefundModal({
                              open: true,
                              orderId: o.id,
                              orderNumber: o.orderNumber,
                            })
                          }
                          className="px-2.5 py-1 rounded-[4px] bg-white border border-[#d2d0ce] hover:bg-[#f3f2f1] text-[#605e5c] hover:text-[#d13438] text-[11px] inline-flex items-center gap-1 shadow-xs transition"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Refund</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-[#605e5c]">
                  No orders found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Wholesaler Manual Fulfill Modal */}
      {fulfillModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#edebe9] rounded-[4px] p-6 max-w-md w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#201f1e]">Fulfill Order #{fulfillModal.orderNumber}</h3>
                <p className="text-xs text-[#605e5c] mt-0.5">
                  Item: <strong>{fulfillModal.productName}</strong> for{' '}
                  <span className="text-[#0078d4] font-medium">{fulfillModal.customer}</span>
                </p>
              </div>
              <button
                onClick={() => setFulfillModal({ open: false })}
                className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">
                  Credentials / Key / Activation URL
                </label>
                <textarea
                  rows={4}
                  placeholder={`Paste the digital key or credentials purchased from your wholesaler:\nusername:password\nhttps://license.domain/activate?code=...`}
                  value={fulfillPayload}
                  onChange={(e) => setFulfillPayload(e.target.value)}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] font-mono focus:bg-white focus:outline-none focus:border-[#0078d4]"
                />
              </div>

              <div>
                <label className="text-[#605e5c] block mb-1 font-medium">Internal Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sourced from wholesaler X @ $7.50"
                  value={fulfillNotes}
                  onChange={(e) => setFulfillNotes(e.target.value)}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#edebe9]">
              <button
                type="button"
                onClick={() => setFulfillModal({ open: false })}
                className="px-3.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#201f1e] text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFulfill}
                disabled={isFulfilling || !fulfillPayload.trim()}
                className="px-4 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] disabled:bg-[#c7e0f4] text-white font-medium text-xs shadow-xs transition flex items-center gap-1.5"
              >
                {isFulfilling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                <span>{isFulfilling ? 'Delivering...' : 'Fulfill & Send to Customer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#edebe9] rounded-[4px] p-6 max-w-sm w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#201f1e]">Refund Order #{refundModal.orderNumber}</h3>
                <p className="text-xs text-[#605e5c] mt-0.5">
                  The full purchase amount will be credited back to the customer's internal wallet balance.
                </p>
              </div>
              <button
                onClick={() => setRefundModal({ open: false })}
                className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-[#201f1e] block font-semibold">Refund Reason</label>
              <input
                type="text"
                placeholder="e.g. Out of stock with wholesaler, defective key"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#edebe9]">
              <button
                onClick={() => setRefundModal({ open: false })}
                className="px-3.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#201f1e] text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={isRefunding || !refundReason.trim()}
                className="px-4 py-1.5 rounded-[4px] bg-[#d13438] hover:bg-[#a4262c] disabled:bg-[#f8bbd0] text-white font-medium text-xs shadow-xs transition flex items-center gap-1.5"
              >
                {isRefunding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                <span>{isRefunding ? 'Processing...' : 'Execute Refund'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#edebe9] rounded-[4px] p-6 max-w-lg w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#201f1e]">Order #{selectedOrderDetails.orderNumber} Details</h3>
                <span className="text-[11px] text-[#605e5c]">Placed on {selectedOrderDetails.createdAt?.slice(0, 19).replace('T', ' ')}</span>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#faf9f8] rounded-[4px] border border-[#edebe9]">
                <div>
                  <span className="text-[#605e5c] block text-[11px]">Customer</span>
                  <span className="font-semibold text-[#201f1e]">
                    {selectedOrderDetails.user?.telegramUsername
                      ? `@${selectedOrderDetails.user.telegramUsername}`
                      : selectedOrderDetails.user?.firstName}
                  </span>
                </div>
                <div>
                  <span className="text-[#605e5c] block text-[11px]">Total Paid</span>
                  <span className="font-bold text-[#107c10] text-sm">${Number(selectedOrderDetails.total).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[#605e5c] block text-[11px]">Status</span>
                  <span className="font-semibold text-[#0078d4]">{selectedOrderDetails.status}</span>
                </div>
                <div>
                  <span className="text-[#605e5c] block text-[11px]">Payment Method</span>
                  <span className="font-medium text-[#201f1e]">{selectedOrderDetails.paymentMethod || 'Internal Wallet'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-[#201f1e] mb-1">Purchased Products</h4>
                <div className="border border-[#edebe9] rounded-[4px] divide-y divide-[#edebe9]">
                  {selectedOrderDetails.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#201f1e]">{item.productNameSnapshot}</p>
                        <p className="text-[11px] text-[#605e5c]">Quantity: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}</p>
                      </div>
                      <span className="font-bold text-[#201f1e]">${(item.quantity * Number(item.unitPrice)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrderDetails.fulfillmentNotes && (
                <div className="p-3 bg-[#eff6fc] border border-[#c7e0f4] rounded-[4px]">
                  <p className="font-semibold text-[#0078d4] text-[11px]">Fulfillment Notes</p>
                  <p className="text-[#201f1e] text-xs mt-0.5">{selectedOrderDetails.fulfillmentNotes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#edebe9]">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs font-medium shadow-xs transition"
              >
                Close
              </button>
            </div>
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
