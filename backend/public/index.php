<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CellarController;
use App\Http\Controllers\TastingController;
use App\Http\Controllers\WineCatalogController;
use App\Support\JsonResponse;

$vendorAutoload = dirname(__DIR__) . '/vendor/autoload.php';
if (file_exists($vendorAutoload)) {
    require $vendorAutoload;
} else {
    spl_autoload_register(static function (string $class): void {
        $prefix = 'App\\';
        if (!str_starts_with($class, $prefix)) {
            return;
        }

        $relativeClass = substr($class, strlen($prefix));
        $file = dirname(__DIR__) . '/app/' . str_replace('\\', '/', $relativeClass) . '.php';
        if (file_exists($file)) {
            require $file;
        }
    });
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
$jsonBody = json_decode(file_get_contents('php://input') ?: '[]', true) ?: [];
$body = array_merge($_GET, $jsonBody);

try {
    $routes = [
        'POST /api/v1/auth/register' => [AuthController::class, 'register'],
        'POST /api/v1/auth/login' => [AuthController::class, 'login'],
        'GET /api/v1/cellar/dashboard' => [CellarController::class, 'dashboard'],
        'GET /api/v1/wines' => [CellarController::class, 'index'],
        'POST /api/v1/wines' => [CellarController::class, 'store'],
        'POST /api/v1/wines/consume' => [TastingController::class, 'consumeWithReview'],
        'GET /api/v1/catalog/search' => [WineCatalogController::class, 'search'],
        'GET /api/v1/catalog/barcode' => [WineCatalogController::class, 'barcode'],
    ];

    $handler = $routes[$method . ' ' . $path] ?? null;
    if (!$handler) {
        JsonResponse::send(['message' => 'Route not found', 'path' => $path], 404);
    }

    [$class, $action] = $handler;
    $controller = new $class();
    JsonResponse::send($controller->{$action}($body));
} catch (Throwable $exception) {
    JsonResponse::send([
        'message' => 'Unexpected error',
        'error' => $exception->getMessage(),
    ], 500);
}
