<?php

declare(strict_types=1);

namespace App\DTO;

final readonly class WineData
{
    public function __construct(
        public string $name,
        public string $producer,
        public ?int $vintage,
        public ?string $denomination,
        public ?string $region,
        public ?string $country,
        public ?string $grape,
        public ?float $alcohol,
        public ?float $paidPrice,
        public ?float $marketPrice,
        public int $quantity,
        public ?string $cellarPosition,
        public ?string $status,
        public ?string $privateNotes,
    ) {
    }

    public static function fromArray(array $input): self
    {
        return new self(
            name: trim((string) ($input['name'] ?? '')),
            producer: trim((string) ($input['producer'] ?? '')),
            vintage: isset($input['vintage']) ? (int) $input['vintage'] : null,
            denomination: $input['denomination'] ?? null,
            region: $input['region'] ?? null,
            country: $input['country'] ?? null,
            grape: $input['grape'] ?? null,
            alcohol: isset($input['alcohol']) ? (float) $input['alcohol'] : null,
            paidPrice: isset($input['paid_price']) ? (float) $input['paid_price'] : null,
            marketPrice: isset($input['market_price']) ? (float) $input['market_price'] : null,
            quantity: max(0, (int) ($input['quantity'] ?? 1)),
            cellarPosition: $input['cellar_position'] ?? null,
            status: $input['status'] ?? 'aging',
            privateNotes: $input['private_notes'] ?? null,
        );
    }
}
