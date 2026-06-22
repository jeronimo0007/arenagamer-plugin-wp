<div class="ag-client" data-ag-page="carteira">
    <div class="ag-header">
        <h2 class="ag-title">Carteira</h2>
        <p class="ag-subtitle">Saldo, histórico, compra e saque de créditos</p>
    </div>

    <div class="ag-tabs ag-tabs--wallet">
        <button type="button" class="ag-tab ag-tab--active" data-ag-wallet-tab="historico">Histórico</button>
        <button type="button" class="ag-tab" data-ag-wallet-tab="comprar">Comprar</button>
        <button type="button" class="ag-tab" data-ag-wallet-tab="sacar">Sacar</button>
    </div>

    <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
    <div class="ag-alert ag-alert--success" data-ag-success hidden></div>
    <div class="ag-loading" data-ag-loading hidden>Carregando…</div>

    <div data-ag-wallet-panel="historico">
        <div class="ag-wallet" data-ag-wallet hidden>
            <div class="ag-wallet__cards">
                <div class="ag-stat">
                    <span class="ag-stat__label">Saldo disponível</span>
                    <span class="ag-stat__value" data-ag-balance-available>—</span>
                </div>
                <div class="ag-stat">
                    <span class="ag-stat__label">Saldo total</span>
                    <span class="ag-stat__value" data-ag-balance-total>—</span>
                </div>
                <div class="ag-stat">
                    <span class="ag-stat__label">Retido (taxas)</span>
                    <span class="ag-stat__value" data-ag-balance-held>—</span>
                </div>
            </div>
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

    <div data-ag-wallet-panel="comprar" hidden>
        <div class="ag-card ag-card--narrow">
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
        <div class="ag-card ag-card--narrow">
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
