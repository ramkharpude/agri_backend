import { Router } from 'express';
import { getProductStockHistory, adjustStock } from '../controllers/stockMovement.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';
import { getCustomerLedger, getOutstandingSummary, getUserUdhari } from '../controllers/ledger.controller';

const router = Router();

// Stock movements
router.get('/product/:productId', protect, adminOnly, getProductStockHistory);
router.post('/adjust', protect, adminOnly, adjustStock);

// Ledger
router.get('/ledger/:customerId', protect, adminOnly, getCustomerLedger);
router.get('/outstanding', protect, adminOnly, getOutstandingSummary);

// User app route
router.get('/user-udhari', protect, getUserUdhari);

export default router;
