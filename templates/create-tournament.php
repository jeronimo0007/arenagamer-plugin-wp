<?php echo AG_Theme::client_open('criar-torneio'); ?>
    <div class="game ag-create-tournament-page">
        <div class="container-fluid px-0">
            <div class="ag-header">
                <h2 class="ag-title">Criar torneio</h2>
                <p class="ag-subtitle">Configure formato, premiação e taxas de inscrição</p>
            </div>

            <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
            <div class="ag-alert ag-alert--success" data-ag-success hidden></div>

            <div class="ag-card ag-card--narrow game-card game-card--style2 ag-create-tournament-form-wrap">
                <form class="ag-form" data-ag-form="tournament-create">
                    <div class="ag-row">
                        <label class="ag-field">
                            <span>Nome do torneio *</span>
                            <input type="text" name="name" required maxlength="120" placeholder="Ex.: Copa Arena">
                        </label>
                    </div>

                    <div class="ag-row">
                        <label class="ag-field">
                            <span>Tipo *</span>
                            <select name="type" required>
                                <option value="SINGLE_ELIMINATION">Eliminação simples</option>
                                <option value="DOUBLE_ELIMINATION">Eliminação dupla</option>
                                <option value="ROUND_ROBIN">Round robin</option>
                                <option value="GROUP_STAGE">Fase de grupos</option>
                                <option value="SWISS">Suíço</option>
                            </select>
                        </label>
                        <label class="ag-field">
                            <span>Formato *</span>
                            <select name="format" required>
                                <option value="SOLO">Individual</option>
                                <option value="TEAM">Times</option>
                            </select>
                        </label>
                    </div>

                    <label class="ag-field">
                        <span>Limite de participantes *</span>
                        <input type="number" name="participantsLimit" required min="2" max="512" value="16">
                    </label>

                    <div class="ag-row">
                        <label class="ag-field">
                            <span>Tipo de prêmio *</span>
                            <select name="prizeType" data-ag-prize-type required>
                                <option value="MANUAL">Manual</option>
                                <option value="AUTOMATIC">Automático</option>
                            </select>
                        </label>
                        <label class="ag-field">
                            <span>Financiamento *</span>
                            <select name="prizeFunding" data-ag-prize-funding required>
                                <option value="FIXED">Prêmio fixo</option>
                                <option value="ENTRY_FEES" data-ag-funding-entry-fees>Por arrecadação (taxa de inscrição)</option>
                            </select>
                        </label>
                    </div>

                    <p class="ag-muted ag-create-tournament-hint" data-ag-prize-hint></p>

                    <div data-ag-prize-fixed-fields>
                        <label class="ag-field">
                            <span data-ag-prize-pool-label>Prêmio fixo (créditos)</span>
                            <input type="number" name="prizePool" min="0" step="0.01" placeholder="Ex.: 100">
                        </label>
                    </div>

                    <div data-ag-prize-entry-fields hidden>
                        <div class="ag-row">
                            <label class="ag-field">
                                <span>Taxa de inscrição (créditos) *</span>
                                <input type="number" name="entryFeeCredits" min="0" step="0.01" placeholder="Ex.: 10">
                            </label>
                            <label class="ag-field">
                                <span>Taxa do organizador (%)</span>
                                <input type="number" name="feePercentage" min="0" max="100" step="0.01" placeholder="0–100">
                            </label>
                        </div>
                    </div>

                    <label class="ag-field">
                        <span>Visibilidade</span>
                        <select name="visibility">
                            <option value="PUBLIC">Público</option>
                            <option value="PRIVATE">Privado</option>
                        </select>
                    </label>

                    <label class="ag-field">
                        <span>Descrição</span>
                        <textarea name="description" rows="3" placeholder="Opcional"></textarea>
                    </label>

                    <div class="ag-form-actions">
                        <button type="submit" class="ag-btn ag-btn--primary">Criar torneio</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
