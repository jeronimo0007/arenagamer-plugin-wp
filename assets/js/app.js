(function () {
    'use strict';

    const api = window.ArenaGamerAPI;
    const cfg = window.ArenaGamerConfig || {};

    if (!api) return;

    const STATUS_LABELS = {
        DRAFT: 'Rascunho',
        UPCOMING: 'Previsto',
        REGISTRATION_OPEN: 'Inscrições abertas',
        REGISTRATION_CLOSED: 'Inscrições encerradas',
        IN_PROGRESS: 'Em andamento',
        FINISHED: 'Finalizado',
        COMPLETED: 'Finalizado',
        CANCELLED: 'Cancelado',
    };

    const MATCH_STATUS = {
        SCHEDULED: 'Agendada',
        IN_PROGRESS: 'Em jogo',
        COMPLETED: 'Finalizada',
        CANCELLED: 'Cancelada',
        WALKOVER: 'W.O.',
    };

    const TYPE_LABELS = {
        SINGLE_ELIMINATION: 'Eliminação simples',
        DOUBLE_ELIMINATION: 'Eliminação dupla',
        ROUND_ROBIN: 'Round robin',
        GROUP_STAGE: 'Fase de grupos',
        SWISS: 'Suíço',
    };

    const VISIBILITY_LABELS = {
        PUBLIC: 'Público',
        PRIVATE: 'Privado',
    };

    const PRIZE_TYPE_LABELS = {
        AUTOMATIC: 'Automático',
        MANUAL: 'Manual',
    };

    const FORMAT_LABELS = {
        SOLO: 'Individual',
        TEAM: 'Times',
    };

    const PROTECTED_PAGES = [
        'participando', 'meus-torneios', 'creditos', 'comprar-creditos', 'carteira',
        'partidas', 'times', 'perfil', 'painel', 'dashboard',
    ];

    function $(sel, root) {
        return (root || document).querySelector(sel);
    }

    function $$(sel, root) {
        return Array.from((root || document).querySelectorAll(sel));
    }

    function formatCredits(value) {
        const n = parseFloat(value);
        if (isNaN(n)) return '—';
        return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function formatDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleString('pt-BR');
    }

    function showAlert(el, message, type) {
        if (!el) return;
        el.textContent = message;
        el.className = 'ag-alert ag-alert--' + (type || 'error');
        el.hidden = !message;
    }

    function hideAlert(el) {
        if (el) el.hidden = true;
    }

    function setLoading(root, loading) {
        const el = $('[data-ag-loading]', root);
        if (el) el.hidden = !loading;
    }

    function extractPageContent(res) {
        if (Array.isArray(res?.data?.content)) return res.data.content;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.content)) return res.content;
        if (Array.isArray(res)) return res;
        return [];
    }

    function isLoginPage() {
        const loginUrl = (cfg.loginUrl || '').replace(/\/$/, '');
        if (!loginUrl) return false;
        return window.location.href.replace(/\/$/, '').split('?')[0] === loginUrl;
    }

    function redirectAfterAuth() {
        const url = cfg.dashboardUrl || cfg.homeUrl;
        if (url) window.location.href = url;
        else window.location.reload();
    }

    function requireAuth(root) {
        const page = root.dataset.agPage;
        if (!PROTECTED_PAGES.includes(page)) return true;
        if (api.isLoggedIn()) return true;
        showAlert($('[data-ag-alert]', root), cfg.i18n?.loginRequired || 'Faça login para continuar.');
        if (cfg.loginUrl && !isLoginPage()) {
            setTimeout(() => { window.location.href = cfg.loginUrl; }, 1500);
        }
        return false;
    }

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escapeAttr(str) {
        return escapeHtml(str).replace(/'/g, '&#39;');
    }

    function tournamentDetailHref(slug) {
        if (!slug) return '';
        let base = (cfg.tournamentUrl || '').trim();
        if (!base && cfg.homeUrl) {
            base = cfg.homeUrl.replace(/\/$/, '') + '/detalhes-toneio/';
        }
        if (!base) return '';
        if (base.includes('{slug}')) {
            return base.replace('{slug}', encodeURIComponent(slug));
        }
        const encoded = encodeURIComponent(slug);
        if (base.includes('?')) {
            if (base.endsWith('=')) return base + encoded;
            const joiner = base.includes('slug=') ? '' : (base.endsWith('?') || base.endsWith('&') ? '' : '&');
            return base + joiner + (base.includes('slug=') ? encoded : 'slug=' + encoded);
        }
        const pathBase = base.replace(/\/$/, '') + '/';
        return pathBase + 'slug=' + encoded;
    }

    function parseSlugFromLocation() {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('slug');
        if (fromQuery) return fromQuery.trim();

        const pathname = window.location.pathname || '';
        const slugEq = pathname.match(/\/slug=([^/]+)\/?$/i);
        if (slugEq) return decodeURIComponent(slugEq[1]).trim();

        const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
        if (parts.length >= 2) {
            const last = parts[parts.length - 1];
            const prev = parts[parts.length - 2];
            if (last.startsWith('slug=')) {
                return decodeURIComponent(last.slice(5)).trim();
            }
            if (prev.includes('detalhes') || prev.includes('torneio') || prev.includes('toneio')) {
                return decodeURIComponent(last).trim();
            }
        }
        return '';
    }

    function normalizeSlug(slug) {
        return String(slug || '').trim().toLowerCase().replace(/_/g, '-');
    }

    function tournamentNameHtml(t) {
        const href = tournamentDetailHref(t.slug);
        const name = escapeHtml(t.name);
        if (!href) return name;
        return `<a href="${escapeAttr(href)}" class="ag-tournament-card__title-link">${name}</a>`;
    }

    function tournamentDetailButton(slug) {
        const href = tournamentDetailHref(slug);
        if (!href) return '';
        return `<a href="${escapeAttr(href)}" class="ag-btn ag-btn--ghost ag-btn--sm">Detalhes</a>`;
    }

    const listLoadSeq = new WeakMap();
    const tournamentListState = new WeakMap();
    const TOURNAMENTS_PAGE_SIZE = 10;

    function findPaginationEl(root, listEl) {
        const panel = listEl?.closest('[data-ag-participating-panel]');
        if (panel) {
            return $('[data-ag-pagination]', panel);
        }
        return $('[data-ag-pagination]', root);
    }

    function renderPaginationControls(paginationEl, currentPage, totalPages, totalItems) {
        if (!paginationEl) return;
        if (totalPages <= 1) {
            paginationEl.hidden = true;
            paginationEl.innerHTML = '';
            return;
        }

        paginationEl.hidden = false;
        const start = (currentPage - 1) * TOURNAMENTS_PAGE_SIZE + 1;
        const end = Math.min(currentPage * TOURNAMENTS_PAGE_SIZE, totalItems);

        let pagesHtml = '';
        for (let i = 1; i <= totalPages; i++) {
            pagesHtml += `<li>
                <button type="button" class="ag-pagination__btn${i === currentPage ? ' ag-pagination__btn--active' : ''}" data-ag-page="${i}" aria-label="Página ${i}"${i === currentPage ? ' aria-current="page"' : ''}>${i}</button>
            </li>`;
        }

        paginationEl.innerHTML = `
            <p class="ag-pagination__info">Mostrando ${start}–${end} de ${totalItems}</p>
            <ul class="ag-pagination__list">
                <li><button type="button" class="ag-pagination__btn ag-pagination__btn--nav" data-ag-page-prev${currentPage <= 1 ? ' disabled' : ''}>Anterior</button></li>
                ${pagesHtml}
                <li><button type="button" class="ag-pagination__btn ag-pagination__btn--nav" data-ag-page-next${currentPage >= totalPages ? ' disabled' : ''}>Próxima</button></li>
            </ul>`;
    }

    function extractTournamentSlug(t) {
        if (!t) return '';
        const raw = t.slug
            ?? t.tournamentSlug
            ?? t.tournament_slug
            ?? t.tournament?.slug
            ?? t.tournament?.tournamentSlug
            ?? '';
        return normalizeSlug(raw);
    }

    function isTruthyJoinFlag(value) {
        return value === true || value === 1 || value === '1' || value === 'true';
    }

    function isRegistrationOpen(t) {
        return String(t?.status || '').toUpperCase() === 'REGISTRATION_OPEN';
    }

    function isUserJoinedInTournament(t, joinedSlugs) {
        if (!t) return false;
        if (isTruthyJoinFlag(t.joined) || isTruthyJoinFlag(t.alreadyJoined) || isTruthyJoinFlag(t.isJoined)) {
            return true;
        }
        const slug = extractTournamentSlug(t);
        if (!slug || !(joinedSlugs instanceof Set)) return false;
        return joinedSlugs.has(slug);
    }

    function renderPaginatedTournamentList(root, listEl, items, page, cardOptions) {
        const paginationEl = findPaginationEl(root, listEl);
        const totalPages = Math.max(1, Math.ceil(items.length / TOURNAMENTS_PAGE_SIZE));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const start = (safePage - 1) * TOURNAMENTS_PAGE_SIZE;
        const slice = items.slice(start, start + TOURNAMENTS_PAGE_SIZE);
        const joinedSlugs = cardOptions?.joinedSlugs;

        listEl.innerHTML = slice.map((t) => tournamentCard(t, {
            ...cardOptions,
            joinedSlugs: joinedSlugs instanceof Set ? joinedSlugs : new Set(),
            joined: isUserJoinedInTournament(t, joinedSlugs),
        })).join('');
        listEl.hidden = false;
        bindJoinButtons(listEl, root);
        renderPaginationControls(paginationEl, safePage, totalPages, items.length);

        tournamentListState.set(listEl, {
            items,
            page: safePage,
            cardOptions,
            root,
        });

        return safePage;
    }

    function bindPaginationOnce(root, listEl) {
        const paginationEl = findPaginationEl(root, listEl);
        if (!paginationEl || paginationEl.dataset.agPaginationBound) return;
        paginationEl.dataset.agPaginationBound = '1';

        paginationEl.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-ag-page], [data-ag-page-prev], [data-ag-page-next]');
            if (!btn || btn.disabled) return;

            const state = tournamentListState.get(listEl);
            if (!state?.items?.length) return;

            let nextPage = state.page || 1;
            if (btn.hasAttribute('data-ag-page-prev')) {
                nextPage -= 1;
            } else if (btn.hasAttribute('data-ag-page-next')) {
                nextPage += 1;
            } else {
                nextPage = parseInt(btn.dataset.agPage, 10);
            }

            renderPaginatedTournamentList(state.root, listEl, state.items, nextPage, state.cardOptions);
            listEl.closest('.ag-tournament-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function tournamentMatchesStatus(t, filter) {
        const status = String(t.status || '').toUpperCase();
        if (filter === 'ALL' || !filter) return true;
        if (filter === 'FINISHED') {
            return status === 'FINISHED' || status === 'COMPLETED';
        }
        return status === filter;
    }

    function filterItemsByStatus(items, filter) {
        if (filter === 'ALL' || !filter) return items;
        if (filter === 'UPCOMING') {
            return items.filter((t) => isUpcomingTournament(t));
        }
        return items.filter((t) => tournamentMatchesStatus(t, filter));
    }

    function formatOptionalDate(iso) {
        return iso ? formatDate(iso) : '—';
    }

    function formatEntryFee(value) {
        return parseFloat(value) > 0 ? formatCredits(value) + ' créditos' : 'Grátis';
    }

    function formatPercent(value) {
        const n = parseFloat(value);
        if (isNaN(n)) return '—';
        return n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '%';
    }

    function formatText(value) {
        const text = value == null ? '' : String(value).trim();
        return text !== '' ? escapeHtml(text) : '—';
    }

    function detailItem(label, value, fullWidth) {
        let display;
        if (typeof value === 'string' && value.includes('<')) {
            display = value;
        } else {
            display = formatText(value);
        }
        return cardMetaItem(label, display, fullWidth);
    }

    function tournamentCardDateRow(t) {
        const status = String(t.status || '').toUpperCase();

        if (status === 'FINISHED' || status === 'COMPLETED' || status === 'CANCELLED') {
            return '';
        }

        if (status === 'DRAFT' || status === 'UPCOMING') {
            if (!t.registrationOpensAt) return '';
            return cardMetaItem('Previsão de abertura', formatOptionalDate(t.registrationOpensAt), true);
        }

        if (status === 'IN_PROGRESS') {
            if (!t.expectedEndDate) return '';
            return cardMetaItem('Previsão de finalização', formatOptionalDate(t.expectedEndDate), true);
        }

        if (status === 'REGISTRATION_OPEN') {
            if (!t.startDate) return '';
            return cardMetaItem('Previsão de início', formatOptionalDate(t.startDate), true);
        }

        return '';
    }

    function tournamentDetailDateItems(t) {
        const status = String(t.status || '').toUpperCase();
        const items = [];

        if (status === 'DRAFT' || status === 'UPCOMING') {
            items.push(detailItem('Previsão de abertura', formatOptionalDate(t.registrationOpensAt)));
        } else if (status === 'IN_PROGRESS') {
            items.push(detailItem('Previsão de finalização', formatOptionalDate(t.expectedEndDate)));
        } else if (status === 'REGISTRATION_OPEN') {
            items.push(detailItem('Previsão de início', formatOptionalDate(t.startDate)));
        }

        return items;
    }

    function tournamentLogoUrl(t) {
        return String(t.logo_image_url ?? t.logoImageUrl ?? '').trim();
    }

    function tournamentCoverUrl(t) {
        return String(t.coverImageUrl ?? t.cover_image_url ?? '').trim();
    }

    function tournamentGameImageUrl(t) {
        return String(t.gameImageUrl ?? t.game_image_url ?? '').trim();
    }

    function tournamentDetailBanner(t) {
        const url = tournamentCoverUrl(t);
        if (url) {
            return `<img src="${escapeAttr(url)}" alt="" class="ag-tournament-detail__banner-img" loading="lazy">`;
        }
        return '<div class="ag-tournament-detail__banner-fallback" aria-hidden="true"><span class="ag-tournament-detail__banner-pattern"></span></div>';
    }

    function tournamentDetailIdentity(t) {
        const logoUrl = tournamentLogoUrl(t);
        const gameUrl = tournamentGameImageUrl(t);

        let logoHtml;
        if (logoUrl) {
            logoHtml = `<img src="${escapeAttr(logoUrl)}" alt="" class="ag-tournament-detail__logo" loading="lazy">`;
        } else {
            logoHtml = '<span class="ag-tournament-detail__logo-fallback" aria-hidden="true">🏆</span>';
        }

        const gameThumb = gameUrl
            ? `<img src="${escapeAttr(gameUrl)}" alt="" class="ag-tournament-detail__game-thumb" loading="lazy">`
            : '';

        return `<div class="ag-tournament-detail__identity-box">${logoHtml}${gameThumb}</div>`;
    }

    function detailSection(title, contentHtml) {
        if (!contentHtml || !String(contentHtml).trim()) return '';
        return `<section class="ag-detail-section">
            <h3 class="ag-detail-section__title"><span>${escapeHtml(title)}</span></h3>
            <div class="ag-detail-section__content">${contentHtml}</div>
        </section>`;
    }

    function detailStatCard(label, value, mod) {
        const display = value == null || value === ''
            ? '—'
            : (typeof value === 'string' && value.includes('<') ? value : escapeHtml(String(value)));
        const modClass = mod ? ` ag-detail-stat--${mod}` : '';
        return `<div class="ag-detail-stat${modClass}" role="listitem">
            <span class="ag-detail-stat__label">${escapeHtml(label)}</span>
            <span class="ag-detail-stat__value">${display}</span>
        </div>`;
    }

    function renderTournamentDetailStats(t) {
        const prize = t.prizePool != null
            ? formatCredits(t.prizePool) + ' créditos'
            : '—';
        return [
            detailStatCard('Taxa de inscrição', formatEntryFee(t.entryFeeCredits), 'fee'),
            detailStatCard('Inscritos', formatParticipants(t.participantCount, t.participantsLimit), 'players'),
            detailStatCard('Premiação', prize, 'prize'),
            detailStatCard('Formato', FORMAT_LABELS[t.format] || t.format, 'format'),
        ].join('');
    }

    function renderTournamentDetailDates(t) {
        const datesGrid = [
            detailItem('Abertura das inscrições', formatOptionalDate(t.registrationOpensAt)),
            detailItem('Prazo de inscrição', formatOptionalDate(t.registrationDeadline)),
            detailItem('Início previsto', formatOptionalDate(t.startDate)),
            detailItem('Previsão de término', formatOptionalDate(t.expectedEndDate)),
            detailItem('Criado em', formatOptionalDate(t.createdAt)),
        ].join('');

        return detailSection('Datas', `<div class="ag-tournament-meta ag-detail-section__grid ag-detail-section__grid--dates">${datesGrid}</div>`);
    }

    function renderTournamentDetailBody(t) {
        const rules = t.rules ? `<p class="ag-detail-prose">${escapeHtml(t.rules).replace(/\n/g, '<br>')}</p>` : '';
        const description = t.description ? `<p class="ag-detail-prose">${escapeHtml(t.description).replace(/\n/g, '<br>')}</p>` : '';
        const presetLabel = [t.presetName, t.presetId != null ? `#${t.presetId}` : ''].filter(Boolean).join(' · ') || '—';

        const generalGrid = [
            detailItem('ID', t.id),
            detailItem('Slug', t.slug),
            detailItem('Jogo', tournamentGameName(t) || '—'),
            detailItem('Organizador', t.ownerName),
            detailItem('Tipo', TYPE_LABELS[t.type] || t.type),
            detailItem('Formato', FORMAT_LABELS[t.format] || t.format),
            detailItem('Visibilidade', VISIBILITY_LABELS[t.visibility] || t.visibility),
            detailItem('Status', statusBadge(t.status)),
            detailItem('Preset', presetLabel),
        ].join('');

        const participationGrid = [
            detailItem('Limite de participantes', t.participantsLimit ?? '—'),
            detailItem('Mínimo de participantes', t.minParticipants ?? '—'),
            detailItem('Participantes inscritos', t.participantCount ?? '—'),
            detailItem('Grupos', t.groupsCount ?? '—'),
        ].join('');

        const prizesGrid = [
            detailItem('Taxa da plataforma', formatPercent(t.feePercentage)),
            detailItem('Tipo de prêmio', PRIZE_TYPE_LABELS[t.prizeType] || t.prizeType),
            detailItem('Premiação', t.prizePool != null ? formatCredits(t.prizePool) + ' créditos' : '—'),
            detailItem('Melhor de', t.bestOf ?? '—'),
        ].join('');

        const aboutHtml = [
            description ? detailItem('Descrição', description, true) : '',
            rules ? detailItem('Regras', rules, true) : '',
        ].filter(Boolean).join('');

        return [
            detailSection('Informações', `<div class="ag-tournament-meta ag-detail-section__grid">${generalGrid}</div>`),
            detailSection('Participação', `<div class="ag-tournament-meta ag-detail-section__grid">${participationGrid}</div>`),
            detailSection('Prêmios & taxas', `<div class="ag-tournament-meta ag-detail-section__grid">${prizesGrid}</div>`),
            aboutHtml ? detailSection('Sobre o torneio', `<div class="ag-tournament-meta ag-detail-section__grid ag-detail-section__grid--prose">${aboutHtml}</div>`) : '',
        ].filter(Boolean).join('');
    }

    function renderTournamentMedia(t) {
        const links = [];
        if (t.youtubeUrl) {
            links.push(`<a href="${escapeAttr(t.youtubeUrl)}" class="ag-detail-stream-link ag-detail-stream-link--youtube" target="_blank" rel="noopener"><span class="ag-detail-stream-link__icon" aria-hidden="true">▶</span> YouTube</a>`);
        }
        if (t.twitchUrl) {
            links.push(`<a href="${escapeAttr(t.twitchUrl)}" class="ag-detail-stream-link ag-detail-stream-link--twitch" target="_blank" rel="noopener"><span class="ag-detail-stream-link__icon" aria-hidden="true">◉</span> Twitch</a>`);
        }
        if (!links.length) return '';
        return `<div class="ag-detail-section ag-detail-section--streams">
            <h3 class="ag-detail-section__title"><span>Transmissão</span></h3>
            <div class="ag-tournament-media__links">${links.join('')}</div>
        </div>`;
    }

    function rodaCompareSvg() {
        return `<svg width="33" height="21" viewBox="0 0 33 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M1.22234 6.32538H7.89629C9.08195 6.32538 10.1454 6.78295 10.9032 7.50837C11.3433 6.03521 12.1745 4.68481 13.3479 3.5353C11.8444 2.48623 9.94981 1.8501 7.90851 1.8501H1.22234C0.550051 1.8501 0 2.35231 0 2.96613V5.19819C0 5.83432 0.550051 6.32538 1.22234 6.32538Z" fill="#F7F5E8"/>
            <path d="M32.6973 15.5216L26.0844 12.0396C25.681 11.8275 25.1677 12.0954 25.1677 12.5194V13.7694H20.9751C19.7894 13.7694 18.726 13.3118 17.9681 12.5864C17.5281 14.0596 16.6969 15.41 15.5234 16.5595C17.0269 17.6085 18.9215 18.2447 20.9628 18.2447H25.1677V19.4946C25.1677 19.9187 25.681 20.1977 26.0844 19.9745L32.6973 16.4925C33.1006 16.2805 33.1006 15.7448 32.6973 15.5216Z" fill="#F7F5E8"/>
            <path d="M32.6975 4.5843L26.0846 8.06631C25.9869 8.12211 25.8768 8.14443 25.7791 8.14443C25.4612 8.14443 25.1679 7.91007 25.1679 7.58642V6.33647H20.9753C18.7262 6.33647 16.8805 7.98819 16.8805 10.0305C16.8927 14.5616 12.8712 18.2445 7.90851 18.2445H1.22234C0.550051 18.2445 0 17.7423 0 17.1285V14.8964C0 14.2826 0.550051 13.7804 1.22234 13.7804H7.89629C10.1332 13.7804 11.9911 12.1287 11.9911 10.0863C11.9789 5.55525 16.0004 1.87235 20.9631 1.87235H25.1679V0.611237C25.1679 0.287589 25.4612 0.0532227 25.7791 0.0532227C25.8768 0.0532227 25.9869 0.0755429 26.0846 0.131344L32.6975 3.61336C33.1008 3.8254 33.1008 4.3611 32.6975 4.5843Z" fill="#F7F5E8"/>
        </svg>`;
    }

    function rodaArrowSvg(fill = '#A6D719') {
        return `<svg width="19" height="14" viewBox="0 0 19 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M17.25 5.66001C14.812 5.66001 12.59 3.439 12.59 1V0H10.59V1C10.59 2.774 11.368 4.438 12.589 5.66001H0.25V7.66001H12.589C11.368 8.88201 10.59 10.546 10.59 12.32V13.32H12.59V12.32C12.59 9.88101 14.812 7.66001 17.25 7.66001H18.25V5.66001H17.25Z" fill="${fill}"/>
        </svg>`;
    }

    function joinActionLabel() {
        return `Faça sua inscrição<span class="ag-game-card__join-enter">${rodaArrowSvg('#8b5cad')}</span>`;
    }

    function joinActionLabelDetail() {
        return `Faça sua inscrição<span class="ag-game-card__join-enter">${rodaArrowSvg('#a6d719')}</span>`;
    }

    function updateDetailEnrollmentUI(root, slug, t, isJoined, registrationOpen) {
        const joinBtn = $('[data-ag-join]', root);
        const joinedBadge = $('[data-ag-joined]', root);
        const notJoinedBadge = $('[data-ag-not-joined]', root);
        const enrollmentStatus = $('[data-ag-enrollment-status]', root);
        const detailFooter = $('[data-ag-detail-footer]', root);

        if (detailFooter) detailFooter.hidden = false;

        if (enrollmentStatus) {
            enrollmentStatus.hidden = false;
            enrollmentStatus.classList.remove('ag-enrollment-status--joined', 'ag-enrollment-status--not-joined');
            if (isJoined) {
                enrollmentStatus.textContent = 'Já inscrito';
                enrollmentStatus.classList.add('ag-enrollment-status--joined');
            } else {
                enrollmentStatus.textContent = 'Não inscrito';
                enrollmentStatus.classList.add('ag-enrollment-status--not-joined');
            }
        }

        if (joinedBadge) joinedBadge.hidden = !isJoined;
        if (notJoinedBadge) notJoinedBadge.hidden = isJoined;

        if (!joinBtn) return;

        joinBtn.hidden = true;
        joinBtn.onclick = null;
        joinBtn.classList.remove('ag-game-card__join--pulse');

        if (isJoined) return;

        joinBtn.hidden = false;

        if (api.isLoggedIn()) {
            joinBtn.className = 'game-card__link ag-game-card__join ag-game-card__join--detail';
            joinBtn.innerHTML = joinActionLabelDetail();
            if (registrationOpen) {
                joinBtn.classList.add('ag-game-card__join--pulse');
                joinBtn.onclick = async (e) => {
                    e.preventDefault();
                    await joinFromList(slug, t.format, root);
                };
            } else {
                joinBtn.onclick = (e) => {
                    e.preventDefault();
                    showAlert($('[data-ag-alert]', root), 'As inscrições não estão abertas para este torneio.');
                };
            }
        } else {
            joinBtn.className = 'game-card__link ag-game-card__login ag-game-card__join--detail';
            joinBtn.textContent = 'Entrar para se inscrever';
            joinBtn.onclick = (e) => {
                e.preventDefault();
                if (cfg.loginUrl) {
                    window.location.href = cfg.loginUrl;
                } else {
                    showAlert($('[data-ag-alert]', root), cfg.i18n?.loginRequired || 'Faça login para continuar.');
                }
            };
        }
    }

    function isUpcomingTournament(t) {
        const status = String(t.status || '').toUpperCase();
        if (status === 'UPCOMING' || status === 'DRAFT') return true;
        if (t.expectedEndDate && status !== 'FINISHED' && status !== 'COMPLETED' && status !== 'CANCELLED') {
            return true;
        }
        return false;
    }

    function cardMetaItem(label, value, fullWidth) {
        const display = value == null || value === ''
            ? '—'
            : (typeof value === 'string' && value.includes('<') ? value : escapeHtml(String(value)));
        const cls = fullWidth ? ' ag-tournament-meta__item--full' : '';
        return `<div class="ag-tournament-meta__item${cls}">
            <span class="ag-tournament-meta__label">${escapeHtml(label)}</span>
            <span class="ag-tournament-meta__value">${display}</span>
        </div>`;
    }

    function statusBadge(status) {
        const label = STATUS_LABELS[status] || status || '—';
        const slug = String(status || 'unknown').toLowerCase().replace(/_/g, '-');
        return `<span class="ag-badge ag-badge--status ag-badge--${escapeAttr(slug)}">${escapeHtml(label)}</span>`;
    }

    function formatParticipants(count, limit) {
        const c = count == null ? '—' : String(count);
        const l = limit == null ? '—' : String(limit);
        return `${c} / ${l}`;
    }

    function tournamentGameName(t) {
        const name = t.game_name ?? t.gameName ?? '';
        return String(name).trim();
    }

    function cardMediaIdGameRow(t) {
        const gameName = tournamentGameName(t) || '—';
        const id = t.id == null || t.id === '' ? '—' : String(t.id);
        return `<div class="ag-tournament-media-row ag-tournament-media-row--id-game">
            <div class="ag-tournament-meta__item ag-tournament-meta__item--id">
                <span class="ag-tournament-meta__label">ID</span>
                <span class="ag-tournament-meta__value">${escapeHtml(id)}</span>
            </div>
            <div class="ag-tournament-meta__item ag-tournament-meta__item--game">
                <span class="ag-tournament-meta__label">Jogo</span>
                <span class="ag-tournament-meta__value">${escapeHtml(gameName)}</span>
            </div>
        </div>`;
    }

    function tournamentCardImage(t) {
        const logoUrl = tournamentLogoUrl(t);
        const gameUrl = tournamentGameImageUrl(t);

        let logoHtml;
        if (logoUrl) {
            logoHtml = `<img src="${escapeAttr(logoUrl)}" alt="" class="game-card__thumbnail ag-tournament-card__logo-img" loading="lazy">`;
        } else {
            logoHtml = '<span class="game-card__placeholder-icon" aria-hidden="true">🎮</span>';
        }

        const gameThumb = gameUrl
            ? `<img src="${escapeAttr(gameUrl)}" alt="" class="ag-tournament-card__game-thumb" loading="lazy">`
            : '';

        const placeholderClass = logoUrl ? '' : ' game-card__image--placeholder';

        return `<div class="game-card__image ag-tournament-card__image-wrap${placeholderClass}">${logoHtml}${gameThumb}</div>`;
    }

    function tournamentCard(t, options) {
        options = options || {};
        const detailUrl = tournamentDetailHref(t.slug);
        const typeLabel = TYPE_LABELS[t.type] || t.type || '—';
        const formatLabel = FORMAT_LABELS[t.format] || t.format || '—';
        const prizeLabel = PRIZE_TYPE_LABELS[t.prizeType] || t.prizeType || '—';
        const fee = formatEntryFee(t.entryFeeCredits);
        const feePct = formatPercent(t.feePercentage);
        const participants = formatParticipants(t.participantCount, t.participantsLimit);
        const dateRowHtml = tournamentCardDateRow(t);

        const titleInner = detailUrl
            ? `<a class="game-card__title--link" href="${escapeAttr(detailUrl)}">${escapeHtml(t.name || t.slug || 'Torneio')}</a>`
            : escapeHtml(t.name || t.slug || 'Torneio');

        const compareLink = detailUrl
            ? `<a class="game-card__compare" href="${escapeAttr(detailUrl)}" aria-label="Ver detalhes">${rodaCompareSvg()}</a>`
            : '';

        const metaHtml = [
            cardMetaItem('Taxa de inscrição', fee),
            cardMetaItem('Taxa da plataforma', feePct),
            cardMetaItem('Tipo de prêmio', prizeLabel),
            cardMetaItem('Formato', formatLabel),
            cardMetaItem('Participantes', participants),
            cardMetaItem('Limite de vagas', t.participantsLimit),
            dateRowHtml,
        ].filter(Boolean).join('');

        const mediaMetaHtml = [
            cardMediaIdGameRow(t),
            cardMetaItem('Slug', t.slug),
            cardMetaItem('Tipo', typeLabel),
        ].join('');

        let footerActions = '';
        const joinedSlugs = options.joinedSlugs instanceof Set ? options.joinedSlugs : new Set();
        const alreadyJoined = isUserJoinedInTournament(t, joinedSlugs);
        const registrationOpen = isRegistrationOpen(t);

        if (alreadyJoined) {
            footerActions += '<span class="ag-game-card__joined">Já inscrito</span>';
        } else if (registrationOpen && options.showJoin) {
            footerActions += `<a href="#" role="button" class="game-card__link ag-game-card__join ag-game-card__join--pulse" data-ag-join-slug="${escapeHtml(t.slug)}"${t.format && t.format !== 'SOLO' ? ` data-ag-format="${escapeHtml(t.format)}"` : ''}>${joinActionLabel()}</a>`;
        } else if (registrationOpen && cfg.loginUrl) {
            footerActions += `<a href="${escapeAttr(cfg.loginUrl)}" class="game-card__link ag-game-card__login">Entrar para se inscrever</a>`;
        }
        if (detailUrl) {
            footerActions += `<a href="${escapeAttr(detailUrl)}" class="game-card__link">Ver detalhes ${rodaArrowSvg()}</a>`;
        }

        const footer = footerActions
            ? `<div class="game-card__footer ag-game-card__footer">${footerActions}</div>`
            : '';

        const cardStateClass = alreadyJoined
            ? ' ag-tournament-card--joined'
            : ' ag-tournament-card--not-joined';

        return `
            <div class="ag-grid__cell">
                <div class="game-card game-card--style2 ag-tournament-card${cardStateClass}" data-slug="${escapeHtml(t.slug)}" data-id="${escapeHtml(String(t.id ?? ''))}"${alreadyJoined ? ' data-ag-joined="true"' : ''}>
                    <div class="game-card__content ag-tournament-card__content">
                        <div class="ag-tournament-card__media">
                            ${tournamentCardImage(t)}
                            <div class="ag-tournament-card__media-meta">${mediaMetaHtml}</div>
                        </div>
                        <div class="game-card__details ag-tournament-card__details">
                            <h2 class="game-card__title">
                                ${titleInner}
                                ${compareLink}
                            </h2>
                            <div class="ag-tournament-card__status-row">
                                ${statusBadge(t.status)}
                                ${alreadyJoined ? '<span class="ag-game-card__joined ag-game-card__joined--inline">Já inscrito</span>' : ''}
                            </div>
                            <div class="game-card__info ag-tournament-meta" role="list">${metaHtml}</div>
                        </div>
                    </div>
                    ${footer}
                </div>
            </div>`;
    }

    async function getJoinedSlugs() {
        if (!api.isLoggedIn()) return new Set();
        try {
            const res = await api.listMyJoined(0, 200);
            const slugs = new Set();
            extractPageContent(res).forEach((t) => {
                const slug = extractTournamentSlug(t);
                if (slug) slugs.add(slug);
            });
            return slugs;
        } catch {
            return new Set();
        }
    }

    const STATUS_FILTERS = ['REGISTRATION_OPEN', 'UPCOMING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'];

    const EMPTY_FILTER_MSG = {
        ALL: 'Nenhum torneio público disponível.',
        REGISTRATION_OPEN: 'Nenhum torneio com inscrições abertas no momento.',
        UPCOMING: 'Nenhum torneio previsto no momento.',
        IN_PROGRESS: 'Nenhum torneio em andamento no momento.',
        FINISHED: 'Nenhum torneio finalizado no momento.',
        CANCELLED: 'Nenhum torneio cancelado.',
    };

    async function fetchTournamentsByFilter(filter) {
        if (filter === 'ALL' || filter === 'UPCOMING') {
            const bySlug = new Map();
            const batches = await Promise.all(
                STATUS_FILTERS.map((status) => api.listPublicTournaments(0, 50, status))
            );
            batches.forEach((res) => {
                extractPageContent(res).forEach((t) => {
                    if (t?.slug) bySlug.set(t.slug, t);
                });
            });
            extractPageContent(await api.listPublicTournaments(0, 50, null)).forEach((t) => {
                if (t?.slug) bySlug.set(t.slug, t);
            });
            const all = Array.from(bySlug.values());
            return filter === 'UPCOMING' ? filterItemsByStatus(all, 'UPCOMING') : all;
        }

        return extractPageContent(await api.listPublicTournaments(0, 50, filter || null));
    }

    function setEmptyMessage(root, filter) {
        const empty = $('[data-ag-empty]', root);
        if (empty) {
            empty.textContent = EMPTY_FILTER_MSG[filter] || EMPTY_FILTER_MSG.ALL;
        }
    }

    function bindJoinButtons(list, root) {
        $$('[data-ag-join-slug]', list).forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                joinFromList(btn.dataset.agJoinSlug, btn.dataset.agFormat, root);
            });
        });
    }

    async function loadTournamentList(root, filter) {
        const list = $('[data-ag-list]', root);
        const empty = $('[data-ag-empty]', root);
        const alert = $('[data-ag-alert]', root);
        const paginationEl = findPaginationEl(root, list);
        const seq = (listLoadSeq.get(root) || 0) + 1;
        listLoadSeq.set(root, seq);

        bindPaginationOnce(root, list);

        hideAlert(alert);
        setLoading(root, true);
        setEmptyMessage(root, filter);
        if (list) {
            list.innerHTML = '';
            list.hidden = true;
        }
        if (empty) empty.hidden = true;
        if (paginationEl) {
            paginationEl.hidden = true;
            paginationEl.innerHTML = '';
        }

        try {
            let items = await fetchTournamentsByFilter(filter);
            if (listLoadSeq.get(root) !== seq) return;

            items = filterItemsByStatus(items, filter);

            const joinedSlugs = api.isLoggedIn() ? await getJoinedSlugs() : new Set();

            if (listLoadSeq.get(root) !== seq) return;

            if (!items.length) {
                if (list) {
                    list.innerHTML = '';
                    list.hidden = true;
                }
                if (empty) empty.hidden = false;
                return;
            }

            if (empty) empty.hidden = true;
            if (list) {
                renderPaginatedTournamentList(root, list, items, 1, {
                    showJoin: api.isLoggedIn(),
                    joinedSlugs: joinedSlugs instanceof Set ? joinedSlugs : new Set(),
                });
            }
        } catch (err) {
            if (listLoadSeq.get(root) !== seq) return;
            showAlert(alert, err.message);
        } finally {
            if (listLoadSeq.get(root) === seq) {
                setLoading(root, false);
            }
        }
    }

    async function joinFromList(slug, format, root) {
        if (!api.isLoggedIn()) {
            showAlert($('[data-ag-alert]', root), cfg.i18n?.loginRequired);
            return;
        }
        const alert = $('[data-ag-alert]', root);
        try {
            if (format && format !== 'SOLO') {
                const teamsRes = await api.listMyTeams();
                const teams = extractPageContent(teamsRes);
                if (!teams.length) {
                    showAlert(alert, 'Crie um time antes de se inscrever neste torneio.');
                    return;
                }
                const teamId = teams.length === 1 ? teams[0].id : await promptTeamSelect(teams);
                if (!teamId) return;
                await api.joinTournamentTeam(slug, teamId);
            } else {
                await api.joinTournament(slug);
            }
            showAlert(alert, 'Inscrição realizada!', 'success');
            if (root.dataset.agPage === 'torneio') {
                await initTorneioDetail(root);
            } else if (root.dataset.agPage === 'torneios') {
                await loadTournamentList(root, root.dataset.agActiveFilter || 'REGISTRATION_OPEN');
            }
        } catch (err) {
            showAlert(alert, err.message);
        }
    }

    function promptTeamSelect(teams) {
        const names = teams.map((t, i) => `${i + 1}. ${t.name} (${t.tag || '—'})`).join('\n');
        const choice = window.prompt(`Escolha o time (número):\n${names}`, '1');
        const idx = parseInt(choice, 10) - 1;
        return teams[idx]?.id || null;
    }

    /* ── Login / Cadastro ── */
    function initLogin(root) {
        const form = $('[data-ag-form="login"]', root);
        if (!form) return;
        if (api.isLoggedIn() && cfg.homeUrl && isLoginPage()) {
            window.location.replace(cfg.dashboardUrl || cfg.homeUrl);
            return;
        }
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const alert = $('[data-ag-alert]', root);
            hideAlert(alert);
            const fd = new FormData(form);
            try {
                await api.login(fd.get('email'), fd.get('password'));
                showAlert(alert, 'Login realizado! Redirecionando…', 'success');
                setTimeout(redirectAfterAuth, 600);
            } catch (err) {
                showAlert(alert, err.message);
            }
        });
    }

    function initCadastro(root) {
        const form = $('[data-ag-form="cadastro"]', root);
        if (!form) return;
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const alert = $('[data-ag-alert]', root);
            const success = $('[data-ag-success]', root);
            hideAlert(alert);
            hideAlert(success);
            const fd = new FormData(form);
            const body = {
                email: fd.get('email'),
                password: fd.get('password'),
                firstName: fd.get('firstName'),
                lastName: fd.get('lastName'),
                username: fd.get('username') || undefined,
                phoneNumber: fd.get('phoneNumber') || undefined,
                avatarUrl: fd.get('avatarUrl') || undefined,
                instagramUrl: fd.get('instagramUrl') || undefined,
                youtubeUrl: fd.get('youtubeUrl') || undefined,
                twitchUrl: fd.get('twitchUrl') || undefined,
            };
            Object.keys(body).forEach((k) => { if (body[k] === undefined || body[k] === '') delete body[k]; });
            try {
                await api.register(body);
                showAlert(success, 'Conta criada! Redirecionando…', 'success');
                setTimeout(redirectAfterAuth, 800);
            } catch (err) {
                showAlert(alert, err.message);
            }
        });
    }

    function initMenu(root) {
        const nav = $('[data-ag-nav]', root);
        const guest = $('[data-ag-nav-guest]', root);
        const userEl = $('[data-ag-nav-user]', root);
        if (api.isLoggedIn()) {
            if (nav) nav.hidden = false;
            if (guest) guest.hidden = true;
            const user = api.getUser();
            if (user && userEl) userEl.textContent = (user.firstName || '') + ' ' + (user.lastName || '');
        } else {
            if (nav) nav.hidden = true;
            if (guest) guest.hidden = false;
        }
        $('[data-ag-logout]', root)?.addEventListener('click', () => {
            api.logout();
            window.location.reload();
        });
    }

    /* ── Torneios (abas na página; view do shortcode define aba inicial) ── */
    async function initTorneios(root) {
        let activeFilter = root.dataset.agActiveFilter ?? 'REGISTRATION_OPEN';

        $$('[data-ag-tab]', root).forEach((tab) => {
            tab.addEventListener('click', () => {
                $$('[data-ag-tab]', root).forEach((t) => {
                    t.classList.remove('active', 'ag-tab--active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                activeFilter = tab.dataset.agTabFilter || 'ALL';
                root.dataset.agActiveFilter = activeFilter;
                loadTournamentList(root, activeFilter);
            });
        });

        await loadTournamentList(root, activeFilter);
    }

    function initParticipando(root) {
        const initialView = root.dataset.agView
            || (root.dataset.agPage === 'partidas' ? 'partidas' : 'meus-torneios');
        const hasTabs = $$('[data-ag-participating-view]', root).length > 0;

        function switchView(view) {
            root.dataset.agView = view;
            if (hasTabs) {
                $$('[data-ag-participating-panel]', root).forEach((panel) => {
                    panel.hidden = panel.dataset.agParticipatingPanel !== view;
                });
                $$('[data-ag-participating-view]', root).forEach((tab) => {
                    const active = tab.dataset.agParticipatingView === view;
                    tab.classList.toggle('active', active);
                    tab.classList.toggle('ag-tab--active', active);
                    tab.setAttribute('aria-selected', active ? 'true' : 'false');
                });
            }
            if (view === 'partidas') initPartidas(root);
            else initMeusTorneios(root);
        }

        if (hasTabs) {
            $$('[data-ag-participating-view]', root).forEach((tab) => {
                tab.addEventListener('click', () => switchView(tab.dataset.agParticipatingView));
            });
        }

        switchView(initialView);
    }

    function participatingPanel(root, view) {
        return $(`[data-ag-participating-panel="${view}"]`, root) || root;
    }

    async function initMeusTorneios(root) {
        if (!requireAuth(root)) return;
        const scope = participatingPanel(root, 'meus-torneios');
        const list = $('[data-ag-list]', scope);
        const empty = $('[data-ag-empty]', scope);
        const paginationEl = findPaginationEl(root, list);
        const alert = $('[data-ag-alert]', root);

        bindPaginationOnce(root, list);
        setLoading(root, true);

        if (paginationEl) {
            paginationEl.hidden = true;
            paginationEl.innerHTML = '';
        }

        try {
            const items = extractPageContent(await api.listMyJoined());
            if (!items.length) {
                if (list) {
                    list.innerHTML = '';
                    list.hidden = true;
                }
                empty.hidden = false;
                return;
            }
            empty.hidden = true;
            const joinedSlugs = new Set(
                items.map((t) => extractTournamentSlug(t)).filter(Boolean)
            );
            renderPaginatedTournamentList(root, list, items, 1, {
                showMatches: true,
                joinedSlugs,
            });
        } catch (err) {
            showAlert(alert, err.message);
        } finally {
            setLoading(root, false);
        }
    }

    function resolveTournamentSlug(root) {
        const fromLocation = parseSlugFromLocation();
        if (fromLocation) return normalizeSlug(fromLocation);
        return normalizeSlug(root.dataset.agSlug || '');
    }

    async function fetchTournamentForDetail(slug) {
        let t = await api.findPublicTournamentBySlug(slug);

        if (api.isLoggedIn()) {
            try {
                const res = await api.getTournament(slug);
                const authT = res?.data || res;
                if (authT && authT.slug) {
                    t = { ...(t || {}), ...authT };
                }
            } catch {
                /* catálogo público já cobre visitantes e torneios abertos */
            }
        }

        return t;
    }

    async function initTorneioDetail(root) {
        const slug = resolveTournamentSlug(root);
        root.dataset.agSlug = slug;
        const alert = $('[data-ag-alert]', root);
        if (!slug) {
            showAlert(alert, 'Torneio não informado. Use ?slug=nome-do-torneio na URL.');
            return;
        }
        const success = $('[data-ag-success]', root);
        const detail = $('[data-ag-detail]', root);
        const body = $('[data-ag-detail-body]', root);
        const statusRow = $('[data-ag-detail-status-row]', root);
        const statusEl = $('[data-ag-detail-status]', root);
        const title = $('[data-ag-tournament-name]', root);
        setLoading(root, true);
        try {
            const t = await fetchTournamentForDetail(slug);
            if (!t) throw new Error('Torneio não encontrado.');
            title.textContent = t.name || t.slug || 'Torneio';

            const slugEl = $('[data-ag-tournament-slug]', root);
            if (slugEl && t.slug) {
                slugEl.textContent = `#${t.slug}`;
                slugEl.hidden = false;
            } else if (slugEl) {
                slugEl.hidden = true;
            }

            const bannerEl = $('[data-ag-tournament-banner]', root);
            if (bannerEl) {
                bannerEl.innerHTML = tournamentDetailBanner(t);
            }

            const identityEl = $('[data-ag-tournament-identity]', root);
            if (identityEl) {
                identityEl.innerHTML = tournamentDetailIdentity(t);
            }

            const datesEl = $('[data-ag-detail-dates]', root);
            if (datesEl) {
                datesEl.innerHTML = renderTournamentDetailDates(t);
            }

            const statsEl = $('[data-ag-detail-stats]', root);
            if (statsEl) {
                statsEl.innerHTML = renderTournamentDetailStats(t);
            }

            body.innerHTML = renderTournamentDetailBody(t);

            if (statusRow && statusEl) {
                statusEl.innerHTML = statusBadge(t.status);
                statusRow.hidden = false;
            }

            const mediaEl = $('[data-ag-tournament-media]', root);
            const mediaHtml = renderTournamentMedia(t);
            if (mediaEl) {
                mediaEl.innerHTML = mediaHtml;
                mediaEl.hidden = !mediaHtml;
            }

            detail.hidden = false;
            const joinedSlugsSet = await getJoinedSlugs();
            const isJoined = isUserJoinedInTournament(t, joinedSlugsSet);
            const registrationOpen = isRegistrationOpen(t);

            updateDetailEnrollmentUI(root, slug, t, isJoined, registrationOpen);
        } catch (err) {
            showAlert(alert, err.message);
        } finally {
            setLoading(root, false);
        }
    }

    /* ── Dashboard ── */
    async function initDashboard(root) {
        if (!requireAuth(root)) return;

        const dash = $('[data-ag-dashboard]', root);
        const welcome = $('[data-ag-welcome]', root);
        const alert = $('[data-ag-alert]', root);
        const user = api.getUser();

        if (welcome && user) {
            const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || '';
            welcome.textContent = name ? `Bem-vindo, ${name}!` : 'Bem-vindo!';
        }

        const pageUrls = cfg.pageUrls || {};
        $$('[data-ag-nav-link]', root).forEach((link) => {
            const key = link.dataset.agNavLink;
            const url = pageUrls[key] || '';
            if (url) link.href = url;
        });

        $('[data-ag-logout]', root)?.addEventListener('click', () => {
            api.logout();
            window.location.href = cfg.loginUrl || window.location.href;
        });

        setLoading(root, true);
        try {
            const [balanceRes, joinedRes] = await Promise.all([
                api.getBalance(),
                api.listMyJoined(0, 1),
            ]);
            const w = balanceRes.data || balanceRes;
            const balanceEl = $('[data-ag-balance-available]', root);
            const countEl = $('[data-ag-tournament-count]', root);
            if (balanceEl) balanceEl.textContent = formatCredits(w.availableBalance);
            if (countEl) {
                const total = joinedRes?.data?.totalElements ?? joinedRes?.totalElements;
                countEl.textContent = total != null ? String(total) : String(extractPageContent(joinedRes).length);
            }
            if (dash) dash.hidden = false;
        } catch (err) {
            showAlert(alert, err.message);
        } finally {
            setLoading(root, false);
        }
    }

    /* ── Carteira (histórico + compra + saque) ── */
    async function initCarteira(root) {
        if (!requireAuth(root)) return;
        const alert = $('[data-ag-alert]', root);
        const success = $('[data-ag-success]', root);

        $$('[data-ag-wallet-tab]', root).forEach((tab) => {
            tab.addEventListener('click', () => {
                $$('[data-ag-wallet-tab]', root).forEach((t) => t.classList.remove('ag-tab--active'));
                tab.classList.add('ag-tab--active');
                const name = tab.dataset.agWalletTab;
                $$('[data-ag-wallet-panel]', root).forEach((p) => {
                    p.hidden = p.dataset.agWalletPanel !== name;
                });
            });
        });

        async function loadWallet() {
            setLoading(root, true);
            try {
                const [balanceRes, txRes] = await Promise.all([api.getBalance(), api.getTransactions()]);
                const w = balanceRes.data || balanceRes;
                $('[data-ag-balance-available]', root).textContent = formatCredits(w.availableBalance);
                $('[data-ag-balance-total]', root).textContent = formatCredits(w.balance);
                $('[data-ag-balance-held]', root).textContent = formatCredits(w.heldBalance);
                $('[data-ag-wallet]', root).hidden = false;
                const txs = extractPageContent(txRes);
                const tbody = $('[data-ag-transactions]', root);
                const emptyTx = $('[data-ag-empty-tx]', root);
                if (!txs.length) {
                    emptyTx.hidden = false;
                    tbody.innerHTML = '';
                } else {
                    emptyTx.hidden = true;
                    tbody.innerHTML = txs.map((tx) => `
                        <tr>
                            <td>${formatDate(tx.createdAt)}</td>
                            <td>${escapeHtml(tx.description || tx.type || '—')}</td>
                            <td class="${parseFloat(tx.amount) >= 0 ? 'ag-positive' : 'ag-negative'}">${formatCredits(tx.amount)}</td>
                        </tr>`).join('');
                }
            } catch (err) {
                showAlert(alert, err.message);
            } finally {
                setLoading(root, false);
            }
        }

        const packagesEl = $('[data-ag-packages]', root);
        const packages = cfg.creditPackages || ['10', '25', '50', '100'];
        if (packagesEl) {
            packagesEl.innerHTML = packages.map((p) =>
                `<button type="button" class="ag-package" data-amount="${escapeHtml(p)}">${formatCredits(p)}</button>`
            ).join('');
            $$('.ag-package', packagesEl).forEach((btn) => {
                btn.addEventListener('click', () => {
                    $('[name="amount"]', $('[data-ag-form="deposit"]', root)).value = btn.dataset.amount;
                });
            });
        }

        $('[data-ag-form="deposit"]', root)?.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert(alert);
            hideAlert(success);
            const fd = new FormData(e.target);
            try {
                await api.deposit(parseFloat(fd.get('amount')), fd.get('description') || 'Compra via site');
                showAlert(success, 'Créditos adicionados!', 'success');
                e.target.reset();
                await loadWallet();
            } catch (err) {
                showAlert(alert, err.message);
            }
        });

        $('[data-ag-form="withdraw"]', root)?.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert(alert);
            hideAlert(success);
            const fd = new FormData(e.target);
            try {
                await api.withdraw(parseFloat(fd.get('amount')), fd.get('description') || 'Saque via site');
                showAlert(success, 'Saque solicitado!', 'success');
                e.target.reset();
                await loadWallet();
            } catch (err) {
                showAlert(alert, err.message);
            }
        });

        await loadWallet();
    }

    /* ── Times ── */
    async function initTimes(root) {
        if (!requireAuth(root)) return;
        const alert = $('[data-ag-alert]', root);
        const success = $('[data-ag-success]', root);
        const listEl = $('[data-ag-teams-list]', root);
        const empty = $('[data-ag-empty]', root);
        const form = $('[data-ag-form="team"]', root);
        const formTitle = $('[data-ag-team-form-title]', root);
        const cancelBtn = $('[data-ag-team-cancel]', root);

        function resetForm() {
            form.reset();
            form.querySelector('[name="teamId"]').value = '';
            formTitle.textContent = 'Criar time';
            cancelBtn.hidden = true;
        }

        cancelBtn?.addEventListener('click', resetForm);

        async function loadTeams() {
            setLoading(root, true);
            try {
                const teams = extractPageContent(await api.listMyTeams());
                if (!teams.length) {
                    listEl.innerHTML = '';
                    empty.hidden = false;
                    return;
                }
                empty.hidden = true;
                listEl.innerHTML = teams.map((team) => `
                    <article class="ag-team-card" data-team-id="${team.id}">
                        ${team.logoUrl ? `<img class="ag-team-card__logo" src="${escapeHtml(team.logoUrl)}" alt="">` : ''}
                        <h3>${escapeHtml(team.name)} ${team.tag ? `<span class="ag-badge">${escapeHtml(team.tag)}</span>` : ''}</h3>
                        <p class="ag-muted">${team.memberCount ?? 0} membro(s)${team.owner ? ' · Dono' : ''}</p>
                        <div class="ag-team-card__actions">
                            <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-edit-team="${team.id}">Editar</button>
                            <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-view-team="${team.id}">Detalhes</button>
                        </div>
                    </article>`).join('');

                $$('[data-ag-edit-team]', listEl).forEach((btn) => {
                    btn.addEventListener('click', async () => {
                        const team = (await api.getTeam(btn.dataset.agEditTeam)).data || (await api.getTeam(btn.dataset.agEditTeam));
                        const t = team.data || team;
                        form.querySelector('[name="teamId"]').value = t.id;
                        form.querySelector('[name="name"]').value = t.name || '';
                        form.querySelector('[name="tag"]').value = t.tag || '';
                        form.querySelector('[name="logoUrl"]').value = t.logoUrl || '';
                        form.querySelector('[name="youtubeUrl"]').value = t.youtubeUrl || '';
                        form.querySelector('[name="instagramUrl"]').value = t.instagramUrl || '';
                        form.querySelector('[name="twitchUrl"]').value = t.twitchUrl || '';
                        form.querySelector('[name="otherSocialUrl"]').value = t.otherSocialUrl || '';
                        form.querySelector('[name="rulesChange"]').value = t.rulesChange || '';
                        formTitle.textContent = 'Editar time';
                        cancelBtn.hidden = false;
                        form.scrollIntoView({ behavior: 'smooth' });
                    });
                });

                $$('[data-ag-view-team]', listEl).forEach((btn) => {
                    btn.addEventListener('click', async () => {
                        const res = await api.getTeam(btn.dataset.agViewTeam);
                        const t = res.data || res;
                        const detail = $('[data-ag-team-detail]', root);
                        const modal = $('[data-ag-team-modal]', root);
                        detail.innerHTML = `
                            <h3>${escapeHtml(t.name)}</h3>
                            <p><strong>Tag:</strong> ${escapeHtml(t.tag || '—')}</p>
                            <p><strong>Membros:</strong> ${t.memberCount ?? '—'}</p>
                            ${t.rulesChange ? `<p><strong>Regras:</strong> ${escapeHtml(t.rulesChange)}</p>` : ''}
                            ${(t.members || []).map((m) => `
                                <div class="ag-team-member">
                                    ${escapeHtml(m.firstName || '')} ${escapeHtml(m.lastName || '')} (${escapeHtml(m.email || '')})
                                    ${m.contactId ? `<button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-remove-member="${m.contactId}">Remover</button>` : ''}
                                </div>`).join('') || ''}`;
                        modal.hidden = false;
                        $$('[data-ag-remove-member]', detail).forEach((rmb) => {
                            rmb.addEventListener('click', async () => {
                                try {
                                    await api.removeTeamMember(t.id, rmb.dataset.agRemoveMember);
                                    showAlert(success, 'Membro removido.', 'success');
                                    modal.hidden = true;
                                    await loadTeams();
                                } catch (err) {
                                    showAlert(alert, err.message);
                                }
                            });
                        });
                    });
                });
            } catch (err) {
                showAlert(alert, err.message);
            } finally {
                setLoading(root, false);
            }
        }

        $$('[data-ag-modal-close]', root).forEach((el) => {
            el.addEventListener('click', () => { $('[data-ag-team-modal]', root).hidden = true; });
        });

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert(alert);
            hideAlert(success);
            const fd = new FormData(form);
            const payload = {
                name: fd.get('name'),
                tag: fd.get('tag') || null,
                logoUrl: fd.get('logoUrl') || null,
                youtubeUrl: fd.get('youtubeUrl') || null,
                instagramUrl: fd.get('instagramUrl') || null,
                twitchUrl: fd.get('twitchUrl') || null,
                otherSocialUrl: fd.get('otherSocialUrl') || null,
                rulesChange: fd.get('rulesChange') || null,
            };
            const teamId = fd.get('teamId');
            try {
                if (teamId) await api.updateTeam(teamId, payload);
                else await api.createTeam(payload);
                showAlert(success, teamId ? 'Time atualizado!' : 'Time criado!', 'success');
                resetForm();
                await loadTeams();
            } catch (err) {
                showAlert(alert, err.message);
            }
        });

        await loadTeams();
    }

    /* ── Perfil ── */
    async function initPerfil(root) {
        if (!requireAuth(root)) return;
        const alert = $('[data-ag-alert]', root);
        const success = $('[data-ag-success]', root);
        const formWrap = $('[data-ag-profile-form]', root);
        const form = $('[data-ag-form="perfil"]', root);
        setLoading(root, true);
        try {
            const res = await api.getProfile();
            const u = res.data || res;
            form.querySelector('[name="firstName"]').value = u.firstName || '';
            form.querySelector('[name="lastName"]').value = u.lastName || '';
            form.querySelector('[name="phoneNumber"]').value = u.phoneNumber || '';
            form.querySelector('[name="avatarUrl"]').value = u.avatarUrl || '';
            form.querySelector('[name="instagramUrl"]').value = u.instagramUrl || '';
            form.querySelector('[name="youtubeUrl"]').value = u.youtubeUrl || '';
            form.querySelector('[name="twitchUrl"]').value = u.twitchUrl || '';
            formWrap.hidden = false;
        } catch (err) {
            showAlert(alert, err.message);
        } finally {
            setLoading(root, false);
        }
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert(alert);
            hideAlert(success);
            const fd = new FormData(form);
            try {
                await api.updateProfile({
                    firstName: fd.get('firstName'),
                    lastName: fd.get('lastName'),
                    phoneNumber: fd.get('phoneNumber') || '',
                    avatarUrl: fd.get('avatarUrl') || '',
                    instagramUrl: fd.get('instagramUrl') || '',
                    youtubeUrl: fd.get('youtubeUrl') || '',
                    twitchUrl: fd.get('twitchUrl') || '',
                });
                showAlert(success, 'Perfil atualizado!', 'success');
            } catch (err) {
                showAlert(alert, err.message);
            }
        });
    }

    /* ── Partidas ── */
    async function initPartidas(root) {
        if (!requireAuth(root)) return;
        const scope = participatingPanel(root, 'partidas');
        const container = $('[data-ag-matches]', scope);
        const empty = $('[data-ag-empty-partidas]', scope) || $('[data-ag-empty]', scope);
        const alert = $('[data-ag-alert]', root);
        setLoading(root, true);
        try {
            const tournaments = extractPageContent(await api.listMyJoined());
            if (!tournaments.length) { empty.hidden = false; return; }
            const sections = [];
            for (const t of tournaments) {
                try {
                    const matches = (await api.listMatches(t.slug)).data || [];
                    if (!matches.length) continue;
                    sections.push(`<section class="ag-match-section"><h3>${tournamentNameHtml(t)}</h3>
                        <div class="ag-table-wrap"><table class="ag-table"><thead><tr><th>#</th><th>Confronto</th><th>Placar</th><th>Status</th><th>Data</th></tr></thead><tbody>
                        ${matches.map((m) => `<tr><td>${m.matchNumber ?? '—'}</td><td>${escapeHtml(m.homeParticipantName || 'TBD')} vs ${escapeHtml(m.awayParticipantName || 'TBD')}</td><td>${m.homeScore ?? '—'} × ${m.awayScore ?? '—'}</td><td>${escapeHtml(MATCH_STATUS[m.status] || m.status)}</td><td>${formatDate(m.scheduledAt)}</td></tr>`).join('')}
                        </tbody></table></div></section>`);
                } catch { /* skip */ }
            }
            if (!sections.length) { empty.hidden = false; return; }
            container.hidden = false;
            container.innerHTML = sections.join('');
        } catch (err) {
            showAlert(alert, err.message);
        } finally {
            setLoading(root, false);
        }
    }

    const handlers = {
        login: initLogin,
        cadastro: initCadastro,
        menu: initMenu,
        torneios: initTorneios,
        participando: initParticipando,
        'meus-torneios': initParticipando,
        torneio: initTorneioDetail,
        creditos: initCarteira,
        'comprar-creditos': initCarteira,
        carteira: initCarteira,
        partidas: initParticipando,
        times: initTimes,
        perfil: initPerfil,
        dashboard: initDashboard,
        painel: initDashboard,
    };

    function boot() {
        $$('.ag-client').forEach((root) => {
            const page = root.dataset.agPage;
            if (handlers[page]) handlers[page](root);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
