<?php

if (!defined('ABSPATH')) {
    exit;
}

class AG_Shortcodes {

    /** @var array<string, callable> */
    private static array $tags = [];

    public static function init(): void {
        self::register_tag('pagina login', [self::class, 'login']);
        self::register_tag('arenagamer_login', [self::class, 'login']);

        self::register_tag('pagina cadastro', [self::class, 'register']);
        self::register_tag('arenagamer_cadastro', [self::class, 'register']);
        self::register_tag('arenagamer_register', [self::class, 'register']);

        self::register_tag('pagina menu', [self::class, 'menu']);
        self::register_tag('arenagamer_menu', [self::class, 'menu']);

        self::register_tag('pagina torneios', [self::class, 'tournaments']);
        self::register_tag('arenagamer_torneios', [self::class, 'tournaments']);

        self::register_tag('pagina participando', [self::class, 'participating']);
        self::register_tag('arenagamer_participando', [self::class, 'participating']);
        self::register_tag('pagina meus torneios', [self::class, 'my_tournaments']);
        self::register_tag('arenagamer_meus_torneios', [self::class, 'my_tournaments']);

        self::register_tag('pagina torneio', [self::class, 'tournament_detail']);
        self::register_tag('arenagamer_torneio', [self::class, 'tournament_detail']);

        self::register_tag('pagina creditos', [self::class, 'wallet']);
        self::register_tag('arenagamer_creditos', [self::class, 'wallet']);
        self::register_tag('arenagamer_carteira', [self::class, 'wallet']);

        self::register_tag('pagina comprar creditos', [self::class, 'wallet']);
        self::register_tag('arenagamer_comprar_creditos', [self::class, 'wallet']);

        self::register_tag('pagina partidas', [self::class, 'matches']);
        self::register_tag('arenagamer_partidas', [self::class, 'matches']);

        self::register_tag('pagina times', [self::class, 'teams']);
        self::register_tag('arenagamer_times', [self::class, 'teams']);

        self::register_tag('pagina perfil', [self::class, 'profile']);
        self::register_tag('arenagamer_perfil', [self::class, 'profile']);

        self::register_tag('pagina dashboard', [self::class, 'dashboard']);
        self::register_tag('pagina painel', [self::class, 'dashboard']);
        self::register_tag('arenagamer_dashboard', [self::class, 'dashboard']);
        self::register_tag('arenagamer_painel', [self::class, 'dashboard']);
    }

    /** @return array<string, array{filter: string, title: string, subtitle: string}> */
    public static function tournament_views(): array {
        return [
            'abertos'     => [
                'filter'   => 'REGISTRATION_OPEN',
                'title'    => 'Inscrições abertas',
                'subtitle' => 'Torneios disponíveis para inscrição',
            ],
            'previstos'   => [
                'filter'   => 'UPCOMING',
                'title'    => 'Torneios previstos',
                'subtitle' => 'Em breve na plataforma',
            ],
            'andamento'   => [
                'filter'   => 'IN_PROGRESS',
                'title'    => 'Em andamento',
                'subtitle' => 'Torneios acontecendo agora',
            ],
            'finalizados' => [
                'filter'   => 'FINISHED',
                'title'    => 'Finalizados',
                'subtitle' => 'Torneios encerrados',
            ],
            'cancelados'  => [
                'filter'   => 'CANCELLED',
                'title'    => 'Cancelados',
                'subtitle' => 'Torneios cancelados',
            ],
            'todos'       => [
                'filter'   => 'ALL',
                'title'    => 'Todos os torneios',
                'subtitle' => 'Navegue por status',
            ],
        ];
    }

    /** @return array<string, array{title: string, subtitle: string}> */
    public static function participating_views(): array {
        return [
            'meus-torneios' => [
                'title'    => 'Meus torneios',
                'subtitle' => 'Torneios em que você está inscrito',
            ],
            'partidas'      => [
                'title'    => 'Minhas partidas',
                'subtitle' => 'Partidas dos seus torneios',
            ],
        ];
    }

