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
                const message = (typeof json?.data === 'string' ? json.data : json?.data?.message)
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
                body: data,
            }).then((res) => {
                const user = res.data || res;
                if (user && user.email) {
                    this.updateStoredUser(user);
                }
                return res;
            });
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

        joinTournament(slug, data = {}) {
            return this.request(`/api/v1/common/tournaments/${encodeURIComponent(slug)}/participants`, {
                method: 'POST',
                body: data,
            });
        }

        joinTournamentTeam(slug, teamId) {
            return this.request(`/api/v1/common/tournaments/${encodeURIComponent(slug)}/participants/team`, {
                method: 'POST',
                body: { teamId },
            });
        }

        listMatches(slug) {
            return this.request(`/api/v1/common/tournaments/${encodeURIComponent(slug)}/matches`);
        }

        getBalance() {
            return this.request('/api/v1/common/wallet/balance');
        }

        deposit(amount, description) {
            return this.request('/api/v1/common/wallet/deposit', {
                method: 'POST',
                body: { amount, description },
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

        getTeam(id) {
            return this.request(`/api/v1/common/teams/${encodeURIComponent(id)}`);
        }

        createTeam(data) {
            return this.request('/api/v1/common/teams', {
                method: 'POST',
                body: data,
            });
        }

        updateTeam(id, data) {
            return this.request(`/api/v1/common/teams/${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: data,
            });
        }

        removeTeamMember(teamId, contactId) {
            return this.request(`/api/v1/common/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(contactId)}`, {
                method: 'DELETE',
            });
        }
    }

    global.ArenaGamerAPI = new ArenaGamerAPI(cfg);
})(window);
