<div class="ag-client" data-ag-page="cadastro">
    <div class="ag-card ag-card--narrow">
        <h2 class="ag-title">Criar conta</h2>
        <p class="ag-subtitle">Cadastre-se como cliente ArenaGamer</p>

        <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
        <div class="ag-alert ag-alert--success" data-ag-success hidden></div>

        <form class="ag-form" data-ag-form="cadastro" action="#" method="post" novalidate>
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
                <span>E-mail</span>
                <input type="email" name="email" required autocomplete="email">
            </label>
            <label class="ag-field">
                <span>Nome de usuário</span>
                <input type="text" name="username" required maxlength="50" autocomplete="username">
            </label>
            <label class="ag-field">
                <span>Senha (mín. 6 caracteres)</span>
                <input type="password" name="password" required minlength="6" autocomplete="new-password">
            </label>
            <label class="ag-field">
                <span>Telefone</span>
                <input type="tel" name="phoneNumber" maxlength="30" placeholder="11999999999">
            </label>
            <details class="ag-details">
                <summary>Redes sociais e foto (opcional)</summary>
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
            </details>
            <button type="submit" class="ag-btn ag-btn--primary ag-btn--block">Cadastrar</button>
        </form>

        <p class="ag-footer-link">Já tem conta? <a href="#" data-ag-link="login">Entrar</a></p>
    </div>
</div>
