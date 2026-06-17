<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles ArenaGamer user authentication via JWT tokens stored in session/cookies
 */
class ArenaGamer_Auth
{
    const TOKEN_KEY = 'arenagamer_token';
    const REFRESH_KEY = 'arenagamer_refresh_token';
    const USER_KEY = 'arenagamer_user';

    /**
     * Store auth tokens after login/register
     */
    public static function store_auth($auth_data)
    {
        if (!session_id()) {
            session_start();
        }

        $_SESSION[self::TOKEN_KEY] = $auth_data['accessToken'];
        $_SESSION[self::REFRESH_KEY] = $auth_data['refreshToken'];

        if (isset($auth_data['user'])) {
            $_SESSION[self::USER_KEY] = $auth_data['user'];
        }
    }

    /**
     * Get current access token
     */
    public static function get_token()
    {
        if (!session_id()) {
            session_start();
        }

        $token = isset($_SESSION[self::TOKEN_KEY]) ? $_SESSION[self::TOKEN_KEY] : null;

        if (!$token) {
            return null;
        }

        // Check if token is expired (basic JWT decode)
        $parts = explode('.', $token);
        if (count($parts) === 3) {
            $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
            if ($payload && isset($payload['exp']) && $payload['exp'] < time()) {
                // Token expired, try refresh
                return self::try_refresh();
            }
        }

        return $token;
    }

    /**
     * Get current user data
     */
    public static function get_user()
    {
        if (!session_id()) {
            session_start();
        }
        return isset($_SESSION[self::USER_KEY]) ? $_SESSION[self::USER_KEY] : null;
    }

    /**
     * Check if user is logged in
     */
    public static function is_logged_in()
    {
        return self::get_token() !== null;
    }

    /**
     * Logout
     */
    public static function logout()
    {
        if (!session_id()) {
            session_start();
        }

        unset($_SESSION[self::TOKEN_KEY]);
        unset($_SESSION[self::REFRESH_KEY]);
        unset($_SESSION[self::USER_KEY]);
    }

    /**
     * Try to refresh the token
     */
    private static function try_refresh()
    {
        if (!session_id()) {
            session_start();
        }

        $refresh = isset($_SESSION[self::REFRESH_KEY]) ? $_SESSION[self::REFRESH_KEY] : null;
        if (!$refresh) {
            self::logout();
            return null;
        }

        $api = ArenaGamer_API::instance();
        $result = $api->refresh_token($refresh);

        if ($result && isset($result['data']['accessToken'])) {
            self::store_auth($result['data']);
            return $result['data']['accessToken'];
        }

        self::logout();
        return null;
    }
}

// Start session early
add_action('init', function () {
    if (!session_id() && !headers_sent()) {
        session_start();
    }
}, 1);
