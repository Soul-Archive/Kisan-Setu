import React, { useState, useEffect, useMemo } from 'react';
import { AgriculturalProduct, FarmProfile } from './types/agricultural';
import { Language, UI_STRINGS } from './data/translations';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ComparisonModal } from './components/ComparisonModal';
import { FertilizerAdvisor } from './components/FertilizerAdvisor';
import { EquipmentAdvisor } from './components/EquipmentAdvisor';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { AdminIngestionModal } from './components/AdminIngestionModal';
import { FarmProfileModal } from './components/FarmProfileModal';
import { formatInr } from './utils/formatters';
import {
  Scale,
  Bot,
  Filter,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Sprout,
  Wrench,
  Search,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', labelEn: 'All Categories', labelHi: 'सभी श्रेणियां' },
  { id: 'tractor', labelEn: 'Tractors & Machinery', labelHi: 'ट्रैक्टर व भारी मशीनरी' },
  { id: 'power_tiller', labelEn: 'Power Tillers & Weeders', labelHi: 'पावर टिलर व वीडर' },
  { id: 'solar_pump', labelEn: 'Solar & Irrigation Pumps', labelHi: 'सोलर व सिंचाई पंप' },
  { id: 'sprayer', labelEn: 'Sprayers & Protection', labelHi: 'स्प्रे पंप व सुरक्षा' },
  { id: 'fertilizer_npk', labelEn: 'NPK Fertilizers', labelHi: 'एनपीके खाद' },
  { id: 'fertilizer_bio', labelEn: 'Bio-Fertilizers', labelHi: 'जैविक खाद व टॉनिक' },
  { id: 'fertilizer_micronutrient', labelEn: 'Micronutrients', labelHi: 'सूक्ष्म पोषक तत्व' },
];

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const t = UI_STRINGS[language];

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'catalog' | 'compare' | 'fertilizer' | 'equipment' | 'ai' | 'admin'>('catalog');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(800000);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'hp_desc' | 'default'>('default');

  // Products Data
  const [products, setProducts] = useState<AgriculturalProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Comparison List (Max 4 items)
  const [compareList, setCompareList] = useState<AgriculturalProduct[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Modals & Panels
  const [activeModalProduct, setActiveModalProduct] = useState<AgriculturalProduct | null>(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiFocusProduct, setAiFocusProduct] = useState<AgriculturalProduct | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isFarmProfileOpen, setIsFarmProfileOpen] = useState(false);

  // Saved Farm Profile
  const [farmProfile, setFarmProfile] = useState<FarmProfile>(() => {
    try {
      const saved = localStorage.getItem('kisansetu_farm_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      farmerName: 'Kisan Mitra',
      locationState: 'Punjab',
      totalLandAcres: 5,
      soilType: 'Alluvial',
      primaryCrop: 'Wheat',
      growthStage: 'Basal / Sowing',
      hasSoilTestReport: false,
      powerSource: 'Solar Ready',
    };
  });

  const handleSaveProfile = (newProfile: FarmProfile) => {
    setFarmProfile(newProfile);
    try {
      localStorage.setItem('kisansetu_farm_profile', JSON.stringify(newProfile));
    } catch {}
  };

  // Fetch products from server
  const fetchProducts = async (customSearch?: string, customCategory?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const activeSearch = customSearch !== undefined ? customSearch : searchQuery;
      const activeCat = customCategory !== undefined ? customCategory : selectedCategory;

      if (activeSearch.trim()) params.set('search', activeSearch.trim());
      if (activeCat && activeCat !== 'all') params.set('category', activeCat);
      if (selectedBrand && selectedBrand !== 'all') params.set('brand', selectedBrand);
      if (maxPriceFilter > 0 && maxPriceFilter < 800000) params.set('maxPrice', maxPriceFilter.toString());
      if (sortBy !== 'default') params.set('sort', sortBy);

      const url = params.toString() ? `/api/products?${params.toString()}` : '/api/products';
      const res = await fetch(url);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to fetch products from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedBrand, maxPriceFilter, sortBy]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedBrand !== 'all') {
      result = result.filter((p) => p.brand.toLowerCase() === selectedBrand.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameHindi.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (maxPriceFilter > 0) {
      result = result.filter((p) => {
        const bestPrice = Math.min(...p.offers.map((o) => o.discountPriceInr || o.listedPriceInr));
        return bestPrice <= maxPriceFilter;
      });
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => {
        const pA = Math.min(...a.offers.map((o) => o.discountPriceInr || o.listedPriceInr));
        const pB = Math.min(...b.offers.map((o) => o.discountPriceInr || o.listedPriceInr));
        return pA - pB;
      });
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => {
        const pA = Math.min(...a.offers.map((o) => o.discountPriceInr || o.listedPriceInr));
        const pB = Math.min(...b.offers.map((o) => o.discountPriceInr || o.listedPriceInr));
        return pB - pA;
      });
    } else if (sortBy === 'hp_desc') {
      result.sort((a, b) => (b.specs.engineHp || 0) - (a.specs.engineHp || 0));
    }

    return result;
  }, [products, selectedCategory, selectedBrand, searchQuery, maxPriceFilter, sortBy]);

  // Unique brands
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => brands.add(p.brand));
    return Array.from(brands);
  }, [products]);

  // Toggle compare item
  const handleToggleCompare = (product: AgriculturalProduct) => {
    setCompareList((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        alert(language === 'hi' ? 'आप अधिकतम 4 उत्पादों की एक साथ तुलना कर सकते हैं।' : 'You can compare a maximum of 4 products side-by-side.');
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleAskAiAboutProduct = (product: AgriculturalProduct) => {
    setAiFocusProduct(product);
    setIsAiDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      {/* 1. Header Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        compareCount={compareList.length}
        language={language}
        setLanguage={setLanguage}
        onOpenFarmProfile={() => setIsFarmProfileOpen(true)}
        isAiDrawerOpen={isAiDrawerOpen}
        setIsAiDrawerOpen={setIsAiDrawerOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20">
        {/* Render Tab Content */}
        {currentTab === 'catalog' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <HeroSection
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              language={language}
              onOpenAiAssistant={() => setIsAiDrawerOpen(true)}
            />

            {/* Catalog Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              {/* Category Filter Tabs (Interactive Segmented Buttons) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                      }`}
                    >
                      {language === 'hi' ? cat.labelHi : cat.labelEn}
                    </button>
                  );
                })}
              </div>

              {/* Secondary Filter & Sort Toolbar */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
                {/* Brand Selector */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-600 uppercase tracking-wider">{t.filterByBrand}:</span>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-stone-50 font-medium text-stone-800"
                  >
                    <option value="all">{t.allBrands}</option>
                    {availableBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Ceiling */}
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-stone-600 uppercase tracking-wider">{t.filterByPrice}:</span>
                  <input
                    type="range"
                    min="500"
                    max="800000"
                    step="5000"
                    value={maxPriceFilter}
                    onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                    className="w-32 accent-emerald-700"
                  />
                  <span className="font-bold text-stone-900 tabular-nums">
                    {formatInr(maxPriceFilter)}
                  </span>
                </div>

                {/* Sorting */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-600 uppercase tracking-wider">{t.sortBy}:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-stone-50 font-medium text-stone-800"
                  >
                    <option value="default">Featured & Verified</option>
                    <option value="price_asc">{t.sortLowestPrice}</option>
                    <option value="hp_desc">{t.sortHighestHp}</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {(searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all' || maxPriceFilter < 800000) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedBrand('all');
                      setMaxPriceFilter(800000);
                      setSortBy('default');
                    }}
                    className="flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Product Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="bg-white rounded-xl border border-stone-200 p-4 h-72 animate-pulse space-y-4">
                      <div className="bg-stone-200 h-40 rounded-lg"></div>
                      <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                      <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      language={language}
                      isInCompare={compareList.some((p) => p.id === product.id)}
                      onToggleCompare={handleToggleCompare}
                      onSelectProduct={(p) => setActiveModalProduct(p)}
                      onAskAi={handleAskAiAboutProduct}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
                  <p className="text-base font-semibold text-stone-800">{t.noProductsFound}</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedBrand('all');
                      setMaxPriceFilter(800000);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    View All Agricultural Products
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Compare Matrix */}
        {currentTab === 'compare' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ComparisonModal
              products={compareList.length > 0 ? compareList : products.slice(0, 3)}
              onRemoveProduct={(id) => setCompareList((prev) => prev.filter((p) => p.id !== id))}
              onClearAll={() => setCompareList([])}
              onClose={() => setCurrentTab('catalog')}
              language={language}
              onOpenProductDetail={(p) => setActiveModalProduct(p)}
            />
          </div>
        )}

        {/* Tab 3: Fertilizer Advisor */}
        {currentTab === 'fertilizer' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <FertilizerAdvisor
              products={products}
              language={language}
              onOpenProductDetail={(p) => setActiveModalProduct(p)}
              onAskAi={handleAskAiAboutProduct}
            />
          </div>
        )}

        {/* Tab 4: Equipment Advisor */}
        {currentTab === 'equipment' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <EquipmentAdvisor
              products={products}
              language={language}
              onOpenProductDetail={(p) => setActiveModalProduct(p)}
              onAskAi={handleAskAiAboutProduct}
            />
          </div>
        )}

        {/* Tab 5: Admin Ingestion */}
        {currentTab === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdminIngestionModal
              isOpen={true}
              onClose={() => setCurrentTab('catalog')}
              language={language}
              onRefreshProducts={fetchProducts}
              productsCount={products.length}
            />
          </div>
        )}
      </main>

      {/* Floating Compare Toolbar (When 1+ items selected) */}
      {compareList.length > 0 && currentTab !== 'compare' && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">
              {compareList.length} of 4 items selected for comparison
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTab('compare')}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              {t.compareNow} →
            </button>
            <button
              onClick={() => setCompareList([])}
              className="text-stone-400 hover:text-white px-2 py-1 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Floating AI Farming Assistant Trigger (Bottom Right) */}
      <button
        onClick={() => setIsAiDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-emerald-800 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-xl flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer border border-emerald-600/50"
        title="Open Qwen3.5-4B AI Farming Assistant"
      >
        <Bot className="w-5 h-5" />
        <span className="hidden sm:inline text-xs font-bold tracking-wide">
          {language === 'hi' ? 'एआई कृषि मित्र' : 'Qwen3.5 Assistant'}
        </span>
      </button>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={activeModalProduct}
        onClose={() => setActiveModalProduct(null)}
        language={language}
        isInCompare={activeModalProduct ? compareList.some((p) => p.id === activeModalProduct.id) : false}
        onToggleCompare={handleToggleCompare}
        onAskAi={handleAskAiAboutProduct}
      />

      {/* Local Qwen3.5 AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => {
          setIsAiDrawerOpen(false);
          setAiFocusProduct(null);
        }}
        language={language}
        currentProduct={aiFocusProduct}
        onSelectProduct={(p) => setActiveModalProduct(p)}
      />

      {/* Farm Profile Modal */}
      <FarmProfileModal
        isOpen={isFarmProfileOpen}
        onClose={() => setIsFarmProfileOpen(false)}
        language={language}
        onSaveProfile={handleSaveProfile}
        currentProfile={farmProfile}
      />

      {/* Clean Footer (No fake stats, strict anti-slop) */}
      <footer className="border-t border-stone-200 bg-white text-xs text-stone-500 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900">{t.brandName}</span>
            <span>·</span>
            <span>Agricultural Machinery & Fertilizer Specification Comparison</span>
          </div>

          <div className="text-stone-400 text-center md:text-right">
            Grounded in Indian Council of Agricultural Research (ICAR) advisory tables · Multi-vendor provenance tracking
          </div>
        </div>
      </footer>
    </div>
  );
}
