<?php echo AG_Theme::client_open('comprar-creditos'); ?>
    <div class="ag-header">
        <h2 class="ag-title">Comprar Créditos</h2>
        <p class="ag-subtitle">Adicione créditos à sua carteira</p>
    </div>

    <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
    <div class="ag-alert ag-alert--success" data-ag-success hidden></div>

    <div class="ag-card ag-card--narrow">
        <p class="ag-muted">Selecione um pacote ou informe um valor personalizado (1 crédito = R$ 1,00).</p>

        <div class="ag-packages" data-ag-packages></div>

        <form class="ag-form" data-ag-form="deposit">
            <label class="ag-field">
                <span>Valor (créditos)</span>
                <input type="number" name="amount" min="0.01" step="0.01" required placeholder="Ex.: 50.00">
            </label>
            <button type="submit" class="ag-btn ag-btn--primary ag-btn--block">Gerar fatura de pagamento</button>
        </form>

        <p class="ag-note">Ao confirmar, geramos uma fatura para pagamento. O saldo é creditado automaticamente após o pagamento.</p>
        <div class="ag-purchase-result" data-ag-purchase-result hidden></div>
    </div>
</div>
