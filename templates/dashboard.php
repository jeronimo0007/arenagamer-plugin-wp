<?php if (!defined('ABSPATH')) exit; ?>
<div class="arenagamer-dashboard">

    <!-- User Header -->
    <div class="ag-dash-header">
        <h2><?php printf(__('Olá, %s!', 'arenagamer'), esc_html($user['firstName'] ?? '')); ?></h2>
        <a href="#" id="ag-logout" class="ag-btn ag-btn-sm ag-btn-outline"><?php _e('Sair', 'arenagamer'); ?></a>
    </div>

    <!-- Stats Cards -->
    <div class="ag-dash-stats">
        <div class="ag-stat-card">
            <div class="ag-stat-value">
                <?php echo isset($wallet['data']['balance']) ? number_format($wallet['data']['balance'], 2, ',', '.') : '0,00'; ?>
            </div>
            <div class="ag-stat-label"><?php _e('Créditos', 'arenagamer'); ?></div>
        </div>
        <div class="ag-stat-card">
            <div class="ag-stat-value">
                <?php echo isset($wallet['data']['heldAmount']) ? number_format($wallet['data']['heldAmount'], 2, ',', '.') : '0,00'; ?>
            </div>
            <div class="ag-stat-label"><?php _e('Retidos', 'arenagamer'); ?></div>
        </div>
        <div class="ag-stat-card">
            <div class="ag-stat-value">
                <?php echo isset($teams['data']) ? count($teams['data']) : 0; ?>
            </div>
            <div class="ag-stat-label"><?php _e('Times', 'arenagamer'); ?></div>
        </div>
    </div>

    <!-- Tabs -->
    <div class="ag-dash-tabs">
        <button class="ag-tab ag-tab-active" data-tab="wallet"><?php _e('Carteira', 'arenagamer'); ?></button>
        <button class="ag-tab" data-tab="teams"><?php _e('Meus Times', 'arenagamer'); ?></button>
    </div>

    <!-- Wallet Tab -->
    <div class="ag-tab-content ag-tab-wallet ag-active">
        <div class="ag-wallet-info">
            <h3><?php _e('Saldo', 'arenagamer'); ?>:
                <strong><?php echo isset($wallet['data']['balance']) ? number_format($wallet['data']['balance'], 2, ',', '.') : '0,00'; ?></strong>
                <?php _e('créditos', 'arenagamer'); ?>
            </h3>
            <?php if (isset($wallet['data']['heldAmount']) && $wallet['data']['heldAmount'] > 0): ?>
            <p class="ag-held-notice">
                <?php printf(
                    __('%s créditos retidos em torneios pendentes', 'arenagamer'),
                    number_format($wallet['data']['heldAmount'], 2, ',', '.')
                ); ?>
            </p>
            <?php endif; ?>
        </div>
        <div id="ag-transactions" class="ag-transactions-list">
            <p class="ag-loading"><?php _e('Carregando transações...', 'arenagamer'); ?></p>
        </div>
    </div>

    <!-- Teams Tab -->
    <div class="ag-tab-content ag-tab-teams">
        <?php if (isset($teams['data']) && !empty($teams['data'])): ?>
        <div class="ag-teams-list">
            <?php foreach ($teams['data'] as $team): ?>
            <div class="ag-team-card">
                <div class="ag-team-info">
                    <strong><?php echo esc_html($team['name']); ?></strong>
                    <?php if (isset($team['tag'])): ?>
                    <span class="ag-team-tag">[<?php echo esc_html($team['tag']); ?>]</span>
                    <?php endif; ?>
                </div>
                <div class="ag-team-meta">
                    <?php if (isset($team['memberCount'])): ?>
                    <span><?php echo esc_html($team['memberCount']); ?> <?php _e('membros', 'arenagamer'); ?></span>
                    <?php endif; ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php else: ?>
        <div class="ag-empty-sm">
            <p><?php _e('Você não participa de nenhum time.', 'arenagamer'); ?></p>
        </div>
        <?php endif; ?>

        <div class="ag-create-team-section">
            <h4><?php _e('Criar Novo Time', 'arenagamer'); ?></h4>
            <form id="ag-create-team-form" class="ag-form ag-form-inline">
                <div class="ag-form-group">
                    <input type="text" name="name" class="ag-input" placeholder="<?php _e('Nome do time', 'arenagamer'); ?>" required>
                </div>
                <div class="ag-form-group">
                    <input type="text" name="tag" class="ag-input ag-input-sm" placeholder="TAG" maxlength="5">
                </div>
                <button type="submit" class="ag-btn ag-btn-primary"><?php _e('Criar', 'arenagamer'); ?></button>
            </form>
            <div class="ag-form-message" id="ag-team-message"></div>
        </div>
    </div>
</div>
