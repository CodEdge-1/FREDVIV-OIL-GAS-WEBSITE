import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { logout, StaffAccount } from '../../lib/auth'; // Keep StaffAccount type for now
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { type PriceHistory } from '../../lib/store'; // Keep type for now, will replace with backend type
import { Fuel, Droplet, Save, History, Check, Plus, X, Trash2 } from 'lucide-react';

export function PriceManagement() {
  const navigate = useNavigate();
  const [currentPrices, setCurrentPrices] = useState({ pms: 0, ago: 0 });
  const [pmsPrice, setPmsPrice] = useState(0);
  const [agoPrice, setAgoPrice] = useState(0);
  const [saved, setSaved] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [managers, setManagers] = useState<StaffAccount[]>([]);

  const [customProducts, setCustomProducts] = useState<any[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', code: '', price: 0 });

  const fetchPricesAndHistory = async () => {
    try {
      const [pricesData, historyData, usersData, customProductsData, customHistoryData] = await Promise.all([
        api.get('/fuel-prices/current'),
        api.get('/fuel-prices/history'),
        api.get('/users'), // To get managers for notifications
        api.get('/custom-products'),
        api.get('/custom-products/history'),
      ]);
      if (pricesData) {
        setCurrentPrices(pricesData);
        setPmsPrice(pricesData.pms);
        setAgoPrice(pricesData.ago);
      }
      setCustomProducts(customProductsData || []);
      setManagers((usersData || []).filter((u: any) => u.role === 'MANAGER'));

      // Merge and sort histories
      const standardHistory = (historyData || []).map((h: any) => ({ ...h, isCustom: false }));
      const customHistory = (customHistoryData || []).map((h: any) => ({ ...h, isCustom: true }));
      const sortedHistory = [...standardHistory, ...customHistory].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setPriceHistory(sortedHistory);
    } catch (error) {
      console.error('Failed to fetch price data:', error);
      toast.error('Failed to load price data.');
    }
  };

  useEffect(() => {
    fetchPricesAndHistory();
  }, []);

  const handleSave = async () => {
    try {
      await api.post('/fuel-prices', { pmsPrice: pmsPrice, agoPrice: agoPrice });
      toast.success('Prices updated successfully!');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      // Add activity log via API
      await api.post('/activity-logs', {
        userId: 'admin', // Assuming 'admin' is the ID for the admin user
        action: `Price updated — PMS ₦${pmsPrice}/L · AGO ₦${agoPrice}/L`,
        type: 'price',
        details: `Old PMS: ₦${currentPrices.pms}/L, Old AGO: ₦${currentPrices.ago}/L`,
      });
      // Send notifications to managers via API
      managers.forEach(async (m) => {
        await api.post('/notifications', {
          userId: m.id,
          title: 'Fuel Price Updated',
          body: `New prices: PMS ₦${pmsPrice}/L · AGO ₦${agoPrice}/L. Update your sales entries accordingly.`,
        });
      });
      fetchPricesAndHistory(); // Re-fetch to update current prices and history
    } catch (error) {
      console.error('Failed to save prices:', error);
      toast.error('Failed to save prices.');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.code || newProduct.price < 0) return;
    try {
      await api.post('/custom-products', newProduct);
      toast.success(`Custom product ${newProduct.name} created!`);
      setShowAddModal(false);
      setNewProduct({ name: '', code: '', price: 0 });
      fetchPricesAndHistory();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create product.');
    }
  };

  const handleUpdateCustomPrice = async (id: string, price: number, name: string) => {
    try {
      await api.patch(`/custom-products/${id}`, { price });
      toast.success(`Price for ${name} updated successfully!`);
      
      // Add activity log
      await api.post('/activity-logs', {
        userId: 'admin',
        action: `Price updated — ${name} ₦${price}/L`,
        type: 'price',
        details: `Updated custom product ID: ${id}`,
      });

      // Send notifications to managers
      managers.forEach(async (m) => {
        await api.post('/notifications', {
          userId: m.id,
          title: 'Custom Product Price Updated',
          body: `New price for ${name}: ₦${price}/L.`,
        });
      });

      fetchPricesAndHistory();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update custom product price.');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the product "${name}"?`)) return;
    try {
      await api.delete(`/custom-products/${id}`);
      toast.success(`Product ${name} deleted successfully.`);
      fetchPricesAndHistory();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete custom product.');
    }
  };

  const handleDeleteHistory = async (id: string, isCustom: boolean) => {
    if (!window.confirm('Are you sure you want to clear this history record?')) return;
    try {
      if (isCustom) {
        await api.delete(`/custom-products/history/${id}`);
      } else {
        await api.delete(`/fuel-prices/history/${id}`);
      }
      toast.success('History record cleared.');
      fetchPricesAndHistory();
    } catch (error) {
      console.error(error);
      toast.error('Failed to clear history record.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="ADMIN" onLogout={() => { logout(); navigate('/staff/login'); }} />

      <div className="flex-1 overflow-x-hidden">
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Price Management</h1>
            <p className="text-gray-400 text-sm">Set petroleum product prices for all branches</p>
          </div>
        </header>

        <main className="p-6">
          {saved && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <p className="text-green-500">Prices updated successfully! Changes are now live across all manager dashboards.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* PMS Price */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Fuel className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Premium Motor Spirit</h3>
                  <p className="text-gray-400 text-sm">PMS - Petrol</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-3">Price per Litre</label>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-2xl">₦</span>
                  <input
                    type="number"
                    value={pmsPrice}
                    onChange={(e) => setPmsPrice(Number(e.target.value))}
                    className="flex-1 px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0"
                  />
                  <span className="text-gray-400 text-xl">/L</span>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Current Saved Price</p>
                <p className="text-blue-500 font-bold">
                  {currentPrices.pms > 0 ? `₦${currentPrices.pms.toFixed(2)} per litre` : 'Not set yet'}
                </p>
              </div>
            </div>

            {/* AGO Price */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <Droplet className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Automotive Gas Oil</h3>
                  <p className="text-gray-400 text-sm">AGO - Diesel</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-3">Price per Litre</label>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-2xl">₦</span>
                  <input
                    type="number"
                    value={agoPrice}
                    onChange={(e) => setAgoPrice(Number(e.target.value))}
                    className="flex-1 px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0"
                  />
                  <span className="text-gray-400 text-xl">/L</span>
                </div>
              </div>
              <div className="mt-4 p-4 bg-green-500/5 border border-green-500/10 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Current Saved Price</p>
                <p className="text-green-500 font-bold">
                  {currentPrices.ago > 0 ? `₦${currentPrices.ago.toFixed(2)} per litre` : 'Not set yet'}
                </p>
              </div>
            </div>
          </div>

          {/* Custom Products Grid */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Custom Fuel Products</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customProducts.map(p => (
                <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-16 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Droplet className="w-8 h-8 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-white truncate" title={p.name}>{p.name}</h3>
                          <p className="text-gray-400 text-xs truncate">{p.code}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-1.5 text-gray-500 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-3">Price per Litre</label>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-2xl flex-shrink-0">₦</span>
                        <input
                          type="number"
                          value={customPrices[p.id] ?? p.price}
                          onChange={(e) => setCustomPrices({ ...customPrices, [p.id]: Number(e.target.value) })}
                          className="flex-1 min-w-0 w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-gray-400 text-lg flex-shrink-0">/L</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex-1 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                      <p className="text-[10px] text-gray-400 mb-0.5">Current Saved</p>
                      <p className="text-amber-500 font-bold text-sm">₦{p.price.toFixed(2)}/L</p>
                    </div>
                    <button
                      onClick={() => handleUpdateCustomPrice(p.id, customPrices[p.id] ?? p.price, p.name)}
                      className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 text-sm font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Update
                    </button>
                  </div>
                </div>
              ))}

              <div 
                onClick={() => setShowAddModal(true)}
                className="bg-gray-800 border-2 border-dashed border-gray-700 hover:border-primary/50 hover:bg-gray-800/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[220px]"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Create New Product</h3>
                <p className="text-gray-400 text-xs text-center">Add a custom petroleum product with price tracking</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mb-8">
            <button
              onClick={handleSave}
              className="px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-3 text-lg font-medium"
            >
              <Save className="w-6 h-6" />
              Save Price Changes
            </button>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 mb-8">
            <h4 className="text-yellow-500 font-bold mb-2 flex items-center gap-2">
              <History className="w-5 h-5" />
              Important Information
            </h4>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Price changes are reflected immediately across all manager dashboards</li>
              <li>• Managers cannot edit these prices — they are read-only on their end</li>
              <li>• All price changes are logged and tracked in the history below</li>
              <li>• Ensure prices are accurate before saving</li>
            </ul>
          </div>

          {/* Price History */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <History className="w-6 h-6" />
                Price Change History
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Previous Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">New Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date & Time</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {priceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        No price changes yet.
                      </td>
                    </tr>
                  ) : (
                    priceHistory.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            h.product === 'PMS' 
                              ? 'bg-blue-500/10 text-blue-500' 
                              : h.product === 'AGO' 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {h.product}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">₦{(h.oldPrice ?? 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-white font-bold">₦{(h.newPrice ?? 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-400 text-sm">{h.date}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteHistory(h.id, h.isCustom)}
                            className="p-1.5 text-gray-500 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors inline-flex items-center justify-center"
                            title="Clear History Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      {/* Add Custom Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Add Custom Product</h2>
                <p className="text-gray-400 text-sm">Add a new petroleum product to track</p>
              </div>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Kerosene"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Product Code (Uppercase, Unique) *</label>
                <input
                  type="text"
                  required
                  value={newProduct.code}
                  onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. DPK"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Initial Price per Litre *</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-lg">₦</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    placeholder="0"
                    className="flex-1 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-gray-400 text-sm">/L</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewProduct({ name: '', code: '', price: 0 });
                  }}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
