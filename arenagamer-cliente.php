<?php
/**
 * Plugin Name: ArenaGamer Cliente
 * Plugin URI:  https://arenagamer.com
 * Description: Frontend para clientes ArenaGamer — login, torneios, inscrições, créditos e partidas via API.
 * Version:     1.13.0
 * Author:      ArenaGamer
 * Text Domain: arenagamer-cliente
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('AG_CLIENTE_VERSION', '1.19.0');
define('AG_CLIENTE_PATH', plugin_dir_path(__FILE__));
define('AG_CLIENTE_URL', plugin_dir_url(__FILE__));

require_once AG_CLIENTE_PATH . 'includes/class-ag-rewrites.php';
require_once AG_CLIENTE_PATH . 'includes/class-ag-pages.php';
require_once AG_CLIENTE_PATH . 'includes/class-ag-theme.php';
require_once AG_CLIENTE_PATH . 'includes/class-ag-settings.php';
require_once AG_CLIENTE_PATH . 'includes/class-ag-api-proxy.php';
require_once AG_CLIENTE_PATH . 'includes/class-ag-media-upload.php';
require_once AG_CLIENTE_PATH . 'includes/class-ag-assets.php';
require_once AG_CLIENTE_PATH . 'includes/class-ag-shortcodes.php';

final class ArenaGamer_Cliente_Plugin {

    public static function init(): void {
        AG_Settings::init();
        AG_Api_Proxy::init();
        AG_Media_Upload::init();
        AG_Assets::init();
        AG_Shortcodes::init();
        AG_Rewrites::init();
        AG_Pages::init();
        AG_Theme::init();
    }
}

ArenaGamer_Cliente_Plugin::init();

register_activation_hook(__FILE__, static function (): void {
    update_option('ag_cliente_version', AG_CLIENTE_VERSION);
    AG_Rewrites::flush();
});

add_action('init', static function (): void {
    $stored = get_option('ag_cliente_version', '');
    if ($stored === AG_CLIENTE_VERSION) {
        return;
    }
    update_option('ag_cliente_version', AG_CLIENTE_VERSION);
    AG_Rewrites::flush();
}, 20);
