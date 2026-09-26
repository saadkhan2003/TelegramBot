'use client';

import { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import CategoryBadge from '../../components/CategoryBadge';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Loading/saving state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    normalPrice: 1.0,
    deliveryType: 'ACTIVATION_LINK',
    shortDescription: '',
    status: 'ACTIVE',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchApi(`/admin/products${selectedCat ? `?categoryId=${selectedCat}` : ''}`),
      fetchApi('/admin/categories'),
    ])
      .then(([prodsRes, catsRes]) => {
        setProducts(prodsRes?.data || []);
        setCategories(catsRes || []);
      })
      .catch((e) => {
        console.error(e);
        showToast('Failed to load products', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedCat]);

  // Handle Create Product
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchApi('/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          normalPrice: Number(formData.normalPrice),
          trackInventory: true,
          warrantyEnabled: true,
          warrantyDays: 30,
        }),
      });
      showToast('✓ Product created successfully!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        sku: '',
        categoryId: '',
        normalPrice: 1.0,
        deliveryType: 'ACTIVATION_LINK',
        shortDescription: '',
        status: 'ACTIVE',
      });
      loadData();
    } catch (err: any) {
      showToast(`Error creating product: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEdit = (product: any) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId || '',
      normalPrice: Number(product.normalPrice),
      deliveryType: product.deliveryType,
      shortDescription: product.shortDescription || '',
      status: product.status || 'ACTIVE',
    });
  };

  // Handle Update Product
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setIsSubmitting(true);
    try {
      await fetchApi(`/admin/products/${editProduct.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          categoryId: formData.categoryId || undefined,
          normalPrice: Number(formData.normalPrice),
          deliveryType: formData.deliveryType,
          shortDescription: formData.shortDescription,
          status: formData.status,
        }),
      });
      showToast('✓ Product updated successfully!');
      setEditProduct(null);
      loadData();
    } catch (err: any) {
      showToast(`Error updating product: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Status Toggle
  const handleToggleStatus = async (product: any) => {
    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await fetchApi(`/admin/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      showToast(`✓ Product set to ${nextStatus}!`);
      loadData();
    } catch (err: any) {
      showToast(`Could not update status: ${err.message}`, 'error');
    }
  };

  // Handle Delete / Archive Product
  const handleDelete = async (id: string) => {
    try {
      await fetchApi(`/admin/products/${id}`, {
        method: 'DELETE',
      });
      showToast('✓ Product archived from active store catalog!');
      setDeleteConfirmId(null);
      loadData();
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#201f1e]">Product Catalog</h2>
          <p className="text-xs text-[#605e5c] mt-0.5">
            Dynamic digital products with inventory linkage, pricing controls, and wholesaler on-demand settings.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: '',
              sku: '',
              categoryId: categories[0]?.id || '',
              normalPrice: 1.0,
              deliveryType: 'ACTIVATION_LINK',
              shortDescription: '',
              status: 'ACTIVE',
            });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] text-white font-medium text-xs shadow-xs transition"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-white p-3 rounded-[4px] border border-[#edebe9] shadow-sm">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8886]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title or SKU..."
            className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] pl-9 pr-4 py-1.5 text-xs text-[#201f1e] placeholder-[#a19f9d] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] px-3 py-1.5 text-xs text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#edebe9] rounded-[4px] overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#faf9f8] text-[#605e5c] uppercase tracking-wider border-b border-[#edebe9] text-[11px]">
            <tr>
              <th className="px-6 py-3 font-semibold">Product Name</th>
              <th className="px-6 py-3 font-semibold">Category</th>
              <th className="px-6 py-3 font-semibold">SKU</th>
              <th className="px-6 py-3 font-semibold">Price</th>
              <th className="px-6 py-3 font-semibold">Available Stock</th>
              <th className="px-6 py-3 font-semibold">Delivery Type</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edebe9] text-[#201f1e]">
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-[#faf9f8] transition">
                  <td className="px-6 py-4 font-semibold text-[#201f1e]">{p.name}</td>
                  <td className="px-6 py-4">
                    <CategoryBadge name={p.category?.name} />
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-[#0078d4] font-medium">{p.sku}</td>
                  <td className="px-6 py-4 font-bold text-[#201f1e]">${Number(p.normalPrice).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-[2px] text-[11px] font-semibold border ${
                        p.availableStock > 0
                          ? 'bg-[#dff6dd] text-[#107c10] border-[#a8e5a3]'
                          : 'bg-[#fde7e9] text-[#d13438] border-[#f8bbd0]'
                      }`}
                    >
                      {p.availableStock} available
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#605e5c] font-mono text-[11px]">{p.deliveryType}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      title="Click to toggle status"
                      className={`inline-flex px-2 py-0.5 rounded-[2px] text-[11px] font-semibold border cursor-pointer hover:opacity-80 transition ${
                        p.status === 'ACTIVE'
                          ? 'bg-[#eff6fc] text-[#0078d4] border-[#c7e0f4]'
                          : 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]'
                      }`}
                    >
                      {p.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#0078d4] hover:text-[#106ebe] shadow-xs transition"
                        title="Edit Product"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(p.id)}
                        className="p-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#fde7e9] text-[#605e5c] hover:text-[#d13438] shadow-xs transition"
                        title="Archive Product"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-[#605e5c]">
                  No products found matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Product Modal */}
      {(showCreateModal || editProduct) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#edebe9] rounded-[4px] p-6 max-w-md w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#201f1e]">
                  {editProduct ? `Edit ${editProduct.name}` : 'Create New Product'}
                </h3>
                <p className="text-xs text-[#605e5c] mt-0.5">Configure digital catalog item and pricing</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditProduct(null);
                }}
                className="p-1 rounded-[4px] hover:bg-[#f3f2f1] text-[#605e5c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={editProduct ? handleUpdate : handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Product Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#201f1e] block mb-1 font-semibold">SKU Identifier</label>
                  <input
                    required
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] font-mono focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
                  />
                </div>
                <div>
                  <label className="text-[#201f1e] block mb-1 font-semibold">Price ($ USD)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.10"
                    value={formData.normalPrice}
                    onChange={(e) => setFormData({ ...formData, normalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#201f1e] block mb-1 font-semibold">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[#201f1e] block mb-1 font-semibold">Delivery Type</label>
                  <select
                    value={formData.deliveryType}
                    onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                    className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                  >
                    <option value="ACTIVATION_LINK">Activation Link</option>
                    <option value="PRELOADED_ACCOUNT">Preloaded Account</option>
                    <option value="LICENSE_KEY">License Key</option>
                    <option value="REDEEM_CODE">Redeem Code</option>
                    <option value="MANUAL_DELIVERY">Wholesaler On-Demand</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#201f1e] block mb-1 font-semibold">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4]"
                >
                  <option value="ACTIVE">ACTIVE (Visible in Bot)</option>
                  <option value="INACTIVE">INACTIVE (Hidden from Bot)</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div>
                <label className="text-[#605e5c] block mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full bg-[#faf9f8] border border-[#d2d0ce] rounded-[4px] p-2 text-[#201f1e] focus:bg-white focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#edebe9]">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditProduct(null);
                  }}
                  className="px-3.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#201f1e] text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-[4px] bg-[#0078d4] hover:bg-[#106ebe] disabled:bg-[#c7e0f4] text-white text-xs font-medium shadow-xs transition flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>{isSubmitting ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#edebe9] rounded-[4px] p-6 max-w-sm w-full space-y-4 shadow-fluentModal animate-in zoom-in-95">
            <div className="border-b border-[#edebe9] pb-3">
              <h3 className="text-sm font-bold text-[#201f1e]">Archive Product?</h3>
              <p className="text-xs text-[#605e5c] mt-0.5">
                This will remove the product from customer visibility in the Telegram bot. Existing fulfilled orders remain archived in the ledger.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-[4px] border border-[#d2d0ce] bg-white hover:bg-[#f3f2f1] text-[#201f1e] text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-1.5 rounded-[4px] bg-[#d13438] hover:bg-[#a4262c] text-white text-xs font-medium shadow-xs transition"
              >
                Archive Product
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
