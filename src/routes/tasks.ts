import { Router } from 'express';
import { TaskStore } from '../lib/store.js';
import { validateTaskInput } from '../lib/validate.js';

export function createTaskRouter(store: TaskStore): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const owner = typeof req.query.owner === 'string' ? req.query.owner : undefined;
    res.json({ items: store.list(owner) });
  });

  router.get('/:id', (req, res) => {
    const task = store.get(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'ไม่พบงานที่ระบุ' });
      return;
    }
    res.json(task);
  });

  router.post('/', (req, res) => {
    const result = validateTaskInput(req.body);
    if (!result.ok || !result.value) {
      res.status(400).json({ errors: result.errors });
      return;
    }
    res.status(201).json(store.create(result.value));
  });

  router.post('/:id/complete', (req, res) => {
    const task = store.complete(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'ไม่พบงานที่ระบุ' });
      return;
    }
    res.json(task);
  });

  return router;
}