    /** @return array<int, array{primary: string, alt: string, extra: string, desc: string}> */
    public static function get_catalog(): array {
        return [
            [
                'primary' => '[arenagamer_login]',
                'alt'     => '[pagina login]',
                'extra'   => '',
                'desc'    => 'Login (clientes, staff=false)',
            ],
            [
                'primary' => '[arenagamer_cadastro]',
                'alt'     => '[pagina cadastro]',
                'extra'   => '[arenagamer_register]',
                'desc'    => 'Cadastro de cliente',
            ],
            [
                'primary' => '[arenagamer_torneios]',
                'alt'     => '[pagina torneios]',
                'extra'   => 'view: abertos (padrão), previstos, andamento, finalizados, cancelados, todos',
                'desc'    => 'Listagem com abas (Todos, Inscrições abertas, Previstos…). O view define a aba inicial.',
            ],
            [
                'primary' => '[arenagamer_participando]',
                'alt'     => '[pagina participando]',
                'extra'   => 'view: meus-torneios (padrão), partidas',
                'desc'    => 'Área logada. Ex.: [arenagamer_participando view="partidas"]',
            ],
            [
                'primary' => '[arenagamer_torneio slug="x"]',
                'alt'     => '[pagina torneio slug="x"]',
                'extra'   => '',
                'desc'    => 'Detalhe e inscrição. Use [arenagamer_torneio] na página e ?slug= na URL.',
            ],
            [
                'primary' => '[arenagamer_creditos]',
                'alt'     => '[pagina creditos]',
                'extra'   => '[arenagamer_carteira]',
                'desc'    => 'Carteira: histórico, compra e saque',
            ],
            [
                'primary' => '[arenagamer_times]',
                'alt'     => '[pagina times]',
                'extra'   => '',
                'desc'    => 'Gerenciar times',
            ],
            [
                'primary' => '[arenagamer_perfil]',
                'alt'     => '[pagina perfil]',
                'extra'   => '',
                'desc'    => 'Perfil do usuário',
            ],
            [
                'primary' => '[arenagamer_dashboard]',
                'alt'     => '[pagina painel]',
                'extra'   => '[arenagamer_painel]',
                'desc'    => 'Painel do cliente (saldo, atalhos)',
            ],
            [
                'primary' => '[arenagamer_menu]',
                'alt'     => '[pagina menu]',
                'extra'   => '',
                'desc'    => 'Menu de navegação',
            ],
        ];
    }

    private static function register_tag(string $tag, callable $callback): void {
        self::$tags[$tag] = $callback;
        add_shortcode($tag, $callback);
    }

    /** @return string[] */
    public static function get_tags(): array {
        return array_keys(self::$tags);
    }

    /** @param array<string, array<string, string>> $views */
    private static function normalize_view(string $raw, array $views, string $default): string {
        $key = sanitize_title($raw);
        $aliases = [
            'insc-aberta'    => 'abertos',
            'insc-abertas'   => 'abertos',
            'inscricoes-abertas' => 'abertos',
            'aberta'         => 'abertos',
            'abertas'        => 'abertos',
            'meus-torneio'   => 'meus-torneios',
            'meus'           => 'meus-torneios',
        ];
        $key = $aliases[$key] ?? $key;

        return isset($views[$key]) ? $key : $default;
    }

    private static function render(string $page): string {
        AG_Assets::ensure_loaded();
        ob_start();
        $template = AG_CLIENTE_PATH . 'templates/' . $page . '.php';
        if (file_exists($template)) {
            include $template;
        }
        return ob_get_clean();
    }

    private static function render_tournaments(string $view): string {
        AG_Assets::ensure_loaded();
        $views = self::tournament_views();
        $meta = $views[$view];

        ob_start();
        $ag_filter = $meta['filter'];
        $ag_view = $view;
        $ag_title = '';
        $ag_subtitle = '';
        include AG_CLIENTE_PATH . 'templates/tournaments.php';
        return ob_get_clean();
    }

    private static function render_participating(string $view): string {
        AG_Assets::ensure_loaded();
        $views = self::participating_views();
        $meta = $views[$view];

        ob_start();
        $ag_view = $view;
        $ag_title = 'Participando';
        $ag_subtitle = 'Torneios e partidas em que você está inscrito';
        include AG_CLIENTE_PATH . 'templates/participating.php';
        return ob_get_clean();
    }

    public static function login(): string {
        return self::render('login');
    }

    public static function register(): string {
        return self::render('register');
    }

    public static function menu(): string {
        return self::render('menu');
    }

    public static function tournaments($atts = []): string {
        $atts = shortcode_atts(['view' => 'abertos'], $atts, 'arenagamer_torneios');
        $view = self::normalize_view((string) $atts['view'], self::tournament_views(), 'abertos');
        return self::render_tournaments($view);
    }

    public static function participating($atts = []): string {
        $atts = shortcode_atts(['view' => 'meus-torneios'], $atts, 'arenagamer_participando');
        $view = self::normalize_view((string) $atts['view'], self::participating_views(), 'meus-torneios');
        return self::render_participating($view);
    }

    public static function my_tournaments($atts = []): string {
        $atts = shortcode_atts(['view' => 'meus-torneios'], is_array($atts) ? $atts : []);
        return self::participating($atts);
    }

    public static function matches($atts = []): string {
        return self::participating(['view' => 'partidas']);
    }

    public static function wallet($atts = []): string {
        return self::render('wallet');
    }

    public static function teams(): string {
        return self::render('teams');
    }

    public static function profile(): string {
        return self::render('profile');
    }

    public static function dashboard(): string {
        return self::render('dashboard');
    }

    public static function tournament_detail($atts): string {
        AG_Assets::ensure_loaded();
        $atts = shortcode_atts(['slug' => ''], $atts, 'pagina torneio');
        ob_start();
        $url_slug = AG_Rewrites::resolve_slug_from_request();
        $attr_slug = sanitize_title($atts['slug']);
        $slug = $url_slug !== '' ? $url_slug : $attr_slug;
        include AG_CLIENTE_PATH . 'templates/tournament-detail.php';
        return ob_get_clean();
    }
}
