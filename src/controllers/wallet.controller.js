import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getWallet, listEarnings } from '../services/payment.service.biz.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('youth'), async (req, res, next) => {
  try {
    const wallet = await getWallet(req.userId);
    res.json({ success: true, wallet });
  } catch (error) {
    next(error);
  }
});

router.get('/earnings', requireRole('youth'), async (req, res, next) => {
  try {
    const earnings = await listEarnings(req.userId);
    res.json({ success: true, earnings });
  } catch (error) {
    next(error);
  }
});

router.post('/withdraw', requireRole('youth'), (_req, res) => {
  res.status(501).json({
    success: false,
    message: 'Mobile-money withdrawal is a stretch feature and is not implemented yet'
  });
});

export default router;
