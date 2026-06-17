<?php if (!defined('ABSPATH')) exit; ?>
<div class="arenagamer-tournaments" data-columns="<?php echo esc_attr($atts['columns']); ?>">

    <?php if (isset($response['data']['content']) && !empty($response['data']['content'])): ?>

    <div class="ag-grid ag-grid-<?php echo esc_attr($atts['columns']); ?>">
        <?php foreach ($response['data']['content'] as $tournament): ?>
        <div class="ag-card ag-tournament-card">
            <div class="ag-card-header">
                <span class="ag-badge ag-badge-<?php echo esc_attr(strtolower($tournament['status'])); ?>">
                    <?php echo esc_html(self::translate_status($tournament['status'])); ?>
                </span>
                <?php if (isset($tournament['type'])): ?>
                <span class="ag-badge ag-badge-type"><?php echo esc_html($tournament['type']); ?></span>
                <?php endif; ?>
            </div>

            <div class="ag-card-body">
                <h3 class="ag-card-title"><?php echo esc_html($tournament['name']); ?></h3>

                <?php if (isset($tournament['presetName'])): ?>
                <p class="ag-card-game">
                    <i class="ag-icon-gamepad"></i>
                    <?php echo esc_html($tournament['presetName']); ?>
                </p>
                <?php endif; ?>

                <div class="ag-card-meta">
                    <?php if (isset($tournament['participantsLimit'])): ?>
                    <span class="ag-meta-item">
                        <i class="ag-icon-users"></i>
                        <?php echo esc_html($tournament['participantsLimit']); ?> vagas
                    </span>
                    <?php endif; ?>

                    <?php if (isset($tournament['entryFeeCredits']) && $tournament['entryFeeCredits'] > 0): ?>
                    <span class="ag-meta-item">
                        <i class="ag-icon-coins"></i>
                        <?php echo number_format($tournament['entryFeeCredits'], 2, ',', '.'); ?> créditos
                    </span>
                    <?php else: ?>
                    <span class="ag-meta-item ag-free">
                        <i class="ag-icon-check"></i> Gratuito
                    </span>
                    <?php endif; ?>

                    <?php if (isset($tournament['startDate'])): ?>
                    <span class="ag-meta-item">
                        <i class="ag-icon-calendar"></i>
                        <?php echo date_i18n('d/m/Y H:i', strtotime($tournament['startDate'])); ?>
                    </span>
                    <?php endif; ?>
                </div>
            </div>

            <div class="ag-card-footer">
                <a href="<?php echo esc_url(add_query_arg('tournament', $tournament['slug'])); ?>"
                   class="ag-btn ag-btn-primary">
                    Ver Detalhes
                </a>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

    <!-- Pagination -->
    <?php if (isset($response['data']['totalPages']) && $response['data']['totalPages'] > 1): ?>
    <div class="ag-pagination">
        <?php for ($i = 0; $i < $response['data']['totalPages']; $i++): ?>
        <a href="<?php echo esc_url(add_query_arg('ag_page', $i)); ?>"
           class="ag-page-link <?php echo ($page == $i) ? 'ag-active' : ''; ?>">
            <?php echo $i + 1; ?>
        </a>
        <?php endfor; ?>
    </div>
    <?php endif; ?>

    <?php else: ?>
    <div class="ag-empty">
        <div class="ag-empty-icon">&#127942;</div>
        <h3><?php _e('Nenhum torneio disponível', 'arenagamer'); ?></h3>
        <p><?php _e('Em breve novos torneios serão publicados!', 'arenagamer'); ?></p>
    </div>
    <?php endif; ?>

</div>

<?php
// Helper to translate status
if (!function_exists('ArenaGamer_Shortcodes::translate_status')) {
    function arenagamer_translate_status($status) {
        $map = [
            'DRAFT'               => 'Rascunho',
            'REGISTRATION_OPEN'   => 'Inscrições Abertas',
            'REGISTRATION_CLOSED' => 'Inscrições Fechadas',
            'IN_PROGRESS'         => 'Em Andamento',
            'COMPLETED'           => 'Concluído',
            'CANCELLED'           => 'Cancelado',
        ];
        return $map[$status] ?? $status;
    }
}
?>
