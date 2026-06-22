<?php

if (!defined('ABSPATH')) {
    exit;
}

class AG_Settings {

    private const OPTION_KEY = 'arenagamer_cliente_settings';

    public static function init(): void {
        add_action('admin_menu', [self::class, 'add_menu']);
        add_action('admin_init', [self::class, 'register_settings']);
    }

    public static function get(): array {
        $defaults = [
            'api_url'       => 'http://localhost:8080',
            'catalog_email' => '',
            'catalog_pass'  => '',
            'login_url'     => '',
            'home_url'      => '',
            'dashboard_url'   => '',
            'tournament_url'  => '',
            'torneios_url'    => '',
            'participando_url'=> '',
            'carteira_url'    => '',
            'credit_packages' => "10\n25\n50\n100",
        ];

        $saved = get_option(self::OPTION_KEY, []);
        $parsed = wp_parse_args(is_array($saved) ? $saved : [], $defaults);

        if (!empty($parsed['tournament_url'])) {
            $parsed['tournament_url'] = AG_Rewrites::normalize_tournament_page_url($parsed['tournament_url']);
        }

        return $parsed;
    }

    public static function add_menu(): void {
        add_options_page(
            'ArenaGamer Cliente',
            'ArenaGamer Cliente',
            'manage_options',
            'arenagamer-cliente',
            [self::class, 'render_page']
        );
    }

    public static function register_settings(): void {
        register_setting('arenagamer_cliente_group', self::OPTION_KEY, [
            'type'              => 'array',
            'sanitize_callback' => [self::class, 'sanitize'],
        ]);
    }

    public static function sanitize($input): array {
        return [
            'api_url'         => esc_url_raw(rtrim($input['api_url'] ?? '', '/')),
            'catalog_email'   => sanitize_email($input['catalog_email'] ?? ''),
            'catalog_pass'    => sanitize_text_field($input['catalog_pass'] ?? ''),
            'login_url'       => esc_url_raw($input['login_url'] ?? ''),
            'home_url'        => esc_url_raw($input['home_url'] ?? ''),
            'dashboard_url'   => esc_url_raw($input['dashboard_url'] ?? ''),
            'tournament_url'  => AG_Rewrites::normalize_tournament_page_url($input['tournament_url'] ?? ''),
            'torneios_url'    => esc_url_raw($input['torneios_url'] ?? ''),
            'participando_url'=> esc_url_raw($input['participando_url'] ?? ''),
            'carteira_url'    => esc_url_raw($input['carteira_url'] ?? ''),
            'credit_packages' => sanitize_textarea_field($input['credit_packages'] ?? ''),
        ];
    }

    public static function render_page(): void {
        if (!current_user_can('manage_options')) {
            return;
        }

        $settings = self::get();
        ?>
        <div class="wrap">
            <h1>ArenaGamer Cliente — Configurações</h1>
            <form method="post" action="options.php">
                <?php settings_fields('arenagamer_cliente_group'); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="ag_api_url">URL da API</label></th>
                        <td>
                            <input type="url" id="ag_api_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[api_url]"
                                   value="<?php echo esc_attr($settings['api_url']); ?>" class="regular-text" required>
                            <p class="description">Ex.: http://localhost:8080 ou https://api.seudominio.com</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_catalog_email">E-mail (catálogo público)</label></th>
                        <td>
                            <input type="email" id="ag_catalog_email" name="<?php echo esc_attr(self::OPTION_KEY); ?>[catalog_email]"
                                   value="<?php echo esc_attr($settings['catalog_email']); ?>" class="regular-text">
                            <p class="description">Credencial HTTP Basic para listar torneios públicos (GET /api/v1/public/tournaments).</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_catalog_pass">Senha (catálogo público)</label></th>
                        <td>
                            <input type="password" id="ag_catalog_pass" name="<?php echo esc_attr(self::OPTION_KEY); ?>[catalog_pass]"
                                   value="<?php echo esc_attr($settings['catalog_pass']); ?>" class="regular-text" autocomplete="new-password">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_login_url">URL da página de login</label></th>
                        <td>
                            <input type="url" id="ag_login_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[login_url]"
                                   value="<?php echo esc_attr($settings['login_url']); ?>" class="regular-text">
                            <p class="description">Redirecionamento quando o usuário não estiver autenticado.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_home_url">URL da área do cliente</label></th>
                        <td>
                            <input type="url" id="ag_home_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[home_url]"
                                   value="<?php echo esc_attr($settings['home_url']); ?>" class="regular-text">
                            <p class="description">Para onde ir após login/cadastro. Ex.: http://localhost/wordpress/area-cliente/</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_tournament_url">URL da página de detalhe do torneio</label></th>
                        <td>
                            <input type="url" id="ag_tournament_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[tournament_url]"
                                   value="<?php echo esc_attr($settings['tournament_url']); ?>" class="regular-text">
                            <p class="description">Página com <code>[arenagamer_torneio]</code>. Ex.: http://localhost/wordpress/detalhes-toneio/ — links: <code>/detalhes-toneio/slug=nome</code>. Após alterar, salve em <strong>Configurações → Links permanentes</strong>.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_torneios_url">URL — Torneios</label></th>
                        <td>
                            <input type="url" id="ag_torneios_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[torneios_url]"
                                   value="<?php echo esc_attr($settings['torneios_url']); ?>" class="regular-text">
                            <p class="description">Atalho do painel. Ex.: http://localhost/wordpress/torneios/</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_participando_url">URL — Participando</label></th>
                        <td>
                            <input type="url" id="ag_participando_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[participando_url]"
                                   value="<?php echo esc_attr($settings['participando_url']); ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_carteira_url">URL — Carteira</label></th>
                        <td>
                            <input type="url" id="ag_carteira_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[carteira_url]"
                                   value="<?php echo esc_attr($settings['carteira_url']); ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_credit_packages">Pacotes de créditos</label></th>
                        <td>
                            <textarea id="ag_credit_packages" name="<?php echo esc_attr(self::OPTION_KEY); ?>[credit_packages]"
                                      rows="5" class="large-text"><?php echo esc_textarea($settings['credit_packages']); ?></textarea>
                            <p class="description">Um valor por linha (ex.: 10, 25, 50). Usado na página de compra de créditos.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>

            <hr>
            <h2>Shortcodes disponíveis</h2>
            <p>Insira em qualquer página ou post do WordPress:</p>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>Shortcode principal</th>
                        <th>Alternativa</th>
                        <th>Outros</th>
                        <th>Descrição</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach (AG_Shortcodes::get_catalog() as $item) : ?>
                    <tr>
                        <td><code><?php echo esc_html($item['primary']); ?></code></td>
                        <td><code><?php echo esc_html($item['alt']); ?></code></td>
                        <td><?php echo $item['extra'] !== '' ? '<code>' . esc_html($item['extra']) . '</code>' : '—'; ?></td>
                        <td><?php echo esc_html($item['desc']); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }
}
