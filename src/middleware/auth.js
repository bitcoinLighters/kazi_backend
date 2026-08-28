import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { store } from '../store/memory.store.js';
import { HttpError } from '../utils/http.js';

export function authenticate(req, _res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    if (!token) throw new HttpError(401, 'Authentication required');
    const payload = jwt.verify(token, env.jwtSecret);
    const user = store.users.get(payload.sub);
    if (!user) throw new HttpError(401, 'User no longer exists');
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Invalid or expired token'));
  }
}

export const allowRoles = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) return next(new HttpError(403, `Only ${roles.join(' or ')} users can perform this action`));
  next();
};

