<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Resolve URLs das páginas do ArenaGamer pelo título (e slug) no WordPress.
 *
 * Crie páginas com estes títulos e insira o shortcode correspondente:
 *
 * | Título WP              | Shortcode principal        |
 * |------------------------|----------------------------|
 * | Login                  | [pagina login]             |
 * | Cadastro               | [pagina cadastro]          |
 * | Painel do Jogador      | [pagina painel]            |
 * | Área do Cliente        | [pagina menu]              |
 * | Descobrir Torneios     | [pagina torneios]          |
 * | Participando           | [pagina participando]      |
 * | Carteira               | [pagina creditos]          |
 * | Times                  | [pagina times]             |
 * | Perfil                 | [pagina perfil]            |
 * | Perfil do Jogador      | [pagina jogador]           |
 * | Detalhes do Time       | [pagina time]              |
 * | Detalhes do Torneio    | [pagina torneio]           |
 */
class AG_Pages {

    /** @var array<string, array{titles: string[], slugs: string[]}> */
    private const REGISTRY = [
        'login'            => ['titles' => ['Login'],                         'slugs' => ['login']],
        'cadastro'         => ['titles' => ['Cadastro'],                      'slugs' => ['cadastro']],
        'painel'           => ['titles' => ['Painel do Jogador', 'Painel'],   'slugs' => ['painel-jogador', 'painel']],
        'dashboard'        => ['titles' => ['Painel do Jogador', 'Painel'],   'slugs' => ['painel-jogador', 'painel']],
        'home'             => ['titles' => ['Área do Cliente', 'Menu'],      'slugs' => ['area-cliente', 'menu']],
        'menu'             => ['titles' => ['Área do Cliente', 'Menu'],      'slugs' => ['area-cliente', 'menu']],
        'torneios'         => ['titles' => ['Descobrir Torneios', 'Torneios'], 'slugs' => ['descobrir-torneios', 'torneios']],
        'participando'     => ['titles' => ['Participando'],                  'slugs' => ['participando']],
        'meus-torneios'    => ['titles' => ['Participando'],                  'slugs' => ['participando']],
        'partidas'         => ['titles' => ['Participando'],                  'slugs' => ['participando']],
        'creditos'         => ['titles' => ['Carteira'],                      'slugs' => ['carteira']],
        'comprar-creditos' => ['titles' => ['Carteira'],                      'slugs' => ['carteira']],
        'carteira'         => ['titles' => ['Carteira'],                      'slugs' => ['carteira']],
        'times'            => ['titles' => ['Times'],                         'slugs' => ['times']],
        'perfil'           => ['titles' => ['Perfil'],                        'slugs' => ['perfil']],
        'jogador'          => ['titles' => ['Perfil do Jogador', 'Jogador'], 'slugs' => ['jogador', 'perfil-jogador']],
        'time'             => ['titles' => ['Detalhes do Time', 'Time'],       'slugs' => ['time', 'detalhes-time']],
        'torneio'          => ['titles' => ['Detalhes do Torneio'],            'slugs' => ['detalhes-torneio']],
        'criar-torneio'    => ['titles' => ['Criar Torneio'],                  'slugs' => ['criar-torneio']],
    ];

    /** @var array<string, string> */
    private static array $resolved = [];

    /** @return array<int, array{title: string, slug: string, shortcode: string}> */
    public static function setup_guide(): array {
        return [
            ['title' => 'Login',               'slug' => 'login',            'shortcode' => '[pagina login]'],
            ['title' => 'Cadastro',            'slug' => 'cadastro',         'shortcode' => '[pagina cadastro]'],
            ['title' => 'Painel do Jogador',   'slug' => 'painel-jogador',   'shortcode' => '[pagina painel]'],
            ['title' => 'Área do Cliente',     'slug' => 'area-cliente',     'shortcode' => '[pagina menu]'],
            ['title' => 'Descobrir Torneios',  'slug' => 'descobrir-torneios', 'shortcode' => '[pagina torneios]'],
            ['title' => 'Participando',        'slug' => 'participando',     'shortcode' => '[pagina participando]'],
            ['title' => 'Carteira',            'slug' => 'carteira',         'shortcode' => '[pagina creditos]'],
            ['title' => 'Times',               'slug' => 'times',            'shortcode' => '[pagina times]'],
            ['title' => 'Perfil',              'slug' => 'perfil',           'shortcode' => '[pagina perfil]'],
            ['title' => 'Perfil do Jogador',   'slug' => 'jogador',          'shortcode' => '[pagina jogador]'],
            ['title' => 'Detalhes do Time',    'slug' => 'time',             'shortcode' => '[pagina time]'],
            ['title' => 'Detalhes do Torneio', 'slug' => 'detalhes-torneio', 'shortcode' => '[pagina torneio]'],
            ['title' => 'Criar Torneio',       'slug' => 'criar-torneio',    'shortcode' => '[pagina criar torneio]'],
        ];
    }

    public static function resolved_url(string $key): string {
        $settings = AG_Settings::get();
        $overrides = [
            'login'            => $settings['login_url'] ?? '',
            'cadastro'         => $settings['cadastro_url'] ?? '',
            'home'             => $settings['home_url'] ?? '',
            'menu'             => $settings['home_url'] ?? '',
            'dashboard'        => $settings['dashboard_url'] ?? '',
            'painel'           => $settings['dashboard_url'] ?? '',
            'torneio'          => $settings['tournament_url'] ?? '',
            'torneios'         => $settings['torneios_url'] ?? '',
            'participando'     => $settings['participando_url'] ?? '',
            'meus-torneios'    => $settings['participando_url'] ?? '',
            'partidas'         => $settings['participando_url'] ?? '',
            'creditos'         => $settings['carteira_url'] ?? '',
            'comprar-creditos' => $settings['carteira_url'] ?? '',
            'carteira'         => $settings['carteira_url'] ?? '',
        ];

        return self::get_url($key, $overrides[$key] ?? '');
    }

