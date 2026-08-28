import { Router } from 'express';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { store } from '../store/memory.store.js';
import { HttpError, idParam } from '../utils/http.js';

const router = Router();
router.use(authenticate);
router.get('/:id', (req, res) => {
  const payment = store.payments.get(idParam(req));
  const task = payment && store.tasks.get(payment.taskId);
  if (!payment || (req.user.role === 'client' && task?.clientId !== req.user.id) || (req.user.role === 'youth' && payment.workerId !== req.user.id)) throw new HttpError(404, 'Payment not found');
  res.json({ success: true, data: { payment } });
});
export default router;
