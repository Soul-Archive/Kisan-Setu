import React, { useState, useEffect } from 'react';
import { FarmProfile } from '../types/agricultural';
import { Language, UI_STRINGS } from '../data/translations';
import { X, Save, UserCheck, Sprout, MapPin, Check } from 'lucide-react';

interface FarmProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSaveProfile: (profile: FarmProfile) => void;
  currentProfile: FarmProfile;
}

export const FarmProfileModal: React.FC<FarmProfileModalProps> = ({
  isOpen,
  onClose,
  language,
  onSaveProfile,
  currentProfile,
}) => {
  const [profile, setProfile] = useState<FarmProfile>(currentProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const t = UI_STRINGS[language];

  useEffect(() => {
    setProfile(currentProfile);
  }, [currentProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profile);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-bold text-stone-900">{t.farmProfile}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <p className="text-stone-600 leading-relaxed">
            Your farm profile personalizes equipment sizing recommendations and fertilizer dosage calculations without uploading private telemetry.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Farmer / Holding Name</label>
              <input
                type="text"
                value={profile.farmerName}
                onChange={(e) => setProfile({ ...profile, farmerName: e.target.value })}
                placeholder="e.g. Gurpreet Singh"
                className="w-full p-2 border border-stone-300 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">State / District</label>
              <select
                value={profile.locationState}
                onChange={(e) => setProfile({ ...profile, locationState: e.target.value })}
                className="w-full p-2 border border-stone-300 rounded-lg bg-stone-50"
              >
                <option value="Punjab">Punjab</option>
                <option value="Haryana">Haryana</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Andhra Pradesh / Telangana">Andhra Pradesh / Telangana</option>
                <option value="Bihar / Bengal">Bihar / West Bengal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Total Land (Acres)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={profile.totalLandAcres}
                onChange={(e) => setProfile({ ...profile, totalLandAcres: Number(e.target.value) })}
                className="w-full p-2 border border-stone-300 rounded-lg tabular-nums"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Soil Type</label>
              <select
                value={profile.soilType}
                onChange={(e) => setProfile({ ...profile, soilType: e.target.value as any })}
                className="w-full p-2 border border-stone-300 rounded-lg bg-stone-50"
              >
                <option value="Alluvial">Alluvial (जलोढ़)</option>
                <option value="Black Cotton">Black Cotton (काली कपासी)</option>
                <option value="Red / Sandy Loam">Red / Sandy Loam (लाल रेतीली)</option>
                <option value="Clay">Heavy Clay (चिपचिपी मटियार)</option>
                <option value="Saline">Saline / Alkaline (ऊसर / लवणीय)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Primary Crop</label>
              <select
                value={profile.primaryCrop}
                onChange={(e) => setProfile({ ...profile, primaryCrop: e.target.value })}
                className="w-full p-2 border border-stone-300 rounded-lg bg-stone-50"
              >
                <option value="Wheat">Wheat (गेहूं)</option>
                <option value="Paddy / Rice">Paddy / Rice (धान)</option>
                <option value="Cotton">Cotton (कपास)</option>
                <option value="Sugarcane">Sugarcane (गन्ना)</option>
                <option value="Potato">Potato (आलू)</option>
                <option value="Mustard">Mustard (सरसों)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Power Grid Infrastructure</label>
              <select
                value={profile.powerSource}
                onChange={(e) => setProfile({ ...profile, powerSource: e.target.value as any })}
                className="w-full p-2 border border-stone-300 rounded-lg bg-stone-50"
              >
                <option value="3-Phase Grid">3-Phase Rural Grid</option>
                <option value="Single Phase">Single Phase Domestic</option>
                <option value="Diesel Generator">Diesel Engine Only</option>
                <option value="Solar Ready">Solar Ready (PM-KUSUM)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <span className="text-[11px] text-stone-400">Stored locally in your browser.</span>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'Saved!' : 'Save Farm Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
