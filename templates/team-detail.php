<?php echo AG_Theme::client_open('time', ['data-ag-team-id' => $team_id ?? '']); ?>
    <p class="ag-team-detail-page__back">
        <a href="#" class="ag-link" data-ag-link="times">← Voltar para Times</a>
    </p>

    <div class="ag-header">
        <h2 class="ag-title" data-ag-team-title>Detalhes do time</h2>
    </div>

    <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
    <div class="ag-alert ag-alert--success" data-ag-success hidden></div>
    <div class="ag-loading" data-ag-loading>Carregando…</div>

    <article class="ag-card game-card game-card--style2 ag-team-detail-page ag-cyber-frame" data-ag-team-detail hidden></article>
</div>
