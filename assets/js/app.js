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

    const PRIZE_FUNDING_LABELS = {
        FIXED: 'Prêmio fixo',
        ENTRY_FEES: 'Por arrecadação',
    };

    const ENTRY_FEE_STATUS_LABELS = {
        HELD: 'Retida',
        REFUNDED: 'Reembolsada',
        CAPTURED: 'Capturada',
    };

    const FORMAT_LABELS = {
        SOLO: 'Individual',
        TEAM: 'Times',
    };

    const PROTECTED_PAGES = [
        'participando', 'meus-torneios', 'creditos', 'comprar-creditos', 'carteira',
        'partidas', 'times', 'time', 'perfil', 'painel', 'dashboard', 'criar-torneio',
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

    function normalizePathname(url) {
        try {
            const parsed = new URL(String(url || ''), window.location.origin);
            return parsed.pathname.replace(/\/$/, '') || '/';
        } catch {
            return String(url || '').replace(/\/$/, '').split('?')[0];
        }
    }

    function getLoginUrl() {
        return String(cfg.loginUrl || cfg.pageUrls?.login || '').trim();
    }

    function getPostLoginRedirectUrl() {
        return String(cfg.dashboardUrl || cfg.homeUrl || cfg.pageUrls?.painel || cfg.pageUrls?.dashboard || '').trim();
    }

    function isLoginPage(root) {
        if (root?.dataset?.agPage === 'login') return true;
        const loginUrl = getLoginUrl();
        if (!loginUrl) return false;
        return normalizePathname(window.location.href) === normalizePathname(loginUrl);
    }

    function redirectIfLoggedInOnAuthPage(root) {
        const page = root?.dataset?.agPage;
        if (!api.isLoggedIn() || (page !== 'login' && page !== 'cadastro')) return false;
        const dest = getPostLoginRedirectUrl();
        if (!dest) return false;
        window.location.replace(dest);
        return true;
    }

    function redirectToLoginIfNeeded(root) {
        const loginUrl = getLoginUrl();
        if (!loginUrl || isLoginPage(root)) return false;
        window.location.href = loginUrl;
        return true;
    }

    function redirectAfterAuth() {
        const url = getPostLoginRedirectUrl();
        if (url) window.location.href = url;
        else window.location.reload();
    }

    function requireAuth(root) {
        const page = root.dataset.agPage;
        if (!PROTECTED_PAGES.includes(page)) return true;
        if (api.isLoggedIn()) return true;
        showAlert($('[data-ag-alert]', root), cfg.i18n?.loginRequired || 'Faça login para continuar.');
        redirectToLoginIfNeeded(root);
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

    function parsePlayerIdFromLocation() {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('id');
        if (fromQuery) return String(fromQuery).replace(/\D/g, '');

        const pathname = window.location.pathname || '';
        const idEq = pathname.match(/\/id=([0-9]+)\/?$/i);
        if (idEq) return idEq[1];

        const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
        if (parts.length >= 2) {
            const last = parts[parts.length - 1];
            const prev = parts[parts.length - 2];
            if (last.startsWith('id=')) return last.slice(3).replace(/\D/g, '');
            if (/jogador|perfil-jogador|player/i.test(prev) && /^\d+$/.test(last)) {
                return last;
            }
        }
        return '';
    }

    function teamSlugCandidates() {
        const slugs = ['time', 'detalhes-time', 'team'];
        const base = (cfg.pageUrls?.time || '').trim();
        if (base) {
            try {
                const seg = new URL(base, window.location.origin).pathname
                    .replace(/\/+$/, '')
                    .split('/')
                    .filter(Boolean)
                    .pop();
                if (seg) slugs.unshift(seg);
            } catch (_) { /* ignore */ }
        }
        return [...new Set(slugs.filter(Boolean))];
    }

    function parseTeamIdFromLocation() {
        const params = new URLSearchParams(window.location.search);
        const fromQuery = params.get('id');
        if (fromQuery) return String(fromQuery).replace(/\D/g, '');

        const pathname = decodeURIComponent(window.location.pathname || '');
        const idEq = pathname.match(/\/id=([0-9]+)\/?$/i);
        if (idEq) return idEq[1];

        for (const slug of teamSlugCandidates()) {
            const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const match = pathname.match(new RegExp('/' + escaped + '/([0-9]+)(?:/|$)', 'i'));
            if (match) return match[1];
        }

        const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
        if (parts.length >= 2) {
            const last = parts[parts.length - 1];
            const prev = parts[parts.length - 2];
            if (last.startsWith('id=')) return last.slice(3).replace(/\D/g, '');
            if (/time|detalhes-time|team/i.test(prev) && /^\d+$/.test(last)) {
                return last;
            }
        }
        return '';
    }

    function readTeamIdFromRoot(root) {
        const fromAttr = (root.getAttribute('data-ag-team-id') || '').trim();
        if (fromAttr) return fromAttr.replace(/\D/g, '');
        return parseTeamIdFromLocation();
    }

    function playerProfileHref(clientUserId) {
        if (!clientUserId) return '';
        let base = (cfg.pageUrls?.jogador || '').trim();
        if (!base && cfg.homeUrl) {
            base = cfg.homeUrl.replace(/\/$/, '') + '/jogador/';
        }
        if (!base) return '';
        const id = encodeURIComponent(String(clientUserId));
        if (base.includes('{id}')) {
            return base.replace('{id}', id);
        }
        if (base.includes('?')) {
            if (base.endsWith('=')) return base + id;
            const joiner = base.includes('id=') ? '' : (base.endsWith('?') || base.endsWith('&') ? '' : '&');
            return base + joiner + (base.includes('id=') ? id : 'id=' + id);
        }
        return base.replace(/\/$/, '') + '/' + id;
    }

    function playerProfileLink(clientUserId, label) {
        const text = label || 'Jogador';
        const href = playerProfileHref(clientUserId);
        if (!href) return escapeHtml(text);
        return `<a href="${escapeAttr(href)}" class="ag-link ag-player-link">${escapeHtml(text)}</a>`;
    }

    function teamDetailHref(teamId) {
        if (!teamId) return '';
        let base = (cfg.pageUrls?.time || '').trim();
        if (!base && cfg.homeUrl) {
            base = cfg.homeUrl.replace(/\/$/, '') + '/time/';
        }
        if (!base) return '';
        const id = encodeURIComponent(String(teamId));
        if (base.includes('{id}')) {
            return base.replace('{id}', id);
        }
        if (base.includes('?')) {
            if (base.endsWith('=')) return base + id;
            const joiner = base.includes('id=') ? '' : (base.endsWith('?') || base.endsWith('&') ? '' : '&');
            return base + joiner + (base.includes('id=') ? id : 'id=' + id);
        }
        return base.replace(/\/$/, '') + '/' + id;
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
        const name = escapeHtml(tournamentDisplayName(t));
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

    function isTeamTournamentFormat(format) {
        const normalized = String(format || '').trim().toUpperCase();
        return !!normalized && normalized !== 'SOLO';
    }

    function tournamentMarksJoined(t) {
        if (!t) return false;
        const participantStatus = String(t.participantStatus || t.registrationStatus || t.myRegistrationStatus || '').toUpperCase();
        if (participantStatus === 'APPROVED' || participantStatus === 'REGISTERED') {
            return true;
        }
        return isTruthyJoinFlag(t.joined)
            || isTruthyJoinFlag(t.alreadyJoined)
            || isTruthyJoinFlag(t.isJoined)
            || isTruthyJoinFlag(t.registered)
            || isTruthyJoinFlag(t.isParticipant)
            || isTruthyJoinFlag(t.myTeamRegistered)
            || isTruthyJoinFlag(t.teamRegistered);
    }

    const JOINED_SLUGS_CACHE_KEY = 'ag_joined_tournament_slugs';
    const WITHDRAWN_SLUGS_CACHE_KEY = 'ag_withdrawn_tournament_slugs';
    const TEAM_MEMBER_TOURNAMENT_CONFLICT_MSG = 'Um ou mais integrantes do seu time já estão inscritos neste torneio por outra equipe.';

    function readCachedJoinedSlugs() {
        try {
            const raw = sessionStorage.getItem(JOINED_SLUGS_CACHE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return new Set(Array.isArray(parsed) ? parsed.map((s) => normalizeSlug(s)).filter(Boolean) : []);
        } catch {
            return new Set();
        }
    }

    function rememberJoinedSlug(slug) {
        const normalized = normalizeSlug(slug);
        if (!normalized) return;
        const slugs = readCachedJoinedSlugs();
        slugs.add(normalized);
        try {
            sessionStorage.setItem(JOINED_SLUGS_CACHE_KEY, JSON.stringify([...slugs]));
        } catch (_) { /* ignore */ }
    }

    function forgetJoinedSlug(slug, tournament) {
        const normalized = normalizeSlug(slug);
        const slugs = readCachedJoinedSlugs();
        if (normalized) slugs.delete(normalized);
        if (tournament) {
            removeTournamentFromJoinedSlugSet(slugs, tournament);
        }
        try {
            sessionStorage.setItem(JOINED_SLUGS_CACHE_KEY, JSON.stringify([...slugs]));
        } catch (_) { /* ignore */ }
    }

    function readWithdrawnSlugEntries() {
        try {
            const raw = sessionStorage.getItem(WITHDRAWN_SLUGS_CACHE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
        } catch {
            return new Set();
        }
    }

    function rememberWithdrawnSlug(slug, tournament) {
        const entries = readWithdrawnSlugEntries();
        const normalized = normalizeSlug(slug);
        if (normalized) entries.add(normalized);
        if (tournament) {
            const slugKey = extractTournamentSlug(tournament);
            if (slugKey) entries.add(slugKey);
            const id = tournament.id ?? tournament.tournamentId;
            if (id != null && id !== '') entries.add(`id:${id}`);
        }
        try {
            sessionStorage.setItem(WITHDRAWN_SLUGS_CACHE_KEY, JSON.stringify([...entries]));
        } catch (_) { /* ignore */ }
    }

    function forgetWithdrawnSlug(slug, tournament) {
        const entries = readWithdrawnSlugEntries();
        const normalized = normalizeSlug(slug);
        if (normalized) entries.delete(normalized);
        if (tournament) {
            const slugKey = extractTournamentSlug(tournament);
            if (slugKey) entries.delete(slugKey);
            const id = tournament.id ?? tournament.tournamentId;
            if (id != null && id !== '') entries.delete(`id:${id}`);
        }
        try {
            sessionStorage.setItem(WITHDRAWN_SLUGS_CACHE_KEY, JSON.stringify([...entries]));
        } catch (_) { /* ignore */ }
    }

    function tournamentMatchesSlugEntrySet(t, entries) {
        if (!t || !(entries instanceof Set) || !entries.size) return false;
        const slug = extractTournamentSlug(t);
        if (slug && entries.has(slug)) return true;
        const raw = String(t.slug || t.tournamentSlug || '').trim().toLowerCase().replace(/_/g, '-');
        if (raw && entries.has(raw)) return true;
        const id = t.id ?? t.tournamentId;
        if (id != null && id !== '' && entries.has(`id:${id}`)) return true;
        return false;
    }

    function isTournamentWithdrawnLocally(t) {
        return tournamentMatchesSlugEntrySet(t, readWithdrawnSlugEntries());
    }

    function removeTournamentFromJoinedSlugSet(slugs, t) {
        if (!(slugs instanceof Set) || !t) return;
        const slug = extractTournamentSlug(t);
        if (slug) slugs.delete(slug);
        const raw = String(t.slug || t.tournamentSlug || '').trim().toLowerCase().replace(/_/g, '-');
        if (raw) slugs.delete(raw);
        const id = t.id ?? t.tournamentId;
        if (id != null && id !== '') slugs.delete(`id:${id}`);
    }

    function mergeJoinedSlugSets(...sets) {
        const merged = new Set();
        sets.forEach((set) => {
            if (set instanceof Set) {
                set.forEach((value) => merged.add(value));
            }
        });
        return merged;
    }

    function isTournamentAlreadyRegisteredMessage(message) {
        return /já inscrit|already registered|already joined|time já inscrito/i.test(String(message || ''));
    }

    function canRegisterTeamInTournament(team) {
        if (!team) return false;
        if (isTruthyJoinFlag(team.canRegisterInTournament) || isTruthyJoinFlag(team.canRegister)) {
            return true;
        }
        if (isTruthyJoinFlag(team.captain) || isTruthyJoinFlag(team.owner)) {
            return true;
        }
        const role = String(team.myRole || team.role || '').trim().toUpperCase();
        return role === 'CAPTAIN' || role === 'OWNER' || role === 'MANAGER';
    }

    function addJoinedSlugToSet(slugs, t) {
        if (!(slugs instanceof Set) || !t) return;
        const normalized = extractTournamentSlug(t);
        if (normalized) slugs.add(normalized);
        const raw = String(t.slug || t.tournamentSlug || '').trim().toLowerCase().replace(/_/g, '-');
        if (raw) slugs.add(raw);
        const id = t.id ?? t.tournamentId;
        if (id != null && id !== '') slugs.add(`id:${id}`);
    }

    function collectJoinedSlugsFromTeam(team, slugs) {
        if (!team || !(slugs instanceof Set)) return;
        collectTournamentsFromTeam(team).forEach((item) => {
            if (!isTournamentWithdrawnLocally(item)) addJoinedSlugToSet(slugs, item);
        });
    }

    function tournamentListKey(t) {
        const slug = extractTournamentSlug(t);
        if (slug) return `slug:${slug}`;
        const id = t?.id ?? t?.tournamentId;
        if (id != null && id !== '') return `id:${id}`;
        return '';
    }

    function normalizeTeamTournamentRef(item, team) {
        if (!item) return null;
        const slug = extractTournamentSlug(item);
        const id = item.id ?? item.tournamentId;
        return {
            ...item,
            slug: item.slug || item.tournamentSlug || slug || '',
            id: id ?? undefined,
            presetName: item.presetName ?? item.gameName,
            gameName: item.gameName ?? item.presetName,
            teamId: team?.id,
            teamName: team?.name,
            teamTag: team?.tag,
            joinedViaTeam: true,
        };
    }

    function collectTournamentsFromTeam(team) {
        if (!team) return [];
        const items = [];
        const lists = [
            team.activeTournaments,
            team.registeredTournaments,
            team.tournaments,
            team.currentTournaments,
        ];
        lists.forEach((list) => {
            if (!Array.isArray(list)) return;
            list.forEach((item) => {
                const normalized = normalizeTeamTournamentRef(item, team);
                if (normalized) items.push(normalized);
            });
        });
        [team.currentTournament, team.tournament].forEach((item) => {
            const normalized = normalizeTeamTournamentRef(item, team);
            if (normalized) items.push(normalized);
        });
        if (team.tournamentSlug || team.tournamentId != null) {
            const normalized = normalizeTeamTournamentRef({
                slug: team.tournamentSlug,
                id: team.tournamentId,
            }, team);
            if (normalized) items.push(normalized);
        }
        return items;
    }

    function mergeTournamentLists(...lists) {
        const map = new Map();
        lists.flat().forEach((t) => {
            if (!t) return;
            const key = tournamentListKey(t);
            if (!key) return;
            const existing = map.get(key);
            map.set(key, existing ? { ...existing, ...t, joinedViaTeam: existing.joinedViaTeam || t.joinedViaTeam } : t);
        });
        return Array.from(map.values());
    }

    function tournamentNeedsEnrichment(t) {
        if (!t) return false;
        if (!extractTournamentSlug(t)) return false;
        if (!t.format || t.participantCount == null || !t.status) return true;
        if (!tournamentGameName(t)) return true;
        return false;
    }

    function buildJoinedTournamentTeams(joinedTournaments, teams) {
        const map = new Map();
        const remember = (t, teamId) => {
            const key = tournamentListKey(t);
            const id = Number(teamId);
            if (!key || !Number.isFinite(id) || id <= 0) return;
            map.set(key, id);
        };

        (joinedTournaments || []).forEach((t) => remember(t, extractRegisteredTeamId(t)));
        (teams || []).forEach((team) => {
            collectTournamentsFromTeam(team).forEach((t) => remember(t, t.teamId ?? team.id));
        });

        return map;
    }

    function getRegisteredTeamIdForTournament(t, userCtx) {
        const fromTournament = extractRegisteredTeamId(t);
        if (fromTournament) return fromTournament;
        const key = tournamentListKey(t);
        if (!key || !(userCtx?.joinedTournamentTeams instanceof Map)) return null;
        const teamId = userCtx.joinedTournamentTeams.get(key);
        return Number.isFinite(teamId) && teamId > 0 ? teamId : null;
    }

    async function resolveWithdrawTeamId(tournament, userCtx) {
        let teamId = getWithdrawTeamId(tournament, userCtx);
        if (teamId || !isTeamTournamentFormat(tournament?.format)) return teamId;

        const slug = extractTournamentSlug(tournament);
        if (!slug) return null;

        try {
            const res = await api.getTournament(slug);
            const data = res?.data ?? res;
            const merged = { ...tournament, ...data };
            teamId = getRegisteredTeamIdForTournament(merged, userCtx);
            if (teamId) return teamId;

            const teams = getWithdrawTeamsForTournament(merged, userCtx);
            if (teams.length === 1) return Number(teams[0].id) || null;
        } catch (_) { /* ignore */ }

        return null;
    }

    async function enrichTournamentForCard(t) {
        const slug = extractTournamentSlug(t);
        if (!slug) return t;
        try {
            const res = await api.getTournament(slug);
            const full = res?.data ?? res;
            if (full?.slug || full?.id != null) {
                const teamId = t.teamId ?? extractRegisteredTeamId(full) ?? extractRegisteredTeamId(t);
                return {
                    ...t,
                    ...full,
                    teamId,
                    teamName: t.teamName,
                    teamTag: t.teamTag,
                    joinedViaTeam: t.joinedViaTeam,
                };
            }
        } catch {
            try {
                const pub = await api.findPublicTournamentBySlug(slug);
                if (pub) {
                    return {
                        ...t,
                        ...pub,
                        teamId: t.teamId,
                        teamName: t.teamName,
                        teamTag: t.teamTag,
                        joinedViaTeam: t.joinedViaTeam,
                    };
                }
            } catch (_) { /* ignore */ }
        }
        return t;
    }

    async function fetchMyParticipatingTournaments() {
        const [joinedRes, teamsRes] = await Promise.all([
            api.listMyJoined(0, 500).catch(() => null),
            api.listMyTeams().catch(() => null),
        ]);

        const personal = extractPageContent(joinedRes);
        let teams = extractListData(teamsRes);
        teams = await enrichAllTeamsWithDetails(teams);

        const fromTeams = teams.flatMap((team) => collectTournamentsFromTeam(team));
        const merged = mergeTournamentLists(personal, fromTeams);

        const enriched = await Promise.all(
            merged.map((t) => (tournamentNeedsEnrichment(t) ? enrichTournamentForCard(t) : t))
        );

        return enriched.filter((t) => tournamentListKey(t));
    }

    async function enrichAllTeamsWithDetails(teams) {
        const list = Array.isArray(teams) ? teams.slice() : [];
        await Promise.all(list.map(async (team, index) => {
            if (!team?.id) return;
            try {
                const detail = unwrapTeam(await api.getTeam(team.id));
                list[index] = { ...team, ...detail };
            } catch (_) { /* mantém resumo */ }
        }));
        return list;
    }

    async function augmentJoinedSlugsFromTournaments(items, joinedSlugs, userCtx) {
        const slugs = mergeJoinedSlugSets(joinedSlugs);
        const candidates = (items || []).filter((t) => {
            const slug = extractTournamentSlug(t);
            return slug && !isUserJoinedInTournament(t, slugs) && !isTournamentWithdrawnLocally(t);
        });
        if (!candidates.length) return slugs;

        await Promise.all(candidates.map(async (t) => {
            const slug = t.slug || extractTournamentSlug(t);
            if (!slug) return;
            try {
                const res = await api.getTournament(slug);
                const data = res?.data ?? res;
                if (!tournamentMarksJoined(data)) return;

                addJoinedSlugToSet(slugs, t);
                addJoinedSlugToSet(slugs, data);
            } catch (_) { /* ignore */ }
        }));

        return slugs;
    }

    async function enrichTeamsWithActiveTournaments(teams) {
        return enrichAllTeamsWithDetails(teams);
    }

    async function getTournamentUserContext() {
        const empty = {
            joinedSlugs: new Set(),
            joinedTournamentTeams: new Map(),
            registerableTeams: [],
            hasRegisterableTeam: false,
        };
        if (!api.isLoggedIn()) return empty;

        try {
            const [joinedRes, teamsRes] = await Promise.all([
                api.listMyJoined(0, 500).catch(() => null),
                api.listMyTeams().catch(() => null),
            ]);

            const joinedSlugs = mergeJoinedSlugSets(
                readCachedJoinedSlugs(),
                new Set()
            );
            const joinedTournaments = extractListData(joinedRes);
            joinedTournaments.forEach((t) => {
                if (!isTournamentWithdrawnLocally(t)) addJoinedSlugToSet(joinedSlugs, t);
            });

            let teams = extractListData(teamsRes);
            teams = await enrichAllTeamsWithDetails(teams);
            teams.forEach((team) => collectJoinedSlugsFromTeam(team, joinedSlugs));

            const registerableTeams = teams.filter((t) => canRegisterTeamInTournament(t));
            const joinedTournamentTeams = buildJoinedTournamentTeams(joinedTournaments, teams);

            return {
                joinedSlugs,
                joinedTournamentTeams,
                allTeams: teams,
                registerableTeams,
                hasRegisterableTeam: registerableTeams.length > 0,
            };
        } catch {
            return empty;
        }
    }

    function isRegistrationOpen(t) {
        return String(t?.status || '').toUpperCase() === 'REGISTRATION_OPEN';
    }

    function isUserJoinedInTournament(t, joinedSlugs) {
        if (!t) return false;
        if (isTournamentWithdrawnLocally(t)) return false;
        if (tournamentMarksJoined(t)) {
            return true;
        }
        if (!(joinedSlugs instanceof Set) || !joinedSlugs.size) return false;
        const slug = extractTournamentSlug(t);
        if (slug && joinedSlugs.has(slug)) return true;
        const id = t.id ?? t.tournamentId;
        if (id != null && id !== '' && joinedSlugs.has(`id:${id}`)) return true;
        return false;
    }

    function isUserEnrolledInTournament(t, userCtx, joinedSlugs) {
        if (!t) return false;
        if (isTeamTournamentFormat(t.format)) {
            return getWithdrawTeamsForTournament(t, userCtx || {}).length > 0;
        }
        return isUserJoinedInTournament(t, joinedSlugs);
    }

    function getLoggedUserClientId() {
        const id = Number(api.getUser()?.clientUserId);
        return Number.isFinite(id) && id > 0 ? id : null;
    }

    function isLoggedUserMemberOfTeam(team) {
        const myId = getLoggedUserClientId();
        if (!myId || !team) return false;
        return (team.members || team.players || []).some((member) => Number(memberClientId(member)) === myId);
    }

    /** Usuário participa via qualquer time em que é integrante (não só times gerenciáveis). */
    function isLoggedUserInAnyTeamRegistration(t, userCtx) {
        if (!t || !userCtx || isTournamentWithdrawnLocally(t)) return false;
        const teams = userCtx.allTeams || [];
        if (!teams.length) return false;
        return teams.some((team) => (
            isLoggedUserMemberOfTeam(team) && tournamentMatchesTeamRegistration(team, t)
        ));
    }

    function isLoggedUserInTournamentParticipants(participants) {
        const myId = getLoggedUserClientId();
        if (!myId || !Array.isArray(participants)) return false;

        return participants.some((item) => {
            const teamPlayers = item?.team?.players;
            if (Array.isArray(teamPlayers) && teamPlayers.length) {
                return teamPlayers.some((player) => Number(memberClientId(player)) === myId);
            }
            return Number(memberClientId(item?.player)) === myId;
        });
    }

    /** Status do usuário logado no torneio (qualquer equipe) — manda no fluxo da UI. */
    function isLoggedUserParticipatingInTournament(t, userCtx, joinedSlugs, participants) {
        if (!t || !api.isLoggedIn() || isTournamentWithdrawnLocally(t)) return false;
        if (isUserJoinedInTournament(t, joinedSlugs)) return true;
        if (isLoggedUserInAnyTeamRegistration(t, userCtx)) return true;
        if (isTeamTournamentFormat(t?.format) && isUserEnrolledInTournament(t, userCtx, joinedSlugs)) {
            return true;
        }
        if (participants && isLoggedUserInTournamentParticipants(participants)) return true;
        return false;
    }

    function findTeamMemberRegistrationConflict(t, userCtx, participants) {
        if (!isTeamTournamentFormat(t?.format) || !userCtx) return null;
        if (isLoggedUserParticipatingInTournament(t, userCtx, userCtx.joinedSlugs, participants)) return null;

        const myId = getLoggedUserClientId();
        const manageableTeams = getManageableTeams(userCtx);
        if (!manageableTeams.length) return null;

        const manageableIds = new Set(manageableTeams.map((team) => String(team.id)));
        const memberIndex = new Map();
        manageableTeams.forEach((team) => {
            (team.members || team.players || []).forEach((member) => {
                const clientId = memberClientId(member);
                if (clientId) memberIndex.set(clientId, team);
            });
        });
        if (!memberIndex.size || !Array.isArray(participants) || !participants.length) return null;

        for (let i = 0; i < participants.length; i += 1) {
            const item = participants[i];
            const regTeamId = item?.team?.id;
            if (!regTeamId || manageableIds.has(String(regTeamId))) continue;

            const players = item.team?.players || [];
            for (let j = 0; j < players.length; j += 1) {
                const clientId = memberClientId(players[j]);
                if (!clientId || !memberIndex.has(clientId)) continue;
                if (myId && Number(clientId) === myId) continue;
                return { message: TEAM_MEMBER_TOURNAMENT_CONFLICT_MSG };
            }
        }

        return null;
    }

    function collectBlockedRosterClientIds(participants, registeringTeamId, format) {
        const blocked = new Set();
        const ownTeamId = registeringTeamId != null && registeringTeamId !== ''
            ? String(registeringTeamId)
            : null;

        (participants || []).forEach((item) => {
            if (isTeamTournamentFormat(format)) {
                const regTeamId = item?.team?.id;
                if (regTeamId && ownTeamId && String(regTeamId) === ownTeamId) return;
                (item.team?.players || []).forEach((player) => {
                    const id = memberClientId(player);
                    if (id) blocked.add(id);
                });
                return;
            }

            const soloId = memberClientId(item.player);
            if (soloId) blocked.add(soloId);
        });

        return blocked;
    }

    function sanitizeTeamJoinConflictMessage(message) {
        const text = String(message || '').trim();
        if (!text) return text;
        if (/um ou mais jogadores|um ou mais integrantes|já estão inscritos neste torneio por outra equipe|já inscrit.*outr[oa] (time|equipe)/i.test(text)) {
            return TEAM_MEMBER_TOURNAMENT_CONFLICT_MSG;
        }
        return text;
    }

    function resolveEnrollmentConflictMessage(t, userCtx, joinedSlugs, options = {}) {
        if (isLoggedUserParticipatingInTournament(t, userCtx, joinedSlugs, options.participants)) {
            return '';
        }

        const hints = options.enrollmentHints || {};
        const key = tournamentListKey(t);
        if (key && hints[key]) return hints[key];

        const member = findTeamMemberRegistrationConflict(t, userCtx, options.participants);
        return member?.message || '';
    }

    async function buildEnrollmentHintsForTournaments(items, userCtx, joinedSlugs) {
        const hints = {};
        let slugsUpdated = false;
        if (!api.isLoggedIn()) return { hints, slugsUpdated };

        await Promise.all((items || []).map(async (t) => {
            if (!isTeamTournamentFormat(t?.format)) return;
            if (isLoggedUserParticipatingInTournament(t, userCtx, joinedSlugs)) {
                addJoinedSlugToSet(joinedSlugs, t);
                slugsUpdated = true;
                return;
            }

            const key = tournamentListKey(t);
            if (!key) return;

            const slug = extractTournamentSlug(t);
            if (!slug) return;

            try {
                const payload = await fetchTournamentParticipants(slug, t);
                if (isLoggedUserParticipatingInTournament(t, userCtx, joinedSlugs, payload?.participants)) {
                    addJoinedSlugToSet(joinedSlugs, t);
                    slugsUpdated = true;
                    return;
                }
                if (!userCtx?.hasRegisterableTeam) return;
                const conflict = findTeamMemberRegistrationConflict(t, userCtx, payload?.participants);
                if (conflict?.message) hints[key] = conflict.message;
            } catch (_) { /* ignore */ }
        }));

        return { hints, slugsUpdated };
    }

    function canShowInRegistrationOpenList(t, userCtx, joinedSlugs) {
        if (api.isLoggedIn() && isLoggedUserParticipatingInTournament(t, userCtx, joinedSlugs)) {
            return false;
        }
        if (isTeamTournamentFormat(t.format) && api.isLoggedIn() && !userCtx?.hasRegisterableTeam
            && !isLoggedUserParticipatingInTournament(t, userCtx, joinedSlugs)) {
            return false;
        }
        return true;
    }

    function filterTournamentsForList(items, filter, userContext) {
        let list = Array.isArray(items) ? items.slice() : [];
        const ctx = userContext || {};
        const joinedSlugs = ctx.joinedSlugs instanceof Set ? ctx.joinedSlugs : new Set();
        if (filter !== 'REGISTRATION_OPEN') return list;

        return list.filter((t) => canShowInRegistrationOpenList(t, ctx, joinedSlugs));
    }

    function renderPaginatedTournamentList(root, listEl, items, page, cardOptions) {
        const paginationEl = findPaginationEl(root, listEl);
        const totalPages = Math.max(1, Math.ceil(items.length / TOURNAMENTS_PAGE_SIZE));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const start = (safePage - 1) * TOURNAMENTS_PAGE_SIZE;
        const slice = items.slice(start, start + TOURNAMENTS_PAGE_SIZE);
        const joinedSlugs = cardOptions?.joinedSlugs;
        const hasRegisterableTeam = cardOptions?.hasRegisterableTeam !== false;

        listEl.innerHTML = slice.map((t) => tournamentCard(t, {
            ...cardOptions,
            joinedSlugs: joinedSlugs instanceof Set ? joinedSlugs : new Set(),
            joined: isLoggedUserParticipatingInTournament(t, cardOptions?.userCtx, joinedSlugs),
            showJoin: cardOptions?.showJoin
                && (!isTeamTournamentFormat(t.format) || hasRegisterableTeam),
        })).join('');
        listEl.hidden = false;
        bindJoinButtons(listEl, root);
        bindWithdrawButtons(listEl, root);
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

    function tournamentPrizeFunding(t) {
        return String(t?.prizeFunding || 'FIXED').toUpperCase();
    }

    function tournamentUsesEntryFees(t) {
        return tournamentPrizeFunding(t) === 'ENTRY_FEES';
    }

    function tournamentEntryFeeAmount(t) {
        if (!tournamentUsesEntryFees(t)) return 0;
        const fee = parseFloat(t?.entryFeeCredits);
        return Number.isFinite(fee) && fee > 0 ? fee : 0;
    }

    function isTournamentOrganizer(t) {
        if (!api.isLoggedIn() || !t) return false;
        const ownerId = t.ownerClientUserId
            ?? t.ownerId
            ?? t.organizerClientUserId
            ?? t.createdByClientUserId
            ?? t.owner?.clientUserId
            ?? t.owner?.id
            ?? t.organizer?.clientUserId;
        const myId = getLoggedUserClientId();
        return !!(myId && ownerId != null && Number(ownerId) === Number(myId));
    }

    function unwrapRevenuePayload(res) {
        return res?.data ?? res ?? {};
    }

    async function fetchWalletAvailableBalance() {
        const res = await api.getBalance();
        const w = res?.data ?? res;
        const available = parseFloat(w?.availableBalance);
        return Number.isFinite(available) ? available : 0;
    }

    function entryFeeJoinNoteHtml(tournament, balance) {
        const fee = tournamentEntryFeeAmount(tournament);
        if (fee <= 0) return '';
        const after = balance - fee;
        const insufficient = after < 0;
        return `
            <div class="ag-entry-fee-notice">
                <p><strong>Taxa de inscrição:</strong> ${formatCredits(fee)} créditos</p>
                <p class="ag-muted">Saldo disponível: ${formatCredits(balance)} créditos</p>
                ${insufficient
                    ? '<p class="ag-field-hint ag-field-hint--error">Saldo insuficiente para esta inscrição.</p>'
                    : `<p class="ag-muted">Após inscrição: ${formatCredits(after)} créditos disponíveis.</p>`}
                <p class="ag-muted">Os créditos ficam retidos até o início do torneio ou até você desistir dentro do prazo.</p>
            </div>`;
    }

    async function ensureEntryFeeAffordable(tournament, root) {
        const fee = tournamentEntryFeeAmount(tournament);
        if (fee <= 0) return true;
        const available = await fetchWalletAvailableBalance();
        if (available >= fee) return true;
        showAlert(
            $('[data-ag-alert]', root),
            `Saldo insuficiente. Necessário ${formatCredits(fee)} créditos para a taxa de inscrição (disponível: ${formatCredits(available)}).`
        );
        return false;
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
        const usesEntryFees = tournamentUsesEntryFees(t);
        const prize = usesEntryFees
            ? (t.collectedEntryFeeCredits != null
                ? `${formatCredits(t.collectedEntryFeeCredits)} créditos arrecadados`
                : 'Por arrecadação de inscrições')
            : (t.prizePool != null ? `${formatCredits(t.prizePool)} créditos` : '—');
        const feeStat = usesEntryFees ? formatEntryFee(t.entryFeeCredits) : '—';
        return [
            detailStatCard('Taxa de inscrição', feeStat, 'fee'),
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
        const generalGrid = [
            detailItem('ID', t.id),
            detailItem('Slug', t.slug),
            detailItem('Jogo', tournamentGameName(t) || '—'),
            detailItem('Organizador', t.ownerName),
            detailItem('Tipo', TYPE_LABELS[t.type] || t.type),
            detailItem('Formato', FORMAT_LABELS[t.format] || t.format),
            detailItem('Visibilidade', VISIBILITY_LABELS[t.visibility] || t.visibility),
            detailItem('Status', statusBadge(t.status)),
        ].join('');

        const participationGrid = [
            detailItem('Limite de participantes', t.participantsLimit ?? '—'),
            detailItem('Mínimo de participantes', t.minParticipants ?? '—'),
            detailItem('Participantes inscritos', t.participantCount ?? '—'),
            detailItem('Grupos', t.groupsCount ?? '—'),
        ].join('');

        const usesEntryFees = tournamentUsesEntryFees(t);
        const prizesGrid = [
            detailItem('Tipo de prêmio', PRIZE_TYPE_LABELS[t.prizeType] || t.prizeType),
            detailItem('Financiamento', PRIZE_FUNDING_LABELS[tournamentPrizeFunding(t)] || t.prizeFunding),
            usesEntryFees
                ? detailItem('Taxa de inscrição', formatEntryFee(t.entryFeeCredits))
                : '',
            usesEntryFees
                ? detailItem('Taxa do organizador', formatPercent(t.feePercentage))
                : '',
            usesEntryFees && t.collectedEntryFeeCredits != null
                ? detailItem('Arrecadado', `${formatCredits(t.collectedEntryFeeCredits)} créditos`)
                : '',
            !usesEntryFees
                ? detailItem('Premiação fixa', t.prizePool != null ? `${formatCredits(t.prizePool)} créditos` : '—')
                : '',
            detailItem('Melhor de', t.bestOf ?? '—'),
        ].filter(Boolean).join('');

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

    const PARTICIPANT_STATUS_LABELS = {
        PENDING: 'Pendente',
        APPROVED: 'Aprovado',
        WITHDRAWN: 'Desistiu',
        KICKED: 'Removido',
        REJECTED: 'Recusado',
    };

    function participantStatusLabel(status) {
        const key = String(status || '').toUpperCase();
        return PARTICIPANT_STATUS_LABELS[key] || status || '—';
    }

    function unwrapParticipantsPayload(res) {
        let data = res?.data ?? res;
        for (let i = 0; i < 3; i += 1) {
            if (Array.isArray(data?.participants)) return data;
            if (Array.isArray(data?.content)) {
                return { ...data, participants: data.content };
            }
            if (Array.isArray(data)) return { participants: data };
            if (data?.data) {
                data = data.data;
                continue;
            }
            break;
        }
        return data || {};
    }

    async function fetchTournamentParticipants(slug, tournament) {
        const apiSlug = normalizeSlug(tournament?.slug || slug);
        if (!apiSlug) return null;

        const visibility = String(tournament?.visibility || '').toUpperCase();
        const isPrivate = visibility === 'PRIVATE';
        const attempts = [];

        if (api.isLoggedIn()) {
            attempts.push({ public: false });
            if (!isPrivate) attempts.push({ public: true });
        } else if (!isPrivate) {
            attempts.push({ public: true });
        } else {
            return null;
        }

        for (const opts of attempts) {
            try {
                const res = await api.listTournamentParticipants(apiSlug, opts);
                const payload = unwrapParticipantsPayload(res);
                if (payload && Array.isArray(payload.participants)) {
                    return payload;
                }
            } catch (_) {
                /* tenta próximo endpoint */
            }
        }

        return null;
    }

    function participantPlayerCell(player) {
        if (!player) return '—';
        const nickname = publicPlayerDisplayName(player);
        const fullName = [player.firstName, player.lastName].filter(Boolean).join(' ').trim();
        const avatar = player.profileImageUrl
            ? `<img src="${escapeAttr(player.profileImageUrl)}" alt="" class="ag-tournament-participant__avatar" loading="lazy">`
            : `<span class="ag-tournament-participant__avatar ag-tournament-participant__avatar--placeholder" aria-hidden="true">${escapeHtml(teamInitials(nickname))}</span>`;
        const nameHtml = playerProfileLink(player.clientUserId, nickname);
        const sub = fullName && fullName !== nickname
            ? `<span class="ag-muted ag-tournament-participant__fullname">${escapeHtml(fullName)}</span>`
            : '';
        return `<div class="ag-tournament-participant ag-tournament-participant--player">${avatar}<div class="ag-tournament-participant__info">${nameHtml}${sub}</div></div>`;
    }

    function participantTeamCell(team) {
        if (!team) return '—';
        const name = team.name || 'Time';
        const tag = team.tag ? ` (${team.tag})` : '';
        const href = teamDetailHref(team.id);
        const logo = team.logoUrl
            ? `<img src="${escapeAttr(team.logoUrl)}" alt="" class="ag-tournament-participant__avatar" loading="lazy">`
            : `<span class="ag-tournament-participant__avatar ag-tournament-participant__avatar--placeholder" aria-hidden="true">${escapeHtml(teamInitials(name))}</span>`;
        const title = href
            ? `<a href="${escapeAttr(href)}" class="ag-link">${escapeHtml(name)}${escapeHtml(tag)}</a>`
            : `${escapeHtml(name)}${escapeHtml(tag)}`;
        return `<div class="ag-tournament-participant ag-tournament-participant--team">${logo}<div class="ag-tournament-participant__info">${title}</div></div>`;
    }

    function renderTeamParticipantPlayers(players) {
        const list = Array.isArray(players) ? players : [];
        if (!list.length) return '<span class="ag-muted">—</span>';
        return list.map((p) => {
            const nick = p.nickname || p.clientName || (p.clientUserId ? `#${p.clientUserId}` : 'Jogador');
            return playerProfileLink(p.clientUserId, nick);
        }).join(', ');
    }

    function renderSoloParticipantsTable(participants) {
        const hasStatus = participants.some((item) => String(item.status || 'APPROVED').toUpperCase() !== 'APPROVED');
        const rows = participants.map((item, index) => `<tr>
                <td>${index + 1}</td>
                <td>${participantPlayerCell(item.player)}</td>
                <td>${escapeHtml(formatDate(item.registeredAt))}</td>
                <td>${escapeHtml(item.seedNumber ?? '—')}</td>
                <td>${escapeHtml(item.groupNumber ?? '—')}</td>
                ${hasStatus ? `<td>${String(item.status || 'APPROVED').toUpperCase() !== 'APPROVED' ? `<span class="ag-badge ag-badge--muted">${escapeHtml(participantStatusLabel(item.status))}</span>` : '<span class="ag-muted">Aprovado</span>'}</td>` : ''}
            </tr>`).join('');
        return `<div class="ag-table-wrap">
            <table class="ag-table ag-tournament-participants__table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Jogador</th>
                        <th>Inscrição</th>
                        <th>Seed</th>
                        <th>Grupo</th>
                        ${hasStatus ? '<th>Status</th>' : ''}
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
    }

    function renderTeamParticipantsTable(participants) {
        const hasStatus = participants.some((item) => String(item.status || 'APPROVED').toUpperCase() !== 'APPROVED');
        const rows = participants.map((item, index) => `<tr>
                <td>${index + 1}</td>
                <td>${participantTeamCell(item.team)}</td>
                <td>${renderTeamParticipantPlayers(item.team?.players)}</td>
                <td>${escapeHtml(formatDate(item.registeredAt))}</td>
                ${hasStatus ? `<td>${String(item.status || 'APPROVED').toUpperCase() !== 'APPROVED' ? `<span class="ag-badge ag-badge--muted">${escapeHtml(participantStatusLabel(item.status))}</span>` : '<span class="ag-muted">Aprovado</span>'}</td>` : ''}
            </tr>`).join('');
        return `<div class="ag-table-wrap">
            <table class="ag-table ag-tournament-participants__table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Time</th>
                        <th>Jogadores</th>
                        <th>Inscrição</th>
                        ${hasStatus ? '<th>Status</th>' : ''}
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
    }

    function renderTournamentParticipantsSection(tournament, payload) {
        const visibility = String(tournament?.visibility || '').toUpperCase();
        if (payload === null) {
            if (visibility === 'PRIVATE') {
                return detailSection('Inscritos', '<p class="ag-muted">Lista de inscritos disponível apenas para o organizador deste torneio privado.</p>');
            }
            if (!api.isLoggedIn()) {
                return detailSection('Inscritos', '<p class="ag-muted">Entre na sua conta para ver os inscritos deste torneio.</p>');
            }
            return detailSection('Inscritos', '<p class="ag-muted">Não foi possível carregar a lista de inscritos no momento.</p>');
        }
        const list = Array.isArray(payload.participants) ? payload.participants : [];
        if (!list.length) {
            return detailSection('Inscritos', '<p class="ag-muted">Nenhum inscrito aprovado ainda.</p>');
        }
        const format = String(payload.format || tournament?.format || '').toUpperCase();
        const content = isTeamTournamentFormat(format)
            ? renderTeamParticipantsTable(list)
            : renderSoloParticipantsTable(list);
        return detailSection(`Inscritos (${list.length})`, content);
    }

    function renderEntryFeeRevenueSection(tournament, revenue) {
        const data = unwrapRevenuePayload(revenue);
        const entries = Array.isArray(data.entries) ? data.entries : [];
        const isTeam = isTeamTournamentFormat(tournament?.format);

        const summaryGrid = [
            detailItem('Taxa por inscrição', formatEntryFee(data.entryFeeCredits ?? tournament?.entryFeeCredits)),
            detailItem('Total arrecadado', `${formatCredits(data.collectedCredits)} créditos`),
            detailItem('Capturado', `${formatCredits(data.capturedCredits)} créditos`),
            detailItem('Reembolsado', `${formatCredits(data.refundedCredits)} créditos`),
        ].join('');

        let tableHtml = '<p class="ag-muted">Nenhuma inscrição com taxa registrada ainda.</p>';
        if (entries.length) {
            const participantCol = isTeam ? 'Time inscrito' : 'Jogador';
            const rows = entries.map((entry) => {
                const participant = entry.teamId
                    ? `${escapeHtml(entry.teamName || 'Time')}${entry.teamTag ? ` (${escapeHtml(entry.teamTag)})` : ''}`
                    : playerProfileLink(entry.playerClientUserId, entry.playerNickname || `Jogador #${entry.playerClientUserId}`);
                const payer = entry.payerClientUserId
                    ? playerProfileLink(entry.payerClientUserId, `Pagador #${entry.payerClientUserId}`)
                    : '—';
                const statusKey = String(entry.status || '').toUpperCase();
                const statusLabel = ENTRY_FEE_STATUS_LABELS[statusKey] || entry.status || '—';
                return `<tr>
                    <td>${participant}</td>
                    <td>${payer}</td>
                    <td>${formatCredits(entry.amount)}</td>
                    <td><span class="ag-badge ag-badge--muted">${escapeHtml(statusLabel)}</span></td>
                </tr>`;
            }).join('');
            tableHtml = `<div class="ag-table-wrap">
                <table class="ag-table ag-revenue-table">
                    <thead>
                        <tr>
                            <th>${escapeHtml(participantCol)}</th>
                            <th>Quem pagou</th>
                            <th>Valor</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        }

        return detailSection('Arrecadação de inscrições', `
            <div class="ag-tournament-meta ag-detail-section__grid">${summaryGrid}</div>
            ${tableHtml}
            <p class="ag-muted ag-revenue-hint">Na inscrição por time, a arrecadação mostra o time inscrito; o pagador pode ser o dono ou capitão.</p>
        `);
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

    function startOfLocalDay(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function canWithdrawFromTournament(t) {
        if (!t) return false;
        const status = String(t.status || '').toUpperCase();
        if (['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FINISHED'].includes(status)) {
            return false;
        }
        if (!t.startDate) {
            return true;
        }
        const startDay = startOfLocalDay(t.startDate);
        const today = startOfLocalDay(new Date());
        if (!startDay || !today) return true;
        return today < startDay;
    }

    function withdrawDeadlineHint(tournament) {
        if (tournament?.startDate) {
            return 'A desistência é permitida até o dia anterior ao início do torneio.';
        }
        return 'Este torneio ainda não tem data de início definida — você pode desistir enquanto ele não tiver começado.';
    }

    function tournamentMatchesTeamRegistration(team, t) {
        if (!team || !t) return false;
        const slug = extractTournamentSlug(t);
        const id = t.id ?? t.tournamentId;
        const matchesItem = (item) => {
            if (!item) return false;
            if (slug && extractTournamentSlug(item) === slug) return true;
            const itemId = item?.id ?? item?.tournamentId;
            return id != null && itemId != null && String(itemId) === String(id);
        };
        const lists = [
            team.activeTournaments,
            team.registeredTournaments,
            team.tournaments,
            team.currentTournaments,
        ];
        for (let i = 0; i < lists.length; i += 1) {
            if (Array.isArray(lists[i]) && lists[i].some(matchesItem)) return true;
        }
        if (matchesItem(team.currentTournament) || matchesItem(team.tournament)) return true;
        if (team.tournamentSlug && slug && normalizeSlug(team.tournamentSlug) === slug) return true;
        return false;
    }

    function getManageableTeams(userCtx) {
        const allTeams = userCtx?.allTeams || userCtx?.registerableTeams || [];
        return allTeams.filter((team) => canRegisterTeamInTournament(team));
    }

    function getWithdrawTeamsForTournament(t, userCtx) {
        if (!isTeamTournamentFormat(t?.format) || isTournamentWithdrawnLocally(t)) return [];
        const managers = getManageableTeams(userCtx);
        if (!managers.length) return [];

        const registered = managers.filter((team) => tournamentMatchesTeamRegistration(team, t));
        if (registered.length) return registered;

        const teamId = getRegisteredTeamIdForTournament(t, userCtx);
        if (teamId) {
            const match = managers.find((team) => String(team.id) === String(teamId));
            if (match) return [match];
        }

        return [];
    }

    function extractRegisteredTeamId(t) {
        if (!t) return null;
        const raw = t.teamId
            ?? t.registeredTeamId
            ?? t.participantTeamId
            ?? t.myTeamId
            ?? t.myTeam?.id
            ?? t.myTeam?.teamId
            ?? t.registeredTeam?.id
            ?? t.registeredTeam?.teamId
            ?? t.registration?.teamId
            ?? t.myRegistration?.teamId
            ?? t.participant?.teamId
            ?? t.team?.id;
        const id = Number(raw);
        return Number.isFinite(id) && id > 0 ? id : null;
    }

    function getWithdrawTeamId(t, userCtx) {
        const fromTournament = getRegisteredTeamIdForTournament(t, userCtx);
        if (fromTournament) return fromTournament;
        const teams = getWithdrawTeamsForTournament(t, userCtx);
        if (teams.length === 1) return Number(teams[0].id) || null;
        return null;
    }

    function canUserWithdrawFromTournament(t, userCtx) {
        if (!api.isLoggedIn() || !canWithdrawFromTournament(t)) return false;
        if (!isTeamTournamentFormat(t?.format)) {
            return isUserJoinedInTournament(t, userCtx?.joinedSlugs) || tournamentMarksJoined(t);
        }
        return getWithdrawTeamsForTournament(t, userCtx).length > 0;
    }

    function tournamentWithdrawAction(t, userCtx) {
        if (!userCtx) userCtx = { joinedSlugs: new Set() };
        if (!canUserWithdrawFromTournament(t, userCtx)) return '';
        const teamId = getWithdrawTeamId(t, userCtx);
        const attrs = [
            `data-ag-withdraw-slug="${escapeHtml(t.slug)}"`,
            isTeamTournamentFormat(t.format) ? `data-ag-format="${escapeHtml(t.format)}"` : '',
            teamId ? `data-ag-team-id="${escapeHtml(String(teamId))}"` : '',
        ].filter(Boolean).join(' ');
        return `<button type="button" class="ag-btn ag-btn--outline-danger ag-btn--sm ag-game-card__withdraw" ${attrs}>Desistir do torneio</button>`;
    }

    function joinActionLabelDetail() {
        return `Faça sua inscrição<span class="ag-game-card__join-enter">${rodaArrowSvg('#a6d719')}</span>`;
    }

    function updateDetailEnrollmentUI(root, slug, t, isJoined, registrationOpen, options = {}) {
        const opts = options || {};
        const canJoin = opts.canJoin !== false;
        const canWithdraw = !!opts.canWithdraw;
        const joinBtn = $('[data-ag-join]', root);
        const withdrawBtn = $('[data-ag-withdraw]', root);
        const joinedBadge = $('[data-ag-joined]', root);
        const notJoinedBadge = $('[data-ag-not-joined]', root);
        const enrollmentStatus = $('[data-ag-enrollment-status]', root);
        const detailFooter = $('[data-ag-detail-footer]', root);
        let conflictEl = $('[data-ag-enrollment-conflict]', root);

        if (detailFooter) detailFooter.hidden = false;

        const conflictMessage = isJoined ? '' : (opts.conflictMessage || '');

        if (conflictMessage) {
            if (!conflictEl && detailFooter) {
                conflictEl = document.createElement('p');
                conflictEl.className = 'ag-game-card__enrollment-conflict';
                conflictEl.dataset.agEnrollmentConflict = '';
                detailFooter.prepend(conflictEl);
            }
            if (conflictEl) {
                conflictEl.hidden = false;
                conflictEl.textContent = conflictMessage;
            }
        } else if (conflictEl) {
            conflictEl.hidden = true;
            conflictEl.textContent = '';
        }

        if (enrollmentStatus) {
            enrollmentStatus.hidden = false;
            enrollmentStatus.classList.remove('ag-enrollment-status--joined', 'ag-enrollment-status--not-joined', 'ag-enrollment-status--conflict');
            if (isJoined) {
                enrollmentStatus.textContent = 'Já inscrito';
                enrollmentStatus.classList.add('ag-enrollment-status--joined');
            } else if (conflictMessage) {
                enrollmentStatus.textContent = 'Time não inscrito';
                enrollmentStatus.classList.add('ag-enrollment-status--conflict');
            } else {
                enrollmentStatus.textContent = 'Não inscrito';
                enrollmentStatus.classList.add('ag-enrollment-status--not-joined');
            }
        }

        if (joinedBadge) joinedBadge.hidden = !isJoined;
        if (notJoinedBadge) notJoinedBadge.hidden = isJoined;

        if (withdrawBtn) {
            withdrawBtn.hidden = true;
            withdrawBtn.onclick = null;
            if (isJoined && canWithdraw) {
                withdrawBtn.hidden = false;
                withdrawBtn.onclick = async (e) => {
                    e.preventDefault();
                    await withdrawFromTournament(slug, t, root, {
                        teamId: opts.withdrawTeamId,
                    });
                };
            }
        }

        if (!joinBtn) return;

        joinBtn.hidden = true;
        joinBtn.onclick = null;
        joinBtn.classList.remove('ag-game-card__join--pulse');

        if (isJoined || !canJoin) return;

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

    function tournamentDisplayName(t) {
        if (!t) return 'Torneio';
        const name = String(t.name ?? '').trim();
        return name || t.slug || 'Torneio';
    }

    function tournamentGameName(t) {
        const name = t.presetName ?? t.gameName ?? t.game_name ?? '';
        return String(name).trim();
    }

    function extractPresetsList(res) {
        const data = res?.data ?? res;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.content)) return data.content;
        return [];
    }

    function normalizeGamePresets(res) {
        return extractPresetsList(res)
            .map((p) => ({
                id: p.id ?? p.presetId,
                name: String(p.name ?? p.gameName ?? p.presetName ?? '').trim(),
            }))
            .filter((p) => p.id != null && p.id !== '' && p.name);
    }

    function renderGamePresetOptions(presets, selectedId, fallbackName) {
        const sel = String(selectedId ?? '');
        const options = ['<option value="">Selecione o jogo</option>'];
        const seen = new Set();

        (presets || []).forEach((p) => {
            const id = String(p.id);
            if (seen.has(id)) return;
            seen.add(id);
            options.push(
                `<option value="${escapeAttr(id)}"${id === sel ? ' selected' : ''}>${escapeHtml(p.name)}</option>`
            );
        });

        if (sel && !seen.has(sel)) {
            const label = String(fallbackName || `Jogo #${sel}`).trim();
            options.push(`<option value="${escapeAttr(sel)}" selected>${escapeHtml(label)}</option>`);
        }

        return options.join('');
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
        const fundingLabel = PRIZE_FUNDING_LABELS[tournamentPrizeFunding(t)] || '';
        const usesEntryFees = tournamentUsesEntryFees(t);
        const fee = usesEntryFees ? formatEntryFee(t.entryFeeCredits) : '—';
        const feePct = usesEntryFees ? formatPercent(t.feePercentage) : '—';
        const participants = formatParticipants(t.participantCount, t.participantsLimit);
        const dateRowHtml = tournamentCardDateRow(t);

        const displayName = tournamentDisplayName(t);
        const titleInner = detailUrl
            ? `<a class="game-card__title--link" href="${escapeAttr(detailUrl)}">${escapeHtml(displayName)}</a>`
            : escapeHtml(displayName);

        const compareLink = detailUrl
            ? `<a class="game-card__compare" href="${escapeAttr(detailUrl)}" aria-label="Ver detalhes">${rodaCompareSvg()}</a>`
            : '';

        const metaHtml = [
            usesEntryFees ? cardMetaItem('Taxa de inscrição', fee) : '',
            usesEntryFees ? cardMetaItem('Taxa do organizador', feePct) : '',
            cardMetaItem('Tipo de prêmio', prizeLabel),
            fundingLabel ? cardMetaItem('Financiamento', fundingLabel) : '',
            !usesEntryFees && t.prizePool != null ? cardMetaItem('Premiação', `${formatCredits(t.prizePool)} créditos`) : '',
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
        const userCtx = options.userCtx || {};
        const joinedSlugs = options.joinedSlugs instanceof Set ? options.joinedSlugs : new Set();
        const enrolled = isLoggedUserParticipatingInTournament(
            t,
            userCtx,
            joinedSlugs,
            options.participants
        );
        const conflictMessage = enrolled
            ? ''
            : resolveEnrollmentConflictMessage(t, userCtx, joinedSlugs, options);
        const registrationOpen = isRegistrationOpen(t);

        if (enrolled) {
            footerActions += '<span class="ag-game-card__joined">Já inscrito</span>';
            if (t.joinedViaTeam && t.teamName) {
                const teamLabel = t.teamTag ? `${t.teamName} (${t.teamTag})` : t.teamName;
                footerActions += `<span class="ag-game-card__team ag-muted">Time: ${escapeHtml(teamLabel)}</span>`;
            }
            footerActions += tournamentWithdrawAction(t, {
                ...userCtx,
                joinedSlugs,
                allTeams: userCtx.allTeams || options.allTeams || [],
                registerableTeams: userCtx.registerableTeams || options.registerableTeams || [],
            });
        } else {
            if (conflictMessage) {
                footerActions += `<span class="ag-game-card__enrollment-conflict">${escapeHtml(conflictMessage)}</span>`;
            }
            if (registrationOpen && options.showJoin) {
                footerActions += `<a href="#" role="button" class="game-card__link ag-game-card__join ag-game-card__join--pulse" data-ag-join-slug="${escapeHtml(t.slug)}"${isTeamTournamentFormat(t.format) ? ` data-ag-format="${escapeHtml(t.format)}"` : ''}>${joinActionLabel()}</a>`;
            } else if (registrationOpen && !api.isLoggedIn() && cfg.loginUrl) {
                footerActions += `<a href="${escapeAttr(cfg.loginUrl)}" class="game-card__link ag-game-card__login">Entrar para se inscrever</a>`;
            }
        }
        if (detailUrl) {
            footerActions += `<a href="${escapeAttr(detailUrl)}" class="game-card__link">Ver detalhes ${rodaArrowSvg()}</a>`;
        }

        const footer = footerActions
            ? `<div class="game-card__footer ag-game-card__footer">${footerActions}</div>`
            : '';

        const cardStateClass = enrolled
            ? ' ag-tournament-card--joined'
            : (conflictMessage ? ' ag-tournament-card--conflict' : ' ag-tournament-card--not-joined');

        return `
            <div class="ag-grid__cell">
                <div class="game-card game-card--style2 ag-tournament-card${cardStateClass}" data-slug="${escapeHtml(t.slug)}" data-id="${escapeHtml(String(t.id ?? ''))}" data-status="${escapeAttr(String(t.status || ''))}" data-start-date="${escapeAttr(String(t.startDate || ''))}" data-entry-fee="${escapeAttr(String(t.entryFeeCredits ?? ''))}"${enrolled ? ' data-ag-joined="true"' : ''}>
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
                                ${enrolled ? '<span class="ag-game-card__joined ag-game-card__joined--inline">Já inscrito</span>' : ''}
                                ${!enrolled && conflictMessage ? '<span class="ag-game-card__enrollment-conflict ag-game-card__enrollment-conflict--inline">Conflito de inscrição</span>' : ''}
                            </div>
                            <div class="game-card__info ag-tournament-meta" role="list">${metaHtml}</div>
                        </div>
                    </div>
                    ${footer}
                </div>
            </div>`;
    }

    async function getJoinedSlugs() {
        const ctx = await getTournamentUserContext();
        return ctx.joinedSlugs instanceof Set ? ctx.joinedSlugs : new Set();
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

    function bindWithdrawButtons(list, root) {
        $$('[data-ag-withdraw-slug]', list).forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const slug = btn.dataset.agWithdrawSlug;
                const card = btn.closest('[data-slug]');
                const tournament = {
                    slug,
                    format: btn.dataset.agFormat || '',
                    teamId: btn.dataset.agTeamId || null,
                    status: card?.dataset?.status || '',
                    startDate: card?.dataset?.startDate || '',
                    entryFeeCredits: card?.dataset?.entryFee || '',
                    name: card?.querySelector('.game-card__title')?.textContent?.trim() || slug,
                };
                await withdrawFromTournament(slug, tournament, root, {
                    teamId: btn.dataset.agTeamId || null,
                });
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

            const userCtx = api.isLoggedIn()
                ? await getTournamentUserContext()
                : { joinedSlugs: new Set(), hasRegisterableTeam: false };

            if (api.isLoggedIn() && filter === 'REGISTRATION_OPEN' && items.length) {
                const augmentedSlugs = await augmentJoinedSlugsFromTournaments(items, userCtx.joinedSlugs, userCtx);
                userCtx.joinedSlugs = augmentedSlugs;
            }

            if (api.isLoggedIn() && items.length) {
                items.forEach((t) => {
                    if (isLoggedUserInAnyTeamRegistration(t, userCtx)) {
                        addJoinedSlugToSet(userCtx.joinedSlugs, t);
                    }
                });
            }

            items = filterTournamentsForList(items, filter, userCtx);

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
                const cardOptions = {
                    showJoin: api.isLoggedIn(),
                    joinedSlugs: userCtx.joinedSlugs instanceof Set ? userCtx.joinedSlugs : new Set(),
                    hasRegisterableTeam: !!userCtx.hasRegisterableTeam,
                    userCtx,
                    enrollmentHints: {},
                };
                renderPaginatedTournamentList(root, list, items, 1, cardOptions);

                if (api.isLoggedIn()) {
                    const slice = items.slice(0, TOURNAMENTS_PAGE_SIZE);
                    const { hints, slugsUpdated } = await buildEnrollmentHintsForTournaments(
                        slice,
                        userCtx,
                        cardOptions.joinedSlugs
                    );
                    if (listLoadSeq.get(root) !== seq) return;
                    if (slugsUpdated && filter === 'REGISTRATION_OPEN') {
                        items = filterTournamentsForList(items, filter, userCtx);
                        if (!items.length) {
                            if (list) {
                                list.innerHTML = '';
                                list.hidden = true;
                            }
                            if (empty) empty.hidden = false;
                            return;
                        }
                    }
                    renderPaginatedTournamentList(root, list, items, 1, {
                        ...cardOptions,
                        enrollmentHints: hints,
                    });
                }
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
        const apiSlug = String(slug || '').trim();
        if (!apiSlug) {
            showAlert(alert, 'Torneio inválido.');
            return;
        }
        hideAlert(alert);
        hideAlert($('[data-ag-success]', root));
        try {
            const tournamentRes = await api.getTournament(apiSlug).catch(() => null);
            const tournament = tournamentRes?.data || tournamentRes || {};
            const resolvedFormat = format || tournament.format;
            const userCtx = await getTournamentUserContext();

            let participants = null;
            if (isTeamTournamentFormat(resolvedFormat)) {
                try {
                    const participantsPayload = await fetchTournamentParticipants(apiSlug, tournament);
                    participants = participantsPayload?.participants || null;
                } catch (_) { /* ignore */ }
            }

            if (isLoggedUserParticipatingInTournament(tournament, userCtx, userCtx.joinedSlugs, participants)) {
                showAlert(alert, 'Você já está inscrito neste torneio.');
                return;
            }

            if (!(await ensureEntryFeeAffordable(tournament, root))) return;

            if (isTeamTournamentFormat(resolvedFormat)) {
                const teamsRes = await api.listMyTeams();
                const allTeams = extractListData(teamsRes);
                const teams = allTeams.filter((t) => canRegisterTeamInTournament(t));
                if (!teams.length) {
                    showAlert(alert, 'Nenhum time seu pode inscrever neste torneio. Apenas o dono (contato primário) ou o capitão.');
                    return;
                }

                const confirmed = await confirmTeamTournamentJoin(tournament, teams);
                if (!confirmed) return;

                const teamId = teams.length === 1 ? teams[0].id : await promptTeamSelect(teams);
                if (!teamId) return;

                const minPlayers = Number(tournament.minPlayersPerTeam) || 1;
                const maxPlayers = Number(tournament.maxPlayersPerTeam) || 99;

                let members = [];
                try {
                    const memRes = await api.getTeamMembers(teamId);
                    members = extractListData(memRes);
                } catch {
                    members = [];
                }
                if (!members.length) {
                    try {
                        const detail = unwrapTeam(await api.getTeam(teamId));
                        members = detail.players || [];
                    } catch {
                        members = [];
                    }
                }

                const body = { teamId: Number(teamId) };
                const rosterMembers = members.filter((m) => memberClientId(m));
                let blockedClientIds = new Set();

                if (rosterMembers.length) {
                    if (!participants) {
                        try {
                            const participantsPayload = await fetchTournamentParticipants(apiSlug, tournament);
                            participants = participantsPayload?.participants || null;
                        } catch (_) { /* ignore */ }
                    }
                    blockedClientIds = collectBlockedRosterClientIds(
                        participants,
                        teamId,
                        resolvedFormat
                    );

                    const isLargeTeam = rosterMembers.length > maxPlayers;
                    const roster = await showTeamRosterModal(rosterMembers, minPlayers, maxPlayers, {
                        largeTeam: isLargeTeam,
                        blockedClientIds,
                    });
                    if (!roster) return;
                    body.playerClientUserIds = roster.playerClientUserIds;
                } else if (members.length && members.length <= maxPlayers) {
                    // Legacy: sem clientUserId nos membros — API inscreve todos automaticamente.
                } else if (!members.length) {
                    showAlert(alert, 'Nenhum integrante encontrado no time.');
                    return;
                } else {
                    showAlert(alert, 'Não foi possível montar a escalação. Os integrantes precisam ter ID de cliente.');
                    return;
                }

                await api.joinTournamentTeam(apiSlug, body);
            } else {
                if (!(await confirmSoloTournamentJoin(tournament))) return;
                await api.joinTournament(apiSlug);
            }
            forgetWithdrawnSlug(apiSlug, tournament);
            rememberJoinedSlug(apiSlug);
            showAlert(alert, 'Inscrição realizada!', 'success');
            if (root.dataset.agPage === 'torneio') {
                await initTorneioDetail(root);
            } else if (root.dataset.agPage === 'torneios') {
                await loadTournamentList(root, root.dataset.agActiveFilter || 'REGISTRATION_OPEN');
            }
        } catch (err) {
            const message = formatTeamJoinError(err);
            const isTeamFormat = isTeamTournamentFormat(format);
            if (isTournamentAlreadyRegisteredMessage(message) && !isTeamFormat) {
                rememberJoinedSlug(apiSlug);
            }
            showAlert(alert, message);
            if (isTournamentAlreadyRegisteredMessage(message) && !isTeamFormat) {
                if (root.dataset.agPage === 'torneio') {
                    await initTorneioDetail(root);
                } else if (root.dataset.agPage === 'torneios') {
                    await loadTournamentList(root, root.dataset.agActiveFilter || 'REGISTRATION_OPEN');
                }
            }
        }
    }

    function formatTeamJoinError(err) {
        const message = String(err?.message || '').trim();
        if (!message) return 'Erro ao inscrever no torneio.';
        const payloadMsg = formatApiJoinErrorPayload(err?.payload);
        const raw = payloadMsg || message;
        return sanitizeTeamJoinConflictMessage(raw) || 'Erro ao inscrever no torneio.';
    }

    function formatApiJoinErrorPayload(payload) {
        if (!payload) return '';
        if (typeof payload === 'string') return sanitizeTeamJoinConflictMessage(payload.trim());
        const nested = payload.data;
        if (typeof nested === 'string') return sanitizeTeamJoinConflictMessage(nested.trim());
        const msg = payload.message || nested?.message || '';
        return sanitizeTeamJoinConflictMessage(String(msg).trim());
    }

    function formatWithdrawError(err) {
        const message = String(err?.message || '').trim();
        const payloadMsg = formatApiJoinErrorPayload(err?.payload);
        if (payloadMsg) return payloadMsg;
        if (!message) return 'Não foi possível desistir do torneio.';
        return message;
    }

    function mountAgModal(overlay) {
        document.body.classList.add('ag-modal-open');
        document.body.appendChild(overlay);
        return () => {
            overlay.remove();
            if (!document.querySelector('.ag-modal')) {
                document.body.classList.remove('ag-modal-open');
            }
        };
    }

    function showWithdrawConfirmModal(tournament, options = {}) {
        const opts = options || {};
        const name = tournamentDisplayName(tournament);
        const teamName = opts.teamName || '';
        const hasFee = tournamentEntryFeeAmount(tournament) > 0;

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'ag-modal';
            overlay.hidden = false;
            overlay.innerHTML = `
                <div class="ag-modal__backdrop" data-ag-withdraw-cancel></div>
                <div class="ag-modal__content ag-card game-card game-card--style2 ag-withdraw-modal">
                    <button type="button" class="ag-modal__close" data-ag-withdraw-cancel aria-label="Fechar">&times;</button>
                    <h3 class="ag-title">Desistir do torneio</h3>
                    <p class="ag-muted">Deseja cancelar sua inscrição em <strong>${escapeHtml(name)}</strong>?</p>
                    ${teamName ? `<p>Time: <strong>${escapeHtml(teamName)}</strong></p>` : ''}
                    <ul class="ag-withdraw-modal__list ag-muted">
                        <li>${escapeHtml(withdrawDeadlineHint(tournament))}</li>
                        <li>Após desistir, você pode se inscrever novamente se as inscrições ainda estiverem abertas.</li>
                        ${hasFee ? '<li>A taxa de inscrição retida será devolvida à sua carteira.</li>' : ''}
                    </ul>
                    <div class="ag-form-actions ag-withdraw-modal__actions">
                        <button type="button" class="ag-btn ag-btn--outline ag-btn--sm" data-ag-withdraw-cancel>Cancelar</button>
                        <button type="button" class="ag-btn ag-btn--danger ag-btn--sm" data-ag-withdraw-confirm>Confirmar desistência</button>
                    </div>
                </div>`;

            const unmount = mountAgModal(overlay);

            const close = (result) => {
                unmount();
                resolve(result);
            };

            overlay.querySelectorAll('[data-ag-withdraw-cancel]').forEach((el) => {
                el.addEventListener('click', () => close(false));
            });
            overlay.querySelector('[data-ag-withdraw-confirm]')?.addEventListener('click', () => close(true));
        });
    }

    async function withdrawFromTournament(slug, tournament, root, options = {}) {
        if (!api.isLoggedIn()) {
            showAlert($('[data-ag-alert]', root), cfg.i18n?.loginRequired);
            return;
        }

        const alert = $('[data-ag-alert]', root);
        const success = $('[data-ag-success]', root);
        const apiSlug = String(slug || tournament?.slug || '').trim();
        if (!apiSlug) {
            showAlert(alert, 'Torneio inválido.');
            return;
        }

        if (!canWithdrawFromTournament(tournament)) {
            showAlert(alert, tournament?.startDate
                ? 'Não é mais possível desistir. O prazo encerra no dia anterior ao início do torneio.'
                : 'Não é mais possível desistir deste torneio no momento.');
            return;
        }

        hideAlert(success);
        const userCtx = await getTournamentUserContext();

        if (!canUserWithdrawFromTournament(tournament, userCtx)) {
            showAlert(alert, isTeamTournamentFormat(tournament?.format)
                ? 'Apenas o dono (contato primário) ou o capitão do time pode desistir.'
                : 'Você não tem permissão para desistir deste torneio.');
            return;
        }

        let teamId = options.teamId != null && options.teamId !== ''
            ? Number(options.teamId)
            : null;

        if (isTeamTournamentFormat(tournament?.format)) {
            const registeredId = getRegisteredTeamIdForTournament(tournament, userCtx);
            if (!teamId || (registeredId && String(teamId) !== String(registeredId))) {
                teamId = registeredId || null;
            }
            if (!teamId) {
                teamId = await resolveWithdrawTeamId(tournament, userCtx);
            }
            if (!teamId) {
                const teams = getWithdrawTeamsForTournament(tournament, userCtx);
                if (!teams.length) {
                    showAlert(alert, 'Nenhum time seu está inscrito neste torneio.');
                    return;
                }
                teamId = teams.length === 1
                    ? Number(teams[0].id)
                    : Number(await promptTeamSelect(teams));
            }
            if (!teamId) return;
        }

        const withdrawTeams = getWithdrawTeamsForTournament(tournament, userCtx);
        const teamName = teamId
            ? (withdrawTeams.find((t) => String(t.id) === String(teamId))
                || userCtx.allTeams?.find((t) => String(t.id) === String(teamId)))?.name
            : '';

        const confirmed = await showWithdrawConfirmModal(tournament, { teamName });
        if (!confirmed) return;

        try {
            const payload = {};
            if (teamId) payload.teamId = teamId;
            await api.withdrawTournamentRegistration(apiSlug, payload);
            forgetJoinedSlug(apiSlug, tournament);
            rememberWithdrawnSlug(apiSlug, tournament);
            showAlert(success, 'Desinscrição realizada com sucesso', 'success');
            hideAlert(alert);

            const page = root.dataset.agPage;
            if (page === 'torneio') {
                await initTorneioDetail(root);
            } else if (page === 'torneios') {
                await loadTournamentList(root, root.dataset.agActiveFilter || 'REGISTRATION_OPEN');
            } else if (page === 'participando' || page === 'meus-torneios') {
                await initMeusTorneios(root);
            }
        } catch (err) {
            showAlert(alert, formatWithdrawError(err));
        }
    }

    function memberNickname(member) {
        return String(member?.clientName || member?.nickname || '').trim();
    }

    function showTeamRosterModal(members, minPlayers, maxPlayers, options = {}) {
        const opts = options || {};
        const largeTeam = !!opts.largeTeam;
        const blockedClientIds = opts.blockedClientIds instanceof Set ? opts.blockedClientIds : new Set();
        return new Promise((resolve) => {
            const list = (members || []).filter((m) => memberClientId(m));
            if (!list.length) {
                resolve(null);
                return;
            }

            const selectable = list.filter((m) => !blockedClientIds.has(memberClientId(m)));
            const preselectAll = !largeTeam && selectable.length <= maxPlayers;
            const rosterHint = largeTeam
                ? `Seu time tem mais jogadores que o limite deste torneio (${maxPlayers}). Selecione entre ${minPlayers} e ${maxPlayers} para a escalação.`
                : `Selecione entre ${minPlayers} e ${maxPlayers} jogadores para a escalação deste torneio.`;

            const overlay = document.createElement('div');
            overlay.className = 'ag-modal';
            overlay.hidden = false;
            overlay.innerHTML = `
                <div class="ag-modal__backdrop" data-ag-roster-cancel></div>
                <div class="ag-modal__content ag-card game-card game-card--style2">
                    <button type="button" class="ag-modal__close" data-ag-roster-cancel aria-label="Fechar">&times;</button>
                    <h3 class="ag-title">Escalação do time</h3>
                    <p class="ag-muted">${escapeHtml(rosterHint)}</p>
                    <p class="ag-muted ag-roster-list__hint">Integrantes já inscritos neste torneio por outra equipe não podem ser escalados.</p>
                    <ul class="ag-roster-list">
                        ${list.map((m) => {
                            const clientId = memberClientId(m);
                            const isBlocked = blockedClientIds.has(clientId);
                            const nick = memberNickname(m);
                            const badges = [];
                            if (m.ownerClient ?? m.owner) badges.push('Dono');
                            if (m.captain) badges.push('Capitão');
                            const suffix = badges.length ? ` · ${badges.join(', ')}` : '';
                            const nickLine = nick && nick !== memberDisplayName(m)
                                ? ` <span class="ag-muted">(${escapeHtml(nick)})</span>`
                                : '';
                            const blockedNote = isBlocked
                                ? ' <span class="ag-muted ag-roster-list__blocked">(já inscrito neste torneio)</span>'
                                : '';
                            const checked = preselectAll && !isBlocked ? ' checked' : '';
                            const disabled = isBlocked ? ' disabled' : '';
                            return `<li class="ag-roster-list__item${isBlocked ? ' ag-roster-list__item--blocked' : ''}">
                                <label class="ag-roster-list__label${isBlocked ? ' ag-roster-list__label--blocked' : ''}">
                                    <input type="checkbox" value="${escapeAttr(String(clientId))}" data-ag-roster-member${checked}${disabled}>
                                    <span>${escapeHtml(memberDisplayName(m))}${nickLine}${escapeHtml(suffix)}${blockedNote}</span>
                                </label>
                            </li>`;
                        }).join('')}
                    </ul>
                    <p class="ag-field-hint ag-field-hint--error" data-ag-roster-error hidden></p>
                    <div class="ag-form-actions">
                        <button type="button" class="ag-btn ag-btn--ghost" data-ag-roster-cancel>Cancelar</button>
                        <button type="button" class="ag-btn ag-btn--primary" data-ag-roster-confirm>Confirmar escalação</button>
                    </div>
                </div>`;

            const unmount = mountAgModal(overlay);

            const errorEl = overlay.querySelector('[data-ag-roster-error]');
            const close = (result) => {
                unmount();
                resolve(result);
            };

            overlay.querySelectorAll('[data-ag-roster-cancel]').forEach((el) => {
                el.addEventListener('click', () => close(null));
            });

            overlay.querySelector('[data-ag-roster-confirm]')?.addEventListener('click', () => {
                const playerClientUserIds = [...overlay.querySelectorAll('[data-ag-roster-member]:checked:not(:disabled)')]
                    .map((el) => Number(el.value))
                    .filter((id) => Number.isFinite(id) && id > 0);
                if (playerClientUserIds.length < minPlayers || playerClientUserIds.length > maxPlayers) {
                    if (errorEl) {
                        const blockedCount = overlay.querySelectorAll('[data-ag-roster-member]:disabled').length;
                        errorEl.textContent = blockedCount
                            ? `Selecione entre ${minPlayers} e ${maxPlayers} jogadores disponíveis. Integrantes já inscritos por outra equipe não podem ser escalados.`
                            : `Selecione entre ${minPlayers} e ${maxPlayers} jogadores.`;
                        errorEl.hidden = false;
                    }
                    return;
                }
                close({ playerClientUserIds });
            });
        });
    }

    function showTeamDeleteConfirmModal(team) {
        const teamName = team?.name || 'este time';
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'ag-modal';
            overlay.hidden = false;
            overlay.innerHTML = `
                <div class="ag-modal__backdrop" data-ag-delete-cancel></div>
                <div class="ag-modal__content ag-card game-card game-card--style2 ag-team-delete-modal">
                    <button type="button" class="ag-modal__close" data-ag-delete-cancel aria-label="Fechar">&times;</button>
                    <h3 class="ag-title">Excluir time</h3>
                    <p class="ag-muted">Você está prestes a excluir <strong>${escapeHtml(teamName)}</strong>. Esta ação é irreversível.</p>
                    <div class="ag-team-delete-modal__terms">
                        <h4 class="ag-team-detail__subtitle">Termos da exclusão</h4>
                        <ul class="ag-team-delete-modal__list">
                            <li>A exclusão remove permanentemente o time e não pode ser desfeita.</li>
                            <li>Todos os integrantes serão desvinculados automaticamente.</li>
                            <li>Inscrições em torneios ativos com este time podem ser canceladas.</li>
                            <li>Rank, histórico e mídias do time deixarão de estar disponíveis.</li>
                        </ul>
                    </div>
                    <label class="ag-team-delete-modal__accept">
                        <input type="checkbox" data-ag-delete-accept>
                        <span>Li e aceito os termos acima. Entendo que a exclusão é permanente.</span>
                    </label>
                    <p class="ag-field-hint ag-field-hint--error" data-ag-delete-error hidden></p>
                    <div class="ag-form-actions">
                        <button type="button" class="ag-btn ag-btn--ghost" data-ag-delete-cancel>Cancelar</button>
                        <button type="button" class="ag-btn ag-btn--danger" data-ag-delete-confirm disabled>Excluir time</button>
                    </div>
                </div>`;

            const unmount = mountAgModal(overlay);

            const accept = overlay.querySelector('[data-ag-delete-accept]');
            const confirmBtn = overlay.querySelector('[data-ag-delete-confirm]');
            const errorEl = overlay.querySelector('[data-ag-delete-error]');

            accept?.addEventListener('change', () => {
                if (confirmBtn) confirmBtn.disabled = !accept.checked;
                if (errorEl) errorEl.hidden = true;
            });

            const close = (result) => {
                unmount();
                resolve(result);
            };

            overlay.querySelectorAll('[data-ag-delete-cancel]').forEach((el) => {
                el.addEventListener('click', () => close(false));
            });

            confirmBtn?.addEventListener('click', () => {
                if (!accept?.checked) {
                    if (errorEl) {
                        errorEl.textContent = 'Aceite os termos para continuar.';
                        errorEl.hidden = false;
                    }
                    return;
                }
                close(true);
            });
        });
    }

    async function confirmSoloTournamentJoin(tournament) {
        const fee = tournamentEntryFeeAmount(tournament);
        const name = tournamentDisplayName(tournament);
        const balance = fee > 0 ? await fetchWalletAvailableBalance() : 0;
        const feeHtml = fee > 0 ? entryFeeJoinNoteHtml(tournament, balance) : '';
        const canConfirm = fee <= 0 || balance >= fee;

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'ag-modal';
            overlay.hidden = false;
            overlay.innerHTML = `
                <div class="ag-modal__backdrop" data-ag-solo-join-cancel></div>
                <div class="ag-modal__content ag-card game-card game-card--style2 ag-solo-join-modal">
                    <button type="button" class="ag-modal__close" data-ag-solo-join-cancel aria-label="Fechar">&times;</button>
                    <h3 class="ag-title">Confirmar inscrição</h3>
                    <p class="ag-muted">Deseja se inscrever em <strong>${escapeHtml(name)}</strong>?</p>
                    ${feeHtml}
                    <div class="ag-form-actions">
                        <button type="button" class="ag-btn ag-btn--ghost" data-ag-solo-join-cancel>Cancelar</button>
                        <button type="button" class="ag-btn ag-btn--primary" data-ag-solo-join-confirm${canConfirm ? '' : ' disabled'}>Confirmar inscrição</button>
                    </div>
                </div>`;

            const unmount = mountAgModal(overlay);
            const close = (result) => {
                unmount();
                resolve(result);
            };

            overlay.querySelectorAll('[data-ag-solo-join-cancel]').forEach((el) => {
                el.addEventListener('click', () => close(false));
            });
            overlay.querySelector('[data-ag-solo-join-confirm]')?.addEventListener('click', () => {
                if (canConfirm) close(true);
            });
        });
    }

    async function confirmTeamTournamentJoin(tournament, teams) {
        const formatLabel = FORMAT_LABELS[tournament?.format] || 'Times';
        const tournamentName = tournamentDisplayName(tournament);
        const teamList = Array.isArray(teams) ? teams : [];
        const singleTeam = teamList.length === 1 ? teamList[0] : null;
        const fee = tournamentEntryFeeAmount(tournament);
        const balance = fee > 0 ? await fetchWalletAvailableBalance() : 0;
        const feeHtml = fee > 0 ? entryFeeJoinNoteHtml(tournament, balance) : '';
        const canConfirm = fee <= 0 || balance >= fee;

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'ag-modal';
            overlay.hidden = false;
            overlay.innerHTML = `
                <div class="ag-modal__backdrop" data-ag-team-join-cancel></div>
                <div class="ag-modal__content ag-card game-card game-card--style2 ag-team-join-modal">
                    <button type="button" class="ag-modal__close" data-ag-team-join-cancel aria-label="Fechar">&times;</button>
                    <h3 class="ag-title">Inscrição por time</h3>
                    <p class="ag-muted">O torneio <strong>${escapeHtml(tournamentName)}</strong> é no formato <strong>${escapeHtml(formatLabel)}</strong>.</p>
                    ${singleTeam
                        ? `<p>Deseja inscrever o time <strong>${escapeHtml(singleTeam.name || 'seu time')}</strong>${singleTeam.tag ? ` (${escapeHtml(singleTeam.tag)})` : ''} neste torneio?</p>`
                        : `<p>Deseja inscrever um dos seus times neste torneio? Você poderá escolher qual time na próxima etapa.</p>`}
                    <p class="ag-muted ag-team-join-modal__note">Apenas o dono ou o capitão do time pode realizar a inscrição. A taxa é cobrada de quem inscreve.</p>
                    ${feeHtml}
                    <div class="ag-form-actions">
                        <button type="button" class="ag-btn ag-btn--ghost" data-ag-team-join-cancel>Cancelar</button>
                        <button type="button" class="ag-btn ag-btn--primary" data-ag-team-join-confirm${canConfirm ? '' : ' disabled'}>Sim, inscrever time</button>
                    </div>
                </div>`;

            const unmount = mountAgModal(overlay);

            const close = (result) => {
                unmount();
                resolve(result);
            };

            overlay.querySelectorAll('[data-ag-team-join-cancel]').forEach((el) => {
                el.addEventListener('click', () => close(false));
            });
            overlay.querySelector('[data-ag-team-join-confirm]')?.addEventListener('click', () => {
                if (canConfirm) close(true);
            });
        });
    }

    function promptTeamSelect(teams) {
        const names = teams.map((t, i) => `${i + 1}. ${t.name} (${t.tag || '—'})`).join('\n');
        const choice = window.prompt(`Escolha o time (número):\n${names}`, '1');
        const idx = parseInt(choice, 10) - 1;
        return teams[idx]?.id || null;
    }

    function initPageLinks(root) {
        const pageUrls = cfg.pageUrls || {};
        const scope = root || document;
        $$('[data-ag-link]', scope).forEach((link) => {
            const key = link.dataset.agLink;
            const url = pageUrls[key] || (key === 'login' ? cfg.loginUrl : key === 'cadastro' ? cfg.cadastroUrl : '');
            if (url && (link.getAttribute('href') === '#' || link.getAttribute('href') === '')) {
                link.href = url;
            }
        });
        $$('[data-ag-nav-link]', scope).forEach((link) => {
            const key = link.dataset.agNavLink;
            const url = pageUrls[key] || '';
            if (url && (link.getAttribute('href') === '#' || link.getAttribute('href') === '')) {
                link.href = url;
            }
        });
    }

    /* ── Login / Cadastro ── */
    function initLogin(root) {
        initPageLinks(root);
        if (redirectIfLoggedInOnAuthPage(root)) return;
        const form = $('[data-ag-form="login"]', root);
        if (!form) return;
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
        initPageLinks(root);
        if (redirectIfLoggedInOnAuthPage(root)) return;
        const form = $('[data-ag-form="cadastro"]', root);
        if (!form) return;

        bindRegisterAvatarField(form, root);
        bindRegisterFieldValidation(form);
        bindPhoneField(form);
        bindNicknameAvailability(form, root);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const alert = $('[data-ag-alert]', root);
            const success = $('[data-ag-success]', root);
            hideAlert(alert);
            hideAlert(success);

            if (!validateRegisterForm(form)) {
                return;
            }

            if (form.dataset.nicknameInvalidFormat === '1') {
                setFieldHint(form, 'nickname', { message: NICKNAME_FORMAT_MESSAGE, type: 'error' });
                return;
            }

            if (form.dataset.nicknameChecking === '1') {
                setFieldHint(form, 'nickname', { message: 'Aguarde a verificação do nickname.', type: 'muted' });
                return;
            }
            if (form.dataset.nicknameTaken === '1') {
                setFieldHint(form, 'nickname', { message: 'Nick já em uso', type: 'error' });
                return;
            }

            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            try {
                const fd = new FormData(form);
                const nickname = sanitizeNicknameInput(fd.get('nickname'));
                const nickCheck = await verifyNicknameAvailability(form, nickname);
                if (nickCheck.taken) {
                    setNicknameFieldState(form, { taken: true, checking: false });
                    return;
                }

                const avatarUrl = await resolveAvatarUrlFromForm(form, 'register');
                const body = {
                    email: String(fd.get('email') || '').trim(),
                    password: fd.get('password'),
                    firstName: String(fd.get('firstName') || '').trim(),
                    lastName: String(fd.get('lastName') || '').trim(),
                    nickname,
                    phoneNumber: serializePhoneFromForm(form) || undefined,
                    avatarUrl: avatarUrl || undefined,
                    instagramUrl: String(fd.get('instagramUrl') || '').trim() || undefined,
                    youtubeUrl: String(fd.get('youtubeUrl') || '').trim() || undefined,
                    twitchUrl: String(fd.get('twitchUrl') || '').trim() || undefined,
                };
                ['phoneNumber', 'avatarUrl', 'instagramUrl', 'youtubeUrl', 'twitchUrl'].forEach((k) => {
                    if (!body[k]) delete body[k];
                });
                await api.register(body);
                showAlert(success, 'Conta criada! Redirecionando…', 'success');
                setTimeout(redirectAfterAuth, 800);
            } catch (err) {
                showAlert(alert, err.message);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    const NICKNAME_FORMAT_MESSAGE = 'Use apenas letras e números, sem espaços ou caracteres especiais.';
    const NICKNAME_FORMAT_RE = /^[a-zA-Z0-9]+$/;

    function isValidNicknameFormat(value) {
        return NICKNAME_FORMAT_RE.test(String(value || '').trim());
    }

    function sanitizeNicknameInput(value) {
        return String(value || '').replace(/[^a-zA-Z0-9]/g, '');
    }

    function getNicknameFormatError(value) {
        const v = String(value || '').trim();
        if (!v) return '';
        if (!isValidNicknameFormat(v)) return NICKNAME_FORMAT_MESSAGE;
        return '';
    }

    const AG_PHONE_COUNTRIES = {
        BR: { dial: '55', maxDigits: 11 },
    };

    function getPhoneDigits(value) {
        return String(value || '').replace(/\D/g, '');
    }

    function formatPhoneBR(digits) {
        const d = String(digits || '').replace(/\D/g, '').slice(0, 11);
        if (!d) return '';
        if (d.length < 2) return `(${d}`;
        const area = d.slice(0, 2);
        const rest = d.slice(2);
        if (!rest) return `(${area}) `;
        if (d.length <= 6) return `(${area}) ${rest}`;
        if (d.length <= 10) {
            return `(${area}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
        }
        return `(${area}) ${rest.slice(0, 6)}-${rest.slice(6, 11)}`;
    }

    function formatPhoneForCountry(digits, countryCode) {
        const cfg = AG_PHONE_COUNTRIES[countryCode] || AG_PHONE_COUNTRIES.BR;
        const clean = String(digits || '').replace(/\D/g, '').slice(0, cfg.maxDigits);
        if (countryCode === 'BR') return formatPhoneBR(clean);
        return clean;
    }

    function parseStoredPhone(stored) {
        const digits = String(stored || '').replace(/\D/g, '');
        if (!digits) return { country: 'BR', digits: '' };

        const sorted = Object.entries(AG_PHONE_COUNTRIES)
            .sort((a, b) => b[1].dial.length - a[1].dial.length);

        for (const [code, cfg] of sorted) {
            if (digits.startsWith(cfg.dial) && digits.length > cfg.dial.length) {
                return { country: code, digits: digits.slice(cfg.dial.length) };
            }
        }

        return { country: 'BR', digits };
    }

    function serializePhoneFromForm(form) {
        const country = form.querySelector('[name="phoneCountry"]')?.value || 'BR';
        const digits = getPhoneDigits(form.querySelector('[name="phoneNumber"]')?.value);
        if (!digits) return '';
        const cfg = AG_PHONE_COUNTRIES[country] || AG_PHONE_COUNTRIES.BR;
        return `+${cfg.dial}${digits}`;
    }

    function applyPhoneToForm(form, stored) {
        const countrySelect = form.querySelector('[name="phoneCountry"]');
        const input = form.querySelector('[name="phoneNumber"]');
        if (!input) return;
        const parsed = parseStoredPhone(stored);
        if (countrySelect) countrySelect.value = parsed.country;
        input.value = formatPhoneForCountry(parsed.digits, parsed.country);
    }

    function bindPhoneField(form) {
        if (!form || form.dataset.agPhoneBound === '1') return;
        form.dataset.agPhoneBound = '1';

        const countrySelect = form.querySelector('[name="phoneCountry"]');
        const input = form.querySelector('[name="phoneNumber"]');
        if (!input) return;

        function getCountryCode() {
            return countrySelect?.value || 'BR';
        }

        function getCountryConfig() {
            return AG_PHONE_COUNTRIES[getCountryCode()] || AG_PHONE_COUNTRIES.BR;
        }

        function isFocused() {
            return document.activeElement === input;
        }

        function applyMask() {
            const cfg = getCountryConfig();
            const digits = getPhoneDigits(input.value).slice(0, cfg.maxDigits);
            const formatted = formatPhoneForCountry(digits, getCountryCode());
            if (input.value !== formatted) {
                input.value = formatted;
            }
        }

        function applyDigitsOnly() {
            const cfg = getCountryConfig();
            const digits = getPhoneDigits(input.value).slice(0, cfg.maxDigits);
            if (input.value !== digits) {
                input.value = digits;
            }
        }

        function syncPhoneDisplay() {
            if (isFocused()) {
                applyDigitsOnly();
            } else {
                applyMask();
            }
        }

        input.addEventListener('focus', () => {
            applyDigitsOnly();
            input.classList.add('ag-phone-field__number--editing');
        });

        input.addEventListener('blur', () => {
            input.classList.remove('ag-phone-field__number--editing');
            applyMask();
        });

        input.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter'].includes(e.key)) {
                return;
            }
            if (e.key === 'Backspace' || e.key === 'Delete') return;

            if (!/^\d$/.test(e.key)) {
                e.preventDefault();
                return;
            }

            const digits = getPhoneDigits(input.value);
            if (digits.length >= getCountryConfig().maxDigits) {
                e.preventDefault();
            }
        });

        input.addEventListener('input', syncPhoneDisplay);
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData)?.getData('text') || '';
            const cfg = getCountryConfig();
            const digits = (getPhoneDigits(input.value) + getPhoneDigits(pasted)).slice(0, cfg.maxDigits);
            input.value = isFocused() ? digits : formatPhoneForCountry(digits, getCountryCode());
        });
        countrySelect?.addEventListener('change', syncPhoneDisplay);
    }

    function parseNicknameAvailable(res) {
        if (res && typeof res.available === 'boolean') {
            return res.available;
        }
        return api.normalizeNicknameAvailability(res)?.available ?? null;
    }

    async function verifyNicknameAvailability(form, nickname) {
        const value = sanitizeNicknameInput(nickname);
        if (!value) return { taken: false };

        if (!isValidNicknameFormat(value)) {
            throw new Error(NICKNAME_FORMAT_MESSAGE);
        }

        const original = String(form.dataset.originalNickname || '').trim().toLowerCase();
        if (original && value.toLowerCase() === original) {
            return { taken: false };
        }

        const result = await api.checkNicknameAvailable(value, {
            authenticated: form?.dataset?.agNicknameAuth === '1',
        });
        return { taken: result.available === false };
    }

    function setFieldHint(form, fieldName, { message = '', type = '' } = {}) {
        const slot = form?.querySelector(`[data-ag-field-hint="${fieldName}"]`);
        if (!slot) return;
        slot.textContent = message;
        slot.className = 'ag-field-hint-slot' + (type ? ` ag-field-hint-slot--${type}` : '');
    }

    function setFieldInvalid(form, fieldName, invalid) {
        const input = form?.querySelector(`[name="${fieldName}"]`);
        if (input) input.classList.toggle('ag-field__input--invalid', !!invalid);
    }

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
    }

    const REGISTER_FIELD_RULES = [
        { name: 'nickname', required: true, emptyMessage: 'Campo obrigatório.' },
        { name: 'firstName', required: true, emptyMessage: 'Campo obrigatório.' },
        { name: 'lastName', required: true, emptyMessage: 'Campo obrigatório.' },
        { name: 'email', required: true, emptyMessage: 'Campo obrigatório.', email: true },
        { name: 'password', required: true, emptyMessage: 'Campo obrigatório.', minLength: 6, minMessage: 'Mínimo de 6 caracteres.' },
    ];

    function validateRegisterForm(form) {
        let valid = true;

        REGISTER_FIELD_RULES.forEach((rule) => {
            const input = form.querySelector(`[name="${rule.name}"]`);
            const value = String(input?.value || '').trim();
            let message = '';

            if (rule.required && !value) {
                message = rule.emptyMessage;
            } else if (rule.name === 'nickname' && value && !isValidNicknameFormat(value)) {
                message = NICKNAME_FORMAT_MESSAGE;
            } else if (rule.email && value && !isValidEmail(value)) {
                message = 'E-mail inválido.';
            } else if (rule.minLength && value.length < rule.minLength) {
                message = rule.minMessage;
            }

            if (message) {
                setFieldHint(form, rule.name, { message, type: 'error' });
                setFieldInvalid(form, rule.name, true);
                valid = false;
            } else if (rule.name !== 'nickname') {
                setFieldHint(form, rule.name, { message: '', type: '' });
                setFieldInvalid(form, rule.name, false);
            }
        });

        return valid;
    }

    function bindRegisterFieldValidation(form) {
        if (!form || form.dataset.agRegisterValidationBound === '1') return;
        form.dataset.agRegisterValidationBound = '1';

        ['firstName', 'lastName', 'email', 'password'].forEach((name) => {
            const input = form.querySelector(`[name="${name}"]`);
            if (!input) return;
            input.addEventListener('input', () => {
                setFieldHint(form, name, { message: '', type: '' });
                setFieldInvalid(form, name, false);
            });
        });
    }

    function setNicknameFieldState(form, { taken = false, available = false, checking = false, invalidFormat = false } = {}) {
        const input = form?.querySelector('[name="nickname"]');
        const field = form?.querySelector('.ag-field--nickname');

        form.dataset.nicknameTaken = taken ? '1' : '0';
        form.dataset.nicknameChecking = checking ? '1' : '0';
        form.dataset.nicknameAvailable = available ? '1' : '0';
        form.dataset.nicknameInvalidFormat = invalidFormat ? '1' : '0';

        let message = '';
        let type = '';
        if (invalidFormat) {
            message = NICKNAME_FORMAT_MESSAGE;
            type = 'error';
        } else if (checking && !taken) {
            message = 'Verificando nickname…';
            type = 'muted';
        } else if (taken) {
            message = 'Nick já em uso';
            type = 'error';
        } else if (available) {
            message = 'Nickname disponível';
            type = 'ok';
        }

        setFieldHint(form, 'nickname', { message, type });

        if (input) {
            input.setCustomValidity(invalidFormat ? NICKNAME_FORMAT_MESSAGE : (taken ? 'Nick já em uso' : ''));
            input.classList.toggle('ag-field__input--invalid', taken || invalidFormat);
            input.classList.toggle('ag-field__input--valid', available && !taken && !checking && !invalidFormat);
        }
        if (field) {
            field.classList.toggle('ag-field--nickname-taken', taken || invalidFormat);
            field.classList.toggle('ag-field--nickname-available', available && !taken && !invalidFormat);
            field.classList.toggle('ag-field--nickname-checking', checking);
        }
    }

    function bindNicknameAvailability(form, root, options) {
        const opts = options || {};
        if (opts.originalNickname !== undefined) {
            form.dataset.originalNickname = opts.originalNickname;
        }
        if (opts.checkNicknameAuthenticated) {
            form.dataset.agNicknameAuth = '1';
        }
        if (form.dataset.agNicknameBound === '1') return;
        form.dataset.agNicknameBound = '1';

        const input = form?.querySelector('[name="nickname"]');
        if (!input || !form) return;

        let timer = null;
        let checkSeq = 0;

        function currentOriginalNickname() {
            return String(form.dataset.originalNickname || '').trim().toLowerCase();
        }

        function finishNicknameState(mySeq, value, state) {
            if (mySeq !== checkSeq) return;
            if (sanitizeNicknameInput(input.value) !== value) {
                setNicknameFieldState(form, { taken: false, available: false, checking: false });
                return;
            }
            setNicknameFieldState(form, state);
        }

        async function runNicknameCheck(expectedValue) {
            const value = sanitizeNicknameInput(expectedValue);
            const mySeq = ++checkSeq;

            if (!value) {
                setNicknameFieldState(form, { taken: false, available: false, checking: false });
                return;
            }

            const formatError = getNicknameFormatError(value);
            if (formatError) {
                setNicknameFieldState(form, { invalidFormat: true, checking: false });
                return;
            }

            const original = currentOriginalNickname();
            if (original && value.toLowerCase() === original) {
                setNicknameFieldState(form, { taken: false, available: true, checking: false });
                return;
            }

            setNicknameFieldState(form, { taken: false, available: false, checking: true });
            try {
                const result = await api.checkNicknameAvailable(value, {
                    authenticated: form?.dataset?.agNicknameAuth === '1',
                });
                finishNicknameState(mySeq, value, {
                    taken: result.available === false,
                    available: result.available === true,
                    checking: false,
                });
            } catch {
                finishNicknameState(mySeq, value, {
                    taken: false,
                    available: false,
                    checking: false,
                });
            }
        }

        function handleNicknameInput() {
            const raw = input.value;
            const cleaned = sanitizeNicknameInput(raw);
            if (cleaned !== raw) {
                input.value = cleaned;
                checkSeq += 1;
                clearTimeout(timer);
                setNicknameFieldState(form, { invalidFormat: true, checking: false });
                if (!cleaned) return;
            }
            scheduleNicknameCheck();
        }

        function scheduleNicknameCheck() {
            const value = sanitizeNicknameInput(input.value);
            clearTimeout(timer);
            if (!value) {
                checkSeq += 1;
                setNicknameFieldState(form, { taken: false, available: false, checking: false });
                return;
            }
            if (!isValidNicknameFormat(value)) {
                checkSeq += 1;
                setNicknameFieldState(form, { invalidFormat: true, checking: false });
                return;
            }
            setNicknameFieldState(form, { taken: false, available: false, checking: true });
            timer = setTimeout(() => runNicknameCheck(value), 350);
        }

        setNicknameFieldState(form, { taken: false, available: false, checking: false });

        input.addEventListener('input', handleNicknameInput);
        input.addEventListener('change', handleNicknameInput);
        input.addEventListener('blur', () => {
            clearTimeout(timer);
            const value = sanitizeNicknameInput(input.value);
            if (input.value !== value) input.value = value;
            if (!value) return;
            runNicknameCheck(value);
        });

        if (sanitizeNicknameInput(input.value)) {
            runNicknameCheck(input.value);
        }
    }

    function bindRegisterAvatarField(form, root) {
        if (!form || form.dataset.agAvatarBound === '1') return;
        form.dataset.agAvatarBound = '1';
        const alert = () => $('[data-ag-alert]', root);

        form.addEventListener('change', (e) => {
            if (e.target.name !== 'avatarFile') return;
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 4194304) {
                showAlert(alert(), 'Arquivo muito grande. Máximo: 4 MB.');
                e.target.value = '';
                return;
            }
            const urlInput = form.querySelector('[name="avatarUrl"]');
            if (urlInput) urlInput.value = '';
            const preview = form.querySelector('[data-ag-media-preview="avatar"]');
            if (preview) {
                preview.innerHTML = `<img src="${escapeAttr(URL.createObjectURL(file))}" alt="" class="ag-media-field__img ag-media-field__img--avatar">`;
                preview.hidden = false;
            }
        });

        form.querySelector('[name="avatarUrl"]')?.addEventListener('input', (e) => {
            const url = e.target.value?.trim();
            if (!url) {
                const preview = form.querySelector('[data-ag-media-preview="avatar"]');
                if (preview) {
                    preview.innerHTML = '';
                    preview.hidden = true;
                }
                return;
            }
            form.querySelector('[name="avatarFile"]').value = '';
            const preview = form.querySelector('[data-ag-media-preview="avatar"]');
            if (preview) {
                preview.innerHTML = `<img src="${escapeAttr(url)}" alt="" class="ag-media-field__img ag-media-field__img--avatar">`;
                preview.hidden = false;
            }
        });
    }

    async function resolveAvatarUrlFromForm(form, context) {
        const file = form.querySelector('[name="avatarFile"]')?.files?.[0];
        const url = form.querySelector('[name="avatarUrl"]')?.value?.trim() || '';
        if (file) {
            return api.uploadMedia(file, context || 'profile');
        }
        return url;
    }

    function navUserLabel(user) {
        if (!user) return '';
        const nick = String(user.nickname || '').trim();
        if (nick) return nick;
        return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    }

    function refreshNavUser(root) {
        const userEl = $('[data-ag-nav-user]', root);
        if (!userEl || !api.isLoggedIn()) return;
        const user = api.getUser();
        userEl.textContent = navUserLabel(user);
    }

    function initMenu(root) {
        const nav = $('[data-ag-nav]', root);
        const guest = $('[data-ag-nav-guest]', root);
        const userEl = $('[data-ag-nav-user]', root);
        if (api.isLoggedIn()) {
            if (nav) nav.hidden = false;
            if (guest) guest.hidden = true;
            if (userEl) userEl.textContent = navUserLabel(api.getUser());
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
            const items = await fetchMyParticipatingTournaments();
            if (!items.length) {
                if (list) {
                    list.innerHTML = '';
                    list.hidden = true;
                }
                empty.hidden = false;
                return;
            }
            empty.hidden = true;
            const userCtx = await getTournamentUserContext();
            items.forEach((t) => {
                const key = tournamentListKey(t);
                const teamId = extractRegisteredTeamId(t);
                if (key && teamId && userCtx.joinedTournamentTeams instanceof Map) {
                    userCtx.joinedTournamentTeams.set(key, teamId);
                }
            });
            const joinedSlugs = userCtx.joinedSlugs instanceof Set ? userCtx.joinedSlugs : new Set();
            renderPaginatedTournamentList(root, list, items, 1, {
                showMatches: true,
                joinedSlugs,
                userCtx,
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
            title.textContent = tournamentDisplayName(t);

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

            let participantsPayload = null;
            const participantsEl = $('[data-ag-detail-participants]', root);
            if (participantsEl) {
                participantsPayload = await fetchTournamentParticipants(t.slug || slug, t);
                participantsEl.innerHTML = renderTournamentParticipantsSection(t, participantsPayload);
                participantsEl.hidden = false;
            }

            const revenueEl = $('[data-ag-detail-revenue]', root);
            if (revenueEl) {
                let revenueHtml = '';
                if (api.isLoggedIn() && tournamentUsesEntryFees(t) && isTournamentOrganizer(t)) {
                    try {
                        const revenueRes = await api.getTournamentEntryFeeRevenue(t.slug || slug);
                        revenueHtml = renderEntryFeeRevenueSection(t, revenueRes);
                    } catch (_) {
                        revenueHtml = detailSection('Arrecadação de inscrições', '<p class="ag-muted">Não foi possível carregar a arrecadação no momento.</p>');
                    }
                }
                revenueEl.innerHTML = revenueHtml;
                revenueEl.hidden = !revenueHtml;
            }

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
            let userCtx = await getTournamentUserContext();
            if (api.isLoggedIn()) {
                userCtx = {
                    ...userCtx,
                    joinedSlugs: await augmentJoinedSlugsFromTournaments([t], userCtx.joinedSlugs, userCtx),
                };
                if (isLoggedUserInAnyTeamRegistration(t, userCtx)) {
                    addJoinedSlugToSet(userCtx.joinedSlugs, t);
                }
            }
            const isJoined = isLoggedUserParticipatingInTournament(
                t,
                userCtx,
                userCtx.joinedSlugs,
                participantsPayload?.participants
            );
            const conflictMessage = resolveEnrollmentConflictMessage(t, userCtx, userCtx.joinedSlugs, {
                participants: participantsPayload?.participants,
            });
            const registrationOpen = isRegistrationOpen(t);
            const joinSlug = t.slug || slug;
            const canWithdraw = canUserWithdrawFromTournament(t, userCtx);

            updateDetailEnrollmentUI(root, joinSlug, t, isJoined, registrationOpen, {
                canJoin: !isTeamTournamentFormat(t.format) || userCtx.hasRegisterableTeam,
                canWithdraw,
                withdrawTeamId: getWithdrawTeamId(t, userCtx),
                conflictMessage,
            });
        } catch (err) {
            showAlert(alert, err.message);
        } finally {
            setLoading(root, false);
        }
    }

    /* ── Criar torneio ── */
    function syncCreateTournamentPrizeFields(form) {
        const prizeType = form.querySelector('[data-ag-prize-type]')?.value || 'MANUAL';
        const fundingSelect = form.querySelector('[data-ag-prize-funding]');
        const entryOption = form.querySelector('[data-ag-funding-entry-fees]');
        const fixedFields = form.querySelector('[data-ag-prize-fixed-fields]');
        const entryFields = form.querySelector('[data-ag-prize-entry-fields]');
        const hintEl = form.querySelector('[data-ag-prize-hint]');
        const poolLabel = form.querySelector('[data-ag-prize-pool-label]');
        const poolInput = form.querySelector('[name="prizePool"]');
        const entryInput = form.querySelector('[name="entryFeeCredits"]');

        if (prizeType === 'MANUAL' && entryOption) {
            entryOption.hidden = true;
            if (fundingSelect?.value === 'ENTRY_FEES') fundingSelect.value = 'FIXED';
        } else if (entryOption) {
            entryOption.hidden = false;
        }

        const funding = fundingSelect?.value || 'FIXED';
        const isEntry = funding === 'ENTRY_FEES';
        const isAuto = prizeType === 'AUTOMATIC';

        if (fixedFields) fixedFields.hidden = isEntry;
        if (entryFields) entryFields.hidden = !isEntry;

        if (poolInput) poolInput.required = isAuto && !isEntry;
        if (entryInput) entryInput.required = isEntry;
        if (poolLabel) {
            poolLabel.textContent = isAuto && !isEntry
                ? 'Prêmio fixo (créditos) *'
                : 'Prêmio fixo (créditos)';
        }

        if (hintEl) {
            if (isEntry) {
                hintEl.textContent = 'Prêmio automático por arrecadação: taxa de inscrição obrigatória. Sem prêmio fixo.';
            } else if (isAuto) {
                hintEl.textContent = 'Prêmio automático fixo: informe o prêmio em créditos. Sem taxa de entrada.';
            } else {
                hintEl.textContent = 'Prêmio manual: prêmio fixo opcional. Sem taxa de entrada. Cobra apenas o custo de criar.';
            }
        }
    }

    function initCriarTorneio(root) {
        if (!requireAuth(root)) return;
        initPageLinks(root);
        const form = $('[data-ag-form="tournament-create"]', root);
        if (!form) return;

        const sync = () => syncCreateTournamentPrizeFields(form);
        form.querySelector('[data-ag-prize-type]')?.addEventListener('change', sync);
        form.querySelector('[data-ag-prize-funding]')?.addEventListener('change', sync);
        sync();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const alert = $('[data-ag-alert]', root);
            const success = $('[data-ag-success]', root);
            hideAlert(alert);
            hideAlert(success);

            const fd = new FormData(form);
            const prizeType = String(fd.get('prizeType') || '').trim();
            let prizeFunding = String(fd.get('prizeFunding') || 'FIXED').trim();
            if (prizeType === 'MANUAL') prizeFunding = 'FIXED';

            const body = {
                name: String(fd.get('name') || '').trim(),
                type: String(fd.get('type') || '').trim(),
                format: String(fd.get('format') || '').trim(),
                participantsLimit: Number(fd.get('participantsLimit')),
                prizeType,
                prizeFunding,
                visibility: String(fd.get('visibility') || 'PUBLIC').trim(),
            };

            const description = String(fd.get('description') || '').trim();
            if (description) body.description = description;

            if (prizeFunding === 'ENTRY_FEES') {
                const fee = parseFloat(fd.get('entryFeeCredits'));
                if (!Number.isFinite(fee) || fee <= 0) {
                    showAlert(alert, 'Informe a taxa de inscrição (maior que zero).');
                    return;
                }
                body.entryFeeCredits = fee;
                const pct = parseFloat(fd.get('feePercentage'));
                if (Number.isFinite(pct) && pct >= 0) body.feePercentage = pct;
            } else {
                const pool = parseFloat(fd.get('prizePool'));
                if (prizeType === 'AUTOMATIC' && (!Number.isFinite(pool) || pool <= 0)) {
                    showAlert(alert, 'Prêmio fixo obrigatório para torneio automático.');
                    return;
                }
                if (Number.isFinite(pool) && pool > 0) body.prizePool = pool;
            }

            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            try {
                const res = await api.createTournament(body);
                const created = res?.data ?? res;
                showAlert(success, 'Torneio criado com sucesso!', 'success');
                const slug = created?.slug;
                const detailUrl = slug ? tournamentDetailHref(slug) : '';
                if (detailUrl) {
                    setTimeout(() => { window.location.href = detailUrl; }, 800);
                }
            } catch (err) {
                showAlert(alert, err.message || 'Não foi possível criar o torneio.');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
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

        initPageLinks(root);

        $('[data-ag-logout]', root)?.addEventListener('click', () => {
            api.logout();
            window.location.href = cfg.loginUrl || window.location.href;
        });

        setLoading(root, true);
        try {
            const [balanceRes, participating] = await Promise.all([
                api.getBalance(),
                fetchMyParticipatingTournaments().catch(() => []),
            ]);
            const w = balanceRes.data || balanceRes;
            const balanceEl = $('[data-ag-balance-available]', root);
            const countEl = $('[data-ag-tournament-count]', root);
            if (balanceEl) balanceEl.textContent = formatCredits(w.availableBalance);
            if (countEl) {
                countEl.textContent = String(participating.length);
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
                $$('[data-ag-wallet-tab]', root).forEach((t) => {
                    t.classList.remove('ag-tab--active', 'active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('ag-tab--active', 'active');
                tab.setAttribute('aria-selected', 'true');
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
    function teamInitials(name) {
        if (!name) return '?';
        const parts = String(name).trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0].slice(0, 2).toUpperCase();
    }

    function unwrapTeam(res) {
        let team = res?.data ?? res;
        if (team?.data) team = team.data;
        return team || {};
    }

    function renderTeamSocialLinks(team, className) {
        const items = [
            ['YouTube', team.youtubeUrl],
            ['Instagram', team.instagramUrl],
            ['Twitch', team.twitchUrl],
            ['Web', team.otherSocialUrl],
        ].filter(([, url]) => url);
        if (!items.length) return '';
        return `<div class="${className || 'ag-team-card__social'}">${items.map(([label, url]) =>
            `<a href="${escapeAttr(url)}" class="ag-team-social-link" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
        ).join('')}</div>`;
    }

    function renderTeamLogo(team, sizeClass) {
        const cls = sizeClass || 'ag-team-card__logo';
        if (team.logoUrl) {
            return `<img class="${cls}" src="${escapeAttr(team.logoUrl)}" alt="${escapeAttr(team.name || 'Time')}">`;
        }
        return `<div class="${cls} ${cls}--placeholder" aria-hidden="true">${escapeHtml(teamInitials(team.name))}</div>`;
    }

    function unwrapSettings(res) {
        let settings = res?.data ?? res;
        if (settings?.data) settings = settings.data;
        return settings || {};
    }

    function extractListData(res) {
        const data = res?.data ?? res;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.content)) return data.content;
        return extractPageContent(res);
    }

    function unwrapManage(res) {
        let mgmt = res?.data ?? res;
        if (mgmt?.data) mgmt = mgmt.data;
        return mgmt || {};
    }

    const TEAM_VISIBILITY_LABELS = {
        PUBLIC: 'Público',
        PRIVATE: 'Privado',
        PROTECTED: 'Protegido',
    };

    const TEAM_STATUS_LABELS = {
        ACTIVE: 'Ativo',
        IN_TOURNAMENT: 'Em torneio',
        INACTIVE: 'Inativo',
    };

    function teamVisibilityLabel(value) {
        return TEAM_VISIBILITY_LABELS[value] || value || '—';
    }

    function memberClientId(member) {
        const raw = member?.clientUserId;
        if (raw == null || raw === '') return null;
        const id = String(raw).trim();
        if (!/^\d+$/.test(id) || id === '0') return null;
        return id;
    }

    function memberDisplayName(member) {
        return member?.clientName
            || member?.nickname
            || [member?.firstName, member?.lastName].filter(Boolean).join(' ')
            || member?.username
            || member?.email
            || 'Membro';
    }

    function renderTeamSettingsInfo(settings) {
        if (!settings || typeof settings !== 'object') return '';
        const maxOwned = settings.maxOwnedTeamsPerClient ?? settings.maxOwnedTeamsPerContact ?? 1;
        const maxParticipated = settings.maxParticipatedTeamsPerClient ?? settings.maxParticipatedTeamsPerContact ?? 3;
        const maxTournamentsPerClient = settings.maxTournamentsPerClient;
        let tournamentText = 'Cada time pode participar de quantos torneios desejar.';
        if (settings.unlimitedTournamentsPerTeam === false && settings.maxTournamentsPerTeam) {
            tournamentText = `Limite de ${settings.maxTournamentsPerTeam} torneio(s) por time.`;
        } else if (settings.maxTournamentsPerTeam) {
            tournamentText = `Limite de ${settings.maxTournamentsPerTeam} torneio(s) por time.`;
        }
        const clientTournamentLimit = maxTournamentsPerClient
            ? ` Cada jogador pode estar escalado em até ${maxTournamentsPerClient} campeonato(s) simultâneo(s).`
            : '';
        return `
            <p><strong>Regras:</strong> máximo ${maxOwned} time(s) como dono, participação em até ${maxParticipated} time(s). ${tournamentText}${clientTournamentLimit}</p>
        `;
    }

    function canCreateTeam(manageableCount, settings) {
        const maxOwned = Number(settings?.maxOwnedTeamsPerClient ?? settings?.maxOwnedTeamsPerContact ?? 1);
        if (Number.isNaN(maxOwned) || maxOwned <= 0) return true;
        return manageableCount < maxOwned;
    }

    function renderTeamRankRow(rank, index, presets) {
        const presetId = rank?.presetId ?? '';
        const rankPoints = rank?.rankPoints ?? '';
        const gameName = rank?.gameName ?? '';
        return `
            <div class="ag-row ag-team-rank-row" data-ag-team-rank-row>
                <label class="ag-field">
                    <span>Jogo</span>
                    <select class="ag-field__input" name="ranks[${index}][presetId]">
                        ${renderGamePresetOptions(presets, presetId, gameName)}
                    </select>
                </label>
                <label class="ag-field">
                    <span>Pontos</span>
                    <input type="number" name="ranks[${index}][rankPoints]" min="0" step="1" value="${escapeAttr(rankPoints)}" placeholder="1500">
                </label>
                <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-remove-rank-row aria-label="Remover">&times;</button>
            </div>`;
    }

    function bindTeamRankRows(container, presets) {
        if (!container) return;
        container._agGamePresets = presets || container._agGamePresets || [];
        if (container.dataset.agRanksBound === '1') return;
        container.dataset.agRanksBound = '1';
        container.addEventListener('click', (e) => {
            const addBtn = e.target.closest('[data-ag-add-rank-row]');
            if (addBtn) {
                const list = container.querySelector('[data-ag-team-ranks-list]');
                if (!list) return;
                const index = list.querySelectorAll('[data-ag-team-rank-row]').length;
                list.insertAdjacentHTML('beforeend', renderTeamRankRow({}, index, container._agGamePresets));
                return;
            }
            const removeBtn = e.target.closest('[data-ag-remove-rank-row]');
            if (removeBtn) {
                removeBtn.closest('[data-ag-team-rank-row]')?.remove();
            }
        });
    }

    function populateTeamRankRows(form, ranks, presets) {
        const list = form?.querySelector('[data-ag-team-ranks-list]');
        if (!list) return;
        const items = Array.isArray(ranks) ? ranks : [];
        list.innerHTML = items.length
            ? items.map((rank, index) => renderTeamRankRow(rank, index, presets)).join('')
            : '';
        const ranksContainer = form.querySelector('[data-ag-team-ranks]');
        bindTeamRankRows(ranksContainer, presets);
        if (ranksContainer) ranksContainer._agGamePresets = presets || [];
    }

    function collectTeamRanksFromForm(form) {
        const rows = form?.querySelectorAll('[data-ag-team-rank-row]') || [];
        const ranks = [];
        rows.forEach((row) => {
            const presetId = row.querySelector('[name*="[presetId]"]')?.value?.trim();
            const rankPoints = row.querySelector('[name*="[rankPoints]"]')?.value?.trim();
            if (presetId && rankPoints !== '') {
                ranks.push({ presetId, rankPoints });
            }
        });
        return ranks;
    }

    const WEEKDAY_OPTIONS = [
        { value: 'MONDAY', label: 'Segunda' },
        { value: 'TUESDAY', label: 'Terça' },
        { value: 'WEDNESDAY', label: 'Quarta' },
        { value: 'THURSDAY', label: 'Quinta' },
        { value: 'FRIDAY', label: 'Sexta' },
        { value: 'SATURDAY', label: 'Sábado' },
        { value: 'SUNDAY', label: 'Domingo' },
    ];

    const WEEKDAY_ORDER = WEEKDAY_OPTIONS.map((d) => d.value);

    const AVAILABILITY_REQUEST_STATUS = {
        PENDING: 'Pendente',
        APPROVED: 'Aprovada',
        REJECTED: 'Recusada',
    };

    function extractWeeklySlots(source) {
        const slots = source?.availability?.weeklySlots;
        return Array.isArray(slots) ? slots : [];
    }

    function unwrapAvailabilityRequests(res) {
        const data = res?.data ?? res;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.content)) return data.content;
        return [];
    }

    function weekdayLabel(dayOfWeek) {
        return WEEKDAY_OPTIONS.find((d) => d.value === dayOfWeek)?.label || dayOfWeek || '—';
    }

    function sortWeeklySlots(slots) {
        return [...(slots || [])].sort(
            (a, b) => WEEKDAY_ORDER.indexOf(a.dayOfWeek) - WEEKDAY_ORDER.indexOf(b.dayOfWeek)
        );
    }

    function normalizeWeeklySlotsForApi(slots) {
        return api.normalizeWeeklySlots(slots);
    }

    function renderAvailabilityDayOptions(selected) {
        return WEEKDAY_OPTIONS.map((day) =>
            `<option value="${escapeAttr(day.value)}"${day.value === selected ? ' selected' : ''}>${escapeHtml(day.label)}</option>`
        ).join('');
    }

    function renderAvailabilitySlotRow(slot, index) {
        const day = slot?.dayOfWeek || '';
        const start = api.normalizeTimeHHmm(slot?.startTime);
        const end = api.normalizeTimeHHmm(slot?.endTime);
        return `
            <div class="ag-availability-row ag-row" data-ag-availability-row data-index="${index}">
                <label class="ag-field ag-field--compact">
                    <span>Dia</span>
                    <select class="ag-field__input" data-ag-availability-day required>
                        <option value="">Selecione</option>
                        ${renderAvailabilityDayOptions(day)}
                    </select>
                </label>
                <label class="ag-field ag-field--compact">
                    <span>Início</span>
                    <input type="time" class="ag-field__input" data-ag-availability-start value="${escapeAttr(start)}" required step="60">
                </label>
                <label class="ag-field ag-field--compact">
                    <span>Fim</span>
                    <input type="time" class="ag-field__input" data-ag-availability-end value="${escapeAttr(end)}" required step="60">
                </label>
                <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm ag-availability-row__remove" data-ag-availability-remove aria-label="Remover horário">&times;</button>
            </div>`;
    }

    function readAvailabilityPanelSlots(panel) {
        if (!panel) return [];
        if (panel.dataset.slots) {
            try {
                const parsed = JSON.parse(panel.dataset.slots);
                if (Array.isArray(parsed) && parsed.length) return parsed;
            } catch (_) { /* ignore */ }
        }
        const encoded = panel.getAttribute('data-slots');
        if (encoded) {
            try {
                const parsed = JSON.parse(encoded);
                if (Array.isArray(parsed)) return parsed;
            } catch (_) { /* ignore */ }
        }
        const editPane = panel.querySelector('[data-ag-availability-edit-pane]');
        if (editPane) {
            const fromEditor = collectAvailabilitySlotsFromEditor(editPane, { includeIncomplete: false });
            if (fromEditor.length) return fromEditor;
        }
        return [];
    }

    function collectAvailabilitySlotsFromEditor(scope, options = {}) {
        const opts = options || {};
        const root = scope?.querySelector?.('[data-ag-availability]') || scope;
        if (!root) return [];
        const rows = root.querySelectorAll('[data-ag-availability-row]');
        const slots = [];
        rows.forEach((row) => {
            const dayOfWeek = row.querySelector('[data-ag-availability-day]')?.value || '';
            const startTime = row.querySelector('[data-ag-availability-start]')?.value || '';
            const endTime = row.querySelector('[data-ag-availability-end]')?.value || '';
            if (!dayOfWeek && !startTime && !endTime) return;
            if (!opts.includeIncomplete && (!dayOfWeek || !startTime || !endTime)) return;
            slots.push({ dayOfWeek, startTime, endTime });
        });
        return opts.includeIncomplete ? slots : normalizeWeeklySlotsForApi(slots);
    }

    function syncAvailabilityPanelSlots(panel) {
        if (!panel) return [];
        const editPane = panel.querySelector('[data-ag-availability-edit-pane]');
        if (editPane) {
            const rowCount = editPane.querySelectorAll('[data-ag-availability-row]').length;
            if (rowCount > 0) {
                const fromEditor = collectAvailabilitySlotsFromEditor(editPane);
                panel.dataset.slots = JSON.stringify(fromEditor);
                return fromEditor;
            }
        }
        const stored = readAvailabilityPanelSlots(panel);
        panel.dataset.slots = JSON.stringify(stored);
        return stored;
    }

    function renderAvailabilityEditor(slots) {
        const items = sortWeeklySlots(slots);
        return `
            <div class="ag-availability" data-ag-availability>
                <p class="ag-muted ag-availability__hint">Informe os dias e horários em que você costuma jogar. Ao salvar, a lista completa substitui os horários anteriores.</p>
                <div class="ag-availability__list" data-ag-availability-list>
                    ${items.length ? items.map((slot, index) => renderAvailabilitySlotRow(slot, index)).join('') : ''}
                </div>
                <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-availability-add>Adicionar horário</button>
            </div>`;
    }

    function bindAvailabilityEditor(scope, panel) {
        const root = scope?.querySelector?.('[data-ag-availability]') || scope;
        if (!root || root.dataset.agAvailabilityBound === '1') return;
        root.dataset.agAvailabilityBound = '1';

        const list = root.querySelector('[data-ag-availability-list]');
        const addBtn = root.querySelector('[data-ag-availability-add]');
        if (!list || !addBtn) return;

        const panelEl = panel || root.closest('[data-ag-availability-panel]');

        addBtn.addEventListener('click', () => {
            if (panelEl) syncAvailabilityPanelSlots(panelEl);
            const index = list.querySelectorAll('[data-ag-availability-row]').length;
            list.insertAdjacentHTML('beforeend', renderAvailabilitySlotRow({}, index));
            bindAvailabilityRow(list.lastElementChild);
        });

        list.querySelectorAll('[data-ag-availability-row]').forEach(bindAvailabilityRow);

        function bindAvailabilityRow(row) {
            if (!row || row.dataset.agAvailabilityRowBound === '1') return;
            row.dataset.agAvailabilityRowBound = '1';
            row.querySelector('[data-ag-availability-remove]')?.addEventListener('click', () => {
                row.remove();
            });
        }
    }

    function setAvailabilityEditor(scope, slots) {
        const root = scope?.querySelector?.('[data-ag-availability]') || scope;
        if (!root) return;
        delete root.dataset.agAvailabilityBound;
        const wrapper = root.closest('[data-ag-availability-wrap]') || root.parentElement;
        const html = renderAvailabilityEditor(slots);
        if (root.matches('[data-ag-availability-wrap]')) {
            root.innerHTML = html;
            bindAvailabilityEditor(root, root.closest('[data-ag-availability-panel]'));
            return;
        }
        root.outerHTML = html;
        const next = wrapper?.querySelector('[data-ag-availability]');
        if (next) bindAvailabilityEditor(next, next.closest('[data-ag-availability-panel]'));
    }

    function collectAvailabilityFromScope(scope) {
        const root = scope?.querySelector?.('[data-ag-availability]') || scope;
        if (!root) return [];
        return collectAvailabilitySlotsFromEditor(root);
    }

    function validateAvailabilityEditor(scope) {
        const root = scope?.querySelector?.('[data-ag-availability]') || scope;
        if (!root) return '';
        const rows = root.querySelectorAll('[data-ag-availability-row]');
        for (const row of rows) {
            const day = row.querySelector('[data-ag-availability-day]')?.value || '';
            const start = row.querySelector('[data-ag-availability-start]')?.value || '';
            const end = row.querySelector('[data-ag-availability-end]')?.value || '';
            if (!day && !start && !end) continue;
            if (!day || !start || !end) {
                return 'Preencha dia, início e fim em todos os horários.';
            }
            if (start >= end) {
                return `Em ${weekdayLabel(day)}, o início deve ser anterior ao fim.`;
            }
        }
        return '';
    }

    function validateAvailabilitySlots(slots) {
        const rows = Array.isArray(slots) ? slots : [];
        for (const slot of rows) {
            if (!slot.dayOfWeek || !slot.startTime || !slot.endTime) {
                return 'Preencha dia, início e fim em todos os horários.';
            }
            if (slot.startTime >= slot.endTime) {
                return `Em ${weekdayLabel(slot.dayOfWeek)}, o início deve ser anterior ao fim.`;
            }
        }
        return '';
    }

    function formatAvailabilityTimeDisplay(time) {
        return api.normalizeTimeHHmm(time) || '—';
    }

    function renderAvailabilityPrettyLine(slot) {
        const day = weekdayLabel(slot?.dayOfWeek);
        const start = formatAvailabilityTimeDisplay(slot?.startTime);
        const end = formatAvailabilityTimeDisplay(slot?.endTime);
        return `${day}: ${start} às ${end}`;
    }

    function renderAvailabilityLocked(slots) {
        const items = sortWeeklySlots(slots);
        if (!items.length) {
            return '<p class="ag-muted ag-availability__empty">Nenhum horário configurado.</p>';
        }
        return `
            <ul class="ag-availability-schedule">
                ${items.map((slot) => `
                    <li class="ag-availability-schedule__item">${escapeHtml(renderAvailabilityPrettyLine(slot))}</li>
                `).join('')}
            </ul>`;
    }

    function renderAvailabilityPanel(slots, options = {}) {
        const opts = options || {};
        const showEdit = opts.editable !== false;
        const editLabel = opts.editLabel || 'Editar horários';
        return `
            <div class="ag-availability-panel" data-ag-availability-panel data-slots="${escapeAttr(JSON.stringify(slots || []))}">
                <div class="ag-availability-panel__view" data-ag-availability-view>
                    ${renderAvailabilityLocked(slots)}
                    ${showEdit ? `<button type="button" class="ag-btn ag-btn--ghost ag-btn--sm ag-availability-panel__edit-btn" data-ag-availability-edit>${escapeHtml(editLabel)}</button>` : ''}
                </div>
                <div class="ag-availability-panel__edit" data-ag-availability-edit-pane hidden>
                    ${renderAvailabilityEditor(slots)}
                    <div class="ag-availability__actions">
                        <button type="button" class="ag-btn ag-btn--primary ag-btn--sm" data-ag-availability-save>Salvar</button>
                        <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-availability-cancel>Cancelar</button>
                        <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-availability-clear>Limpar</button>
                    </div>
                    ${opts.hint ? `<p class="ag-muted ag-team-detail__hint">${escapeHtml(opts.hint)}</p>` : ''}
                </div>
            </div>`;
    }

    function updateAvailabilityPanelView(panel, slots) {
        if (!panel) return;
        const serialized = JSON.stringify(slots || []);
        panel.dataset.slots = serialized;
        panel.setAttribute('data-slots', serialized);
        const view = panel.querySelector('[data-ag-availability-view]');
        if (!view) return;
        const editBtn = view.querySelector('[data-ag-availability-edit]');
        const existing = view.querySelector('.ag-availability-schedule, .ag-availability__empty');
        const temp = document.createElement('div');
        temp.innerHTML = renderAvailabilityLocked(slots);
        const newNode = temp.firstElementChild;
        if (!newNode) return;
        if (existing) {
            existing.replaceWith(newNode);
        } else if (editBtn) {
            view.insertBefore(newNode, editBtn);
        } else {
            view.prepend(newNode);
        }
    }

    function openAvailabilityPanelEdit(panel) {
        if (!panel) return;
        const slots = syncAvailabilityPanelSlots(panel);
        const editPane = panel.querySelector('[data-ag-availability-edit-pane]');
        const hasRows = editPane?.querySelector('[data-ag-availability-row]');
        if (!hasRows) {
            setAvailabilityEditor(editPane, slots);
        }
        bindAvailabilityEditor(editPane, panel);
        showAvailabilityPanelEditing(panel, true);
    }

    function showAvailabilityPanelEditing(panel, editing) {
        const view = panel?.querySelector('[data-ag-availability-view]');
        const editPane = panel?.querySelector('[data-ag-availability-edit-pane]');
        if (view) view.hidden = !!editing;
        if (editPane) editPane.hidden = !editing;
        if (panel) panel.dataset.editing = editing ? '1' : '0';
    }

    function mountAvailabilityPanel(container, slots, options = {}) {
        if (!container) return null;
        container.innerHTML = renderAvailabilityPanel(slots, options);
        const panel = container.querySelector('[data-ag-availability-panel]')
            || (container.matches('[data-ag-availability-panel]') ? container : null);
        if (panel) {
            panel.dataset.slots = JSON.stringify(slots || []);
            bindAvailabilityEditor(panel.querySelector('[data-ag-availability-edit-pane]'), panel);
        }
        return panel;
    }

    function bindAvailabilityPanel(panel, callbacks = {}) {
        if (!panel || panel.dataset.agAvailabilityPanelBound === '1') return;
        panel.dataset.agAvailabilityPanelBound = '1';
        if (!panel.dataset.slots) {
            panel.dataset.slots = panel.getAttribute('data-slots') || '[]';
        }
        bindAvailabilityEditor(panel.querySelector('[data-ag-availability-edit-pane]'), panel);
        panel.querySelector('[data-ag-availability-edit]')?.addEventListener('click', () => {
            openAvailabilityPanelEdit(panel);
        });

        panel.querySelector('[data-ag-availability-cancel]')?.addEventListener('click', () => {
            showAvailabilityPanelEditing(panel, false);
            callbacks.onCancel?.();
        });

        panel.querySelector('[data-ag-availability-clear]')?.addEventListener('click', () => {
            const editPane = panel.querySelector('[data-ag-availability-edit-pane]');
            const editorHost = editPane?.querySelector('[data-ag-availability]');
            if (editorHost) {
                setAvailabilityEditor(editorHost.closest('[data-ag-availability-wrap]') || editorHost, []);
            }
        });

        panel.querySelector('[data-ag-availability-save]')?.addEventListener('click', async () => {
            const editPane = panel.querySelector('[data-ag-availability-edit-pane]');
            const validation = validateAvailabilityEditor(editPane);
            if (validation) {
                callbacks.onError?.(validation);
                return;
            }
            const slots = collectAvailabilityFromScope(editPane);
            try {
                if (callbacks.onSave) {
                    await callbacks.onSave(slots);
                }
                panel.dataset.slots = JSON.stringify(slots);
                updateAvailabilityPanelView(panel, slots);
                showAvailabilityPanelEditing(panel, false);
                callbacks.onSuccess?.(slots);
            } catch (err) {
                callbacks.onError?.(err?.message || 'Erro ao salvar horários.');
            }
        });
    }

    function renderAvailabilityReadonly(slots) {
        return renderAvailabilityLocked(slots);
    }

    function renderAvailabilityRequestsList(requests) {
        const items = Array.isArray(requests) ? requests : [];
        if (!items.length) {
            return '<p class="ag-muted">Nenhuma solicitação pendente.</p>';
        }
        return items.map((req) => {
            const status = AVAILABILITY_REQUEST_STATUS[req.status] || req.status || '—';
            const pending = req.status === 'PENDING';
            return `
                <article class="ag-availability-request" data-ag-availability-request="${escapeAttr(req.id)}">
                    <div class="ag-availability-request__head">
                        <span class="ag-badge${pending ? '' : ' ag-badge--muted'}">${escapeHtml(status)}</span>
                        ${req.createdAt ? `<span class="ag-muted ag-availability-request__date">${escapeHtml(formatDate(req.createdAt))}</span>` : ''}
                    </div>
                    ${renderAvailabilityReadonly(req.weeklySlots)}
                    ${req.message ? `<p class="ag-availability-request__message">“${escapeHtml(req.message)}”</p>` : ''}
                    ${pending ? `
                        <div class="ag-team-detail__manage-row ag-availability-request__actions">
                            <button type="button" class="ag-btn ag-btn--primary ag-btn--sm" data-ag-availability-approve="${escapeAttr(req.id)}">Aprovar</button>
                            <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-availability-reject="${escapeAttr(req.id)}">Recusar</button>
                        </div>` : ''}
                </article>`;
        }).join('');
    }

    function isCurrentUserTeamCaptain(players, canManage) {
        if (canManage) return false;
        const myId = Number(api.getUser()?.clientUserId);
        if (!myId) return false;
        return (players || []).some((p) => (
            Number(memberClientId(p)) === myId
            && p.captain
            && !(p.ownerClient ?? p.owner)
        ));
    }

    function renderTeamAvailabilitySection(detail, options) {
        const opts = options || {};
        const slots = extractWeeklySlots(detail);
        const canEdit = !!opts.canEditAvailability;
        const canRequest = !!opts.canRequestAvailabilityChange;
        const canReview = !!opts.canReviewAvailabilityRequests;
        const pendingRequests = opts.pendingAvailabilityRequests || [];

        let body = `
            <section class="ag-team-detail__section ag-availability-section">
                <h4 class="ag-team-detail__subtitle">Horários de disponibilidade</h4>`;

        if (canEdit) {
            body += `<div data-ag-team-availability-panel>${renderAvailabilityPanel(slots, {
                hint: 'Substitui todos os horários do time. Use “Limpar” e salve para remover todos.',
            })}</div>`;
        } else {
            body += renderAvailabilityLocked(slots);
        }

        if (canRequest) {
            body += `
                <div class="ag-availability-request-form" data-ag-availability-request-form>
                    <h5 class="ag-availability-request-form__title">Solicitar mudança de horários</h5>
                    <p class="ag-muted ag-team-detail__hint">Como capitão, envie uma proposta ao dono do time. Só pode haver uma solicitação pendente por vez.</p>
                    <div data-ag-captain-availability-request-pane hidden>
                        <div data-ag-availability-wrap data-ag-captain-availability-request>
                            ${renderAvailabilityEditor(slots)}
                        </div>
                        <label class="ag-field">
                            <span>Mensagem (opcional)</span>
                            <textarea class="ag-field__input" rows="2" data-ag-availability-request-message maxlength="500" placeholder="Explique a mudança proposta"></textarea>
                        </label>
                        <div class="ag-availability__actions">
                            <button type="button" class="ag-btn ag-btn--primary ag-btn--sm" data-ag-availability-request-submit>Enviar solicitação</button>
                            <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-availability-request-cancel>Cancelar</button>
                        </div>
                    </div>
                    <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-availability-request-open>Propor novos horários</button>
                </div>`;
        }

        if (canReview) {
            body += `
                <div class="ag-availability-requests" data-ag-availability-requests>
                    <h5 class="ag-availability-requests__title">Solicitações pendentes</h5>
                    ${renderAvailabilityRequestsList(pendingRequests)}
                </div>`;
        }

        body += '</section>';
        return body;
    }

    function setTeamMediaPreview(form, field, url) {
        if (!form) return;
        const preview = form.querySelector(`[data-ag-media-preview="${field}"]`);
        const hidden = form.querySelector(`[name="${field}Url"]`);
        const fileInput = form.querySelector(`[name="${field}File"]`);
        if (hidden) hidden.value = url || '';
        if (fileInput) fileInput.value = '';
        if (!preview) return;
        if (url) {
            preview.innerHTML = `<img src="${escapeAttr(url)}" alt="" class="ag-media-field__img">`;
            preview.hidden = false;
        } else {
            preview.innerHTML = '';
            preview.hidden = true;
        }
    }

    function bindTeamMediaFields(form) {
        if (!form || form.dataset.agMediaBound === '1') return;
        form.dataset.agMediaBound = '1';

        form.addEventListener('change', (e) => {
            const input = e.target;
            if (input.name !== 'logoFile' && input.name !== 'bannerFile') return;
            const field = input.name === 'logoFile' ? 'logo' : 'banner';
            const file = input.files?.[0];
            if (!file) return;

            if (file.size > 4194304) {
                showAlert($('[data-ag-alert]', form.closest('.ag-teams-page') || document), 'Arquivo muito grande. Máximo: 4 MB.');
                input.value = '';
                return;
            }

            const preview = form.querySelector(`[data-ag-media-preview="${field}"]`);
            if (preview) {
                preview.innerHTML = `<img src="${escapeAttr(URL.createObjectURL(file))}" alt="" class="ag-media-field__img">`;
                preview.hidden = false;
            }
        });
    }

    async function resolveTeamMediaUrls(form) {
        const logoFile = form.querySelector('[name="logoFile"]')?.files?.[0];
        const bannerFile = form.querySelector('[name="bannerFile"]')?.files?.[0];
        let logoUrl = form.querySelector('[name="logoUrl"]')?.value?.trim() || '';
        let bannerUrl = form.querySelector('[name="bannerUrl"]')?.value?.trim() || '';

        if (logoFile) {
            logoUrl = await api.uploadMedia(logoFile, 'team-logo');
            form.querySelector('[name="logoUrl"]').value = logoUrl;
        }
        if (bannerFile) {
            bannerUrl = await api.uploadMedia(bannerFile, 'team-banner');
            form.querySelector('[name="bannerUrl"]').value = bannerUrl;
        }

        return { logoUrl, bannerUrl };
    }

    function canDeleteTeam(detail, mgmt) {
        if (mgmt?.canManage || mgmt?.canDelete) return true;
        const myId = Number(api.getUser()?.clientUserId);
        if (!myId) return false;
        if (detail?.owner?.clientUserId && Number(detail.owner.clientUserId) === myId) return true;
        const players = detail?.players || mgmt?.members || [];
        return players.some((p) => {
            const id = Number(memberClientId(p));
            return id === myId && (p.ownerClient ?? p.owner);
        });
    }

    function resolveMyTeamRole(detail, canManage, teamMeta) {
        if (canManage) {
            return {
                primary: 'Gestão',
                badges: [{ label: 'Gestão', variant: 'success' }],
            };
        }

        const myClientId = Number(api.getUser()?.clientUserId);
        const player = (detail?.players || []).find((p) => Number(p.clientUserId) === myClientId);
        const badges = [];

        if (player?.owner) badges.push({ label: 'Dono', variant: 'success' });
        if (player?.captain) badges.push({ label: 'Capitão', variant: '' });
        if (!badges.length) badges.push({ label: 'Integrante', variant: '' });

        return {
            primary: badges.map((b) => b.label).join(' · '),
            badges,
        };
    }

    function renderTeamRoleBadges(roleInfo) {
        return (roleInfo?.badges || []).map((b) =>
            `<span class="ag-badge${b.variant ? ` ag-badge--${b.variant}` : ''}">${escapeHtml(b.label)}</span>`
        ).join('');
    }

    function teamPrivacyValue(detail) {
        return detail?.privacy || detail?.visibility || null;
    }

    function renderTeamRankLine(rank) {
        if (!rank) return '';
        const game = rank.gameName || '—';
        const points = rank.rankPoints ?? 0;
        return `<p class="ag-team-card__rank"><span class="ag-team-card__rank-label">Rank</span> ${escapeHtml(game)} · ${points} pts</p>`;
    }

    const TEAM_ACCESS_LABELS = {
        FULL: 'Completo',
        PROTECTED_SUMMARY: 'Resumo protegido',
        PRIVATE_RESTRICTED: 'Restrito',
    };

    function teamAccessLabel(value) {
        return TEAM_ACCESS_LABELS[value] || value || '—';
    }

    function renderTeamDetailMetaItem(label, value) {
        const content = value === null || value === undefined || value === ''
            ? '—'
            : value;
        return `
            <div class="ag-team-card__meta-item">
                <dt>${escapeHtml(label)}</dt>
                <dd>${typeof content === 'string' ? content : content}</dd>
            </div>`;
    }

    function renderTeamDetailBanner(detail) {
        const img = detail?.bannerUrl
            ? `<img src="${escapeAttr(detail.bannerUrl)}" alt="" class="ag-team-detail__banner-img" loading="lazy">`
            : `<div class="ag-team-detail__banner-fallback" aria-hidden="true"><div class="ag-team-detail__banner-pattern"></div></div>`;
        return `<div class="ag-team-detail__banner">${img}</div>`;
    }

    function renderTeamDetailRankSection(rank) {
        if (!rank) return '';
        return `
            <section class="ag-team-detail__section">
                <h4 class="ag-team-detail__subtitle">Rank principal</h4>
                <dl class="ag-team-card__meta ag-team-detail__meta ag-team-detail__meta--grid">
                    ${renderTeamDetailMetaItem('Jogo', escapeHtml(rank.gameName || '—'))}
                    ${renderTeamDetailMetaItem('Plataforma', escapeHtml(rank.platform || '—'))}
                    ${renderTeamDetailMetaItem('Pontos', escapeHtml(String(rank.rankPoints ?? '—')))}
                </dl>
            </section>`;
    }

    function renderTeamDetailPerformanceSection(performance) {
        if (!Array.isArray(performance) || !performance.length) return '';
        return `
            <section class="ag-team-detail__section">
                <h4 class="ag-team-detail__subtitle">Performance por jogo</h4>
                <div class="ag-table-wrap">
                    <table class="ag-table ag-team-detail__table">
                        <thead>
                            <tr>
                                <th>Jogo</th>
                                <th>Plataforma</th>
                                <th>Pontos</th>
                                <th>Global</th>
                                <th>Regional</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${performance.map((p) => `
                                <tr>
                                    <td>${escapeHtml(p.gameName || '—')}</td>
                                    <td>${escapeHtml(p.platform || '—')}</td>
                                    <td>${escapeHtml(String(p.rankPoints ?? '—'))}</td>
                                    <td>${escapeHtml(p.globalPosition != null ? `#${p.globalPosition}` : '—')}</td>
                                    <td>${escapeHtml(p.regionalPosition != null ? `#${p.regionalPosition}` : '—')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>`;
    }

    function renderTeamDetailOwnerSection(owner) {
        if (!owner) return '';
        return `
            <section class="ag-team-detail__section">
                <h4 class="ag-team-detail__subtitle">Dono</h4>
                <dl class="ag-team-card__meta ag-team-detail__meta ag-team-detail__meta--grid">
                    ${renderTeamDetailMetaItem('Nome', escapeHtml(owner.clientName || '—'))}
                    ${renderTeamDetailMetaItem('ID do cliente', escapeHtml(String(owner.clientUserId ?? '—')))}
                    ${renderTeamDetailMetaItem('Estado', escapeHtml(owner.state || '—'))}
                </dl>
            </section>`;
    }

    function renderTeamDetailPlayersSection(players, canManage) {
        if (!Array.isArray(players) || !players.length) {
            return '<p class="ag-muted">Nenhum integrante listado.</p>';
        }
        return `
            <section class="ag-team-detail__section">
                <h4 class="ag-team-detail__subtitle">Integrantes (${players.length})</h4>
                <ul class="ag-team-detail__member-list">
                    ${players.map((p) => {
                        const clientUserId = memberClientId(p);
                        const isOwner = p.ownerClient ?? p.owner;
                        const badges = [
                            isOwner ? '<span class="ag-badge ag-badge--success">Dono</span>' : '',
                            p.captain ? '<span class="ag-badge">Capitão</span>' : '',
                        ].filter(Boolean).join(' ');
                        const removeBtn = clientUserId && canManage && !isOwner
                            ? `<button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-remove-member="${clientUserId}">Remover</button>`
                            : '';
                        const idLine = clientUserId
                            ? `<span class="ag-team-detail__member-id">ID do cliente: ${escapeHtml(String(clientUserId))}</span>`
                            : '';
                        return `<li class="ag-team-member">
                            <div class="ag-team-member__info">
                                <strong>${playerProfileLink(clientUserId, memberDisplayName(p))} ${badges}</strong>
                                ${idLine}
                            </div>
                            ${removeBtn}
                        </li>`;
                    }).join('')}
                </ul>
            </section>`;
    }

    function renderTeamDetailTournamentsSection(tournaments) {
        if (!Array.isArray(tournaments) || !tournaments.length) return '';
        return `
            <section class="ag-team-detail__section">
                <h4 class="ag-team-detail__subtitle">Torneios ativos (${tournaments.length})</h4>
                <div class="ag-table-wrap">
                    <table class="ag-table ag-team-detail__table">
                        <thead>
                            <tr>
                                <th>Torneio</th>
                                <th>Jogo</th>
                                <th>Status</th>
                                <th>Inscrição</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tournaments.map((t) => {
                                const href = tournamentDetailHref(t.slug);
                                const nameCell = href
                                    ? `<a href="${escapeAttr(href)}" class="ag-link">${escapeHtml(tournamentDisplayName(t))}</a>`
                                    : escapeHtml(tournamentDisplayName(t));
                                const status = STATUS_LABELS[t.status] || t.status || '—';
                                return `
                                    <tr>
                                        <td>${nameCell}</td>
                                        <td>${escapeHtml(tournamentGameName(t) || '—')}</td>
                                        <td>${escapeHtml(status)}</td>
                                        <td>${escapeHtml(formatDate(t.registeredAt))}</td>
                                    </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </section>`;
    }

    function renderTeamCaptainSection(players, canManage) {
        if (!canManage) return '';
        const members = (players || []).filter((m) => memberClientId(m));
        if (!members.length) return '';

        const currentCaptain = members.find((m) => m.captain);
        const currentId = currentCaptain ? String(memberClientId(currentCaptain)) : '';

        return `
            <div class="ag-team-detail__manage">
                <h4 class="ag-team-detail__subtitle">Capitão</h4>
                <div class="ag-team-detail__manage-row">
                    <select class="ag-field__input" data-ag-captain-select>
                        <option value="">Selecione um integrante</option>
                        ${members.map((m) => {
                            const id = memberClientId(m);
                            const badges = [];
                            if (m.ownerClient ?? m.owner) badges.push('Dono');
                            if (m.captain) badges.push('Capitão');
                            const suffix = badges.length ? ` (${badges.join(', ')})` : '';
                            return `<option value="${escapeAttr(id)}"${String(id) === currentId ? ' selected' : ''}>${escapeHtml(memberDisplayName(m) + suffix)}</option>`;
                        }).join('')}
                    </select>
                    <button type="button" class="ag-btn ag-btn--primary ag-btn--sm" data-ag-set-captain>Definir capitão</button>
                </div>
                <p class="ag-muted ag-team-detail__hint">Apenas integrantes do time podem ser capitão. O capitão pode inscrever o time em torneios.</p>
            </div>`;
    }

    function renderTeamCard(detail, canManage, teamMeta) {
        if (detail.restricted) {
            return `
                <article class="ag-team-card ag-team-card--cyber game-card game-card--style2 ag-team-card--restricted" data-team-id="${detail.id || ''}">
                    <div class="ag-team-card__content game-card__content">
                        <p class="ag-muted">${escapeHtml(detail.message || 'Este time é privado.')}</p>
                    </div>
                    <div class="ag-team-card__footer game-card__footer ag-game-card__footer">
                        <a href="${escapeAttr(teamDetailHref(detail.id))}" class="ag-btn ag-btn--primary ag-btn--sm">Detalhes</a>
                    </div>
                </article>`;
        }

        const privacy = teamPrivacyValue(detail);
        const privacyBadge = privacy
            ? `<span class="ag-badge">${escapeHtml(teamVisibilityLabel(privacy))}</span>`
            : '';
        const role = resolveMyTeamRole(detail, canManage, teamMeta);
        const roleBadges = renderTeamRoleBadges(role);
        const description = detail.description
            ? `<p class="ag-team-card__desc">${escapeHtml(detail.description.length > 120 ? `${detail.description.slice(0, 120)}…` : detail.description)}</p>`
            : '';

        return `
            <article class="ag-team-card ag-team-card--cyber game-card game-card--style2" data-team-id="${detail.id}">
                <div class="ag-team-card__content game-card__content">
                    <div class="ag-team-card__identity">
                        ${renderTeamLogo(detail)}
                        <div class="ag-team-card__head">
                            <h3 class="game-card__title ag-team-card__name">${escapeHtml(detail.name || '—')}</h3>
                            <div class="ag-team-card__badges">${privacyBadge}${roleBadges}</div>
                        </div>
                        <div class="ag-team-card__meta-stack ag-team-card__meta--side">
                            <div class="ag-team-card__meta-item">
                                <span class="ag-team-card__meta-label">Tag</span>
                                <span class="ag-team-card__meta-value">${escapeHtml(detail.tag || '—')}</span>
                            </div>
                            <div class="ag-team-card__meta-item">
                                <span class="ag-team-card__meta-label">ID</span>
                                <span class="ag-team-card__meta-value">${escapeHtml(String(detail.id ?? '—'))}</span>
                            </div>
                        </div>
                    </div>
                    ${renderTeamRankLine(detail.rank)}
                    ${description}
                </div>
                <div class="ag-team-card__footer game-card__footer ag-game-card__footer">
                    <div class="ag-team-card__actions">
                        ${canManage ? `<button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-edit-team="${detail.id}">Editar</button>` : ''}
                        <a href="${escapeAttr(teamDetailHref(detail.id))}" class="ag-btn ag-btn--primary ag-btn--sm">Detalhes</a>
                    </div>
                </div>
            </article>`;
    }

    function renderTeamDetailView(detail, mgmt, options) {
        const opts = options || {};
        const canManage = !!mgmt?.canManage;
        const canDelete = canDeleteTeam(detail, mgmt);
        const players = Array.isArray(detail.players) && detail.players.length
            ? detail.players
            : (Array.isArray(mgmt?.members) ? mgmt.members : []);

        if (detail.restricted && !detail.name && !detail.id) {
            return `
                <div class="ag-team-detail">
                    ${detail.access ? `<p class="ag-muted">Acesso: ${escapeHtml(teamAccessLabel(detail.access))}</p>` : ''}
                    <p class="ag-alert ag-alert--error">${escapeHtml(detail.message || 'Este time é privado.')}</p>
                </div>`;
        }

        const privacy = teamPrivacyValue(detail);
        const role = resolveMyTeamRole(detail, canManage, opts.teamMeta);
        const teamStatus = detail.status ? TEAM_STATUS_LABELS[detail.status] || detail.status : null;
        const accessLabel = detail.access ? teamAccessLabel(detail.access) : null;
        const restrictedNotice = detail.restricted && detail.message
            ? `<p class="ag-alert ag-alert--error ag-team-detail__restricted">${escapeHtml(detail.message)}</p>`
            : '';

        const transferCandidates = players.filter((m) => !(m.ownerClient ?? m.owner) && memberClientId(m));
        const transferHtml = canManage && transferCandidates.length
            ? `<div class="ag-team-detail__manage">
                <h4 class="ag-team-detail__subtitle">Transferir propriedade</h4>
                <div class="ag-team-detail__manage-row">
                    <select class="ag-field__input" data-ag-transfer-select>
                        <option value="">Selecione um cliente membro</option>
                        ${transferCandidates.map((m) => {
                            const id = memberClientId(m);
                            return `<option value="${escapeAttr(id)}">${escapeHtml(memberDisplayName(m))}</option>`;
                        }).join('')}
                    </select>
                    <button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-ag-transfer-team>Transferir</button>
                </div>
            </div>`
            : '';

        const addMemberHtml = canManage
            ? `<div class="ag-team-detail__manage">
                <h4 class="ag-team-detail__subtitle">Adicionar jogador</h4>
                <div class="ag-team-detail__manage-row">
                    <input type="number" class="ag-field__input" data-ag-add-member-id min="1" placeholder="ID do jogador">
                    <button type="button" class="ag-btn ag-btn--primary ag-btn--sm" data-ag-add-member>Adicionar</button>
                </div>
                <p class="ag-muted ag-team-detail__hint">Informe o ID do jogador conforme cadastro na plataforma.</p>
            </div>`
            : '';

        const socialHtml = (detail.youtubeUrl || detail.twitchUrl || detail.instagramUrl || detail.otherSocialUrl)
            ? `<section class="ag-team-detail__section">${renderTeamSocialLinks(detail, 'ag-team-detail__social')}</section>`
            : '';

        return `
            <div class="ag-team-detail" data-team-id="${escapeAttr(detail.id)}">
                ${renderTeamDetailBanner(detail)}
                <div class="ag-team-detail__frame">
                ${restrictedNotice}
                <div class="ag-team-detail__hero">
                    ${renderTeamLogo(detail, 'ag-team-detail__logo')}
                    <div class="ag-team-detail__hero-body">
                        <h3 class="ag-team-detail__name">${escapeHtml(detail.name || '—')}</h3>
                        <div class="ag-team-card__badges">
                            ${detail.tag ? `<span class="ag-badge ag-team-card__tag">${escapeHtml(detail.tag)}</span>` : ''}
                            ${privacy ? `<span class="ag-badge">${escapeHtml(teamVisibilityLabel(privacy))}</span>` : ''}
                            ${teamStatus ? `<span class="ag-badge">${escapeHtml(teamStatus)}</span>` : ''}
                            ${accessLabel ? `<span class="ag-badge ag-badge--muted">${escapeHtml(accessLabel)}</span>` : ''}
                            ${renderTeamRoleBadges(role)}
                        </div>
                        <p class="ag-team-card__role">Seu papel: ${escapeHtml(role.primary)}</p>
                    </div>
                </div>

                <dl class="ag-team-card__meta ag-team-detail__meta ag-team-detail__meta--grid">
                    ${renderTeamDetailMetaItem('ID', escapeHtml(String(detail.id ?? '—')))}
                    ${renderTeamDetailMetaItem('Tag', escapeHtml(detail.tag || '—'))}
                    ${renderTeamDetailMetaItem('Privacidade', escapeHtml(teamVisibilityLabel(privacy) || '—'))}
                    ${renderTeamDetailMetaItem('Status', escapeHtml(teamStatus || '—'))}
                    ${accessLabel ? renderTeamDetailMetaItem('Acesso', escapeHtml(accessLabel)) : ''}
                </dl>

                ${detail.description ? `
                    <section class="ag-team-detail__section">
                        <h4 class="ag-team-detail__subtitle">Descrição</h4>
                        <p class="ag-team-detail__prose">${escapeHtml(detail.description)}</p>
                    </section>` : ''}

                ${renderTeamDetailOwnerSection(detail.owner)}
                ${renderTeamAvailabilitySection(detail, {
                    canEditAvailability: canManage,
                    canRequestAvailabilityChange: isCurrentUserTeamCaptain(players, canManage),
                    canReviewAvailabilityRequests: canManage,
                    pendingAvailabilityRequests: opts.pendingAvailabilityRequests || [],
                })}
                ${renderTeamDetailRankSection(detail.rank)}
                ${renderTeamDetailPerformanceSection(detail.performance)}
                ${renderTeamDetailTournamentsSection(detail.activeTournaments)}
                ${socialHtml}
                ${renderTeamDetailPlayersSection(players, canManage)}
                ${addMemberHtml}
                ${renderTeamCaptainSection(players, canManage)}
                ${transferHtml}
                <div class="ag-team-detail__actions">
                    ${opts.showEdit && canManage ? `<button type="button" class="ag-btn ag-btn--primary ag-btn--sm" data-ag-edit-team="${detail.id}">Editar time</button>` : ''}
                </div>
                ${canDelete ? `
                <section class="ag-team-detail__section ag-team-detail__danger">
                    <h4 class="ag-team-detail__subtitle">Excluir time</h4>
                    <p class="ag-muted ag-team-detail__danger-hint">Remova permanentemente este time. Você precisará confirmar e aceitar os termos de exclusão.</p>
                    <button type="button" class="ag-btn ag-btn--danger ag-btn--sm" data-ag-delete-team="${detail.id}">Excluir time</button>
                </section>` : ''}
                </div>
            </div>`;
    }

    function unwrapPublicPlayer(res) {
        let player = res?.data ?? res;
        if (player?.data) player = player.data;
        return player || {};
    }

    function publicPlayerDisplayName(player) {
        return player?.nickname
            || player?.username
            || player?.clientName
            || (player?.clientUserId ? `Jogador #${player.clientUserId}` : 'Jogador');
    }

    function playerPrivacyValue(player) {
        return player?.privacy || player?.visibility || null;
    }

    function renderPlayerAvatar(player, className) {
        const cls = className || 'ag-player-profile__avatar';
        const name = publicPlayerDisplayName(player);
        const imageUrl = player?.profileImageUrl || player?.avatarUrl;
        if (imageUrl) {
            return `<img class="${cls}" src="${escapeAttr(imageUrl)}" alt="${escapeAttr(name)}">`;
        }
        return `<div class="${cls} ${cls}--placeholder" aria-hidden="true">${escapeHtml(teamInitials(name))}</div>`;
    }

    function renderPlayerProfileMetaItem(label, value) {
        return `
            <div class="ag-team-card__meta-item">
                <dt>${escapeHtml(label)}</dt>
                <dd>${value === null || value === undefined || value === '' ? '—' : value}</dd>
            </div>`;
    }

    function renderPublicPlayerView(player) {
        if (player.restricted && !player.nickname && !player.clientUserId) {
            return `
                <div class="ag-player-profile__restricted">
                    ${player.access ? `<p class="ag-muted">Acesso: ${escapeHtml(teamAccessLabel(player.access))}</p>` : ''}
                    <p class="ag-alert ag-alert--error">${escapeHtml(player.message || 'Perfil privado ou indisponível.')}</p>
                </div>`;
        }

        const displayName = publicPlayerDisplayName(player);
        const privacy = playerPrivacyValue(player);
        const playerStatus = player.status ? TEAM_STATUS_LABELS[player.status] || player.status : null;
        const accessLabel = player.access ? teamAccessLabel(player.access) : null;
        const restrictedNotice = player.restricted && player.message
            ? `<p class="ag-alert ag-alert--error ag-player-profile__restricted-notice">${escapeHtml(player.message)}</p>`
            : '';

        return `
            ${restrictedNotice}
            <div class="ag-player-profile__hero">
                <div class="ag-player-profile__identity">
                    ${renderPlayerAvatar(player)}
                    <div class="ag-player-profile__hero-body">
                        <h3 class="ag-player-profile__name">${escapeHtml(displayName)}</h3>
                        <div class="ag-team-card__badges">
                            ${privacy ? `<span class="ag-badge">${escapeHtml(teamVisibilityLabel(privacy))}</span>` : ''}
                            ${playerStatus ? `<span class="ag-badge">${escapeHtml(playerStatus)}</span>` : ''}
                            ${accessLabel ? `<span class="ag-badge ag-badge--muted">${escapeHtml(accessLabel)}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
            <dl class="ag-team-card__meta ag-player-profile__meta ag-team-detail__meta--grid">
                ${renderPlayerProfileMetaItem('ID do cliente', escapeHtml(String(player.clientUserId ?? '—')))}
                ${renderPlayerProfileMetaItem('Nickname', escapeHtml(player.nickname || '—'))}
                ${renderPlayerProfileMetaItem('Privacidade', escapeHtml(teamVisibilityLabel(privacy) || '—'))}
                ${renderPlayerProfileMetaItem('Status', escapeHtml(playerStatus || '—'))}
                ${accessLabel ? renderPlayerProfileMetaItem('Acesso', escapeHtml(accessLabel)) : ''}
            </dl>
            ${renderTeamDetailRankSection(player.rank)}
            ${renderTeamDetailPerformanceSection(player.performance)}
            ${renderAvailabilitySectionIfAny(player)}
            ${renderTeamDetailTournamentsSection(player.activeTournaments)}`;
    }

    function renderAvailabilitySectionIfAny(entity) {
        const slots = extractWeeklySlots(entity);
        if (!slots.length && entity?.access && entity.access !== 'FULL') return '';
        return `
            <section class="ag-team-detail__section ag-availability-section">
                <h4 class="ag-team-detail__subtitle">Horários de disponibilidade</h4>
                ${renderAvailabilityReadonly(slots)}
            </section>`;
    }

    async function initJogador(root) {
        initPageLinks(root);
        const alert = $('[data-ag-alert]', root);
        const profile = $('[data-ag-player-profile]', root);
        const content = $('[data-ag-player-content]', root);
        const title = $('[data-ag-player-title]', root);
        const subtitle = $('[data-ag-player-subtitle]', root);

        const playerId = root.dataset.agPlayerId || parsePlayerIdFromLocation();
        root.dataset.agPlayerId = playerId;

        if (!playerId) {
            setLoading(root, false);
            showAlert(alert, 'Jogador não informado. Use /jogador/123 ou ?id=123 na URL.');
            return;
        }

        setLoading(root, true);
        try {
            let player;
            if (api.isLoggedIn()) {
                try {
                    player = unwrapPublicPlayer(await api.getPlayer(playerId));
                } catch {
                    player = unwrapPublicPlayer(await api.getPublicPlayer(playerId));
                }
            } else {
                player = unwrapPublicPlayer(await api.getPublicPlayer(playerId));
            }
            const displayName = publicPlayerDisplayName(player);

            if (title) title.textContent = displayName;
            if (subtitle) {
                if (player.nickname && displayName !== player.nickname) {
                    subtitle.textContent = player.nickname;
                    subtitle.hidden = false;
                } else {
                    subtitle.hidden = true;
                }
            }

            if (content) {
                content.innerHTML = renderPublicPlayerView(player);
            }

            if (profile) profile.hidden = false;
        } catch (err) {
            showAlert(alert, err.message);
        } finally {
            setLoading(root, false);
        }
    }

    function timesPageUrl() {
        return (cfg.pageUrls?.times || '').trim();
    }

    function timesEditUrl(teamId) {
        const base = timesPageUrl();
        if (!base) return '';
        const sep = base.includes('?') ? '&' : '?';
        return base + sep + 'edit=' + encodeURIComponent(String(teamId));
    }

    async function initTimeDetail(root) {
        if (!requireAuth(root)) return;
        initPageLinks(root);

        const alert = $('[data-ag-alert]', root);
        const success = $('[data-ag-success]', root);
        const detailEl = $('[data-ag-team-detail]', root);
        const title = $('[data-ag-team-title]', root);

        let teamId = readTeamIdFromRoot(root);
        root.setAttribute('data-ag-team-id', teamId);

        if (!teamId) {
            setLoading(root, false);
            showAlert(alert, 'Time não informado. Use /time/123 ou ?id=123 na URL.');
            return;
        }

        async function loadDetail() {
            hideAlert(alert);
            hideAlert(success);
            setLoading(root, true);
            try {
                const [detailRes, mgmtRes, myTeamsRes, requestsRes] = await Promise.all([
                    api.getTeam(teamId),
                    api.getTeamManage(teamId).catch(() => null),
                    api.listMyTeams().catch(() => null),
                    api.listTeamAvailabilityChangeRequests(teamId, true).catch(() => ({ data: [] })),
                ]);
                const detail = unwrapTeam(detailRes);
                const mgmt = mgmtRes ? unwrapManage(mgmtRes) : {};
                const myTeams = extractListData(myTeamsRes);
                const teamMeta = myTeams.find((t) => String(t.id) === String(teamId));
                const canManage = !!mgmt?.canManage;
                const requests = canManage ? unwrapAvailabilityRequests(requestsRes) : [];

                if (title) title.textContent = detail.name || 'Detalhes do time';
                if (detailEl) {
                    detailEl.innerHTML = renderTeamDetailView(detail, mgmt, {
                        showEdit: true,
                        teamMeta,
                        pendingAvailabilityRequests: canManage ? requests : [],
                    });
                    detailEl.hidden = false;

                    const ownerPanel = detailEl.querySelector('[data-ag-team-availability-panel] [data-ag-availability-panel]');
                    if (ownerPanel) {
                        bindAvailabilityPanel(ownerPanel, {
                            onSave: async (slots) => {
                                await api.updateTeam(teamId, {
                                    name: detail.name,
                                    availability: { weeklySlots: slots },
                                });
                            },
                            onSuccess: () => {
                                showAlert(success, 'Horários do time atualizados!', 'success');
                                loadDetail();
                            },
                            onError: (msg) => showAlert(alert, msg),
                        });
                    }

                    const captainPane = detailEl.querySelector('[data-ag-captain-availability-request-pane]');
                    const captainOpenBtn = detailEl.querySelector('[data-ag-availability-request-open]');
                    const captainCancelBtn = detailEl.querySelector('[data-ag-availability-request-cancel]');
                    if (captainPane && captainOpenBtn) {
                        captainOpenBtn.addEventListener('click', () => {
                            captainPane.hidden = false;
                            captainOpenBtn.hidden = true;
                            bindAvailabilityEditor(captainPane);
                        });
                        captainCancelBtn?.addEventListener('click', () => {
                            captainPane.hidden = true;
                            captainOpenBtn.hidden = false;
                        });
                    }
                }

                const teamForActions = mgmt.team
                    ? { ...mgmt.team, id: detail.id, bannerUrl: mgmt.team.bannerUrl || detail.bannerUrl }
                    : { ...detail, visibility: detail.privacy || detail.visibility };

                bindTeamDetailActions(root, detailEl, teamForActions, {
                    alert,
                    success,
                    onEdit: (t) => {
                        const href = timesEditUrl(t.id);
                        if (href) window.location.href = href;
                    },
                    onChanged: loadDetail,
                    onDeleted: () => {
                        window.location.href = timesPageUrl() || cfg.homeUrl || '/';
                    },
                });
            } catch (err) {
                showAlert(alert, err.message);
                if (detailEl) detailEl.hidden = true;
            } finally {
                setLoading(root, false);
            }
        }

        await loadDetail();
    }

    function bindTeamDetailActions(root, detailEl, team, callbacks) {
        if (!detailEl || !team?.id) return;
        const alert = callbacks.alert;
        const success = callbacks.success;
        const onChanged = callbacks.onChanged;
        const teamId = team.id;

        detailEl.querySelector('[data-ag-edit-team]')?.addEventListener('click', () => {
            callbacks.onEdit(team);
        });

        detailEl.querySelector('[data-ag-delete-team]')?.addEventListener('click', async () => {
            const accepted = await showTeamDeleteConfirmModal(team);
            if (!accepted) return;
            try {
                await api.deleteTeam(team.id);
                showAlert(success, 'Time excluído.', 'success');
                callbacks.onDeleted?.();
            } catch (err) {
                showAlert(alert, err.message);
            }
        });

        $$('[data-ag-remove-member]', detailEl).forEach((btn) => {
            btn.addEventListener('click', async () => {
                const clientUserId = memberClientId({ clientUserId: btn.dataset.agRemoveMember });
                if (!clientUserId) {
                    showAlert(alert, 'Integrante inválido.');
                    return;
                }
                if (!confirm('Remover este integrante do time?')) return;
                try {
                    await api.removeTeamMember(teamId, clientUserId);
                    showAlert(success, 'Integrante removido.', 'success');
                    await onChanged();
                } catch (err) {
                    showAlert(alert, err.message || 'Não foi possível remover o integrante.');
                }
            });
        });

        detailEl.querySelector('[data-ag-add-member]')?.addEventListener('click', async () => {
            const input = detailEl.querySelector('[data-ag-add-member-id]');
            const clientUserId = memberClientId({ clientUserId: input?.value?.trim() });
            if (!clientUserId) {
                showAlert(alert, 'Informe o ID do jogador.');
                return;
            }
            try {
                await api.addTeamMember(teamId, clientUserId);
                showAlert(success, 'Jogador adicionado.', 'success');
                if (input) input.value = '';
                await onChanged();
            } catch (err) {
                showAlert(alert, err.message || 'Não foi possível adicionar o jogador.');
            }
        });

        detailEl.querySelector('[data-ag-set-captain]')?.addEventListener('click', async () => {
            const select = detailEl.querySelector('[data-ag-captain-select]');
            const clientUserId = memberClientId({ clientUserId: select?.value });
            if (!clientUserId) {
                showAlert(alert, 'Selecione um integrante do time.');
                return;
            }
            try {
                await api.setTeamCaptain(teamId, clientUserId);
                showAlert(success, 'Capitão definido.', 'success');
                await onChanged();
            } catch (err) {
                showAlert(alert, err.message || 'Não foi possível definir o capitão.');
            }
        });

        detailEl.querySelector('[data-ag-transfer-team]')?.addEventListener('click', async () => {
            const select = detailEl.querySelector('[data-ag-transfer-select]');
            const clientUserId = memberClientId({ clientUserId: select?.value });
            if (!clientUserId) {
                showAlert(alert, 'Selecione um integrante.');
                return;
            }
            if (!confirm('Transferir a propriedade deste time para outro cliente?')) return;
            try {
                await api.transferTeamOwnership(teamId, clientUserId);
                showAlert(success, 'Propriedade transferida.', 'success');
                await onChanged();
            } catch (err) {
                showAlert(alert, err.message || 'Não foi possível transferir a propriedade.');
            }
        });

        detailEl.querySelector('[data-ag-availability-request-submit]')?.addEventListener('click', async () => {
            const requestWrap = detailEl.querySelector('[data-ag-captain-availability-request]');
            const message = detailEl.querySelector('[data-ag-availability-request-message]')?.value || '';
            const validation = validateAvailabilityEditor(requestWrap);
            if (validation) {
                showAlert(alert, validation);
                return;
            }
            const slots = collectAvailabilityFromScope(requestWrap);
            try {
                await api.requestTeamAvailabilityChange(team.id, slots, message);
                showAlert(success, 'Solicitação enviada ao dono do time.', 'success');
                await onChanged();
            } catch (err) {
                showAlert(alert, err.message);
            }
        });

        $$('[data-ag-availability-approve]', detailEl).forEach((btn) => {
            btn.addEventListener('click', async () => {
                const requestId = btn.dataset.agAvailabilityApprove;
                if (!requestId) return;
                try {
                    await api.approveTeamAvailabilityChange(team.id, requestId);
                    showAlert(success, 'Solicitação aprovada. Horários atualizados.', 'success');
                    await onChanged();
                } catch (err) {
                    showAlert(alert, err.message);
                }
            });
        });

        $$('[data-ag-availability-reject]', detailEl).forEach((btn) => {
            btn.addEventListener('click', async () => {
                const requestId = btn.dataset.agAvailabilityReject;
                if (!requestId || !confirm('Recusar esta solicitação de horários?')) return;
                try {
                    await api.rejectTeamAvailabilityChange(team.id, requestId);
                    showAlert(success, 'Solicitação recusada.', 'success');
                    await onChanged();
                } catch (err) {
                    showAlert(alert, err.message);
                }
            });
        });
    }

    async function initTimes(root) {
        if (!requireAuth(root)) return;
        const alert = $('[data-ag-alert]', root);
        const success = $('[data-ag-success]', root);
        const listEl = $('[data-ag-teams-list]', root);
        const empty = $('[data-ag-empty]', root);
        const createBtn = $('[data-ag-team-create]', root);
        const formModal = $('[data-ag-team-form-modal]', root);
        const form = $('[data-ag-form="team"]', root);
        const formTitle = $('[data-ag-team-form-title]', root);
        const settingsInfo = $('[data-ag-team-settings-info]', root);
        let teamSettings = {};
        let manageableTeamIds = new Set();
        let teamMetaMap = new Map();
        let gamePresets = [];

        async function loadGamePresets() {
            if (gamePresets.length) return gamePresets;
            try {
                gamePresets = normalizeGamePresets(await api.listPresets());
            } catch {
                gamePresets = [];
            }
            return gamePresets;
        }

        function closeModal() {
            if (formModal) formModal.hidden = true;
        }

        async function openFormModal(team) {
            if (!form || !formModal) return;
            hideAlert(alert);
            hideAlert(success);
            const presets = await loadGamePresets();
            if (team) {
                form.querySelector('[name="teamId"]').value = team.id || '';
                form.querySelector('[name="name"]').value = team.name || '';
                form.querySelector('[name="tag"]').value = team.tag || '';
                form.querySelector('[name="visibility"]').value = team.visibility || team.privacy || 'PUBLIC';
                form.querySelector('[name="logoUrl"]').value = team.logoUrl || '';
                form.querySelector('[name="bannerUrl"]').value = team.bannerUrl || '';
                setTeamMediaPreview(form, 'logo', team.logoUrl || '');
                setTeamMediaPreview(form, 'banner', team.bannerUrl || '');
                form.querySelector('[name="description"]').value = team.description || '';
                form.querySelector('[name="youtubeUrl"]').value = team.youtubeUrl || '';
                form.querySelector('[name="instagramUrl"]').value = team.instagramUrl || '';
                form.querySelector('[name="twitchUrl"]').value = team.twitchUrl || '';
                form.querySelector('[name="otherSocialUrl"]').value = team.otherSocialUrl || '';
                const ranks = Array.isArray(team.ranks) && team.ranks.length
                    ? team.ranks
                    : (team.rank ? [team.rank] : []);
                populateTeamRankRows(form, ranks, presets);
                formTitle.textContent = 'Editar time';
            } else {
                form.reset();
                form.querySelector('[name="teamId"]').value = '';
                form.querySelector('[name="visibility"]').value = 'PUBLIC';
                setTeamMediaPreview(form, 'logo', '');
                setTeamMediaPreview(form, 'banner', '');
                populateTeamRankRows(form, [], presets);
                formTitle.textContent = 'Criar time';
            }
            formModal.hidden = false;
        }

        $$('[data-ag-modal-close]', root).forEach((el) => {
            el.addEventListener('click', () => closeModal());
        });

        createBtn?.addEventListener('click', () => openFormModal(null));

        async function fetchTeamSettings() {
            if (typeof api.getTeamSettings === 'function') {
                return api.getTeamSettings().catch(() => null);
            }
            return api.request('/api/v1/public/team-settings', { auth: false }).catch(() => null);
        }

        async function loadTeams() {
            setLoading(root, true);
            try {
                const [listRes, manageableRes, settingsRes] = await Promise.all([
                    api.listMyTeams(),
                    api.listManageableTeams(),
                    fetchTeamSettings(),
                ]);
                teamSettings = settingsRes ? unwrapSettings(settingsRes) : {};
                const teams = extractListData(listRes);
                const manageable = extractListData(manageableRes);
                manageableTeamIds = new Set(manageable.map((t) => String(t.id)));

                if (settingsInfo) {
                    const html = renderTeamSettingsInfo(teamSettings);
                    settingsInfo.innerHTML = html;
                    settingsInfo.hidden = !html;
                }

                if (createBtn) {
                    createBtn.hidden = !canCreateTeam(manageable.length, teamSettings);
                }

                teamMetaMap = new Map(teams.map((t) => [String(t.id), t]));

                if (!teams.length) {
                    listEl.innerHTML = '';
                    empty.hidden = false;
                    return;
                }
                empty.hidden = true;

                const teamDetails = await Promise.all(
                    teams.map(async (team) => {
                        try {
                            return unwrapTeam(await api.getTeam(team.id));
                        } catch {
                            return { ...team, id: team.id };
                        }
                    })
                );

                listEl.innerHTML = teamDetails.map((detail) =>
                    renderTeamCard(
                        detail,
                        manageableTeamIds.has(String(detail.id)),
                        teamMetaMap.get(String(detail.id))
                    )
                ).join('');

                $$('[data-ag-edit-team]', listEl).forEach((btn) => {
                    btn.addEventListener('click', async () => {
                        try {
                            const mgmt = unwrapManage(await api.getTeamManage(btn.dataset.agEditTeam));
                            openFormModal(mgmt.team || unwrapTeam(await api.getTeam(btn.dataset.agEditTeam)));
                        } catch (err) {
                            showAlert(alert, err.message);
                        }
                    });
                });

                const editId = new URLSearchParams(window.location.search).get('edit');
                if (editId) {
                    try {
                        const mgmt = unwrapManage(await api.getTeamManage(editId));
                        openFormModal(mgmt.team || unwrapTeam(await api.getTeam(editId)));
                    } catch (err) {
                        showAlert(alert, err.message);
                    }
                }
            } catch (err) {
                showAlert(alert, err.message);
            } finally {
                setLoading(root, false);
            }
        }

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert(alert);
            hideAlert(success);
            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            try {
                const media = await resolveTeamMediaUrls(form);
                const fd = new FormData(form);
                const payload = api.normalizeTeamPayload({
                    name: fd.get('name'),
                    tag: fd.get('tag'),
                    logoUrl: media.logoUrl,
                    bannerUrl: media.bannerUrl,
                    description: fd.get('description'),
                    visibility: fd.get('visibility'),
                    youtubeUrl: fd.get('youtubeUrl'),
                    instagramUrl: fd.get('instagramUrl'),
                    twitchUrl: fd.get('twitchUrl'),
                    otherSocialUrl: fd.get('otherSocialUrl'),
                    ranks: collectTeamRanksFromForm(form),
                }, !!fd.get('teamId'));
                const teamId = fd.get('teamId');
                if (teamId) await api.updateTeam(teamId, payload);
                else await api.createTeam(payload);
                showAlert(success, teamId ? 'Time atualizado!' : 'Time criado!', 'success');
                closeModal();
                await loadTeams();
            } catch (err) {
                showAlert(alert, err.message);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });

        bindTeamMediaFields(form);

        await loadGamePresets();
        bindTeamRankRows(form?.querySelector('[data-ag-team-ranks]'), gamePresets);
        await loadTeams();
    }

    function unwrapUser(res) {
        let user = res?.data ?? res;
        if (user?.data) user = user.data;
        return user || {};
    }

    function renderProfileMeta(user) {
        const items = [];
        if (user.clientUserId) {
            const publicHref = playerProfileHref(user.clientUserId);
            const idHtml = publicHref
                ? `<a href="${escapeAttr(publicHref)}" class="ag-link">Ver perfil público</a>`
                : '';
            items.push(`<p class="ag-profile-meta__item"><span>ID do cliente:</span> ${escapeHtml(String(user.clientUserId))} ${idHtml}</p>`);
        }
        if (user.plan?.name) {
            items.push(`<p class="ag-profile-meta__item"><span>Plano:</span> ${escapeHtml(user.plan.name)}</p>`);
        }
        if (user.role) {
            items.push(`<p class="ag-profile-meta__item"><span>Função:</span> ${escapeHtml(user.role)}</p>`);
        }
        return items.length ? items.join('') : '';
    }

    function fillProfileForm(form, user) {
        form.querySelector('[name="nickname"]').value = user.nickname || '';
        form.querySelector('[name="firstName"]').value = user.firstName || '';
        form.querySelector('[name="lastName"]').value = user.lastName || '';
        form.querySelector('[name="email"]').value = user.email || '';
        applyPhoneToForm(form, user.phoneNumber || '');
        form.querySelector('[name="avatarUrl"]').value = user.avatarUrl || '';
        form.querySelector('[name="instagramUrl"]').value = user.instagramUrl || '';
        form.querySelector('[name="youtubeUrl"]').value = user.youtubeUrl || '';
        form.querySelector('[name="twitchUrl"]').value = user.twitchUrl || '';
        setTeamMediaPreview(form, 'avatar', user.avatarUrl || '');
    }

    /* ── Perfil ── */
    async function initPerfil(root) {
        if (!requireAuth(root)) return;
        const alert = $('[data-ag-alert]', root);
        const success = $('[data-ag-success]', root);
        const formWrap = $('[data-ag-profile-form]', root);
        const metaEl = $('[data-ag-profile-meta]', root);
        const form = $('[data-ag-form="perfil"]', root);
        if (!form) return;

        setLoading(root, true);
        let currentUser = {};
        try {
            currentUser = unwrapUser(await api.getProfile());
            fillProfileForm(form, currentUser);

            const metaHtml = renderProfileMeta(currentUser);
            if (metaEl) {
                metaEl.innerHTML = metaHtml;
                metaEl.hidden = !metaHtml;
            }

            bindRegisterAvatarField(form, root);
            bindPhoneField(form);
            bindNicknameAvailability(form, root, {
                originalNickname: currentUser.nickname,
                checkNicknameAuthenticated: true,
            });
            const profileAvailabilityHost = $('[data-ag-profile-availability]', form);
            const profilePanel = mountAvailabilityPanel(profileAvailabilityHost, extractWeeklySlots(currentUser));
            if (profilePanel) {
                bindAvailabilityPanel(profilePanel, {
                    onSave: async (slots) => {
                        await api.updateProfile({ availability: { weeklySlots: slots } });
                    },
                    onSuccess: (slots) => {
                        currentUser = { ...currentUser, availability: { weeklySlots: slots } };
                        showAlert(success, 'Horários atualizados!', 'success');
                    },
                    onError: (msg) => showAlert(alert, msg),
                });
            }
            formWrap.hidden = false;
        } catch (err) {
            showAlert(alert, err.message);
        } finally {
            setLoading(root, false);
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert(alert);
            hideAlert(success);

            if (form.dataset.nicknameInvalidFormat === '1') {
                setFieldHint(form, 'nickname', { message: NICKNAME_FORMAT_MESSAGE, type: 'error' });
                return;
            }
            if (form.dataset.nicknameChecking === '1') {
                setFieldHint(form, 'nickname', { message: 'Aguarde a verificação do nickname.', type: 'muted' });
                return;
            }
            if (form.dataset.nicknameTaken === '1') {
                setFieldHint(form, 'nickname', { message: 'Nick já em uso', type: 'error' });
                return;
            }

            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            try {
                const fd = new FormData(form);
                const nickname = sanitizeNicknameInput(fd.get('nickname'));
                if (!isValidNicknameFormat(nickname)) {
                    setNicknameFieldState(form, { invalidFormat: true, checking: false });
                    return;
                }
                const nickCheck = await verifyNicknameAvailability(form, nickname);
                if (nickCheck.taken) {
                    setNicknameFieldState(form, { taken: true, checking: false });
                    return;
                }

                const avatarUrl = await resolveAvatarUrlFromForm(form, 'profile');
                const updated = await api.updateProfile({
                    nickname,
                    firstName: fd.get('firstName'),
                    lastName: fd.get('lastName'),
                    phoneNumber: serializePhoneFromForm(form),
                    avatarUrl,
                    instagramUrl: fd.get('instagramUrl') || '',
                    youtubeUrl: fd.get('youtubeUrl') || '',
                    twitchUrl: fd.get('twitchUrl') || '',
                });
                const user = unwrapUser(updated);
                currentUser = { ...currentUser, ...user };
                form.dataset.originalNickname = currentUser.nickname || '';
                fillProfileForm(form, currentUser);
                const profilePanel = document.querySelector('[data-ag-profile-availability] [data-ag-availability-panel]');
                if (profilePanel) {
                    const slots = extractWeeklySlots(currentUser);
                    profilePanel.dataset.slots = JSON.stringify(slots);
                    updateAvailabilityPanelView(profilePanel, slots);
                    showAvailabilityPanelEditing(profilePanel, false);
                }
                refreshNavUser(document);
                showAlert(success, 'Perfil atualizado!', 'success');
            } catch (err) {
                showAlert(alert, err.message);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
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
        time: initTimeDetail,
        perfil: initPerfil,
        jogador: initJogador,
        dashboard: initDashboard,
        painel: initDashboard,
        'criar-torneio': initCriarTorneio,
    };

    function boot() {
        $$('.ag-client').forEach((root) => {
            const page = root.dataset.agPage;
            if (redirectIfLoggedInOnAuthPage(root)) return;
            if (handlers[page]) handlers[page](root);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
