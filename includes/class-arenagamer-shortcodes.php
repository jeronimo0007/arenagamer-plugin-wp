<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * ArenaGamer Shortcodes
 *
 * [arenagamer_tournaments]          - Tournament listing grid
 * [arenagamer_tournament slug="x"]  - Single tournament detail
 * [arenagamer_login]                - Login/register form
 * [arenagamer_dashboard]            - User dashboard (wallet, teams, my tournaments)
 * [arenagamer_bracket slug="x"]     - Tournament bracket/matches
 */
class ArenaGamer_Shortcodes
{
    public static function register()
    {
        add_shortcode('arenagamer_tournaments', [__CLASS__, 'tournaments']);
        add_shortcode('arenagamer_tournament', [__CLASS__, 'tournament_detail']);
        add_shortcode('arenagamer_login', [__CLASS__, 'login_form']);
        add_shortcode('arenagamer_dashboard', [__CLASS__, 'dashboard']);
        add_shortcode('arenagamer_bracket', [__CLASS__, 'bracket']);
    }

    /**
     * [arenagamer_tournaments per_page="12" game="" columns="3"]
     */
    public static function tournaments($atts)
    {
        $atts = shortcode_atts([
            'per_page' => get_option('arenagamer_tournaments_per_page', 12),
            'game'     => '',
            'columns'  => 3,
        ], $atts);

        $page = isset($_GET['ag_page']) ? max(0, (int)$_GET['ag_page']) : 0;
        $api = ArenaGamer_API::instance();
        $response = $api->get_tournaments($page, (int)$atts['per_page']);

        ob_start();
        include ARENAGAMER_PLUGIN_DIR . 'templates/tournaments-grid.php';
        return ob_get_clean();
    }

    /**
     * [arenagamer_tournament slug="my-tournament"]
     */
    public static function tournament_detail($atts)
    {
        $atts = shortcode_atts([
            'slug' => '',
        ], $atts);

        $slug = $atts['slug'] ?: (isset($_GET['tournament']) ? sanitize_text_field($_GET['tournament']) : '');

        if (empty($slug)) {
            return '<p class="arenagamer-error">' . __('Slug do torneio não informado', 'arenagamer') . '</p>';
        }

        $api = ArenaGamer_API::instance();
        $tournament = $api->get_tournament($slug);
        $matches = $api->get_tournament_matches($slug);
        $is_logged_in = ArenaGamer_Auth::is_logged_in();
        $user = ArenaGamer_Auth::get_user();

        ob_start();
        include ARENAGAMER_PLUGIN_DIR . 'templates/tournament-detail.php';
        return ob_get_clean();
    }

    /**
     * [arenagamer_login]
     */
    public static function login_form($atts)
    {
        if (ArenaGamer_Auth::is_logged_in()) {
            $user = ArenaGamer_Auth::get_user();
            ob_start();
            include ARENAGAMER_PLUGIN_DIR . 'templates/user-info.php';
            return ob_get_clean();
        }

        ob_start();
        include ARENAGAMER_PLUGIN_DIR . 'templates/login-form.php';
        return ob_get_clean();
    }

    /**
     * [arenagamer_dashboard]
     */
    public static function dashboard($atts)
    {
        if (!ArenaGamer_Auth::is_logged_in()) {
            return '<div class="arenagamer-notice">' .
                __('Faça login para acessar seu painel.', 'arenagamer') .
                ' [arenagamer_login]</div>';
        }

        $token = ArenaGamer_Auth::get_token();
        $user = ArenaGamer_Auth::get_user();
        $api = ArenaGamer_API::instance();
        $wallet = $api->get_wallet_balance($token);
        $teams = $api->get_my_teams($token);

        ob_start();
        include ARENAGAMER_PLUGIN_DIR . 'templates/dashboard.php';
        return ob_get_clean();
    }

    /**
     * [arenagamer_bracket slug="my-tournament"]
     */
    public static function bracket($atts)
    {
        $atts = shortcode_atts([
            'slug' => '',
        ], $atts);

        $slug = $atts['slug'] ?: (isset($_GET['tournament']) ? sanitize_text_field($_GET['tournament']) : '');
        if (empty($slug)) {
            return '<p class="arenagamer-error">' . __('Slug do torneio não informado', 'arenagamer') . '</p>';
        }

        $api = ArenaGamer_API::instance();
        $matches = $api->get_tournament_matches($slug);

        ob_start();
        include ARENAGAMER_PLUGIN_DIR . 'templates/bracket.php';
        return ob_get_clean();
    }
}
