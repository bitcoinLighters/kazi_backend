import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getSubmissionForUser, requestChanges } from '../services/task.service.js';
import { approveSubmission } from '../services/payment.service.biz.js';

const router = Router();

router.use(authenticate);

router.get('/:id', async (req, res, next) => {
  try {
    const submission = await getSubmissionForUser(req.params.id, req.user);
    res.json({ success: true, submission });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/request-changes', requireRole('client'), async (req, res, next) => {
  try {
    const result = await requestChanges(req.params.id, req.userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/approve', requireRole('client'), async (req, res, next) => {
  try {
    const result = await approveSubmission(req.params.id, req.userId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
