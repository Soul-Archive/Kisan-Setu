import React from 'react';
import { AgriculturalProduct } from '../types/agricultural';
import { Language, UI_STRINGS } from '../data/translations';
import { formatInr, formatRelativeDate } from '../utils/formatters';
import { Check, Plus, ExternalLink, Zap, ShieldCheck } from 'lucide-react';

interface ProductCardProps {
  product: AgriculturalProduct;
  language: Language;
  isInCompare: boolean;
  onToggleCompare: (product: AgriculturalProduct) => void;
  onSelectProduct: (product: AgriculturalProduct) => void;
  onAskAi: (product: AgriculturalProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  language,
  isInCompare,
  onToggleCompare,
  onSelectProduct,
  onAskAi,
}) => {
  const t = UI_STRINGS[language];

  // Best price across all offers
  const bestPrice = Math.min(...product.offers.map((o) => o.discountPriceInr || o.listedPriceInr));
  const highestListed = Math.max(...product.offers.map((o) => o.listedPriceInr));
  const hasDiscount = highestListed > bestPrice;
  const discountPercent = hasDiscount ? Math.round(((highestListed - bestPrice) / highestListed) * 100) : 0;

  // Normalized metric highlight
  let specMetric = '';
  if (product.specs.engineHp) {
    specMetric = `${product.specs.engineHp} HP Engine · ${product.specs.fuelConsumptionLph || '3.8'} L/h`;
  } else if (product.specs.npkRatio) {
    specMetric = `NPK ${product.specs.npkRatio} · ${product.specs.formulation || 'Granular'}`;
  } else if (product.specs.tankCapacityLitres) {
    specMetric = `${product.specs.tankCapacityLitres}L Capacity · ${product.specs.fuelType}`;
  } else if (product.specs.solarPanelWattage) {
    specMetric = `${product.specs.solarPanelWattage}W Solar Array · ${product.specs.headMeters || 70}m Head`;
  }

  return (
    <div className="group bg-white rounded-xl border border-stone-200 hover:border-emerald-500/60 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden">
      {/* Top Image & Provenance Badge */}
      <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden cursor-pointer" onClick={() => onSelectProduct(product)}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Graceful fallback to styled neutral container
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />

        {/* Fallback container if image fails or before load */}
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-stone-100 to-stone-200 flex flex-col items-center justify-center p-4 text-center">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{product.brand}</span>
          <span className="text-sm font-bold text-stone-800 mt-1">{product.name}</span>
        </div>

        {/* Quiet Provenance Indicator (No Pill, Subtle Text Scrim) */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white/95 bg-stone-950/70 backdrop-blur-xs px-2.5 py-1 rounded-md">
          <span className="truncate max-w-[170px]">{product.dataProvenance.primarySource}</span>
          <span className="tabular-nums shrink-0">{formatRelativeDate(product.dataProvenance.lastUpdated)}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Unboxed Brand and Spec Metric (Strict Zero-Pill) */}
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <span className="uppercase tracking-wider font-semibold text-stone-700">{product.brand}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium truncate">{specMetric}</span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onSelectProduct(product)}
            className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors mt-1 cursor-pointer line-clamp-2 leading-snug"
          >
            {language === 'hi' ? product.nameHindi || product.name : product.name}
          </h3>

          {/* Multi-Vendor Pricing Line */}
          <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-stone-900 tabular-nums">
                  {formatInr(bestPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-stone-400 line-through tabular-nums">
                    {formatInr(highestListed)}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {product.offers.length} {t.offersAvailable} {product.offers[0]?.vendorName.split(' ')[0]}
              </p>
            </div>

            {hasDiscount && (
              <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                Save {discountPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Key Features Bullet List (1-2 lines) */}
        <ul className="text-xs text-stone-600 space-y-1">
          {product.keyFeatures.slice(0, 2).map((feat, idx) => (
            <li key={idx} className="flex items-start gap-1.5 line-clamp-1">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{feat}</span>
            </li>
          ))}
        </ul>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          {/* Add to Compare Button */}
          <button
            onClick={() => onToggleCompare(product)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              isInCompare
                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
            }`}
          >
            {isInCompare ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t.removeFromCompare}</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addToCompare}</span>
              </>
            )}
          </button>

          {/* View Details */}
          <button
            onClick={() => onSelectProduct(product)}
            className="px-3 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 border border-stone-200 hover:border-stone-300 rounded-lg transition-colors cursor-pointer"
          >
            {t.viewDetails}
          </button>
        </div>
      </div>
    </div>
  );
};
