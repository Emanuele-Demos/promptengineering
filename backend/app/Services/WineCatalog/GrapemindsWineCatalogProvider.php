<?php

declare(strict_types=1);

namespace App\Services\WineCatalog;

final class GrapemindsWineCatalogProvider implements WineCatalogProvider
{
    private string $baseUrl;
    private ?string $apiKey;

    public function __construct(?string $baseUrl = null, ?string $apiKey = null)
    {
        $this->baseUrl = rtrim($baseUrl ?: getenv('GRAPEMINDS_API_BASE_URL') ?: 'https://api.grapeminds.it', '/');
        $this->apiKey = $apiKey ?: getenv('GRAPEMINDS_API_KEY') ?: null;
    }

    public function search(string $query, int $limit = 10): array
    {
        if (trim($query) === '') {
            return [];
        }

        return $this->request('/wines', [
            'search' => $query,
            'limit' => max(1, min($limit, 25)),
        ])['data'] ?? [];
    }

    public function findByBarcode(string $barcode): ?array
    {
        if (trim($barcode) === '') {
            return null;
        }

        $result = $this->request('/wines/barcode/' . rawurlencode($barcode));

        return $result['data'] ?? null;
    }

    private function request(string $path, array $query = []): array
    {
        if (!$this->apiKey) {
            return [
                'data' => [],
                'provider' => 'grapeminds',
                'configured' => false,
                'message' => 'Missing GRAPEMINDS_API_KEY environment variable.',
            ];
        }

        $url = $this->baseUrl . $path;
        if ($query !== []) {
            $url .= '?' . http_build_query($query);
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 8,
                'header' => implode("\r\n", [
                    'Accept: application/json',
                    'Authorization: Bearer ' . $this->apiKey,
                    'User-Agent: WineCellarAI/1.0 (contact@example.com)',
                ]),
            ],
        ]);

        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            return [
                'data' => [],
                'provider' => 'grapeminds',
                'configured' => true,
                'message' => 'Provider request failed.',
            ];
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            return [
                'data' => [],
                'provider' => 'grapeminds',
                'configured' => true,
                'message' => 'Provider returned invalid JSON.',
            ];
        }

        return $decoded;
    }
}
