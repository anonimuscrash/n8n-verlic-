const now = Date.now();

export const mockLeads = [
  {
    id: 'lead_1042',
    name: 'Lucas',
    username: '@lucas.sp',
    source: 'telegram',
    status: 'interessado',
    aiEnabled: true,
    paymentStatus: 'pendente',
    plan: 'VIP',
    lastMessage: 'Tem uma prévia para eu ver?',
    lastMessageAt: new Date(now - 3 * 60 * 1000).toISOString(),
    unread: 2,
  },
  {
    id: 'lead_1041',
    name: 'Rafael',
    username: '@rafa_oliveira',
    source: 'instagram',
    status: 'pix_gerado',
    aiEnabled: true,
    paymentStatus: 'aguardando',
    plan: 'Namoradinha + VIP',
    lastMessage: 'Vou pagar agora',
    lastMessageAt: new Date(now - 17 * 60 * 1000).toISOString(),
    unread: 0,
  },
  {
    id: 'lead_1039',
    name: 'Matheus',
    username: '@theusx',
    source: 'telegram',
    status: 'pago',
    aiEnabled: false,
    paymentStatus: 'pago',
    plan: 'VIP',
    lastMessage: 'Recebi, obrigado 😍',
    lastMessageAt: new Date(now - 52 * 60 * 1000).toISOString(),
    unread: 0,
  },
  {
    id: 'lead_1037',
    name: 'Bruno',
    username: '@brunom',
    source: 'instagram',
    status: 'conversando',
    aiEnabled: true,
    paymentStatus: 'nenhum',
    plan: null,
    lastMessage: 'Como funciona?',
    lastMessageAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    unread: 1,
  },
];

export const mockMessages = {
  lead_1042: [
    { id: 'm1', direction: 'in', type: 'text', content: 'Oi, vim pelo canal', createdAt: new Date(now - 14 * 60 * 1000).toISOString() },
    { id: 'm2', direction: 'out', type: 'text', content: 'Oii, bem-vindo 😘 O que mais te chamou atenção por lá?', createdAt: new Date(now - 13 * 60 * 1000).toISOString(), sentBy: 'ai' },
    { id: 'm3', direction: 'in', type: 'text', content: 'Aquela foto de vestido vinho', createdAt: new Date(now - 6 * 60 * 1000).toISOString() },
    { id: 'm4', direction: 'out', type: 'text', content: 'Eu amei fazer aquela foto, ficou bem do jeitinho que eu queria 😏', createdAt: new Date(now - 5 * 60 * 1000).toISOString(), sentBy: 'ai' },
    { id: 'm5', direction: 'in', type: 'text', content: 'Tem uma prévia para eu ver?', createdAt: new Date(now - 3 * 60 * 1000).toISOString() },
  ],
  lead_1041: [
    { id: 'm6', direction: 'in', type: 'text', content: 'Quero o plano de 29,99', createdAt: new Date(now - 22 * 60 * 1000).toISOString() },
    { id: 'm7', direction: 'out', type: 'text', content: 'Perfeito, já gerei seu Pix. Me avisa quando concluir 💕', createdAt: new Date(now - 20 * 60 * 1000).toISOString(), sentBy: 'ai' },
    { id: 'm8', direction: 'in', type: 'text', content: 'Vou pagar agora', createdAt: new Date(now - 17 * 60 * 1000).toISOString() },
  ],
  lead_1039: [
    { id: 'm9', direction: 'out', type: 'text', content: 'Pagamento confirmado. Seu acesso já foi liberado ✅', createdAt: new Date(now - 60 * 60 * 1000).toISOString(), sentBy: 'system' },
    { id: 'm10', direction: 'in', type: 'text', content: 'Recebi, obrigado 😍', createdAt: new Date(now - 52 * 60 * 1000).toISOString() },
  ],
  lead_1037: [
    { id: 'm11', direction: 'in', type: 'text', content: 'Como funciona?', createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString() },
  ],
};

export function getMockResponse(payload) {
  const { action, leadId, query = {} } = payload;

  if (action === 'dashboard') {
    return {
      metrics: {
        leadsToday: 84,
        activeConversations: 31,
        pixGenerated: 18,
        paidToday: 9,
        revenueToday: 269.91,
        conversionRate: 10.7,
      },
      recentLeads: mockLeads,
    };
  }

  if (action === 'list_leads') {
    const search = String(query.search || '').toLowerCase();
    const status = query.status || 'todos';
    const source = query.source || 'todos';
    const leads = mockLeads.filter((lead) => {
      const matchesSearch = !search || `${lead.name} ${lead.username} ${lead.lastMessage}`.toLowerCase().includes(search);
      const matchesStatus = status === 'todos' || lead.status === status;
      const matchesSource = source === 'todos' || lead.source === source;
      return matchesSearch && matchesStatus && matchesSource;
    });
    return { leads, total: leads.length };
  }

  if (action === 'get_lead') {
    const lead = mockLeads.find((item) => item.id === leadId);
    if (!lead) throw new Error('Lead não encontrado');
    return { lead };
  }

  if (action === 'get_messages') {
    return { messages: mockMessages[leadId] || [] };
  }

  if (action === 'send_message') {
    return {
      success: true,
      message: {
        id: `m_${Date.now()}`,
        direction: 'out',
        type: payload.messageType || 'text',
        content: payload.message,
        createdAt: new Date().toISOString(),
        sentBy: 'human',
      },
    };
  }

  if (action === 'toggle_ai') return { success: true, aiEnabled: Boolean(payload.enabled) };
  if (action === 'update_status') return { success: true, status: payload.status };
  if (action === 'lead_action') return { success: true, action: payload.leadAction, message: 'Ação enviada ao fluxo.' };
  if (action === 'integration_test') return { success: true, mode: 'mock', message: 'Modo de demonstração ativo.' };

  return { success: true };
}
