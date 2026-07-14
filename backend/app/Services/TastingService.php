<?php

declare(strict_types=1);

namespace App\Services;

use App\DTO\TastingData;
use App\Repositories\TastingRepository;

final class TastingService
{
    public function __construct(
        private ?TastingRepository $tastings = null,
        private ?InventoryService $inventory = null,
    ) {
        $this->tastings ??= new TastingRepository();
        $this->inventory ??= new InventoryService();
    }

    public function consumeWithMandatoryReview(TastingData $data): array
    {
        $this->validate($data);
        $tasting = $this->tastings->create($data);
        $wine = $this->inventory->consumeBottle($data->wineId);

        return [
            'message' => 'Review saved and bottle consumed.',
            'tasting' => $tasting,
            'wine' => $wine,
        ];
    }

    private function validate(TastingData $data): void
    {
        $required = [
            'aroma' => $data->aroma,
            'color' => $data->color,
            'body' => $data->body,
            'acidity' => $data->acidity,
            'tannins' => $data->tannins,
            'persistence' => $data->persistence,
            'balance' => $data->balance,
            'complexity' => $data->complexity,
            'pairing' => $data->pairing,
            'serving_temperature' => $data->servingTemperature,
            'occasion' => $data->occasion,
            'comment' => $data->comment,
        ];

        if ($data->wineId <= 0 || $data->rating < 1 || $data->rating > 5) {
            throw new \InvalidArgumentException('Wine id and rating from 1 to 5 are required.');
        }

        foreach ($required as $field => $value) {
            if (trim($value) === '') {
                throw new \InvalidArgumentException("Field {$field} is required before consuming a bottle.");
            }
        }
    }
}
