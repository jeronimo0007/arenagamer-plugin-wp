<?php

if (!defined('ABSPATH')) {
    exit;
}

class AG_Theme {

    public static function init(): void {
        add_filter('body_class', [self::class, 'body_class']);
    }

    public static function is_roda_child(): bool {
        if (!function_exists('wp_get_theme')) {
            return false;
        }

        return wp_get_theme()->get_stylesheet() === 'roda-child';
    }

    public static function integration_class(): string {
        return self::is_roda_child() ? 'ag-client--roda' : '';
    }

    public static function client_classes(): string {
        $classes = array_filter(['ag-client', self::integration_class()]);
        return implode(' ', $classes);
    }

    /** @param array<string, string> $attrs */
    public static function client_open(string $page, array $attrs = []): string {
        $attrs = array_merge([
            'class'         => self::client_classes($page),
            'data-ag-page'  => $page,
        ], $attrs);

        $parts = [];
        foreach ($attrs as $name => $value) {
            if ($value === '' || $value === null) {
                continue;
            }
            $parts[] = sprintf('%s="%s"', esc_attr($name), esc_attr((string) $value));
        }

        return '<div ' . implode(' ', $parts) . '>';
    }

    /** @param string[] $classes */
    public static function body_class(array $classes): array {
        if (self::is_roda_child()) {
            $classes[] = 'arenagamer-roda-child';
        }

        return $classes;
    }
}
