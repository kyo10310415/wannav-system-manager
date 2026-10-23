import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'crypto';
import { Router } from 'express';
import { createApp } from '../src/app';

const origin = 'https://manager.example.test';
const password = 'test-only-admin-password-'.repeat(3);
const webhookSecret = 'test-only-webhook-secret-'.repeat(3);
const env = { SYSTEM_MANAGER_ADMIN_USERNAME: 'test-admin', SYSTEM_MANAGER_ADMIN_PASSWORD: password,
  SYSTEM_MANAGER_PUBLIC_ORIGIN: origin, GITHUB_WEBHOOK_SECRET: webhookSecret };
const authorization = `Basic ${Buffer.from(`test-admin:${password}`).toString('base64')}`;

async function fixture(run: (url: string, calls: string[]) => Promise<void>, config = env) {
  const calls: string[] = [];
  const router = Router();
  router.use((req, res) => { calls.push(req.method); res.json({ fixture: 'private-record' }); });
  const app = createApp({ repositories: router, changelogs: router, tasks: router, costs: router,
    webhook: (req, res) => { calls.push('webhook'); res.json({ received: req.body.repository.id }); } }, config);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${(server.address() as { port: number }).port}`, calls); }
  finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}

test('all management pages and state changes reject anonymous callers before controllers', async () => {
  await fixture(async (url, calls) => {
    for (const [path, method] of [['/repositories', 'GET'], ['/repositories/1', 'GET'],
      ['/costs/1/total', 'GET'], ['/repositories/sync', 'POST'], ['/tasks', 'POST'],
      ['/tasks/1', 'PUT'], ['/costs/1', 'DELETE'], ['/changelogs', 'POST']]) {
      const response = await fetch(url + path, { method });
      assert.equal(response.status, 401);
      assert.match(response.headers.get('www-authenticate') || '', /^Basic/);
      assert.equal((await response.text()).includes('private-record'), false);
    }
    assert.deepEqual(calls, []);
  });
});
test('authenticated admin can read records and same-origin form/AJAX changes', async () => {
  await fixture(async (url, calls) => {
    const read = await fetch(url + '/repositories', { headers: { authorization } });
    assert.equal(read.status, 200);
    assert.equal(read.headers.get('cache-control'), 'no-store');
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const response = await fetch(url + '/tasks/1', { method, headers: { authorization, origin } });
      assert.equal(response.status, 200);
    }
    assert.deepEqual(calls, ['GET', 'POST', 'PUT', 'DELETE']);
  });
});
test('ambient Basic credentials cannot perform cross-origin or missing-origin writes', async () => {
  await fixture(async (url, calls) => {
    for (const originValue of [undefined, 'null', 'https://attacker.example.test', origin + '.attacker.test']) {
      const headers: Record<string, string> = { authorization };
      if (originValue) headers.origin = originValue;
      assert.equal((await fetch(url + '/repositories/sync', { method: 'POST', headers })).status, 403);
    }
    assert.deepEqual(calls, []);
  });
});
test('wrong credentials and missing security settings never reach controllers', async () => {
  await fixture(async (url, calls) => {
    assert.equal((await fetch(url + '/repositories', { headers: { authorization: 'Basic wrong' } })).status, 401);
    assert.deepEqual(calls, []);
  });
  await fixture(async (url, calls) => {
    assert.equal((await fetch(url + '/repositories')).status, 503);
    assert.equal((await fetch(url + '/health')).status, 200);
    assert.deepEqual(calls, []);
  }, { ...env, SYSTEM_MANAGER_ADMIN_PASSWORD: '' });
});
test('webhook rejects missing/tampered signatures even with admin credentials', async () => {
  await fixture(async (url, calls) => {
    const body = JSON.stringify({ repository: { id: 1 } });
    for (const signature of ['', 'sha256=' + '0'.repeat(64)]) {
      const response = await fetch(url + '/changelogs/webhook', { method: 'POST', body,
        headers: { authorization, origin, 'content-type': 'application/json', 'x-hub-signature-256': signature } });
      assert.equal(response.status, 401);
    }
    assert.deepEqual(calls, []);
  });
});
test('webhook accepts a valid raw-body signature without browser credentials', async () => {
  await fixture(async (url, calls) => {
    const body = JSON.stringify({ repository: { id: 1 } });
    const signature = 'sha256=' + createHmac('sha256', webhookSecret).update(body).digest('hex');
    const response = await fetch(url + '/changelogs/webhook', { method: 'POST', body,
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature } });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { received: 1 });
    assert.deepEqual(calls, ['webhook']);
  });
});
test('unconfigured webhook and signed malformed JSON cannot reach its controller', async () => {
  await fixture(async (url, calls) => {
    const response = await fetch(url + '/changelogs/webhook', { method: 'POST', body: '{}',
      headers: { 'content-type': 'application/json' } });
    assert.equal(response.status, 503);
    assert.deepEqual(calls, []);
  }, { ...env, GITHUB_WEBHOOK_SECRET: '' });
  await fixture(async (url, calls) => {
    const body = '{invalid';
    const signature = 'sha256=' + createHmac('sha256', webhookSecret).update(body).digest('hex');
    const response = await fetch(url + '/changelogs/webhook', { method: 'POST', body,
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature } });
    assert.equal(response.status, 400);
    assert.deepEqual(calls, []);
  });
});
