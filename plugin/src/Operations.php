<?php

declare(strict_types=1);

namespace Danf73\RestaurantOperations;

use Nimbus\Plugin\PluginStorage;

final class Operations
{
    private const TABLE_STATUSES = ['available', 'occupied', 'reserved', 'needs_attention'];
    private const ORDER_STATUSES = ['open', 'sent', 'preparing', 'ready', 'served', 'closed'];
    private const RESERVATION_STATUSES = ['booked', 'seated', 'cancelled', 'no_show'];
    private const PAYMENT_METHODS = ['cash', 'card', 'other'];

    public function __construct(private \Closure $storage, private Menu $menu)
    {
    }

    /** @return list<array<string,mixed>> */
    public function tables(): array
    {
        return $this->storage()->select(
            'SELECT id, label, seats, status, updated_at FROM ' . Schema::TABLE . ' ORDER BY label',
        );
    }

    /** @param array<string,mixed> $input @return array<string,mixed> */
    public function createTable(array $input): array
    {
        $label = trim((string) ($input['label'] ?? ''));
        $seats = filter_var($input['seats'] ?? 2, FILTER_VALIDATE_INT);
        if ($label === '' || mb_strlen($label) > 40 || $seats === false || $seats < 1 || $seats > 100) {
            throw new \InvalidArgumentException('A table needs a label and a seat count from 1 to 100.');
        }
        if ($this->storage()->selectOne(
            'SELECT id FROM ' . Schema::TABLE . ' WHERE label = :label',
            ['label' => $label],
        ) !== null) {
            throw new \InvalidArgumentException('Table label must be unique.');
        }
        $now = date('Y-m-d H:i:s');
        $id = $this->storage()->insert(
            'INSERT INTO ' . Schema::TABLE . ' (label, seats, status, created_at, updated_at)
             VALUES (:label, :seats, :status, :created, :updated)',
            ['label' => $label, 'seats' => $seats, 'status' => 'available', 'created' => $now, 'updated' => $now],
        );
        return ['id' => $id, 'label' => $label, 'seats' => $seats, 'status' => 'available'];
    }

    /** @return array<string,mixed> */
    public function updateTableStatus(int $id, string $status): array
    {
        if ($id < 1 || !in_array($status, self::TABLE_STATUSES, true)) {
            throw new \InvalidArgumentException('A valid table id and status are required.');
        }
        $changed = $this->storage()->execute(
            'UPDATE ' . Schema::TABLE . ' SET status = :status, updated_at = :updated WHERE id = :id',
            ['status' => $status, 'updated' => date('Y-m-d H:i:s'), 'id' => $id],
        );
        if ($changed < 1) {
            throw new \InvalidArgumentException('Table not found.');
        }
        return ['id' => $id, 'status' => $status];
    }

    /** @return list<array<string,mixed>> */
    public function kitchenQueue(): array
    {
        return $this->storage()->select(
            'SELECT id, table_id, channel, customer_name, status, total, notes, created_at
             FROM ' . Schema::ORDER . " WHERE status IN ('sent','preparing','ready') ORDER BY created_at",
        );
    }

    /** @return list<array<string,mixed>> */
    public function reservations(): array
    {
        return $this->storage()->select(
            'SELECT id, table_id, guest_name, guest_phone, party_size, reserved_for, status, notes
             FROM ' . Schema::RESERVATION . " WHERE status = 'booked' ORDER BY reserved_for",
        );
    }

    /** @return array<string,mixed> */
    public function status(): array
    {
        $counts = $this->storage()->select(
            'SELECT status, COUNT(*) AS count FROM ' . Schema::ORDER . ' GROUP BY status',
        );
        return [
            'tables' => $this->tables(),
            'orders_by_status' => $counts,
            'kitchen_queue' => count($this->kitchenQueue()),
            'reservations' => count($this->reservations()),
        ];
    }

    /** @return array<string,mixed> */
    public function reports(): array
    {
        $summary = $this->storage()->selectOne(
            'SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue,
                    COALESCE(AVG(total), 0) AS average_order
             FROM ' . Schema::ORDER . " WHERE status = 'closed'",
        ) ?? ['orders' => 0, 'revenue' => 0, 'average_order' => 0];
        return [
            'orders' => (int) $summary['orders'],
            'revenue' => round((float) $summary['revenue'], 2),
            'average_order' => round((float) $summary['average_order'], 2),
            'popular_items' => $this->storage()->select(
                'SELECT name, SUM(quantity) AS quantity FROM ' . Schema::ORDER_ITEM .
                ' GROUP BY name ORDER BY quantity DESC LIMIT 10',
            ),
        ];
    }

