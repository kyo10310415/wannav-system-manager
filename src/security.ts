import { createHmac, timingSafeEqual } from 'crypto';
import { RequestHandler } from 'express';

function equal(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function adminBoundary(env: NodeJS.ProcessEnv = process.env): RequestHandler {
  const username = env.SYSTEM_MANAGER_ADMIN_USERNAME || '';
  const password = env.SYSTEM_MANAGER_ADMIN_PASSWORD || '';
  let origin = '';
  try {
    const url = new URL(env.SYSTEM_MANAGER_PUBLIC_ORIGIN || '');
    if (url.protocol === 'https:' && !url.username && !url.password &&
        url.href === `${url.origin}/`) origin = url.origin;
  } catch { /* Missing/invalid configuration fails closed. */ }
  const configured = username && !username.includes(':') && password.trim().length >= 32 && origin;
  const expected = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  return (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    if (!configured) { res.status(503).send('Security configuration required'); return; }
    if (!equal(req.get('Authorization') || '', expected)) {
      res.set('WWW-Authenticate', 'Basic realm="System administration", charset="UTF-8"');
      res.status(401).send('Authentication required'); return;
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('Origin') !== origin) {
      res.status(403).send('Forbidden origin'); return;
    }
    next();
  };
}

export function githubWebhookBoundary(env: NodeJS.ProcessEnv = process.env): RequestHandler {
  const secret = env.GITHUB_WEBHOOK_SECRET || '';
  return (req, res, next) => {
    if (secret.trim().length < 32) { res.status(503).json({ error: 'Webhook is not configured' }); return; }
    const signature = req.get('X-Hub-Signature-256') || '';
    if (!Buffer.isBuffer(req.body) || !/^sha256=[a-f0-9]{64}$/.test(signature) ||
        !equal(signature, `sha256=${createHmac('sha256', secret).update(req.body).digest('hex')}`)) {
      res.status(401).json({ error: 'Invalid webhook signature' }); return;
    }
    try { req.body = JSON.parse(req.body.toString('utf8')); }
    catch { res.status(400).json({ error: 'Invalid JSON' }); return; }
    next();
  };
}
