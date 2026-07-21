import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Eye,
  EyeOff,
  Gauge,
  Instagram,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import './styles.css';

const api = {
  async request(path, options = {}) {
    const response = await fetch(path, {
      credentials: 'include',
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a solicitação.');
    return data;
  },
  me: () => api.request('/api/auth/me'),
  login: (email, password) => api.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => api.request('/api/auth/logout', { method: 'POST' }),
  dashboard: () => api.request('/api/dashboard'),
  leads: (params = {}) => api.request(`/api/leads?${new URLSearchParams(params)}`),
  lead: (id) => api.request(`/api/leads/${id}`),
  messages: (id) => api.request(`/api/leads/${id}/messages`),
  sendMessage: (id, message) => api.request(`/api/leads/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),
  toggleAi: (id, enabled) => api.request(`/api/leads/${id}/toggle-ai`, { method: 'POST', body: JSON.stringify({ enabled }) }),
  updateStatus: (id, status) => api.request(`/api/leads/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  leadAction: (id, action) => api.request(`/api/leads/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) }),
  testIntegration: () => api.request('/api/integration/test', { method: 'POST' }),
  health: () => api.request('/api/health'),
};

const statusLabels = {
  novo: 'Novo',
  conversando: 'Conversando',
  interessado: 'Interessado',
  pix_gerado: 'Pix gerado',
  pago: 'Pago',
  perdido: 'Perdido',
};

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat('pt-BR', sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit' }).format(date);
}

function money(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

function SourceIcon({ source, size = 16 }) {
  return source === 'instagram' ? <Instagram size={size} /> : <Send size={size} />;
}

function Spinner({ size = 20 }) {
  return <RefreshCw size={size} className="spin" />;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type || 'success'}`}>
      <div>{toast.message}</div>
      <button onClick={onClose} aria-label="Fechar"><X size={16} /></button>
    </div>
  );
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then(({ user }) => setUser(user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="fullscreen-loader"><Spinner size={28} /><span>Carregando painel...</span></div>;

  return children({ user, setUser });
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('kauam1024@gmail.com');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.login(email, password);
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="brand-mark large"><Sparkles size={28} /></div>
        <div className="showcase-copy">
          <span className="eyebrow">ATENDIMENTO INTELIGENTE</span>
          <h1>Converse, venda e controle sua IA em um só lugar.</h1>
          <p>Acompanhe leads do Instagram e Telegram, assuma conversas e dispare ações do seu fluxo n8n.</p>
        </div>
        <div className="showcase-card">
          <div className="live-dot" />
          <span>Agente operando</span>
          <strong>24h</strong>
        </div>
      </section>

      <section className="login-form-wrap">
        <form className="login-card" onSubmit={submit}>
          <div className="mobile-logo"><div className="brand-mark"><Sparkles size={20} /></div><strong>Verlic Agent</strong></div>
          <div>
            <span className="eyebrow">ACESSO SEGURO</span>
            <h2>Bem-vindo de volta</h2>
            <p>Entre para acompanhar sua operação.</p>
          </div>
          <label>
            <span>E-mail</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </label>
          <label>
            <span>Senha</span>
            <div className="password-input">
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button login-button" disabled={loading}>{loading ? <><Spinner size={18} /> Entrando...</> : <>Entrar <ChevronRight size={18} /></>}</button>
          <div className="secure-note"><ShieldCheck size={16} /> Senha e token do n8n nunca ficam expostos no navegador.</div>
        </form>
      </section>
    </main>
  );
}

function Layout({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNavigate();

  async function logout() {
    await api.logout().catch(() => {});
    onLogout();
    nav('/login');
  }

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Visão geral', end: true },
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/settings', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-head">
          <div className="brand-mark"><Sparkles size={20} /></div>
          <div><strong>Verlic Agent</strong><span>Painel de operação</span></div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)}><X /></button>
        </div>
        <nav>
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>
              <Icon size={19} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-status">
          <div className="status-icon"><Bot size={18} /></div>
          <div><strong>IA ativa</strong><span>Monitoramento em tempo real</span></div>
          <div className="live-dot" />
        </div>
        <div className="sidebar-user">
          <div className="avatar">KN</div>
          <div><strong>Mister Kauam</strong><span>{user?.email}</span></div>
          <button onClick={logout} title="Sair"><LogOut size={18} /></button>
        </div>
      </aside>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <section className="content-shell">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileOpen(true)}><Menu /></button>
          <div><span className="topbar-kicker">OPERAÇÃO</span><strong>Atendimento e vendas</strong></div>
          <div className="topbar-health"><span className="live-dot" /> Sistema online</div>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/:leadId" element={<ConversationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </section>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, accent }) {
  return (
    <article className={`metric-card ${accent || ''}`}>
      <div className="metric-icon"><Icon size={21} /></div>
      <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
    </article>
  );
}

function LeadRow({ lead, onClick }) {
  return (
    <button className="lead-row" onClick={onClick}>
      <div className="lead-avatar">{lead.name?.slice(0, 2).toUpperCase()}</div>
      <div className="lead-main">
        <div className="lead-title"><strong>{lead.name}</strong><span className={`source-badge ${lead.source}`}><SourceIcon source={lead.source} size={13} />{lead.source}</span></div>
        <p>{lead.lastMessage}</p>
      </div>
      <div className="lead-meta"><span>{formatTime(lead.lastMessageAt)}</span><span className={`status-pill ${lead.status}`}>{statusLabels[lead.status] || lead.status}</span></div>
      {lead.unread > 0 && <span className="unread-badge">{lead.unread}</span>}
      <ChevronRight className="lead-chevron" size={18} />
    </button>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const nav = useNavigate();

  async function load() {
    setRefreshing(true);
    try { setData(await api.dashboard()); setError(''); } catch (err) { setError(err.message); } finally { setRefreshing(false); }
  }
  useEffect(() => { load(); }, []);

  const m = data?.metrics || {};
  return (
    <main className="page">
      <PageHeader eyebrow="VISÃO GERAL" title="Sua operação agora" description="Acompanhe o funil, os pagamentos e as conversas que precisam de atenção." action={<button className="secondary-button" onClick={load} disabled={refreshing}>{refreshing ? <Spinner size={17} /> : <RefreshCw size={17} />} Atualizar</button>} />
      {error && <div className="error-banner">{error}</div>}
      {!data ? <div className="panel loading-panel"><Spinner /><span>Buscando dados...</span></div> : <>
        <section className="metrics-grid">
          <MetricCard icon={Users} label="Leads hoje" value={m.leadsToday} detail="Entradas nas últimas 24h" />
          <MetricCard icon={MessageCircle} label="Conversas ativas" value={m.activeConversations} detail="IA ou atendimento manual" />
          <MetricCard icon={WalletCards} label="Pix gerados" value={m.pixGenerated} detail={`${m.paidToday || 0} pagos hoje`} />
          <MetricCard icon={CircleDollarSign} label="Faturamento hoje" value={money(m.revenueToday)} detail={`Conversão de ${m.conversionRate || 0}%`} accent="highlight" />
        </section>
        <section className="dashboard-grid">
          <article className="panel funnel-panel">
            <div className="panel-head"><div><span className="eyebrow">FUNIL</span><h3>Desempenho de hoje</h3></div><Gauge size={21} /></div>
            <div className="funnel-track">
              {[['Leads', m.leadsToday || 0, 100], ['Conversas', m.activeConversations || 0, 70], ['Pix', m.pixGenerated || 0, 44], ['Pagos', m.paidToday || 0, 26]].map(([label, value, width]) => (
                <div className="funnel-item" key={label}><div><span>{label}</span><strong>{value}</strong></div><div className="bar"><span style={{ width: `${width}%` }} /></div></div>
              ))}
            </div>
            <div className="ai-summary"><div className="status-icon"><Sparkles size={18} /></div><div><strong>Resumo inteligente</strong><p>O maior ponto de atenção está entre o Pix gerado e o pagamento. Priorize os leads que disseram que pagariam agora.</p></div></div>
          </article>
          <article className="panel recent-panel">
            <div className="panel-head"><div><span className="eyebrow">RECENTES</span><h3>Conversas em andamento</h3></div><button onClick={() => nav('/leads')}>Ver todas <ChevronRight size={16} /></button></div>
            <div className="lead-list compact">
              {(data.recentLeads || []).slice(0, 5).map((lead) => <LeadRow key={lead.id} lead={lead} onClick={() => nav(`/leads/${lead.id}`)} />)}
            </div>
          </article>
        </section>
      </>}
    </main>
  );
}

function LeadsPage() {
  const [filters, setFilters] = useState({ search: '', status: 'todos', source: 'todos' });
  const [data, setData] = useState({ leads: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try { setData(await api.leads(filters)); setError(''); } catch (err) { setError(err.message); } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <main className="page">
      <PageHeader eyebrow="CRM DE CONVERSAS" title="Leads" description="Encontre, filtre e abra qualquer conversa da sua operação." />
      <section className="panel filters-panel">
        <div className="search-box"><Search size={18} /><input placeholder="Buscar por nome, @ ou mensagem..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="todos">Todos os status</option><option value="novo">Novos</option><option value="conversando">Conversando</option><option value="interessado">Interessados</option><option value="pix_gerado">Pix gerado</option><option value="pago">Pagos</option><option value="perdido">Perdidos</option>
        </select>
        <select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}>
          <option value="todos">Todas as origens</option><option value="instagram">Instagram</option><option value="telegram">Telegram</option>
        </select>
      </section>
      {error && <div className="error-banner">{error}</div>}
      <section className="panel leads-panel">
        <div className="panel-head"><div><span className="eyebrow">RESULTADOS</span><h3>{data.total} leads encontrados</h3></div></div>
        {loading ? <div className="loading-panel"><Spinner /><span>Carregando leads...</span></div> : data.leads.length ? <div className="lead-list">{data.leads.map((lead) => <LeadRow key={lead.id} lead={lead} onClick={() => nav(`/leads/${lead.id}`)} />)}</div> : <div className="empty-state"><Search size={30} /><h3>Nenhum lead encontrado</h3><p>Tente remover alguns filtros.</p></div>}
      </section>
    </main>
  );
}

function ConversationPage() {
  const { leadId } = useParams();
  const [lead, setLead] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const messagesRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const [leadData, messageData] = await Promise.all([api.lead(leadId), api.messages(leadId)]);
      setLead(leadData.lead);
      setMessages(messageData.messages || []);
      setError('');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [leadId]);
  useEffect(() => { messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      const result = await api.sendMessage(leadId, message);
      setMessages((items) => [...items, result.message || { id: Date.now(), direction: 'out', content: message, createdAt: new Date().toISOString(), sentBy: 'human' }]);
      setText('');
      setToast({ message: 'Mensagem enviada para o fluxo.' });
    } catch (err) { setToast({ type: 'error', message: err.message }); } finally { setSending(false); }
  }

  async function toggleAi() {
    try {
      const enabled = !lead.aiEnabled;
      await api.toggleAi(leadId, enabled);
      setLead({ ...lead, aiEnabled: enabled });
      setToast({ message: enabled ? 'IA reativada para este lead.' : 'IA pausada. Você assumiu a conversa.' });
    } catch (err) { setToast({ type: 'error', message: err.message }); }
  }

  async function quickAction(action, success) {
    try { await api.leadAction(leadId, action); setToast({ message: success }); } catch (err) { setToast({ type: 'error', message: err.message }); }
  }

  async function changeStatus(status) {
    try { await api.updateStatus(leadId, status); setLead({ ...lead, status }); setToast({ message: 'Status atualizado.' }); } catch (err) { setToast({ type: 'error', message: err.message }); }
  }

  if (loading) return <main className="page"><div className="panel loading-panel"><Spinner /><span>Carregando conversa...</span></div></main>;
  if (error || !lead) return <main className="page"><div className="error-banner">{error || 'Lead não encontrado.'}</div></main>;

  return (
    <main className="conversation-page">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <section className="conversation-main">
        <header className="conversation-header">
          <div className="lead-avatar large">{lead.name?.slice(0, 2).toUpperCase()}</div>
          <div className="conversation-person"><div><h2>{lead.name}</h2><span>{lead.username}</span></div><span className={`source-badge ${lead.source}`}><SourceIcon source={lead.source} size={13} />{lead.source}</span></div>
          <button className={lead.aiEnabled ? 'ai-toggle active' : 'ai-toggle'} onClick={toggleAi}>{lead.aiEnabled ? <><PauseCircle size={18} /> Pausar IA</> : <><PlayCircle size={18} /> Reativar IA</>}</button>
        </header>
        <div className="messages" ref={messagesRef}>
          <div className="conversation-date">Conversa atual</div>
          {messages.map((msg) => (
            <div className={`message-line ${msg.direction === 'out' ? 'out' : 'in'}`} key={msg.id}>
              <div className="message-bubble">
                <p>{msg.content}</p>
                <div><span>{msg.sentBy === 'ai' ? 'IA' : msg.sentBy === 'system' ? 'Sistema' : msg.direction === 'out' ? 'Você' : ''}</span><time>{formatTime(msg.createdAt)}</time>{msg.direction === 'out' && <CheckCircle2 size={13} />}</div>
              </div>
            </div>
          ))}
        </div>
        <form className="message-composer" onSubmit={sendMessage}>
          <div className="composer-info">{lead.aiEnabled ? <><Bot size={16} /> A IA continua respondendo automaticamente.</> : <><PauseCircle size={16} /> Atendimento manual ativo.</>}</div>
          <div className="composer-row"><textarea rows="1" placeholder="Digite sua mensagem..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }} /><button className="send-button" disabled={!text.trim() || sending}>{sending ? <Spinner size={18} /> : <Send size={18} />}</button></div>
        </form>
      </section>
      <aside className="conversation-sidebar">
        <article className="detail-card">
          <span className="eyebrow">LEAD</span><h3>Detalhes</h3>
          <div className="detail-row"><span>Origem</span><strong className="capitalize"><SourceIcon source={lead.source} size={14} /> {lead.source}</strong></div>
          <div className="detail-row"><span>Status</span><select value={lead.status} onChange={(e) => changeStatus(e.target.value)}><option value="novo">Novo</option><option value="conversando">Conversando</option><option value="interessado">Interessado</option><option value="pix_gerado">Pix gerado</option><option value="pago">Pago</option><option value="perdido">Perdido</option></select></div>
          <div className="detail-row"><span>Plano</span><strong>{lead.plan || 'Não escolhido'}</strong></div>
          <div className="detail-row"><span>Pagamento</span><strong className={lead.paymentStatus === 'pago' ? 'success-text' : ''}>{lead.paymentStatus || 'Nenhum'}</strong></div>
        </article>
        <article className="detail-card">
          <span className="eyebrow">AÇÕES RÁPIDAS</span><h3>Enviar pelo fluxo</h3>
          <button className="action-button" onClick={() => quickAction('send_preview', 'Prévia solicitada ao fluxo.')}><Eye size={17} /><span>Enviar prévia</span><ChevronRight size={16} /></button>
          <button className="action-button" onClick={() => quickAction('send_table', 'Tabela solicitada ao fluxo.')}><WalletCards size={17} /><span>Enviar tabela</span><ChevronRight size={16} /></button>
          <button className="action-button primary-action" onClick={() => quickAction('generate_pix', 'Geração de Pix solicitada.')}><Zap size={17} /><span>Gerar Pix</span><ChevronRight size={16} /></button>
        </article>
        <article className="detail-card ai-card"><div className="status-icon"><Bot size={18} /></div><div><strong>Contexto do agente</strong><p>A origem do cliente é enviada ao n8n, sem que a IA precise perguntar de onde ele veio.</p></div></article>
      </aside>
    </main>
  );
}

function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState(null);

  async function loadHealth() {
    try { setHealth(await api.health()); } catch (err) { setToast({ type: 'error', message: err.message }); }
  }
  useEffect(() => { loadHealth(); }, []);

  async function test() {
    setTesting(true);
    try { const result = await api.testIntegration(); setToast({ message: result.message || 'Conexão validada.' }); await loadHealth(); } catch (err) { setToast({ type: 'error', message: err.message }); } finally { setTesting(false); }
  }

  return (
    <main className="page">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <PageHeader eyebrow="CONFIGURAÇÕES" title="Integração" description="Confira o estado do painel e teste a comunicação com o webhook do n8n." />
      <section className="settings-grid">
        <article className="panel integration-card">
          <div className="panel-head"><div><span className="eyebrow">STATUS</span><h3>Conexão com o n8n</h3></div><Activity size={21} /></div>
          <div className="connection-status"><div className={`connection-orb ${health?.integrationMode === 'n8n' ? 'online' : 'demo'}`}><Zap size={24} /></div><div><strong>{health?.integrationMode === 'n8n' ? 'Webhook configurado' : 'Modo demonstração'}</strong><p>{health?.integrationMode === 'n8n' ? 'O backend está pronto para enviar ações ao seu fluxo.' : 'O painel funciona com dados simulados até você preencher a URL do webhook.'}</p></div></div>
          <div className="config-lines"><div><span>Backend</span><strong className="success-text">Online</strong></div><div><span>n8n configurado</span><strong>{health?.n8nConfigured ? 'Sim' : 'Não'}</strong></div><div><span>Modo atual</span><strong>{health?.integrationMode || '...'}</strong></div></div>
          <button className="primary-button" onClick={test} disabled={testing}>{testing ? <><Spinner size={18} /> Testando...</> : <><Zap size={18} /> Testar integração</>}</button>
        </article>
        <article className="panel setup-card">
          <div className="panel-head"><div><span className="eyebrow">PASSOS</span><h3>Como conectar</h3></div><Settings size={21} /></div>
          <ol className="setup-steps">
            <li><span>1</span><div><strong>Crie um Webhook POST no n8n</strong><p>Use a URL de produção e deixe o workflow ativo.</p></div></li>
            <li><span>2</span><div><strong>Configure as variáveis no Coolify</strong><p>Preencha N8N_WEBHOOK_URL e N8N_WEBHOOK_SECRET.</p></div></li>
            <li><span>3</span><div><strong>Faça o Switch pelo campo action</strong><p>O painel envia ações como list_leads, send_message e toggle_ai.</p></div></li>
            <li><span>4</span><div><strong>Retorne JSON pelo Respond to Webhook</strong><p>Os formatos esperados estão no arquivo docs/CONTRATO-N8N.md.</p></div></li>
          </ol>
        </article>
      </section>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      {({ user, setUser }) => (
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={setUser} />} />
            <Route path="/*" element={user ? <Layout user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      )}
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
