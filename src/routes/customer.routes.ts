import { Router } from 'express';
import { createCustomer, getAllCustomers, getCustomerById, updateCustomer, searchCustomers } from '../controllers/customer.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, adminOnly, createCustomer);
router.get('/', protect, adminOnly, getAllCustomers);
router.get('/search', protect, adminOnly, searchCustomers);
router.get('/:id', protect, adminOnly, getCustomerById);
router.put('/:id', protect, adminOnly, updateCustomer);

export default router;
