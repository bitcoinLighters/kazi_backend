import { Router } from 'express';
import { authenticate, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, allowRoles('client'));
router.post('/submissions/:id/approve', (_req, res) => res.status(501).json({ success: false, message: 'Lightning payments will be implemented in the next phase' }));
router.get('/:id', (_req, res) => res.status(501).json({ success: false, message: 'Lightning payments will be implemented in the next phase' }));
export default router;

