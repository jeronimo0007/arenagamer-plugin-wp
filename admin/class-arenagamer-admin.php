<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * ArenaGamer Admin Settings Page
 */
class ArenaGamer_Admin
{
    public function __construct()
    {
        add_action('admin_menu', [$this, 'add_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
    }

    public function add_menu()
    {
        add_options_page(
            'ArenaGamer',
            'ArenaGamer',
            'manage_options',
            'arenagamer-settings',
            [$this, 'render_settings_page']
        );
    }

    public function register_settings()
    {
        register_setting('arenagamer_settings', 'arenagamer_api_url', [
            'sanitize_callback' => 'esc_url_raw',
            'default'           => 'http://localhost:8080/api/v1',
        ]);
        register_setting('arenagamer_settings', 'arenagamer_cache_ttl', [
            'sanitize_callback' => 'absint',
            'default'           => 300,
        ]);
        register_setting('arenagamer_settings', 'arenagamer_tournaments_per_page', [
            'sanitize_callback' => 'absint',
            'default'           => 12,
        ]);
        register_setting('arenagamer_settings', 'arenagamer_enable_registration', [
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => '1',
        ]);
        register_setting('arenagamer_settings', 'arenagamer_default_game_filter', [
            'sanitize_callback' => 'sanitize_text_field',
            'default'           => '',
        ]);
    }

    public function enqueue_admin_assets($hook)
    {
        if ($hook !== 'settings_page_arenagamer-settings') {
            return;
        }
        wp_enqueue_style('arenagamer-admin', ARENAGAMER_PLUGIN_URL . 'admin/css/arenagamer-admin.css', [], ARENAGAMER_VERSION);
    }

    public function render_settings_page()
    {
        ?>
        <div class="wrap">
            <h1><span class="dashicons dashicons-games"></span> ArenaGamer - Configurações</h1>

            <form method="post" action="options.php">
                <?php settings_fields('arenagamer_settings'); ?>

                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="arenagamer_api_url">URL da API</label></th>
                        <td>
                            <input type="url" id="arenagamer_api_url" name="arenagamer_api_url"
                                   value="<?php echo esc_attr(get_option('arenagamer_api_url')); ?>"
                                   class="regular-text" placeholder="http://localhost:8080/api/v1">
                            <p class="description">URL base da ArenaGamer API (sem trailing slash)</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="arenagamer_cache_ttl">Cache (segundos)</label></th>
                        <td>
                            <input type="number" id="arenagamer_cache_ttl" name="arenagamer_cache_ttl"
                                   value="<?php echo esc_attr(get_option('arenagamer_cache_ttl', 300)); ?>"
                                   class="small-text" min="0" max="86400">
                            <p class="description">Tempo de cache para listagens de torneios. 0 = sem cache.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="arenagamer_tournaments_per_page">Torneios por Página</label></th>
                        <td>
                            <input type="number" id="arenagamer_tournaments_per_page" name="arenagamer_tournaments_per_page"
                                   value="<?php echo esc_attr(get_option('arenagamer_tournaments_per_page', 12)); ?>"
                                   class="small-text" min="1" max="100">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Registro de Usuários</th>
                        <td>
                            <label>
                                <input type="checkbox" name="arenagamer_enable_registration" value="1"
                                    <?php checked(get_option('arenagamer_enable_registration'), '1'); ?>>
                                Permitir registro via frontend
                            </label>
                        </td>
                    </tr>
                </table>

                <?php submit_button('Salvar Configurações'); ?>
            </form>

            <hr>

            <h2>Shortcodes Disponíveis</h2>
            <table class="widefat">
                <thead>
                    <tr>
                        <th>Shortcode</th>
                        <th>Descrição</th>
                        <th>Parâmetros</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>[arenagamer_tournaments]</code></td>
                        <td>Grid de torneios disponíveis</td>
                        <td><code>per_page="12" columns="3" game=""</code></td>
                    </tr>
                    <tr>
                        <td><code>[arenagamer_tournament slug="x"]</code></td>
                        <td>Detalhes de um torneio específico</td>
                        <td><code>slug=""</code> (ou via <code>?tournament=slug</code>)</td>
                    </tr>
                    <tr>
                        <td><code>[arenagamer_bracket slug="x"]</code></td>
                        <td>Visualização do bracket/chaves</td>
                        <td><code>slug=""</code></td>
                    </tr>
                    <tr>
                        <td><code>[arenagamer_login]</code></td>
                        <td>Formulário de login/registro</td>
                        <td>—</td>
                    </tr>
                    <tr>
                        <td><code>[arenagamer_dashboard]</code></td>
                        <td>Painel do jogador (carteira, times)</td>
                        <td>—</td>
                    </tr>
                </tbody>
            </table>

            <hr>

            <h2>Teste de Conexão</h2>
            <button id="ag-admin-test" class="button button-secondary">Testar API</button>
            <span id="ag-admin-test-result"></span>

            <script>
            jQuery('#ag-admin-test').on('click', function() {
                var btn = jQuery(this);
                var result = jQuery('#ag-admin-test-result');
                btn.prop('disabled', true);
                result.html(' Testando...');

                jQuery.get('<?php echo esc_url(get_option('arenagamer_api_url')); ?>/presets')
                    .done(function() {
                        result.html(' <span style="color:green;">API acessível!</span>');
                    })
                    .fail(function(xhr) {
                        result.html(' <span style="color:red;">Erro: HTTP ' + xhr.status + '</span>');
                    })
                    .always(function() {
                        btn.prop('disabled', false);
                    });
            });
            </script>
        </div>
        <?php
    }
}

new ArenaGamer_Admin();
