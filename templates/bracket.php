<?php if (!defined('ABSPATH')) exit; ?>
<div class="arenagamer-bracket">
    <?php if (isset($matches['data']) && !empty($matches['data'])): ?>

    <?php
    // Group matches by round
    $rounds = [];
    foreach ($matches['data'] as $m) {
        $round_num = $m['roundNumber'] ?? 1;
        $rounds[$round_num][] = $m;
    }
    ksort($rounds);
    ?>

    <div class="ag-bracket-container">
        <?php foreach ($rounds as $round_num => $round_matches): ?>
        <div class="ag-bracket-round">
            <div class="ag-round-header">
                <?php
                $round_type = $round_matches[0]['roundType'] ?? '';
                $round_label = match ($round_type) {
                    'FINAL' => __('Final', 'arenagamer'),
                    'SEMIFINAL' => __('Semifinal', 'arenagamer'),
                    'QUARTERFINAL' => __('Quartas', 'arenagamer'),
                    default => sprintf(__('Rodada %d', 'arenagamer'), $round_num),
                };
                echo esc_html($round_label);
                ?>
            </div>

            <?php foreach ($round_matches as $m): ?>
            <div class="ag-bracket-match <?php echo ($m['status'] === 'COMPLETED') ? 'ag-match-done' : ''; ?>">
                <div class="ag-bracket-team ag-bracket-home <?php echo (isset($m['homeScore'], $m['awayScore']) && $m['homeScore'] > $m['awayScore']) ? 'ag-winner' : ''; ?>">
                    <span class="ag-bracket-name">
                        <?php echo isset($m['homeParticipantId']) ? "P#{$m['homeParticipantId']}" : 'BYE'; ?>
                    </span>
                    <span class="ag-bracket-score">
                        <?php echo isset($m['homeScore']) ? esc_html($m['homeScore']) : '—'; ?>
                    </span>
                </div>
                <div class="ag-bracket-team ag-bracket-away <?php echo (isset($m['homeScore'], $m['awayScore']) && $m['awayScore'] > $m['homeScore']) ? 'ag-winner' : ''; ?>">
                    <span class="ag-bracket-name">
                        <?php echo isset($m['awayParticipantId']) ? "P#{$m['awayParticipantId']}" : 'BYE'; ?>
                    </span>
                    <span class="ag-bracket-score">
                        <?php echo isset($m['awayScore']) ? esc_html($m['awayScore']) : '—'; ?>
                    </span>
                </div>
                <?php if (isset($m['scheduledAt'])): ?>
                <div class="ag-bracket-time">
                    <?php echo date_i18n('d/m H:i', strtotime($m['scheduledAt'])); ?>
                </div>
                <?php endif; ?>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endforeach; ?>
    </div>

    <?php else: ?>
    <div class="ag-empty">
        <p><?php _e('Chaves ainda não geradas para este torneio.', 'arenagamer'); ?></p>
    </div>
    <?php endif; ?>
</div>
