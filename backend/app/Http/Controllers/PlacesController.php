<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Places\GeoapifyPlacesProvider;

final class PlacesController
{
    public function __construct(private ?GeoapifyPlacesProvider $provider = null)
    {
        $this->provider ??= new GeoapifyPlacesProvider();
    }

    public function nearby(array $input): array
    {
        $lat = filter_var($input['lat'] ?? null, FILTER_VALIDATE_FLOAT);
        $lng = filter_var($input['lng'] ?? null, FILTER_VALIDATE_FLOAT);

        if ($lat === false || $lng === false) {
            return [
                'provider' => 'geoapify',
                'configured' => (bool) getenv('GEOAPIFY_API_KEY'),
                'data' => [],
                'message' => 'lat and lng query parameters are required.',
            ];
        }

        $radius = (int) ($input['radius'] ?? 50000);
        $limit = (int) ($input['limit'] ?? 10);

        return $this->provider->nearby((float) $lat, (float) $lng, $radius, $limit);
    }
}