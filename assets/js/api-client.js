/**
 * Cliente HTTP para a API ArenaGamer (via proxy WordPress).
 */
(function (global) {
    'use strict';

    const STORAGE_KEY = 'arenagamer_auth';
    const cfg = global.ArenaGamerConfig || {};

    function getStoredAuth() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        } catch (e) {
            return null;
        }
    }

    function setStoredAuth(data) {
        if (data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    function dedupeErrorMessage(message) {
        const text = String(message || '').trim();
        if (!text) return text;
        const parts = text.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean);
        const unique = [...new Set(parts)];
        if (unique.length === 1 && parts.length > 1) {
            const single = unique[0];
            if (/em branco|obrigat[oó]ri|required|must not be null|must not be blank/i.test(single)) {
                return 'Preencha todos os campos obrigatórios.';
            }
            return single;
        }
        return unique.join(', ');
    }

    function formatApiErrorData(data) {
        if (!data) return '';
        if (typeof data === 'string') return dedupeErrorMessage(data);

        const nested = data.data;
        if (typeof nested === 'string') return dedupeErrorMessage(nested);

        const errors = data.errors || nested?.errors || data.validationErrors || nested?.validationErrors;
        if (Array.isArray(errors) && errors.length) {
            const msgs = errors.map((e) => {
                if (typeof e === 'string') return e;
                return e.message || e.defaultMessage || '';
            }).filter(Boolean);
            return dedupeErrorMessage(msgs.join(', '));
        }

        const msg = data.message || nested?.message || '';
        return dedupeErrorMessage(msg);
    }

    class ArenaGamerAPI {
        constructor(config) {
            this.ajaxUrl = config.ajaxUrl || '';
            this.nonce = config.nonce || '';
        }

        isLoggedIn() {
            return !!getStoredAuth()?.accessToken;
        }

        getUser() {
            return getStoredAuth()?.user || null;
        }

        updateStoredUser(user) {
            const auth = getStoredAuth();
            if (auth && user) {
                auth.user = user;
                setStoredAuth(auth);
            }
        }

        logout() {
            setStoredAuth(null);
        }

        saveAuth(authData) {
            if (!authData || !authData.accessToken) {
                return false;
            }
            const expiresIn = Number(authData.expiresIn) || 3600;
            const expiresAt = Date.now() + expiresIn * 1000;
            setStoredAuth({
                accessToken: authData.accessToken,
                refreshToken: authData.refreshToken,
                tokenType: authData.tokenType || 'Bearer',
                expiresAt,
                user: authData.user || null,
            });
            return true;
        }

        extractAuth(res) {
            if (!res) return null;
            if (res.accessToken) return res;
            if (res.data && res.data.accessToken) return res.data;
            return null;
        }

        saveAuthFromResponse(res) {
            const auth = this.extractAuth(res);
            if (!auth || !auth.accessToken) {
                throw new Error('Resposta de autenticação inválida — token não recebido.');
            }
            if (!this.saveAuth(auth)) {
                throw new Error('Não foi possível salvar a sessão.');
            }
        }

        async request(path, options = {}) {
            if (!this.ajaxUrl) {
                throw new Error('Plugin não configurado corretamente (ajaxUrl ausente).');
            }

            const formData = new FormData();
            formData.append('action', 'arenagamer_api');
            formData.append('nonce', this.nonce);
            formData.append('path', path);
            formData.append('method', options.method || 'GET');

            if (options.query && typeof options.query === 'object') {
                formData.append('query', JSON.stringify(options.query));
            }

            if (options.body !== undefined) {
                formData.append('body', JSON.stringify(options.body));
            }

            if (options.auth !== false) {
                const auth = getStoredAuth();
                if (auth?.accessToken) {
                    if (auth.expiresAt && Date.now() > auth.expiresAt - 60000) {
                        await this.refreshToken();
                    }
                    const refreshed = getStoredAuth();
                    if (refreshed?.accessToken) {
                        formData.append('token', refreshed.accessToken);
                    }
                }
            }

            let response;
            try {
                response = await fetch(this.ajaxUrl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin',
                });
            } catch (e) {
                throw new Error('Erro de rede ao contactar o WordPress.');
            }

            const rawText = await response.text();
            let json;
            try {
                json = rawText ? JSON.parse(rawText) : null;
            } catch (e) {
                if (rawText === '-1' || rawText === '0') {
                    throw new Error('Sessão expirada. Recarregue a página.');
                }
                throw new Error('Resposta inválida do servidor.');
            }

            if (!json || !json.success) {
                const message = formatApiErrorData(json?.data)
                    || cfg.i18n?.error
                    || 'Erro na requisição';
                const err = new Error(message);
                err.status = response.status;
                err.payload = json?.data;
                throw err;
            }

            return json.data;
        }

        async refreshToken() {
            const auth = getStoredAuth();
            if (!auth?.refreshToken) {
                this.logout();
                return;
            }
            try {
                const res = await this.request('/api/v1/public/auth/refresh', {
                    method: 'POST',
                    body: { refreshToken: auth.refreshToken },
                    auth: false,
                });
                this.saveAuthFromResponse(res);
            } catch (e) {
                this.logout();
            }
        }

        login(email, password) {
            return this.request('/api/v1/public/auth/login', {
                method: 'POST',
                body: { email, password, staff: false },
                auth: false,
            }).then((res) => {
                this.saveAuthFromResponse(res);
                return res;
            });
        }

        register(data) {
            return this.request('/api/v1/public/auth/register', {
                method: 'POST',
                body: data,
                auth: false,
            }).then((res) => {
                this.saveAuthFromResponse(res);
                return res;
            });
        }

        normalizeNicknameAvailability(res) {
            let node = res;
            for (let depth = 0; depth < 6 && node != null; depth++) {
                if (typeof node === 'boolean') {
                    return { nickname: '', available: node };
                }
                if (typeof node.available === 'boolean') {
                    return {
                        nickname: String(node.nickname || ''),
                        available: node.available,
                    };
                }
                if (typeof node.isAvailable === 'boolean') {
                    return {
                        nickname: String(node.nickname || ''),
                        available: node.isAvailable,
                    };
                }
                if (node.available === 'true' || node.available === 'false') {
                    return {
                        nickname: String(node.nickname || ''),
                        available: node.available === 'true',
                    };
                }
                if (node.available === 1 || node.available === 0) {
                    return {
                        nickname: String(node.nickname || ''),
                        available: !!node.available,
                    };
                }
                if (typeof node.taken === 'boolean') {
                    return {
                        nickname: String(node.nickname || ''),
                        available: !node.taken,
                    };
                }
                if (node.data !== undefined) {
                    node = node.data;
                    continue;
                }
                break;
            }
            return null;
        }

        checkNicknameAvailable(nickname, options = {}) {
            const value = String(nickname || '').replace(/[^a-zA-Z0-9]/g, '');
            const authenticated = !!options.authenticated;
            const path = authenticated
                ? '/api/v1/common/users/nickname-available'
                : '/api/v1/public/auth/nickname-available';
            return this.request(path, {
                auth: authenticated ? undefined : false,
                query: { nickname: value },
            }).then((res) => {
                const normalized = this.normalizeNicknameAvailability(res);
                if (!normalized) {
                    throw new Error('Resposta inválida ao verificar nickname.');
                }
                return normalized;
            });
        }

        getPublicPlayer(clientUserId) {
            return this.request(
                `/api/v1/public/players/${encodeURIComponent(clientUserId)}`,
                { auth: false }
            );
        }

        getPlayer(clientUserId) {
            return this.request(`/api/v1/common/players/${encodeURIComponent(clientUserId)}`);
        }

        normalizeTimeHHmm(value) {
            if (value === null || value === undefined || value === '') return '';
            const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
            if (!match) return '';
            const hours = String(Math.min(23, Math.max(0, parseInt(match[1], 10)))).padStart(2, '0');
            const minutes = String(Math.min(59, Math.max(0, parseInt(match[2], 10)))).padStart(2, '0');
            return `${hours}:${minutes}`;
        }

        normalizeWeeklySlots(slots) {
            const allowed = new Set([
                'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
            ]);
            return (Array.isArray(slots) ? slots : [])
                .map((slot) => ({
                    dayOfWeek: String(slot?.dayOfWeek || '').trim().toUpperCase(),
                    startTime: this.normalizeTimeHHmm(slot?.startTime),
                    endTime: this.normalizeTimeHHmm(slot?.endTime),
                }))
                .filter((slot) => (
                    allowed.has(slot.dayOfWeek)
                    && slot.startTime
                    && slot.endTime
                    && slot.startTime < slot.endTime
                ));
        }

        normalizeAvailability(availability) {
            return {
                weeklySlots: this.normalizeWeeklySlots(availability?.weeklySlots),
            };
        }

        getProfile() {
            return this.request('/api/v1/common/users/me').then((res) => {
                const user = res.data || res;
                if (user && user.email) {
                    this.updateStoredUser(user);
                }
                return res;
            });
        }

        updateProfile(data) {
            return this.request('/api/v1/common/users/me', {
                method: 'PUT',
                body: this.normalizeProfilePayload(data),
            }).then((res) => {
                const user = res.data || res;
                if (user && user.email) {
                    this.updateStoredUser(user);
                }
                return res;
            });
        }

        normalizeProfilePayload(data) {
            const payload = {
                firstName: String(data.firstName || '').trim(),
                lastName: String(data.lastName || '').trim(),
                phoneNumber: String(data.phoneNumber || '').trim(),
            };
            if (data.nickname) {
                payload.nickname = String(data.nickname).replace(/[^a-zA-Z0-9]/g, '');
            }
            ['avatarUrl', 'instagramUrl', 'youtubeUrl', 'twitchUrl'].forEach((field) => {
                if (data[field] !== undefined) {
                    const value = String(data[field] || '').trim();
                    payload[field] = value || null;
                }
            });
            if (data.availability !== undefined) {
                payload.availability = this.normalizeAvailability(data.availability);
            }
            return payload;
        }

        listPublicTournaments(page = 0, size = 20, filter = null) {
            let path = `/api/v1/public/tournaments?page=${page}&size=${size}`;
            if (filter) {
                path += `&filter=${encodeURIComponent(filter)}`;
            }
            return this.request(path, { auth: false });
        }

        async findPublicTournamentBySlug(slug) {
            if (!slug) return null;
            const target = String(slug).trim().toLowerCase().replace(/_/g, '-');
            const filters = [null, 'REGISTRATION_OPEN', 'UPCOMING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'];
            const batches = await Promise.all(
                filters.map((filter) => this.listPublicTournaments(0, 50, filter))
            );
            for (const res of batches) {
                const payload = res?.data || res;
                const items = Array.isArray(payload?.content)
                    ? payload.content
                    : (Array.isArray(payload) ? payload : []);
                const found = items.find((t) => {
                    if (!t?.slug) return false;
                    const itemSlug = String(t.slug).trim().toLowerCase().replace(/_/g, '-');
                    return itemSlug === target;
                });
                if (found) return found;
            }
            return null;
        }

        listMyJoined(page = 0, size = 50) {
            return this.request(`/api/v1/common/tournaments/my-joined?page=${page}&size=${size}`);
        }

        getTournament(slug) {
            return this.request(`/api/v1/common/tournaments/${encodeURIComponent(slug)}`);
        }

        createTournament(body) {
            return this.request('/api/v1/common/tournaments', {
                method: 'POST',
                body,
            });
        }

        updateTournamentStatus(slug, status) {
            return this.request(
                `/api/v1/common/tournaments/${encodeURIComponent(slug)}/status?status=${encodeURIComponent(status)}`,
                { method: 'PUT' }
            );
        }

        getTournamentEntryFeeRevenue(slug, options = {}) {
            const opts = options || {};
            const query = {};
            const clientUserId = opts.clientUserId;
            if (clientUserId != null && clientUserId !== '') {
                query.clientUserId = clientUserId;
            }
            return this.request(
                `/api/v1/common/tournaments/${encodeURIComponent(slug)}/entry-fees/revenue`,
                { query }
            );
        }

        listTournamentParticipants(slug, options = {}) {
            const opts = options || {};
            const status = opts.status ? String(opts.status).trim() : '';
            const query = status ? { status } : undefined;
            const usePublic = opts.public === true;
            const path = usePublic
                ? `/api/v1/public/tournaments/${encodeURIComponent(slug)}/participants`
                : `/api/v1/common/tournaments/${encodeURIComponent(slug)}/participants`;
            const catalogOnly = usePublic && !this.isLoggedIn();
            return this.request(path, {
                auth: catalogOnly ? false : undefined,
                query,
            });
        }

        joinTournament(slug, data = {}) {
            return this.request(`/api/v1/common/tournaments/${encodeURIComponent(slug)}/participants`, {
                method: 'POST',
                body: data,
            });
        }

        joinTournamentTeam(slug, body) {
            return this.request(`/api/v1/common/tournaments/${encodeURIComponent(slug)}/participants/team`, {
                method: 'POST',
                body: this.normalizeTeamJoinPayload(body),
            });
        }

        normalizeTeamJoinPayload(body) {
            const raw = typeof body === 'object' && body !== null ? body : { teamId: body };
            const teamId = Number(raw.teamId);
            const payload = { teamId };

            const ids = (Array.isArray(raw.playerClientUserIds) ? raw.playerClientUserIds : [])
                .map((id) => Number(id))
                .filter((id) => Number.isFinite(id) && id > 0);
            if (ids.length) {
                payload.playerClientUserIds = [...new Set(ids)];
                return payload;
            }

            const nicknames = (Array.isArray(raw.playerNicknames) ? raw.playerNicknames : [])
                .map((nick) => String(nick || '').trim())
                .filter(Boolean);
            if (nicknames.length) {
                payload.playerNicknames = [...new Set(nicknames)];
            }

            return payload;
        }

        withdrawTournamentRegistration(slug, options = {}) {
            const opts = options || {};
            const teamId = opts.teamId != null ? Number(opts.teamId) : null;
            const query = Number.isFinite(teamId) && teamId > 0 ? { teamId } : undefined;
            return this.request(`/api/v1/common/tournaments/${encodeURIComponent(slug)}/registration`, {
                method: 'DELETE',
                query,
            });
        }

        listMatches(slug) {
            return this.request(`/api/v1/common/tournaments/${encodeURIComponent(slug)}/matches`);
        }

        listStandings(slug) {
            return this.request(`/api/v1/common/tournaments/${encodeURIComponent(slug)}/standings`);
        }

        getBalance() {
            return this.request('/api/v1/common/wallet/balance');
        }

        /**
         * Compra de créditos. Não credita na hora — gera uma fatura no Perfex.
         * Retorna CreditPurchaseResponse { invoiceId, credits, amount, paymentUrl, pending }.
         */
        purchaseCredits(amount) {
            return this.request('/api/v1/common/wallet/credits/purchase', {
                method: 'POST',
                body: { amount: Number(amount) },
            });
        }

        withdraw(amount, description) {
            return this.request('/api/v1/common/wallet/withdraw', {
                method: 'POST',
                body: { amount, description },
            });
        }

        getTransactions(page = 0, size = 20) {
            return this.request(`/api/v1/common/wallet/transactions?page=${page}&size=${size}`);
        }

        listMyTeams() {
            return this.request('/api/v1/common/teams/my');
        }

        listManageableTeams() {
            return this.request('/api/v1/common/teams/manageable');
        }

        getTeamSettings() {
            return this.request('/api/v1/public/team-settings', { auth: false });
        }

        listPresets(page = 0, size = 100) {
            return this.request(`/api/v1/public/presets?page=${page}&size=${size}`, { auth: false });
        }

        getTeam(id, presetId) {
            let path = `/api/v1/common/teams/${encodeURIComponent(id)}`;
            if (presetId) path += `?presetId=${encodeURIComponent(presetId)}`;
            return this.request(path);
        }

        getTeamManage(id) {
            return this.request(`/api/v1/common/teams/${encodeURIComponent(id)}/manage`);
        }

        getTeamMembers(id) {
            return this.request(`/api/v1/common/teams/${encodeURIComponent(id)}/members`);
        }

        createTeam(data) {
            return this.request('/api/v1/common/teams', {
                method: 'POST',
                body: this.normalizeTeamPayload(data),
            });
        }

        updateTeam(id, data) {
            return this.request(`/api/v1/common/teams/${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: this.normalizeTeamPayload(data, true),
            });
        }

        deleteTeam(id) {
            return this.request(`/api/v1/common/teams/${encodeURIComponent(id)}`, {
                method: 'DELETE',
            });
        }

        normalizeMemberClientUserId(value) {
            const id = String(value ?? '').trim();
            if (!/^\d+$/.test(id) || id === '0') {
                return null;
            }
            return id;
        }

        normalizeTeamId(value) {
            const id = String(value ?? '').trim();
            if (!/^\d+$/.test(id) || id === '0') {
                return null;
            }
            return id;
        }

        memberClientPath(teamId, clientUserId) {
            const team = this.normalizeTeamId(teamId);
            const client = this.normalizeMemberClientUserId(clientUserId);
            if (!team || !client) {
                throw new Error('ID do time ou jogador inválido.');
            }
            return `/api/v1/common/teams/${encodeURIComponent(team)}/members/clients/${encodeURIComponent(client)}`;
        }

        addTeamMember(teamId, clientUserId) {
            return this.request(this.memberClientPath(teamId, clientUserId), { method: 'POST' });
        }

        /** Convite de jogador — POST cria TeamJoinRequestResponse com status PENDING. */
        inviteTeamMember(teamId, clientUserId) {
            return this.addTeamMember(teamId, clientUserId);
        }

        listTeamJoinRequests(teamId, pendingOnly) {
            const team = this.normalizeTeamId(teamId);
            if (!team) {
                throw new Error('ID do time inválido.');
            }
            const onlyPending = pendingOnly !== false;
            const qs = onlyPending ? '' : '?pendingOnly=false';
            return this.request(`/api/v1/common/teams/${encodeURIComponent(team)}/join-requests${qs}`);
        }

        listReceivedJoinRequests() {
            return this.request('/api/v1/common/teams/join-requests/received');
        }

        acceptTeamJoinRequest(requestId) {
            const id = String(requestId ?? '').trim();
            if (!/^\d+$/.test(id) || id === '0') {
                throw new Error('Convite inválido.');
            }
            return this.request(
                `/api/v1/common/teams/join-requests/${encodeURIComponent(id)}/accept`,
                { method: 'POST' }
            );
        }

        removeTeamMember(teamId, clientUserId) {
            try {
                return this.request(this.memberClientPath(teamId, clientUserId), { method: 'DELETE' });
            } catch (err) {
                return Promise.reject(err);
            }
        }

        /** Membro sai do time (mesmo endpoint DELETE). */
        leaveTeam(teamId, clientUserId) {
            return this.removeTeamMember(teamId, clientUserId);
        }

        listTeamRosterVacancies(teamId, pendingOnly) {
            const team = this.normalizeTeamId(teamId);
            if (!team) {
                throw new Error('ID do time inválido.');
            }
            const onlyPending = pendingOnly !== false;
            const qs = onlyPending ? '?pendingOnly=true' : '?pendingOnly=false';
            return this.request(`/api/v1/common/teams/${encodeURIComponent(team)}/roster-vacancies${qs}`);
        }

        fillRosterVacancy(teamId, vacancyId, clientUserId) {
            const team = this.normalizeTeamId(teamId);
            const vacancy = String(vacancyId ?? '').trim();
            const client = this.normalizeMemberClientUserId(clientUserId);
            if (!team || !/^\d+$/.test(vacancy) || !client) {
                throw new Error('Dados da vaga inválidos.');
            }
            return this.request(
                `/api/v1/common/teams/${encodeURIComponent(team)}/roster-vacancies/${encodeURIComponent(vacancy)}/fill`,
                { method: 'POST', body: { clientUserId: Number(client) } }
            );
        }

        forfeitRosterVacancy(teamId, vacancyId) {
            const team = this.normalizeTeamId(teamId);
            const vacancy = String(vacancyId ?? '').trim();
            if (!team || !/^\d+$/.test(vacancy)) {
                throw new Error('Vaga inválida.');
            }
            return this.request(
                `/api/v1/common/teams/${encodeURIComponent(team)}/roster-vacancies/${encodeURIComponent(vacancy)}/forfeit`,
                { method: 'POST' }
            );
        }

        reallocateTeamRoster(teamId, payload) {
            const team = this.normalizeTeamId(teamId);
            if (!team) {
                throw new Error('ID do time inválido.');
            }
            const tournamentSlug = String(payload?.tournamentSlug || '').trim();
            const outId = this.normalizeMemberClientUserId(payload?.outClientUserId);
            const inId = this.normalizeMemberClientUserId(payload?.inClientUserId);
            if (!tournamentSlug || !outId || !inId) {
                throw new Error('Informe torneio, jogador que sai e jogador que entra.');
            }
            return this.request(`/api/v1/common/teams/${encodeURIComponent(team)}/roster/reallocate`, {
                method: 'POST',
                body: {
                    tournamentSlug,
                    outClientUserId: Number(outId),
                    inClientUserId: Number(inId),
                },
            });
        }

        getTeamJoinBanStatus() {
            return this.request('/api/v1/common/teams/join-ban/status');
        }

        transferTeamOwnership(teamId, newClientUserId) {
            const team = this.normalizeTeamId(teamId);
            const client = this.normalizeMemberClientUserId(newClientUserId);
            if (!team || !client) {
                return Promise.reject(new Error('ID do time ou jogador inválido.'));
            }
            return this.request(
                `/api/v1/common/teams/${encodeURIComponent(team)}/transfer/clients/${encodeURIComponent(client)}`,
                { method: 'POST' }
            );
        }

        setTeamCaptain(teamId, clientUserId) {
            try {
                return this.request(`${this.memberClientPath(teamId, clientUserId)}/captain`, { method: 'POST' });
            } catch (err) {
                return Promise.reject(err);
            }
        }

        normalizeTeamPayload(data, isUpdate) {
            const payload = {
                name: String(data.name || '').trim(),
                tag: String(data.tag || '').trim(),
                logoUrl: String(data.logoUrl || '').trim(),
                bannerUrl: String(data.bannerUrl || '').trim(),
                youtubeUrl: String(data.youtubeUrl || '').trim(),
                instagramUrl: String(data.instagramUrl || '').trim(),
                twitchUrl: String(data.twitchUrl || '').trim(),
                otherSocialUrl: String(data.otherSocialUrl || '').trim(),
                description: String(data.description || '').trim(),
                visibility: data.visibility || 'PUBLIC',
            };

            ['tag', 'logoUrl', 'bannerUrl', 'youtubeUrl', 'instagramUrl', 'twitchUrl', 'otherSocialUrl', 'description'].forEach((field) => {
                if (payload[field] === '') payload[field] = null;
            });

            if (data.ranks !== undefined) {
                if (Array.isArray(data.ranks) && data.ranks.length) {
                    payload.ranks = data.ranks
                        .map((r) => ({
                            presetId: Number(r.presetId),
                            rankPoints: Number(r.rankPoints),
                        }))
                        .filter((r) => r.presetId > 0 && !Number.isNaN(r.rankPoints) && r.rankPoints >= 0);
                } else {
                    payload.ranks = [];
                }
            }

            if (data.availability !== undefined) {
                payload.availability = this.normalizeAvailability(data.availability);
            }

            return payload;
        }

        requestTeamAvailabilityChange(teamId, weeklySlots, message) {
            const body = {
                weeklySlots: this.normalizeWeeklySlots(weeklySlots),
            };
            const note = String(message || '').trim();
            if (note) body.message = note;
            return this.request(
                `/api/v1/common/teams/${encodeURIComponent(teamId)}/availability/change-requests`,
                { method: 'POST', body }
            );
        }

        listTeamAvailabilityChangeRequests(teamId, pendingOnly = true) {
            const flag = pendingOnly ? 'true' : 'false';
            return this.request(
                `/api/v1/common/teams/${encodeURIComponent(teamId)}/availability/change-requests?pendingOnly=${flag}`
            );
        }

        approveTeamAvailabilityChange(teamId, requestId) {
            return this.request(
                `/api/v1/common/teams/${encodeURIComponent(teamId)}/availability/change-requests/${encodeURIComponent(requestId)}/approve`,
                { method: 'POST' }
            );
        }

        rejectTeamAvailabilityChange(teamId, requestId) {
            return this.request(
                `/api/v1/common/teams/${encodeURIComponent(teamId)}/availability/change-requests/${encodeURIComponent(requestId)}/reject`,
                { method: 'POST' }
            );
        }

        async uploadMedia(file, context) {
            if (!file) {
                throw new Error('Nenhum arquivo selecionado.');
            }
            if (!this.ajaxUrl) {
                throw new Error('Plugin não configurado corretamente (ajaxUrl ausente).');
            }

            const formData = new FormData();
            formData.append('action', 'arenagamer_upload_media');
            formData.append('nonce', this.nonce);
            formData.append('context', context || 'team');
            formData.append('file', file);

            const auth = getStoredAuth();
            if (auth?.accessToken) {
                formData.append('token', auth.accessToken);
            }

            let response;
            try {
                response = await fetch(this.ajaxUrl, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin',
                });
            } catch (e) {
                throw new Error('Erro de rede ao enviar arquivo.');
            }

            const rawText = await response.text();
            let json;
            try {
                json = rawText ? JSON.parse(rawText) : null;
            } catch (e) {
                throw new Error('Resposta inválida do servidor.');
            }

            if (!json || !json.success) {
                const message = (typeof json?.data === 'string' ? json.data : json?.data?.message)
                    || 'Erro ao enviar arquivo';
                throw new Error(message);
            }

            const url = json.data?.url || json.data?.data?.url;
            if (!url) {
                throw new Error('URL do arquivo não retornada.');
            }
            return url;
        }
    }

    global.ArenaGamerAPI = new ArenaGamerAPI(cfg);
})(window);
