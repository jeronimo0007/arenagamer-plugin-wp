<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * AJAX handlers for ArenaGamer frontend interactions
 */
class ArenaGamer_Ajax
{
    /**
     * Login
     */
    public static function login()
    {
        check_ajax_referer('arenagamer_nonce', 'nonce');

        $email = sanitize_email($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (empty($email) || empty($password)) {
            wp_send_json_error(['message' => __('Email e senha são obrigatórios', 'arenagamer')]);
        }

        $api = ArenaGamer_API::instance();
        $result = $api->login($email, $password);

        if ($result && isset($result['data']['accessToken'])) {
            ArenaGamer_Auth::store_auth($result['data']);
            wp_send_json_success([
                'message' => __('Login realizado com sucesso', 'arenagamer'),
                'user'    => $result['data']['user'],
            ]);
        } else {
            $msg = isset($result['message']) ? $result['message'] : __('Credenciais inválidas', 'arenagamer');
            wp_send_json_error(['message' => $msg]);
        }
    }

    /**
     * Register
     */
    public static function register()
    {
        check_ajax_referer('arenagamer_nonce', 'nonce');

        $data = [
            'email'     => sanitize_email($_POST['email'] ?? ''),
            'password'  => $_POST['password'] ?? '',
            'firstName' => sanitize_text_field($_POST['firstName'] ?? ''),
            'lastName'  => sanitize_text_field($_POST['lastName'] ?? ''),
            'username'  => sanitize_text_field($_POST['username'] ?? ''),
        ];

        if (empty($data['email']) || empty($data['password']) || empty($data['firstName'])) {
            wp_send_json_error(['message' => __('Preencha os campos obrigatórios', 'arenagamer')]);
        }

        $api = ArenaGamer_API::instance();
        $result = $api->register($data);

        if ($result && isset($result['data']['accessToken'])) {
            ArenaGamer_Auth::store_auth($result['data']);
            wp_send_json_success([
                'message' => __('Cadastro realizado com sucesso', 'arenagamer'),
                'user'    => $result['data']['user'],
            ]);
        } else {
            $msg = isset($result['message']) ? $result['message'] : __('Erro ao registrar', 'arenagamer');
            wp_send_json_error(['message' => $msg]);
        }
    }

    /**
     * Join tournament (solo)
     */
    public static function join_tournament()
    {
        check_ajax_referer('arenagamer_nonce', 'nonce');

        $token = ArenaGamer_Auth::get_token();
        if (!$token) {
            wp_send_json_error(['message' => __('Faça login para se inscrever', 'arenagamer')]);
        }

        $slug = sanitize_text_field($_POST['slug'] ?? '');
        if (empty($slug)) {
            wp_send_json_error(['message' => __('Torneio não informado', 'arenagamer')]);
        }

        $windows = isset($_POST['windows']) ? array_map('sanitize_text_field', (array)$_POST['windows']) : [];

        $api = ArenaGamer_API::instance();

        $team_id = isset($_POST['team_id']) ? (int)$_POST['team_id'] : 0;

        if ($team_id > 0) {
            $result = $api->join_tournament_team($slug, $token, [
                'teamId'           => $team_id,
                'availableWindows' => $windows,
            ]);
        } else {
            $result = $api->join_tournament_solo($slug, $token, [
                'availableWindows' => $windows,
            ]);
        }

        if ($result && isset($result['success']) && $result['success']) {
            // Clear tournament cache
            delete_transient("arenagamer_tournament_{$slug}");
            wp_send_json_success(['message' => $result['message'] ?? __('Inscrição realizada', 'arenagamer')]);
        } else {
            $msg = isset($result['message']) ? $result['message'] : __('Erro ao inscrever', 'arenagamer');
            wp_send_json_error(['message' => $msg]);
        }
    }

    /**
     * Get tournament matches
     */
    public static function get_matches()
    {
        check_ajax_referer('arenagamer_nonce', 'nonce');

        $slug = sanitize_text_field($_POST['slug'] ?? '');
        if (empty($slug)) {
            wp_send_json_error(['message' => 'Slug required']);
        }

        $api = ArenaGamer_API::instance();
        $matches = $api->get_tournament_matches($slug);
        wp_send_json_success($matches);
    }

    /**
     * Wallet balance
     */
    public static function wallet_balance()
    {
        check_ajax_referer('arenagamer_nonce', 'nonce');

        $token = ArenaGamer_Auth::get_token();
        if (!$token) {
            wp_send_json_error(['message' => __('Não autenticado', 'arenagamer')]);
        }

        $api = ArenaGamer_API::instance();
        $result = $api->get_wallet_balance($token);
        wp_send_json_success($result);
    }

    /**
     * My teams
     */
    public static function my_teams()
    {
        check_ajax_referer('arenagamer_nonce', 'nonce');

        $token = ArenaGamer_Auth::get_token();
        if (!$token) {
            wp_send_json_error(['message' => __('Não autenticado', 'arenagamer')]);
        }

        $api = ArenaGamer_API::instance();
        $result = $api->get_my_teams($token);
        wp_send_json_success($result);
    }

    /**
     * Create team
     */
    public static function create_team()
    {
        check_ajax_referer('arenagamer_nonce', 'nonce');

        $token = ArenaGamer_Auth::get_token();
        if (!$token) {
            wp_send_json_error(['message' => __('Não autenticado', 'arenagamer')]);
        }

        $data = [
            'name' => sanitize_text_field($_POST['name'] ?? ''),
            'tag'  => sanitize_text_field($_POST['tag'] ?? ''),
        ];

        if (empty($data['name'])) {
            wp_send_json_error(['message' => __('Nome do time é obrigatório', 'arenagamer')]);
        }

        $api = ArenaGamer_API::instance();
        $result = $api->create_team($token, $data);

        if ($result && isset($result['success']) && $result['success']) {
            wp_send_json_success(['message' => __('Time criado com sucesso', 'arenagamer')]);
        } else {
            $msg = isset($result['message']) ? $result['message'] : __('Erro ao criar time', 'arenagamer');
            wp_send_json_error(['message' => $msg]);
        }
    }
}
