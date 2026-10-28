import React, { useState, useEffect } from 'react';
import { AgriculturalProduct } from '../types/agricultural';
import { Language, UI_STRINGS } from '../data/translations';
import { formatInr, formatRelativeDate } from '../utils/formatters';
import { X, Upload, Plus, CheckCircle, Database, AlertCircle, FileText, RefreshCw } from 'lucide-react';

interface AdminIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onRefreshProducts: () => void;
  productsCount: number;
}

export const AdminIngestionModal: React.FC<AdminIngestionModalProps> = ({
  isOpen,
  onClose,
  language,
  onRefreshProducts,
  productsCount,
}) => {
  const [activeTab, setActiveTab] = useState<'provenance' | 'csv_import' | 'manual_add'>('provenance');
  const [logs, setLogs] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Manual Add Form State
  const [newProductName, setNewProductName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('fertilizer_npk');
  const [newPrice, setNewPrice] = useState(1500);
  const [newHp, setNewHp] = useState<number | undefined>(undefined);
  const [newNpk, setNewNpk] = useState('');
  const [newVendor, setNewVendor] = useState('Local Cooperative Mandi');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/logs')
        .then((r) => r.json())
        .then((d) => setLogs(d.logs || []))
        .catch(() => {});
    }
  }, [isOpen]);

  // Sample CSV payload to simulate real vendor feed ingestion
  const handleSimulateCsvImport = async () => {
    setIsLoading(true);
    setImportStatus(null);

    const sampleCsvBatch = [
      {
        name: 'Mahindra 575 DI XP Plus Tractor (47 HP)',
        brand: 'Mahindra & Mahindra',
        modelNumber: '575 DI XP PLUS',
        category: 'tractor',
        basePriceInr: 675000,
        offers: [
          {
            vendorName: 'Direct Mandi Festival Offer (Ludhiana)',
            vendorType: 'Local Cooperative',
            originalUrl: 'https://mahindratractor.com/promo',
            listedPriceInr: 695000,
            discountPriceInr: 672000,
            inStock: true,
            deliveryDays: 2,
            shippingCostInr: 0,
            warrantyYears: 6,
            sourceType: 'vendor_csv',
            lastCheckedIso: new Date().toISOString(),
            verifiedSeller: true,
          },
        ],
      },
      {
        name: 'Coromandel Gromor 12:32:16 Complex NPK (50 kg Bag)',
        brand: 'Coromandel International Ltd',
        modelNumber: 'GROMOR-123216',
        category: 'fertilizer_npk',
        basePriceInr: 1470,
        specs: {
          npkRatio: '12:32:16',
          nitrogenPercent: 12,
          phosphorusPercent: 32,
          potassiumPercent: 16,
          formulation: 'Granular',
          packageWeightKg: 50,
          applicationMethod: 'Basal Application',
        },
        offers: [
          {
            vendorName: 'BigHaat Agritech Marketplace',
            vendorType: 'E-commerce Marketplace',
            originalUrl: 'https://www.bighaat.com/products/coromandel-123216',
            listedPriceInr: 1520,
            discountPriceInr: 1470,
            inStock: true,
            deliveryDays: 3,
            shippingCostInr: 0,
            sourceType: 'vendor_csv',
            lastCheckedIso: new Date().toISOString(),
            verifiedSeller: true,
          },
        ],
      },
    ];

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'vendor_csv',
          sourceName: 'Distributor_Feed_Rabi_2026.csv',
          products: sampleCsvBatch,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImportStatus(`Successfully ingested batch: Added ${data.summary.newProductsCount} new products, updated ${data.summary.priceUpdatesCount} price offers.`);
        onRefreshProducts();
        // Refresh logs
        fetch('/api/admin/logs')
          .then((r) => r.json())
          .then((d) => setLogs(d.logs || []));
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setImportStatus(`Ingestion error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newBrand) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName,
          nameHindi: newProductName,
          brand: newBrand,
          modelNumber: `MOD-${Date.now().toString().slice(-4)}`,
          category: newCategory,
          basePriceInr: Number(newPrice),
          specs: {
            engineHp: newHp ? Number(newHp) : undefined,
            npkRatio: newNpk || undefined,
          },
          offers: [
            {
              id: `off_${Date.now()}`,
              vendorName: newVendor,
              vendorType: 'Authorized Distributor',
              originalUrl: 'https://kisansetu.in',
              listedPriceInr: Number(newPrice),
              discountPriceInr: Number(newPrice),
              inStock: true,
              deliveryDays: 4,
              shippingCostInr: 0,
              sourceType: 'manual_entry',
              lastCheckedIso: new Date().toISOString(),
              verifiedSeller: true,
            },
          ],
          priceHistory: [
            {
              date: new Date().toISOString().split('T')[0],
              priceInr: Number(newPrice),
              vendorName: newVendor,
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setImportStatus(`Product "${newProductName}" added successfully!`);
        setNewProductName('');
        onRefreshProducts();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error adding product';
      setImportStatus(`Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Data Provenance & Ingestion Hub
              </h2>
              <span className="text-xs text-stone-500">
                Multi-vendor feeds · Duplicate normalization · Price update audits
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-200 bg-stone-50/50 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('provenance')}
            className={`pb-2.5 font-semibold transition-colors cursor-pointer ${
              activeTab === 'provenance'
                ? 'text-emerald-800 border-b-2 border-emerald-700'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Provenance Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('csv_import')}
            className={`pb-2.5 font-semibold transition-colors cursor-pointer ${
              activeTab === 'csv_import'
                ? 'text-emerald-800 border-b-2 border-emerald-700'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Bulk CSV / Partner Ingestion
          </button>
          <button
            onClick={() => setActiveTab('manual_add')}
            className={`pb-2.5 font-semibold transition-colors cursor-pointer ${
              activeTab === 'manual_add'
                ? 'text-emerald-800 border-b-2 border-emerald-700'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Manual Product Entry
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{importStatus}</span>
            </div>
          )}

          {activeTab === 'provenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-500">
                  Total Active Catalog: <strong className="text-stone-900 tabular-nums">{productsCount} products</strong>
                </span>
                <span className="text-xs text-stone-500">Hierarchy: Official API &gt; Partner Feed &gt; Vendor CSV &gt; Manual</span>
              </div>

              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Data Source</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Ingested / Updated</th>
                      <th className="py-2.5 px-3">Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2.5 px-3 text-stone-500 tabular-nums">
                          {formatRelativeDate(log.timestamp)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-stone-900">{log.sourceName}</td>
                        <td className="py-2.5 px-3 uppercase text-[10px] text-stone-500">{log.sourceType}</td>
                        <td className="py-2.5 px-3 tabular-nums">
                          <span className="text-emerald-800 font-bold">+{log.newProductsCount} new</span> · {log.priceUpdatesCount} price shifts
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 max-w-xs truncate">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'csv_import' && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-stone-900 block">Automated Feed & CSV Processing Pipeline:</span>
                <p className="text-stone-600 leading-relaxed">
                  Our ingestion engine validates product schemas, normalizes units (HP, kg, L), checks for duplicates via fuzzy model matching, attaches multi-vendor price offers, and logs historical price changes.
                </p>
              </div>

              <div className="border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-500">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-stone-900">Upload Agricultural Catalog CSV or JSON</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Drag and drop distributor price files, or simulate real-time ingestion from partner Mandi and BigHaat/AgroStar data streams.
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleSimulateCsvImport}
                    disabled={isLoading}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Simulate Rabi 2026 Batch Ingestion</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manual_add' && (
            <form onSubmit={handleManualAddProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g. John Deere 5050D Tractor"
                    className="w-full p-2 border border-stone-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Manufacturer Brand</label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="e.g. John Deere / IFFCO"
                    className="w-full p-2 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-lg"
                  >
                    <option value="tractor">Tractor & Heavy Machinery</option>
                    <option value="power_tiller">Power Tiller / Weeder</option>
                    <option value="solar_pump">Solar & Irrigation Pump</option>
                    <option value="sprayer">Crop Sprayer</option>
                    <option value="fertilizer_npk">NPK Fertilizer</option>
                    <option value="fertilizer_bio">Bio-fertilizer</option>
                    <option value="fertilizer_micronutrient">Micronutrient</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Listed Base Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full p-2 border border-stone-300 rounded-lg tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Primary Vendor</label>
                  <input
                    type="text"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Engine HP (If Machinery)</label>
                  <input
                    type="number"
                    value={newHp || ''}
                    onChange={(e) => setNewHp(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 50"
                    className="w-full p-2 border border-stone-300 rounded-lg tabular-nums"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">NPK Ratio (If Fertilizer)</label>
                  <input
                    type="text"
                    value={newNpk}
                    onChange={(e) => setNewNpk(e.target.value)}
                    placeholder="e.g. 19:19:19"
                    className="w-full p-2 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Save to Verified Catalog
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
