# Contrato do webhook do n8n

O backend do painel envia todas as operações para uma única URL configurada em `N8N_WEBHOOK_URL`.

## Segurança

O painel envia o segredo configurado em `N8N_WEBHOOK_SECRET` no cabeçalho:

```http
X-Panel-Secret: seu-segredo
```

No n8n, valide esse cabeçalho antes de executar qualquer ação. Não coloque o segredo no frontend.

## Estrutura comum enviada

```json
{
  "action": "list_leads",
  "panel": "verlic-agent-panel",
  "requestedAt": "2026-07-21T18:00:00.000Z"
}
```

No Webhook do n8n, o corpo normalmente fica disponível em `{{$json.body}}`. Faça um Switch usando `{{$json.body.action}}`.

## Ações e respostas esperadas

### `integration_test`

Entrada:

```json
{ "action": "integration_test" }
```

Resposta:

```json
{ "success": true, "message": "Conexão validada." }
```

### `dashboard`

Resposta:

```json
{
  "metrics": {
    "leadsToday": 84,
    "activeConversations": 31,
    "pixGenerated": 18,
    "paidToday": 9,
    "revenueToday": 269.91,
    "conversionRate": 10.7
  },
  "recentLeads": []
}
```

### `list_leads`

Entrada:

```json
{
  "action": "list_leads",
  "query": {
    "search": "lucas",
    "status": "todos",
    "source": "telegram"
  }
}
```

Resposta:

```json
{
  "total": 1,
  "leads": [
    {
      "id": "lead_1042",
      "name": "Lucas",
      "username": "@lucas.sp",
      "source": "telegram",
      "status": "interessado",
      "aiEnabled": true,
      "paymentStatus": "pendente",
      "plan": "VIP",
      "lastMessage": "Tem uma prévia para eu ver?",
      "lastMessageAt": "2026-07-21T17:57:00.000Z",
      "unread": 2
    }
  ]
}
```

Valores usados pelo painel:

- `source`: `instagram` ou `telegram`
- `status`: `novo`, `conversando`, `interessado`, `pix_gerado`, `pago` ou `perdido`

### `get_lead`

Entrada:

```json
{ "action": "get_lead", "leadId": "lead_1042" }
```

Resposta:

```json
{ "lead": { "id": "lead_1042", "name": "Lucas", "source": "telegram", "status": "interessado", "aiEnabled": true } }
```

### `get_messages`

Entrada:

```json
{ "action": "get_messages", "leadId": "lead_1042" }
```

Resposta:

```json
{
  "messages": [
    {
      "id": "m1",
      "direction": "in",
      "type": "text",
      "content": "Oi, vim pelo canal",
      "createdAt": "2026-07-21T17:46:00.000Z"
    },
    {
      "id": "m2",
      "direction": "out",
      "type": "text",
      "content": "Oii, bem-vindo 😘",
      "createdAt": "2026-07-21T17:47:00.000Z",
      "sentBy": "ai"
    }
  ]
}
```

### `send_message`

Entrada:

```json
{
  "action": "send_message",
  "leadId": "lead_1042",
  "message": "Tenho sim, vou te mandar.",
  "messageType": "text"
}
```

Resposta:

```json
{
  "success": true,
  "message": {
    "id": "m3",
    "direction": "out",
    "type": "text",
    "content": "Tenho sim, vou te mandar.",
    "createdAt": "2026-07-21T18:00:00.000Z",
    "sentBy": "human"
  }
}
```

### `toggle_ai`

Entrada:

```json
{ "action": "toggle_ai", "leadId": "lead_1042", "enabled": false }
```

Resposta:

```json
{ "success": true, "aiEnabled": false }
```

### `update_status`

Entrada:

```json
{ "action": "update_status", "leadId": "lead_1042", "status": "pix_gerado" }
```

Resposta:

```json
{ "success": true, "status": "pix_gerado" }
```

### `lead_action`

Entrada:

```json
{ "action": "lead_action", "leadId": "lead_1042", "leadAction": "generate_pix" }
```

Valores de `leadAction` usados no painel:

- `send_preview`
- `send_table`
- `generate_pix`

Resposta:

```json
{ "success": true, "message": "Ação enviada ao fluxo." }
```

## Resposta do Webhook

No node Webhook, selecione resposta pelo node **Respond to Webhook**. Em cada ramo, agregue o resultado em um único item e retorne JSON.
