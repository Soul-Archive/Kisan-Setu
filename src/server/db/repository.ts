import { CanonicalProduct, VendorOfferRecord, PriceHistoryRecord, IngestionLogRecord, HydratedProduct } from './types';
import { SEED_PRODUCTS } from '../../data/seedProducts';
import { AgriculturalProduct } from '../../types/agricultural';

export interface ProductQueryFilters {
  search?: string;
  category?: string;
  brand?: string;
  maxPrice?: number;
  minHp?: number;
  sort?: 'price_asc' | 'price_desc' | 'hp_desc' | 'default';
}

/**
 * Replaceable Data Access Layer Interface
 * Allows seamless switching between in-memory/file storage and cloud Firestore.
 */
export interface IProductRepository {
  getProducts(filters?: ProductQueryFilters): Promise<HydratedProduct[]>;
  getProductById(id: string): Promise<HydratedProduct | null>;
  saveProduct(product: Partial<CanonicalProduct>): Promise<CanonicalProduct>;
  saveVendorOffer(offer: Partial<VendorOfferRecord>): Promise<VendorOfferRecord>;
  recordPriceChange(productId: string, priceInr: number, vendorName: string): Promise<void>;
  getIngestionLogs(): Promise<IngestionLogRecord[]>;
  addIngestionLog(log: Omit<IngestionLogRecord, 'id' | 'timestamp'>): Promise<IngestionLogRecord>;
  isPersistentDatabaseConfigured(): boolean;
}

/**
 * In-Memory & File-Compatible Implementation
 * Fully separates canonical products from vendor offers in distinct relational-style maps.
 */
class InMemoryProductRepository implements IProductRepository {
  private canonicalProducts: Map<string, CanonicalProduct> = new Map();
  private vendorOffers: Map<string, VendorOfferRecord> = new Map();
  private priceHistories: PriceHistoryRecord[] = [];
  private ingestionLogs: IngestionLogRecord[] = [];

  constructor() {
    this.seedDemonstrationData();
  }

  /**
   * Initializes the repository with structured demonstration data,
   * cleanly splitting canonical records from multi-vendor offers.
   */
  private seedDemonstrationData() {
    SEED_PRODUCTS.forEach((seed: AgriculturalProduct) => {
      // 1. Store canonical product record
      const canonical: CanonicalProduct = {
        id: seed.id,
        name: seed.name,
        nameHindi: seed.nameHindi,
        brand: seed.brand,
        modelNumber: seed.modelNumber,
        category: seed.category,
        imageUrl: seed.imageUrl,
        fallbackGradient: seed.fallbackGradient,
        description: seed.description,
        descriptionHindi: seed.descriptionHindi,
        basePriceInr: seed.basePriceInr,
        specs: seed.specs,
        keyFeatures: seed.keyFeatures,
        pros: seed.pros,
        cons: seed.cons,
        annualMaintenanceEstInr: seed.annualMaintenanceEstInr,
        tags: seed.tags,
        isDemoData: true, // Clearly marked as demonstrative data
        createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
        updatedAt: seed.dataProvenance.lastUpdated,
        dataProvenance: seed.dataProvenance,
      };
      this.canonicalProducts.set(canonical.id, canonical);

      // 2. Store vendor offers in separate collection
      seed.offers.forEach((offer) => {
        const offerRecord: VendorOfferRecord = {
          id: offer.id,
          productId: seed.id,
          vendorName: offer.vendorName,
          vendorType: offer.vendorType,
          originalUrl: offer.originalUrl,
          listedPriceInr: offer.listedPriceInr,
          discountPriceInr: offer.discountPriceInr,
          inStock: offer.inStock,
          deliveryDays: offer.deliveryDays,
          shippingCostInr: offer.shippingCostInr,
          warrantyYears: offer.warrantyYears,
          sourceType: offer.sourceType,
          lastCheckedIso: offer.lastCheckedIso,
          verifiedSeller: offer.verifiedSeller,
          locationCity: offer.locationCity,
          isDemoData: true,
        };
        this.vendorOffers.set(offerRecord.id, offerRecord);
      });

      // 3. Store price history points
      seed.priceHistory.forEach((ph, idx) => {
        this.priceHistories.push({
          id: `ph_${seed.id}_${idx}`,
          productId: seed.id,
          vendorName: ph.vendorName,
          priceInr: ph.priceInr,
          recordedAt: ph.date,
        });
      });
    });

    // Initial audit log
    this.ingestionLogs.push({
      id: 'log_boot_001',
      timestamp: new Date().toISOString(),
      sourceType: 'bulk_csv_sync',
      sourceName: 'ICAR & Verified OEM Benchmark Seeds',
      recordsCount: this.canonicalProducts.size,
      newProductsCount: this.canonicalProducts.size,
      priceUpdatesCount: this.vendorOffers.size,
      duplicateSkippedCount: 0,
      status: 'success',
      details: 'Demonstration catalog seeded with normalized canonical products and vendor offers.',
    });
  }

  isPersistentDatabaseConfigured(): boolean {
    return process.env.DATABASE_TYPE === 'firestore';
  }

