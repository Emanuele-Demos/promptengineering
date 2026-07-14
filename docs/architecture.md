# Architecture

WineCellar AI is organized by bounded contexts:

- Identity: auth, social login, profile, email verification.
- Cellar: wines, bottles, physical position, quantity and movement history.
- Tasting: mandatory review flow, tasting diary, ratings and photos.
- Recognition: OCR and barcode adapters.
- Discovery: events, maps, producers and wine places.
- Community: followers, likes, comments and public tastings.
- Admin: moderation and global master data management.

The backend follows a layered style:

1. Controllers receive HTTP input and return API responses.
2. DTOs normalize validated payloads.
3. Services own business rules, especially inventory transactions.
4. Repositories isolate persistence.
5. Providers/adapters integrate S3/R2, Redis, FCM, ML Kit, Cloud Vision and Google Maps.

Critical invariant:

Consuming a bottle must be a transaction that first validates and persists a complete tasting, then decrements stock, then writes an inventory movement. If stock reaches zero, the wine status becomes `consumed`.
