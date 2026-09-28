<?php

declare(strict_types=1);

namespace Danf73\RestaurantOperations;

use Nimbus\Content\ContentReader;

final class Menu
{
    public const COLLECTION = 'menu_items';

    public function __construct(private \Closure $reader)
    {
    }

    /** @return list<array{id:int,name:string,price:string,category:?string}> */
    public function items(): array
    {
        $items = [];
        foreach (($this->reader)()->entries(self::COLLECTION, 500) as $entry) {
            $items[] = [
                'id' => (int) ($entry['id'] ?? 0),
                'name' => (string) ($entry['title'] ?? ''),
                'price' => $this->price($entry),
                'category' => $this->category($entry),
            ];
        }
        return $items;
    }

    /** @return array{name:string,price:string}|null */
    public function snapshot(int $id): ?array
    {
        $entry = ($this->reader)()->entry(self::COLLECTION, $id);
        if ($entry === null) {
            return null;
        }
        return [
            'name' => (string) ($entry['title'] ?? ''),
            'price' => $this->price($entry),
        ];
    }

    /** @param array<string,mixed> $entry */
    private function price(array $entry): string
    {
        $fields = is_array($entry['fields'] ?? null) ? $entry['fields'] : [];
        $value = $fields['price'] ?? 0;
        return number_format(is_numeric($value) ? (float) $value : 0, 2, '.', '');
    }

    /** @param array<string,mixed> $entry */
    private function category(array $entry): ?string
    {
        $fields = is_array($entry['fields'] ?? null) ? $entry['fields'] : [];
        $category = $fields['category'] ?? null;
        if (is_array($category) && isset($category[0]['title'])) {
            return (string) $category[0]['title'];
        }
        return is_string($category) && $category !== '' ? $category : null;
    }
}
