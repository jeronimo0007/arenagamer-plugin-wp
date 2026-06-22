# ArenaGamer Cliente — Plugin WordPress

Frontend para clientes da plataforma ArenaGamer, conectado 100% à API REST. Sem lógica de negócio no WordPress — apenas interface e chamadas HTTP.

## Instalação

1. Copie a pasta `arenagamer-cliente` para `wp-content/plugins/`
2. Ative o plugin em **Plugins → ArenaGamer Cliente**
3. Configure em **Configurações → ArenaGamer Cliente**:
   - **URL da API** — ex.: `http://localhost:8080`
   - **E-mail e senha do catálogo** — credencial HTTP Basic para listar torneios públicos
   - **URL da página de login** — redirecionamento quando páginas protegidas forem acessadas sem auth
   - **Pacotes de créditos** — valores pré-definidos para compra (um por linha)

## Shortcodes

Insira os shortcodes em qualquer página ou post do WordPress:

| Shortcode | Descrição |
|-----------|-----------|
| `[pagina login]` | Formulário de login |
| `[pagina cadastro]` | Formulário de cadastro de cliente |
| `[pagina menu]` | Menu de navegação (visível após login) |
| `[pagina torneios]` | Torneios com inscrições abertas e em andamento |
| `[pagina meus torneios]` | Torneios em que o cliente está inscrito |
| `[pagina torneio slug="nome-do-torneio"]` | Detalhes e botão de inscrição |
| `[pagina creditos]` | Saldo e histórico de transações |
| `[pagina comprar creditos]` | Depositar/comprar créditos na carteira |
| `[pagina partidas]` | Partidas dos torneios inscritos |

## Exemplo de estrutura de páginas

```
/login/          → [pagina login]
/cadastro/       → [pagina cadastro]
/area-cliente/   → [pagina menu]
                 → [pagina torneios]
/torneios/       → [pagina meus torneios]
/creditos/       → [pagina creditos]
                 → [pagina comprar creditos]
/partidas/       → [pagina partidas]
```

## Endpoints utilizados

### Públicos (sem JWT)
- `POST /api/v1/public/auth/register`
- `POST /api/v1/public/auth/login`
- `POST /api/v1/public/auth/refresh`
- `GET /api/v1/public/tournaments` (HTTP Basic Auth)

### Autenticados (JWT Bearer)
- `GET /api/v1/common/users/me`
- `GET /api/v1/common/wallet/balance`
- `POST /api/v1/common/wallet/deposit`
- `GET /api/v1/common/wallet/transactions`
- `GET /api/v1/common/tournaments/my-joined`
- `GET /api/v1/common/tournaments/{slug}`
- `POST /api/v1/common/tournaments/{slug}/participants`
- `GET /api/v1/common/tournaments/{slug}/matches`

## Autenticação

O token JWT é armazenado em `localStorage` do navegador. A renovação automática ocorre via refresh token quando o access token expira.

## Inscrição em torneios

Ao inscrever-se em um torneio com taxa (`entryFeeCredits > 0`), a API reserva os créditos na carteira (`holdCredits`). Certifique-se de que o cliente possui saldo suficiente.

## Compra de créditos

A página de compra chama `POST /api/v1/common/wallet/deposit`. Para integração com gateway de pagamento (PIX, cartão etc.), implemente o webhook no backend e substitua o fluxo de depósito direto conforme necessário.

## Requisitos

- WordPress 6.0+
- PHP 7.4+
- API ArenaGamer com CORS habilitado
- HTTPS recomendado em produção
