import express, { type Express } from 'express';
import { createTaskRouter } from './routes/tasks.js';
import { TaskStore } from './lib/store.js';

export function createApp(store: TaskStore = new TaskStore()): Express {
  const app = express();

  app.use(express.json({ limit: '100kb' }));

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/tasks', createTaskRouter(store));

  return app;
}
