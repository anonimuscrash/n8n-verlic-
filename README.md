# Verlic Agent Panel

Painel full-stack com login, dashboard, leads, conversas, controle da IA e ações rápidas ligadas a um webhook do n8n.

## O que já funciona

- Login protegido por cookie HttpOnly e JWT.
- Senha, token e URL do n8n ficam somente no backend.
- Dashboard, filtros de leads, chat, pausa/reativação da IA e ações rápidas.
- Modo demonstração para abrir o painel antes de conectar o fluxo.
- Deploy por Docker/Coolify.
- Layout responsivo para desktop e celular.

## Rodar localmente

```bash
cp .env.example .env
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:3000`

No modo de desenvolvimento, o Vite encaminha `/api` ao backend.

## Login inicial

Os dados vêm do `.env`:

```env
APP_EMAIL=kauam1024@gmail.com
APP_PASSWORD=151202m@
```

Troque a senha e o `JWT_SECRET` antes de publicar.

## Conectar ao n8n

1. Crie um Webhook `POST` no n8n.
2. Use a URL de produção e ative o workflow.
3. No `.env`, configure:

```env
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/verlic-agent-panel
N8N_WEBHOOK_SECRET=um-segredo-forte
N8N_MOCK_MODE=false
```

4. No n8n, valide o cabeçalho `X-Panel-Secret`.
5. Faça um Switch pelo campo `body.action`.
6. Consulte `docs/CONTRATO-N8N.md` para os campos de entrada e resposta.

## Publicar no Coolify

### Via repositório Git

1. Suba esta pasta para um repositório privado.
2. No Coolify, crie um recurso a partir do repositório.
3. O Coolify detectará o `Dockerfile`.
4. Adicione as variáveis do `.env` no painel do Coolify.
5. Exponha a porta `3000` e configure um domínio.

### Via Docker Compose

O projeto também inclui `docker-compose.yml`.

## Observação sobre “100% funcionando”

O sistema do painel está pronto e possui modo demonstração testável. A conexão com o fluxo real depende de o seu n8n retornar os campos documentados. Como cada banco e workflow usa nomes diferentes, ajuste os ramos do webhook para transformar os dados atuais nesse contrato.
