# WineCellar AI

Monorepo per una app di gestione cantina vini personale con mobile Flutter, backend API Laravel-style, pannello amministrativo, schema PostgreSQL, documentazione OpenAPI e test.

## Moduli

- `backend/` API REST PHP/Laravel-style con architettura Repository + Service + DTO.
- `mobile/` app Flutter Material 3 con tema chiaro/scuro e flussi principali.
- `admin/` pannello amministrativo web statico, pronto da collegare alle API.
- `database/` schema SQL PostgreSQL completo con vincoli, indici e dati iniziali.
- `docs/` OpenAPI e note tecniche.
- `.github/workflows/` pipeline CI.

## Avvio rapido con Docker

```bash
docker compose up --build
```

Servizi previsti:

- API: `http://localhost:8080/api/v1`
- Admin: `http://localhost:8090`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Flussi core implementati nel design

- Registrazione/login JWT, verifica email e recupero password.
- Inventario vini con quantita, stato e posizione fisica.
- Movimenti di magazzino tracciati.
- Consumo bottiglia vincolato al salvataggio di una recensione completa.
- Diario degustazioni.
- Wishlist, statistiche, community, notifiche ed eventi geolocalizzati predisposti.
- OCR e barcode predisposti come servizi sostituibili con ML Kit / Cloud Vision.

## Nota ambiente locale

In questa macchina non risultano installati `php`, `composer` e `flutter`, quindi non e stato possibile eseguire build native. Il progetto include Dockerfile e manifest per rendere riproducibile l'ambiente di sviluppo.

## Provider dati vini

Il progetto include un adapter backend per Grapeminds Wine API. Configura GRAPEMINDS_API_KEY e consulta [docs/wine-data-provider-grapeminds.md](docs/wine-data-provider-grapeminds.md).


## Funzioni AI e Smart Cellar

La preview utente include Sommelier AI, traduttore degustazioni, blind tasting, passaporto vitigni, smart cellar, AR storytelling, compatibilita di gruppo e sostenibilita. Note tecniche in [docs/ai-smart-features.md](docs/ai-smart-features.md).

