import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refreshToken } from '../controllers/authController.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post(
  '/register',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['buyer', 'seller']),
  ]),
  register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

router.post(
  '/refresh-token',
  validate([body('refreshToken').notEmpty().withMessage('Refresh token is required')]),
  refreshToken
);

export default router;
