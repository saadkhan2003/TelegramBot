'use client';

import { useEffect, useState } from 'react';
import { Settings, Shield, Save } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable settings map
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchApi('/admin/settings'), fetchApi('/admin/audit-logs')])
      .then(([sRes, aRes]) => {
        setSettings(sRes || []);
        setAuditLogs(aRes.data || []);
        const map: Record<string, any> = {};
        (sRes || []).forEach((item: any) => {
          map[item.key] = item.value;
        });
        setFormValues(map);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSetting = async (key: string) => {
    try {
      await fetchApi(`/admin/settings/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ value: formValues[key] }),
      });
      alert(`Setting '${key}' updated!`);
      loadData();
    } catch (err: any) {
      alert(`Error updating setting: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">System Settings & Audit Log</h2>
        <p className="text-xs text-slate-400 mt-1">
          Store branding, payment configurations, referral commission rates, and immutable administrative audit logs.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings className="h-4 w-4 text-emerald-400" />
            General Branding & Business Rules
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Store Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formValues['store_name'] || ''}
                  onChange={(e) => setFormValues({ ...formValues, store_name: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
                <button
                  onClick={() => handleSaveSetting('store_name')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold"
                >
                  Save
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Support Bot Username</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formValues['support_username'] || ''}
                  onChange={(e) => setFormValues({ ...formValues, support_username: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
                <button
                  onClick={() => handleSaveSetting('support_username')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold"
                >
                  Save
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Referral Commission Rate (%)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={formValues['referral_rate'] || 10}
                  onChange={(e) =>
                    setFormValues({ ...formValues, referral_rate: parseFloat(e.target.value) })
                  }
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
                <button
                  onClick={() => handleSaveSetting('referral_rate')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold"
                >
                  Save
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Minimum Deposit ($ USD)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={formValues['minimum_deposit'] || 1}
                  onChange={(e) =>
                    setFormValues({ ...formValues, minimum_deposit: parseFloat(e.target.value) })
                  }
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
                <button
                  onClick={() => handleSaveSetting('minimum_deposit')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Secrets Info */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            Security & Cryptographic Invariants
          </h3>

          <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
            <p className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              🔒 <strong className="text-slate-200">AES-256-GCM Encryption:</strong> Digital goods
              credentials are encrypted at rest with hardware-accelerated GCM mode and isolated
              authentication tags.
            </p>
            <p className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              ⚡ <strong className="text-slate-200">Atomic Checkout:</strong> PostgreSQL Serializable
              transactions with <code className="text-emerald-400">FOR UPDATE SKIP LOCKED</code> ensure
              zero concurrency overselling.
            </p>
            <p className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              💰 <strong className="text-slate-200">Ledger-Backed Wallets:</strong> No arbitrary floating
              point balance alterations. Every credit and debit creates an immutable ledger entry.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Administrative Audit Log</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
            <tr>
              <th className="px-6 py-3 font-semibold">Action</th>
              <th className="px-6 py-3 font-semibold">Admin</th>
              <th className="px-6 py-3 font-semibold">Resource</th>
              <th className="px-6 py-3 font-semibold">Resource ID</th>
              <th className="px-6 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-mono font-medium text-emerald-400">{log.action}</td>
                  <td className="px-6 py-4 text-slate-300">{log.admin?.email || 'System'}</td>
                  <td className="px-6 py-4 text-slate-400">{log.resourceType}</td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                    {log.resourceId || '—'}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-[11px]">
                    {log.createdAt.slice(0, 19).replace('T', ' ')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-slate-500">
                  No audit logs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
