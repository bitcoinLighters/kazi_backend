import { Router } from 'express';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { newId, now, store } from '../store/memory.store.js';
import { HttpError, asyncHandler, idParam, required } from '../utils/http.js';

const router = Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const { status = 'open', category } = req.query;
  const tasks = [...store.tasks.values()].filter((task) => (status === 'all' || task.status === status) && (!category || task.category === category));
  res.json({ success: true, data: { tasks } });
});

router.post('/', allowRoles('client'), (req, res) => {
  required(req.body, ['title', 'category', 'description', 'rewardSats', 'deadline']);
  const rewardSats = Number(req.body.rewardSats);
  if (!Number.isInteger(rewardSats) || rewardSats <= 0) throw new HttpError(400, 'rewardSats must be a positive integer');
  const task = { id: newId(), clientId: req.user.id, title: req.body.title.trim(), category: req.body.category.trim(), description: req.body.description.trim(), rewardSats, deadline: req.body.deadline, status: 'open', youthId: null, createdAt: now(), updatedAt: now() };
  store.tasks.set(task.id, task);
  res.status(201).json({ success: true, data: { task } });
});

router.get('/client/mine', allowRoles('client'), (req, res) => res.json({ success: true, data: { tasks: [...store.tasks.values()].filter((task) => task.clientId === req.user.id) } }));
router.get('/youth/mine', allowRoles('youth'), (req, res) => res.json({ success: true, data: { tasks: [...store.tasks.values()].filter((task) => task.youthId === req.user.id) } }));

router.get('/:id', (req, res) => {
  const task = store.tasks.get(idParam(req));
  if (!task) throw new HttpError(404, 'Task not found');
  res.json({ success: true, data: { task } });
});

router.post('/:id/accept', allowRoles('youth'), (req, res) => {
  const task = store.tasks.get(idParam(req));
  if (!task) throw new HttpError(404, 'Task not found');
  if (task.status !== 'open') throw new HttpError(409, 'Task is no longer available');
  task.status = 'in_progress'; task.youthId = req.user.id; task.updatedAt = now();
  res.json({ success: true, data: { task } });
});

export default router;
