<?php

declare(strict_types=1);

namespace App\Http\Controllers;

final class AuthController
{
    public function register(array $input): array
    {
        return [
            'user' => [
                'id' => 1,
                'name' => $input['name'] ?? 'Wine Lover',
                'email' => $input['email'] ?? 'demo@winecellar.local',
                'taster_level' => 'beginner',
                'joined_at' => date(DATE_ATOM),
            ],
            'token' => $this->fakeJwt(),
        ];
    }

    public function login(array $input): array
    {
        return [
            'user' => [
                'id' => 1,
                'name' => 'Wine Lover',
                'email' => $input['email'] ?? 'demo@winecellar.local',
            ],
            'token' => $this->fakeJwt(),
        ];
    }

    private function fakeJwt(): string
    {
        return base64_encode(json_encode(['sub' => 1, 'iat' => time(), 'dev' => true]));
    }
}
