<?php

declare(strict_types=1);

namespace App\Services\Places;

final class GeoapifyPlacesProvider
{
    private string $baseUrl;
    private ?string $apiKey;

    public function __construct(?string $baseUrl = null, ?string $apiKey = null)
    {
        $this->baseUrl = rtrim($baseUrl ?: getenv('GEOAPIFY_BASE_URL') ?: 'https://api.geoapify.com/v2', '/');
        $this->apiKey = $apiKey ?: getenv('GEOAPIFY_API_KEY') ?: null;
    }

    public function nearby(float $lat, float $lng, int $radiusMeters = 50000, int $limit = 10): array
    {
        if (!$this->apiKey) {
            return [
                'provider' => 'geoapify',
                'configured' => false,
                'data' => [],
                'message' => 'Missing GEOAPIFY_API_KEY environment variable.',
            ];
        }

        $features = [];
        foreach (['cantina', 'enoteca', 'wine', 'winery'] as $name) {
            $response = $this->request('/places', [
                'categories' => 'commercial.food_and_drink.drinks,commercial.food_and_drink,catering.bar,catering.restaurant',
                'name' => $name,
                'filter' => sprintf('circle:%F,%F,%d', $lng, $lat, max(1000, min($radiusMeters, 100000))),
                'bias' => sprintf('proximity:%F,%F', $lng, $lat),
                'limit' => max(1, min($limit, 25)),
                'apiKey' => $this->apiKey,
            ]);
            $features = array_merge($features, $response['features'] ?? []);
        }

        $places = [];
        foreach ($features as $feature) {
            $place = is_array($feature) ? $this->normalizePlace($feature, $lat, $lng) : null;
            if ($place === null) {
                continue;
            }
            $places[(string) $place['id']] = $place;
        }

        usort($places, fn (array $a, array $b): int => $a['distance_km'] <=> $b['distance_km']);

        return [
            'provider' => 'geoapify',
            'configured' => true,
            'data' => array_slice(array_values($places), 0, max(1, min($limit, 25))),
        ];
    }

    private function request(string $path, array $query): array
    {
        $url = $this->baseUrl . $path . '?' . http_build_query($query);
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 8,
                'header' => implode("\r\n", [
                    'Accept: application/json',
                    'User-Agent: WineCellarAI/1.0',
                ]),
            ],
        ]);

        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            return ['features' => []];
        }

        $decoded = json_decode($response, true);

        return is_array($decoded) ? $decoded : ['features' => []];
    }

    private function normalizePlace(array $feature, float $userLat, float $userLng): ?array
    {
        $properties = $feature['properties'] ?? [];
        $coords = $feature['geometry']['coordinates'] ?? null;
        if (!is_array($properties) || !is_array($coords) || count($coords) < 2) {
            return null;
        }

        $lng = (float) $coords[0];
        $lat = (float) $coords[1];
        $name = (string) ($properties['name'] ?? $properties['address_line1'] ?? '');
        if (trim($name) === '') {
            return null;
        }

        return [
            'id' => $properties['place_id'] ?? md5($name . $lat . $lng),
            'name' => $name,
            'type' => $this->inferType((array) ($properties['categories'] ?? []), $name),
            'address' => $properties['formatted'] ?? $properties['address_line2'] ?? null,
            'lat' => $lat,
            'lng' => $lng,
            'distance_km' => round($this->distanceKm($userLat, $userLng, $lat, $lng), 2),
            'website' => $properties['website'] ?? null,
            'phone' => $properties['contact']['phone'] ?? $properties['phone'] ?? null,
        ];
    }

    private function inferType(array $categories, string $name): string
    {
        $text = strtolower($name . ' ' . implode(' ', $categories));
        if (str_contains($text, 'wine') || str_contains($text, 'vino') || str_contains($text, 'cantina')) {
            return 'Cantina / wine place';
        }
        if (str_contains($text, 'bar')) {
            return 'Wine bar';
        }

        return 'Enoteca / ristorante';
    }

    private function distanceKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusKm = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadiusKm * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}