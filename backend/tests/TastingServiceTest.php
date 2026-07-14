<?php

declare(strict_types=1);

namespace Tests;

use App\DTO\TastingData;
use App\Services\TastingService;
use PHPUnit\Framework\TestCase;

final class TastingServiceTest extends TestCase
{
    public function testReviewIsRequiredBeforeBottleIsConsumed(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        (new TastingService())->consumeWithMandatoryReview(new TastingData(
            wineId: 1,
            rating: 5,
            aroma: '',
            color: 'Rubino',
            body: 'Pieno',
            acidity: 'Media',
            tannins: 'Setosi',
            persistence: 'Lunga',
            balance: 'Ottimo',
            complexity: 'Alta',
            pairing: 'Brasato',
            servingTemperature: '18 C',
            occasion: 'Cena',
            comment: 'Elegante',
            wouldBuyAgain: true,
            place: null,
            people: null,
        ));
    }
}
