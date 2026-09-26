'use client';

import { useEffect, useState } from 'react';
import { Layers, Upload, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedCreds, setRevealedCreds] = useState<Record<string, any>>({});

  // Bulk Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [rawPaste, setRawPaste] = useState('');
  const [delimiter, setDelimiter] = useState('|');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchApi('/admin/inventory'), fetchApi('/admin/products')])
      .then(([invRes, prodsRes]) => {
        setItems(invRes.data || []);
        setProducts(prodsRes.data || []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReveal = async (id: string) => {
    try {
      const data = await fetchApi(`/admin/inventory/${id}/reveal`);
      setRevealedCreds((prev) => ({ ...prev, [id]: data.credentials }));
    } catch (err: any) {
      alert(`Could not decrypt: ${err.message}`);
    }
  };

  const handleValidate = async () => {
    if (!rawPaste.trim()) return;
    try {
      const res = await fetchApi('/admin/inventory/validate-import', {
        method: 'POST',
        body: JSON.stringify({ rawContent: rawPaste, delimiter }),
      });
      setValidationResult(res);
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    }
  };

  const handleExecuteImport = async () => {
    if (!selectedProductId) {
      alert('Please select a target product');
      return;
    }
    setImporting(true);
    try {
      const res = await fetchApi('/admin/inventory/import', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProductId,
          rawContent: rawPaste,
          delimiter,
        }),
      });
      alert(`Success! Uploaded: ${res.importedCount} valid inventory items.`);
      setShowImportModal(false);
      setRawPaste('');
      setValidationResult(null);
      loadData();
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Inventory Control & Stock</h2>
          <p className="text-xs text-slate-400 mt-1">
            AES-256 encrypted stock storage, real-time status tracking, and bulk import pipeline.
          </p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition"
        >
          <Upload className="h-4 w-4" />
          Bulk Upload Stock
        </button>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
            <tr>
              <th className="px-6 py-3 font-semibold">Product</th>
              <th className="px-6 py-3 font-semibold">Unit ID</th>
              <th className="px-6 py-3 font-semibold">Cost</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Payload</th>
              <th className="px-6 py-3 font-semibold">Added</th>
              <th className="px-6 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/30 transition">
                <td className="px-6 py-4 font-medium text-white">{item.product?.name}</td>
                <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                  {item.id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 text-slate-400">
                  {item.purchaseCost ? `$${Number(item.purchaseCost).toFixed(2)}` : '—'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                      item.status === 'AVAILABLE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : item.status === 'SOLD'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-[11px]">
                  {revealedCreds[item.id] ? (
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                      {typeof revealedCreds[item.id] === 'object'
                        ? JSON.stringify(revealedCreds[item.id])
                        : revealedCreds[item.id]}
                    </span>
                  ) : (
                    <span className="text-slate-500">{item.encryptedPayload}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-400 text-[11px]">
                  {item.createdAt.slice(0, 10)}
                </td>
                <td className="px-6 py-4 text-right">
                  {!revealedCreds[item.id] && (
                    <button
                      onClick={() => handleReveal(item.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] inline-flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" /> Reveal
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl w-full space-y-4">
            <h3 className="text-base font-bold text-white">Bulk Stock Importer</h3>
            <p className="text-xs text-slate-400">
              Paste newline-separated keys or credentials. Example: <code>email@domain.com|password</code> or raw activation URLs.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Delimiter (default is |)</label>
                <input
                  type="text"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Inventory Data (Bulk Paste)</label>
                <textarea
                  rows={6}
                  value={rawPaste}
                  onChange={(e) => setRawPaste(e.target.value)}
                  placeholder={`user1@gmail.com|pass123\nuser2@gmail.com|pass456`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-[11px]"
                />
              </div>

              {/* Validation Summary */}
              {validationResult && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Valid rows: {validationResult.validCount}</span>
                  </div>
                  {validationResult.duplicateCount > 0 && (
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Duplicates: {validationResult.duplicateCount}</span>
                    </div>
                  )}
                  {validationResult.invalidCount > 0 && (
                    <div className="flex items-center gap-2 text-rose-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Invalid: {validationResult.invalidCount}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleValidate}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                >
                  Validate
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importing || !selectedProductId || !rawPaste}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-semibold"
                >
                  {importing ? 'Encrypting & Saving...' : 'Import Valid Items'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
