'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, ShieldAlert, MessageSquare, Check, RefreshCw } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function SupportPage() {
  const [tab, setTab] = useState<'tickets' | 'warranty'>('tickets');
  const [tickets, setTickets] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply modal
  const [replyModal, setReplyModal] = useState<{ open: boolean; ticketId?: string; ticketNumber?: string }>({
    open: false,
  });
  const [replyText, setReplyText] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchApi('/admin/tickets'), fetchApi('/admin/warranty')])
      .then(([tRes, wRes]) => {
        setTickets(tRes.data || []);
        setClaims(wRes.data || []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReply = async () => {
    if (!replyModal.ticketId || !replyText.trim()) return;
    try {
      await fetchApi(`/admin/tickets/${replyModal.ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText }),
      });
      alert('Reply sent to customer on Telegram!');
      setReplyModal({ open: false });
      setReplyText('');
      loadData();
    } catch (err: any) {
      alert(`Reply error: ${err.message}`);
    }
  };

  const handleApproveReplacement = async (claimId: string) => {
    if (!confirm('Approve replacement? This will select available stock and assign it to the customer.')) {
      return;
    }
    try {
      await fetchApi(`/admin/warranty/${claimId}/approve-replacement`, {
        method: 'POST',
      });
      alert('Replacement approved and new stock allocated!');
      loadData();
    } catch (err: any) {
      alert(`Replacement error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Support & Warranty Center</h2>
        <p className="text-xs text-slate-400 mt-1">
          Live customer ticket conversations and warranty replacement management.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            tab === 'tickets'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Support Tickets ({tickets.length})
        </button>
        <button
          onClick={() => setTab('warranty')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            tab === 'warranty'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Warranty Claims ({claims.length})
        </button>
      </div>

      {tab === 'tickets' ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Ticket</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Last Message</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {tickets.map((t) => {
                const lastMsg = t.messages?.[t.messages.length - 1];
                return (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4 font-mono font-medium text-emerald-400">
                      #{t.ticketNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {t.user?.telegramUsername ? `@${t.user.telegramUsername}` : t.user?.firstName}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{t.category}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-400">
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-sm truncate">
                      {lastMsg?.messageText || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          setReplyModal({
                            open: true,
                            ticketId: t.id,
                            ticketNumber: t.ticketNumber,
                          })
                        }
                        className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px] inline-flex items-center gap-1 font-semibold"
                      >
                        Reply
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Claim</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Product</th>
                <th className="px-6 py-3 font-semibold">Reason</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {claims.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-mono font-medium text-emerald-400">
                    #{c.claimNumber}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {c.user?.telegramUsername ? `@${c.user.telegramUsername}` : c.user?.firstName}
                  </td>
                  <td className="px-6 py-4 text-slate-200">
                    {c.orderItem?.product?.name || 'Item'}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{c.reason}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-400">
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {c.status === 'OPEN' && (
                      <button
                        onClick={() => handleApproveReplacement(c.id)}
                        className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px] inline-flex items-center gap-1 font-semibold"
                      >
                        <RefreshCw className="h-3 w-3" /> Approve Replacement
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reply Modal */}
      {replyModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-white">Reply to Ticket #{replyModal.ticketNumber}</h3>
            <textarea
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response. This will be sent directly to the user in Telegram."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReplyModal({ open: false })}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-semibold text-xs"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
