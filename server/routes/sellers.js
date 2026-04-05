import { Router } from 'express';
import {
  onboard,
  getSellerProfile,
  getDashboard,
  getSellerOrders,
} from '../controllers/sellerController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/onboard', authenticate, onboard);
router.get('/me/dashboard', authenticate, authorize('seller'), getDashboard);
router.get('/me/orders', authenticate, authorize('seller'), getSellerOrders);
router.get('/:id', getSellerProfile);

export default router;
