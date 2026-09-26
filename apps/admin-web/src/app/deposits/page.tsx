'use client';

import { useEffect, useState } from 'react';
import { ArrowDownCircle, Check, ExternalLink } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeposits = () => {
    setLoading(true);
    fetchApi('/admin/deposits')
      .then((res) => setDeposits(res.data || []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const handleManualCredit = async (depositId: string, reported: number) => {
    const amountStr = prompt('Enter verified amount to credit to user wallet:', reported ? reported.toString() : '10.00');
    if (!amountStr) return;

    try {
      await fetchApi(`/admin/deposits/${depositId}/credit`, {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(amountStr), notes: 'Approved via admin dashboard' }),
      });
      alert('Deposit credited successfully!');
      loadDeposits();
    } catch (err: any) {
      alert(`Failed to credit deposit: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Deposit Verifications</h2>
        <p className="text-xs text-slate-400 mt-1">
          Cryptocurrency deposits, on-chain transaction hash verification, and manual override queue.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
            <tr>
              <th className="px-6 py-3 font-semibold">Deposit ID</th>
              <th className="px-6 py-3 font-semibold">Customer</th>
              <th className="px-6 py-3 font-semibold">Network</th>
              <th className="px-6 py-3 font-semibold">Transaction Hash</th>
              <th className="px-6 py-3 font-semibold">Amount</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {deposits.map((d) => (
              <tr key={d.id} className="hover:bg-slate-800/30 transition">
                <td className="px-6 py-4 font-mono font-medium text-emerald-400">
                  {d.depositNumber}
                </td>
                <td className="px-6 py-4 text-slate-300">
                  {d.user?.telegramUsername ? `@${d.user.telegramUsername}` : d.user?.firstName}
                </td>
                <td className="px-6 py-4 text-slate-400">{d.network?.name}</td>
                <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                  <span title={d.transactionHash}>
                    {d.transactionHash.slice(0, 10)}...{d.transactionHash.slice(-8)}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-white">
                  ${Number(d.verifiedAmount ?? d.reportedAmount ?? 0).toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                      d.status === 'CREDITED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : d.status === 'MANUAL_REVIEW'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {d.status !== 'CREDITED' && (
                    <button
                      onClick={() => handleManualCredit(d.id, Number(d.reportedAmount || 0))}
                      className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px] inline-flex items-center gap-1 font-semibold"
                    >
                      <Check className="h-3 w-3" /> Approve Credit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
