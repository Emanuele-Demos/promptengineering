<?php

declare(strict_types=1);

namespace App\Repositories;

use App\DTO\TastingData;

final class TastingRepository
{
    private string $file;

    public function __construct()
    {
        $this->file = dirname(__DIR__, 2) . '/storage/tastings.json';
        if (!is_dir(dirname($this->file))) {
            mkdir(dirname($this->file), 0775, true);
        }
        if (!file_exists($this->file)) {
            file_put_contents($this->file, '[]');
        }
    }

    public function create(TastingData $data): array
    {
        $items = json_decode(file_get_contents($this->file), true) ?: [];
        $tasting = [
            'id' => count($items) + 1,
            'wine_id' => $data->wineId,
            'rating' => $data->rating,
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
            'would_buy_again' => $data->wouldBuyAgain,
            'place' => $data->place,
            'people' => $data->people,
            'created_at' => date(DATE_ATOM),
        ];
        $items[] = $tasting;
        file_put_contents($this->file, json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return $tasting;
    }
}
