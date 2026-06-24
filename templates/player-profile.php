<?php echo AG_Theme::client_open('jogador', ['data-ag-player-id' => $player_id ?? '']); ?>
    <div class="ag-header">
        <h2 class="ag-title" data-ag-player-title>Perfil do jogador</h2>
        <p class="ag-subtitle" data-ag-player-subtitle hidden></p>
    </div>

    <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
    <div class="ag-loading" data-ag-loading>Carregando…</div>

    <article class="ag-card game-card game-card--style2 ag-player-profile" data-ag-player-profile hidden>
        <div data-ag-player-content></div>
    </article>
</div>
