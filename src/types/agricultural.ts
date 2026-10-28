export type ProductCategory =
  | 'tractor'
  | 'power_tiller'
  | 'solar_pump'
  | 'irrigation'
  | 'sprayer'
  | 'fertilizer_npk'
  | 'fertilizer_bio'
  | 'fertilizer_micronutrient'
  | 'seeder_harvester';

export type DataSourceType = 'official_api' | 'partner_feed' | 'vendor_csv' | 'verified_catalog' | 'manual_entry';

export interface VendorOffer {
  id: string;
  vendorName: string;
  vendorType: 'E-commerce Marketplace' | 'Authorized Distributor' | 'Local Cooperative' | 'Direct Manufacturer';
  originalUrl: string;
  listedPriceInr: number;
  discountPriceInr?: number;
  inStock: boolean;
  deliveryDays: number;
  shippingCostInr: number;
  warrantyYears?: number;
  sourceType: DataSourceType;
  lastCheckedIso: string;
  verifiedSeller: boolean;
  locationCity?: string;
}

export interface PriceHistoryPoint {
  date: string;
  priceInr: number;
  vendorName: string;
}

export interface TechnicalSpecs {
  // Equipment specs
  engineHp?: number;
  ptoHp?: number;
  displacementCc?: number;
  cylinders?: number;
  fuelType?: 'Diesel' | 'Petrol' | 'Solar' | 'Electric' | 'Manual' | 'Battery';
  fuelConsumptionLph?: number; // Litres per hour or kWh
  liftingCapacityKg?: number;
  gearbox?: string;
  headMeters?: number; // For pumps
  dischargeLpm?: number; // Litres per minute
  solarPanelWattage?: number;
  tankCapacityLitres?: number; // Sprayers
  workingWidthInches?: number; // Tillers/Weeders
  recommendedAcresMin?: number;
  recommendedAcresMax?: number;

  // Fertilizer & Nutrient specs
  npkRatio?: string; // e.g., "19:19:19", "46:0:0", "10:26:26"
  nitrogenPercent?: number;
  phosphorusPercent?: number;
  potassiumPercent?: number;
  zincPercent?: number;
  boronPercent?: number;
  organicCarbonPercent?: number;
  formulation?: 'Granular' | 'Liquid' | 'Water Soluble Powder' | 'Pellets';
  packageWeightKg?: number;
  packageVolumeL?: number;
  applicationMethod?: 'Soil Broadcast' | 'Foliar Spray' | 'Drip Fertigation' | 'Basal Application' | 'Seed Treatment';
  regulatoryLicenseNo?: string;
  approvedCrops?: string[];
  certifications?: string[];
}

export interface AgriculturalProduct {
  id: string;
  name: string;
  nameHindi: string;
  brand: string;
  modelNumber: string;
  category: ProductCategory;
  imageUrl: string;
  fallbackGradient: string;
  description: string;
  descriptionHindi: string;
  basePriceInr: number;
  offers: VendorOffer[];
  priceHistory: PriceHistoryPoint[];
  specs: TechnicalSpecs;
  keyFeatures: string[];
  pros: string[];
  cons: string[];
  annualMaintenanceEstInr?: number;
  tags: string[];
  dataProvenance: {
    primarySource: string;
    lastUpdated: string;
    verificationStatus: 'verified' | 'pending_audit' | 'community_reported';
  };
}

export interface CropNutrientAdvisory {
  cropId: string;
  cropName: string;
  cropNameHindi: string;
  durationDays: number;
  standardNutrientDemandKgPerAcre: {
    N: number;
    P2O5: number;
    K2O: number;
  };
  stages: {
    stageName: 'Basal / Sowing' | 'Vegetative Growth' | 'Flowering & Tillering' | 'Maturity & Grain Filling';
    stageNameHindi: string;
    nPercent: number;
    pPercent: number;
    kPercent: number;
    advisoryNote: string;
    advisoryNoteHindi: string;
  }[];
  soilPhPreference: {
    min: number;
    optimal: number;
    max: number;
  };
}

export interface FarmProfile {
  farmerName: string;
  locationState: string;
  totalLandAcres: number;
  soilType: 'Alluvial' | 'Black Cotton' | 'Red / Sandy Loam' | 'Clay' | 'Saline';
  primaryCrop: string;
  growthStage: string;
  hasSoilTestReport: boolean;
  soilNitrogenLevel?: 'low' | 'medium' | 'high';
  soilPhosphorusLevel?: 'low' | 'medium' | 'high';
  soilPotassiumLevel?: 'low' | 'medium' | 'high';
  soilPh?: number;
  powerSource: '3-Phase Grid' | 'Single Phase' | 'Diesel Generator' | 'Solar Ready' | 'No Electricity';
  budgetCapInr?: number;
}

export interface RecommendationExplanation {
  productId: string;
  productName: string;
  score: number;
  matchTier: 'Best Match' | 'Great Value' | 'Alternative Choice';
  suitabilityReasons: string[];
  tradeOffs: string[];
  estimatedCostPerAcreInr?: number;
  annualOperatingCostInr?: number;
  missingDataWarnings?: string[];
  isVerifiedAgriUniversityAdvice: boolean;
}
