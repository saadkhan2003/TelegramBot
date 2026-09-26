'use client';

import { useEffect, useState } from 'react';
import { Package, Plus, Search, Filter } from 'lucide-react';
import { fetchApi } from '../../lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    normalPrice: 1.0,
    deliveryType: 'ACTIVATION_LINK',
    shortDescription: '',
    trackInventory: true,
    warrantyEnabled: true,
    warrantyDays: 30,
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchApi(`/admin/products${selectedCat ? `?categoryId=${selectedCat}` : ''}`),
      fetchApi('/admin/categories'),
    ])
      .then(([prodsRes, catsRes]) => {
        setProducts(prodsRes.data || []);
        setCategories(catsRes || []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedCat]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/admin/products', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(`Error creating product: ${err.message}`);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Product Catalog</h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic digital products with real inventory linkage and price control.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
            <tr>
              <th className="px-6 py-3 font-semibold">Product</th>
              <th className="px-6 py-3 font-semibold">Category</th>
              <th className="px-6 py-3 font-semibold">SKU</th>
              <th className="px-6 py-3 font-semibold">Price</th>
              <th className="px-6 py-3 font-semibold">Stock</th>
              <th className="px-6 py-3 font-semibold">Delivery</th>
              <th className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/30 transition">
                <td className="px-6 py-4 font-medium text-white">{p.name}</td>
                <td className="px-6 py-4 text-slate-400">
                  {p.category?.emoji} {p.category?.name}
                </td>
                <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{p.sku}</td>
                <td className="px-6 py-4 font-bold text-white">${Number(p.normalPrice).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                      p.availableStock > 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {p.availableStock} available
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">{p.deliveryType}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">Create New Product</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Product Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">SKU</label>
                <input
                  required
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Category</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Price ($ USD)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.normalPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, normalPrice: parseFloat(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Delivery Type</label>
                  <select
                    value={formData.deliveryType}
                    onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="ACTIVATION_LINK">ACTIVATION_LINK</option>
                    <option value="PRELOADED_ACCOUNT">PRELOADED_ACCOUNT</option>
                    <option value="LICENSE_KEY">LICENSE_KEY</option>
                    <option value="REDEEM_CODE">REDEEM_CODE</option>
                    <option value="MANUAL_DELIVERY">MANUAL_DELIVERY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
