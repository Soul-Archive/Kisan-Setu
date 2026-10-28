import React from 'react';
import { AgriculturalProduct } from '../types/agricultural';
import { Language, UI_STRINGS } from '../data/translations';
import { formatInr, formatRelativeDate } from '../utils/formatters';
import { X, ExternalLink, ShieldCheck, TrendingDown, Bot, Scale, Calendar, Check, AlertCircle } from 'lucide-react';

interface ProductDetailModalProps {
  product: AgriculturalProduct | null;
  onClose: () => void;
  language: Language;
  isInCompare: boolean;
  onToggleCompare: (product: AgriculturalProduct) => void;
  onAskAi: (product: AgriculturalProduct) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product: initialProduct,
  onClose,
  language,
  isInCompare,
  onToggleCompare,
  onAskAi,
}) => {
  const [liveProduct, setLiveProduct] = React.useState<AgriculturalProduct | null>(initialProduct);
  const t = UI_STRINGS[language];

  React.useEffect(() => {
    setLiveProduct(initialProduct);
    if (initialProduct?.id) {
      fetch(`/api/products/${initialProduct.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.id) {
            setLiveProduct(data);
          }
        })
        .catch(() => {});
    }
  }, [initialProduct?.id]);

  if (!liveProduct) return null;
  const product = liveProduct;
  const bestPrice = Math.min(...product.offers.map((o) => o.discountPriceInr || o.listedPriceInr), product.basePriceInr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/80 shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <span className="font-bold uppercase tracking-wider text-stone-700">{product.brand}</span>
            <span>·</span>
            <span>Model: {product.modelNumber}</span>
            <span>·</span>
            <span className="text-emerald-700">Updated {formatRelativeDate(product.dataProvenance.lastUpdated)}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Overview Split */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Image */}
            <div className="md:col-span-5 rounded-xl overflow-hidden border border-stone-200 aspect-4/3 bg-stone-100">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Title & Quick Buy/Compare CTAs */}
            <div className="md:col-span-7 space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
                {language === 'hi' ? product.nameHindi || product.name : product.name}
              </h2>

              <p className="text-sm text-stone-600 leading-relaxed">
                {language === 'hi' ? product.descriptionHindi || product.description : product.description}
              </p>

              {/* Price Banner */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide block">
                    {t.bestPrice} across {product.offers.length} sellers
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tabular-nums">
                    {formatInr(bestPrice)}
                  </span>
                </div>

                <div className="text-right text-xs text-stone-600">
                  <span className="block font-medium">Warranty: {product.offers[0]?.warrantyYears || 1} Year(s)</span>
                  <span className="block text-stone-500">Free delivery on select offers</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={() => onToggleCompare(product)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    isInCompare
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-stone-900 text-white hover:bg-stone-800'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  <span>{isInCompare ? t.removeFromCompare : t.addToCompare}</span>
                </button>

                <button
                  onClick={() => onAskAi(product)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-emerald-700" />
                  <span>{t.askAiAboutThis}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Multi-Vendor Comparison Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">
                {language === 'hi' ? 'सत्यापित विक्रेता एवं मूल्य तुलना' : 'Multi-Vendor Offers & Live Availability'}
              </h3>
              <span className="text-xs text-stone-500">
                Provenance: {product.dataProvenance.primarySource}
              </span>
            </div>

            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700 divide-y divide-stone-200">
                  <thead className="bg-stone-50 font-semibold text-stone-600">
                    <tr>
                      <th className="py-2.5 px-3">Seller / Vendor</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Price (₹)</th>
                      <th className="py-2.5 px-3">Delivery</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Offer Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {product.offers.map((offer) => {
                      const isBest = (offer.discountPriceInr || offer.listedPriceInr) === bestPrice;
                      return (
                        <tr key={offer.id} className={isBest ? 'bg-emerald-50/30 font-medium' : ''}>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              {offer.verifiedSeller && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              <span className="font-semibold text-stone-900">{offer.vendorName}</span>
                            </div>
                            {offer.locationCity && (
                              <span className="text-[11px] text-stone-500 block">{offer.locationCity}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-stone-600">{offer.vendorType}</td>
                          <td className="py-3 px-3 tabular-nums font-bold text-stone-900">
                            {formatInr(offer.discountPriceInr || offer.listedPriceInr)}
                            {offer.shippingCostInr > 0 ? (
                              <span className="text-[10px] text-stone-500 block font-normal">+ ₹{offer.shippingCostInr} shipping</span>
                            ) : (
                              <span className="text-[10px] text-emerald-700 block font-normal">Free shipping</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-stone-600">
                            {offer.deliveryDays} {t.days}
                          </td>
                          <td className="py-3 px-3">
                            {offer.inStock ? (
                              <span className="text-emerald-700 font-semibold">In Stock</span>
                            ) : (
                              <span className="text-amber-700 font-semibold">Pre-order</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <a
                              href={offer.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                            >
                              <span>Visit Store</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Technical Specifications Grid */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-stone-900">{t.specsTitle}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {product.specs.engineHp && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs text-stone-500 block">Engine Horsepower</span>
                  <span className="text-sm font-bold text-stone-900 tabular-nums">{product.specs.engineHp} HP</span>
                </div>
              )}
              {product.specs.ptoHp && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs text-stone-500 block">PTO Horsepower</span>
                  <span className="text-sm font-bold text-stone-900 tabular-nums">{product.specs.ptoHp} HP</span>
                </div>
              )}
              {product.specs.displacementCc && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs text-stone-500 block">Displacement</span>
                  <span className="text-sm font-bold text-stone-900 tabular-nums">{product.specs.displacementCc} cc</span>
                </div>
              )}
              {product.specs.fuelConsumptionLph && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs text-stone-500 block">Fuel Consumption</span>
                  <span className="text-sm font-bold text-stone-900 tabular-nums">{product.specs.fuelConsumptionLph} L/hr</span>
                </div>
              )}
              {product.specs.liftingCapacityKg && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs text-stone-500 block">Hydraulic Lift</span>
                  <span className="text-sm font-bold text-stone-900 tabular-nums">{product.specs.liftingCapacityKg} kg</span>
                </div>
              )}
              {product.specs.npkRatio && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs text-stone-500 block">NPK Grade</span>
                  <span className="text-sm font-bold text-stone-900">{product.specs.npkRatio}</span>
                </div>
              )}
              {product.specs.nitrogenPercent !== undefined && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs text-stone-500 block">Nitrogen (N)</span>
                  <span className="text-sm font-bold text-stone-900 tabular-nums">{product.specs.nitrogenPercent}%</span>
                </div>
              )}
              {product.specs.phosphorusPercent !== undefined && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs text-stone-500 block">Phosphorus (P2O5)</span>
                  <span className="text-sm font-bold text-stone-900 tabular-nums">{product.specs.phosphorusPercent}%</span>
                </div>
              )}
              {product.specs.potassiumPercent !== undefined && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs text-stone-500 block">Potash (K2O)</span>
                  <span className="text-sm font-bold text-stone-900 tabular-nums">{product.specs.potassiumPercent}%</span>
                </div>
              )}
              {product.specs.solarPanelWattage && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs text-stone-500 block">Solar Array Capacity</span>
                  <span className="text-sm font-bold text-stone-900 tabular-nums">{product.specs.solarPanelWattage} Watts</span>
                </div>
              )}
              {product.specs.dischargeLpm && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs text-stone-500 block">Water Discharge</span>
                  <span className="text-sm font-bold text-stone-900 tabular-nums">{product.specs.dischargeLpm} LPM</span>
                </div>
              )}
              {product.specs.recommendedAcresMin && (
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-xs text-stone-500 block">Recommended Farm Size</span>
                  <span className="text-sm font-bold text-stone-900 tabular-nums">
                    {product.specs.recommendedAcresMin} - {product.specs.recommendedAcresMax} Acres
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pros & Cons Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-2">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verified Strengths & Advantages</span>
              </span>
              <ul className="text-xs text-stone-700 space-y-1.5">
                {product.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-stone-500" />
                <span>Operating Considerations & Trade-offs</span>
              </span>
              <ul className="text-xs text-stone-600 space-y-1.5">
                {product.cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-stone-400 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Price History Record */}
          {product.priceHistory && product.priceHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wide block">
                {t.priceTrendTitle}
              </span>
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                {product.priceHistory.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 py-1 px-2.5 bg-stone-100 rounded-md">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span>{h.date}:</span>
                    <strong className="text-stone-900 tabular-nums">{formatInr(h.priceInr)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>Official manufacturer warranty and MRP regulations apply.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
