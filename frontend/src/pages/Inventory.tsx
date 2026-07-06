import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { InventoryItem } from '../types';
import GlassCard from '../components/GlassCard';
import { Search, AlertTriangle, Sliders, CheckCircle, HelpCircle } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [selectedWarehouse, setSelectedWarehouse] = useState('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Dynamic dropdown list options
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, [selectedCategory, selectedSupplier, selectedWarehouse, showLowStockOnly]);

  const fetchInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getInventory({
        category: selectedCategory,
        supplier: selectedSupplier,
        warehouse: selectedWarehouse,
        low_stock: showLowStockOnly,
        search: searchTerm
      });
      setInventory(data);

      // On initial load, gather filter categories from all items in DB
      if (categories.length === 0 && data.length > 0) {
        // We'll fetch the unfiltered list once to populate filter choices
        const allData = await api.getInventory();
        const cats = Array.from(new Set(allData.map((item: any) => item.category))) as string[];
        const sups = Array.from(new Set(allData.map((item: any) => item.supplier))) as string[];
        const whs = Array.from(new Set(allData.map((item: any) => item.warehouse))) as string[];
        setCategories(cats);
        setSuppliers(sups);
        setWarehouses(whs);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleSimulateClick = (productId: number) => {
    navigate(`/simulator?productId=${productId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Filters Bar */}
      <GlassCard className="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search bar (4 cols) */}
          <div className="md:col-span-4 relative">
            <input
              type="text"
              className="w-full glass-input pl-10"
              placeholder="Search product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          </div>

          {/* Category Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              className="w-full glass-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Supplier Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              className="w-full glass-input"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="All">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Warehouse Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              className="w-full glass-input"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
            >
              <option value="All">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Search submit & Clear (2 cols) */}
          <div className="md:col-span-2 flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2 px-4 rounded-xl shadow-sm transition-all"
            >
              Search
            </button>
            
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedSupplier('All');
                setSelectedWarehouse('All');
                setShowLowStockOnly(false);
              }}
              className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-xl text-sm font-medium transition-all"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Low Stock checkbox toggle */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/40">
          <input
            type="checkbox"
            id="lowStockToggle"
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <label htmlFor="lowStockToggle" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 cursor-pointer">
            Show low stock items only (below reorder level)
          </label>
        </div>
      </GlassCard>

      {/* Inventory List Card */}
      <GlassCard title="Inventory Listing" subtitle={`Showing ${inventory.length} products matching filters.`}>
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-6">{error}</div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 text-sm">
            No products found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">SKU / Code</th>
                  <th className="py-3.5 px-4">Warehouse</th>
                  <th className="py-3.5 px-4 text-right">Unit Price</th>
                  <th className="py-3.5 px-4 text-right">Stock Level</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/30 text-sm">
                {inventory.map((item) => {
                  let statusBadge = '';
                  
                  if (item.status === 'LOW STOCK') {
                    statusBadge = 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
                  } else if (item.status === 'OVERSTOCK') {
                    statusBadge = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
                  } else {
                    statusBadge = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
                  }

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-white">{item.product_name}</div>
                        <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{item.category} • {item.supplier}</div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {item.sku}
                      </td>
                      <td className="py-4 px-4 font-semibold text-xs text-zinc-600 dark:text-zinc-300">
                        {item.warehouse}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-bold text-zinc-950 dark:text-white">{item.current_stock}</div>
                        <div className="text-xs text-zinc-400 dark:text-zinc-500">Min: {item.reorder_level}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge}`}>
                            {item.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleSimulateClick(item.product_id)}
                            className="p-2 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:bg-emerald-500/20 text-zinc-400 dark:text-zinc-500 rounded-xl transition-all flex items-center space-x-1"
                            title="Open Decision Simulator"
                          >
                            <Sliders size={16} />
                            <span className="text-xs font-bold px-0.5">Simulate</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default Inventory;
