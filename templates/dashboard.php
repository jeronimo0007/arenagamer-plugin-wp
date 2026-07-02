<?php echo AG_Theme::client_open('painel'); ?>
    <div class="game ag-player-dashboard">
        <div class="container-fluid px-0">
            <div class="ag-header">
                <h2 class="ag-title">Painel do Jogador</h2>
                <p class="ag-subtitle" data-ag-welcome>Bem-vindo!</p>
            </div>

            <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
            <div class="ag-loading" data-ag-loading hidden>Carregando…</div>

            <div data-ag-dashboard hidden>
                <div class="ag-dashboard-stats">
                    <div class="ag-stat-card game-card game-card--style2">
                        <span class="ag-stat-card__label">Saldo disponível</span>
                        <strong class="ag-stat-card__value" data-ag-balance-available>—</strong>
                    </div>
                    <div class="ag-stat-card game-card game-card--style2">
                        <span class="ag-stat-card__label">Meus torneios</span>
                        <strong class="ag-stat-card__value" data-ag-tournament-count>—</strong>
                    </div>
                </div>

                <nav class="ag-dashboard-nav">
                    <a href="<?php echo esc_url(AG_Pages::resolved_url('torneios')); ?>" class="ag-dashboard-nav__item game-card game-card--style2" data-ag-nav-link="torneios">
                        <span>Explorar torneios</span>
                    </a>
                    <a href="<?php echo esc_url(AG_Pages::resolved_url('participando')); ?>" class="ag-dashboard-nav__item game-card game-card--style2" data-ag-nav-link="participando">
                        <span>Torneios e Partidas</span>
                    </a>
                    <a href="<?php echo esc_url(AG_Pages::resolved_url('carteira')); ?>" class="ag-dashboard-nav__item game-card game-card--style2" data-ag-nav-link="carteira">
                        <span>Carteira e Créditos</span>
                    </a>
                    <a href="<?php echo esc_url(AG_Pages::resolved_url('times')); ?>" class="ag-dashboard-nav__item game-card game-card--style2" data-ag-nav-link="times">
                        <span>Times</span>
                    </a>
                    <a href="<?php echo esc_url(AG_Pages::resolved_url('perfil')); ?>" class="ag-dashboard-nav__item game-card game-card--style2" data-ag-nav-link="perfil">
                        <span>Perfil</span>
                    </a>
                    <a href="<?php echo esc_url(AG_Pages::resolved_url('menu')); ?>" class="ag-dashboard-nav__item game-card game-card--style2" data-ag-nav-link="menu">
                        <span>Menu</span>
                    </a>
                </nav>

                <p class="ag-note ag-player-dashboard__logout">
                    <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-logout>Sair da conta</button>
                </p>
            </div>
        </div>
    </div>
</div>
