import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { productRepository, ProductQueryFilters } from './src/server/db/repository';
import { OllamaService } from './src/server/ai/ollamaAdapter';
import { CROP_ADVISORIES, AGRICULTURAL_DISCLAIMER } from './src/data/agriculturalKnowledge';
import { calculateFertilizerRecommendation, calculateEquipmentRecommendation } from './src/services/recommendationEngine';
import { AgriculturalProduct } from './src/types/agricultural';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------
// 1. HEALTH & SYSTEM DIAGNOSTICS (GET /api/health)
// -------------------------------------------------------------
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const products = await productRepository.getProducts();
    const ollamaUrl = OllamaService.getBaseUrl();
    const ollamaModel = OllamaService.getModelName();
    const isCloud = OllamaService.isCloudEnvironment();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: isCloud ? 'cloud_sandbox' : 'local_development',
      database: {
        driver: productRepository.isPersistentDatabaseConfigured() ? 'firestore' : 'in_memory_repository',
        isPersistent: productRepository.isPersistentDatabaseConfigured(),
        totalProducts: products.length,
        isDemoCatalog: products.some((p) => p.isDemoData),
      },
      ollamaConfig: {
        configuredUrl: ollamaUrl,
        configuredModel: ollamaModel,
        isCloudSandbox: isCloud,
        isLocalhost: ollamaUrl.includes('localhost') || ollamaUrl.includes('127.0.0.1'),
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown health check failure';
    res.status(500).json({ status: 'unhealthy', error: errorMsg });
  }
});

// -------------------------------------------------------------
// 2. PRODUCT DISCOVERY & DETAILS (GET /api/products, GET /api/products/:id)
// -------------------------------------------------------------
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { search, category, maxPrice, brand, minHp, sort } = req.query;

    const filters: ProductQueryFilters = {};

    if (typeof search === 'string' && search.trim()) {
      filters.search = search.trim();
    }
    if (typeof category === 'string' && category !== 'all') {
      filters.category = category;
    }
    if (typeof brand === 'string' && brand !== 'all') {
      filters.brand = brand;
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      filters.maxPrice = Number(maxPrice);
    }
    if (minHp && !isNaN(Number(minHp))) {
      filters.minHp = Number(minHp);
    }
    if (sort === 'price_asc' || sort === 'price_desc' || sort === 'hp_desc') {
      filters.sort = sort;
    }

    const products = await productRepository.getProducts(filters);

    res.json({
      total: products.length,
      isDemoCatalog: products.some((p) => p.isDemoData),
      products,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query products';
    res.status(500).json({ error: 'Internal server error while searching products', details: errorMsg });
  }
});

app.get('/api/products/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Invalid product ID' });
    return;
  }

  try {
    const product = await productRepository.getProductById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found', requestedId: id });
      return;
    }
    res.json(product);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to load product';
    res.status(500).json({ error: 'Error retrieving product', details: errorMsg });
  }
});

