<?php

declare(strict_types=1);

namespace App\Repositories;

use App\DTO\WineData;

final class WineRepository
{
    private string $file;

    public function __construct()
    {
        $this->file = dirname(__DIR__, 2) . '/storage/wines.json';
        if (!is_dir(dirname($this->file))) {
            mkdir(dirname($this->file), 0775, true);
        }
        if (!file_exists($this->file)) {
            file_put_contents($this->file, json_encode($this->seed(), JSON_PRETTY_PRINT));
        }
    }

    public function all(): array
    {
        return json_decode(file_get_contents($this->file), true) ?: [];
    }

    public function create(WineData $data): array
    {
        $wines = $this->all();
        $wine = [
            'id' => count($wines) + 1,
            'name' => $data->name,
            'producer' => $data->producer,
            'vintage' => $data->vintage,
            'denomination' => $data->denomination,
            'region' => $data->region,
            'country' => $data->country,
            'grape' => $data->grape,
            'alcohol' => $data->alcohol,
            'paid_price' => $data->paidPrice,
            'market_price' => $data->marketPrice,
            'quantity' => $data->quantity,
            'cellar_position' => $data->cellarPosition,
            'status' => $data->status,
            'private_notes' => $data->privateNotes,
            'created_at' => date(DATE_ATOM),
        ];
        $wines[] = $wine;
        $this->save($wines);

        return $wine;
    }

    public function decrementQuantity(int $wineId): array
    {
        $wines = $this->all();
        foreach ($wines as &$wine) {
            if ((int) $wine['id'] !== $wineId) {
                continue;
            }
            if ((int) $wine['quantity'] <= 0) {
                throw new \RuntimeException('Wine is already out of stock.');
            }
            $wine['quantity'] = (int) $wine['quantity'] - 1;
            if ($wine['quantity'] === 0) {
                $wine['status'] = 'consumed';
            }
            $this->save($wines);
            return $wine;
        }

        throw new \RuntimeException('Wine not found.');
    }

    private function save(array $wines): void
    {
        file_put_contents($this->file, json_encode($wines, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    private function seed(): array
    {
        return [
            [
                'id' => 1,
                'name' => 'Barolo',
                'producer' => 'Cantina Demo',
                'vintage' => 2019,
                'denomination' => 'DOCG',
                'region' => 'Piemonte',
                'country' => 'Italia',
                'grape' => 'Nebbiolo',
                'alcohol' => 14.5,
                'paid_price' => 38.0,
                'market_price' => 46.0,
                'quantity' => 12,
                'cellar_position' => 'Scaffale A1',
                'status' => 'aging',
                'private_notes' => 'Aprire dal 2027.',
                'created_at' => date(DATE_ATOM),
            ],
        ];
    }
}
