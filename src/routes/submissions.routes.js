import { Router } from 'express';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { newId, now, store } from '../store/memory.store.js';
import { HttpError, idParam, required } from '../utils/http.js';

const router = Router();
router.use(authenticate);

router.post('/tasks/:id/submissions', allowRoles('youth'), (req, res) => {
  const task = store.tasks.get(idParam(req));
  if (!task || task.youthId !== req.user.id) throw new HttpError(404, 'Accepted task not found');
  if (task.status !== 'in_progress') throw new HttpError(409, 'Task is not ready for submission');
  if (!req.body.description?.trim() && !req.body.fileUrl?.trim()) throw new HttpError(400, 'Provide a description or fileUrl');
  const submission = { id: newId(), taskId: task.id, youthId: req.user.id, description: req.body.description?.trim() || '', fileUrl: req.body.fileUrl?.trim() || null, status: 'reviewing', createdAt: now(), updatedAt: now() };
  store.submissions.set(submission.id, submission); task.status = 'reviewing'; task.updatedAt = now();
  res.status(201).json({ success: true, data: { submission } });
});

router.get('/submissions', allowRoles('client', 'youth'), (req, res) => {
  const submissions = [...store.submissions.values()].filter((submission) => {
    const task = store.tasks.get(submission.taskId);
    return req.user.role === 'youth' ? submission.youthId === req.user.id : task?.clientId === req.user.id;
  });
  res.json({ success: true, data: { submissions } });
});

router.get('/submissions/:id', (req, res) => {
  const submission = store.submissions.get(idParam(req));
  const task = submission && store.tasks.get(submission.taskId);
  if (!submission || (req.user.role === 'youth' && submission.youthId !== req.user.id) || (req.user.role === 'client' && task?.clientId !== req.user.id)) throw new HttpError(404, 'Submission not found');
  res.json({ success: true, data: { submission, task } });
});

router.post('/submissions/:id/request-changes', allowRoles('client'), (req, res) => {
  const submission = store.submissions.get(idParam(req)); const task = submission && store.tasks.get(submission.taskId);
  if (!submission || task?.clientId !== req.user.id) throw new HttpError(404, 'Submission not found');
  required(req.body, ['feedback']); submission.status = 'changes_requested'; submission.feedback = req.body.feedback; submission.updatedAt = now(); task.status = 'in_progress'; task.updatedAt = now();
  res.json({ success: true, data: { submission, task } });
});

export default router;
