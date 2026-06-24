<?php echo AG_Theme::client_open('creditos'); ?>
    <div class="ag-header">
        <h2 class="ag-title">Meus Créditos</h2>
        <p class="ag-subtitle">Saldo da carteira e histórico</p>
    </div>

    <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
    <div class="ag-loading" data-ag-loading>Carregando…</div>

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
                    <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody data-ag-transactions></tbody>
            </table>
        </div>
        <p class="ag-empty" data-ag-empty-tx hidden>Nenhuma transação registrada.</p>
    </div>
</div>
