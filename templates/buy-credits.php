<div class="ag-client" data-ag-page="comprar-creditos">
    <div class="ag-header">
        <h2 class="ag-title">Comprar Créditos</h2>
        <p class="ag-subtitle">Adicione créditos à sua carteira</p>
    </div>

    <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
    <div class="ag-alert ag-alert--success" data-ag-success hidden></div>

    <div class="ag-card ag-card--narrow">
        <p class="ag-muted">Selecione um pacote ou informe um valor personalizado.</p>

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

        <p class="ag-note">O pagamento é processado via API (depósito na carteira). Integre seu gateway de pagamento conforme necessário.</p>
    </div>
</div>
