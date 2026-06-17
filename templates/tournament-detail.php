<?php if (!defined('ABSPATH')) exit; ?>
<?php $t = isset($tournament['data']) ? $tournament['data'] : null; ?>

<?php if ($t): ?>
<div class="arenagamer-tournament-detail" data-slug="<?php echo esc_attr($slug); ?>">

    <!-- Header -->
    <div class="ag-detail-header">
        <div class="ag-detail-header-info">
            <h1 class="ag-detail-title"><?php echo esc_html($t['name']); ?></h1>
            <div class="ag-detail-badges">
                <span class="ag-badge ag-badge-<?php echo esc_attr(strtolower($t['status'])); ?>">
                    <?php echo esc_html(arenagamer_translate_status($t['status'])); ?>
                </span>
                <span class="ag-badge ag-badge-type"><?php echo esc_html($t['type']); ?></span>
                <?php if (isset($t['format'])): ?>
                <span class="ag-badge"><?php echo esc_html($t['format']); ?></span>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <div class="ag-detail-content">
        <!-- Info Grid -->
        <div class="ag-info-grid">
            <div class="ag-info-item">
                <span class="ag-info-label"><?php _e('Vagas', 'arenagamer'); ?></span>
                <span class="ag-info-value"><?php echo isset($t['participantsLimit']) ? esc_html($t['participantsLimit']) : '—'; ?></span>
            </div>
            <div class="ag-info-item">
                <span class="ag-info-label"><?php _e('Taxa de Entrada', 'arenagamer'); ?></span>
                <span class="ag-info-value">
                    <?php echo (isset($t['entryFeeCredits']) && $t['entryFeeCredits'] > 0) ?
                        number_format($t['entryFeeCredits'], 2, ',', '.') . ' créditos' : 'Gratuito'; ?>
                </span>
            </div>
            <div class="ag-info-item">
                <span class="ag-info-label"><?php _e('Início', 'arenagamer'); ?></span>
                <span class="ag-info-value">
                    <?php echo isset($t['startDate']) ? date_i18n('d/m/Y H:i', strtotime($t['startDate'])) : '—'; ?>
                </span>
            </div>
            <div class="ag-info-item">
                <span class="ag-info-label"><?php _e('Inscrição até', 'arenagamer'); ?></span>
                <span class="ag-info-value">
                    <?php echo isset($t['registrationDeadline']) ? date_i18n('d/m/Y H:i', strtotime($t['registrationDeadline'])) : '—'; ?>
                </span>
            </div>
            <div class="ag-info-item">
                <span class="ag-info-label"><?php _e('Best Of', 'arenagamer'); ?></span>
                <span class="ag-info-value"><?php echo isset($t['bestOf']) ? esc_html($t['bestOf']) : 1; ?></span>
            </div>
            <div class="ag-info-item">
                <span class="ag-info-label"><?php _e('Visibilidade', 'arenagamer'); ?></span>
                <span class="ag-info-value"><?php echo isset($t['visibility']) ? esc_html($t['visibility']) : '—'; ?></span>
            </div>
        </div>

        <!-- Description -->
        <?php if (!empty($t['description'])): ?>
        <div class="ag-section">
            <h3><?php _e('Descrição', 'arenagamer'); ?></h3>
            <p><?php echo nl2br(esc_html($t['description'])); ?></p>
        </div>
        <?php endif; ?>

        <!-- Rules -->
        <?php if (!empty($t['rules'])): ?>
        <div class="ag-section">
            <h3><?php _e('Regras', 'arenagamer'); ?></h3>
            <div class="ag-rules"><?php echo nl2br(esc_html($t['rules'])); ?></div>
        </div>
        <?php endif; ?>

        <!-- Join Button -->
        <?php if (isset($t['status']) && $t['status'] === 'REGISTRATION_OPEN'): ?>
        <div class="ag-section ag-join-section">
            <?php if ($is_logged_in): ?>
                <h3><?php _e('Inscrever-se', 'arenagamer'); ?></h3>
                <form id="ag-join-form" class="ag-form">
                    <input type="hidden" name="slug" value="<?php echo esc_attr($slug); ?>">

                    <div class="ag-form-group">
                        <label><?php _e('Disponibilidade', 'arenagamer'); ?></label>
                        <div class="ag-checkbox-group">
                            <label><input type="checkbox" name="windows[]" value="MORNING"> <?php _e('Manhã (06-12h)', 'arenagamer'); ?></label>
                            <label><input type="checkbox" name="windows[]" value="AFTERNOON"> <?php _e('Tarde (12-18h)', 'arenagamer'); ?></label>
                            <label><input type="checkbox" name="windows[]" value="EVENING" checked> <?php _e('Noite (18-00h)', 'arenagamer'); ?></label>
                            <label><input type="checkbox" name="windows[]" value="NIGHT"> <?php _e('Madrugada (00-06h)', 'arenagamer'); ?></label>
                        </div>
                    </div>

                    <?php if (isset($t['format']) && $t['format'] === 'TEAM'): ?>
                    <div class="ag-form-group">
                        <label for="ag-team-select"><?php _e('Selecione seu Time', 'arenagamer'); ?></label>
                        <select id="ag-team-select" name="team_id" class="ag-select" required>
                            <option value=""><?php _e('Carregando times...', 'arenagamer'); ?></option>
                        </select>
                    </div>
                    <?php endif; ?>

                    <button type="submit" class="ag-btn ag-btn-primary ag-btn-lg">
                        <?php _e('Inscrever-se no Torneio', 'arenagamer'); ?>
                    </button>
                </form>
            <?php else: ?>
                <p class="ag-login-notice">
                    <?php _e('Faça login para se inscrever neste torneio.', 'arenagamer'); ?>
                </p>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <!-- Matches -->
        <?php if (isset($matches['data']) && !empty($matches['data'])): ?>
        <div class="ag-section">
            <h3><?php _e('Partidas', 'arenagamer'); ?></h3>
            <div class="ag-matches-list">
                <?php foreach ($matches['data'] as $m): ?>
                <div class="ag-match-item ag-match-<?php echo esc_attr(strtolower($m['status'])); ?>">
                    <div class="ag-match-number">#<?php echo esc_html($m['matchNumber']); ?></div>
                    <div class="ag-match-teams">
                        <span class="ag-match-home">
                            <?php echo isset($m['homeParticipantId']) ? "Participante #{$m['homeParticipantId']}" : '<em>BYE</em>'; ?>
                        </span>
                        <span class="ag-match-vs">VS</span>
                        <span class="ag-match-away">
                            <?php echo isset($m['awayParticipantId']) ? "Participante #{$m['awayParticipantId']}" : '<em>BYE</em>'; ?>
                        </span>
                    </div>
                    <div class="ag-match-score">
                        <?php if (isset($m['homeScore']) && isset($m['awayScore'])): ?>
                        <strong><?php echo esc_html($m['homeScore']); ?> - <?php echo esc_html($m['awayScore']); ?></strong>
                        <?php else: ?>
                        <span class="ag-pending">—</span>
                        <?php endif; ?>
                    </div>
                    <div class="ag-match-time">
                        <?php echo isset($m['scheduledAt']) ? date_i18n('d/m H:i', strtotime($m['scheduledAt'])) : '—'; ?>
                    </div>
                    <div class="ag-match-status">
                        <span class="ag-badge ag-badge-sm ag-badge-<?php echo esc_attr(strtolower($m['status'])); ?>">
                            <?php echo esc_html($m['status']); ?>
                        </span>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

    </div>
</div>
<?php else: ?>
<div class="ag-empty">
    <h3><?php _e('Torneio não encontrado', 'arenagamer'); ?></h3>
    <p><?php _e('O torneio solicitado não foi encontrado ou está indisponível.', 'arenagamer'); ?></p>
</div>
<?php endif; ?>

<?php
if (!function_exists('arenagamer_translate_status')) {
    function arenagamer_translate_status($status) {
        $map = [
            'DRAFT' => 'Rascunho', 'REGISTRATION_OPEN' => 'Inscrições Abertas',
            'REGISTRATION_CLOSED' => 'Inscrições Fechadas', 'IN_PROGRESS' => 'Em Andamento',
            'COMPLETED' => 'Concluído', 'CANCELLED' => 'Cancelado',
        ];
        return $map[$status] ?? $status;
    }
}
?>
