'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Layers,
  Upload,
  Eye,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Search,
  Filter,
  Copy,
  Check,
  Loader2,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { Pagination } from '../../components/Pagination';
import { SearchableSelect } from '../../components/SearchableSelect';
import { Modal } from '../../components/Modal';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedCreds, setRevealedCreds] = useState<Record<string, any>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filters
  const [selectedProductFilter, setSelectedProductFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Bulk Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [rawPaste, setRawPaste] = useState('');
  const [delimiter, setDelimiter] = useState('|');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [purchaseReference, setPurchaseReference] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  // Edit item cost modal state
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editCostValue, setEditCostValue] = useState('');
  const [editReferenceValue, setEditReferenceValue] = useState('');
  const [updatingCost, setUpdatingCost] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = () => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (selectedProductFilter) queryParams.append('productId', selectedProductFilter);
    if (selectedStatusFilter) queryParams.append('status', selectedStatusFilter);

    Promise.all([
      fetchApi(`/admin/inventory?${queryParams.toString()}`),
      fetchApi('/admin/products'),
    ])
      .then(([invRes, prodsRes]) => {
        setItems(invRes?.data || []);
        setProducts(prodsRes?.data || []);
      })
      .catch((e) => {
        console.error(e);
        showToast('Failed to load inventory', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedProductFilter, selectedStatusFilter]);

  const handleReveal = async (id: string) => {
    try {
      const data = await fetchApi(`/admin/inventory/${id}/reveal`);
      setRevealedCreds((prev) => ({ ...prev, [id]: data.credentials }));
      showToast('✓ Credentials decrypted via AES-256-GCM');
    } catch (err: any) {
      showToast(`Could not decrypt: ${err.message}`, 'error');
    }
  };

  const copyCreds = (text: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast('✓ Credentials copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleValidate = async () => {
    if (!rawPaste.trim()) {
      showToast('Please paste inventory lines to validate', 'error');
      return;
    }
    try {
      const res = await fetchApi('/admin/inventory/validate-import', {
        method: 'POST',
        body: JSON.stringify({ rawContent: rawPaste, delimiter }),
      });
      setValidationResult(res);
      showToast(`Validated: ${res.validCount} valid items found`);
    } catch (err: any) {
      showToast(`Validation error: ${err.message}`, 'error');
    }
  };

  const handleExecuteImport = async () => {
    if (!selectedProductId) {
      showToast('Please select a target product', 'error');
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
          purchaseCost: purchaseCost.trim() !== '' ? parseFloat(purchaseCost) : undefined,
          purchaseReference: purchaseReference.trim() || undefined,
        }),
      });
      showToast(`✓ Success! Encrypted & saved ${res.importedCount} inventory items!`);
      setShowImportModal(false);
      setRawPaste('');
      setPurchaseCost('');
      setPurchaseReference('');
      setValidationResult(null);
      loadData();
    } catch (err: any) {
      showToast(`Import failed: ${err.message}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveCost = async () => {
    if (!editingItem) return;
    setUpdatingCost(true);
    try {
      const parsedCost = editCostValue.trim() === '' ? null : parseFloat(editCostValue);
      await fetchApi(`/admin/inventory/${editingItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          purchaseCost: parsedCost,
          purchaseReference: editReferenceValue.trim() || null,
        }),
      });
      showToast('✓ Wholesale cost updated successfully!');
      setEditingItem(null);
      loadData();
    } catch (err: any) {
      showToast(`Failed to update cost: ${err.message}`, 'error');
    } finally {
      setUpdatingCost(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase();
    const prodName = item.product?.name?.toLowerCase() || '';
    const unitId = item.id.toLowerCase();
    return prodName.includes(query) || unitId.includes(query);
  });

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Selection helpers
  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));
  const someFilteredSelected = filteredItems.some((i) => selectedIds.has(i.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map((id) => fetchApi(`/admin/inventory/${id}`, { method: 'DELETE' })));
      showToast(`✓ ${ids.length} inventory item(s) deleted successfully!`);
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      loadData();
    } catch (err: any) {
      showToast(`Bulk delete failed: ${err.message}`, 'error');
    } finally {
      setBulkDeleting(false);
    }
  };
  const productFilterOptions = useMemo(() => {
    return [
      { value: '', label: `All Products (${products.length})` },
      ...products.map((p) => ({
        value: p.id,
        label: p.name,
        sublabel: p.sku ? `SKU: ${p.sku}` : undefined,
        badge: p.category?.name,
      })),
    ];
  }, [products]);

  const modalProductOptions = useMemo(() => {
    return products.map((p) => ({
      value: p.id,
      label: p.name,
      sublabel: `SKU: ${p.sku || 'N/A'} • In Stock: ${p.availableStock ?? 0}`,
      badge: `$${Number(p.normalPrice || 0).toFixed(2)}`,
      badgeColor: 'bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4]',
    }));
  }, [products]);

  const statusFilterOptions = [
    { value: '', label: 'All Inventory Statuses' },
    { value: 'AVAILABLE', label: 'AVAILABLE (Ready for Delivery)', badge: 'Ready', badgeColor: 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]' },
    { value: 'SOLD', label: 'SOLD (Delivered to Buyer)', badge: 'Sold', badgeColor: 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]' },
    { value: 'RESERVED', label: 'RESERVED (Checkout In-Flight)', badge: 'Reserved', badgeColor: 'bg-[#fff4ce] text-[#8a3707] border-[#fed9cc]' },
    { value: 'DEFECTIVE', label: 'DEFECTIVE (Flagged)', badge: 'Defective', badgeColor: 'bg-[#fde7e9] text-[#a4262c] border-[#f8d2d4]' },
    { value: 'RETIRED', label: 'RETIRED (Archived)', badge: 'Retired', badgeColor: 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]' },
  ];

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#201f1e]">Inventory Control & Stock</h2>
          <p className="text-xs text-[#605e5c] mt-0.5">
            AES-256 encrypted stock storage, real-time status tracking, and bulk import pipeline.
          </p>
        </div>
        <button
          onClick={() => {
            if (products.length > 0 && !selectedProductId) {
              setSelectedProductId(products[0].id);
            }
            setShowImportModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white font-medium text-xs shadow-xs transition"
        >
          <Upload className="h-4 w-4" />
          Bulk Upload Stock
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded-[4px] border border-[#edebe9] shadow-sm">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8886]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product or unit ID..."
            className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-9 pr-3 py-1.5 text-xs text-[#201f1e] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4]"
          />
        </div>

        <SearchableSelect
          value={selectedProductFilter}
          onChange={setSelectedProductFilter}
          options={productFilterOptions}
          searchPlaceholder="Search product by name or SKU..."
          className="w-full"
          searchable={true}
        />

        <SearchableSelect
          value={selectedStatusFilter}
          onChange={setSelectedStatusFilter}
          options={statusFilterOptions}
          searchable={false}
          className="w-full"
        />
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-[#eff6fc] border border-[#c7e0f4] rounded-[4px] px-4 py-2.5 shadow-sm animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#0078d4]">
              {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-[11px] text-[#605e5c] hover:text-[#201f1e] underline underline-offset-2"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#a4262c] hover:bg-[#8b2025] text-white text-xs font-semibold shadow-xs transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Inventory Items Table */}
      <div className="bg-white border border-[#edebe9] rounded-[4px] overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-[#faf9f8] text-[#605e5c] uppercase tracking-wider border-b border-[#edebe9] text-[11px]">
            <tr>
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={(el) => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 rounded-[2px] border-[#8a8886] text-[#0078d4] focus:ring-[#0078d4] cursor-pointer accent-[#0078d4]"
                />
              </th>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Unit ID</th>
              <th className="px-4 py-3 font-semibold">Wholesale Cost</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Decrypted / Stored Payload</th>
              <th className="px-4 py-3 font-semibold">Added Date</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edebe9] text-[#201f1e]">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => {
                const cred = revealedCreds[item.id];
                const credString = cred ? (typeof cred === 'object' ? JSON.stringify(cred) : String(cred)) : '';

                return (
                  <tr key={item.id} className={`hover:bg-[#faf9f8] transition ${selectedIds.has(item.id) ? 'bg-[#eff6fc]' : ''}`}>
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="h-3.5 w-3.5 rounded-[2px] border-[#8a8886] text-[#0078d4] focus:ring-[#0078d4] cursor-pointer accent-[#0078d4]"
                      />
                    </td>
                    <td className="px-4 py-4 font-semibold text-[#201f1e]">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-[3px] bg-[#eff6fc] border border-[#c7e0f4] text-[#0078d4]">
                          <KeyRound className="h-3.5 w-3.5" />
                        </div>
                        <span>{item.product?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] text-[#0078d4]">
                      {item.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-4 text-[#605e5c]">
                      <div className="flex items-center gap-1.5 group">
                        <span className="font-medium text-[#201f1e]">
                          {item.purchaseCost ? `$${Number(item.purchaseCost).toFixed(2)}` : '—'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditCostValue(item.purchaseCost ? String(item.purchaseCost) : '');
                            setEditReferenceValue(item.purchaseReference || '');
                          }}
                          title="Edit Wholesale Rate"
                          className="opacity-70 group-hover:opacity-100 p-1 rounded hover:bg-[#edebe9] text-[#0078d4] transition"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-[2px] text-[11px] font-semibold border ${
                          item.status === 'AVAILABLE'
                            ? 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]'
                            : item.status === 'SOLD'
                            ? 'bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4]'
                            : 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-[11px] max-w-xs">
                      {cred ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[#107c10] bg-[#dff6dd] border border-[#a8e5a3] px-2 py-1 rounded-[2px] truncate max-w-[200px]">
                            {credString}
                          </span>
                          <button
                            onClick={() => copyCreds(credString, item.id)}
                            className="p-1 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#605e5c]"
                            title="Copy credentials"
                          >
                            {copiedId === item.id ? (
                              <Check className="h-3.5 w-3.5 text-[#107c10]" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#8a8886] truncate block">{item.encryptedPayload}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[#605e5c] text-[11px]">
                      {item.createdAt ? item.createdAt.slice(0, 10) : '—'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!cred && (
                          <button
                            onClick={() => handleReveal(item.id)}
                            className="px-2.5 py-1 rounded-[4px] bg-white border border-[#d2d0ce] hover:bg-[#f3f2f1] text-[#201f1e] text-[11px] font-medium inline-flex items-center gap-1 shadow-xs transition"
                          >
                            <Eye className="h-3 w-3 text-[#0078d4]" />
                            <span>Reveal</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-[#605e5c]">
                  No inventory units match your search or filter selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="inventory units"
        />
      </div>

      {/* Bulk Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)}>
        <div className="bg-white border border-[#edebe9] rounded-[6px] p-6 max-w-xl w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
          <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#201f1e]">Bulk Stock Importer</h3>
                <p className="text-xs text-[#605e5c] mt-0.5">
                  Paste newline-separated keys or credentials. Example: <code>email@domain.com|password</code> or activation URLs.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Target Product</label>
                <SearchableSelect
                  value={selectedProductId}
                  onChange={setSelectedProductId}
                  options={modalProductOptions}
                  placeholder="Search and select product..."
                  searchPlaceholder="Type product name or SKU..."
                  className="w-full py-2"
                  menuClassName="w-full"
                  searchable={true}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-[#201f1e] block mb-1 font-semibold">Delimiter</label>
                  <input
                    type="text"
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[#201f1e] block mb-1 font-semibold flex items-center justify-between">
                    <span>Wholesale Cost ($)</span>
                    <span className="text-[10px] text-[#605e5c] font-normal">Optional</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#605e5c] text-xs font-semibold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={purchaseCost}
                      onChange={(e) => setPurchaseCost(e.target.value)}
                      placeholder="e.g. 8.00"
                      className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-6 pr-2 py-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                    />
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[#201f1e] block mb-1 font-semibold flex items-center justify-between">
                    <span>Supplier / Batch</span>
                    <span className="text-[10px] text-[#605e5c] font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseReference}
                    onChange={(e) => setPurchaseReference(e.target.value)}
                    placeholder="e.g. Vendor A"
                    className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Inventory Data (Bulk Paste)</label>
                <textarea
                  rows={6}
                  value={rawPaste}
                  onChange={(e) => setRawPaste(e.target.value)}
                  placeholder={`user1@gmail.com|pass123\nuser2@gmail.com|pass456\nXXXXX-YYYYY-ZZZZZ`}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] font-mono text-[11px] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                />
              </div>

              {/* Validation Summary */}
              {validationResult && (
                <div className="p-3 rounded-[4px] bg-[#faf9f8] border border-[#edebe9] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#107c10] font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Valid rows: {validationResult.validCount}</span>
                  </div>
                  {validationResult.duplicateCount > 0 && (
                    <div className="flex items-center gap-2 text-[#8a3707] font-medium">
                      <AlertCircle className="h-4 w-4" />
                      <span>Duplicates: {validationResult.duplicateCount}</span>
                    </div>
                  )}
                  {validationResult.invalidCount > 0 && (
                    <div className="flex items-center gap-2 text-[#d13438] font-medium">
                      <AlertCircle className="h-4 w-4" />
                      <span>Invalid: {validationResult.invalidCount}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#edebe9]">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#201f1e] text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleValidate}
                  className="px-3.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#0078d4] font-medium text-xs shadow-xs transition"
                >
                  Validate Format
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importing || !selectedProductId || !rawPaste.trim()}
                  className="px-4 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] disabled:bg-[#c7e0f4] text-white font-medium text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  {importing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>{importing ? 'Encrypting & Saving...' : 'Import Valid Items'}</span>
                </button>
              </div>
            </div>
          </div>
      </Modal>

      {/* Edit Wholesale Cost Modal */}
      <Modal isOpen={Boolean(editingItem)} onClose={() => setEditingItem(null)}>
        {editingItem && (
          <div className="bg-white border border-[#edebe9] rounded-[6px] p-5 max-w-sm w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-2.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#201f1e]">Update Wholesale Rate</h3>
                <p className="text-[11px] text-[#605e5c] mt-0.5 truncate max-w-[240px]">
                  {editingItem.product?.name} ({editingItem.id.slice(0, 8)}...)
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">
                  Wholesale Cost per Unit ($)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#605e5c] text-xs font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editCostValue}
                    onChange={(e) => setEditCostValue(e.target.value)}
                    placeholder="e.g. 8.00"
                    className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-6 pr-2 py-1.5 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                  />
                </div>
                <p className="text-[10px] text-[#605e5c] mt-1">
                  Leave blank or 0 to clear the wholesale cost.
                </p>
              </div>

              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">
                  Supplier / Batch Reference (Optional)
                </label>
                <input
                  type="text"
                  value={editReferenceValue}
                  onChange={(e) => setEditReferenceValue(e.target.value)}
                  placeholder="e.g. Vendor A, Batch 2"
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edebe9]">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 rounded-[4px] border border-[#d2d0ce] hover:bg-[#f3f2f1] text-[#605e5c] text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingCost}
                onClick={handleSaveCost}
                className="px-3.5 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
              >
                {updatingCost && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>Save Wholesale Rate</span>
              </button>
              </div>
            </div>
          )}
        </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal isOpen={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)}>
        <div className="bg-white border border-[#edebe9] rounded-[6px] p-5 max-w-sm w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
          <div className="border-b border-[#edebe9] pb-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#a4262c]">Confirm Bulk Delete</h3>
              <p className="text-[11px] text-[#605e5c] mt-0.5">
                This will permanently remove {selectedIds.size} inventory item{selectedIds.size > 1 ? 's' : ''}.
              </p>
            </div>
            <button
              onClick={() => setShowBulkDeleteConfirm(false)}
              className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3 rounded-[4px] bg-[#fde7e9] border border-[#f8d2d4] text-xs text-[#a4262c]">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>This action cannot be undone. All encrypted credential payloads will be permanently destroyed.</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#edebe9]">
            <button
              onClick={() => setShowBulkDeleteConfirm(false)}
              className="px-3 py-1.5 rounded-[4px] border border-[#d2d0ce] hover:bg-[#f3f2f1] text-[#605e5c] text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="px-3.5 py-1.5 rounded-[4px] bg-[#a4262c] hover:bg-[#8b2025] text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {bulkDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>{bulkDeleting ? 'Deleting...' : `Delete ${selectedIds.size} Item${selectedIds.size > 1 ? 's' : ''}`}</span>
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
