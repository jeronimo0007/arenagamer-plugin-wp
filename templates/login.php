<?php echo AG_Theme::client_open('login'); ?>
    <div class="ag-auth-page">
    <div class="ag-card ag-card--auth">
        <h2 class="ag-title">Entrar</h2>
        <p class="ag-subtitle">Acesse sua conta ArenaGamer</p>

        <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>

        <form class="ag-form" data-ag-form="login" action="#" method="post" novalidate>
            <label class="ag-field">
                <span>E-mail</span>
                <input type="email" name="email" required autocomplete="email">
            </label>
            <label class="ag-field">
                <span>Senha</span>
                <input type="password" name="password" required autocomplete="current-password">
            </label>
            <button type="submit" class="ag-btn ag-btn--primary ag-btn--block">Entrar</button>
        </form>

        <p class="ag-footer-link">Não tem conta? <a href="<?php echo esc_url(AG_Pages::resolved_url('cadastro')); ?>" data-ag-link="cadastro">Cadastre-se</a></p>
    </div>
    </div>
</div>
