<?php

declare(strict_types=1);

namespace App\Services;

use App\DTO\WineData;
use App\Repositories\WineRepository;

final class InventoryService
{
    public function __construct(private ?WineRepository $wines = null)
    {
        $this->wines ??= new WineRepository();
    }

    public function dashboard(): array
    {
        $wines = $this->wines->all();
        $totalBottles = array_sum(array_column($wines, 'quantity'));
        $estimatedValue = array_sum(array_map(
            fn (array $wine): float => ((float) ($wine['market_price'] ?? 0)) * ((int) ($wine['quantity'] ?? 0)),
            $wines
        ));

        return [
            'total_bottles' => $totalBottles,
            'estimated_value' => round($estimatedValue, 2),
            'ready_to_drink' => count(array_filter($wines, fn ($wine) => $wine['status'] === 'ready')),
            'aging' => count(array_filter($wines, fn ($wine) => $wine['status'] === 'aging')),
            'low_stock' => array_values(array_filter($wines, fn ($wine) => (int) $wine['quantity'] <= 2)),
            'latest_wines' => array_slice(array_reverse($wines), 0, 5),
        ];
    }

    public function listWines(): array
    {
        return $this->wines->all();
    }

    public function addWine(WineData $data): array
    {
        if ($data->name === '' || $data->producer === '') {
            throw new \InvalidArgumentException('Name and producer are required.');
        }

        return $this->wines->create($data);
    }

    public function consumeBottle(int $wineId): array
    {
        return $this->wines->decrementQuantity($wineId);
    }
}
