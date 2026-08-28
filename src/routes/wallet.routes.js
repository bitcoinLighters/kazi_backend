import { Router } from 'express';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { userWallet } from '../store/memory.store.js';

const router = Router();
router.use(authenticate, allowRoles('youth'));
router.get('/', (req, res) => res.json({ success: true, data: userWallet(req.user.id) }));
router.get('/earnings', (req, res) => res.json({ success: true, data: { entries: userWallet(req.user.id).entries.filter((entry) => entry.type === 'earning') } }));
router.post('/withdraw', (_req, res) => res.status(501).json({ success: false, message: 'Mobile-money withdrawal is a stretch feature and is not implemented yet' }));
export default router;
