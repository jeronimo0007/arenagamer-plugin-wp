<?php

if (!defined('ABSPATH')) {
    exit;
}

class AG_Rewrites {

    public static function init(): void {
        add_action('init', [self::class, 'register']);
        add_filter('query_vars', [self::class, 'query_vars']);
    }

    /** @param string[] $vars */
    public static function query_vars(array $vars): array {
        $vars[] = 'ag_slug';
        return $vars;
    }

    public static function register(): void {
        $page_slug = self::detail_page_slug();
        if ($page_slug === '') {
            return;
        }

        add_rewrite_rule(
            '^' . preg_quote($page_slug, '/') . '/slug=([^/]+)/?$',
            'index.php?pagename=' . $page_slug . '&ag_slug=$matches[1]',
            'top'
        );

        add_rewrite_rule(
            '^' . preg_quote($page_slug, '/') . '/([^/]+)/?$',
            'index.php?pagename=' . $page_slug . '&ag_slug=$matches[1]',
            'top'
        );
    }

    public static function detail_page_slug(): string {
        $settings = AG_Settings::get();
        $url = self::normalize_tournament_page_url($settings['tournament_url'] ?? '');
        if ($url === '') {
            return '';
        }

        $path = wp_parse_url($url, PHP_URL_PATH);
        if (!is_string($path) || $path === '') {
            return '';
        }

        $relative = self::strip_home_path($path);
        $segments = array_values(array_filter(explode('/', $relative)));

        while (!empty($segments) && preg_match('/^slug=?$/i', (string) end($segments))) {
            array_pop($segments);
        }

        if (empty($segments)) {
            return '';
        }

        return sanitize_title((string) end($segments));
    }

    public static function normalize_tournament_page_url(string $url): string {
        $url = trim($url);
        if ($url === '') {
            return '';
        }

        $parts = wp_parse_url($url);
        if (!is_array($parts)) {
            return esc_url_raw($url);
        }

        $path = (string) ($parts['path'] ?? '');
        $path = preg_replace('#/slug=$#i', '/', $path);
        $path = preg_replace('#/slug/[^/]*$#i', '/', $path);
        $path = rtrim($path, '/') . '/';

        $scheme = isset($parts['scheme']) ? $parts['scheme'] . '://' : '';
        $host = $parts['host'] ?? '';
        $port = isset($parts['port']) ? ':' . $parts['port'] : '';
        $query = isset($parts['query']) ? '?' . $parts['query'] : '';

        return esc_url_raw($scheme . $host . $port . $path . $query);
    }

    private static function strip_home_path(string $path): string {
        $path = trim($path, '/');
        $home_path = trim((string) wp_parse_url(home_url(), PHP_URL_PATH), '/');

        if ($home_path !== '' && ($path === $home_path || str_starts_with($path, $home_path . '/'))) {
            $path = ltrim(substr($path, strlen($home_path)), '/');
        }

        return trim($path, '/');
    }

    public static function flush(): void {
        self::register();
        flush_rewrite_rules();
    }

    public static function resolve_slug_from_request(): string {
        $slug = get_query_var('ag_slug');
        if (is_string($slug) && $slug !== '') {
            return sanitize_title(rawurldecode($slug));
        }

        if (!empty($_GET['slug'])) {
            return sanitize_title(wp_unslash($_GET['slug']));
        }

        $uri = wp_unslash($_SERVER['REQUEST_URI'] ?? '');
        if (preg_match('#/slug=([^/?#]+)#i', $uri, $matches)) {
            return sanitize_title(rawurldecode($matches[1]));
        }

        return '';
    }
}
