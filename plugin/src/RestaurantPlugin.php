<?php

declare(strict_types=1);

namespace Danf73\RestaurantOperations;

use Nimbus\Http\Request;
use Nimbus\Http\Response;
use Nimbus\Plugin\Plugin;
use Nimbus\Plugin\PluginContext;
use Nimbus\Plugin\PluginStorage;

final class RestaurantPlugin implements Plugin
{
    public const ID = 'danf73.restaurant-operations';

    public function register(PluginContext $context): void
    {
        $context->migrations()->register('001_restaurant_schema', Schema::all());
        $context->capabilities()->declare('Restaurant operations', [
            'floor',
            'orders',
            'kitchen',
            'payments',
            'reservations',
            'reports',
        ]);

        $storage = static fn (): PluginStorage => $context->storage();
        $menu = new Menu(static fn () => $context->content());
        $app = new Operations($storage, $menu);
        $operatorOnly = static function (Request $request): ?Response {
            $expected = (string) getenv('RESTAURANT_OPERATOR_TOKEN');
            $provided = (string) ($request->bearerToken() ?? '');
            if ($expected === '' || $provided === '' || !hash_equals($expected, $provided)) {
                return Response::json(['error' => 'Operator authentication required.'], 401);
            }
            return null;
        };

        $context->routes()->get('restaurant-operations', '/menu', static function () use ($menu): Response {
            return Response::json(['items' => $menu->items()]);
        });

        $context->routes()->get('restaurant-operations', '/status', static function (Request $request) use ($app, $operatorOnly): Response {
            if (($denied = $operatorOnly($request)) !== null) {
                return $denied;
            }
            return Response::json($app->status());
        });
        $context->routes()->get('restaurant-operations', '/floor', static function (Request $request) use ($app, $operatorOnly): Response {
            if (($denied = $operatorOnly($request)) !== null) {
                return $denied;
            }
            return Response::json(['tables' => $app->tables()]);
        });
        $context->routes()->post('restaurant-operations', '/floor/tables', static function (Request $request) use ($app, $operatorOnly): Response {
            if (($denied = $operatorOnly($request)) !== null) {
                return $denied;
            }
            try {
                return Response::json($app->createTable($request->all()), 201);
            } catch (\InvalidArgumentException $error) {
                return Response::json(['error' => $error->getMessage()], 422);
            }
        });
        $context->routes()->put('restaurant-operations', '/floor/tables/{id}/status', static function (Request $request, array $params) use ($app, $operatorOnly): Response {
            if (($denied = $operatorOnly($request)) !== null) {
                return $denied;
            }
            try {
                return Response::json($app->updateTableStatus((int) ($params['id'] ?? 0), (string) ($request->input('status') ?? '')));
            } catch (\InvalidArgumentException $error) {
                return Response::json(['error' => $error->getMessage()], 422);
            }
        });
        $context->routes()->get('restaurant-operations', '/kitchen', static function (Request $request) use ($app, $operatorOnly): Response {
            if (($denied = $operatorOnly($request)) !== null) {
                return $denied;
            }
            return Response::json(['orders' => $app->kitchenQueue()]);
        });
        $context->routes()->get('restaurant-operations', '/reports', static function (Request $request) use ($app, $operatorOnly): Response {
            if (($denied = $operatorOnly($request)) !== null) {
                return $denied;
            }
            return Response::json($app->reports());
        });
        $context->routes()->get('restaurant-operations', '/reservations', static function (Request $request) use ($app, $operatorOnly): Response {
            if (($denied = $operatorOnly($request)) !== null) {
                return $denied;
            }
            return Response::json(['reservations' => $app->reservations()]);
        });
        $context->routes()->post('restaurant-operations', '/reservations', static function (Request $request) use ($app): Response {
            try {
                return Response::json($app->bookReservation($request->all()), 201);
            } catch (\InvalidArgumentException $error) {
                return Response::json(['error' => $error->getMessage()], 422);
            }
        });
        $context->routes()->put('restaurant-operations', '/reservations/{id}/status', static function (Request $request, array $params) use ($app, $operatorOnly): Response {
            if (($denied = $operatorOnly($request)) !== null) {
                return $denied;
            }
            try {
                return Response::json($app->updateReservationStatus((int) ($params['id'] ?? 0), (string) ($request->input('status') ?? '')));
            } catch (\InvalidArgumentException $error) {
                return Response::json(['error' => $error->getMessage()], 422);
            }
        });
        $context->routes()->post('restaurant-operations', '/orders', static function (Request $request) use ($app): Response {
            try {
                return Response::json($app->placeOnlineOrder($request->all()), 201);
            } catch (\InvalidArgumentException $error) {
                return Response::json(['error' => $error->getMessage()], 422);
            }
        });
        $context->routes()->put('restaurant-operations', '/orders/{id}/status', static function (Request $request, array $params) use ($app, $operatorOnly): Response {
            if (($denied = $operatorOnly($request)) !== null) {
                return $denied;
            }
            try {
                return Response::json($app->updateOrderStatus((int) ($params['id'] ?? 0), (string) ($request->input('status') ?? '')));
            } catch (\InvalidArgumentException $error) {
                return Response::json(['error' => $error->getMessage()], 422);
            }
        });
        $context->routes()->post('restaurant-operations', '/orders/{id}/payments', static function (Request $request, array $params) use ($app, $operatorOnly): Response {
            if (($denied = $operatorOnly($request)) !== null) {
                return $denied;
            }
            try {
                return Response::json($app->settleOrder((int) ($params['id'] ?? 0), (string) ($request->input('method') ?? '')));
            } catch (\InvalidArgumentException $error) {
                return Response::json(['error' => $error->getMessage()], 422);
            }
        });

        $context->adminPages()->register(
            'restaurant-operations',
            'Restaurant operations',
            '🍽️',
            static fn () => Response::html($app->adminSummaryHtml()),
            self::ID . ':reports',
        );
    }
}
