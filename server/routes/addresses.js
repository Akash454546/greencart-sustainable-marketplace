import { Router } from 'express';
import { body } from 'express-validator';
import { getAddresses, addAddress, deleteAddress } from '../controllers/addressController.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

router.get('/', authenticate, getAddresses);

router.post(
  '/',
  authenticate,
  validate([
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('mobile').matches(/^\d{10}$/).withMessage('Mobile must be 10 digits'),
    body('pincode').matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
    body('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),
    body('addressType').optional().isIn(['home', 'work']),
  ]),
  addAddress
);

router.delete('/:addressId', authenticate, deleteAddress);

export default router;
