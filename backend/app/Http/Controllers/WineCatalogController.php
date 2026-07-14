<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\WineCatalog\GrapemindsWineCatalogProvider;

final class WineCatalogController
{
    public function __construct(private ?GrapemindsWineCatalogProvider $provider = null)
    {
        $this->provider ??= new GrapemindsWineCatalogProvider();
    }

    public function search(array $input): array
    {
        $query = (string) ($input['query'] ?? $input['q'] ?? '');
        $limit = (int) ($input['limit'] ?? 10);

        return [
            'provider' => 'grapeminds',
            'query' => $query,
            'data' => $this->provider->search($query, $limit),
        ];
    }

    public function barcode(array $input): array
    {
        $barcode = (string) ($input['barcode'] ?? '');

        return [
            'provider' => 'grapeminds',
            'barcode' => $barcode,
            'data' => $this->provider->findByBarcode($barcode),
        ];
    }
}
