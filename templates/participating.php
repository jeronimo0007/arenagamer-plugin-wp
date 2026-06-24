<?php
/** @var string $ag_view */
/** @var string $ag_title */
/** @var string $ag_subtitle */

$tabs = [
    'meus-torneios' => 'Meus torneios',
    'partidas'      => 'Minhas partidas',
];
$active_view = $ag_view ?? 'meus-torneios';
$is_partidas = ($active_view === 'partidas');
?>
<?php echo AG_Theme::client_open('participando', ['data-ag-view' => $active_view]); ?>
    <div class="ag-header">
        <h2 class="ag-title"><?php echo esc_html($ag_title ?? 'Participando'); ?></h2>
        <?php if (!empty($ag_subtitle)) : ?>
        <p class="ag-subtitle"><?php echo esc_html($ag_subtitle); ?></p>
        <?php endif; ?>
    </div>

    <div class="vs-tab-nav ag-tournament-tabs">
        <ul class="nav nav-tabs" role="tablist" aria-label="Área do participante">
            <?php foreach ($tabs as $view => $label) : ?>
            <li class="nav-item" role="presentation">
                <button
                    type="button"
                    class="nav-link<?php echo ($active_view === $view) ? ' active' : ''; ?>"
                    data-ag-participating-view="<?php echo esc_attr($view); ?>"
                    role="tab"
                    aria-selected="<?php echo ($active_view === $view) ? 'true' : 'false'; ?>"
                ><?php echo esc_html($label); ?></button>
            </li>
            <?php endforeach; ?>
        </ul>
    </div>

    <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
    <div class="ag-loading" data-ag-loading>Carregando…</div>

    <div class="ag-participating-panel" data-ag-participating-panel="meus-torneios"<?php echo $is_partidas ? ' hidden' : ''; ?>>
        <div class="game ag-tournament-list">
            <div class="container-fluid px-0">
                <div class="ag-grid ag-tournament-grid" data-ag-list hidden></div>
            </div>
        </div>
        <nav class="ag-pagination" data-ag-pagination hidden aria-label="Paginação de torneios"></nav>
        <p class="ag-empty" data-ag-empty hidden>Você ainda não participa de nenhum torneio.</p>
    </div>

    <div class="ag-participating-panel" data-ag-participating-panel="partidas"<?php echo $is_partidas ? '' : ' hidden'; ?>>
        <div data-ag-matches hidden></div>
        <p class="ag-empty" data-ag-empty-partidas hidden>Nenhuma partida encontrada.</p>
    </div>
</div>
