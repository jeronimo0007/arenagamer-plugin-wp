<?php echo AG_Theme::client_open('carteira'); ?>
    <div class="game ag-wallet-page">
        <div class="container-fluid px-0">
            <div class="ag-header">
                <h2 class="ag-title">Carteira e Créditos</h2>
                <p class="ag-subtitle">Saldo, histórico, compra e saque de créditos</p>
            </div>

            <div class="vs-tab-nav ag-tournament-tabs ag-wallet-tabs">
                <ul class="nav nav-tabs" role="tablist" aria-label="Carteira">
                    <li class="nav-item" role="presentation">
                        <button type="button" class="nav-link active" data-ag-wallet-tab="historico" role="tab" aria-selected="true">Histórico</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button type="button" class="nav-link" data-ag-wallet-tab="comprar" role="tab" aria-selected="false">Comprar</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button type="button" class="nav-link" data-ag-wallet-tab="sacar" role="tab" aria-selected="false">Sacar</button>
                    </li>
                </ul>
            </div>

            <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
            <div class="ag-alert ag-alert--success" data-ag-success hidden></div>
            <div class="ag-loading" data-ag-loading hidden>Carregando…</div>

            <div data-ag-wallet-panel="historico">
                <div class="ag-wallet" data-ag-wallet hidden>
                    <div class="ag-wallet__cards">
                        <div class="ag-stat game-card game-card--style2">
                            <span class="ag-stat__label">Saldo disponível</span>
                            <span class="ag-stat__value" data-ag-balance-available>—</span>
                        </div>
                        <div class="ag-stat game-card game-card--style2">
                            <span class="ag-stat__label">Saldo total</span>
                            <span class="ag-stat__value" data-ag-balance-total>—</span>
                        </div>
                        <div class="ag-stat game-card game-card--style2">
                            <span class="ag-stat__label">Retido (taxas)</span>
                            <span class="ag-stat__value" data-ag-balance-held>—</span>
                        </div>
                    </div>

                    <div class="ag-wallet__history game-card game-card--style2">
                        <h3 class="ag-section-title">Histórico de transações</h3>
                        <div class="ag-table-wrap">
                            <table class="ag-table">
                                <thead>
                                    <tr><th>Data</th><th>Descrição</th><th>Valor</th></tr>
                                </thead>
                                <tbody data-ag-transactions></tbody>
                            </table>
                        </div>
                        <p class="ag-empty" data-ag-empty-tx hidden>Nenhuma transação registrada.</p>
                    </div>
                </div>
            </div>

            <div data-ag-wallet-panel="comprar" hidden>
                <div class="ag-card ag-card--narrow ag-wallet-form game-card game-card--style2">
                    <p class="ag-muted">Selecione um pacote ou informe um valor.</p>
                    <div class="ag-packages" data-ag-packages></div>
                    <form class="ag-form" data-ag-form="deposit">
                        <label class="ag-field">
                            <span>Valor (créditos)</span>
                            <input type="number" name="amount" min="0.01" step="0.01" required placeholder="Ex.: 50.00">
                        </label>
                        <label class="ag-field">
                            <span>Descrição (opcional)</span>
                            <input type="text" name="description" maxlength="200" placeholder="Recarga via site">
                        </label>
                        <button type="submit" class="ag-btn ag-btn--primary ag-btn--block">Confirmar compra</button>
                    </form>
                </div>
            </div>

            <div data-ag-wallet-panel="sacar" hidden>
                <div class="ag-card ag-card--narrow ag-wallet-form game-card game-card--style2">
                    <p class="ag-muted">Solicite o saque de créditos da sua carteira.</p>
                    <form class="ag-form" data-ag-form="withdraw">
                        <label class="ag-field">
                            <span>Valor (créditos)</span>
                            <input type="number" name="amount" min="0.01" step="0.01" required placeholder="Ex.: 25.00">
                        </label>
                        <label class="ag-field">
                            <span>Descrição (opcional)</span>
                            <input type="text" name="description" maxlength="200" placeholder="Saque via site">
                        </label>
                        <button type="submit" class="ag-btn ag-btn--primary ag-btn--block">Confirmar saque</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
