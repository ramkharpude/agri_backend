import { Router } from 'express';
import { getDailySales, getWeeklySales, getMonthlySales, getProductWiseSales, getCustomerWiseSales, getPendingUdhari, getStockValuation, getErpDashboardStats } from '../controllers/report.controller';
import { protect, adminOnly } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', protect, adminOnly, getErpDashboardStats);
router.get('/daily-sales', protect, adminOnly, getDailySales);
router.get('/weekly-sales', protect, adminOnly, getWeeklySales);
router.get('/monthly-sales', protect, adminOnly, getMonthlySales);
router.get('/product-sales', protect, adminOnly, getProductWiseSales);
router.get('/customer-sales', protect, adminOnly, getCustomerWiseSales);
router.get('/pending-udhari', protect, adminOnly, getPendingUdhari);
router.get('/stock-valuation', protect, adminOnly, getStockValuation);

export default router;
