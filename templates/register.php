<?php echo AG_Theme::client_open('cadastro'); ?>
    <div class="ag-auth-page">
    <div class="ag-card ag-card--auth">
        <h2 class="ag-title">Criar conta</h2>
        <p class="ag-subtitle">Cadastre-se como cliente ArenaGamer</p>

        <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
        <div class="ag-alert ag-alert--success" data-ag-success hidden></div>

        <form class="ag-form" data-ag-form="cadastro" action="#" method="post" novalidate>
            <label class="ag-field ag-field--nickname">
                <span>Nickname</span>
                <input type="text" name="nickname" required maxlength="50" autocomplete="username" placeholder="arenagamer" pattern="[A-Za-z0-9]+" title="Apenas letras e números, sem espaços ou caracteres especiais.">
                <span class="ag-field-hint-slot" data-ag-field-hint="nickname" aria-live="polite"></span>
            </label>
            <div class="ag-row ag-row--name-split">
                <label class="ag-field">
                    <span>Nome</span>
                    <input type="text" name="firstName" required maxlength="50" placeholder="arena">
                    <span class="ag-field-hint-slot" data-ag-field-hint="firstName" aria-live="polite"></span>
                </label>
                <label class="ag-field">
                    <span>Sobrenome</span>
                    <input type="text" name="lastName" required maxlength="50" placeholder="gamer">
                    <span class="ag-field-hint-slot" data-ag-field-hint="lastName" aria-live="polite"></span>
                </label>
            </div>
            <label class="ag-field">
                <span>E-mail</span>
                <input type="email" name="email" required autocomplete="email" placeholder="arena@support.com">
                <span class="ag-field-hint-slot" data-ag-field-hint="email" aria-live="polite"></span>
            </label>
            <label class="ag-field">
                <span>Senha (mín. 6 caracteres)</span>
                <input type="password" name="password" required minlength="6" autocomplete="new-password" placeholder="#@ArenaGamer123">
                <span class="ag-field-hint-slot" data-ag-field-hint="password" aria-live="polite"></span>
            </label>
            <?php include AG_CLIENTE_PATH . 'templates/partials/phone-field.php'; ?>
            <details class="ag-details">
                <summary>Opcionais</summary>
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
            <button type="submit" class="ag-btn ag-btn--primary ag-btn--block">Cadastrar</button>
        </form>

        <p class="ag-footer-link">Já tem conta? <a href="<?php echo esc_url(AG_Pages::resolved_url('login')); ?>" data-ag-link="login">Entrar</a></p>
    </div>
    </div>
</div>
