<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\DTO\WineData;
use App\Services\InventoryService;

final class CellarController
{
    public function __construct(private ?InventoryService $inventory = null)
    {
        $this->inventory ??= new InventoryService();
    }

    public function dashboard(): array
    {
        return $this->inventory->dashboard();
    }

    public function index(): array
    {
        return ['data' => $this->inventory->listWines()];
    }

    public function store(array $input): array
    {
        return ['data' => $this->inventory->addWine(WineData::fromArray($input))];
    }
}
