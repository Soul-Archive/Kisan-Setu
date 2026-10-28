import React, { useState, useMemo } from 'react';
import { AgriculturalProduct } from '../types/agricultural';
import { Language, UI_STRINGS } from '../data/translations';
import { calculateEquipmentRecommendation, EquipmentRecommendationOutput } from '../services/recommendationEngine';
import { formatInr } from '../utils/formatters';
import { Wrench, CheckCircle2, AlertCircle, Fuel, Gauge, Award, ChevronRight, Zap } from 'lucide-react';

interface EquipmentAdvisorProps {
  products: AgriculturalProduct[];
  language: Language;
  onOpenProductDetail: (product: AgriculturalProduct) => void;
  onAskAi: (product: AgriculturalProduct) => void;
}

export const EquipmentAdvisor: React.FC<EquipmentAdvisorProps> = ({
  products,
  language,
  onOpenProductDetail,
  onAskAi,
}) => {
  const t = UI_STRINGS[language];

  const [farmAcres, setFarmAcres] = useState<number>(6);
  const [soilType, setSoilType] = useState<string>('Black Cotton');
  const [primaryTasks, setPrimaryTasks] = useState<string[]>(['Tillage & Plowing', 'Rotavator & Seedbed']);
  const [powerSource, setPowerSource] = useState<'3-Phase Grid' | 'Single Phase' | 'Diesel Only' | 'Solar Eligible'>('Solar Eligible');
  const [budgetCap, setBudgetCap] = useState<number>(750000);
  const [prioritizeLowOperatingCost, setPrioritizeLowOperatingCost] = useState(true);

  const evaluation: EquipmentRecommendationOutput = useMemo(() => {
    return calculateEquipmentRecommendation(
      {
        farmSizeAcres: farmAcres,
        soilType,
        primaryTasks,
        powerAvailability: powerSource,
        budgetCapInr: budgetCap > 0 ? budgetCap : undefined,
        prioritizeLowOperatingCost,
      },
      products
    );
  }, [farmAcres, soilType, primaryTasks, powerSource, budgetCap, prioritizeLowOperatingCost, products]);

  const toggleTask = (task: string) => {
    if (primaryTasks.includes(task)) {
      if (primaryTasks.length > 1) {
        setPrimaryTasks(primaryTasks.filter((t) => t !== task));
      }
    } else {
      setPrimaryTasks([...primaryTasks, task]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider">
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>{language === 'hi' ? 'स्मार्ट मशीनरी चयन' : 'Machinery & Tractor Sizing Engine'}</span>
          <span>·</span>
          <span>Transparent Engineering Fit & Operational Costing</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-outfit" style={{ textWrap: 'balance' }}>
          {language === 'hi'
            ? 'अपनी जोत और मिट्टी के अनुसार सही ट्रैक्टर, टिलर या सोलर पंप खोजें'
            : 'Find the Right Tractor, Power Tiller & Solar Pump for Your Holding'}
        </h2>

        <p className="text-sm sm:text-base text-stone-600 max-w-3xl leading-relaxed">
          {language === 'hi'
            ? 'हम केवल सबसे सस्ते उत्पाद को पहली रैंक नहीं देते। हम आपकी जोत (एकड़), मिट्टी का खिंचाव, डीजल खपत और सेवा नेटवर्क के आधार पर संतुलित और ईमानदार तुलना प्रस्तुत करते हैं।'
            : 'We evaluate equipment based on PTO torque, soil resistance, field duty cycles, and diesel vs solar life-cycle operating costs rather than superficial marketing tags.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Input Configuration */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-200">
            {language === 'hi' ? 'खेत और कार्य आवश्यकताएं' : 'Farm Constraints & Operational Needs'}
          </h3>

          {/* Farm Size */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-stone-700 uppercase tracking-wider">
              <span>{language === 'hi' ? 'खेत का क्षेत्रफल' : 'Total Farm Holding'}</span>
              <span className="text-emerald-800 text-sm font-extrabold tabular-nums">{farmAcres} Acres</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="30"
              step="0.5"
              value={farmAcres}
              onChange={(e) => setFarmAcres(Number(e.target.value))}
              className="w-full accent-emerald-700"
            />
            <div className="flex justify-between text-[11px] text-stone-400">
              <span>0.5 Acre (Smallholder)</span>
              <span>10 Acres</span>
              <span>30+ Acres (Commercial)</span>
            </div>
          </div>

          {/* Soil Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              {language === 'hi' ? 'मिट्टी का प्रकार (Soil Draft)' : 'Soil & Terrain Type'}
            </label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold border border-stone-300 rounded-lg bg-stone-50"
            >
              <option value="Alluvial">Alluvial / Indo-Gangetic Plains (जलोढ़ - मध्यम खिंचाव)</option>
              <option value="Black Cotton">Black Cotton / Heavy Clay (काली कपासी मिट्टी - भारी खिंचाव)</option>
              <option value="Red / Sandy Loam">Red / Sandy Loam (लाल रेतीली दोमट)</option>
              <option value="Hilly / Terraced">Hilly / Terraced Orchards (पहाड़ी / सीढ़ीदार खेत)</option>
            </select>
          </div>

          {/* Intended Tasks */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              {language === 'hi' ? 'मुख्य कृषि कार्य (Multiple Select)' : 'Intended Tasks & Applications'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Tillage & Plowing',
                'Rotavator & Seedbed',
                'Vegetable Weeding',
                'Water Pumping',
                'Pest Spraying',
                'Trolley Haulage',
              ].map((task) => {
                const active = primaryTasks.includes(task);
                return (
                  <button
                    key={task}
                    onClick={() => toggleTask(task)}
                    className={`p-2 rounded-lg text-left text-xs transition-colors cursor-pointer border ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                    }`}
                  >
                    <span>{task}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Power Availability */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              {language === 'hi' ? 'ऊर्जा / बिजली उपलब्धता' : 'Energy & Power Infrastructure'}
            </label>
            <select
              value={powerSource}
              onChange={(e) => setPowerSource(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-medium border border-stone-300 rounded-lg bg-stone-50"
            >
              <option value="Solar Eligible">Solar Eligible (PM-KUSUM subsidy applicable)</option>
              <option value="3-Phase Grid">3-Phase Rural Electricity Grid</option>
              <option value="Diesel Only">Diesel Only (No Reliable Power Line)</option>
              <option value="Single Phase">Single Phase Domestic Connection</option>
            </select>
          </div>

          {/* Budget Cap */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              {language === 'hi' ? 'अधिकतम बजट सीमा (₹)' : 'Maximum Budget Cap (₹)'}
            </label>
            <input
              type="number"
              min="20000"
              step="25000"
              value={budgetCap}
              onChange={(e) => setBudgetCap(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-bold border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
            />
          </div>
        </div>

        {/* Right Output: Ranked Machine Matches */}
        <div className="lg:col-span-7 space-y-6">
          {/* Sizing Context Summary Box */}
          <div className="bg-stone-900 text-white p-5 rounded-2xl space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                Engineering Assessment
              </span>
              <span className="text-xs text-stone-400">
                Est. Annual Duty: ~{evaluation.evaluatedFarmContext.estimatedAnnualWorkHours} Hours
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-lg font-bold">Recommended Category:</span>
              <span className="text-xl font-extrabold text-amber-300">
                {evaluation.evaluatedFarmContext.recommendedHpRange}
              </span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              {evaluation.summaryNote}
            </p>
          </div>

          {/* Matches List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-stone-900">
              {language === 'hi' ? 'प्राथमिकता अनुसार उपकरण व लागत विश्लेषण' : 'Ranked Equipment Matches & Trade-offs'}
            </h3>

            {evaluation.matches.slice(0, 4).map((match, idx) => {
              const matchedProduct = products.find((p) => p.id === match.productId);
              if (!matchedProduct) return null;

              const bestPrice = Math.min(...matchedProduct.offers.map((o) => o.discountPriceInr || o.listedPriceInr));

              return (
                <div
                  key={match.productId}
                  className="bg-white p-5 rounded-xl border border-stone-200 hover:border-emerald-500/60 shadow-xs space-y-4 transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-800">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                          {matchedProduct.brand} · {matchedProduct.specs.engineHp ? `${matchedProduct.specs.engineHp} HP` : matchedProduct.category}
                        </span>
                        <h4
                          onClick={() => onOpenProductDetail(matchedProduct)}
                          className="text-base font-bold text-stone-900 hover:text-emerald-800 cursor-pointer"
                        >
                          {language === 'hi' ? matchedProduct.nameHindi || matchedProduct.name : matchedProduct.name}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-extrabold text-stone-900 tabular-nums block">
                        {formatInr(bestPrice)}
                      </span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {match.matchTier} ({match.score}% Fit)
                      </span>
                    </div>
                  </div>

                  {/* Why it matches */}
                  <div className="space-y-1.5 text-xs text-stone-700">
                    <strong className="text-stone-900 block font-semibold">Suitability Factors:</strong>
                    <ul className="space-y-1">
                      {match.suitabilityReasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-emerald-900">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Trade-offs & warnings */}
                  {match.tradeOffs.length > 0 && (
                    <div className="space-y-1 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <strong className="text-stone-800 block font-medium">Trade-offs to Consider:</strong>
                      {match.tradeOffs.map((to, i) => (
                        <p key={i} className="text-stone-500">• {to}</p>
                      ))}
                    </div>
                  )}

                  {/* Operating Cost Footer */}
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-600 gap-3">
                    <div className="flex items-center gap-2">
                      <Fuel className="w-3.5 h-3.5 text-stone-400" />
                      <span>
                        Est. Annual Operating Cost: <strong className="text-stone-900 tabular-nums">{formatInr(match.annualOperatingCostInr || 10000)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenProductDetail(matchedProduct)}
                        className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Inspect Sellers
                      </button>
                      <button
                        onClick={() => onAskAi(matchedProduct)}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Ask Qwen3.5
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
