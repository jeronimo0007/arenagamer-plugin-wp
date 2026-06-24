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
        $vars[] = 'ag_player_id';
        $vars[] = 'ag_team_id';
        return $vars;
    }

    public static function register(): void {
        self::register_entity_rules(
            self::detail_page_slug(),
            'ag_slug',
            'slug'
        );

        self::register_entity_rules(
            self::player_page_slug(),
            'ag_player_id',
            'id',
            true
        );

        self::register_entity_rules(
            self::team_page_slug(),
            'ag_team_id',
            'id',
            true
        );
    }

    private static function register_entity_rules(
        string $page_slug,
        string $query_var,
        string $url_key,
        bool $numeric = false
    ): void {
        if ($page_slug === '') {
            return;
        }

        $quoted = preg_quote($page_slug, '/');
        $pattern = $numeric ? '([0-9]+)' : '([^/]+)';

        add_rewrite_rule(
            '^' . $quoted . '/' . $url_key . '=([^/]+)/?$',
            'index.php?pagename=' . $page_slug . '&' . $query_var . '=$matches[1]',
            'top'
        );

        add_rewrite_rule(
            '^' . $quoted . '/' . $pattern . '/?$',
            'index.php?pagename=' . $page_slug . '&' . $query_var . '=$matches[1]',
            'top'
        );
    }

    public static function detail_page_slug(): string {
        $settings = AG_Settings::get();
        $url = self::normalize_tournament_page_url($settings['tournament_url'] ?? '');
        return self::page_slug_from_url($url);
    }

    public static function player_page_slug(): string {
        $slug = self::page_slug_from_url(AG_Pages::get_url('jogador'));
        return $slug !== '' ? $slug : AG_Pages::default_slug('jogador');
    }

    public static function team_page_slug(): string {
        $slug = self::page_slug_from_url(AG_Pages::get_url('time'));
        return $slug !== '' ? $slug : AG_Pages::default_slug('time');
    }

    private static function page_slug_from_url(string $url): string {
        $url = trim($url);
        if ($url === '') {
            return '';
        }

        $path = wp_parse_url($url, PHP_URL_PATH);
        if (!is_string($path) || $path === '') {
            return '';
        }

        $relative = self::strip_home_path($path);
        $segments = array_values(array_filter(explode('/', $relative)));

        while (!empty($segments) && preg_match('/^(slug|id)=?$/i', (string) end($segments))) {
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
        return self::resolve_request_var('ag_slug', 'slug', false);
    }

    public static function resolve_player_id_from_request(): string {
        return self::resolve_request_var('ag_player_id', 'id', true, self::player_page_slug());
    }

    public static function resolve_team_id_from_request(): string {
        $id = self::resolve_request_var('ag_team_id', 'id', true, self::team_page_slug());
        if ($id !== '') {
            return $id;
        }

        return self::resolve_numeric_id_from_uri(
            wp_unslash($_SERVER['REQUEST_URI'] ?? ''),
            self::team_slug_candidates()
        );
    }

    /** @return string[] */
    private static function team_slug_candidates(): array {
        $candidates = [
            self::team_page_slug(),
            AG_Pages::default_slug('time'),
            'detalhes-time',
        ];

        return array_values(array_unique(array_filter($candidates)));
    }

    private static function resolve_numeric_id_from_uri(string $uri, array $slug_candidates): string {
        foreach ($slug_candidates as $slug) {
            if ($slug === '') {
                continue;
            }
            if (preg_match('~/' . preg_quote($slug, '~') . '/([0-9]+)(?:/|$|[?#])~', $uri, $matches)) {
                return $matches[1];
            }
        }

        return '';
    }

    private static function resolve_request_var(
        string $query_var,
        string $url_key,
        bool $numeric,
        string $page_slug_for_path = ''
    ): string {
        $value = get_query_var($query_var);
        if (is_string($value) && $value !== '') {
            return $numeric ? preg_replace('/\D/', '', $value) : sanitize_title(rawurldecode($value));
        }

        if (!empty($_GET[$url_key])) {
            $raw = wp_unslash($_GET[$url_key]);
            return $numeric ? preg_replace('/\D/', '', (string) $raw) : sanitize_title((string) $raw);
        }

        $uri = wp_unslash($_SERVER['REQUEST_URI'] ?? '');
        if (preg_match('~/' . preg_quote($url_key, '~') . '=([^/?#]+)~i', $uri, $matches)) {
            $raw = rawurldecode($matches[1]);
            return $numeric ? preg_replace('/\D/', '', $raw) : sanitize_title($raw);
        }

        if ($numeric) {
            $slug_candidates = $page_slug_for_path !== ''
                ? [$page_slug_for_path]
                : [];
            $id = self::resolve_numeric_id_from_uri($uri, $slug_candidates);
            if ($id !== '') {
                return $id;
            }
        }

        return '';
    }
}
