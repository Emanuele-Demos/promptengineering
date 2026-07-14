<?php

declare(strict_types=1);

namespace App\Services;

final class RecognitionService
{
    public function recognizeLabel(string $imagePath): array
    {
        return [
            'provider' => 'ml-kit-or-cloud-vision',
            'status' => 'pending_provider_configuration',
            'matches' => [],
            'manual_creation_allowed' => true,
            'notes' => 'Replace this adapter with Google ML Kit on mobile or Cloud Vision on backend.',
        ];
    }

    public function recognizeBarcode(string $barcode): array
    {
        return [
            'barcode' => $barcode,
            'matches' => [],
            'manual_creation_allowed' => true,
        ];
    }
}
