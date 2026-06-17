<?php if (!defined('ABSPATH')) exit; ?>
<div class="arenagamer-user-info">
    <div class="ag-user-card">
        <div class="ag-user-avatar">
            <?php echo strtoupper(substr($user['firstName'] ?? 'U', 0, 1)); ?>
        </div>
        <div class="ag-user-details">
            <strong><?php echo esc_html(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? '')); ?></strong>
            <span class="ag-user-email"><?php echo esc_html($user['email'] ?? ''); ?></span>
            <?php if (isset($user['role'])): ?>
            <span class="ag-badge ag-badge-sm"><?php echo esc_html($user['role']); ?></span>
            <?php endif; ?>
        </div>
        <div class="ag-user-actions">
            <a href="#" id="ag-logout" class="ag-btn ag-btn-sm ag-btn-outline">
                <?php _e('Sair', 'arenagamer'); ?>
            </a>
        </div>
    </div>
</div>
