import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  createTask,
  listTasks,
  listRecommendedTasks,
  listClientTasks,
  listYouthTasks,
  getTaskForUser,
  acceptTask,
  submitWork
} from '../services/task.service.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('youth'), async (req, res, next) => {
  try {
    const tasks = await listTasks({ category: req.query.category, status: req.query.status });
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
});

router.get('/client/mine', requireRole('client'), async (req, res, next) => {
  try {
    const tasks = await listClientTasks(req.userId);
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
});

router.get('/youth/mine', requireRole('youth'), async (req, res, next) => {
  try {
    const tasks = await listYouthTasks(req.userId);
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
});

router.get('/recommended', requireRole('youth'), async (req, res, next) => {
  try {
    const tasks = await listRecommendedTasks(req.userId, {
      category: req.query.category,
      status: req.query.status
    });
    res.json({ success: true, tasks });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const task = await getTaskForUser(req.params.id, req.user);
    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('client'), async (req, res, next) => {
  try {
    const { title, category, description, rewardSats, deadline, requiredSkills } = req.body;
    if (!title || !category || !description || rewardSats == null || !deadline) {
      throw ApiError.badRequest('title, category, description, rewardSats and deadline are required');
    }
    if (!Number.isInteger(Number(rewardSats)) || Number(rewardSats) <= 0) {
      throw ApiError.badRequest('rewardSats must be a positive integer');
    }
    if (Number.isNaN(Date.parse(deadline))) {
      throw ApiError.badRequest('deadline must be a valid date');
    }
    const invalidSkills =
      requiredSkills != null &&
      (!Array.isArray(requiredSkills) || !requiredSkills.every((s) => typeof s === 'string' && s.trim()));
    if (invalidSkills) {
      throw ApiError.badRequest('requiredSkills must be an array of non-empty strings');
    }
    const task = await createTask(req.userId, {
      title,
      category,
      description,
      rewardSats: Number(rewardSats),
      deadline,
      requiredSkills
    });
    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/accept', requireRole('youth'), async (req, res, next) => {
  try {
    const task = await acceptTask(req.params.id, req.userId);
    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/submissions', requireRole('youth'), async (req, res, next) => {
  try {
    const { text, fileUrl } = req.body;
    const submission = await submitWork(req.params.id, req.userId, { text, fileUrl });
    res.status(201).json({ success: true, submission });
  } catch (error) {
    next(error);
  }
});

export default router;