// -------------------------------------------------------------
// 3. COMPARISON MATRIX (POST /api/compare)
// -------------------------------------------------------------
app.post('/api/compare', async (req: Request, res: Response) => {
  const { productIds } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    res.status(400).json({ error: 'Please provide an array of at least 1 product ID (max 4)' });
    return;
  }

  if (productIds.length > 4) {
    res.status(400).json({ error: 'Maximum 4 products can be compared at one time' });
    return;
  }

  try {
    const allProducts = await productRepository.getProducts();
    const selected = allProducts.filter((p) => productIds.includes(p.id));

    if (selected.length === 0) {
      res.status(404).json({ error: 'None of the requested product IDs were found in the catalog' });
      return;
    }

    // Compute normalized metrics
    const comparisonData = selected.map((p) => {
      const bestPrice = Math.min(...p.offers.map((o) => o.discountPriceInr || o.listedPriceInr), p.basePriceInr);
      const highestListed = Math.max(...p.offers.map((o) => o.listedPriceInr), p.basePriceInr);
      const maxDiscountPercent = highestListed > bestPrice ? Math.round(((highestListed - bestPrice) / highestListed) * 100) : 0;

      let metricEfficiency = '—';
      if (p.specs.engineHp && p.specs.engineHp > 0) {
        metricEfficiency = `₹${Math.round(bestPrice / p.specs.engineHp).toLocaleString('en-IN')} / HP`;
      } else if (p.specs.packageWeightKg && p.specs.packageWeightKg > 0) {
        metricEfficiency = `₹${Math.round(bestPrice / p.specs.packageWeightKg).toLocaleString('en-IN')} / kg`;
      } else if (p.specs.packageVolumeL && p.specs.packageVolumeL > 0) {
        metricEfficiency = `₹${Math.round(bestPrice / p.specs.packageVolumeL).toLocaleString('en-IN')} / Litre`;
      }

      return {
        product: p,
        bestPrice,
        maxDiscountPercent,
        vendorCount: p.offers.length,
        metricEfficiency,
        warrantyYears: p.offers[0]?.warrantyYears || 1,
      };
    });

    res.json({
      itemsCount: comparisonData.length,
      items: comparisonData,
      disclaimer: AGRICULTURAL_DISCLAIMER,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Comparison calculation failed';
    res.status(500).json({ error: 'Comparison error', details: errorMsg });
  }
});

// -------------------------------------------------------------
// 4. LOCAL OLLAMA AI ASSISTANT (POST /api/assistant/chat & /api/ai/chat)
// -------------------------------------------------------------
const handleAssistantChat = async (req: Request, res: Response) => {
  const { message, history, farmProfile, currentProductId, localAiUrl, modelName } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'A valid non-empty message string is required.' });
    return;
  }

  try {
    // 1. RAG Retrieval from repository
    const allProducts = await productRepository.getProducts();

    const terms = message.toLowerCase().split(/\s+/);
    let relevant = allProducts.filter((p) => {
      if (currentProductId && p.id === currentProductId) return true;
      return terms.some((t: string) => t.length > 2 && (p.name.toLowerCase().includes(t) || p.brand.toLowerCase().includes(t) || p.tags.includes(t)));
    });

    if (relevant.length === 0) {
      relevant = allProducts.slice(0, 3);
    } else {
      relevant = relevant.slice(0, 4);
    }

    // 2. Call Ollama Service
    const aiResponse = await OllamaService.chat({
      message: message.trim(),
      conversationHistory: Array.isArray(history) ? history : [],
      retrievedProducts: relevant,
      farmProfile,
      overrideUrl: localAiUrl,
      overrideModel: modelName,
    });

    res.json(aiResponse);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'AI assistant error';
    res.status(500).json({ error: 'Assistant processing error', details: errorMsg });
  }
};

app.post('/api/assistant/chat', handleAssistantChat);
app.post('/api/ai/chat', handleAssistantChat); // Backward-compatible alias

// Test connection endpoint to diagnose local Ollama reachability
app.post('/api/ai/test-connection', async (req: Request, res: Response) => {
  const { url, model } = req.body;
  const status = await OllamaService.testConnection(url, model);
  res.json(status);
});

// -------------------------------------------------------------
// 5. DETERMINISTIC RECOMMENDATION APIS (FERTILIZER & EQUIPMENT)
// -------------------------------------------------------------
app.post('/api/recommend/fertilizer', async (req: Request, res: Response) => {
  try {
    const products = await productRepository.getProducts();
    const converted = products as unknown as AgriculturalProduct[];
    const output = calculateFertilizerRecommendation(req.body, converted);
    res.json(output);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Fertilizer calculation failed';
    res.status(400).json({ error: 'Failed to calculate fertilizer recommendations', details: errorMsg });
  }
});

