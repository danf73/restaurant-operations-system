<?php

declare(strict_types=1);

namespace Danf73\RestaurantOperations;

final class Schema
{
    public const TABLE = 'rest_table';
    public const ORDER = 'rest_order';
    public const ORDER_ITEM = 'rest_order_item';
    public const RESERVATION = 'rest_reservation';
    public const PAYMENT = 'rest_payment';

    /** @return list<string> */
    public static function all(): array
    {
        return [
            'CREATE TABLE IF NOT EXISTS ' . self::TABLE . " (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                label VARCHAR(40) NOT NULL,
                seats SMALLINT UNSIGNED NOT NULL DEFAULT 2,
                status VARCHAR(20) NOT NULL DEFAULT 'available',
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                UNIQUE KEY uniq_rest_table_label (label),
                INDEX idx_rest_table_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            'CREATE TABLE IF NOT EXISTS ' . self::ORDER . " (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                table_id BIGINT UNSIGNED NULL,
                channel VARCHAR(20) NOT NULL DEFAULT 'dine_in',
                customer_name VARCHAR(120) NULL,
                customer_phone VARCHAR(40) NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'open',
                payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
                total DECIMAL(10,2) NOT NULL DEFAULT 0,
                notes TEXT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                INDEX idx_rest_order_status (status),
                INDEX idx_rest_order_table (table_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            'CREATE TABLE IF NOT EXISTS ' . self::ORDER_ITEM . " (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                order_id BIGINT UNSIGNED NOT NULL,
                menu_item_id BIGINT UNSIGNED NULL,
                name VARCHAR(200) NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                quantity SMALLINT UNSIGNED NOT NULL,
                created_at DATETIME NOT NULL,
                INDEX idx_rest_order_item_order (order_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            'CREATE TABLE IF NOT EXISTS ' . self::RESERVATION . " (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                table_id BIGINT UNSIGNED NULL,
                guest_name VARCHAR(120) NOT NULL,
                guest_phone VARCHAR(40) NULL,
                party_size SMALLINT UNSIGNED NOT NULL,
                reserved_for DATETIME NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'booked',
                notes TEXT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                INDEX idx_rest_reservation_time (reserved_for),
                INDEX idx_rest_reservation_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
            'CREATE TABLE IF NOT EXISTS ' . self::PAYMENT . " (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                order_id BIGINT UNSIGNED NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                method VARCHAR(20) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'paid',
                reference VARCHAR(80) NULL,
                created_at DATETIME NOT NULL,
                INDEX idx_rest_payment_order (order_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
        ];
    }
}