    /** @param array<string,mixed> $input @return array<string,mixed> */
    public function bookReservation(array $input): array
    {
        $name = trim((string) ($input['guest_name'] ?? ''));
        $date = trim((string) ($input['reserved_for'] ?? ''));
        $partySize = filter_var($input['party_size'] ?? null, FILTER_VALIDATE_INT);
        if ($name === '' || $date === '' || $partySize === false || $partySize < 1 || $partySize > 100) {
            throw new \InvalidArgumentException('Guest name, reservation time, and a party size from 1 to 100 are required.');
        }
        $now = date('Y-m-d H:i:s');
        $id = $this->storage()->insert(
            'INSERT INTO ' . Schema::RESERVATION . ' (table_id, guest_name, guest_phone, party_size, reserved_for, status, notes, created_at, updated_at)
             VALUES (:table_id, :name, :phone, :party_size, :reserved_for, :status, :notes, :created, :updated)',
            [
                'table_id' => $this->nullableInt($input['table_id'] ?? null),
                'name' => mb_substr($name, 0, 120),
                'phone' => mb_substr(trim((string) ($input['guest_phone'] ?? '')), 0, 40) ?: null,
                'party_size' => $partySize,
                'reserved_for' => $date,
                'status' => 'booked',
                'notes' => mb_substr(trim((string) ($input['notes'] ?? '')), 0, 1000) ?: null,
                'created' => $now,
                'updated' => $now,
            ],
        );
        return ['id' => $id, 'status' => 'booked'];
    }

    /** @return array<string,mixed> */
    public function updateReservationStatus(int $id, string $status): array
    {
        if ($id < 1 || !in_array($status, self::RESERVATION_STATUSES, true)) {
            throw new \InvalidArgumentException('A valid reservation id and status are required.');
        }
        $changed = $this->storage()->execute(
            'UPDATE ' . Schema::RESERVATION . ' SET status = :status, updated_at = :updated WHERE id = :id',
            ['status' => $status, 'updated' => date('Y-m-d H:i:s'), 'id' => $id],
        );
        if ($changed < 1) {
            throw new \InvalidArgumentException('Reservation not found.');
        }
        return ['id' => $id, 'status' => $status];
    }

    /** @param array<string,mixed> $input @return array<string,mixed> */
    public function placeOnlineOrder(array $input): array
    {
        $items = $input['items'] ?? [];
        if (!is_array($items) || $items === []) {
            throw new \InvalidArgumentException('An online order needs at least one item.');
        }
        $now = date('Y-m-d H:i:s');
        $this->storage()->execute('START TRANSACTION');
        try {
            $orderId = $this->storage()->insert(
                'INSERT INTO ' . Schema::ORDER . ' (channel, customer_name, customer_phone, status, payment_status, total, notes, created_at, updated_at)
                 VALUES (:channel, :name, :phone, :status, :payment, 0, :notes, :created, :updated)',
                [
                    'channel' => 'online',
                    'name' => mb_substr(trim((string) ($input['customer_name'] ?? '')), 0, 120) ?: null,
                    'phone' => mb_substr(trim((string) ($input['customer_phone'] ?? '')), 0, 40) ?: null,
                    'status' => 'sent',
                    'payment' => 'unpaid',
                    'notes' => mb_substr(trim((string) ($input['notes'] ?? '')), 0, 1000) ?: null,
                    'created' => $now,
                    'updated' => $now,
                ],
            );
            $total = 0.0;
            foreach ($items as $item) {
                $menuItemId = filter_var($item['menu_item_id'] ?? null, FILTER_VALIDATE_INT);
                $snapshot = $menuItemId === false ? null : $this->menu->snapshot($menuItemId);
                $quantity = filter_var($item['quantity'] ?? null, FILTER_VALIDATE_INT);
                if ($snapshot === null || $quantity === false || $quantity < 1 || $quantity > 99) {
                    throw new \InvalidArgumentException('Each item needs a published menu item and a quantity from 1 to 99.');
                }
                $name = $snapshot['name'];
                $price = (float) $snapshot['price'];
                $lineTotal = $price * $quantity;
                $total += $lineTotal;
                $this->storage()->insert(
                    'INSERT INTO ' . Schema::ORDER_ITEM . ' (order_id, menu_item_id, name, unit_price, quantity, created_at)
                     VALUES (:order_id, :menu_item_id, :name, :price, :quantity, :created)',
                    [
                        'order_id' => $orderId,
                        'menu_item_id' => $menuItemId,
                        'name' => mb_substr($name, 0, 200),
                        'price' => number_format($price, 2, '.', ''),
                        'quantity' => $quantity,
                        'created' => $now,
                    ],
                );
            }
            $total = round($total, 2);
            $this->storage()->execute(
                'UPDATE ' . Schema::ORDER . ' SET total = :total WHERE id = :id',
                ['total' => $total, 'id' => $orderId],
            );
            $this->storage()->execute('COMMIT');
            return ['id' => $orderId, 'status' => 'sent', 'total' => $total];
        } catch (\Throwable $error) {
            $this->storage()->execute('ROLLBACK');
            throw $error;
        }
    }

