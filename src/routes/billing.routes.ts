import { Router } from 'express';
import { createInvoice, getInvoiceById, getAllInvoices, getInvoicesByCustomer, getUserInvoices, cancelInvoice, createOnlineOrder, getPendingOnlineOrders, approveOnlineOrder } from '../controllers/billing.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

// Admin routes
router.post('/invoice', protect, adminOnly, createInvoice);
router.get('/invoices', protect, adminOnly, getAllInvoices);
router.get('/customer/:customerId', protect, adminOnly, getInvoicesByCustomer);
router.get('/invoice/:id', protect, getInvoiceById);
router.put('/invoice/:id/cancel', protect, adminOnly, cancelInvoice);

// User app route
router.get('/user-invoices', protect, getUserInvoices);
router.post('/online-order', protect, createOnlineOrder);

// Admin Online Order routes
router.get('/pending-online', protect, adminOnly, getPendingOnlineOrders);
router.put('/invoice/:id/approve-online', protect, adminOnly, approveOnlineOrder);

export default router;
