<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\DTO\TastingData;
use App\Services\TastingService;

final class TastingController
{
    public function __construct(private ?TastingService $tastings = null)
    {
        $this->tastings ??= new TastingService();
    }

    public function consumeWithReview(array $input): array
    {
        return $this->tastings->consumeWithMandatoryReview(TastingData::fromArray($input));
    }
}
