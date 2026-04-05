import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProduct);

router.post(
  '/',
  authenticate,
  authorize('seller'),
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').isIn(['food', 'fashion', 'home', 'beauty', 'tech', 'other']),
    body('carbonFootprint').optional().isFloat({ min: 0 }),
    body('ecoScore').optional().isFloat({ min: 0, max: 100 }),
    body('stock').optional().isInt({ min: 0 }),
  ]),
  createProduct
);

router.put(
  '/:id',
  authenticate,
  authorize('seller'),
  validate([
    body('name').optional().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('category').optional().isIn(['food', 'fashion', 'home', 'beauty', 'tech', 'other']),
  ]),
  updateProduct
);

router.delete('/:id', authenticate, authorize('seller'), deleteProduct);

export default router;
