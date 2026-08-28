import { Router } from 'express';
import { signup, login } from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password, role, skills } = req.body;
    if (!name || !email || !password || !role) {
      throw ApiError.badRequest('name, email, password and role are required');
    }
    if (!['youth', 'client'].includes(role)) {
      throw ApiError.badRequest('role must be "youth" or "client"');
    }
    if (password.length < 8) {
      throw ApiError.badRequest('password must be at least 8 characters');
    }
    if (role === 'youth') {
      if (!Array.isArray(skills) || skills.length === 0) {
        throw ApiError.badRequest('youth signup requires at least one skill');
      }
      if (!skills.every((s) => typeof s === 'string' && s.trim())) {
        throw ApiError.badRequest('skills must be an array of non-empty strings');
      }
    }
    const result = await signup({ name, email, password, role, skills });
    res.status(201).json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw ApiError.badRequest('email and password are required');
    const result = await login({ email, password });
    res.json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
});

export default router;
