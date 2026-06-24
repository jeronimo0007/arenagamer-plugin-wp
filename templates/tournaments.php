<?php
/** @var string $ag_view */
/** @var string $ag_filter */
/** @var string $ag_title */
/** @var string $ag_subtitle */

$tabs = [
    'ALL'               => 'Todos',
    'REGISTRATION_OPEN' => 'Inscrições abertas',
    'UPCOMING'          => 'Previstos',
    'IN_PROGRESS'       => 'Em andamento',
    'FINISHED'          => 'Finalizados',
    'CANCELLED'         => 'Cancelados',
];
$active_filter = $ag_filter ?? 'REGISTRATION_OPEN';
?>
<?php echo AG_Theme::client_open('torneios', [
    'data-ag-view'          => $ag_view ?? 'abertos',
    'data-ag-active-filter' => $active_filter,
]); ?>
    <div class="vs-tab-nav ag-tournament-tabs">
        <ul class="nav nav-tabs" role="tablist" aria-label="Filtrar torneios">
            <?php foreach ($tabs as $filter => $label) : ?>
            <li class="nav-item" role="presentation">
                <button
                    type="button"
                    class="nav-link<?php echo ($active_filter === (string) $filter) ? ' active' : ''; ?>"
                    data-ag-tab
                    data-ag-tab-filter="<?php echo esc_attr($filter); ?>"
                    role="tab"
                    aria-selected="<?php echo ($active_filter === (string) $filter) ? 'true' : 'false'; ?>"
                ><?php echo esc_html($label); ?></button>
            </li>
            <?php endforeach; ?>
        </ul>
    </div>

    <div class="ag-alert ag-alert--error" data-ag-alert hidden></div>
    <div class="ag-loading" data-ag-loading>Carregando torneios…</div>

    <div class="game ag-tournament-list">
        <div class="container-fluid px-0">
            <div class="ag-grid ag-tournament-grid" data-ag-list hidden></div>
        </div>
    </div>
    <nav class="ag-pagination" data-ag-pagination hidden aria-label="Paginação de torneios"></nav>
    <p class="ag-empty" data-ag-empty hidden>Nenhum torneio encontrado.</p>
</div>
