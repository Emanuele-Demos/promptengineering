<?php

declare(strict_types=1);

namespace App\Services\WineCatalog;

interface WineCatalogProvider
{
    public function search(string $query, int $limit = 10): array;

    public function findByBarcode(string $barcode): ?array;
}