    /** @return array<string,mixed> */
    public function updateOrderStatus(int $id, string $status): array
    {
        if ($id < 1 || !in_array($status, self::ORDER_STATUSES, true)) {
            throw new \InvalidArgumentException('A valid order id and status are required.');
        }
        $changed = $this->storage()->execute(
            'UPDATE ' . Schema::ORDER . ' SET status = :status, updated_at = :updated WHERE id = :id',
            ['status' => $status, 'updated' => date('Y-m-d H:i:s'), 'id' => $id],
        );
        if ($changed < 1) {
            throw new \InvalidArgumentException('Order not found.');
        }
        return ['id' => $id, 'status' => $status];
    }

    /** @return array<string,mixed> */
    public function settleOrder(int $id, string $method): array
    {
        if ($id < 1 || !in_array($method, self::PAYMENT_METHODS, true)) {
            throw new \InvalidArgumentException('A valid order id and payment method are required.');
        }
        $order = $this->storage()->selectOne(
            'SELECT id, total, payment_status FROM ' . Schema::ORDER . ' WHERE id = :id',
            ['id' => $id],
        );
        if ($order === null) {
            throw new \InvalidArgumentException('Order not found.');
        }
        if ((string) $order['payment_status'] === 'paid') {
            throw new \InvalidArgumentException('Order is already paid.');
        }
        $now = date('Y-m-d H:i:s');
        $paymentId = $this->storage()->insert(
            'INSERT INTO ' . Schema::PAYMENT . ' (order_id, amount, method, status, reference, created_at)
             VALUES (:order_id, :amount, :method, :status, :reference, :created)',
            [
                'order_id' => $id,
                'amount' => $order['total'],
                'method' => $method,
                'status' => 'paid',
                'reference' => 'demo-' . $id . '-' . time(),
                'created' => $now,
            ],
        );
        $this->storage()->execute(
            'UPDATE ' . Schema::ORDER . " SET payment_status = 'paid', updated_at = :updated WHERE id = :id",
            ['updated' => $now, 'id' => $id],
        );
        return ['payment_id' => $paymentId, 'order_id' => $id, 'status' => 'paid', 'amount' => (float) $order['total']];
    }

    public function adminSummaryHtml(): string
    {
        $status = $this->status();
        $reports = $this->reports();
        $revenue = number_format((float) $reports['revenue'], 2);
        $queue = (int) $status['kitchen_queue'];
        $reservations = (int) $status['reservations'];
        return '<section style="max-width:960px"><h1>Restaurant operations</h1>'
            . '<p>Floor, kitchen, online ordering, reservations and payment overview.</p>'
            . '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">'
            . '<article><strong>Closed revenue</strong><div>$' . $revenue . '</div></article>'
            . '<article><strong>Kitchen queue</strong><div>' . $queue . '</div></article>'
            . '<article><strong>Upcoming reservations</strong><div>' . $reservations . '</div></article>'
            . '</div></section>';
    }

    private function storage(): PluginStorage
    {
        return ($this->storage)();
    }

    private function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        $number = filter_var($value, FILTER_VALIDATE_INT);
        return $number === false || $number < 1 ? null : $number;
    }
}
