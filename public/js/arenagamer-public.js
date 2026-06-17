/**
 * ArenaGamer WordPress Plugin - Frontend JavaScript
 */
(function($) {
    'use strict';

    var AG = window.arenagamer || {};

    // --- Tabs ---
    $(document).on('click', '.ag-tab', function(e) {
        e.preventDefault();
        var tab = $(this).data('tab');
        var container = $(this).closest('.arenagamer-auth, .arenagamer-dashboard, .ag-dash-tabs').parent();

        $(this).siblings('.ag-tab').removeClass('ag-tab-active');
        $(this).addClass('ag-tab-active');

        container.find('.ag-tab-content').removeClass('ag-active');
        container.find('.ag-tab-' + tab).addClass('ag-active');
    });

    // --- Login ---
    $(document).on('submit', '#ag-login-form', function(e) {
        e.preventDefault();
        var form = $(this);
        var btn = form.find('button[type="submit"]');
        var msg = $('#ag-login-message');

        btn.prop('disabled', true).text(AG.i18n.loading);
        msg.html('');

        $.ajax({
            url: AG.ajax_url,
            type: 'POST',
            data: {
                action: 'arenagamer_login',
                nonce: AG.nonce,
                email: form.find('[name="email"]').val(),
                password: form.find('[name="password"]').val()
            },
            success: function(res) {
                if (res.success) {
                    msg.html('<span class="success">' + res.data.message + '</span>');
                    setTimeout(function() { location.reload(); }, 500);
                } else {
                    msg.html('<span class="error">' + res.data.message + '</span>');
                }
            },
            error: function() {
                msg.html('<span class="error">' + AG.i18n.error + '</span>');
            },
            complete: function() {
                btn.prop('disabled', false).text('Entrar');
            }
        });
    });

    // --- Register ---
    $(document).on('submit', '#ag-register-form', function(e) {
        e.preventDefault();
        var form = $(this);
        var btn = form.find('button[type="submit"]');
        var msg = $('#ag-register-message');

        btn.prop('disabled', true).text(AG.i18n.loading);
        msg.html('');

        $.ajax({
            url: AG.ajax_url,
            type: 'POST',
            data: {
                action: 'arenagamer_register',
                nonce: AG.nonce,
                firstName: form.find('[name="firstName"]').val(),
                lastName: form.find('[name="lastName"]').val(),
                username: form.find('[name="username"]').val(),
                email: form.find('[name="email"]').val(),
                password: form.find('[name="password"]').val()
            },
            success: function(res) {
                if (res.success) {
                    msg.html('<span class="success">' + res.data.message + '</span>');
                    setTimeout(function() { location.reload(); }, 500);
                } else {
                    msg.html('<span class="error">' + res.data.message + '</span>');
                }
            },
            error: function() {
                msg.html('<span class="error">' + AG.i18n.error + '</span>');
            },
            complete: function() {
                btn.prop('disabled', false).text('Criar Conta');
            }
        });
    });

    // --- Join Tournament ---
    $(document).on('submit', '#ag-join-form', function(e) {
        e.preventDefault();

        if (!confirm(AG.i18n.confirm_join)) return;

        var form = $(this);
        var btn = form.find('button[type="submit"]');
        btn.prop('disabled', true).text(AG.i18n.loading);

        var windows = [];
        form.find('[name="windows[]"]:checked').each(function() {
            windows.push($(this).val());
        });

        var data = {
            action: 'arenagamer_join_tournament',
            nonce: AG.nonce,
            slug: form.find('[name="slug"]').val(),
            windows: windows
        };

        var teamId = form.find('[name="team_id"]').val();
        if (teamId) {
            data.team_id = teamId;
        }

        $.ajax({
            url: AG.ajax_url,
            type: 'POST',
            data: data,
            success: function(res) {
                if (res.success) {
                    alert(res.data.message);
                    location.reload();
                } else {
                    alert(res.data.message);
                }
            },
            error: function() {
                alert(AG.i18n.error);
            },
            complete: function() {
                btn.prop('disabled', false).text('Inscrever-se no Torneio');
            }
        });
    });

    // --- Create Team ---
    $(document).on('submit', '#ag-create-team-form', function(e) {
        e.preventDefault();
        var form = $(this);
        var btn = form.find('button[type="submit"]');
        var msg = $('#ag-team-message');

        btn.prop('disabled', true);
        msg.html('');

        $.ajax({
            url: AG.ajax_url,
            type: 'POST',
            data: {
                action: 'arenagamer_create_team',
                nonce: AG.nonce,
                name: form.find('[name="name"]').val(),
                tag: form.find('[name="tag"]').val()
            },
            success: function(res) {
                if (res.success) {
                    msg.html('<span class="success">' + res.data.message + '</span>');
                    setTimeout(function() { location.reload(); }, 500);
                } else {
                    msg.html('<span class="error">' + res.data.message + '</span>');
                }
            },
            error: function() {
                msg.html('<span class="error">' + AG.i18n.error + '</span>');
            },
            complete: function() {
                btn.prop('disabled', false);
            }
        });
    });

    // --- Logout ---
    $(document).on('click', '#ag-logout', function(e) {
        e.preventDefault();
        // Clear session via a simple page reload after clearing cookie
        document.cookie = 'arenagamer_logged_out=1;path=/;max-age=5';
        location.reload();
    });

    // --- Load team selector on tournament detail ---
    $(function() {
        var teamSelect = $('#ag-team-select');
        if (teamSelect.length) {
            $.ajax({
                url: AG.ajax_url,
                type: 'POST',
                data: {
                    action: 'arenagamer_my_teams',
                    nonce: AG.nonce
                },
                success: function(res) {
                    teamSelect.empty();
                    if (res.success && res.data && res.data.data) {
                        teamSelect.append('<option value="">' + 'Selecione...' + '</option>');
                        $.each(res.data.data, function(_, team) {
                            teamSelect.append('<option value="' + team.id + '">' + team.name + '</option>');
                        });
                    } else {
                        teamSelect.append('<option value="">Nenhum time encontrado</option>');
                    }
                }
            });
        }
    });

})(jQuery);