  private hydrate(canonical: CanonicalProduct): HydratedProduct {
    const productOffers = Array.from(this.vendorOffers.values()).filter((o) => o.productId === canonical.id);
    const history = this.priceHistories
      .filter((h) => h.productId === canonical.id)
      .map((h) => ({
        date: h.recordedAt,
        priceInr: h.priceInr,
        vendorName: h.vendorName,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      ...canonical,
      offers: productOffers,
      priceHistory: history,
    };
  }

  async getProducts(filters?: ProductQueryFilters): Promise<HydratedProduct[]> {
    let list = Array.from(this.canonicalProducts.values()).map((c) => this.hydrate(c));

    if (!filters) return list;

    if (filters.category && filters.category !== 'all') {
      list = list.filter((p) => p.category === filters.category);
    }

    if (filters.brand && filters.brand !== 'all') {
      list = list.filter((p) => p.brand.toLowerCase() === filters.brand?.toLowerCase());
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameHindi.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.modelNumber.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (filters.maxPrice && !isNaN(filters.maxPrice)) {
      list = list.filter((p) => {
        const lowestPrice = Math.min(
          ...p.offers.map((o) => o.discountPriceInr || o.listedPriceInr),
          p.basePriceInr
        );
        return lowestPrice <= (filters.maxPrice as number);
      });
    }

    if (filters.minHp && !isNaN(filters.minHp)) {
      list = list.filter((p) => (p.specs.engineHp || 0) >= (filters.minHp as number));
    }

    // Sort order
    if (filters.sort === 'price_asc') {
      list.sort((a, b) => {
        const pA = Math.min(...a.offers.map((o) => o.discountPriceInr || o.listedPriceInr), a.basePriceInr);
        const pB = Math.min(...b.offers.map((o) => o.discountPriceInr || o.listedPriceInr), b.basePriceInr);
        return pA - pB;
      });
    } else if (filters.sort === 'price_desc') {
      list.sort((a, b) => {
        const pA = Math.min(...a.offers.map((o) => o.discountPriceInr || o.listedPriceInr), a.basePriceInr);
        const pB = Math.min(...b.offers.map((o) => o.discountPriceInr || o.listedPriceInr), b.basePriceInr);
        return pB - pA;
      });
    } else if (filters.sort === 'hp_desc') {
      list.sort((a, b) => (b.specs.engineHp || 0) - (a.specs.engineHp || 0));
    }

    return list;
  }

  async getProductById(id: string): Promise<HydratedProduct | null> {
    const canonical = this.canonicalProducts.get(id);
    if (!canonical) return null;
    return this.hydrate(canonical);
  }

  async saveProduct(product: Partial<CanonicalProduct>): Promise<CanonicalProduct> {
    const id = product.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const existing = this.canonicalProducts.get(id);

    const now = new Date().toISOString();
    const fullProduct: CanonicalProduct = {
      id,
      name: product.name || 'Unnamed Product',
      nameHindi: product.nameHindi || product.name || 'अज्ञात उत्पाद',
      brand: product.brand || 'Generic',
      modelNumber: product.modelNumber || 'MOD-' + Date.now().toString().slice(-4),
      category: product.category || 'fertilizer_npk',
      imageUrl: product.imageUrl || '/src/assets/images/tractor_machinery_1793167690152.jpg',
      fallbackGradient: product.fallbackGradient || 'from-stone-900 to-emerald-950',
      description: product.description || '',
      descriptionHindi: product.descriptionHindi || '',
      basePriceInr: Number(product.basePriceInr) || 1000,
      specs: product.specs || {},
      keyFeatures: product.keyFeatures || [],
      pros: product.pros || [],
      cons: product.cons || [],
      annualMaintenanceEstInr: product.annualMaintenanceEstInr,
      tags: product.tags || [],
      isDemoData: false, // User or admin added products are live/custom
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      dataProvenance: {
        primarySource: product.dataProvenance?.primarySource || 'Admin Manual Entry',
        lastUpdated: now,
        verificationStatus: product.dataProvenance?.verificationStatus || 'verified',
      },
    };

    this.canonicalProducts.set(id, fullProduct);
    return fullProduct;
  }

  async saveVendorOffer(offer: Partial<VendorOfferRecord>): Promise<VendorOfferRecord> {
    if (!offer.productId) {
      throw new Error('Vendor offer must specify a productId');
    }
    const id = offer.id || `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const fullOffer: VendorOfferRecord = {
      id,
      productId: offer.productId,
      vendorName: offer.vendorName || 'Independent Vendor',
      vendorType: offer.vendorType || 'Authorized Distributor',
      originalUrl: offer.originalUrl || 'https://kisansetu.in',
      listedPriceInr: Number(offer.listedPriceInr) || 1000,
      discountPriceInr: offer.discountPriceInr ? Number(offer.discountPriceInr) : undefined,
      inStock: offer.inStock ?? true,
      deliveryDays: offer.deliveryDays ?? 4,
      shippingCostInr: Number(offer.shippingCostInr) || 0,
      warrantyYears: offer.warrantyYears,
      sourceType: offer.sourceType || 'manual_entry',
      lastCheckedIso: now,
      verifiedSeller: offer.verifiedSeller ?? true,
      locationCity: offer.locationCity,
      isDemoData: offer.isDemoData ?? false,
    };

    this.vendorOffers.set(id, fullOffer);

    // Record price point
    const price = fullOffer.discountPriceInr || fullOffer.listedPriceInr;
    await this.recordPriceChange(fullOffer.productId, price, fullOffer.vendorName);

    return fullOffer;
  }

  async recordPriceChange(productId: string, priceInr: number, vendorName: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    this.priceHistories.push({
      id: `ph_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      productId,
      vendorName,
      priceInr,
      recordedAt: today,
    });
  }

  async getIngestionLogs(): Promise<IngestionLogRecord[]> {
    return [...this.ingestionLogs].reverse();
  }

  async addIngestionLog(log: Omit<IngestionLogRecord, 'id' | 'timestamp'>): Promise<IngestionLogRecord> {
    const fullLog: IngestionLogRecord = {
      ...log,
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.ingestionLogs.push(fullLog);
    return fullLog;
  }
}

// Global singleton instance of the repository
export const productRepository: IProductRepository = new InMemoryProductRepository();
