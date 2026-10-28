import React, { useState } from 'react';
import { AgriculturalProduct } from '../types/agricultural';
import { Language, UI_STRINGS } from '../data/translations';
import { formatInr } from '../utils/formatters';
import { X, Check, Trash2, ArrowRight, Printer, Sparkles, Scale, ExternalLink } from 'lucide-react';

interface ComparisonModalProps {
  products: AgriculturalProduct[];
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  language: Language;
  onOpenProductDetail: (product: AgriculturalProduct) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  products,
  onRemoveProduct,
  onClearAll,
  onClose,
  language,
  onOpenProductDetail,
}) => {
  const [highlightDiffs, setHighlightDiffs] = useState(true);
  const [serverCompareData, setServerCompareData] = useState<any[]>([]);
  const t = UI_STRINGS[language];

  React.useEffect(() => {
    if (products.length > 0) {
      fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: products.map((p) => p.id) }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.items)) {
            setServerCompareData(data.items);
          }
        })
        .catch(() => {});
    }
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-4 border border-stone-200 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-500">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">No Products Selected for Comparison</h3>
          <p className="text-sm text-stone-600">
            Browse our catalog and click "Add to Compare" on up to 4 tractors, tillers, pumps, or fertilizers to view them side-by-side.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  // Calculate winning attributes
  const bestPrices = products.map((p) => Math.min(...p.offers.map((o) => o.discountPriceInr || o.listedPriceInr)));
  const lowestOverallPrice = Math.min(...bestPrices);

  const highestHp = Math.max(...products.map((p) => p.specs.engineHp || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                {language === 'hi' ? 'साइड-बाय-साइड कृषि उत्पाद तुलना' : 'Side-by-Side Product Comparison'}
              </h2>
              <span className="text-xs text-stone-500">
                Comparing {products.length} of 4 maximum products · Normalized data
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Highlight Diffs Toggle */}
            <label className="hidden sm:flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={highlightDiffs}
                onChange={(e) => setHighlightDiffs(e.target.checked)}
                className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Highlight Differences</span>
            </label>

            {/* Clear all */}
            <button
              onClick={onClearAll}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearAll}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Matrix Table - Horizontal scrollable */}
        <div className="overflow-x-auto p-6 flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="w-48 py-4 px-3 text-stone-400 uppercase tracking-wider text-[11px] font-bold">
                  Attribute / Specification
                </th>
                {products.map((prod) => {
                  const bestPrice = Math.min(...prod.offers.map((o) => o.discountPriceInr || o.listedPriceInr));
                  const isLowestPrice = bestPrice === lowestOverallPrice;
                  return (
                    <th key={prod.id} className="min-w-[240px] max-w-[280px] py-4 px-4 align-top">
                      <div className="relative group bg-stone-50/80 p-3 rounded-xl border border-stone-200 flex flex-col justify-between h-full space-y-2">
                        {/* Remove button */}
                        <button
                          onClick={() => onRemoveProduct(prod.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-stone-300 shadow-xs flex items-center justify-center text-stone-500 hover:text-rose-600 hover:border-rose-300 cursor-pointer"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="aspect-4/3 rounded-lg overflow-hidden bg-white border border-stone-200">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                            {prod.brand}
                          </span>
                          <h4
                            onClick={() => onOpenProductDetail(prod)}
                            className="text-sm font-bold text-stone-900 line-clamp-2 hover:text-emerald-800 cursor-pointer mt-0.5"
                          >
                            {language === 'hi' ? prod.nameHindi || prod.name : prod.name}
                          </h4>
                        </div>

                        {/* Best price callout */}
                        <div className="pt-2 border-t border-stone-200 flex items-baseline justify-between">
                          <div>
                            <span className="text-base font-extrabold text-stone-900 tabular-nums">
                              {formatInr(bestPrice)}
                            </span>
                            <span className="text-[10px] text-stone-500 block">{prod.offers.length} sellers</span>
                          </div>

                          {isLowestPrice && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              Lowest Price
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 text-stone-700">
              {/* Category */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-3 px-3 font-semibold text-stone-600">Product Category</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-medium text-stone-900 capitalize">
                    {p.category.replace('_', ' ')}
                  </td>
                ))}
              </tr>

              {/* Best Price */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-3 px-3 font-semibold text-stone-600">Best Available Price</td>
                {products.map((p) => {
                  const best = Math.min(...p.offers.map((o) => o.discountPriceInr || o.listedPriceInr));
                  return (
                    <td key={p.id} className="py-3 px-4 tabular-nums font-extrabold text-stone-900">
                      {formatInr(best)}
                    </td>
                  );
                })}
              </tr>

              {/* Engine HP / Power */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-3 px-3 font-semibold text-stone-600">Engine / Power (HP)</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 tabular-nums font-semibold">
                    {p.specs.engineHp ? (
                      <span className={p.specs.engineHp === highestHp ? 'text-emerald-700 font-bold' : ''}>
                        {p.specs.engineHp} HP {p.specs.engineHp === highestHp ? '★' : ''}
                      </span>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Fuel Type & Burn */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-3 px-3 font-semibold text-stone-600">Fuel / Power Source</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4">
                    {p.specs.fuelType ? (
                      <span>
                        {p.specs.fuelType} {p.specs.fuelConsumptionLph ? `(~${p.specs.fuelConsumptionLph} L/h)` : ''}
                      </span>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Lifting Capacity / Tank */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-3 px-3 font-semibold text-stone-600">Lift / Tank Capacity</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 tabular-nums font-medium">
                    {p.specs.liftingCapacityKg ? `${p.specs.liftingCapacityKg} kg` : p.specs.tankCapacityLitres ? `${p.specs.tankCapacityLitres} Litres` : '—'}
                  </td>
                ))}
              </tr>

              {/* NPK Ratio (for fertilizers) */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-3 px-3 font-semibold text-stone-600">NPK Nutrient Grade</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-semibold text-emerald-800">
                    {p.specs.npkRatio || (p.specs.zincPercent ? `Zinc ${p.specs.zincPercent}%` : '—')}
                  </td>
                ))}
              </tr>

              {/* Formulation & Package */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-3 px-3 font-semibold text-stone-600">Formulation & Size</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4">
                    {p.specs.formulation ? `${p.specs.formulation} (${p.specs.packageWeightKg || p.specs.packageVolumeL || ''} ${p.specs.packageWeightKg ? 'kg' : 'L'})` : 'Equipment Unit'}
                  </td>
                ))}
              </tr>

              {/* Normalized Cost Metric */}
              <tr className="hover:bg-stone-50/50 bg-stone-50/30">
                <td className="py-3 px-3 font-bold text-stone-900">Normalized Cost Metric</td>
                {products.map((p) => {
                  const best = Math.min(...p.offers.map((o) => o.discountPriceInr || o.listedPriceInr));
                  let metric = '—';
                  if (p.specs.engineHp) {
                    metric = `₹${Math.round(best / p.specs.engineHp).toLocaleString('en-IN')} / HP`;
                  } else if (p.specs.packageWeightKg) {
                    metric = `₹${Math.round(best / p.specs.packageWeightKg).toLocaleString('en-IN')} / kg`;
                  } else if (p.specs.packageVolumeL) {
                    metric = `₹${Math.round(best / p.specs.packageVolumeL).toLocaleString('en-IN')} / Litre`;
                  }
                  return (
                    <td key={p.id} className="py-3 px-4 tabular-nums font-bold text-emerald-900">
                      {metric}
                    </td>
                  );
                })}
              </tr>

              {/* Farm Size Suitability */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-3 px-3 font-semibold text-stone-600">Recommended Farm Size</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 tabular-nums font-medium">
                    {p.specs.recommendedAcresMin ? `${p.specs.recommendedAcresMin} - ${p.specs.recommendedAcresMax} Acres` : 'All Holdings'}
                  </td>
                ))}
              </tr>

              {/* Warranty */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-3 px-3 font-semibold text-stone-600">Manufacturer Warranty</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-medium">
                    {p.offers[0]?.warrantyYears ? `${p.offers[0].warrantyYears} Year(s)` : 'Standard Manufacturer'}
                  </td>
                ))}
              </tr>

              {/* Annual Maintenance Estimate */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-3 px-3 font-semibold text-stone-600">Est. Annual Maintenance</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 tabular-nums">
                    {p.annualMaintenanceEstInr ? formatInr(p.annualMaintenanceEstInr) : 'Consumable only'}
                  </td>
                ))}
              </tr>

              {/* Top Pros */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-3 px-3 font-semibold text-stone-600">Key Advantages</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-[11px] text-stone-600 space-y-1">
                    {p.pros.slice(0, 2).map((pr, i) => (
                      <p key={i}>✓ {pr}</p>
                    ))}
                  </td>
                ))}
              </tr>

              {/* Top Trade-offs */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-3 px-3 font-semibold text-stone-600">Trade-offs & Limits</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-[11px] text-stone-500 space-y-1">
                    {p.cons.slice(0, 2).map((cn, i) => (
                      <p key={i}>• {cn}</p>
                    ))}
                  </td>
                ))}
              </tr>

              {/* Direct Actions */}
              <tr className="hover:bg-stone-50/50">
                <td className="py-4 px-3 font-semibold text-stone-600">Explore</td>
                {products.map((p) => (
                  <td key={p.id} className="py-4 px-4">
                    <button
                      onClick={() => onOpenProductDetail(p)}
                      className="w-full py-2 px-3 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer text-center"
                    >
                      View All Sellers
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Notice */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2 shrink-0">
          <span>* Specifications normalized from manufacturer operator manuals and ICAR certified test sheets.</span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-200 hover:border-stone-300 rounded text-stone-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Comparison</span>
          </button>
        </div>
      </div>
    </div>
  );
};
