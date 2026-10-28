# KisanSetu - AI Agricultural Product Comparison & Recommendation Platform

## Architecture & Integration Guide

KisanSetu is a full-stack agritech platform designed for Indian farmers to make data-backed purchasing decisions across agricultural equipment (tractors, tillers, pumps, sprayers) and fertilizers (NPK complex, bio-fertilizers, micronutrients).

---

### 1. Technology Stack & Framework
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend Runtime**: Node.js & Express (`server.ts`) with Vite middleware for dev mode and static serving for production (`npm run build`).
- **Database Architecture**: Replaceable Data Access Layer (`src/server/db/repository.ts`) with normalized separation between **Canonical Products** and **Vendor Offers** and historical price tracking.
- **AI Model Integration**: Server-side native adapter for **Qwen3.5-4B** running locally on Ollama (`/api/chat`), with an automated RAG pipeline grounded in ICAR university nutrient tables and vendor offerings.

---

### 2. Backend API Routes Implemented

| Method | Endpoint | Description | Request Validation |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | System health, database driver state, and Ollama configuration | None |
| **GET** | `/api/products` | Search catalog with filters (`search`, `category`, `brand`, `maxPrice`, `minHp`, `sort`) | Query parameter type validation |
| **GET** | `/api/products/:id` | Returns single canonical product hydrated with multi-vendor offers and price history | Validates ID; returns 404 if not found |
| **POST** | `/api/compare` | Compares 1 to 4 products and computes unit efficiencies (₹/HP, ₹/kg nutrient) | Validates `productIds` array (length 1–4) |
| **POST** | `/api/assistant/chat` | AI chat endpoint calling local Ollama or grounded agronomy engine | Validates non-empty `message` |
| **POST** | `/api/ai/test-connection` | Pings Ollama `/api/tags` to check server and model availability | Validates URL & model parameters |
| **POST** | `/api/recommend/fertilizer`| Deterministic ICAR nutrient calculations & product package sizing | Validates cropId, stage, and acreage |
| **POST** | `/api/recommend/equipment` | Sizing match and annual diesel vs solar operating cost analysis | Validates farm acres & soil draft |
| **GET** | `/api/admin/logs` | Audit logs for data provenance and batch synchronizations | None |
| **POST** | `/api/admin/import` | Ingests vendor CSV/JSON feeds, detects duplicates, updates prices | Validates `products` array |
| **POST** | `/api/admin/product`| Creates or updates canonical products and vendor offers | Validates name, brand, category |

---

### 3. Product Data & Database Normalization

The data access layer in `src/server/db/` strictly separates **Canonical Products** from **Vendor Offers**:

1. **`CanonicalProduct`**:
   - Represents the physical machinery or fertilizer formulation (e.g. `Mahindra 575 DI XP Plus`, `IFFCO NPK 10:26:26`).
   - Stores specifications (Engine HP, PTO HP, fuel consumption, NPK ratio, package size, etc.).
   - Clearly labeled with `isDemoData: true` for pre-seeded demonstration data.

2. **`VendorOfferRecord`**:
   - Independent records linked by `productId`.
   - Stores vendor name (e.g., *TractorJunction*, *AgroStar*, *BigHaat*, *Local Mandi Cooperative*), listed price, discount price, stock status, delivery time, shipping cost, and source provenance.
   - Price updates automatically generate timestamped points in the `PriceHistoryRecord` collection.

3. **Firestore Transition**:
   - To connect Firebase Firestore, provision Firestore through Google AI Studio.
   - Set `DATABASE_TYPE="firestore"` in `.env`.
   - The repository interface (`IProductRepository`) can be pointed to the Firestore client SDK without modifying frontend components.

---

### 4. Local Ollama Qwen3.5-4B Setup & Cloud Compatibility

The AI assistant integrates your locally running **Qwen3.5-4B** model via Ollama.

#### A. Running Locally on Your Windows Machine
1. Open PowerShell or Command Prompt:
   ```bash
   # Run Qwen3.5-4B
   ollama run qwen3.5:4b

   # Ensure cross-origin requests are accepted
   set OLLAMA_ORIGINS=*
   ollama serve
   ```
2. Your local endpoint is `http://localhost:11434`.
3. In local development (`npm run dev`), the backend runs on your machine and communicates directly with Ollama.

#### B. Cloud Deployment & Container Compatibility
When running inside Google AI Studio or Cloud Run:
- The cloud container cannot access `localhost:11434` on your Windows PC because `localhost` refers to the container itself.
- **Secure Tunnel Architecture**:
  1. Use a secure tunnel tool such as **ngrok**:
     ```bash
     ngrok http 11434
     ```
  2. Copy the resulting HTTPS tunnel URL (e.g., `https://xxxx.ngrok-free.app`).
  3. Set `OLLAMA_BASE_URL="https://xxxx.ngrok-free.app"` in your `.env` or enter it directly in the in-app **Assistant Settings** modal (⚙).
- **Offline / Disconnected Resilience**:
  - If Ollama is offline or un-tunneled, KisanSetu **never crashes or freezes**.
  - It automatically uses its verified **ICAR Agronomic Knowledge Engine** to answer farmer questions accurately and display real product comparisons from the catalog.

---

### 5. Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama HTTP endpoint |
| `OLLAMA_MODEL` | `qwen3.5:4b` | Model identifier (e.g. `qwen3.5:4b`, `qwen2.5:3b`) |
| `OLLAMA_TIMEOUT_MS`| `8000` | AbortController timeout in milliseconds |
| `DATABASE_TYPE` | `memory` | Database driver (`memory` or `firestore`) |
| `PORT` | `3000` | Web server listening port |
| `APP_URL` | `http://localhost:3000` | Self-referential URL for links and callbacks |
| `GEMINI_API_KEY` | `""` | Optional cloud fallback API key |

---

### 6. Features Requiring External Credentials / Configuration

1. **Local Ollama Remote Access**:
   - Requires running an HTTPS tunnel (e.g., `ngrok http 11434`) when accessing from a cloud development sandbox.
2. **Live Marketplace Partner APIs**:
   - Currently uses verified sample catalogs and CSV batch feeds. Live scraping or automated order placement requires merchant API keys and partner affiliate agreements with BigHaat, AgroStar, and TractorJunction.
3. **Persistent Cloud Database (Firebase Firestore)**:
   - Uses the in-memory repository by default. Persistent multi-user cloud storage requires provisioning Firebase Firestore via AI Studio.
4. **SMS / WhatsApp Price Drop Alerts**:
   - Requires a Twilio or MSG91 gateway account for cellular SMS alerts.
