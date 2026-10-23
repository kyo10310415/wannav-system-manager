import express, { RequestHandler, Router } from 'express';
import path from 'path';
import { adminBoundary, githubWebhookBoundary } from './security';

export function createApp(routes: { repositories: Router; changelogs: Router; tasks: Router; costs: Router;
  webhook: RequestHandler }, env: NodeJS.ProcessEnv = process.env) {
  const app = express();
  app.disable('x-powered-by');
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));
  app.get('/health', (_req, res) => { res.json({ status: 'ok' }); });
  // GitHub cannot use browser credentials; verify the exact raw body instead.
  app.post('/changelogs/webhook', express.raw({ type: 'application/json', limit: '100kb' }),
    githubWebhookBoundary(env), routes.webhook);
  app.use(adminBoundary(env));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('/', (_req, res) => { res.redirect('/repositories'); });
  app.use('/repositories', routes.repositories);
  app.use('/changelogs', routes.changelogs);
  app.use('/tasks', routes.tasks);
  app.use('/costs', routes.costs);
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status('status' in err && err.status === 413 ? 413 : 500).send('リクエストを処理できませんでした');
  });
  app.use((_req, res) => { res.status(404).send('ページが見つかりません'); });
  return app;
}
