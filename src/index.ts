import 'dotenv/config';
import { createApp } from './app';
import repositoryRoutes from './routes/repository.routes';
import changelogRoutes from './routes/changelog.routes';
import taskRoutes from './routes/task.routes';
import costRoutes from './routes/cost.routes';
import { handleWebhook } from './controllers/changelog.controller';

const app = createApp({ repositories: repositoryRoutes, changelogs: changelogRoutes,
  tasks: taskRoutes, costs: costRoutes, webhook: handleWebhook });
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });
export default app;