app.post('/api/recommend/equipment', async (req: Request, res: Response) => {
  try {
    const products = await productRepository.getProducts();
    const converted = products as unknown as AgriculturalProduct[];
    const output = calculateEquipmentRecommendation(req.body, converted);
    res.json(output);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Equipment calculation failed';
    res.status(400).json({ error: 'Failed to calculate equipment recommendations', details: errorMsg });
  }
});

// -------------------------------------------------------------
// 6. ADMIN & DATA INGESTION APIS
// -------------------------------------------------------------
app.get('/api/admin/logs', async (req: Request, res: Response) => {
  try {
    const logs = await productRepository.getIngestionLogs();
    res.json({ logs });
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to read logs' });
  }
});

app.post('/api/admin/import', async (req: Request, res: Response) => {
  const { sourceType, sourceName, products: importedProducts } = req.body;

  if (!Array.isArray(importedProducts) || importedProducts.length === 0) {
    res.status(400).json({ error: 'No product records provided in import payload' });
    return;
  }

  let newCount = 0;
  let priceUpdateCount = 0;
  let dupCount = 0;

  try {
    const existingProducts = await productRepository.getProducts();

    for (const item of importedProducts) {
      if (!item.name || !item.brand) continue;

      const normName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = existingProducts.find(
        (p) => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normName || (p.modelNumber && p.modelNumber === item.modelNumber)
      );

      if (match) {
        dupCount++;
        if (Array.isArray(item.offers)) {
          for (const newOffer of item.offers) {
            await productRepository.saveVendorOffer({
              ...newOffer,
              productId: match.id,
              sourceType: sourceType || 'vendor_csv',
            });
            priceUpdateCount++;
          }
        }
      } else {
        const created = await productRepository.saveProduct({
          ...item,
          dataProvenance: {
            primarySource: sourceName || 'Batch Ingestion Feed',
            lastUpdated: new Date().toISOString(),
            verificationStatus: 'verified',
          },
        });

        if (Array.isArray(item.offers)) {
          for (const newOffer of item.offers) {
            await productRepository.saveVendorOffer({
              ...newOffer,
              productId: created.id,
              sourceType: sourceType || 'vendor_csv',
            });
          }
        }
        newCount++;
      }
    }

    const log = await productRepository.addIngestionLog({
      sourceType: sourceType || 'vendor_csv',
      sourceName: sourceName || 'Custom Upload',
      recordsCount: importedProducts.length,
      newProductsCount: newCount,
      priceUpdatesCount: priceUpdateCount,
      duplicateSkippedCount: dupCount,
      status: 'success',
      details: `Processed ${importedProducts.length} entries. Added ${newCount} canonical products, updated ${priceUpdateCount} price offers, consolidated ${dupCount} duplicates.`,
    });

    const refreshed = await productRepository.getProducts();

    res.json({
      success: true,
      summary: log,
      totalActiveProducts: refreshed.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Ingestion failed';
    res.status(500).json({ error: 'Import failed', details: errorMsg });
  }
});

app.post('/api/admin/product', async (req: Request, res: Response) => {
  const newProduct = req.body;
  if (!newProduct.name || !newProduct.brand || !newProduct.category) {
    res.status(400).json({ error: 'Product name, brand, and category are mandatory' });
    return;
  }

  try {
    const saved = await productRepository.saveProduct(newProduct);
    if (Array.isArray(newProduct.offers)) {
      for (const off of newProduct.offers) {
        await productRepository.saveVendorOffer({
          ...off,
          productId: saved.id,
        });
      }
    }
    const full = await productRepository.getProductById(saved.id);
    res.json({ success: true, product: full });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to save product';
    res.status(500).json({ error: 'Failed to save product', details: errorMsg });
  }
});

// -------------------------------------------------------------
// 7. DEV SERVER VITE MIDDLEWARE / STATIC PRODUCTION SERVING
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KisanSetu] Server running on port ${PORT} (dev mode: ${!isProduction})`);
  });
}

startServer();
