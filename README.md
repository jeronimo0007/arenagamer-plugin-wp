# ArenaGamer - Plugin WordPress

Plugin WordPress para integração frontend com a plataforma ArenaGamer. Permite exibir torneios, inscrições, gestão de times, carteira de créditos e brackets diretamente no seu site WordPress.

## Instalação

1. Faça upload da pasta `arenagamer-plugin-wp` para `/wp-content/plugins/`
2. Ative o plugin no painel WordPress → **Plugins**
3. Configure em **Configurações → ArenaGamer**

## Configuração

| Campo | Descrição | Padrão |
|-------|-----------|--------|
| URL da API | URL base da ArenaGamer API | `http://localhost:8080/api/v1` |
| Cache (segundos) | TTL do cache de listagens | 300 |
| Torneios por Página | Quantidade de torneios por página | 12 |
| Registro de Usuários | Permitir registro via frontend | Sim |

## Shortcodes

### `[arenagamer_tournaments]`
Grid de torneios disponíveis com paginação.

**Parâmetros:**
- `per_page` - Torneios por página (default: 12)
- `columns` - Colunas do grid (default: 3)
- `game` - Filtrar por jogo/preset

**Exemplo:** `[arenagamer_tournaments per_page="9" columns="3"]`

### `[arenagamer_tournament slug="meu-torneio"]`
Página de detalhes de um torneio com informações completas, partidas e formulário de inscrição.

O slug também pode ser passado via query string: `?tournament=meu-torneio`

### `[arenagamer_bracket slug="meu-torneio"]`
Visualização do bracket/chaves do torneio com rodadas organizadas.

### `[arenagamer_login]`
Formulário de login e registro com abas. Após login, exibe informações do usuário.

### `[arenagamer_dashboard]`
Painel do jogador com:
- Saldo da carteira e créditos retidos
- Lista de times
- Formulário para criar novo time

## Funcionalidades

### Torneios
- Grid responsivo com cards de torneio
- Badges de status (Inscrições Abertas, Em Andamento, etc.)
- Detalhes completos (vagas, taxas, datas, regras)
- Inscrição solo ou por time com seleção de disponibilidade
- Lista de partidas com placares

### Autenticação
- Login/registro via JWT (integrado com ArenaGamer API)
- Sessão persistente via PHP sessions
- Refresh automático de tokens expirados
- Logout com limpeza de sessão

### Carteira
- Visualização de saldo e créditos retidos
- Histórico de transações

### Times
- Lista de times do jogador
- Criação de novos times
- Seleção de time ao inscrever em torneio TEAM

### Brackets
- Visualização horizontal de brackets por rodada
- Indicação de vencedores
- Horários de partidas agendadas

## Estrutura

```
arenagamer-plugin-wp/
├── arenagamer.php              # Plugin principal
├── includes/
│   ├── class-arenagamer-api.php      # Client HTTP (wp_remote_request)
│   ├── class-arenagamer-auth.php     # Gerenciamento JWT/sessão
│   ├── class-arenagamer-shortcodes.php  # Registro de shortcodes
│   └── class-arenagamer-ajax.php     # Handlers AJAX
├── admin/
│   ├── class-arenagamer-admin.php    # Página de configurações WP
│   └── css/arenagamer-admin.css
├── templates/                  # Templates dos shortcodes
│   ├── tournaments-grid.php
│   ├── tournament-detail.php
│   ├── bracket.php
│   ├── login-form.php
│   ├── user-info.php
│   └── dashboard.php
├── public/
│   ├── css/arenagamer-public.css     # Estilos frontend
│   └── js/arenagamer-public.js       # JavaScript frontend
└── languages/                  # Traduções (i18n)
```

## Requisitos

- WordPress 5.0+
- PHP 7.4+ com extensão cURL
- ArenaGamer API rodando e acessível

## Personalização

### Estilos
O plugin usa variáveis CSS que podem ser sobrescritas no seu tema:

```css
:root {
    --ag-primary: #7c3aed;    /* Cor principal */
    --ag-radius: 8px;          /* Border radius */
    --ag-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

### Templates
Os templates em `/templates/` podem ser copiados para o seu tema em `/theme/arenagamer/` para personalização (suporte será adicionado em versão futura).
