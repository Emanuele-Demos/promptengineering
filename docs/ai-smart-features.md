# AI and Smart Features

This document maps the advanced WineCellar AI features to production services.

## Generative Sommelier

Client flow:

1. User enters ingredients from the fridge.
2. Backend loads the user's cellar, taste profile and available bottles.
3. LLM receives a constrained prompt and returns structured JSON.
4. App displays the selected bottle, confidence, reason and fallback wine type to buy.

Recommended response schema:

```json
{
  "recommended_wine_id": "uuid-or-null",
  "buy_suggestion": "Metodo classico brut",
  "confidence": 0.92,
  "reason": "Works with cream, chicken and mushrooms without overpowering the dish",
  "serving_temperature": "8-10 C"
}
```

## Technical Review Translator

Input: professional tasting note.
Output: plain-language explanation, preference hint and food context.

Keep this feature server-side if using a paid LLM. The frontend should call WineCellar API, never the LLM provider directly.

## Blind Tasting and Gamification

Persist these entities in production:

- blind_tasting_sessions
- blind_tasting_players
- blind_tasting_answers
- grape_passport_badges
- user_badges

Scoring can run locally first, then be moved to backend for anti-cheat and leaderboards.

## Smart Cellar

Scanner di gruppo and visual map require:

- image upload to storage
- object detection / OCR job
- bottle bounding boxes
- shelf position confirmation UI

Drink-now notifications use wine type, vintage, producer/region aging rules and user preference.

## AR Storytelling

Production implementation:

- Flutter: ARCore/ARKit or camera overlay
- backend story payload: producer video URL, vineyard coordinates, aroma icons, facts
- optional Google Maps/3D terrain integration

## Group Compatibility

The matching algorithm should combine:

- liked styles
- disliked traits
- ratings history
- current food pairing
- available bottles

## Sustainability

Current demo score is based on distance, farming method and bottle weight. Production should store:

- winery coordinates
- farming certification
- bottle weight
- transport distance
- packaging type
- calculated carbon estimate

## Nearby Wineries and Wine Places

The user app now uses browser geolocation to find nearby wineries, wine bars and wine shops. In the demo, places are stored locally and sorted with the Haversine distance formula.

Production implementation should replace the local list with one of these providers:

- Google Places API for wineries, wine bars and enoteche near the user.
- Google Maps Platform for route, distance matrix and opening hours.
- WineCellar backend cache to avoid exposing API keys in the client.

Privacy rule: ask for location only after explicit user action and store coarse location unless precise coordinates are needed for navigation.
