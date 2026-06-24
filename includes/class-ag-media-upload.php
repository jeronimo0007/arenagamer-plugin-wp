<?php

if (!defined('ABSPATH')) {
    exit;
}

class AG_Media_Upload {

    private const MAX_BYTES = 4194304; // 4 MB

    private const ALLOWED_MIMES = [
        'jpg|jpeg|jpe' => 'image/jpeg',
        'png'          => 'image/png',
        'webp'         => 'image/webp',
        'gif'          => 'image/gif',
    ];

    public static function init(): void {
        add_action('wp_ajax_arenagamer_upload_media', [self::class, 'handle']);
        add_action('wp_ajax_nopriv_arenagamer_upload_media', [self::class, 'handle']);
    }

    public static function handle(): void {
        check_ajax_referer('arenagamer_api', 'nonce');

        $token = isset($_POST['token']) ? trim(wp_unslash($_POST['token'])) : '';
        $context = sanitize_key(wp_unslash($_POST['context'] ?? 'team'));
        $public_contexts = ['register', 'cadastro', 'avatar', 'profile'];

        if ($token === '' && !in_array($context, $public_contexts, true)) {
            wp_send_json_error(['message' => 'Faça login para enviar arquivos.'], 401);
        }

        if (empty($_FILES['file']['name'])) {
            wp_send_json_error(['message' => 'Nenhum arquivo enviado.'], 400);
        }

        $file = $_FILES['file'];
        if (!empty($file['error'])) {
            wp_send_json_error(['message' => self::upload_error_message((int) $file['error'])], 400);
        }

        if ((int) ($file['size'] ?? 0) > self::MAX_BYTES) {
            wp_send_json_error(['message' => 'Arquivo muito grande. Máximo: 4 MB.'], 400);
        }

        $checked = wp_check_filetype_and_ext($file['tmp_name'], $file['name'], self::ALLOWED_MIMES);
        if (empty($checked['ext']) || empty($checked['type']) || !in_array($checked['type'], self::ALLOWED_MIMES, true)) {
            wp_send_json_error(['message' => 'Formato inválido. Use JPG, PNG, WEBP ou GIF.'], 400);
        }

        $subdir = '/arenagamer/' . ($context !== '' ? $context : 'team');

        $upload_dir = wp_upload_dir();
        if (!empty($upload_dir['error'])) {
            wp_send_json_error(['message' => 'Pasta de uploads indisponível.'], 500);
        }

        $dir = $upload_dir['basedir'] . $subdir;
        if (!wp_mkdir_p($dir)) {
            wp_send_json_error(['message' => 'Não foi possível criar a pasta de uploads.'], 500);
        }

        $filename = wp_unique_filename($dir, sanitize_file_name($file['name']));
        $destination = trailingslashit($dir) . $filename;

        if (!is_uploaded_file($file['tmp_name']) || !move_uploaded_file($file['tmp_name'], $destination)) {
            wp_send_json_error(['message' => 'Falha ao salvar o arquivo.'], 500);
        }

        $url = trailingslashit($upload_dir['baseurl'] . $subdir) . $filename;

        wp_send_json_success([
            'url'      => esc_url_raw($url),
            'filename' => $filename,
        ]);
    }

    private static function upload_error_message(int $code): string {
        switch ($code) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return 'Arquivo muito grande. Máximo: 4 MB.';
            case UPLOAD_ERR_PARTIAL:
                return 'Upload incompleto. Tente novamente.';
            case UPLOAD_ERR_NO_FILE:
                return 'Nenhum arquivo enviado.';
            default:
                return 'Erro ao enviar arquivo.';
        }
    }
}
