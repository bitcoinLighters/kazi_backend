import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { findUserByEmail, newId, now, publicUser, store, userWallet } from '../store/memory.store.js';
import { HttpError, asyncHandler, required } from '../utils/http.js';

const router = Router();
const tokenFor = (user) => jwt.sign({ role: user.role, name: user.name }, env.jwtSecret, { subject: user.id, expiresIn: env.jwtExpiresIn });

router.post('/signup', asyncHandler(async (req, res) => {
  required(req.body, ['name', 'email', 'password', 'role']);
  const { name, email, password, role } = req.body;
  if (!['youth', 'client'].includes(role)) throw new HttpError(400, 'role must be youth or client');
  if (password.length < 6) throw new HttpError(400, 'password must be at least 6 characters');
  if (findUserByEmail(email)) throw new HttpError(409, 'Email is already registered');
  const user = { id: newId(), name: name.trim(), email: email.toLowerCase().trim(), role, passwordHash: await bcrypt.hash(password, 10), createdAt: now() };
  store.users.set(user.id, user);
  res.status(201).json({ success: true, data: { user: publicUser(user), token: tokenFor(user) } });
}));

router.post('/login', asyncHandler(async (req, res) => {
  required(req.body, ['email', 'password']);
  const user = findUserByEmail(req.body.email);
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw new HttpError(401, 'Invalid email or password');
  res.json({ success: true, data: { user: publicUser(user), token: tokenFor(user) } });
}));

import { authenticate } from '../middleware/auth.js';
router.get('/me', authenticate, (req, res) => res.json({ success: true, data: { user: publicUser(req.user), wallet: userWallet(req.user.id) } }));

export default router;
