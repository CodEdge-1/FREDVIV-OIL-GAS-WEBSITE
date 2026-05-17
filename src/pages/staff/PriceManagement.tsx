import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { logout, getAccounts } from '../../lib/auth';
import { getPrices, savePrices, getPriceHistory, addNotification, addActivityLog, type PriceHistory } from '../../lib/store';
import { Fuel, Droplet, Save, History, Check } from 'lucide-react';

export function PriceManagement() {
  const navigate = useNavigate();
  const currentPrices = getPrices();
  const [pmsPrice, setPmsPrice] = useState(currentPrices.pms);
  const [agoPrice, setAgoPrice] = useState(currentPrices.ago);
  const [saved, setSaved] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>(getPriceHistory);

  const handleSave = () => {
    savePrices({ pms: pmsPrice, ago: agoPrice });
    setPriceHistory(getPriceHistory());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    addActivityLog({ action: `Price updated — PMS ₦${pmsPrice}/L · AGO ₦${agoPrice}/L`, type: 'price' });
    const managers = getAccounts().filter((a) => a.role === 'manager');
    managers.forEach((m) =>
      addNotification({
        recipientId: m.id,
        title: 'Fuel Price Updated',
        body: `New prices: PMS ₦${pmsPrice}/L · AGO ₦${agoPrice}/L. Update your sales entries accordingly.`,
      })
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="admin" onLogout={() => { logout(); navigate('/staff/login'); }} />

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {priceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                        No price changes yet.
                      </td>
                    </tr>
                  ) : (
                    priceHistory.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${h.product === 'PMS' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                            {h.product}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">₦{h.oldPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-white font-bold">₦{h.newPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 text-gray-400 text-sm">{h.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
