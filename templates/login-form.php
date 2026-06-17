<?php if (!defined('ABSPATH')) exit; ?>
<div class="arenagamer-auth">
    <div class="ag-tabs">
        <button class="ag-tab ag-tab-active" data-tab="login"><?php _e('Login', 'arenagamer'); ?></button>
        <button class="ag-tab" data-tab="register"><?php _e('Criar Conta', 'arenagamer'); ?></button>
    </div>

    <!-- Login Form -->
    <div class="ag-tab-content ag-tab-login ag-active">
        <form id="ag-login-form" class="ag-form">
            <div class="ag-form-group">
                <label for="ag-login-email"><?php _e('Email', 'arenagamer'); ?></label>
                <input type="email" id="ag-login-email" name="email" class="ag-input" required
                       placeholder="seu@email.com">
            </div>
            <div class="ag-form-group">
                <label for="ag-login-password"><?php _e('Senha', 'arenagamer'); ?></label>
                <input type="password" id="ag-login-password" name="password" class="ag-input" required
                       placeholder="********">
            </div>
            <div class="ag-form-message" id="ag-login-message"></div>
            <button type="submit" class="ag-btn ag-btn-primary ag-btn-block">
                <?php _e('Entrar', 'arenagamer'); ?>
            </button>
        </form>
    </div>

    <!-- Register Form -->
    <div class="ag-tab-content ag-tab-register">
        <form id="ag-register-form" class="ag-form">
            <div class="ag-form-row">
                <div class="ag-form-group ag-half">
                    <label for="ag-reg-first"><?php _e('Nome', 'arenagamer'); ?> *</label>
                    <input type="text" id="ag-reg-first" name="firstName" class="ag-input" required>
                </div>
                <div class="ag-form-group ag-half">
                    <label for="ag-reg-last"><?php _e('Sobrenome', 'arenagamer'); ?></label>
                    <input type="text" id="ag-reg-last" name="lastName" class="ag-input">
                </div>
            </div>
            <div class="ag-form-group">
                <label for="ag-reg-username"><?php _e('Username', 'arenagamer'); ?></label>
                <input type="text" id="ag-reg-username" name="username" class="ag-input"
                       placeholder="nickname_in_game">
            </div>
            <div class="ag-form-group">
                <label for="ag-reg-email"><?php _e('Email', 'arenagamer'); ?> *</label>
                <input type="email" id="ag-reg-email" name="email" class="ag-input" required>
            </div>
            <div class="ag-form-group">
                <label for="ag-reg-password"><?php _e('Senha', 'arenagamer'); ?> *</label>
                <input type="password" id="ag-reg-password" name="password" class="ag-input" required
                       minlength="6" placeholder="Mínimo 6 caracteres">
            </div>
            <div class="ag-form-message" id="ag-register-message"></div>
            <button type="submit" class="ag-btn ag-btn-primary ag-btn-block">
                <?php _e('Criar Conta', 'arenagamer'); ?>
            </button>
        </form>
    </div>
</div>
