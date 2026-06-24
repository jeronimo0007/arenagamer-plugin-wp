<?php echo AG_Theme::client_open('times'); ?>
    <div class="game ag-teams-page">
        <div class="container-fluid px-0">
            <div class="ag-teams-page-header">
                <div class="ag-header">
                    <h2 class="ag-title">Times</h2>
                    <p class="ag-subtitle">Gerencie seus times e integrantes</p>
                </div>
                <button type="button" class="ag-btn ag-btn--primary ag-teams-create-btn" data-ag-team-create hidden>Criar time</button>
            </div>

            <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
            <div class="ag-alert ag-alert--success" data-ag-success hidden></div>
            <div class="ag-loading" data-ag-loading hidden>Carregando…</div>

            <div class="ag-team-settings-info" data-ag-team-settings-info hidden></div>

            <div class="ag-teams-grid" data-ag-teams-list></div>
            <p class="ag-empty" data-ag-empty hidden>Nenhum time encontrado.</p>

            <div class="ag-modal" data-ag-team-form-modal hidden>
                <div class="ag-modal__backdrop" data-ag-modal-close="form"></div>
                <div class="ag-modal__content ag-card game-card game-card--style2">
                    <button type="button" class="ag-modal__close" data-ag-modal-close="form" aria-label="Fechar">&times;</button>
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
                                <input type="text" name="tag" maxlength="20" placeholder="Ex.: OMNY">
                            </label>
                        </div>
                        <label class="ag-field">
                            <span>Visibilidade</span>
                            <select name="visibility">
                                <option value="PUBLIC">Público</option>
                                <option value="PROTECTED">Protegido</option>
                                <option value="PRIVATE">Privado</option>
                            </select>
                        </label>
                        <div class="ag-row ag-team-media-row">
                            <div class="ag-field ag-media-field" data-ag-media-field="logo">
                                <span>Logo</span>
                                <div class="ag-media-field__preview" data-ag-media-preview="logo" hidden></div>
                                <input type="file" name="logoFile" accept="image/jpeg,image/png,image/webp,image/gif">
                                <input type="hidden" name="logoUrl" value="">
                                <p class="ag-muted ag-media-field__hint">JPG, PNG, WEBP ou GIF — máx. 4 MB</p>
                            </div>
                            <div class="ag-field ag-media-field" data-ag-media-field="banner">
                                <span>Banner</span>
                                <div class="ag-media-field__preview ag-media-field__preview--banner" data-ag-media-preview="banner" hidden></div>
                                <input type="file" name="bannerFile" accept="image/jpeg,image/png,image/webp,image/gif">
                                <input type="hidden" name="bannerUrl" value="">
                                <p class="ag-muted ag-media-field__hint">JPG, PNG, WEBP ou GIF — máx. 4 MB</p>
                            </div>
                        </div>
                        <label class="ag-field">
                            <span>Descrição</span>
                            <textarea name="description" rows="3" placeholder="Sobre o time"></textarea>
                        </label>
                        <div class="ag-row">
                            <label class="ag-field">
                                <span>YouTube</span>
                                <input type="url" name="youtubeUrl" maxlength="500" placeholder="https://youtube.com/...">
                            </label>
                            <label class="ag-field">
                                <span>Instagram</span>
                                <input type="url" name="instagramUrl" maxlength="500" placeholder="https://instagram.com/...">
                            </label>
                        </div>
                        <div class="ag-row">
                            <label class="ag-field">
                                <span>Twitch</span>
                                <input type="url" name="twitchUrl" maxlength="500" placeholder="https://twitch.tv/...">
                            </label>
                            <label class="ag-field">
                                <span>Outras redes</span>
                                <input type="url" name="otherSocialUrl" maxlength="500" placeholder="https://...">
                            </label>
                        </div>
                        <div class="ag-team-ranks" data-ag-team-ranks>
                            <h4 class="ag-section-title ag-team-ranks__title">Rank por jogo (opcional)</h4>
                            <p class="ag-muted ag-team-ranks__hint">Selecione o jogo e informe os pontos. Na edição, informar ranks substitui todos os ranks do time.</p>
                            <div data-ag-team-ranks-list></div>
                            <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-add-rank-row>Adicionar jogo</button>
                        </div>
                        <div class="ag-form-actions">
                            <button type="submit" class="ag-btn ag-btn--primary">Salvar time</button>
                            <button type="button" class="ag-btn ag-btn--ghost" data-ag-modal-close="form">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
