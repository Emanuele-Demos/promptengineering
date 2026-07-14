<?php

declare(strict_types=1);

namespace App\DTO;

final readonly class TastingData
{
    public function __construct(
        public int $wineId,
        public int $rating,
        public string $aroma,
        public string $color,
        public string $body,
        public string $acidity,
        public string $tannins,
        public string $persistence,
        public string $balance,
        public string $complexity,
        public string $pairing,
        public string $servingTemperature,
        public string $occasion,
        public string $comment,
        public bool $wouldBuyAgain,
        public ?string $place,
        public ?string $people,
    ) {
    }

    public static function fromArray(array $input): self
    {
        return new self(
            wineId: (int) ($input['wine_id'] ?? 0),
            rating: (int) ($input['rating'] ?? 0),
            aroma: (string) ($input['aroma'] ?? ''),
            color: (string) ($input['color'] ?? ''),
            body: (string) ($input['body'] ?? ''),
            acidity: (string) ($input['acidity'] ?? ''),
            tannins: (string) ($input['tannins'] ?? ''),
            persistence: (string) ($input['persistence'] ?? ''),
            balance: (string) ($input['balance'] ?? ''),
            complexity: (string) ($input['complexity'] ?? ''),
            pairing: (string) ($input['pairing'] ?? ''),
            servingTemperature: (string) ($input['serving_temperature'] ?? ''),
            occasion: (string) ($input['occasion'] ?? ''),
            comment: (string) ($input['comment'] ?? ''),
            wouldBuyAgain: (bool) ($input['would_buy_again'] ?? false),
            place: $input['place'] ?? null,
            people: $input['people'] ?? null,
        );
    }
}