    /** @return array<string, array{titles: string[], slugs: string[]}> */
    public static function registry(): array {
        return self::REGISTRY;
    }

    public static function default_slug(string $key): string {
        $slugs = self::REGISTRY[$key]['slugs'] ?? [];
        return is_array($slugs) && isset($slugs[0]) ? (string) $slugs[0] : '';
    }

    public static function get_url(string $key, string $manual_override = ''): string {
        $manual = trim($manual_override);
        if ($manual !== '') {
            return $manual;
        }

        if (isset(self::$resolved[$key])) {
            return self::$resolved[$key];
        }

        $meta = self::REGISTRY[$key] ?? null;
        if ($meta === null) {
            self::$resolved[$key] = '';
            return '';
        }

        $page = self::find_page($meta['slugs'], $meta['titles']);
        self::$resolved[$key] = ($page instanceof WP_Post)
            ? (string) get_permalink($page)
            : '';

        return self::$resolved[$key];
    }

    /**
     * URLs para o frontend (manual nas configurações tem prioridade sobre título WP).
     *
     * @param array<string, string> $settings
     * @return array<string, string>
     */
    public static function urls_for_frontend(array $settings): array {
        $manual = [
            'login'            => $settings['login_url'] ?? '',
            'cadastro'         => $settings['cadastro_url'] ?? '',
            'home'             => $settings['home_url'] ?? '',
            'menu'             => $settings['home_url'] ?? '',
            'dashboard'        => $settings['dashboard_url'] ?? '',
            'painel'           => $settings['dashboard_url'] ?? '',
            'torneio'          => $settings['tournament_url'] ?? '',
            'torneios'         => $settings['torneios_url'] ?? '',
            'participando'     => $settings['participando_url'] ?? '',
            'meus-torneios'    => $settings['participando_url'] ?? '',
            'partidas'         => $settings['participando_url'] ?? '',
            'creditos'         => $settings['carteira_url'] ?? '',
            'comprar-creditos' => $settings['carteira_url'] ?? '',
            'carteira'         => $settings['carteira_url'] ?? '',
        ];

        $urls = [];
        foreach (self::REGISTRY as $key => $_meta) {
            $override = $manual[$key] ?? '';
            $urls[$key] = self::get_url($key, $override);
        }

        if ($urls['dashboard'] === '' && $urls['home'] !== '') {
            $urls['dashboard'] = $urls['home'];
            $urls['painel'] = $urls['home'];
        }

        if ($urls['home'] === '' && $urls['dashboard'] !== '') {
            $urls['home'] = $urls['dashboard'];
        }

        return $urls;
    }

    /**
     * Preenche URLs vazias nas configurações com páginas encontradas no WP.
     *
     * @param array<string, string> $settings
     * @return array<string, string>
     */
    public static function apply_url_defaults(array $settings): array {
        $map = [
            'login_url'        => 'login',
            'cadastro_url'     => 'cadastro',
            'home_url'         => 'home',
            'dashboard_url'    => 'dashboard',
            'tournament_url'   => 'torneio',
            'torneios_url'     => 'torneios',
            'participando_url' => 'participando',
            'carteira_url'     => 'creditos',
        ];

        foreach ($map as $setting_key => $page_key) {
            if (empty($settings[$setting_key])) {
                $settings[$setting_key] = self::get_url($page_key);
            }
        }

        if (empty($settings['dashboard_url']) && !empty($settings['home_url'])) {
            $settings['dashboard_url'] = $settings['home_url'];
        }

        return $settings;
    }

    /** @param string[] $slugs @param string[] $titles */
    private static function find_page(array $slugs, array $titles): ?WP_Post {
        foreach ($slugs as $slug) {
            $by_slug = get_page_by_path($slug, OBJECT, 'page');
            if ($by_slug instanceof WP_Post && $by_slug->post_status === 'publish') {
                return $by_slug;
            }
        }

        foreach ($titles as $title) {
            $by_title = get_page_by_title($title, OBJECT, 'page');
            if ($by_title instanceof WP_Post && $by_title->post_status === 'publish') {
                return $by_title;
            }
        }

        return null;
    }

    public static function init(): void {
        add_filter('the_content', [self::class, 'inject_tournament_detail'], 9);
    }

    public static function inject_tournament_detail(string $content): string {
        if (is_admin() || !is_singular('page')) {
            return $content;
        }

        $page_slug = (string) get_post_field('post_name', get_queried_object_id());
        $detail_slugs = array_unique(array_filter([
            AG_Rewrites::detail_page_slug(),
            self::default_slug('torneio'),
            'detalhes-torneio',
            'detalhes-toneio',
        ]));

        if (!in_array($page_slug, $detail_slugs, true)) {
            return $content;
        }

        if (
            str_contains($content, 'data-ag-page="torneio"')
            || has_shortcode($content, 'pagina torneio')
            || has_shortcode($content, 'arenagamer_torneio')
        ) {
            return $content;
        }

        return AG_Shortcodes::tournament_detail([]);
    }
}
