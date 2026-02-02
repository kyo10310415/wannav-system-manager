import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
import bodyParser from 'body-parser';

// Load environment variables
dotenv.config();

// Import routes
import repositoryRoutes from './routes/repository.routes';
import changelogRoutes from './routes/changelog.routes';
import taskRoutes from './routes/task.routes';
import costRoutes from './routes/cost.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Routes
app.get('/', (req, res) => {
  res.redirect('/repositories');
});

app.use('/repositories', repositoryRoutes);
app.use('/changelogs', changelogRoutes);
app.use('/tasks', taskRoutes);
app.use('/costs', costRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('サーバーエラーが発生しました');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('ページが見つかりません');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
