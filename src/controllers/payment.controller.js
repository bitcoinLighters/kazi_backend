import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getPaymentForUser } from '../services/payment.service.biz.js';

const router = Router();

router.use(authenticate);

router.get('/:id', async (req, res, next) => {
  try {
    const payment = await getPaymentForUser(req.params.id, req.user);
    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
});

export default router;
