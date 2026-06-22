<div class="ag-client" data-ag-page="times">
    <div class="ag-header">
        <h2 class="ag-title">Meus Times</h2>
        <p class="ag-subtitle">Criar, editar e gerenciar times</p>
    </div>

    <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
    <div class="ag-alert ag-alert--success" data-ag-success hidden></div>
    <div class="ag-loading" data-ag-loading hidden>Carregando…</div>

    <div class="ag-card" data-ag-team-form-wrap>
        <h3 class="ag-section-title" data-ag-team-form-title>Criar time</h3>
        <form class="ag-form" data-ag-form="team">
            <input type="hidden" name="teamId" value="">
            <div class="ag-row">
                <label class="ag-field">
                    <span>Nome *</span>
                    <input type="text" name="name" required maxlength="100">
                </label>
                <label class="ag-field">
                    <span>Tag</span>
                    <input type="text" name="tag" maxlength="20">
                </label>
            </div>
            <label class="ag-field">
                <span>Logo (URL)</span>
                <input type="url" name="logoUrl" placeholder="https://exemplo.com/logo.png">
            </label>
            <div class="ag-row">
                <label class="ag-field">
                    <span>YouTube</span>
                    <input type="url" name="youtubeUrl">
                </label>
                <label class="ag-field">
                    <span>Instagram</span>
                    <input type="url" name="instagramUrl">
                </label>
            </div>
            <div class="ag-row">
                <label class="ag-field">
                    <span>Twitch</span>
                    <input type="url" name="twitchUrl">
                </label>
                <label class="ag-field">
                    <span>Outras redes</span>
                    <input type="url" name="otherSocialUrl">
                </label>
            </div>
            <label class="ag-field">
                <span>Alteração de regra</span>
                <textarea name="rulesChange" rows="3" maxlength="500"></textarea>
            </label>
            <div class="ag-form-actions">
                <button type="submit" class="ag-btn ag-btn--primary">Salvar time</button>
                <button type="button" class="ag-btn ag-btn--ghost" data-ag-team-cancel hidden>Cancelar edição</button>
            </div>
        </form>
    </div>

    <h3 class="ag-section-title">Times</h3>
    <div class="ag-grid" data-ag-teams-list></div>
    <p class="ag-empty" data-ag-empty hidden>Nenhum time encontrado.</p>

    <div class="ag-modal" data-ag-team-modal hidden>
        <div class="ag-modal__backdrop" data-ag-modal-close></div>
        <div class="ag-modal__content ag-card">
            <button type="button" class="ag-modal__close" data-ag-modal-close>&times;</button>
            <div data-ag-team-detail></div>
        </div>
    </div>
</div>
