import React from 'react';
import { Language, UI_STRINGS } from '../data/translations';
import { Search, ShieldCheck, Cpu, ArrowUpDown } from 'lucide-react';

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  language: Language;
  onOpenAiAssistant: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  language,
  onOpenAiAssistant,
}) => {
  const t = UI_STRINGS[language];

  return (
    <section className="relative overflow-hidden bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text & Search Area */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>{language === 'hi' ? 'भारतीय कृषि उत्पाद तुलना मंच' : 'Agricultural Price & Spec Comparison Platform'}</span>
              <span>·</span>
              <span>{language === 'hi' ? 'प्रमाणित मंडी व ई-कॉमर्स दरें' : 'Verified Vendor Feeds'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 font-outfit" style={{ textWrap: 'balance' }}>
              {language === 'hi'
                ? 'सही कृषि उपकरण और खाद चुनें — सर्वोत्तम मूल्य और सही सलाह के साथ'
                : 'Compare Farming Equipment & Fertilizers with Total Specification Transparency'}
            </h1>

            <p className="text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed">
              {language === 'hi'
                ? 'महिंद्रा, सोनालिका, स्वराज, इफको, कोरोमंडल और शक्ति पंप के असली दाम, टेक्निकल स्पेसिफिकेशन और ICAR आधारित सटीक अनुशंसा एक ही जगह।'
                : 'Normalize HP, NPK ratios, fuel burn, and multi-vendor pricing across AgroStar, BigHaat, TractorJunction, and local cooperatives with local Qwen3.5-4B AI assistance.'}
            </p>

            {/* Prominent Search Bar */}
            <div className="relative max-w-2xl">
              <div className="relative flex items-center bg-stone-50 border border-stone-300 focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-600/20 rounded-xl transition-all shadow-xs">
                <Search className="w-5 h-5 text-stone-400 ml-4 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full px-3 py-3.5 text-sm sm:text-base bg-transparent text-stone-900 placeholder-stone-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mr-3 text-xs font-medium text-stone-500 hover:text-stone-800 px-2 py-1 rounded bg-stone-200 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Filter Tag Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-stone-600">
                <span className="font-medium text-stone-500">{language === 'hi' ? 'लोकप्रिय खोज:' : 'Popular:'}</span>
                {[
                  { label: language === 'hi' ? '45 HP ट्रैक्टर' : '45 HP Tractors', query: 'Mahindra' },
                  { label: language === 'hi' ? 'नैनो यूरिया' : 'Nano Urea', query: 'Nano Urea' },
                  { label: '10:26:26 NPK', query: '10:26:26' },
                  { label: language === 'hi' ? 'सोलर पंप' : 'Solar Pump', query: 'Solar' },
                  { label: language === 'hi' ? 'पावर टिलर' : 'Power Tiller', query: 'Tiller' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setSearchQuery(item.query)}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust and Feature Points */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-stone-100 text-xs text-stone-600">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-stone-900 block font-semibold">{language === 'hi' ? 'सत्यापित विक्रेता' : 'Multi-Vendor Provenance'}</strong>
                  {language === 'hi' ? 'मूल स्रोत व तारीख सहित' : 'Real offers with direct links'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ArrowUpDown className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-stone-900 block font-semibold">{language === 'hi' ? 'मानकीकृत तुलना' : 'Spec Normalization'}</strong>
                  {language === 'hi' ? 'लागत प्रति HP व प्रति किग्रा पोषक' : 'Cost per HP & active nutrient'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Cpu className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-stone-900 block font-semibold">{language === 'hi' ? 'लोकल Qwen3.5-4B' : 'Local Qwen3.5 AI'}</strong>
                  <button onClick={onOpenAiAssistant} className="text-emerald-700 hover:underline cursor-pointer">
                    {language === 'hi' ? 'एआई से सवाल पूछें →' : 'Ask AI advice →'}
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Right Visual Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-stone-200 aspect-16/10 lg:aspect-4/3 bg-stone-100">
              <img
                src="/src/assets/images/hero_indian_farming_1793167690336.jpg"
                alt="Indian Farmer in field with tractor at sunset"
                className="w-full h-full object-cover object-center"
                loading="eager"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent flex flex-col justify-end p-5 text-white">
                <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
                  {language === 'hi' ? 'स्मार्ट निर्णय · समृद्ध किसान' : 'Real-time Agricultural Intelligence'}
                </span>
                <p className="text-sm font-medium text-stone-100 mt-1">
                  {language === 'hi'
                    ? 'अनावश्यक खर्च रोकें, अपनी मिट्टी और जोत के अनुसार सही मशीन व खाद चुनें।'
                    : 'Transparent comparison of real farm equipment without sponsored algorithmic bias.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
