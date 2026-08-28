import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);

// Feature routes will be added here as each hackathon slice is implemented.
// router.use('/auth', authRoutes);
// router.use('/tasks', taskRoutes);
// router.use('/submissions', submissionRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/wallet', walletRoutes);

export default router;

