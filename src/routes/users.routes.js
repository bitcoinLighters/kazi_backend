import { Router } from 'express';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { userWallet } from '../store/memory.store.js';

const router = Router();
router.use(authenticate, allowRoles('youth'));
router.get('/balance', (req, res) => res.json({ success: true, data: { balanceSats: userWallet(req.user.id).balanceSats, source: 'kazi_application_ledger' } }));
router.get('/earnings', (req, res) => res.json({ success: true, data: { entries: userWallet(req.user.id).entries.filter((entry) => entry.type === 'earning'), source: 'kazi_application_ledger' } }));
export default router;

