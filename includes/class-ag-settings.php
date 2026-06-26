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
            'auth_url'         => 'https://auth.omnyarena.com',
            'public_url'       => 'https://public.omnyarena.com',
            'common_url'       => 'https://common.omnyarena.com',
            'admin_url'        => 'https://admin.omnyarena.com',
            'catalog_email'    => '',
            'catalog_pass'     => '',
            'login_url'        => '',
            'cadastro_url'     => '',
            'home_url'         => '',
            'dashboard_url'    => '',
            'tournament_url'   => '',
            'torneios_url'     => '',
            'participando_url' => '',
            'carteira_url'     => '',
            'credit_packages'  => "10\n25\n50\n100",
        ];

        $saved = get_option(self::OPTION_KEY, []);
        $parsed = wp_parse_args(is_array($saved) ? $saved : [], $defaults);
        $parsed = AG_Pages::apply_url_defaults($parsed);

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
            'auth_url'        => esc_url_raw(rtrim($input['auth_url'] ?? '', '/')),
            'public_url'      => esc_url_raw(rtrim($input['public_url'] ?? '', '/')),
            'common_url'      => esc_url_raw(rtrim($input['common_url'] ?? '', '/')),
            'admin_url'       => esc_url_raw(rtrim($input['admin_url'] ?? '', '/')),
            'catalog_email'   => sanitize_email($input['catalog_email'] ?? ''),
            'catalog_pass'    => sanitize_text_field($input['catalog_pass'] ?? ''),
            'login_url'        => esc_url_raw($input['login_url'] ?? ''),
            'cadastro_url'     => esc_url_raw($input['cadastro_url'] ?? ''),
            'home_url'         => esc_url_raw($input['home_url'] ?? ''),
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
                        <th colspan="2"><h2 style="margin:0;">Microsserviços (URLs base)</h2>
                            <p class="description" style="font-weight:normal;">A API foi dividida em serviços independentes, cada um com seu próprio domínio. O plugin roteia cada requisição automaticamente para o serviço correto conforme o caminho.</p>
                        </th>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_auth_url">URL — Auth</label></th>
                        <td>
                            <input type="url" id="ag_auth_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[auth_url]"
                                   value="<?php echo esc_attr($settings['auth_url']); ?>" class="regular-text" required>
                            <p class="description">Autenticação, sessão e perfil do usuário: <code>/api/v1/public/auth/*</code>, <code>/api/v1/common/auth/*</code>, <code>/api/v1/common/users/*</code>.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_public_url">URL — Public</label></th>
                        <td>
                            <input type="url" id="ag_public_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[public_url]"
                                   value="<?php echo esc_attr($settings['public_url']); ?>" class="regular-text" required>
                            <p class="description">Catálogo público (HTTP Basic Auth): <code>/api/v1/public/*</code> (exceto <code>/auth</code>).</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_common_url">URL — Common</label></th>
                        <td>
                            <input type="url" id="ag_common_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[common_url]"
                                   value="<?php echo esc_attr($settings['common_url']); ?>" class="regular-text" required>
                            <p class="description">Torneios, times, carteira, jogadores, presets, assinaturas: <code>/api/v1/common/*</code> (exceto <code>/auth</code> e <code>/users</code>).</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_admin_url">URL — Admin</label></th>
                        <td>
                            <input type="url" id="ag_admin_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[admin_url]"
                                   value="<?php echo esc_attr($settings['admin_url']); ?>" class="regular-text">
                            <p class="description">Operações administrativas: <code>/api/v1/admin/*</code>.</p>
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
                            <p class="description">Opcional se existir página <strong>Login</strong> com <code>[pagina_login]</code>. Redirecionamento quando o usuário não estiver autenticado.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_cadastro_url">URL da página de cadastro</label></th>
                        <td>
                            <input type="url" id="ag_cadastro_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[cadastro_url]"
                                   value="<?php echo esc_attr($settings['cadastro_url']); ?>" class="regular-text">
                            <p class="description">Opcional se existir página <strong>Cadastro</strong> com <code>[pagina_cadastro]</code>.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_home_url">URL da área do cliente</label></th>
                        <td>
                            <input type="url" id="ag_home_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[home_url]"
                                   value="<?php echo esc_attr($settings['home_url']); ?>" class="regular-text">
                            <p class="description">Opcional se existir página <strong>Painel do Jogador</strong> (<code>painel-jogador</code>) com <code>[pagina_painel]</code>. Para onde ir após login/cadastro.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_tournament_url">URL da página de detalhe do torneio</label></th>
                        <td>
                            <input type="url" id="ag_tournament_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[tournament_url]"
                                   value="<?php echo esc_attr($settings['tournament_url']); ?>" class="regular-text">
                            <p class="description">Opcional se existir página <strong>Detalhes do Torneio</strong> com <code>[pagina_torneio]</code>. Links: <code>/detalhes-torneio/slug=nome</code>. Após alterar, salve em <strong>Configurações → Links permanentes</strong>.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_torneios_url">URL — Torneios</label></th>
                        <td>
                            <input type="url" id="ag_torneios_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[torneios_url]"
                                   value="<?php echo esc_attr($settings['torneios_url']); ?>" class="regular-text">
                            <p class="description">Opcional se existir página <strong>Descobrir Torneios</strong> (<code>descobrir-torneios</code>) com <code>[pagina_torneios]</code>.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_participando_url">URL — Participando</label></th>
                        <td>
                            <input type="url" id="ag_participando_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[participando_url]"
                                   value="<?php echo esc_attr($settings['participando_url']); ?>" class="regular-text">
                            <p class="description">Opcional se existir página <strong>Participando</strong> com <code>[pagina_participando]</code>.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ag_carteira_url">URL — Carteira</label></th>
                        <td>
                            <input type="url" id="ag_carteira_url" name="<?php echo esc_attr(self::OPTION_KEY); ?>[carteira_url]"
                                   value="<?php echo esc_attr($settings['carteira_url']); ?>" class="regular-text">
                            <p class="description">Opcional se existir página <strong>Carteira</strong> com <code>[pagina_creditos]</code>.</p>
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
            <h2>Padrão de páginas no WordPress</h2>
            <p>Crie páginas com estes <strong>títulos</strong> e insira o shortcode indicado. O plugin encontra as URLs automaticamente (as URLs acima são opcionais e servem como override).</p>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>Título da página</th>
                        <th>Shortcode</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach (AG_Pages::setup_guide() as $page) : ?>
                    <tr>
                        <td><strong><?php echo esc_html($page['title']); ?></strong> <code>(slug: <?php echo esc_html($page['slug']); ?>)</code></td>
                        <td><code><?php echo esc_html($page['shortcode']); ?></code></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>

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
