<?php echo AG_Theme::client_open('torneio', ['data-ag-slug' => $slug]); ?>
    <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
    <div class="ag-alert ag-alert--success" data-ag-success hidden></div>
    <div class="ag-loading" data-ag-loading>Carregando…</div>

    <article class="game-card game-card--style2 ag-tournament-card ag-tournament-detail" data-ag-detail hidden>
        <div class="ag-tournament-detail__banner" data-ag-tournament-banner></div>

        <div class="ag-tournament-detail__frame">
            <header class="ag-tournament-detail__hero">
                <div class="ag-tournament-detail__identity" data-ag-tournament-identity></div>
                <div class="ag-tournament-detail__headline">
                    <h2 class="ag-tournament-detail__title" data-ag-tournament-name>Detalhes do torneio</h2>
                    <p class="ag-tournament-detail__slug" data-ag-tournament-slug hidden></p>
                    <div class="ag-tournament-card__status-row" data-ag-detail-status-row hidden>
                        <span data-ag-detail-status></span>
                        <span class="ag-enrollment-status" data-ag-enrollment-status hidden></span>
                    </div>
                </div>
            </header>

            <div class="ag-tournament-detail__dates" data-ag-detail-dates></div>

            <div class="ag-tournament-detail__stats" data-ag-detail-stats role="list"></div>

            <div class="ag-tournament-detail__body" data-ag-detail-body></div>

            <div class="ag-tournament-detail__participants" data-ag-detail-participants hidden></div>

            <div class="ag-tournament-detail__revenue" data-ag-detail-revenue hidden></div>

            <div class="ag-tournament-media ag-tournament-detail__streams" data-ag-tournament-media hidden></div>
        </div>

        <div class="game-card__footer ag-game-card__footer ag-tournament-detail__footer" data-ag-detail-footer>
            <span class="ag-game-card__joined" data-ag-joined hidden>Já inscrito</span>
            <span class="ag-game-card__not-joined" data-ag-not-joined hidden>Não inscrito</span>
            <a href="#" role="button" class="game-card__link ag-game-card__join ag-game-card__join--pulse ag-game-card__join--detail" data-ag-join hidden>Faça sua inscrição</a>
            <button type="button" class="ag-btn ag-btn--outline-danger ag-btn--sm ag-game-card__withdraw" data-ag-withdraw hidden>Desistir do torneio</button>
        </div>
    </article>
</div>
