import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getPaymentForUser } from '../services/payment.service.biz.js';
import { lnbitsPaymentService } from '../services/lnbits.service.js';

const router = Router();

router.use(authenticate);

router.get('/balance', requireRole('client'), async (_req, res, next) => {
  try {
    const balance = await lnbitsPaymentService.getBalance();
    res.json({ success: true, balance });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const payment = await getPaymentForUser(req.params.id, req.user);
    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
});

export default router;
