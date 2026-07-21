import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getMockResponse } from './mock-data.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || 'development-secret-change-me';
const appEmail = (process.env.APP_EMAIL || 'admin@verlic.com.br').toLowerCase();
const appPassword = process.env.APP_PASSWORD || 'admin123';
const appPasswordHash = process.env.APP_PASSWORD_HASH || '';
const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || '';
const n8nWebhookSecret = process.env.N8N_WEBHOOK_SECRET || '';
const n8nTimeoutMs = Number(process.env.N8N_TIMEOUT_MS || 25000);
const mockMode = String(process.env.N8N_MOCK_MODE || (!n8nWebhookUrl)).toLowerCase() === 'true';

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos.' },
});

function issueToken(email) {
  return jwt.sign({ email, role: 'admin' }, jwtSecret, { expiresIn: '12h' });
}

function setAuthCookie(res, token) {
  res.cookie('verlic_session', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  });
}

function requireAuth(req, res, next) {
  const token = req.cookies.verlic_session;
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });
  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada.' });
  }
}

async function validatePassword(password) {
  if (appPasswordHash) return bcrypt.compare(password, appPasswordHash);
  return password === appPassword;
}

async function callN8n(payload) {
  if (mockMode) return getMockResponse(payload);
  if (!n8nWebhookUrl) throw new Error('N8N_WEBHOOK_URL não configurada.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), n8nTimeoutMs);
  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(n8nWebhookSecret ? { 'x-panel-secret': n8nWebhookSecret } : {}),
      },
      body: JSON.stringify({
        ...payload,
        panel: 'verlic-agent-panel',
        requestedAt: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      const message = data?.error || data?.message || `n8n respondeu HTTP ${response.status}`;
      throw new Error(message);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: process.env.APP_NAME || 'Verlic Agent',
    n8nConfigured: Boolean(n8nWebhookUrl),
    integrationMode: mockMode ? 'mock' : 'n8n',
    time: new Date().toISOString(),
  });
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (email !== appEmail || !(await validatePassword(password))) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }
  const token = issueToken(email);
  setAuthCookie(res, token);
  return res.json({ user: { email, role: 'admin' } });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('verlic_session', { path: '/' });
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/dashboard', requireAuth, async (_req, res, next) => {
  try { res.json(await callN8n({ action: 'dashboard' })); } catch (error) { next(error); }
});

app.get('/api/leads', requireAuth, async (req, res, next) => {
  try {
    res.json(await callN8n({
      action: 'list_leads',
      query: {
        search: req.query.search || '',
        status: req.query.status || 'todos',
        source: req.query.source || 'todos',
      },
    }));
  } catch (error) { next(error); }
});

app.get('/api/leads/:leadId', requireAuth, async (req, res, next) => {
  try { res.json(await callN8n({ action: 'get_lead', leadId: req.params.leadId })); } catch (error) { next(error); }
});

app.get('/api/leads/:leadId/messages', requireAuth, async (req, res, next) => {
  try { res.json(await callN8n({ action: 'get_messages', leadId: req.params.leadId })); } catch (error) { next(error); }
});

app.post('/api/leads/:leadId/messages', requireAuth, async (req, res, next) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ error: 'Digite uma mensagem.' });
    res.json(await callN8n({
      action: 'send_message',
      leadId: req.params.leadId,
      message,
      messageType: req.body?.messageType || 'text',
    }));
  } catch (error) { next(error); }
});

app.post('/api/leads/:leadId/toggle-ai', requireAuth, async (req, res, next) => {
  try { res.json(await callN8n({ action: 'toggle_ai', leadId: req.params.leadId, enabled: Boolean(req.body?.enabled) })); } catch (error) { next(error); }
});

app.post('/api/leads/:leadId/status', requireAuth, async (req, res, next) => {
  try { res.json(await callN8n({ action: 'update_status', leadId: req.params.leadId, status: req.body?.status })); } catch (error) { next(error); }
});

app.post('/api/leads/:leadId/action', requireAuth, async (req, res, next) => {
  try { res.json(await callN8n({ action: 'lead_action', leadId: req.params.leadId, leadAction: req.body?.action })); } catch (error) { next(error); }
});

app.post('/api/integration/test', requireAuth, async (_req, res, next) => {
  try { res.json(await callN8n({ action: 'integration_test' })); } catch (error) { next(error); }
});

app.use('/api', (req, res) => res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` }));

app.use((error, _req, res, _next) => {
  console.error(error);
  const message = error?.name === 'AbortError'
    ? 'O n8n demorou demais para responder.'
    : error?.message || 'Erro interno.';
  res.status(502).json({ error: message });
});

if (isProduction) {
  app.use(express.static(path.join(rootDir, 'dist')));
  app.use((_req, res) => res.sendFile(path.join(rootDir, 'dist', 'index.html')));
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Verlic Agent em http://0.0.0.0:${port}`);
  console.log(`Integração: ${mockMode ? 'MODO DEMONSTRAÇÃO' : 'N8N'}`);
});
