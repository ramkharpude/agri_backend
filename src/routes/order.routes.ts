import { Router } from 'express';
import { createOrder, getUserOrders, getOrderById, getAllOrders, updateOrderStatus, getShopAnalytics } from '../controllers/order.controller';

const router = Router();

router.post('/', createOrder);
router.get('/user/:userId', getUserOrders); // Get all orders for a user
router.get('/all/orders', getAllOrders);
router.get('/analytics', getShopAnalytics); // [ADMIN] Analytics Endpoint
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus); // [ADMIN] Update Status

export default router;
