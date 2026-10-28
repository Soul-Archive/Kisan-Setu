import React, { useState, useMemo } from 'react';
import { AgriculturalProduct } from '../types/agricultural';
import { Language, UI_STRINGS } from '../data/translations';
import { CROP_ADVISORIES, AGRICULTURAL_DISCLAIMER } from '../data/agriculturalKnowledge';
import { calculateFertilizerRecommendation, FertilizerRecommendationOutput } from '../services/recommendationEngine';
import { formatInr } from '../utils/formatters';
import { Sprout, ShieldAlert, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Calculator, ExternalLink } from 'lucide-react';

interface FertilizerAdvisorProps {
  products: AgriculturalProduct[];
  language: Language;
  onOpenProductDetail: (product: AgriculturalProduct) => void;
  onAskAi: (product: AgriculturalProduct) => void;
}

export const FertilizerAdvisor: React.FC<FertilizerAdvisorProps> = ({
  products,
  language,
  onOpenProductDetail,
  onAskAi,
}) => {
  const t = UI_STRINGS[language];

  // Wizard state
  const [selectedCropId, setSelectedCropId] = useState('wheat');
  const [selectedStageName, setSelectedStageName] = useState('Basal / Sowing');
  const [landAreaAcres, setLandAreaAcres] = useState(3);
  const [soilType, setSoilType] = useState('Alluvial');
  const [irrigationStatus, setIrrigationStatus] = useState<'Assured Canal / Tube Well' | 'Rainfed / Dependent' | 'Drip / Sprinkler'>('Assured Canal / Tube Well');
  const [hasSoilTest, setHasSoilTest] = useState(false);
  const [soilN, setSoilN] = useState<'low' | 'medium' | 'high'>('medium');
  const [soilP, setSoilP] = useState<'low' | 'medium' | 'high'>('medium');
  const [soilK, setSoilK] = useState<'low' | 'medium' | 'high'>('medium');
  const [soilPh, setSoilPh] = useState<number>(7.2);
  const [budgetCap, setBudgetCap] = useState<number>(10000);

  const selectedCrop = useMemo(() => {
    return CROP_ADVISORIES.find((c) => c.cropId === selectedCropId) || CROP_ADVISORIES[0];
  }, [selectedCropId]);

  // Run deterministic calculation
  const recommendation: FertilizerRecommendationOutput = useMemo(() => {
    return calculateFertilizerRecommendation(
      {
        cropId: selectedCropId,
        stageName: selectedStageName,
        landAreaAcres,
        soilType,
        irrigationStatus,
        hasSoilTest,
        soilNitrogenLevel: soilN,
        soilPhosphorusLevel: soilP,
        soilPotassiumLevel: soilK,
        soilPh: hasSoilTest ? soilPh : undefined,
        budgetCapInr: budgetCap > 0 ? budgetCap : undefined,
      },
      products
    );
  }, [selectedCropId, selectedStageName, landAreaAcres, soilType, irrigationStatus, hasSoilTest, soilN, soilP, soilK, soilPh, budgetCap, products]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
          <Sprout className="w-4 h-4 text-emerald-600" />
          <span>{language === 'hi' ? 'प्रमाणित पोषण प्रबंधन' : 'Verified Agronomy Engine'}</span>
          <span>·</span>
          <span>ICAR-Recommended Dosage Framework</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-outfit" style={{ textWrap: 'balance' }}>
          {language === 'hi'
            ? 'फसल व मिट्टी अनुसार खाद अनुशंसा और लागत कैलकुलेटर'
            : 'Crop & Soil-Specific Fertilizer Advisory & Unit Cost Calculator'}
        </h2>

        <p className="text-sm sm:text-base text-stone-600 max-w-3xl leading-relaxed">
          {language === 'hi'
            ? 'अपनी फसल, बढ़वार की अवस्था और खेत का क्षेत्रफल चुनें। प्रणाली ICAR के मानकों के अनुसार आवश्यक शुद्ध नाइट्रोजन, फॉस्फोरस और पोटाश की गणना कर सबसे किफायती ब्रांड व पैकेज की सिफारिश करेगी।'
            : 'Select your crop, growth stage, acreage, and soil-test values. Our deterministic agritech engine calculates net nutrient requirements (N, P2O5, K2O) and evaluates cost-per-kg of active nutrition.'}
        </p>
      </div>

      {/* 2-Column Layout: Input Form Left, Recommendation Output Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-700" />
              <span>{language === 'hi' ? 'खेत और फसल विवरण' : 'Farm & Crop Parameters'}</span>
            </h3>
            <span className="text-xs text-stone-500">Step 1 of 2</span>
          </div>

          {/* 1. Crop Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              1. {language === 'hi' ? 'फसल का चयन करें (Crop)' : 'Select Crop'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CROP_ADVISORIES.map((crop) => (
                <button
                  key={crop.cropId}
                  onClick={() => {
                    setSelectedCropId(crop.cropId);
                    setSelectedStageName(crop.stages[0].stageName);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    selectedCropId === crop.cropId
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <span className="text-xs block">{language === 'hi' ? crop.cropNameHindi : crop.cropName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Crop Growth Stage */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              2. {language === 'hi' ? 'फसल की अवस्था (Growth Stage)' : 'Growth Stage'}
            </label>
            <div className="space-y-1.5">
              {selectedCrop.stages.map((stg) => (
                <button
                  key={stg.stageName}
                  onClick={() => setSelectedStageName(stg.stageName)}
                  className={`w-full p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between ${
                    selectedStageName === stg.stageName
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <span className="text-xs">{language === 'hi' ? stg.stageNameHindi : stg.stageName}</span>
                  {selectedStageName === stg.stageName && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Farm Acreage Slider & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                {language === 'hi' ? 'खेत का आकार (Acres)' : 'Land Area (Acres)'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={landAreaAcres}
                  onChange={(e) => setLandAreaAcres(Math.max(0.5, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-sm font-bold border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
                />
                <span className="text-xs text-stone-500 font-semibold">Acres</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                {language === 'hi' ? 'बजट सीमा (₹)' : 'Budget Cap (₹)'}
              </label>
              <input
                type="number"
                min="500"
                step="500"
                value={budgetCap}
                onChange={(e) => setBudgetCap(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-bold border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* 4. Irrigation Condition */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              {language === 'hi' ? 'सिंचाई की सुविधा' : 'Irrigation Facility'}
            </label>
            <select
              value={irrigationStatus}
              onChange={(e) => setIrrigationStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-medium border border-stone-300 rounded-lg bg-stone-50 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Assured Canal / Tube Well">Assured Canal / Tube Well (नहर / नलकूप)</option>
              <option value="Drip / Sprinkler">Drip / Micro-Sprinkler (ड्रिप / स्प्रिंकलर)</option>
              <option value="Rainfed / Dependent">Rainfed / Dependent (बारिश पर निर्भर)</option>
            </select>
          </div>

          {/* 5. Soil-Test Calibration Toggle */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 block">
                  {language === 'hi' ? 'मृदा स्वास्थ्य कार्ड (Soil Test)?' : 'Have a Soil Test Report?'}
                </span>
                <span className="text-[11px] text-stone-500">Fine-tunes Nitrogen, Phosphorus & Potash multipliers</span>
              </div>
              <input
                type="checkbox"
                checked={hasSoilTest}
                onChange={(e) => setHasSoilTest(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 border-stone-300 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {hasSoilTest && (
              <div className="pt-2 grid grid-cols-2 gap-3 border-t border-stone-200 text-xs">
                <div>
                  <label className="text-stone-600 block mb-1">Nitrogen (N)</label>
                  <select
                    value={soilN}
                    onChange={(e) => setSoilN(e.target.value as any)}
                    className="w-full p-1.5 border border-stone-300 rounded bg-white"
                  >
                    <option value="low">Low (&lt; 280 kg/ha)</option>
                    <option value="medium">Medium (280-560)</option>
                    <option value="high">High (&gt; 560 kg/ha)</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-600 block mb-1">Phosphorus (P)</label>
                  <select
                    value={soilP}
                    onChange={(e) => setSoilP(e.target.value as any)}
                    className="w-full p-1.5 border border-stone-300 rounded bg-white"
                  >
                    <option value="low">Low (&lt; 10 kg/ha)</option>
                    <option value="medium">Medium (10-25)</option>
                    <option value="high">High (&gt; 25 kg/ha)</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-600 block mb-1">Potash (K)</label>
                  <select
                    value={soilK}
                    onChange={(e) => setSoilK(e.target.value as any)}
                    className="w-full p-1.5 border border-stone-300 rounded bg-white"
                  >
                    <option value="low">Low (&lt; 110 kg/ha)</option>
                    <option value="medium">Medium (110-280)</option>
                    <option value="high">High (&gt; 280 kg/ha)</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-600 block mb-1">Soil pH ({soilPh})</label>
                  <input
                    type="range"
                    min="5.0"
                    max="9.0"
                    step="0.1"
                    value={soilPh}
                    onChange={(e) => setSoilPh(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Output: Calculations & Product Recommendations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Nutrient Breakdown Card */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-stone-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                  {selectedCrop.cropName} · {selectedStageName}
                </span>
                <h3 className="text-xl font-extrabold text-stone-900 font-outfit">
                  {language === 'hi' ? 'शुद्ध पोषक तत्व आवश्यकता' : 'Calculated Net Nutrient Demand'}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs text-stone-500 block">For {landAreaAcres} Acre(s)</span>
                <span className="text-base font-extrabold text-emerald-900 tabular-nums">
                  Est. Total: {formatInr(recommendation.totalEstimatedCostInr)}
                </span>
              </div>
            </div>

            {/* 3 Metric Pillars: N, P2O5, K2O */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Pure Nitrogen (N)
                </span>
                <span className="text-xl font-extrabold text-stone-900 tabular-nums mt-1 block">
                  {recommendation.nutrientDemandKg.N} kg
                </span>
                <span className="text-[10px] text-stone-400">
                  {hasSoilTest && soilN !== 'medium' ? `Adj: ${(recommendation.soilAdjustmentMultiplier.N * 100).toFixed(0)}%` : 'Standard'}
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Phosphate (P₂O₅)
                </span>
                <span className="text-xl font-extrabold text-stone-900 tabular-nums mt-1 block">
                  {recommendation.nutrientDemandKg.P2O5} kg
                </span>
                <span className="text-[10px] text-stone-400">
                  {hasSoilTest && soilP !== 'medium' ? `Adj: ${(recommendation.soilAdjustmentMultiplier.P * 100).toFixed(0)}%` : 'Standard'}
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Potash (K₂O)
                </span>
                <span className="text-xl font-extrabold text-stone-900 tabular-nums mt-1 block">
                  {recommendation.nutrientDemandKg.K2O} kg
                </span>
                <span className="text-[10px] text-stone-400">
                  {hasSoilTest && soilK !== 'medium' ? `Adj: ${(recommendation.soilAdjustmentMultiplier.K * 100).toFixed(0)}%` : 'Standard'}
                </span>
              </div>
            </div>

            {/* ICAR Official Advisory Note */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">ICAR Advisory Guidelines:</strong>
                <p className="mt-0.5 leading-relaxed">{recommendation.icarAdvisoryNote}</p>
              </div>
            </div>

            {/* Warnings or budget alerts */}
            {recommendation.warningsAndTips.map((tip, idx) => (
              <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </div>
            ))}
          </div>

          {/* Recommended Product Packages */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-stone-900">
              {language === 'hi' ? 'अनुशंसित उर्वरक उत्पाद एवं पैकेज लागत' : 'Recommended Fertilizer Products & Unit Economics'}
            </h3>

            {recommendation.recommendedProducts.map((item, idx) => {
              const bestOfferPrice = Math.min(...item.product.offers.map((o) => o.discountPriceInr || o.listedPriceInr));
              return (
                <div key={idx} className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className="font-bold uppercase tracking-wider text-emerald-800">{item.role}</span>
                      <span>·</span>
                      <span className="font-semibold text-stone-700">{item.product.brand}</span>
                    </div>

                    <h4
                      onClick={() => onOpenProductDetail(item.product)}
                      className="text-base font-bold text-stone-900 hover:text-emerald-800 cursor-pointer"
                    >
                      {language === 'hi' ? item.product.nameHindi || item.product.name : item.product.name}
                    </h4>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      <strong>Application:</strong> {item.applicationInstructions}
                    </p>

                    {/* Unit Cost Transparency */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-stone-600">
                      <span className="bg-stone-100 px-2 py-0.5 rounded">
                        Required: <strong className="text-stone-900">{item.quantityUnits} {item.unitType}</strong>
                      </span>
                      <span>
                        Cost/Acre: <strong className="text-stone-900 tabular-nums">{formatInr(item.costPerAcreInr)}</strong>
                      </span>
                      <span>
                        Active Nutrient Cost: <strong className="text-emerald-800 tabular-nums">~₹{item.costPerKgActiveNutrientInr} / kg</strong>
                      </span>
                    </div>
                  </div>

                  {/* Price & Actions Right */}
                  <div className="text-right shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 flex md:flex-col justify-between items-end">
                    <div>
                      <span className="text-xs text-stone-500 block">Total Package Cost</span>
                      <span className="text-xl font-extrabold text-stone-900 tabular-nums block">
                        {formatInr(item.totalCostInr)}
                      </span>
                      <span className="text-[11px] text-stone-400 block tabular-nums">
                        ({formatInr(bestOfferPrice)} each)
                      </span>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => onOpenProductDetail(item.product)}
                        className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Compare Offers
                      </button>
                      <button
                        onClick={() => onAskAi(item.product)}
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

          {/* Mandatory Agricultural Disclaimer */}
          <div className="p-4 bg-stone-100/80 rounded-xl border border-stone-200 text-xs text-stone-600 leading-relaxed">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-800 block mb-0.5">Disclaimer & Professional Assessment Notice:</strong>
                <span>{language === 'hi' ? AGRICULTURAL_DISCLAIMER.hi : AGRICULTURAL_DISCLAIMER.en}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
