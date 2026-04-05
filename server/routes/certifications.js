import { Router } from 'express';
import { body } from 'express-validator';
import {
  createCertification,
  getCertification,
  updateCertificationStatus,
} from '../controllers/certificationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('seller'),
  validate([
    body('name').trim().notEmpty().withMessage('Certificate name is required'),
    body('issuingBody').trim().notEmpty().withMessage('Issuing body is required'),
    body('issueDate').isISO8601().withMessage('Valid issue date is required'),
    body('expiryDate').optional().isISO8601(),
  ]),
  createCertification
);

router.get('/:id', getCertification);

router.patch(
  '/:id/status',
  authenticate,
  authorize('admin'),
  validate([body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')]),
  updateCertificationStatus
);

export default router;
