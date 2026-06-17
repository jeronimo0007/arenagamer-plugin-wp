<?php
/**
 * Plugin Name: ArenaGamer
 * Plugin URI: https://arenagamer.com
 * Description: Plugin de integração ArenaGamer - Listagem de torneios, inscrições, times, carteira e brackets no frontend WordPress.
 * Version: 1.0.0
 * Author: ArenaGamer
 * Author URI: https://arenagamer.com
 * License: GPL-2.0+
 * Text Domain: arenagamer
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ARENAGAMER_VERSION', '1.0.0');
define('ARENAGAMER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ARENAGAMER_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ARENAGAMER_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Core includes
require_once ARENAGAMER_PLUGIN_DIR . 'includes/class-arenagamer-api.php';
require_once ARENAGAMER_PLUGIN_DIR . 'includes/class-arenagamer-shortcodes.php';
require_once ARENAGAMER_PLUGIN_DIR . 'includes/class-arenagamer-auth.php';
require_once ARENAGAMER_PLUGIN_DIR . 'includes/class-arenagamer-ajax.php';

if (is_admin()) {
    require_once ARENAGAMER_PLUGIN_DIR . 'admin/class-arenagamer-admin.php';
}

/**
 * Plugin Activation
 */
register_activation_hook(__FILE__, function () {
    // Set default options
    add_option('arenagamer_api_url', 'http://localhost:8080/api/v1');
    add_option('arenagamer_cache_ttl', 300);
    add_option('arenagamer_tournaments_per_page', 12);
    add_option('arenagamer_enable_registration', '1');
    add_option('arenagamer_default_game_filter', '');

    // Flush rewrite rules
    flush_rewrite_rules();
});

/**
 * Plugin Deactivation
 */
register_deactivation_hook(__FILE__, function () {
    flush_rewrite_rules();
});

/**
 * Initialize Plugin
 */
add_action('plugins_loaded', function () {
    load_plugin_textdomain('arenagamer', false, dirname(ARENAGAMER_PLUGIN_BASENAME) . '/languages');
});

/**
 * Enqueue frontend styles and scripts
 */
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'arenagamer-frontend',
        ARENAGAMER_PLUGIN_URL . 'public/css/arenagamer-public.css',
        [],
        ARENAGAMER_VERSION
    );

    wp_enqueue_script(
        'arenagamer-frontend',
        ARENAGAMER_PLUGIN_URL . 'public/js/arenagamer-public.js',
        ['jquery'],
        ARENAGAMER_VERSION,
        true
    );

    wp_localize_script('arenagamer-frontend', 'arenagamer', [
        'ajax_url'  => admin_url('admin-ajax.php'),
        'nonce'     => wp_create_nonce('arenagamer_nonce'),
        'api_url'   => get_option('arenagamer_api_url'),
        'i18n'      => [
            'loading'     => __('Carregando...', 'arenagamer'),
            'error'       => __('Erro ao processar requisição', 'arenagamer'),
            'confirm_join' => __('Confirmar inscrição?', 'arenagamer'),
            'login_required' => __('Faça login para continuar', 'arenagamer'),
        ],
    ]);
});

/**
 * Register shortcodes
 */
add_action('init', function () {
    ArenaGamer_Shortcodes::register();
});

/**
 * Register AJAX handlers
 */
add_action('wp_ajax_arenagamer_login', ['ArenaGamer_Ajax', 'login']);
add_action('wp_ajax_nopriv_arenagamer_login', ['ArenaGamer_Ajax', 'login']);
add_action('wp_ajax_arenagamer_register', ['ArenaGamer_Ajax', 'register']);
add_action('wp_ajax_nopriv_arenagamer_register', ['ArenaGamer_Ajax', 'register']);
add_action('wp_ajax_arenagamer_join_tournament', ['ArenaGamer_Ajax', 'join_tournament']);
add_action('wp_ajax_arenagamer_get_matches', ['ArenaGamer_Ajax', 'get_matches']);
add_action('wp_ajax_nopriv_arenagamer_get_matches', ['ArenaGamer_Ajax', 'get_matches']);
add_action('wp_ajax_arenagamer_wallet_balance', ['ArenaGamer_Ajax', 'wallet_balance']);
add_action('wp_ajax_arenagamer_my_teams', ['ArenaGamer_Ajax', 'my_teams']);
add_action('wp_ajax_arenagamer_create_team', ['ArenaGamer_Ajax', 'create_team']);
