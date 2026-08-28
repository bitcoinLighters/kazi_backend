import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import tasksRoutes from './tasks.routes.js';
import submissionsRoutes from './submissions.routes.js';
import walletRoutes from './wallet.routes.js';
import paymentsRoutes from './payments.routes.js';
import usersRoutes from './users.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/tasks', tasksRoutes);
router.use('/', submissionsRoutes);
router.use('/wallet', walletRoutes);
router.use('/users/me', usersRoutes);
router.use('/payments', paymentsRoutes);

export default router;
