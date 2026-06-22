<div class="ag-client" data-ag-page="dashboard">
    <div class="ag-header">
        <h2 class="ag-title">Painel do Cliente</h2>
        <p class="ag-subtitle" data-ag-welcome>Bem-vindo!</p>
    </div>

    <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
    <div class="ag-loading" data-ag-loading hidden>Carregando…</div>

    <div data-ag-dashboard hidden>
        <div class="ag-dashboard-stats">
            <div class="ag-stat-card">
                <span class="ag-stat-card__label">Saldo disponível</span>
                <strong class="ag-stat-card__value" data-ag-balance-available>—</strong>
            </div>
            <div class="ag-stat-card">
                <span class="ag-stat-card__label">Meus torneios</span>
                <strong class="ag-stat-card__value" data-ag-tournament-count>—</strong>
            </div>
        </div>

        <nav class="ag-dashboard-nav">
            <a href="#" class="ag-dashboard-nav__item" data-ag-nav-link="torneios">
                <span>Explorar torneios</span>
            </a>
            <a href="#" class="ag-dashboard-nav__item" data-ag-nav-link="meus-torneios">
                <span>Meus torneios</span>
            </a>
            <a href="#" class="ag-dashboard-nav__item" data-ag-nav-link="partidas">
                <span>Minhas partidas</span>
            </a>
            <a href="#" class="ag-dashboard-nav__item" data-ag-nav-link="creditos">
                <span>Carteira e histórico</span>
            </a>
            <a href="#" class="ag-dashboard-nav__item" data-ag-nav-link="comprar-creditos">
                <span>Comprar créditos</span>
            </a>
        </nav>

        <p class="ag-note">
            <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-logout>Sair da conta</button>
        </p>
    </div>
</div>
