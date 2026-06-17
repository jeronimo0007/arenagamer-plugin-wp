<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * ArenaGamer API Client for WordPress
 */
class ArenaGamer_API
{
    private static $instance = null;
    private $api_url;

    private function __construct()
    {
        $this->api_url = rtrim(get_option('arenagamer_api_url', 'http://localhost:8080/api/v1'), '/');
    }

    public static function instance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    // --- Auth ---
    public function login($email, $password)
    {
        return $this->post('/auth/login', ['email' => $email, 'password' => $password]);
    }

    public function register($data)
    {
        return $this->post('/auth/register', $data);
    }

    public function refresh_token($refresh_token)
    {
        return $this->post('/auth/refresh', ['refreshToken' => $refresh_token]);
    }

    // --- Tournaments ---
    public function get_tournaments($page = 0, $size = 12)
    {
        $cache_key = "arenagamer_tournaments_{$page}_{$size}";
        $cached = get_transient($cache_key);
        if ($cached !== false) {
            return $cached;
        }

        $result = $this->get("/tournaments?page={$page}&size={$size}");
        if ($result) {
            $ttl = (int) get_option('arenagamer_cache_ttl', 300);
            set_transient($cache_key, $result, $ttl);
        }
        return $result;
    }

    public function get_tournament($slug)
    {
        $cache_key = "arenagamer_tournament_{$slug}";
        $cached = get_transient($cache_key);
        if ($cached !== false) {
            return $cached;
        }

        $result = $this->get("/tournaments/{$slug}");
        if ($result) {
            set_transient($cache_key, $result, 60);
        }
        return $result;
    }

    public function get_tournament_matches($slug)
    {
        return $this->get("/tournaments/{$slug}/matches");
    }

    public function join_tournament_solo($slug, $token, $data = [])
    {
        return $this->post("/tournaments/{$slug}/participants", $data, $token);
    }

    public function join_tournament_team($slug, $token, $data)
    {
        return $this->post("/tournaments/{$slug}/participants/team", $data, $token);
    }

    // --- Presets ---
    public function get_presets()
    {
        $cached = get_transient('arenagamer_presets');
        if ($cached !== false) {
            return $cached;
        }

        $result = $this->get('/presets');
        if ($result) {
            set_transient('arenagamer_presets', $result, 3600);
        }
        return $result;
    }

    // --- Teams ---
    public function get_my_teams($token)
    {
        return $this->get('/teams/my', $token);
    }

    public function create_team($token, $data)
    {
        return $this->post('/teams', $data, $token);
    }

    // --- Wallet ---
    public function get_wallet_balance($token)
    {
        return $this->get('/wallet/balance', $token);
    }

    public function get_transactions($token, $page = 0)
    {
        return $this->get("/wallet/transactions?page={$page}&size=20", $token);
    }

    // --- User ---
    public function get_me($token)
    {
        return $this->get('/users/me', $token);
    }

    // --- HTTP Methods ---
    private function get($endpoint, $token = null)
    {
        return $this->request('GET', $endpoint, null, $token);
    }

    private function post($endpoint, $data = null, $token = null)
    {
        return $this->request('POST', $endpoint, $data, $token);
    }

    private function request($method, $endpoint, $data = null, $token = null)
    {
        $url = $this->api_url . $endpoint;

        $args = [
            'method'  => $method,
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ],
        ];

        if ($token) {
            $args['headers']['Authorization'] = 'Bearer ' . $token;
        }

        if ($data && in_array($method, ['POST', 'PUT'])) {
            $args['body'] = wp_json_encode($data);
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => $response->get_error_message(),
            ];
        }

        $body = wp_remote_retrieve_body($response);
        $decoded = json_decode($body, true);
        $code = wp_remote_retrieve_response_code($response);

        if ($code >= 400) {
            return [
                'success' => false,
                'message' => isset($decoded['message']) ? $decoded['message'] : "HTTP {$code}",
                'status'  => $code,
            ];
        }

        return $decoded;
    }

    /**
     * Clear all cached data
     */
    public function clear_cache()
    {
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_arenagamer_%'");
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_arenagamer_%'");
    }
}
