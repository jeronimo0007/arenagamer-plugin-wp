<?php echo AG_Theme::client_open('perfil'); ?>
    <div class="ag-profile-page">
        <div class="ag-header">
            <h2 class="ag-title">Meu Perfil</h2>
            <p class="ag-subtitle">Visualize e edite suas informações</p>
        </div>

        <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
        <div class="ag-alert ag-alert--success" data-ag-success hidden></div>
        <div class="ag-loading" data-ag-loading hidden>Carregando…</div>

        <div class="ag-card ag-card--auth ag-profile-card" data-ag-profile-form hidden>
            <div class="ag-profile-card__meta" data-ag-profile-meta hidden></div>

            <form class="ag-form" data-ag-form="perfil">
                <label class="ag-field ag-field--nickname">
                    <span>Nickname</span>
                    <input type="text" name="nickname" required maxlength="50" autocomplete="username" placeholder="arenagamer" pattern="[A-Za-z0-9]+" title="Apenas letras e números, sem espaços ou caracteres especiais.">
                    <span class="ag-field-hint-slot" data-ag-field-hint="nickname" aria-live="polite"></span>
                </label>
                <div class="ag-row ag-row--name-split">
                    <label class="ag-field">
                        <span>Nome</span>
                        <input type="text" name="firstName" required maxlength="50">
                    </label>
                    <label class="ag-field">
                        <span>Sobrenome</span>
                        <input type="text" name="lastName" required maxlength="50">
                    </label>
                </div>
                <label class="ag-field">
                    <span>E-mail</span>
                    <input type="email" name="email" readonly class="ag-field__input--readonly">
                </label>
            <?php include AG_CLIENTE_PATH . 'templates/partials/phone-field.php'; ?>
                <details class="ag-details" open>
                    <summary>Foto e redes sociais</summary>
                    <div class="ag-field ag-media-field" data-ag-media-field="avatar">
                        <span>Foto</span>
                        <div class="ag-media-field__preview ag-media-field__preview--avatar" data-ag-media-preview="avatar" hidden></div>
                        <input type="file" name="avatarFile" accept="image/jpeg,image/png,image/webp,image/gif">
                        <p class="ag-muted ag-media-field__or">ou informe uma URL</p>
                        <input type="url" name="avatarUrl" maxlength="500" placeholder="https://exemplo.com/foto.jpg">
                        <p class="ag-muted ag-media-field__hint">JPG, PNG, WEBP ou GIF — máx. 4 MB</p>
                    </div>
                    <label class="ag-field">
                        <span>Instagram</span>
                        <input type="url" name="instagramUrl" maxlength="500" placeholder="https://instagram.com/...">
                    </label>
                    <label class="ag-field">
                        <span>YouTube</span>
                        <input type="url" name="youtubeUrl" maxlength="500" placeholder="https://youtube.com/...">
                    </label>
                    <label class="ag-field">
                        <span>Twitch</span>
                        <input type="url" name="twitchUrl" maxlength="500" placeholder="https://twitch.tv/...">
                    </label>
                </details>
                <details class="ag-details">
                    <summary>Horários de disponibilidade</summary>
                    <div data-ag-profile-availability data-ag-availability-wrap></div>
                </details>
                <button type="submit" class="ag-btn ag-btn--primary ag-btn--block">Salvar perfil</button>
            </form>
        </div>
    </div>
</div>
