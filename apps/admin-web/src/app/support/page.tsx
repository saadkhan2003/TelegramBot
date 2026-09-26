'use client';

import { useEffect, useState } from 'react';
import {
  LifeBuoy,
  ShieldAlert,
  MessageSquare,
  Check,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Send,
  User,
  Shield,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import CategoryBadge from '../../components/CategoryBadge';

export default function SupportPage() {
  const [tab, setTab] = useState<'tickets' | 'warranty'>('tickets');
  const [tickets, setTickets] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Reply modal
  const [replyModal, setReplyModal] = useState<{
    open: boolean;
    ticketId?: string;
    ticketNumber?: string;
    customer?: string;
    messages?: any[];
  }>({
    open: false,
  });
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Warranty approve modal
  const [approveClaimId, setApproveClaimId] = useState<string | null>(null);
  const [isApprovingClaim, setIsApprovingClaim] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchApi('/admin/tickets'),
      fetchApi('/admin/warranty'),
    ])
      .then(([tRes, wRes]) => {
        setTickets(tRes?.data || []);
        setClaims(wRes?.data || []);
      })
      .catch((e) => {
        console.error(e);
        showToast('Failed to load support data', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const openTicketReply = (t: any) => {
    setReplyModal({
      open: true,
      ticketId: t.id,
      ticketNumber: t.ticketNumber,
      customer: t.user?.telegramUsername ? `@${t.user.telegramUsername}` : t.user?.firstName || 'User',
      messages: t.messages || [],
    });
    setReplyText('');
  };

  const handleReply = async () => {
    if (!replyModal.ticketId || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      await fetchApi(`/admin/tickets/${replyModal.ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText }),
      });
      showToast('✓ Response delivered directly to customer on Telegram!');
      setReplyModal({ open: false });
      setReplyText('');
      loadData();
    } catch (err: any) {
      showToast(`Reply error: ${err.message}`, 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleApproveReplacement = async () => {
    if (!approveClaimId) return;
    setIsApprovingClaim(true);
    try {
      await fetchApi(`/admin/warranty/${approveClaimId}/approve-replacement`, {
        method: 'POST',
      });
      showToast('✓ Warranty claim approved! New stock key allocated and sent.');
      setApproveClaimId(null);
      loadData();
    } catch (err: any) {
      showToast(`Replacement error: ${err.message}`, 'error');
    } finally {
      setIsApprovingClaim(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (t.ticketNumber?.toLowerCase() || '').includes(q) ||
      (t.user?.telegramUsername?.toLowerCase() || '').includes(q) ||
      (t.category?.toLowerCase() || '').includes(q);

    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const filteredClaims = claims.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (c.claimNumber?.toLowerCase() || '').includes(q) ||
      (c.user?.telegramUsername?.toLowerCase() || '').includes(q) ||
      (c.reason?.toLowerCase() || '').includes(q);

    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#201f1e]">Support & Warranty Center</h2>
        <p className="text-xs text-[#605e5c] mt-0.5">
          Live customer ticket conversations delivered to Telegram and warranty replacement management.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#edebe9] pb-2">
        <button
          onClick={() => {
            setTab('tickets');
            setStatusFilter('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-[4px] text-xs font-medium transition ${
            tab === 'tickets'
              ? 'bg-[#eff6fc] text-[#0078d4] font-semibold border border-[#c7e0f4]'
              : 'text-[#605e5c] hover:text-[#201f1e] hover:bg-[#faf9f8]'
          }`}
        >
          <LifeBuoy className="h-4 w-4" />
          <span>Support Tickets ({tickets.length})</span>
        </button>
        <button
          onClick={() => {
            setTab('warranty');
            setStatusFilter('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-[4px] text-xs font-medium transition ${
            tab === 'warranty'
              ? 'bg-[#eff6fc] text-[#0078d4] font-semibold border border-[#c7e0f4]'
              : 'text-[#605e5c] hover:text-[#201f1e] hover:bg-[#faf9f8]'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Warranty Claims ({claims.length})</span>
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
            placeholder={tab === 'tickets' ? 'Search tickets by number, customer, or category...' : 'Search claims by number or buyer...'}
            className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-9 pr-3 py-1.5 text-xs text-[#201f1e] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-3 py-1.5 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
        >
          <option value="">All Statuses</option>
          {tab === 'tickets' ? (
            <>
              <option value="OPEN">OPEN</option>
              <option value="WAITING_USER">WAITING_USER</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </>
          ) : (
            <>
              <option value="OPEN">OPEN (Needs Review)</option>
              <option value="APPROVED">APPROVED (Replacement Issued)</option>
              <option value="REJECTED">REJECTED</option>
            </>
          )}
        </select>
      </div>

      {/* Main Table */}
      {tab === 'tickets' ? (
        <div className="bg-white border border-[#edebe9] rounded-[4px] overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-[#faf9f8] text-[#605e5c] uppercase tracking-wider border-b border-[#edebe9] text-[11px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Ticket ID</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Category</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Latest Message</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edebe9] text-[#201f1e]">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => {
                  const lastMsg = t.messages?.[t.messages.length - 1];
                  return (
                    <tr key={t.id} className="hover:bg-[#faf9f8] transition">
                      <td className="px-6 py-4 font-mono font-medium text-[#0078d4]">
                        #{t.ticketNumber}
                      </td>
                      <td className="px-6 py-4 text-[#201f1e]">
                        {t.user?.telegramUsername ? `@${t.user.telegramUsername}` : t.user?.firstName || 'User'}
                      </td>
                      <td className="px-6 py-4">
                        <CategoryBadge name={t.category} />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-[2px] text-[11px] font-semibold border ${
                            t.status === 'OPEN'
                              ? 'bg-[#fff4ce] text-[#8a3707] border-[#fed9cc]'
                              : t.status === 'RESOLVED'
                              ? 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]'
                              : 'bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4]'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#605e5c] max-w-sm truncate">
                        {lastMsg?.messageText || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openTicketReply(t)}
                          className="px-2.5 py-1 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white text-[11px] inline-flex items-center gap-1 font-medium shadow-xs transition"
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>Reply</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#605e5c]">
                    No support tickets match your search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-[#edebe9] rounded-[4px] overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-[#faf9f8] text-[#605e5c] uppercase tracking-wider border-b border-[#edebe9] text-[11px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Claim ID</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Target Product</th>
                <th className="px-6 py-3 font-semibold">Reported Reason</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edebe9] text-[#201f1e]">
              {filteredClaims.length > 0 ? (
                filteredClaims.map((c) => (
                  <tr key={c.id} className="hover:bg-[#faf9f8] transition">
                    <td className="px-6 py-4 font-mono font-medium text-[#0078d4]">
                      #{c.claimNumber}
                    </td>
                    <td className="px-6 py-4 text-[#201f1e]">
                      {c.user?.telegramUsername ? `@${c.user.telegramUsername}` : c.user?.firstName || 'User'}
                    </td>
                    <td className="px-6 py-4 text-[#201f1e] font-medium">
                      {c.orderItem?.product?.name || 'Licensed Item'}
                    </td>
                    <td className="px-6 py-4 text-[#605e5c]">{c.reason}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-[2px] text-[11px] font-semibold border ${
                          c.status === 'APPROVED'
                            ? 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]'
                            : c.status === 'OPEN'
                            ? 'bg-[#fff4ce] text-[#8a3707] border-[#fed9cc]'
                            : 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.status === 'OPEN' ? (
                        <button
                          onClick={() => setApproveClaimId(c.id)}
                          className="px-2.5 py-1 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white text-[11px] inline-flex items-center gap-1 font-medium shadow-xs transition"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Approve Replacement</span>
                        </button>
                      ) : (
                        <span className="text-[#107c10] font-medium text-[11px]">✓ Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#605e5c]">
                    No warranty claims recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Ticket Conversation History & Reply Modal */}
      {replyModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#edebe9] rounded-[4px] p-6 max-w-lg w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#201f1e]">Reply to Ticket #{replyModal.ticketNumber}</h3>
                <p className="text-xs text-[#605e5c] mt-0.5">
                  Replying to <span className="font-semibold text-[#0078d4]">{replyModal.customer}</span> (Delivered directly via Telegram Bot)
                </p>
              </div>
              <button
                onClick={() => setReplyModal({ open: false })}
                className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conversation Thread History */}
            <div className="space-y-2 max-h-56 overflow-y-auto p-3 bg-[#faf9f8] rounded-[4px] border border-[#edebe9] divide-y divide-[#edebe9]">
              {replyModal.messages && replyModal.messages.length > 0 ? (
                replyModal.messages.map((m: any, idx: number) => {
                  const isStaff = m.senderType === 'STAFF';
                  return (
                    <div key={idx} className={`pt-2 first:pt-0 ${isStaff ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#605e5c] mb-0.5 justify-start">
                        {isStaff ? (
                          <span className="font-bold text-[#0078d4]">Staff / Admin</span>
                        ) : (
                          <span className="font-bold text-[#201f1e]">{replyModal.customer}</span>
                        )}
                        <span>•</span>
                        <span>{m.createdAt ? m.createdAt.slice(11, 16) : ''}</span>
                      </div>
                      <div
                        className={`inline-block p-2 rounded-[4px] text-xs max-w-xs ${
                          isStaff
                            ? 'bg-[#0078d4] text-white text-left'
                            : 'bg-white border border-[#edebe9] text-[#201f1e]'
                        }`}
                      >
                        {m.messageText}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[#605e5c] text-center py-2">No previous messages in this ticket.</p>
              )}
            </div>

            {/* Reply Input */}
            <div className="space-y-2 text-xs">
              <label className="text-[#201f1e] block font-semibold">Your Reply</label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response. This message will be sent instantly to the user in their Telegram chat."
                className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2.5 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#edebe9]">
              <button
                onClick={() => setReplyModal({ open: false })}
                className="px-3.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#201f1e] text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={isSendingReply || !replyText.trim()}
                className="px-4 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] disabled:bg-[#c7e0f4] text-white font-medium text-xs shadow-xs transition flex items-center gap-1.5"
              >
                {isSendingReply ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>{isSendingReply ? 'Sending to Telegram...' : 'Send Message'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warranty Replacement Confirmation Modal */}
      {approveClaimId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#edebe9] rounded-[4px] p-6 max-w-sm w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-3">
              <h3 className="text-sm font-bold text-[#201f1e]">Approve Warranty Replacement?</h3>
              <p className="text-xs text-[#605e5c] mt-0.5">
                The system will automatically allocate replacement stock from available inventory and notify the customer with their fresh credentials.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setApproveClaimId(null)}
                className="px-3.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#201f1e] text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveReplacement}
                disabled={isApprovingClaim}
                className="px-4 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] disabled:bg-[#c7e0f4] text-white text-xs font-medium shadow-xs transition flex items-center gap-1.5"
              >
                {isApprovingClaim ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>{isApprovingClaim ? 'Allocating...' : 'Confirm Replacement'}</span>
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
