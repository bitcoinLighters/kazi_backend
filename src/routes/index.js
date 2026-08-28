import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from '../controllers/auth.controller.js';
import taskRoutes from '../controllers/task.controller.js';
import submissionRoutes from '../controllers/submission.controller.js';
import paymentRoutes from '../controllers/payment.controller.js';
import walletRoutes from '../controllers/wallet.controller.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/submissions', submissionRoutes);
router.use('/payments', paymentRoutes);
router.use('/wallet', walletRoutes);

export default router;
