import { Router } from 'express';
import { body } from 'express-validator';
import { createOrder, getMyOrders, updateOrderStatus } from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post(
  '/',
  authenticate,
  validate([
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product').isMongoId().withMessage('Valid product ID required'),
    body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ]),
  createOrder
);

router.get('/me', authenticate, getMyOrders);

router.patch(
  '/:id/status',
  authenticate,
  authorize('seller'),
  validate([
    body('status').isIn(['confirmed', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  ]),
  updateOrderStatus
);

export default router;
