import React from 'react';
import { Language, UI_STRINGS } from '../data/translations';
import { Sprout, Scale, Wrench, Bot, Database, UserCheck, Languages } from 'lucide-react';

interface NavbarProps {
  currentTab: 'catalog' | 'compare' | 'fertilizer' | 'equipment' | 'ai' | 'admin';
  setCurrentTab: (tab: 'catalog' | 'compare' | 'fertilizer' | 'equipment' | 'ai' | 'admin') => void;
  compareCount: number;
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenFarmProfile: () => void;
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  compareCount,
  language,
  setLanguage,
  onOpenFarmProfile,
  isAiDrawerOpen,
  setIsAiDrawerOpen,
}) => {
  const t = UI_STRINGS[language];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Wordmark */}
          <button
            onClick={() => setCurrentTab('catalog')}
            className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-emerald-950 hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="font-outfit font-extrabold text-xl tracking-tight text-stone-900">
              {language === 'hi' ? 'किसानसेतु' : 'KisanSetu'}
            </span>
          </button>

          {/* Zone 2: 4-5 Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <button
              onClick={() => setCurrentTab('catalog')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
                currentTab === 'catalog' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              {t.browseCatalog}
            </button>

            <button
              onClick={() => setCurrentTab('compare')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 flex items-center gap-1.5 ${
                currentTab === 'compare' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>{t.compare}</span>
              {compareCount > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-xs font-bold rounded tabular-nums">
                  {compareCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('fertilizer')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 flex items-center gap-1.5 ${
                currentTab === 'fertilizer' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              <Sprout className="w-4 h-4 text-emerald-600" />
              <span>{t.fertilizerAdvisor}</span>
            </button>

            <button
              onClick={() => setCurrentTab('equipment')}
              className={`hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 flex items-center gap-1.5 ${
                currentTab === 'equipment' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>{t.equipmentAdvisor}</span>
            </button>

            <button
              onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
              className="hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 flex items-center gap-1.5 text-emerald-700"
            >
              <Bot className="w-4 h-4" />
              <span>Qwen3.5 Assistant</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action Area */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              title="Toggle English / हिन्दी"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Farm Profile */}
            <button
              onClick={onOpenFarmProfile}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 border border-stone-200 hover:border-stone-300 bg-white rounded-lg transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.farmProfile}</span>
            </button>

            {/* Admin Hub */}
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-stone-900 text-white'
                  : 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.adminHub}</span>
              <span className="sm:hidden">Data</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
