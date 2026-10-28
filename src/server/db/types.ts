import { ProductCategory, TechnicalSpecs, DataSourceType } from '../../types/agricultural';

/**
 * Normalized Canonical Product record.
 * Represents the manufacturer's verified equipment or fertilizer model.
 * Independent of any single seller or marketplace listing.
 */
export interface CanonicalProduct {
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
  specs: TechnicalSpecs;
  keyFeatures: string[];
  pros: string[];
  cons: string[];
  annualMaintenanceEstInr?: number;
  tags: string[];
  isDemoData: boolean; // Explicit flag distinguishing demonstrative seeds from live vendor feeds
  createdAt: string;
  updatedAt: string;
  dataProvenance: {
    primarySource: string;
    lastUpdated: string;
    verificationStatus: 'verified' | 'pending_audit' | 'community_reported';
  };
}

/**
 * Normalized Vendor Offer record.
 * Stored in a separate table/collection linked to canonical productId.
 * A single canonical product can have many vendor offers from different dealers or marketplaces.
 */
export interface VendorOfferRecord {
  id: string;
  productId: string;
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
  isDemoData: boolean;
}

/**
 * Historical Price Tracking Point.
 * Records price fluctuations across vendors over time.
 */
export interface PriceHistoryRecord {
  id: string;
  productId: string;
  vendorOfferId?: string;
  vendorName: string;
  priceInr: number;
  recordedAt: string; // ISO date string
}

/**
 * Audit log for batch ingestion and data synchronization.
 */
export interface IngestionLogRecord {
  id: string;
  timestamp: string;
  sourceType: DataSourceType | 'bulk_csv_sync';
  sourceName: string;
  recordsCount: number;
  newProductsCount: number;
  priceUpdatesCount: number;
  duplicateSkippedCount: number;
  status: 'success' | 'warning' | 'error';
  details: string;
}

/**
 * Assembled Product with its active vendor offers and price history.
 * Returned to frontend clients.
 */
export interface HydratedProduct extends CanonicalProduct {
  offers: VendorOfferRecord[];
  priceHistory: {
    date: string;
    priceInr: number;
    vendorName: string;
  }[];
}
