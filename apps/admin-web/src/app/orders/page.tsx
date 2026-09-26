'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag, Search, RotateCcw } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundModal, setRefundModal] = useState<{ open: boolean; orderId?: string; orderNumber?: string }>({
    open: false,
  });
  const [refundReason, setRefundReason] = useState('');

  const loadOrders = () => {
    setLoading(true);
    fetchApi('/admin/orders')
      .then((res) => setOrders(res.data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRefund = async () => {
    if (!refundModal.orderId) return;
    try {
      await fetchApi(`/admin/orders/${refundModal.orderId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ reason: refundReason }),
      });
      alert('Order successfully refunded and customer wallet credited!');
      setRefundModal({ open: false });
      setRefundReason('');
      loadOrders();
    } catch (err: any) {
      alert(`Refund failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Customer Orders</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time atomic checkout logs, product snapshots, and automated digital delivery states.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
            <tr>
              <th className="px-6 py-3 font-semibold">Order</th>
              <th className="px-6 py-3 font-semibold">Customer</th>
              <th className="px-6 py-3 font-semibold">Items</th>
              <th className="px-6 py-3 font-semibold">Total</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-800/30 transition">
                <td className="px-6 py-4 font-mono font-medium text-emerald-400">
                  #{o.orderNumber}
                </td>
                <td className="px-6 py-4 text-slate-300">
                  {o.user?.telegramUsername ? `@${o.user.telegramUsername}` : o.user?.firstName || 'User'}
                </td>
                <td className="px-6 py-4 text-slate-400">
                  {o.items?.map((i: any) => `${i.quantity}x ${i.productNameSnapshot}`).join(', ')}
                </td>
                <td className="px-6 py-4 font-bold text-white">${Number(o.total).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                      o.status === 'FULFILLED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : o.status === 'REFUNDED'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 text-[11px]">
                  {o.createdAt.slice(0, 10)}
                </td>
                <td className="px-6 py-4 text-right">
                  {o.status === 'FULFILLED' && (
                    <button
                      onClick={() =>
                        setRefundModal({
                          open: true,
                          orderId: o.id,
                          orderNumber: o.orderNumber,
                        })
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-[11px] inline-flex items-center gap-1 transition"
                    >
                      <RotateCcw className="h-3 w-3" /> Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Refund Modal */}
      {refundModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-sm font-bold text-white">Refund Order #{refundModal.orderNumber}</h3>
            <p className="text-xs text-slate-400">
              The full amount will be credited back to the customer's internal wallet ledger.
            </p>
            <div className="space-y-2 text-xs">
              <label className="text-slate-400 block">Refund Reason</label>
              <input
                type="text"
                placeholder="e.g. Defective code, customer requested"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRefundModal({ open: false })}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundReason}
                className="px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold text-xs"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
