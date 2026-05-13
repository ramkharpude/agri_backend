import { Router } from 'express';
import { collectPayment, getPaymentsByCustomer, getPaymentReceipt, getUserPayments } from '../controllers/erpPayment.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

// Admin routes
router.post('/', protect, adminOnly, collectPayment);
router.get('/customer/:customerId', protect, adminOnly, getPaymentsByCustomer);
router.get('/receipt/:id', protect, getPaymentReceipt);

// User app route
router.get('/user-payments', protect, getUserPayments);

export default router;
