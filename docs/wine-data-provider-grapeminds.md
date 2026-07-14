# Wine Data Provider: Grapeminds

Grapeminds is configured as the first specialized wine catalog provider for WineCellar AI.

The public marketing page states that the API starts with a free tier of 250 requests/month and paid plans from 29.73 EUR/month. Treat it as a metered external dependency, not as an unlimited free database.

## Environment

Set these variables on the backend service:

```bash
GRAPEMINDS_API_KEY=your_api_key_here
GRAPEMINDS_API_BASE_URL=https://api.grapeminds.it
```

The base URL may need to be adjusted after reading the private API documentation shown in the Grapeminds developer dashboard.

## Backend Endpoints

Search wine records:

```http
GET /api/v1/catalog/search?query=barolo&limit=10
```

Find a wine/product by barcode:

```http
GET /api/v1/catalog/barcode?barcode=8000000000000
```

## Integration Rule

The API key must stay server-side. Mobile and browser clients should call the WineCellar backend, never Grapeminds directly.

## Fallback Strategy

1. Search local WineCellar database.
2. Search Grapeminds.
3. If no result, let the user create the wine manually from OCR/barcode fields.
4. Save normalized records locally to reduce future provider calls.
