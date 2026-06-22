<div class="ag-client" data-ag-page="perfil">
    <div class="ag-header">
        <h2 class="ag-title">Meu Perfil</h2>
        <p class="ag-subtitle">Atualize seus dados e redes sociais</p>
    </div>

    <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
    <div class="ag-alert ag-alert--success" data-ag-success hidden></div>
    <div class="ag-loading" data-ag-loading hidden>Carregando…</div>

    <div class="ag-card ag-card--narrow" data-ag-profile-form hidden>
        <form class="ag-form" data-ag-form="perfil">
            <div class="ag-row">
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
                <span>Telefone</span>
                <input type="tel" name="phoneNumber" maxlength="30">
            </label>
            <label class="ag-field">
                <span>Foto (URL)</span>
                <input type="url" name="avatarUrl" placeholder="https://exemplo.com/foto.jpg">
            </label>
            <label class="ag-field">
                <span>Instagram</span>
                <input type="url" name="instagramUrl">
            </label>
            <label class="ag-field">
                <span>YouTube</span>
                <input type="url" name="youtubeUrl">
            </label>
            <label class="ag-field">
                <span>Twitch</span>
                <input type="url" name="twitchUrl">
            </label>
            <button type="submit" class="ag-btn ag-btn--primary ag-btn--block">Salvar perfil</button>
        </form>
    </div>
</div>
